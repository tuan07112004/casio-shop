const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export function mapApiUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
  }
}

async function parseAuthResponse(res) {
  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const msg =
      data.message ||
      (data.errors && Object.values(data.errors).flat().join(' ')) ||
      'Yêu cầu thất bại'

    throw new Error(msg)
  }

  return data
}

export async function apiRegister(payload) {
  const res = await fetch(`${API}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })

  return parseAuthResponse(res)
}

export async function apiLogin({ email, password }) {
  const res = await fetch(`${API}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  return parseAuthResponse(res)
}

export async function apiLogout(token) {
  const res = await fetch(`${API}/api/logout`, {
    method: 'POST',
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
  })

  return parseAuthResponse(res)
}

export async function apiMe(token) {
  const res = await fetch(`${API}/api/user`, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
  })

  const data = await parseAuthResponse(res)

  return mapApiUser(data.user)
}