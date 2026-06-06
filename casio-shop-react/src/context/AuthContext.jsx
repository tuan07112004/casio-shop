import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { apiLogin, apiLogout, apiMe, apiRegister, mapApiUser } from '../api/auth'

const AuthContext = createContext(null)

const TOKEN_KEY = 'casio-auth-token'
const USER_KEY = 'casio-auth-user'

function loadStored() {
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    const user = localStorage.getItem(USER_KEY)

    return {
      token: token || null,
      user: user ? mapApiUser(JSON.parse(user)) : null,
    }
  } catch {
    return { token: null, user: null }
  }
}

function persist(token, user) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)

  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
  else localStorage.removeItem(USER_KEY)
}

export function AuthProvider({ children }) {
  const stored = loadStored()

  const [token, setToken] = useState(stored.token)
  const [user, setUser] = useState(stored.user)
  const [booting, setBooting] = useState(true)

  useEffect(() => {
    const saved = loadStored()

    if (!saved.token) {
      setBooting(false)
      return
    }

    apiMe(saved.token)
      .then((u) => {
        setToken(saved.token)
        setUser(u)
        persist(saved.token, u)
      })
      .catch(() => {
        setToken(null)
        setUser(null)
        persist(null, null)
      })
      .finally(() => setBooting(false))
  }, [])

  const applySession = (data) => {
    const u = mapApiUser(data.user)
    setToken(data.token)
    setUser(u)
    persist(data.token, u)
    return u
  }

  const login = async (email, password) => {
    const data = await apiLogin({ email, password })
    return applySession(data)
  }

  const register = async (payload) => {
    const data = await apiRegister(payload)
    return applySession(data)
  }

  const logout = async () => {
    if (token) {
      try {
        await apiLogout(token)
      } catch {
        /* vẫn xóa local */
      }
    }
    setToken(null)
    setUser(null)
    persist(null, null)
  }

  const value = useMemo(
    () => ({
      user,
      token,
      booting,
      isLoggedIn: !!user && !!token,
      isAdmin: user?.role === 'admin',
      login,
      register,
      logout,
    }),
    [user, token, booting],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth phải nằm trong AuthProvider')
  return ctx
}