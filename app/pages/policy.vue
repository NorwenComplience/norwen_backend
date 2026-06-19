<template>
  <div class="policy-wrap">
    <div class="policy-card">
      <div class="policy-header">
        <div class="logo">norwen</div>
        <h1 class="policy-title">AI Usage Policy</h1>
        <p class="policy-sub">Please read and accept the policy before using the AI assistant.</p>
      </div>

      <div class="policy-body">
        <h2>1. Purpose</h2>
        <p>This AI assistant is provided to support your organisation's EU AI Act compliance workflows. It is an internal tool and must not be used for personal, confidential, or legally binding purposes without human review.</p>

        <h2>2. Human oversight</h2>
        <p>All AI-generated outputs must be reviewed by a qualified person before being acted upon. The AI assistant does not replace professional legal, financial, or compliance advice.</p>

        <h2>3. Data handling</h2>
        <p>Conversations are logged for audit purposes in accordance with EU AI Act Article 12 (record-keeping obligations). Logs are stored on EU-based infrastructure and are accessible only to authorised personnel.</p>

        <h2>4. Prohibited use</h2>
        <p>You may not use this assistant to generate misleading content, circumvent compliance controls, process special-category personal data, or for any purpose prohibited under applicable law.</p>

        <h2>5. Accountability</h2>
        <p>By accepting this policy, you acknowledge that you are responsible for the appropriate use of AI-generated outputs within your role and organisation.</p>
      </div>

      <div class="policy-footer">
        <label class="checkbox-row">
          <input type="checkbox" v-model="agreed" />
          <span>I have read and agree to the AI Usage Policy</span>
        </label>
        <p v-if="error" class="error">{{ error }}</p>
        <button class="btn" :disabled="!agreed || loading" @click="accept">
          {{ loading ? 'Saving...' : 'Accept & Continue' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const agreed = ref(false)
const loading = ref(false)
const error = ref('')

async function accept() {
  loading.value = true
  error.value = ''
  try {
    await $fetch('/api/auth/sign-policy', { method: 'POST' })
    navigateTo('/chat')
  } catch (e: any) {
    error.value = e?.data?.message || 'Something went wrong'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.policy-wrap {
  min-height: 100vh;
  background: #f3f4f6;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 40px 16px;
}

.policy-card {
  background: #fff;
  border-radius: 16px;
  width: 100%;
  max-width: 640px;
  box-shadow: 0 4px 24px rgba(0,0,0,.08);
  overflow: hidden;
}

.policy-header {
  padding: 32px 40px 24px;
  border-bottom: 1px solid #f3f4f6;
}

.logo {
  font-size: 18px;
  font-weight: 800;
  color: #4f46e5;
  letter-spacing: -0.5px;
  margin-bottom: 16px;
}

.policy-title {
  font-size: 22px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 6px;
}

.policy-sub {
  font-size: 14px;
  color: #6b7280;
}

.policy-body {
  padding: 28px 40px;
  max-height: 360px;
  overflow-y: auto;
  border-bottom: 1px solid #f3f4f6;
}

.policy-body h2 {
  font-size: 14px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 20px 0 6px;
}

.policy-body h2:first-child { margin-top: 0; }

.policy-body p {
  font-size: 13px;
  color: #4b5563;
  line-height: 1.7;
}

.policy-footer {
  padding: 24px 40px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.checkbox-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  cursor: pointer;
  font-size: 13px;
  color: #374151;
  line-height: 1.5;
}

.checkbox-row input { margin-top: 2px; flex-shrink: 0; }

.error { font-size: 13px; color: #ef4444; }

.btn {
  padding: 11px 24px;
  background: #4f46e5;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background .15s, opacity .15s;
  align-self: flex-start;
}
.btn:hover:not(:disabled) { background: #4338ca; }
.btn:disabled { opacity: .5; cursor: default; }
</style>
