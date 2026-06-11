import { skuKey, getSkuDisplayLabel } from './productVariants'
import {
  getMachineTypeGroup,
  getColorVariantOptions,
  getProductConditions,
  getConditionPrice,
} from './productCard'
import { productImageSrc } from './format'

function findVariantGroup(product, keywords) {
  const groups = product?.variants?.groups
  if (!groups?.length) return null
  return groups.find((g) => {
    const name = String(g.name || '').toLowerCase()
    return keywords.some((k) => name.includes(k))
  })
}

function normalizeSkuStock(stock) {
  if (stock === '' || stock == null || stock === undefined) return null
  const n = Number(stock)
  return Number.isInteger(n) && n >= 0 ? n : null
}

function findSkuByColorIndex(product, variantIndex) {
  const skus = product?.variants?.skus
  if (!skus?.length) return null

  const colorOptions = getColorVariantOptions(product)
  const picked = colorOptions?.[variantIndex]
  if (!picked) return null

  if (picked.id && !String(picked.id).startsWith('legacy-color-')) {
    const byId = skus.find(
      (sku) =>
        skuKey(sku.optionIds || []) === skuKey([picked.id]),
    )
    if (byId) return byId
  }

  const singleSkus = skus.filter((s) => (s.optionIds?.length || 0) === 1)
  if (singleSkus[variantIndex]) return singleSkus[variantIndex]

  if (picked.label) {
    const groups = product?.variants?.groups || []
    return (
      singleSkus.find((sku) => {
        const label = getSkuDisplayLabel(groups, sku)
        return (
          label === picked.label ||
          label.toLowerCase() === String(picked.label).toLowerCase()
        )
      }) || null
    )
  }

  return null
}

function productHasPricedVariantSkus(product) {
  return (product?.variants?.skus || []).some(
    (s) => Number(s.price) >= 1000,
  )
}

export function collectOptionIds(product, variantIndex = 0, conditionIndex = 0) {
  const ids = []
  const machineTypes = getMachineTypeGroup(product)
  const colorOptions = getColorVariantOptions(product)
  const conditions = getProductConditions(product)

  if (machineTypes?.options?.[variantIndex]) {
    ids.push(machineTypes.options[variantIndex].id)
  } else if (colorOptions?.[variantIndex]?.id) {
    const colorId = colorOptions[variantIndex].id
    if (!String(colorId).startsWith('legacy-color-')) {
      ids.push(colorId)
    }
  }

  if (conditions?.[conditionIndex]) {
    ids.push(conditions[conditionIndex].id)
  }

  return ids
}

function productUsesMultiDimSkus(product) {
  return (product?.variants?.skus || []).some(
    (s) => (s.optionIds?.length || 0) > 1,
  )
}

export function findMatchingSku(product, optionIds = []) {
  const skus = product?.variants?.skus
  if (!skus?.length) return null

  const exact = skus.find(
    (sku) => skuKey(sku.optionIds || []) === skuKey(optionIds),
  )
  if (exact) return exact

  // Sản phẩm có SKU 2 chiều — bắt buộc khớp đúng tổ hợp, không fallback
  if (productUsesMultiDimSkus(product)) return null

  if (optionIds.length > 1) {
    const partial = skus.find((sku) => {
      const skuIds = sku.optionIds || []
      return optionIds.every((id) => skuIds.includes(id))
    })
    if (partial) return partial
  }

  for (const id of optionIds) {
    const single = skus.find(
      (sku) => sku.optionIds?.length === 1 && sku.optionIds[0] === id,
    )
    if (single) return single
  }

  return null
}

function findMatchingSkuForSelection(
  product,
  optionIds = [],
  variantIndex = 0,
) {
  const sku = findMatchingSku(product, optionIds)
  if (sku) return sku
  return findSkuByColorIndex(product, variantIndex)
}

function applyPromotionToLinePrice(basePrice, product) {
  const promo = product?.promotion
  if (!promo?.active || !basePrice) return basePrice
  return Math.round((basePrice * (100 - promo.discount_percent)) / 100)
}

export function resolveLineBasePrice(product, optionIds = []) {
  const sku = findMatchingSku(product, optionIds)
  if (sku?.price != null) return sku.price

  if (productUsesMultiDimSkus(product) && optionIds.length > 0) {
    return 0
  }

  for (const id of optionIds) {
    const price = getConditionPrice(product, id)
    if (price !== product?.price) return price
  }

  return product?.price ?? 0
}

export function resolveLinePrice(product, optionIds = []) {
  return applyPromotionToLinePrice(
    resolveLineBasePrice(product, optionIds),
    product,
  )
}

export function resolveLineStock(
  product,
  optionIds = [],
  variantIndex = 0,
) {
  const sku = findMatchingSkuForSelection(product, optionIds, variantIndex)
  if (sku) {
    const stock = normalizeSkuStock(sku.stock)
    if (stock != null) return stock
    if ((sku.optionIds || []).length > 0 || Number(sku.price) >= 1000) {
      return 0
    }
    return null
  }

  if (productUsesMultiDimSkus(product) && optionIds.length > 0) {
    return 0
  }

  const hasColorOptions = (getColorVariantOptions(product) || []).length > 0
  if (hasColorOptions && productHasPricedVariantSkus(product)) {
    return 0
  }

  const simpleSku = (product?.variants?.skus || []).find(
    (s) => !(s.optionIds || []).length,
  )
  if (simpleSku) {
    const stock = normalizeSkuStock(simpleSku.stock)
    if (stock != null) return stock
  }

  if (!(product?.variants?.skus || []).length) return null
  return null
}

export function resolveLineImage(product, optionIds = []) {
  const sku = findMatchingSku(product, optionIds)
  if (sku?.image) return productImageSrc(sku.image)
  return product?.image || ''
}

export function getVariantDisplayLabel(product, optionIds = []) {
  const groups = product?.variants?.groups
  if (groups?.length && optionIds.length) {
    const sku = { optionIds }
    const label = getSkuDisplayLabel(groups, sku)
    if (label) return label
  }

  const parts = []
  const machineTypes = getMachineTypeGroup(product)
  const colorOptions = getColorVariantOptions(product)
  const conditions = getProductConditions(product)

  for (const id of optionIds) {
    if (machineTypes?.options) {
      const opt = machineTypes.options.find((o) => o.id === id)
      if (opt) {
        parts.push(opt.label)
        continue
      }
    }
    if (colorOptions) {
      const opt = colorOptions.find((o) => o.id === id)
      if (opt) {
        parts.push(opt.label)
        continue
      }
    }
    if (conditions) {
      const opt = conditions.find((c) => c.id === id)
      if (opt) parts.push(opt.label)
    }
  }

  return parts.join(' / ')
}

export function buildCartLine(
  product,
  { quantity = 1, variantIndex = 0, conditionIndex = 0, optionIds } = {},
) {
  const resolvedOptionIds =
    optionIds ?? collectOptionIds(product, variantIndex, conditionIndex)
  const price = resolveLinePrice(product, resolvedOptionIds)
  const maxStock = resolveLineStock(
    product,
    resolvedOptionIds,
    variantIndex,
  )
  const variantLabel = getVariantDisplayLabel(product, resolvedOptionIds)
  const lineKey = `${product.id}:${skuKey(resolvedOptionIds)}`
  const image = resolveLineImage(product, resolvedOptionIds) || product.image

  return {
    lineKey,
    productId: product.id,
    slug: product.slug || String(product.id),
    name: product.name,
    price,
    image,
    quantity,
    optionIds: resolvedOptionIds,
    variantLabel,
    maxStock,
  }
}

export function normalizeCartItem(item) {
  const optionIds = Array.isArray(item.optionIds) ? item.optionIds : []
  const lineKey = item.lineKey || `${item.productId}:${skuKey(optionIds)}`
  return {
    lineKey,
    productId: item.productId,
    slug: item.slug || String(item.productId),
    name: item.name,
    price: item.price,
    image: item.image,
    quantity: item.quantity,
    optionIds,
    variantLabel: item.variantLabel || '',
    maxStock: item.maxStock ?? null,
  }
}

export function getStockInfo(product, variantIndex = 0, conditionIndex = 0) {
  const optionIds = collectOptionIds(product, variantIndex, conditionIndex)
  const stock = resolveLineStock(product, optionIds, variantIndex)

  if (stock == null) {
    return { label: 'Còn hàng', inStock: true, stock: null }
  }
  if (stock <= 0) {
    return { label: 'Hết hàng', inStock: false, stock: 0 }
  }
  return { label: `Còn ${stock} sản phẩm`, inStock: true, stock }
}

export function productDetailPath(productOrSlug) {
  if (typeof productOrSlug === 'object') {
    return `/san-pham/${productOrSlug.slug || productOrSlug.id}`
  }
  return `/san-pham/${productOrSlug}`
}
