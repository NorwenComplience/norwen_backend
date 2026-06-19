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

  const ollamaMessages = [...messages]

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
  let thinkDone = false

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
            const raw: string = data.message?.content ?? ''
            if (!raw) continue

            if (thinkDone) {
              // Thinking already stripped — stream directly
              fullResponse += raw
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content: raw })}\n\n`))
            } else {
              // Buffer until </think> appears (no opening tag — it's in the prompt template)
              thinkBuffer += raw
              const end = thinkBuffer.indexOf('</think>')
              if (end !== -1) {
                thinkDone = true
                const after = thinkBuffer.slice(end + 8).replace(/^\n+/, '')
                thinkBuffer = ''
                if (after) {
                  fullResponse += after
                  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content: after })}\n\n`))
                }
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
