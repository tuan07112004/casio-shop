import { mapApiProduct } from './client'

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

async function parseJson(res) {
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

function authHeaders(token, json = false) {
  const headers = { Accept: 'application/json', Authorization: `Bearer ${token}` }
  if (json) headers['Content-Type'] = 'application/json'
  return headers
}

export async function apiAdminUploadImage(token, file) {
  const body = new FormData()
  body.append('image', file)

  const res = await fetch(`${API}/api/products/upload-image`, {
    method: 'POST',
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    body,
  })

  const data = await parseJson(res)
  return data.path
}

export async function apiAdminCreateProduct(token, payload) {
  const res = await fetch(`${API}/api/products`, {
    method: 'POST',
    headers: authHeaders(token, true),
    body: JSON.stringify(payload),
  })
  const data = await parseJson(res)
  return mapApiProduct(data.product)
}

export async function apiAdminUpdateProduct(token, id, payload) {
  const res = await fetch(`${API}/api/products/${id}`, {
    method: 'PUT',
    headers: authHeaders(token, true),
    body: JSON.stringify(payload),
  })
  const data = await parseJson(res)
  return mapApiProduct(data.product)
}

export async function apiAdminDeleteProduct(token, id) {
  const res = await fetch(`${API}/api/products/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  return parseJson(res)
}
