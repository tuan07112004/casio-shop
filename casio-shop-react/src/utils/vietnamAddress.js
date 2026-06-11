const BASE = 'https://provinces.open-api.vn/api'

export async function fetchProvinces() {
  const res = await fetch(`${BASE}/p/`)
  if (!res.ok) throw new Error('Không tải được danh sách tỉnh/thành')
  return res.json()
}

export async function fetchDistricts(provinceCode) {
  if (!provinceCode) return []
  const res = await fetch(`${BASE}/p/${provinceCode}?depth=2`)
  if (!res.ok) throw new Error('Không tải được quận/huyện')
  const data = await res.json()
  return data.districts || []
}

export async function fetchWards(districtCode) {
  if (!districtCode) return []
  const res = await fetch(`${BASE}/d/${districtCode}?depth=2`)
  if (!res.ok) throw new Error('Không tải được phường/xã')
  const data = await res.json()
  return data.wards || []
}

/** Phí vận chuyển cố định khi giao tận nơi */
export const STANDARD_SHIPPING_FEE = 30000

export function formatFullAddress({
  street,
  wardName,
  districtName,
  provinceName,
}) {
  const parts = [street, wardName, districtName, provinceName].filter(Boolean)
  return parts.join(', ')
}
