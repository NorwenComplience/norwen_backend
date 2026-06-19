<template>
  <div style="padding: 40px; font-family: sans-serif;">
    <h1>Dashboard</h1>
    <p>Welcome, {{ user?.name || user?.email }}</p>
    <p>Role: {{ user?.role }}</p>
    <button @click="logout">Logout</button>
  </div>
</template>

<script setup lang="ts">
const { data: user } = await useFetch('/api/auth/me')

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  navigateTo('/login')
}
</script>
