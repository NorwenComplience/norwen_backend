import { verifyToken } from '../../utils/jwt'
import { writeAuditLog } from '../../utils/s3'
import { randomUUID } from 'crypto'

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const SYSTEM_PROMPT = 'You are a helpful AI assistant for EU AI Act compliance. Answer in the language the user writes in. Be concise and practical.'

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

  const ollamaMessages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages,
  ]

  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'qwen3-nothink',
      messages: ollamaMessages,
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
            // Ignore thinking field entirely
            if (data.message?.thinking) continue

            const content = data.message?.content
            if (content) {
              thinkBuffer += content
              let visible = ''
              while (true) {
                if (inThink) {
                  const end = thinkBuffer.indexOf('</think>')
                  if (end === -1) break
                  thinkBuffer = thinkBuffer.slice(end + 8)
                  inThink = false
                } else {
                  const start = thinkBuffer.indexOf('<think>')
                  if (start === -1) { visible += thinkBuffer; thinkBuffer = ''; break }
                  visible += thinkBuffer.slice(0, start)
                  thinkBuffer = thinkBuffer.slice(start + 7)
                  inThink = true
                }
              }
              // Strip orphaned </think> that Ollama sends when thinking is in separate field
              visible = visible.replace(/<\/think>/g, '').trimStart()
              if (visible) {
                fullResponse += visible
                controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content: visible })}\n\n`))
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
