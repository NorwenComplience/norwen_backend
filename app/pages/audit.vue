<template>
  <div class="audit-page">
    <h1 class="page-title">Audit Logs</h1>

    <div v-if="pending" class="state">Loading...</div>
    <div v-else-if="error" class="state error">Failed to load logs</div>
    <div v-else-if="!logs.length" class="state">No logs yet</div>

    <div v-else class="table-wrap">
      <table class="audit-table">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>User ID</th>
            <th>Model</th>
            <th>Output Hash</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in logs" :key="log.event_id">
            <td class="mono">{{ formatDate(log.timestamp) }}</td>
            <td class="mono">{{ log.user_id }}</td>
            <td>{{ log.model }}</td>
            <td class="mono hash">{{ log.output_hash }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const user = useState<any>('auth_user')
if (!['admin', 'superadmin'].includes(user.value?.role)) {
  navigateTo('/dashboard')
}

const { data: logs, pending, error } = await useFetch<any[]>('/api/audit/logs')

function formatDate(ts: string) {
  return new Date(ts).toLocaleString('nl-NL', {
    dateStyle: 'short',
    timeStyle: 'medium',
  })
}
</script>

<style scoped>
.audit-page {
  padding: 0 8px;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 24px;
}

.state {
  color: #6b7280;
  font-size: 14px;
  padding: 40px 0;
  text-align: center;
}

.state.error { color: #ef4444; }

.table-wrap {
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.audit-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.audit-table th {
  background: #f9fafb;
  color: #6b7280;
  font-weight: 600;
  text-align: left;
  padding: 10px 14px;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
}

.audit-table td {
  padding: 10px 14px;
  border-bottom: 1px solid #f3f4f6;
  color: #1a1a2e;
  vertical-align: middle;
}

.audit-table tr:last-child td { border-bottom: none; }
.audit-table tr:hover td { background: #f9fafb; }

.mono { font-family: monospace; }
.hash { color: #4f46e5; }
</style>
