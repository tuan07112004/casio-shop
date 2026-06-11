const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

async function parseJson(res) {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.message || 'Yêu cầu thất bại.')
  }
  return data
}

export async function apiAdminFetchPromotions(token) {
  const res = await fetch(`${API}/api/admin/promotions`, {
    headers: authHeaders(token),
  })
  return parseJson(res)
}

export async function apiAdminFetchPromotion(token, id) {
  const res = await fetch(`${API}/api/admin/promotions/${id}`, {
    headers: authHeaders(token),
  })
  return parseJson(res)
}

export async function apiAdminCreatePromotion(token, payload) {
  const res = await fetch(`${API}/api/admin/promotions`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  })
  return parseJson(res)
}

export async function apiAdminUpdatePromotion(token, id, payload) {
  const res = await fetch(`${API}/api/admin/promotions/${id}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  })
  return parseJson(res)
}

export async function apiAdminDeletePromotion(token, id) {
  const res = await fetch(`${API}/api/admin/promotions/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  return parseJson(res)
}

export async function apiAdminSyncPromotionItems(token, id, items) {
  const res = await fetch(`${API}/api/admin/promotions/${id}/items`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify({ items }),
  })
  return parseJson(res)
}

export async function apiAdminBatchPromotionItems(token, id, payload) {
  const res = await fetch(`${API}/api/admin/promotions/${id}/items/batch`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  })
  return parseJson(res)
}
