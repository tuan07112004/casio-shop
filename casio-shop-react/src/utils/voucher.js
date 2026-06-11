export const VOUCHER_TYPE_META = {
  shop: {
    title: 'Voucher toàn Shop',
    desc: 'Voucher áp dụng cho tất cả sản phẩm trong Shop của bạn.',
    badge: 'Toàn Shop',
    icon: '🏪',
  },
  product: {
    title: 'Voucher sản phẩm',
    desc: 'Voucher chỉ áp dụng cho những sản phẩm nhất định mà Shop chọn.',
    badge: 'Sản phẩm',
    icon: '🛍️',
  },
  free_ship: {
    title: 'Voucher Free Ship',
    desc: 'Miễn phí vận chuyển khi đơn hàng đạt giá trị tối thiểu bạn đặt.',
    badge: 'Free Ship',
    icon: '🚚',
  },
  private: {
    title: 'Voucher riêng tư',
    desc: 'Voucher áp dụng cho nhóm khách hàng Shop muốn thông qua mã Voucher.',
    badge: 'Riêng tư',
    icon: '🎫',
  },
}

export function formatVoucherOffer(voucher, formatPrice) {
  const min =
    voucher.min_order_value > 0
      ? ` · Đơn tối thiểu ${formatPrice(voucher.min_order_value)}`
      : ''

  if (
    voucher.voucher_type === 'free_ship' ||
    voucher.discount_type === 'free_shipping'
  ) {
    return `Miễn phí vận chuyển${min}`
  }

  if (voucher.discount_type === 'percent') {
    return `Giảm ${voucher.discount_value}%${min}`
  }

  return `Giảm ${formatPrice(voucher.discount_value)}${min}`
}

export function toDatetimeLocalValue(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function fromDatetimeLocalValue(value) {
  if (!value) return ''
  return new Date(value).toISOString()
}
