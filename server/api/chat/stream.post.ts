import { verifyToken } from '../../utils/jwt'
import { writeAuditLog } from '../../utils/s3'
import { randomUUID } from 'crypto'

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth_token')
  if (!token) throw createError({ statusCode: 401, message: 'Not authenticated' })

  let payload: any
  try {
    payload = verifyToken(token)
  } catch {
    throw createError({ statusCode: 401, message: 'Invalid token' })
  }

  const { messages } = await readBody(event)
  const clientDomain = event.context.clientDomain || 'demo'
  const userMessage = messages[messages.length - 1]?.content || ''

  const systemMessage = {
    role: 'system',
    content: 'You are a helpful AI assistant for EU AI Act compliance. Answer in the language the user writes in. Be concise and practical.',
  }

  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'qwen3-nothink',
      messages: [systemMessage, ...messages],
      stream: true,
      think: false,
    }),
  })

  if (!response.ok) {
    throw createError({ statusCode: 502, message: 'Ollama error' })
  }

  setResponseHeader(event, 'Content-Type', 'text/event-stream')
  setResponseHeader(event, 'Cache-Control', 'no-cache')
  setResponseHeader(event, 'Connection', 'keep-alive')

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let fullResponse = ''
  let thinkBuffer = ''
  let inThink = false

  function filterThinking(text: string): string {
    let result = ''
    let buf = thinkBuffer + text
    thinkBuffer = ''

    while (buf.length > 0) {
      if (inThink) {
        const end = buf.indexOf('</think>')
        if (end === -1) { thinkBuffer = buf; break }
        inThink = false
        buf = buf.slice(end + 8)
      } else {
        const start = buf.indexOf('<think>')
        if (start === -1) { result += buf; break }
        result += buf.slice(0, start)
        inThink = true
        buf = buf.slice(start + 7)
      }
    }
    return result
  }

  return sendStream(event, new ReadableStream({
    async start(controller) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          writeAuditLog(clientDomain, {
            event_id: randomUUID(),
            user_id: payload.userId,
            client_id: payload.clientId,
            action: 'chat',
            model: 'qwen3-nothink',
            input: userMessage,
            output: fullResponse,
          }).catch(console.error)

          controller.close()
          break
        }

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(l => l.trim())

        for (const line of lines) {
          try {
            const data = JSON.parse(line)
            if (data.message?.content) {
              const filtered = filterThinking(data.message.content)
              fullResponse += filtered
              if (filtered) {
                controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content: filtered })}\n\n`))
              }
            }
            if (data.done) {
              controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
            }
          } catch {}
        }
      }
    },
  }))
})
