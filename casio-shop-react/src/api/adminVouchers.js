const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

async function parseJson(res) {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const fromErrors = data.errors
      ? Object.values(data.errors).flat().join(' ')
      : ''
    throw new Error(fromErrors || data.message || 'Yêu cầu thất bại')
  }
  return data
}

function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

export async function apiAdminFetchVouchers(token) {
  const res = await fetch(`${API}/api/admin/vouchers`, {
    headers: authHeaders(token),
  })
  return parseJson(res)
}

export async function apiAdminCreateVoucher(token, payload) {
  const res = await fetch(`${API}/api/admin/vouchers`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  })
  return parseJson(res)
}

export async function apiAdminUpdateVoucher(token, id, payload) {
  const res = await fetch(`${API}/api/admin/vouchers/${id}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  })
  return parseJson(res)
}

export async function apiAdminDeleteVoucher(token, id) {
  const res = await fetch(`${API}/api/admin/vouchers/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  return parseJson(res)
}
