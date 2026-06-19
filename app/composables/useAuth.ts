export const useAuth = () => {
  const user = useState<{ userId: string; email: string; role: string; clientId: string } | null>('auth_user', () => null)

  const fetchUser = async () => {
    try {
      user.value = await $fetch('/api/auth/me')
    } catch {
      user.value = null
    }
  }

  const logout = async () => {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
    navigateTo('/login')
  }

  const hasRole = (...roles: string[]) => {
    return user.value ? roles.includes(user.value.role) : false
  }

  return { user, fetchUser, logout, hasRole }
}
