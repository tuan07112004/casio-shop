import { productImageSrc } from '../utils/format'

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'  // khai báo địa chỉ BE

// BE trả về dữ liệu 
export function mapApiProduct(row) {
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    image: productImageSrc(row.image),
    category: row.category,
  }
}

export async function fetchProducts() {
  const res = await fetch(`${API}/api/products`) // gọi API để lấy danh sách sản phẩm
  if (!res.ok) throw new Error('Không tải được danh sách sản phẩm')
  const data = await res.json()  // chuyển json thành object
  return data.map(mapApiProduct) // áp dụng hàm mapApiProduct cho mỗi sản phẩm
}

export async function fetchProduct(id) {
  const res = await fetch(`${API}/api/products/${id}`)
  if (!res.ok) throw new Error('Không tìm thấy sản phẩm')
  return mapApiProduct(await res.json())
}

const CATEGORY_KEYWORDS = {
  'may-tinh': 'máy tính casio',
  'phu-kien': 'phụ kiện',
  balo: 'balo',
}

/** Tìm theo tên + từ khóa danh mục; hỗ trợ nhiều từ */
export function filterProductsByQuery(products, rawQuery) {
  const q = String(rawQuery || '').trim().toLowerCase()
  if (!q) return products

  const terms = q.split(/\s+/).filter(Boolean)

  return products.filter((p) => {
    const haystack = `${p.name} ${CATEGORY_KEYWORDS[p.category] || p.category}`.toLowerCase()
    return terms.every((term) => haystack.includes(term))
  })
}
