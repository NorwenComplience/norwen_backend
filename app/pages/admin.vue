<template>
  <div>
    <h1 class="page-title">Admin</h1>
    <p class="page-sub">Coming soon</p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const { hasRole } = useAuth()
if (!hasRole('admin', 'superadmin')) navigateTo('/dashboard')
</script>

<style scoped>
.page-title { font-size: 24px; font-weight: 700; color: #1a1a2e; margin-bottom: 6px; }
.page-sub { font-size: 14px; color: #6b7280; }
</style>
