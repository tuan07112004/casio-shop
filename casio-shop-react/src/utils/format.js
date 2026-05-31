export function formatPrice(value) {
  return new Intl.NumberFormat('vi-VN').format(value) + 'đ'
}

export function getDiscountPercent(price, originalPrice) {
  if (!originalPrice || originalPrice <= price) return null
  return Math.round((1 - price / originalPrice) * 100)
}
