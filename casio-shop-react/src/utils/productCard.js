import { productImageSrc } from './format'
import { getMinSkuPrice } from './productVariants'

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

/** Sản phẩm có nhóm phân loại với tùy chọn đã nhập */
export function productHasVariants(product) {
  const groups = product?.variants?.groups
  if (!groups?.length) return false
  return groups.some((g) =>
    (g.options || []).some((o) => String(o.label || '').trim()),
  )
}

/** Giá gốc hiển thị trên danh sách — rẻ nhất trong các SKU phân loại */
export function getProductListPrice(product) {
  const min = getMinSkuPrice(product?.variants?.skus)
  if (min != null) return min
  return product?.price ?? 0
}

export function getProductPromotion(product) {
  if (!product?.promotion?.active) return null
  return product.promotion
}

export function applyPromotionToPrice(price, product) {
  const promo = getProductPromotion(product)
  if (!promo || !price) return price
  return Math.round((price * (100 - promo.discount_percent)) / 100)
}

/** Giá bán sau khuyến mãi (danh sách) */
export function getProductListSalePrice(product) {
  const listPrice = getProductListPrice(product)
  const promo = getProductPromotion(product)
  if (!promo) return listPrice
  if (
    promo.sale_price != null &&
    promo.compare_at_price != null &&
    listPrice === promo.compare_at_price
  ) {
    return promo.sale_price
  }
  return applyPromotionToPrice(listPrice, product)
}

export function getProductDiscountPercent(product) {
  const promo = getProductPromotion(product)
  return promo?.discount_percent ?? 0
}

/** Giá danh sách kèm tiền tố "từ" khi có phân loại */
export function formatProductListPrice(product, formatPrice) {
  const salePrice = getProductListSalePrice(product)
  const formatted = formatPrice(salePrice)
  return productHasVariants(product) ? `từ ${formatted}` : formatted
}

/** @deprecated Dùng getProductListPrice + getProductListSalePrice */
export function getOriginalPrice(price, product) {
  if (product?.promotion?.active) {
    return product.promotion.compare_at_price ?? price
  }
  return 0
}

/** @deprecated Dùng getProductDiscountPercent */
export function getDiscountPercent(salePrice, originalPrice, product) {
  if (product?.promotion?.active) {
    return product.promotion.discount_percent
  }
  if (originalPrice <= salePrice) return 0
  return Math.round((1 - salePrice / originalPrice) * 100)
}

const SWATCH = {
  den: { hex: '#3d3d3d', label: 'Đen' },
  trang: { hex: '#f2f2f2', label: 'Trắng' },
  xam: { hex: '#ddd8d0', label: 'Xám' },
  xamDam: { hex: '#6b6b6b', label: 'Xám đậm' },
  xanh: { hex: '#b8d4eb', label: 'Xanh' },
  xanhBien: { hex: '#c5e2f2', label: 'Xanh nước biển' },
  hong: { hex: '#e8c4cf', label: 'Hồng' },
}

export const ADMIN_COLOR_OPTIONS = [
  { key: 'den', ...SWATCH.den },
  { key: 'trang', ...SWATCH.trang },
  { key: 'xamDam', ...SWATCH.xamDam },
  { key: 'xam', ...SWATCH.xam },
  { key: 'xanhBien', ...SWATCH.xanhBien },
  { key: 'xanh', ...SWATCH.xanh },
  { key: 'hong', ...SWATCH.hong },
]

function findVariantGroup(product, keywords) {
  const groups = product?.variants?.groups
  if (!groups?.length) return null
  return groups.find((g) => {
    const name = String(g.name || '').toLowerCase()
    return keywords.some((k) => name.includes(k))
  })
}

function isMachineGroup(group) {
  const name = String(group?.name || '').toLowerCase()
  return (
    name.includes('loại máy') ||
    name.includes('loai may') ||
    name.includes('machine')
  )
}

function isConditionGroup(group) {
  const name = String(group?.name || '').toLowerCase()
  return (
    name.includes('độ mới') ||
    name.includes('do moi') ||
    name.includes('tình trạng')
  )
}

function isColorNamedGroup(group) {
  const name = String(group?.name || '').toLowerCase()
  return name.includes('màu') || name.includes('mau') || name.includes('color')
}

function getActiveVariantGroups(product) {
  return (product?.variants?.groups || []).filter((g) =>
    (g.options || []).some((o) => String(o.label || '').trim()),
  )
}

function swatchHexForOption(option) {
  if (option?.hex) return option.hex
  const label = String(option?.label || '').trim().toLowerCase()
  if (!label) return SWATCH.den.hex
  const exact = ADMIN_COLOR_OPTIONS.find(
    (o) => o.label.toLowerCase() === label,
  )
  if (exact) return exact.hex
  const byLength = [...ADMIN_COLOR_OPTIONS].sort(
    (a, b) => b.label.length - a.label.length,
  )
  const partial = byLength.find((o) => label.includes(o.label.toLowerCase()))
  return partial?.hex || SWATCH.den.hex
}

function getLabeledGroupOptions(group) {
  return (group?.options || []).filter((o) => String(o.label || '').trim())
}

function optionsToSwatches(options) {
  return getLabeledGroupOptions({ options }).map((o) => ({
    hex: swatchHexForOption(o),
    label: o.label,
  }))
}

/** Nhóm màu từ variants — dùng chung cho UI và tra kho */
export function getColorVariantGroup(product) {
  let group = findVariantGroup(product, ['màu', 'mau', 'color'])
  if (!group) {
    const active = getActiveVariantGroups(product)
    const colorLike = active.filter(
      (g) => !isMachineGroup(g) && !isConditionGroup(g),
    )
    if (colorLike.length === 1) group = colorLike[0]
  }
  return group
}

/** Tùy chọn màu có id — cùng thứ tự với lưới chọn màu trên trang chi tiết */
export function getColorVariantOptions(product) {
  const group = getColorVariantGroup(product)
  if (group) {
    const labeled = getLabeledGroupOptions(group)
    if (labeled.length) {
      return labeled.map((o) => ({
        id: o.id,
        label: o.label,
        hex: o.hex || swatchHexForOption(o),
      }))
    }
  }
  const hasVariantSkus = (product?.variants?.skus || []).some(
    (s) => (s.optionIds || []).length > 0,
  )
  if (!hasVariantSkus && product?.colors?.length) {
    return product.colors.map((c, i) => ({
      id: `legacy-color-${i}`,
      label: c.label,
      hex: c.hex || swatchHexForOption(c),
    }))
  }
  return null
}

/** Casio 580: nhóm "Loại máy" nhưng mỗi option là một màu */
function getMachineColorSwatches(product) {
  const machineGroup = findVariantGroup(product, [
    'loại máy',
    'loai may',
    'machine',
  ])
  if (!machineGroup?.options?.length) return null

  const swatches = optionsToSwatches(machineGroup.options)
  return swatches.length ? swatches : null
}

/** Nhóm phân loại 1 (vd: Xám, Hồng trên balo) khi không đặt tên "Màu" */
function getFallbackColorSwatches(product) {
  const active = getActiveVariantGroups(product)
  const colorLike = active.filter(
    (g) => !isMachineGroup(g) && !isConditionGroup(g),
  )

  if (colorLike.length !== 1) return null

  const opts = colorLike[0].options || []
  const labeled = opts.filter((o) => String(o.label || '').trim())
  if (!labeled.length) return null

  return optionsToSwatches(labeled)
}

export function getMachineTypeGroup(product) {
  const typeGroup = findVariantGroup(product, ['loại máy', 'loai may', 'machine'])
  if (typeGroup?.options?.length) {
    return {
      label: typeGroup.name || 'Loại máy',
      options: typeGroup.options.map((o) => ({
        id: o.id,
        label: o.label,
      })),
    }
  }
  return null
}

export function getColorSwatches(product) {
  const colorOptions = getColorVariantOptions(product)
  if (colorOptions?.length) {
    return colorOptions.map((o) => ({ hex: o.hex, label: o.label }))
  }

  const machineSwatches = getMachineColorSwatches(product)
  if (machineSwatches?.length) return machineSwatches

  return getFallbackColorSwatches(product)
}

export function getColorPreviewImages(product) {
  const machineGroup = findVariantGroup(product, ['loại máy', 'loai may', 'machine'])
  let colorGroup = findVariantGroup(product, ['màu', 'mau', 'color'])
  if (!colorGroup) {
    const active = getActiveVariantGroups(product).filter(
      (g) => !isMachineGroup(g) && !isConditionGroup(g),
    )
    if (active.length === 1) colorGroup = active[0]
  }
  const group = machineGroup || colorGroup
  const skus = product?.variants?.skus
  if (!group?.options?.length || !skus?.length) return null

  const images = group.options.map((opt) => {
    const sku =
      skus.find(
        (s) => s.optionIds?.length === 1 && s.optionIds[0] === opt.id,
      ) ||
      skus.find((s) => s.optionIds?.includes(opt.id) && s.image)
    if (sku?.image) return productImageSrc(sku.image)
    if (opt.image) return productImageSrc(opt.image)
    return null
  })

  return images.some(Boolean) ? images : null
}

export const PRODUCT_CONDITIONS = [
  { id: 'like-new', label: 'LIKE NEW' },
  { id: '85', label: '85%' },
  { id: '70', label: '70%' },
  { id: '55', label: '55%' },
]

const CONDITION_PRICE_KEYS = {
  'like-new': 'priceLikeNew',
  85: 'price85',
  70: 'price70',
  55: 'price55',
}

function hasLegacyConditionPrices(product) {
  return Boolean(
    product?.priceLikeNew ||
      product?.price85 ||
      product?.price70 ||
      product?.price55,
  )
}

export function getProductConditions(product) {
  const condGroup = findVariantGroup(product, ['độ mới', 'do moi', 'tình trạng'])
  if (condGroup?.options?.length) {
    return condGroup.options.map((o) => ({
      id: o.id,
      label: o.label,
    }))
  }
  if (hasLegacyConditionPrices(product)) {
    return PRODUCT_CONDITIONS.filter((c) => {
      const key = CONDITION_PRICE_KEYS[c.id]
      return product[key] != null
    })
  }
  return null
}

export function getConditionPrice(product, conditionId) {
  if (!product || !conditionId) return product?.price ?? 0

  const skus = product?.variants?.skus
  if (skus?.length) {
    const match = skus.find((sku) => sku.optionIds?.includes(conditionId))
    if (match?.price != null) return match.price
  }

  const dbKey = CONDITION_PRICE_KEYS[conditionId]
  if (dbKey && product[dbKey]) return product[dbKey]
  return product.price
}

export function getProductDescription(product) {
  if (product?.description?.trim()) return product.description.trim()
  const { name, category } = product
  if (category === 'may-tinh') {
    return `${name} chính hãng Casio, bảo hành 7 năm, đầy đủ tính năng thi đấu và học tập. Sản phẩm nguyên seal, kèm pin và hướng dẫn sử dụng tiếng Việt.`
  }
  if (category === 'balo') {
    return `${name} thiết kế gọn nhẹ, đựng vừa sách vở và máy tính Casio. Chất liệu bền, đường may chắc chắn, phù hợp mang đi học hằng ngày.`
  }
  return `${name} — phụ kiện chính hãng dùng kèm máy tính Casio, chất lượng ổn định, dễ sử dụng.`
}
