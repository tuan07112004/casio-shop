const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

async function parseJson(res) {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.message || 'Yêu cầu thất bại')
  }
  return data
}

/** Voucher áp dụng được cho giỏ (shop + product) */
export async function apiFetchCheckoutVouchers(productIds) {
  const ids = [...new Set(productIds.filter(Boolean))]
  if (!ids.length) return []

  const qs = new URLSearchParams({ product_ids: ids.join(',') })
  const res = await fetch(`${API}/api/vouchers/checkout?${qs}`)
  if (!res.ok) return []
  return res.json()
}

/** Kiểm tra một hoặc nhiều mã giảm giá (tối đa 2) */
export async function apiValidateVouchers(
  codes,
  items,
  { shippingFee = 0, deliveryType = 'delivery' } = {},
) {
  const normalized = [...new Set(
    (Array.isArray(codes) ? codes : [codes])
      .map((code) => String(code || '').trim().toUpperCase())
      .filter(Boolean),
  )]

  const res = await fetch(`${API}/api/vouchers/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      codes: normalized,
      items,
      shipping_fee: shippingFee,
      delivery_type: deliveryType,
    }),
  })
  return parseJson(res)
}

/** @deprecated Dùng apiValidateVouchers */
export async function apiValidateVoucher(
  code,
  items,
  options = {},
) {
  return apiValidateVouchers([code], items, options)
}
