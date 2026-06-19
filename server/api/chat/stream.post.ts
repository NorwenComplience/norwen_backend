import { verifyToken } from '../../utils/jwt'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth_token')
  if (!token) throw createError({ statusCode: 401, message: 'Not authenticated' })

  try {
    verifyToken(token)
  } catch {
    throw createError({ statusCode: 401, message: 'Invalid token' })
  }

  const { messages } = await readBody(event)

  const response = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'qwen3:4b',
      messages,
      stream: true,
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

  return sendStream(event, new ReadableStream({
    async start(controller) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) { controller.close(); break }

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(l => l.trim())

        for (const line of lines) {
          try {
            const data = JSON.parse(line)
            if (data.message?.content) {
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content: data.message.content })}\n\n`))
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
