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

export function mapApiOrder(row) {
  return {
    id: row.id,
    userId: row.user_id,
    guestName: row.guest_name,
    guestPhone: row.guest_phone,
    guestEmail: row.guest_email,
    guestAddress: row.guest_address,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    status: row.status,
    totalAmount: row.total_amount,
    voucherCode: row.voucher_code,
    discountAmount: row.discount_amount,
    shippingFee: row.shipping_fee,
    deliveryType: row.delivery_type,
    note: row.note,
    createdAt: row.created_at,
    items: (row.items || []).map((item) => ({
      id: item.id,
      productId: item.product_id,
      productName: item.product_name,
      price: item.price,
      quantity: item.quantity,
      lineTotal: item.line_total,
    })),
  }
}

/** Guest hoặc user — token tùy chọn */
export async function apiCreateOrder(payload, token = null) {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API}/api/orders`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })

  const data = await parseJson(res)
  return mapApiOrder(data.order)
}

/** User đăng nhập */
export async function apiFetchMyOrders(token) {
  const res = await fetch(`${API}/api/my-orders`, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
  })
  const data = await parseJson(res)
  return data.orders.map(mapApiOrder)
}

/** Admin — thống kê */
export async function apiFetchOrderStats(token) {
  const res = await fetch(`${API}/api/orders/stats`, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
  })
  const data = await parseJson(res)
  return data.stats
}

/** Admin */
export async function apiFetchOrders(token) {
  const res = await fetch(`${API}/api/orders`, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
  })
  const data = await parseJson(res)
  return data.orders.map(mapApiOrder)
}

export async function apiUpdateOrderStatus(token, orderId, status) {
  const res = await fetch(`${API}/api/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  })
  const data = await parseJson(res)
  return mapApiOrder(data.order)
}

/** Tra cứu theo SĐT — không cần token */
export async function apiLookupOrdersByPhone(phone) {
  const params = new URLSearchParams({ phone: phone.trim() })
  const res = await fetch(`${API}/api/orders/lookup?${params}`, {
    headers: { Accept: 'application/json' },
  })
  const data = await parseJson(res)
  return data.orders.map(mapApiOrder)
}

/** Admin — cập nhật trạng thái thanh toán */
export async function apiUpdatePaymentStatus(token, orderId, paymentStatus) {
  const res = await fetch(`${API}/api/orders/${orderId}/payment-status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ payment_status: paymentStatus }),
  })
  const data = await parseJson(res)
  return mapApiOrder(data.order)
}