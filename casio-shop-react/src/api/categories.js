const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export async function fetchCategories() {
  const res = await fetch(`${API}/api/categories`)
  if (!res.ok) throw new Error('Không tải được danh mục')
  return res.json()
}

export async function apiAdminCreateCategory(token, { label, shop_label }) {
  const res = await fetch(`${API}/api/categories`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ label, shop_label }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.message || 'Không thêm được danh mục')
  }
  return data.category
}
