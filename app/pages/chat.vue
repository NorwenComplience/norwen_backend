<template>
  <div class="chat-wrapper">
    <div class="chat-messages" ref="messagesEl">
      <div v-if="messages.length === 0" class="chat-empty">
        <p class="empty-title">AI Assistant</p>
        <p class="empty-sub">Ask me anything about EU AI Act compliance</p>
      </div>

      <div
        v-for="(msg, i) in messages"
        :key="i"
        class="message"
        :class="msg.role === 'user' ? 'message--user' : 'message--assistant'"
      >
        <div class="message-bubble">
          <p>{{ msg.content }}</p>
        </div>
      </div>

      <div v-if="streaming" class="message message--assistant">
        <div class="message-bubble">
          <p>{{ streamingText }}<span class="cursor">▌</span></p>
        </div>
      </div>
    </div>

    <div class="chat-input-area">
      <div class="input-row">
        <textarea
          v-model="input"
          class="chat-input"
          placeholder="Type your message..."
          rows="1"
          @keydown.enter.exact.prevent="send"
          @input="autoResize"
          ref="inputEl"
        />
        <button class="send-btn" :disabled="!input.trim() || streaming" @click="send">
          <span v-if="streaming">...</span>
          <span v-else>↑</span>
        </button>
      </div>
      <p class="input-hint">Enter to send · Shift+Enter for new line</p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const STORAGE_KEY = 'chat_history'

const messages = useLocalStorage<{ role: string; content: string }[]>(STORAGE_KEY, [])
const input = ref('')
const streaming = ref(false)
const streamingText = ref('')
const messagesEl = ref<HTMLElement>()
const inputEl = ref<HTMLTextAreaElement>()

function autoResize(e: Event) {
  const el = e.target as HTMLTextAreaElement
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 160) + 'px'
}

function scrollBottom() {
  nextTick(() => {
    if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight
  })
}

async function send() {
  const text = input.value.trim()
  if (!text || streaming.value) return

  messages.value.push({ role: 'user', content: text })
  input.value = ''
  if (inputEl.value) inputEl.value.style.height = 'auto'
  scrollBottom()

  streaming.value = true
  streamingText.value = ''

  try {
    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: messages.value }),
    })

    const reader = response.body!.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter(l => l.startsWith('data: '))

      for (const line of lines) {
        const data = line.slice(6)
        if (data === '[DONE]') continue
        try {
          const parsed = JSON.parse(data)
          streamingText.value += parsed.content
          scrollBottom()
        } catch {}
      }
    }

    messages.value.push({ role: 'assistant', content: streamingText.value })
  } finally {
    streaming.value = false
    streamingText.value = ''
    scrollBottom()
  }
}
</script>

<style scoped>
.chat-wrapper {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 80px);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 16px;
}

.chat-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 8px;
}

.empty-title {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a2e;
}

.empty-sub {
  font-size: 14px;
  color: #6b7280;
}

.message {
  display: flex;
}

.message--user {
  justify-content: flex-end;
}

.message--assistant {
  justify-content: flex-start;
}

.message-bubble {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.message--user .message-bubble {
  background: #4f46e5;
  color: #fff;
  border-bottom-right-radius: 4px;
}

.message--assistant .message-bubble {
  background: #fff;
  color: #1a1a2e;
  border: 1px solid #e5e7eb;
  border-bottom-left-radius: 4px;
}

.cursor {
  animation: blink .7s steps(1) infinite;
}

@keyframes blink { 50% { opacity: 0; } }

.chat-input-area {
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.input-row {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.chat-input {
  flex: 1;
  padding: 12px 16px;
  border: 1.5px solid #e5e7eb;
  border-radius: 12px;
  font-size: 14px;
  font-family: inherit;
  resize: none;
  outline: none;
  line-height: 1.5;
  transition: border-color .15s;
  background: #fff;
}

.chat-input:focus {
  border-color: #4f46e5;
}

.send-btn {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: #4f46e5;
  color: #fff;
  border: none;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background .15s, opacity .15s;
}

.send-btn:hover:not(:disabled) { background: #4338ca; }
.send-btn:disabled { opacity: .5; cursor: default; }

.input-hint {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 6px;
  text-align: center;
}
</style>
