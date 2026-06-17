export const useAuth = () => {
  const token    = useState<string|null>('token',    () => process.client ? localStorage.getItem('token') : null)
  const username = useState<string|null>('username', () => process.client ? localStorage.getItem('username') : null)
  const userId   = useState<string|null>('userId',   () => process.client ? localStorage.getItem('userId') : null)

  const save = (data: { token: string; username: string; userId: string }) => {
    token.value = data.token; username.value = data.username; userId.value = data.userId
    localStorage.setItem('token', data.token)
    localStorage.setItem('username', data.username)
    localStorage.setItem('userId', data.userId)
  }

  const logout = () => {
    token.value = null; username.value = null; userId.value = null
    localStorage.clear()
    navigateTo('/auth/login')
  }

  const headers = computed(() => token.value ? { authorization: `Bearer ${token.value}` } : {})

  return { token, username, userId, save, logout, headers }
}
