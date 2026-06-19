<template>
  <div class="cp-wrap">
    <div class="cp-card">
      <h1 class="cp-title">Set your password</h1>
      <p class="cp-sub">You need to set a new password before continuing.</p>

      <form @submit.prevent="submit" class="cp-form">
        <div class="field">
          <label>New password</label>
          <input v-model="password" type="password" placeholder="Min 8 characters" autocomplete="new-password" />
        </div>
        <div class="field">
          <label>Confirm password</label>
          <input v-model="confirm" type="password" placeholder="Repeat password" autocomplete="new-password" />
        </div>

        <p v-if="error" class="error">{{ error }}</p>

        <button type="submit" :disabled="loading" class="btn">
          {{ loading ? 'Saving...' : 'Set password' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
const password = ref('')
const confirm = ref('')
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  if (password.value.length < 8) { error.value = 'Password must be at least 8 characters'; return }
  if (password.value !== confirm.value) { error.value = 'Passwords do not match'; return }

  loading.value = true
  try {
    await $fetch('/api/auth/change-password', { method: 'POST', body: { password: password.value } })
    navigateTo('/dashboard')
  } catch (e: any) {
    error.value = e?.data?.message || 'Something went wrong'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.cp-wrap {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
}

.cp-card {
  background: #fff;
  border-radius: 16px;
  padding: 40px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 24px rgba(0,0,0,.08);
}

.cp-title {
  font-size: 22px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 8px;
}

.cp-sub {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 28px;
}

.cp-form { display: flex; flex-direction: column; gap: 16px; }

.field { display: flex; flex-direction: column; gap: 6px; }
.field label { font-size: 13px; font-weight: 600; color: #374151; }
.field input {
  padding: 10px 14px;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  font-size: 14px;
  outline: none;
  transition: border-color .15s;
}
.field input:focus { border-color: #4f46e5; }

.error {
  font-size: 13px;
  color: #ef4444;
}

.btn {
  padding: 11px;
  background: #4f46e5;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background .15s, opacity .15s;
}
.btn:hover:not(:disabled) { background: #4338ca; }
.btn:disabled { opacity: .5; cursor: default; }
</style>
