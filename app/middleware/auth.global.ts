export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/login') return

  const user = useState<any>('auth_user')

  try {
    user.value = await $fetch('/api/auth/me')
  } catch {
    user.value = null
    return navigateTo('/login')
  }
})
