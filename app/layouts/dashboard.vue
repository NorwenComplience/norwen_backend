<template>
  <div class="app">
    <aside class="sidebar">
      <div class="logo">norwen</div>

      <nav class="nav">
        <NuxtLink
          v-for="item in menuItems"
          :key="item.to"
          :to="item.to"
          class="nav-item"
          active-class="nav-item--active"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <div class="sidebar-footer">
        <div class="user-info">
          <div class="avatar">{{ initials }}</div>
          <div class="user-details">
            <p class="user-email">{{ user?.email }}</p>
            <p class="user-role">{{ user?.role }}</p>
          </div>
        </div>
        <button class="logout-btn" @click="logout">Sign out</button>
      </div>
    </aside>

    <main class="main">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const user = useState<any>('auth_user')

const allMenuItems = [
  { label: 'Dashboard', to: '/dashboard', icon: '⊞', roles: ['user', 'admin', 'superadmin'] },
  { label: 'AI Chat', to: '/chat', icon: '◎', roles: ['user', 'admin', 'superadmin'] },
  { label: 'Admin', to: '/admin', icon: '⚙', roles: ['admin', 'superadmin'] },
  { label: 'Audit Logs', to: '/audit', icon: '⊟', roles: ['admin', 'superadmin'] },
  { label: 'TBD', to: '/tbd', icon: '◈', roles: ['superadmin'] },
]

const menuItems = computed(() =>
  allMenuItems.filter(item => user.value && item.roles.includes(user.value.role))
)

const initials = computed(() => {
  const email = user.value?.email || ''
  return email.slice(0, 2).toUpperCase()
})

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  user.value = null
  navigateTo('/login')
}
</script>

<style scoped>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.app {
  display: flex;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #f5f6fa;
}

.sidebar {
  width: 240px;
  min-height: 100vh;
  background: #1a1a2e;
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
}

.logo {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.5px;
  padding: 0 12px;
  margin-bottom: 32px;
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  color: #9ca3af;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: background .15s, color .15s;
}

.nav-item:hover {
  background: rgba(255,255,255,.07);
  color: #fff;
}

.nav-item--active {
  background: rgba(79,70,229,.3);
  color: #fff;
}

.nav-icon {
  font-size: 18px;
  width: 20px;
  text-align: center;
}

.sidebar-footer {
  border-top: 1px solid rgba(255,255,255,.1);
  padding-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #4f46e5;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-details {
  overflow: hidden;
}

.user-email {
  font-size: 12px;
  color: #fff;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 11px;
  color: #6b7280;
  text-transform: capitalize;
}

.logout-btn {
  width: 100%;
  padding: 8px;
  background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 8px;
  color: #9ca3af;
  font-size: 13px;
  cursor: pointer;
  transition: background .15s, color .15s;
}

.logout-btn:hover {
  background: rgba(255,255,255,.12);
  color: #fff;
}

.main {
  margin-left: 240px;
  flex: 1;
  padding: 40px;
}
</style>
