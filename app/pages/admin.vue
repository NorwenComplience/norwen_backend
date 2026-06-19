<template>
  <div class="admin-page">
    <h1 class="page-title">Admin</h1>

    <div class="section">
      <h2 class="section-title">Invite user</h2>
      <form @submit.prevent="invite" class="invite-form">
        <div class="fields">
          <div class="field">
            <label>Email</label>
            <input v-model="form.email" type="email" placeholder="user@company.com" />
          </div>
          <div class="field">
            <label>Name</label>
            <input v-model="form.name" type="text" placeholder="Full name (optional)" />
          </div>
          <div class="field">
            <label>Role</label>
            <select v-model="form.role">
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        <p v-if="error" class="msg error">{{ error }}</p>
        <p v-if="success" class="msg success">Invite sent to {{ success }}</p>
        <button type="submit" :disabled="loading" class="btn">
          {{ loading ? 'Sending...' : 'Send invite' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const user = useState<any>('auth_user')
if (!['admin', 'superadmin'].includes(user.value?.role)) navigateTo('/dashboard')

const form = reactive({ email: '', name: '', role: 'user' })
const loading = ref(false)
const error = ref('')
const success = ref('')

async function invite() {
  error.value = ''
  success.value = ''
  if (!form.email) { error.value = 'Email required'; return }

  loading.value = true
  try {
    await $fetch('/api/users/invite', { method: 'POST', body: { ...form } })
    success.value = form.email
    form.email = ''
    form.name = ''
    form.role = 'user'
  } catch (e: any) {
    error.value = e?.data?.message || 'Something went wrong'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.admin-page { padding: 0 8px; }
.page-title { font-size: 22px; font-weight: 700; color: #1a1a2e; margin-bottom: 24px; }

.section { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; max-width: 560px; }
.section-title { font-size: 16px; font-weight: 700; color: #1a1a2e; margin-bottom: 20px; }

.invite-form { display: flex; flex-direction: column; gap: 16px; }
.fields { display: flex; flex-direction: column; gap: 12px; }

.field { display: flex; flex-direction: column; gap: 5px; }
.field label { font-size: 13px; font-weight: 600; color: #374151; }
.field input, .field select {
  padding: 9px 12px;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color .15s;
  background: #fff;
}
.field input:focus, .field select:focus { border-color: #4f46e5; }

.msg { font-size: 13px; }
.error { color: #ef4444; }
.success { color: #10b981; }

.btn {
  padding: 10px;
  background: #4f46e5;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background .15s, opacity .15s;
  align-self: flex-start;
  min-width: 120px;
}
.btn:hover:not(:disabled) { background: #4338ca; }
.btn:disabled { opacity: .5; cursor: default; }
</style>
