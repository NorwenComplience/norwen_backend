export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/login') return

  const user = useState<any>('auth_user')

  try {
    const headers = useRequestHeaders(['cookie'])
    user.value = await $fetch('/api/auth/me', { headers })
  } catch {
    user.value = null
    return navigateTo('/login')
  }

  if (user.value?.mustChangePassword && to.path !== '/change-password') {
    return navigateTo('/change-password')
  }
})
