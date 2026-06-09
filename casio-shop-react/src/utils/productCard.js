/** Thứ tự hiển thị máy tính: 580 → 880 → 570 */
const MAY_TINH_SORT = ['580', '880', '570']

export function sortMayTinh(products) {
  return [...products].sort((a, b) => {
    const rank = (name) => {
      const key = MAY_TINH_SORT.find((k) => name.includes(k))
      return key ? MAY_TINH_SORT.indexOf(key) : 999
    }
    return rank(a.name) - rank(b.name)
  })
}

export function getOriginalPrice(price) {
  return Math.ceil((price * 1.15) / 1000) * 1000
}

export function getDiscountPercent(salePrice, originalPrice) {
  if (originalPrice <= salePrice) return 0
  return Math.round((1 - salePrice / originalPrice) * 100)
}

const SWATCH = {
  den: { hex: '#3d3d3d', label: 'Đen' },
  xam: { hex: '#ddd8d0', label: 'Xám' },
  xanh: { hex: '#b8d4eb', label: 'Xanh' },
  xanhBien: { hex: '#c5e2f2', label: 'Xanh nước biển' },
  hong: { hex: '#e8c4cf', label: 'Hồng' },
}

const PRODUCT_COLOR_SWATCHES = {
  1: [SWATCH.den],
  2: [SWATCH.den, SWATCH.xanh, SWATCH.hong],
  3: [SWATCH.xam, SWATCH.hong, SWATCH.xanhBien, SWATCH.den],
  4: [SWATCH.den, SWATCH.xam],
  5: [SWATCH.hong],
  6: [SWATCH.den, SWATCH.xanh, SWATCH.hong],
  7: [SWATCH.den],
  8: [SWATCH.den],
  9: [SWATCH.den],
}

export const ADMIN_COLOR_OPTIONS = [
  { key: 'den', ...SWATCH.den },
  { key: 'xam', ...SWATCH.xam },
  { key: 'xanh', ...SWATCH.xanh },
  { key: 'xanhBien', ...SWATCH.xanhBien },
  { key: 'hong', ...SWATCH.hong },
]

export function getColorSwatches(product) {
  if (product?.colors?.length) return product.colors
  return PRODUCT_COLOR_SWATCHES[product.id] ?? null
}

/** FX-580: hover màu → ảnh preview (cùng thứ tự swatch: Đen, Xanh, Hồng) */
const FX580_COLOR_PREVIEW_IMAGES = [
  '/images/products/may-tinh/580-gallery/den.png',
  '/images/products/may-tinh/580-gallery/xanh.png',
  '/images/products/may-tinh/580-gallery/hong.png',
]

export function getColorPreviewImages(product) {
  if (product?.id === 2) return FX580_COLOR_PREVIEW_IMAGES
  return null
}

/** Độ mới — máy tính cũ Lytus */
export const PRODUCT_CONDITIONS = [
  { id: 'like-new', label: 'LIKE NEW' },
  { id: '85', label: '85%' },
  { id: '70', label: '70%' },
  { id: '55', label: '55%' },
]

/** Giá theo phân loại độ mới (VNĐ) — id 1: 570, 2: 580, 3: 880 */
const PRODUCT_CONDITION_PRICES = {
  1: {
    'like-new': 450000,
    85: 400000,
    70: 355000,
    55: 305000,
  },
  2: {
    'like-new': 520000,
    85: 465000,
    70: 415000,
    55: 355000,
  },
  3: {
    'like-new': 890000,
    85: 795000,
    70: 710000,
    55: 610000,
  },
}

export function getProductConditions(product) {
  if (product?.category === 'may-tinh') return PRODUCT_CONDITIONS
  return null
}

const CONDITION_PRICE_KEYS = {
  'like-new': 'priceLikeNew',
  85: 'price85',
  70: 'price70',
  55: 'price55',
}

export function getConditionPrice(product, conditionId) {
  if (!product || !conditionId) return product?.price ?? 0
  const dbKey = CONDITION_PRICE_KEYS[conditionId]
  if (dbKey && product[dbKey]) return product[dbKey]
  const tiers = PRODUCT_CONDITION_PRICES[product.id]
  if (!tiers) return product.price
  return tiers[conditionId] ?? product.price
}

/** Mô tả chi tiết theo id — bổ sung trong DB sau nếu cần */
export const PRODUCT_DESCRIPTIONS = {
  2: 'Casio fx-580VN X sở hữu màn hình LCD độ phân giải cao, hiển thị rõ nét và nhiều thông tin hơn. Máy có tốc độ xử lý nhanh, hiệu suất cao, phù hợp cho học sinh và sinh viên trong học tập và tính toán.',
}

export function getProductDescription(product) {
  if (product?.description?.trim()) return product.description.trim()
  if (PRODUCT_DESCRIPTIONS[product.id]) return PRODUCT_DESCRIPTIONS[product.id]
  const { name, category } = product
  if (category === 'may-tinh') {
    return `${name} chính hãng Casio, bảo hành 7 năm, đầy đủ tính năng thi đấu và học tập. Sản phẩm nguyên seal, kèm pin và hướng dẫn sử dụng tiếng Việt.`
  }
  if (category === 'balo') {
    return `${name} thiết kế gọn nhẹ, đựng vừa sách vở và máy tính Casio. Chất liệu bền, đường may chắc chắn, phù hợp mang đi học hằng ngày.`
  }
  return `${name} — phụ kiện chính hãng dùng kèm máy tính Casio, chất lượng ổn định, dễ sử dụng.`
}
