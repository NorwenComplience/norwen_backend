<template>
  <div>
    <h1 class="page-title">Dashboard</h1>
    <p class="page-sub">Welcome back, {{ user?.email }}</p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })
const user = useState<any>('auth_user')
</script>

<style scoped>
.page-title { font-size: 24px; font-weight: 700; color: #1a1a2e; margin-bottom: 6px; }
.page-sub { font-size: 14px; color: #6b7280; }
</style>
