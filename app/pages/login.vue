<template>
  <div class="login-wrapper">
    <div class="login-card">
      <div class="logo">
        <span class="logo-text">norwen</span>
      </div>

      <h1 class="title">Welcome back</h1>
      <p class="subtitle">Sign in to your account</p>

      <form class="form" @submit.prevent="handleLogin">
        <div class="field">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            placeholder="you@company.com"
            autocomplete="email"
            required
          />
        </div>

        <div class="field">
          <label for="password">
            Password
            <a href="#" class="forgot">Forgot password?</a>
          </label>
          <input
            id="password"
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="••••••••"
            autocomplete="current-password"
            required
          />
          <button type="button" class="toggle-pw" @click="showPassword = !showPassword">
            {{ showPassword ? 'Hide' : 'Show' }}
          </button>
        </div>

        <p v-if="error" class="error-msg">{{ error }}</p>

        <button type="submit" class="btn-primary" :disabled="loading">
          <span v-if="loading" class="spinner" />
          <span v-else>Sign in</span>
        </button>
      </form>

      <p class="signup-hint">
        Don't have an account?
        <a href="#">Request access</a>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
const form = reactive({ email: '', password: '' })
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  error.value = ''
  loading.value = true
  await new Promise(r => setTimeout(r, 800))
  loading.value = false
  // TODO: replace with real auth call
  if (form.email !== 'admin@norwen.eu') {
    error.value = 'Invalid email or password.'
  }
}
</script>

<style scoped>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.login-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f6fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.login-card {
  background: #fff;
  border-radius: 16px;
  padding: 48px 40px 40px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 4px 24px rgba(0,0,0,.08);
}

.logo {
  margin-bottom: 32px;
}

.logo-text {
  font-size: 22px;
  font-weight: 700;
  color: #1a1a2e;
  letter-spacing: -0.5px;
}

.title {
  font-size: 26px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 6px;
}

.subtitle {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 32px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.field {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.forgot {
  font-weight: 400;
  font-size: 13px;
  color: #4f46e5;
  text-decoration: none;
}
.forgot:hover { text-decoration: underline; }

input {
  width: 100%;
  padding: 11px 14px;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  font-size: 15px;
  color: #111827;
  outline: none;
  transition: border-color .15s;
  background: #fafafa;
}
input:focus {
  border-color: #4f46e5;
  background: #fff;
}
input::placeholder { color: #9ca3af; }

.toggle-pw {
  position: absolute;
  right: 14px;
  bottom: 11px;
  background: none;
  border: none;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
}
.toggle-pw:hover { color: #4f46e5; }

.error-msg {
  font-size: 13px;
  color: #ef4444;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 10px 14px;
}

.btn-primary {
  width: 100%;
  padding: 13px;
  background: #4f46e5;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background .15s, opacity .15s;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 48px;
}
.btn-primary:hover:not(:disabled) { background: #4338ca; }
.btn-primary:disabled { opacity: .6; cursor: default; }

.spinner {
  width: 18px;
  height: 18px;
  border: 2.5px solid rgba(255,255,255,.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.signup-hint {
  margin-top: 24px;
  text-align: center;
  font-size: 13px;
  color: #6b7280;
}
.signup-hint a {
  color: #4f46e5;
  font-weight: 600;
  text-decoration: none;
}
.signup-hint a:hover { text-decoration: underline; }
</style>
