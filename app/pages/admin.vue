<template>
  <div class="admin-page">
    <h1 class="page-title">Admin</h1>

    <div class="section">
      <div class="section-header">
        <h2 class="section-title">Users</h2>
        <button class="btn-sm" @click="showInvite = !showInvite">
          {{ showInvite ? 'Cancel' : '+ Invite user' }}
        </button>
      </div>

      <!-- Invite form -->
      <div v-if="showInvite" class="invite-form">
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
        <p v-if="inviteError" class="msg error">{{ inviteError }}</p>
        <p v-if="inviteSuccess" class="msg success">Invite sent to {{ inviteSuccess }}</p>
        <button class="btn" :disabled="inviteLoading" @click="invite">
          {{ inviteLoading ? 'Sending...' : 'Send invite' }}
        </button>
      </div>

      <!-- Edit modal -->
      <div v-if="editUser" class="modal-overlay" @click.self="editUser = null">
        <div class="modal">
          <h3 class="modal-title">Edit user</h3>
          <div class="field">
            <label>Name</label>
            <input v-model="editUser.name" type="text" />
          </div>
          <div class="field" style="margin-top:12px">
            <label>Role</label>
            <select v-model="editUser.role">
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <p v-if="editError" class="msg error" style="margin-top:10px">{{ editError }}</p>
          <div class="modal-actions">
            <button class="btn-ghost" @click="editUser = null">Cancel</button>
            <button class="btn" :disabled="editLoading" @click="saveEdit">
              {{ editLoading ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="table-wrap">
        <div v-if="pending" class="state">Loading...</div>
        <div v-else-if="!users?.length" class="state">No users yet</div>
        <table v-else class="user-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Policy</th>
              <th>Status</th>
              <th>Joined</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in users" :key="u.id">
              <td>{{ u.name || '—' }}</td>
              <td class="mono">{{ u.email }}</td>
              <td><span class="badge" :class="`badge--${u.role}`">{{ u.role }}</span></td>
              <td><span class="dot" :class="u.policySigned ? 'dot--green' : 'dot--red'">{{ u.policySigned ? 'Signed' : 'Pending' }}</span></td>
              <td><span class="dot" :class="u.mustChangePassword ? 'dot--red' : 'dot--green'">{{ u.mustChangePassword ? 'Must change pw' : 'Active' }}</span></td>
              <td class="mono">{{ formatDate(u.createdAt) }}</td>
              <td class="actions">
                <button class="action-btn" title="Edit" @click="startEdit(u)">✎</button>
                <button class="action-btn" title="Reset password" @click="resetPassword(u)">⟳</button>
                <button class="action-btn action-btn--danger" title="Delete" @click="deleteUser(u)">✕</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="toast" class="toast">{{ toast }}</div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const user = useState<any>('auth_user')
if (!['admin', 'superadmin'].includes(user.value?.role)) navigateTo('/dashboard')

const showInvite = ref(false)
const form = reactive({ email: '', name: '', role: 'user' })
const inviteLoading = ref(false)
const inviteError = ref('')
const inviteSuccess = ref('')

const editUser = ref<any>(null)
const editLoading = ref(false)
const editError = ref('')

const toast = ref('')

const { data: users, pending, refresh } = await useFetch<any[]>('/api/users/list')

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString('nl-NL')
}

function showToast(msg: string) {
  toast.value = msg
  setTimeout(() => toast.value = '', 3000)
}

async function invite() {
  inviteError.value = ''
  inviteSuccess.value = ''
  if (!form.email) { inviteError.value = 'Email required'; return }
  inviteLoading.value = true
  try {
    await $fetch('/api/users/invite', { method: 'POST', body: { ...form } })
    inviteSuccess.value = form.email
    form.email = ''; form.name = ''; form.role = 'user'
    showInvite.value = false
    refresh()
  } catch (e: any) {
    inviteError.value = e?.data?.message || 'Something went wrong'
  } finally {
    inviteLoading.value = false
  }
}

function startEdit(u: any) {
  editUser.value = { ...u }
  editError.value = ''
}

async function saveEdit() {
  editLoading.value = true
  editError.value = ''
  try {
    await $fetch(`/api/users/${editUser.value.id}`, {
      method: 'PATCH',
      body: { name: editUser.value.name, role: editUser.value.role },
    })
    editUser.value = null
    refresh()
    showToast('User updated')
  } catch (e: any) {
    editError.value = e?.data?.message || 'Something went wrong'
  } finally {
    editLoading.value = false
  }
}

async function resetPassword(u: any) {
  if (!confirm(`Reset password for ${u.email}?`)) return
  try {
    await $fetch(`/api/users/${u.id}/reset-password`, { method: 'POST' })
    refresh()
    showToast('Password reset email sent')
  } catch (e: any) {
    showToast('Error: ' + (e?.data?.message || 'Something went wrong'))
  }
}

async function deleteUser(u: any) {
  if (!confirm(`Delete ${u.email}?`)) return
  try {
    await $fetch(`/api/users/${u.id}`, { method: 'DELETE' })
    refresh()
    showToast('User deleted')
  } catch (e: any) {
    showToast('Error: ' + (e?.data?.message || 'Something went wrong'))
  }
}
</script>

<style scoped>
.admin-page { padding: 0 8px; }
.page-title { font-size: 22px; font-weight: 700; color: #1a1a2e; margin-bottom: 24px; }

.section { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #f3f4f6;
}
.section-title { font-size: 15px; font-weight: 700; color: #1a1a2e; }

.btn-sm {
  padding: 7px 14px;
  background: #4f46e5;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.btn-sm:hover { background: #4338ca; }

.invite-form {
  padding: 20px 24px;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: #f9fafb;
}
.fields { display: flex; gap: 12px; flex-wrap: wrap; }
.field { display: flex; flex-direction: column; gap: 5px; min-width: 180px; }
.field label { font-size: 12px; font-weight: 600; color: #6b7280; }
.field input, .field select {
  padding: 8px 12px;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  font-size: 13px;
  outline: none;
  background: #fff;
}
.field input:focus, .field select:focus { border-color: #4f46e5; }

.btn {
  padding: 8px 20px;
  background: #4f46e5;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  align-self: flex-start;
  transition: background .15s, opacity .15s;
}
.btn:hover:not(:disabled) { background: #4338ca; }
.btn:disabled { opacity: .5; cursor: default; }

.btn-ghost {
  padding: 8px 16px;
  background: none;
  color: #6b7280;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
}
.btn-ghost:hover { background: #f3f4f6; }

.msg { font-size: 13px; }
.error { color: #ef4444; }
.success { color: #10b981; }

.state { padding: 32px 24px; color: #9ca3af; font-size: 14px; text-align: center; }

.table-wrap { overflow-x: auto; }
.user-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.user-table th {
  background: #f9fafb;
  color: #6b7280;
  font-weight: 600;
  text-align: left;
  padding: 10px 16px;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
}
.user-table td { padding: 12px 16px; border-bottom: 1px solid #f3f4f6; color: #1a1a2e; }
.user-table tr:last-child td { border-bottom: none; }
.user-table tr:hover td { background: #f9fafb; }

.mono { font-family: monospace; font-size: 12px; }

.badge { padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; }
.badge--user { background: #e0e7ff; color: #4f46e5; }
.badge--admin { background: #fef3c7; color: #d97706; }
.badge--superadmin { background: #fee2e2; color: #dc2626; }

.dot { font-size: 12px; font-weight: 500; }
.dot--green { color: #10b981; }
.dot--red { color: #ef4444; }

.actions { white-space: nowrap; }
.action-btn {
  background: none;
  border: none;
  padding: 4px 6px;
  cursor: pointer;
  font-size: 14px;
  color: #6b7280;
  border-radius: 4px;
  transition: background .1s, color .1s;
}
.action-btn:hover { background: #f3f4f6; color: #1a1a2e; }
.action-btn--danger:hover { background: #fee2e2; color: #dc2626; }

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.modal {
  background: #fff;
  border-radius: 12px;
  padding: 28px;
  width: 360px;
  box-shadow: 0 8px 32px rgba(0,0,0,.15);
}
.modal-title { font-size: 16px; font-weight: 700; color: #1a1a2e; margin-bottom: 20px; }
.modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px; }

/* Toast */
.toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: #1a1a2e;
  color: #fff;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 13px;
  z-index: 200;
}
</style>
