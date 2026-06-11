import { mapApiProduct } from './client'

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

const VALIDATION_VI = {
  'gallery images': 'Hình ảnh sản phẩm (gallery)',
  'variants.groups': 'Nhóm phân loại',
  'variants.skus': 'Bảng giá phân loại',
}

function translateValidationMessage(text) {
  let msg = String(text)
  if (
    msg.includes('optionIds') &&
    (msg.includes('required') || msg.includes('bắt buộc'))
  ) {
    return 'Không lưu được sản phẩm. Nếu không dùng phân loại, chỉ cần nhập giá và kho hàng — thử lưu lại.'
  }
  if (msg.includes('gallery images') && msg.includes('more than')) {
    return 'Hình ảnh sản phẩm vượt giới hạn cho phép. Ảnh Loại máy trong bảng phân loại không tính vào gallery.'
  }
  for (const [key, label] of Object.entries(VALIDATION_VI)) {
    if (msg.toLowerCase().includes(key)) {
      msg = msg.replace(new RegExp(key, 'gi'), label)
    }
  }
  return msg
}

async function parseJson(res) {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const fromErrors = data.errors
      ? Object.values(data.errors)
          .flat()
          .map(translateValidationMessage)
          .join(' ')
      : ''
    const msg = translateValidationMessage(
      fromErrors || data.message || 'Yêu cầu thất bại',
    )
    throw new Error(msg)
  }
  return data
}

function authHeaders(token, json = false) {
  const headers = { Accept: 'application/json', Authorization: `Bearer ${token}` }
  if (json) headers['Content-Type'] = 'application/json'
  return headers
}

export async function apiAdminUploadImage(
  token,
  file,
  category = 'phu-kien',
  { productName = '', imageIndex = 0 } = {},
) {
  const body = new FormData()
  body.append('image', file)
  body.append('category', category)
  if (productName?.trim()) {
    body.append('product_name', productName.trim())
  }
  body.append('image_index', String(imageIndex))

  const res = await fetch(`${API}/api/products/upload-image`, {
    method: 'POST',
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    body,
  })

  const data = await parseJson(res)
  return data.path
}

export async function apiAdminUploadVideo(token, file, category = 'phu-kien') {
  const body = new FormData()
  body.append('video', file)
  body.append('category', category)

  const res = await fetch(`${API}/api/products/upload-video`, {
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
