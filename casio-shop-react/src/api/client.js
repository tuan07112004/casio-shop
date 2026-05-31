const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export function mapApiProduct(p) {
  if (!p) return null
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    originalPrice: p.original_price ?? p.originalPrice ?? null,
    image: p.image,
    category: p.category,
    stock: p.stock ?? null,
    description: p.description ?? null,
  }
}

export async function fetchProducts(category) {
  const url = category
    ? `${API}/api/products?category=${encodeURIComponent(category)}`
    : `${API}/api/products`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Lỗi tải sản phẩm')
  const data = await res.json()
  return data.map(mapApiProduct)
}

export async function fetchProductById(id) {
  const res = await fetch(`${API}/api/products/${encodeURIComponent(id)}`)
  if (!res.ok) throw new Error('Không tìm thấy')
  return mapApiProduct(await res.json())
}
