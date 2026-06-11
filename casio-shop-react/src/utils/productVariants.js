const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

export function createVariantOption(label = '') {
  return { id: `o-${uid()}`, label, image: '' }
}

export function createVariantGroup(name = '') {
  return {
    id: `g-${uid()}`,
    name,
    options: [createVariantOption()],
  }
}

export function skuKey(optionIds = []) {
  return (optionIds || []).join('|')
}

/** Gộp SKU legacy (1 chiều) thành tổ hợp đủ nhóm phân loại */
export function normalizeLegacySkus(groups, skus = []) {
  const active = getActiveVariantGroups(groups)
  if (!active.length) return []

  const expectedLen = active.length
  const list = skus || []

  if (list.some((s) => (s.optionIds || []).length === expectedLen)) {
    return list
  }

  if (expectedLen !== 2 || !list.every((s) => (s.optionIds || []).length === 1)) {
    return list
  }

  const g0Opts = active[0].options.filter((o) => String(o.label || '').trim())
  const g1Opts = active[1].options.filter((o) => String(o.label || '').trim())
  const expanded = []

  for (const old of list) {
    const oid = old.optionIds[0]
    const inG0 = g0Opts.some((o) => o.id === oid)
    const inG1 = g1Opts.some((o) => o.id === oid)

    if (inG1 && !inG0) {
      const colors = g0Opts.length ? g0Opts : [{ id: oid }]
      for (const color of colors) {
        expanded.push({
          ...old,
          optionIds: [color.id, oid],
        })
      }
    } else if (inG0 && !inG1) {
      for (const cond of g1Opts) {
        expanded.push({
          ...old,
          optionIds: [oid, cond.id],
        })
      }
    }
  }

  return expanded.length ? expanded : list
}

export function generateSkus(groups, existingSkus = []) {
  const activeGroups = getActiveVariantGroups(groups)
  if (!activeGroups.length) return []

  const combos = activeGroups.reduce((acc, group) => {
    const opts = group.options.filter((o) => String(o.label || '').trim())
    if (!opts.length) return acc
    if (!acc.length) return opts.map((o) => [o.id])
    const next = []
    for (const combo of acc) {
      for (const opt of opts) {
        next.push([...combo, opt.id])
      }
    }
    return next
  }, [])

  const existingMap = new Map(
    (existingSkus || []).map((sku) => [skuKey(sku.optionIds || []), sku]),
  )

  const firstGroup = activeGroups[0]

  return combos.map((optionIds) => {
    const key = skuKey(optionIds)
    const prev = existingMap.get(key)
    const firstOpt = firstGroup?.options.find((o) => o.id === optionIds[0])
    const prevPrice = prev?.price
    const prevStock = prev?.stock
    return {
      optionIds,
      price:
        prevPrice != null && prevPrice !== '' && Number(prevPrice) > 0
          ? String(prevPrice)
          : '',
      stock:
        prevStock != null && prevStock !== '' ? String(prevStock) : '',
      image: prev?.image ?? firstOpt?.image ?? '',
    }
  })
}

export function setGroupOptionImage(groups, skus, groupIndex, optionId, image) {
  const newGroups = groups.map((g, gi) => {
    if (gi !== groupIndex) return g
    return {
      ...g,
      options: g.options.map((o) =>
        o.id === optionId ? { ...o, image } : o,
      ),
    }
  })

  const newSkus = skus.map((sku) => {
    if (groupIndex === 0 && sku.optionIds?.[0] === optionId) {
      return { ...sku, image }
    }
    return sku
  })

  return { groups: newGroups, skus: newSkus }
}

export function getSkuDisplayLabel(groups, sku) {
  const labels = (sku.optionIds || [])
    .map((optionId) => {
      for (const group of groups) {
        const opt = group.options.find((o) => o.id === optionId)
        if (opt) return opt.label.trim()
      }
      return ''
    })
    .filter(Boolean)
  return labels.join(' / ')
}

/** Nhóm phân loại có tên + ít nhất một tùy chọn đã nhập */
export function getActiveVariantGroups(groups) {
  return (groups || []).filter((g) => {
    const name = String(g.name || '').trim()
    if (!name) return false
    return (g.options || []).some((o) => String(o.label || '').trim())
  })
}

function ensureOptionId(option) {
  const id = option?.id
  if (typeof id === 'string' && id.trim()) return id.trim()
  if (typeof id === 'number' && Number.isFinite(id)) return String(id)
  return `o-${uid()}`
}

function ensureGroupId(group) {
  const id = group?.id
  if (typeof id === 'string' && id.trim()) return id.trim()
  return `g-${uid()}`
}

export function getSkuOptionLabel(groups, sku, groupIndex) {
  const active = getActiveVariantGroups(groups)
  const group = active[groupIndex]
  if (!group || !sku?.optionIds?.length) return ''
  const optionId = sku.optionIds[groupIndex]
  const opt = group.options.find((o) => o.id === optionId)
  return opt?.label?.trim() || ''
}

/** Hàng bảng SKU kiểu Shopee — cột 1 rowspan khi có 2 nhóm phân loại */
export function buildSkuTableRows(groups, variantSkus) {
  const active = getActiveVariantGroups(groups)
  const skus = (variantSkus || []).filter((s) => s.optionIds?.length)

  if (!active.length || !skus.length) return []

  if (active.length === 1) {
    return skus.map((sku) => {
      const optionId = sku.optionIds[0]
      const opt = active[0].options.find((o) => o.id === optionId)
      return {
        skuIndex: variantSkus.indexOf(sku),
        col0: {
          label: getSkuOptionLabel(groups, sku, 0),
          rowSpan: 1,
          show: true,
          image: sku.image || opt?.image || '',
          optionId,
        },
        col1: null,
      }
    })
  }

  const rows = []
  let i = 0

  while (i < skus.length) {
    const firstId = skus[i].optionIds[0]
    let span = 1
    while (
      i + span < skus.length &&
      skus[i + span].optionIds[0] === firstId
    ) {
      span += 1
    }

    const firstOpt = active[0].options.find((o) => o.id === firstId)

    for (let j = 0; j < span; j += 1) {
      const sku = skus[i + j]
      rows.push({
        skuIndex: variantSkus.indexOf(sku),
        col0: {
          label: getSkuOptionLabel(groups, sku, 0),
          rowSpan: span,
          show: j === 0,
          image: sku.image || firstOpt?.image || '',
          optionId: firstId,
        },
        col1: { label: getSkuOptionLabel(groups, sku, 1) },
      })
    }

    i += span
  }

  return rows
}

export function variantsFromLegacyProduct(product) {
  if (product?.variants?.groups?.length) {
    const skus = (product.variants.skus || []).map((sku) => ({
      optionIds: sku.optionIds || [],
      price: sku.price != null ? String(sku.price) : '',
      stock: sku.stock != null ? String(sku.stock) : '',
      image: sku.image || '',
    }))

    const optionImages = new Map()
    for (const sku of skus) {
      const optionId = sku.optionIds?.[0]
      if (optionId && sku.image && !optionImages.has(optionId)) {
        optionImages.set(optionId, sku.image)
      }
    }

    const groups = product.variants.groups.map((g) => ({
      id: ensureGroupId(g),
      name: g.name || '',
      options: (g.options || []).map((o) => ({
        id: ensureOptionId(o),
        label: o.label || '',
        hex: o.hex || '',
        image: o.image || optionImages.get(o.id) || '',
      })),
    }))

    const active = getActiveVariantGroups(groups)
    const expectedLen = active.length
    let seedSkus = skus

    if (expectedLen > 0) {
      const fullSkus = skus.filter(
        (s) => (s.optionIds?.length || 0) === expectedLen,
      )
      if (fullSkus.length) {
        seedSkus = fullSkus
      } else if (expectedLen === 1) {
        seedSkus = skus.filter((s) => (s.optionIds?.length || 0) === 1)
      } else {
        seedSkus = []
      }
    }

    return {
      groups,
      skus: generateSkus(groups, seedSkus).map((sku) => ({
        ...sku,
        price:
          sku.price != null && sku.price !== '' && Number(sku.price) > 0
            ? String(sku.price)
            : '',
        stock:
          sku.stock != null && sku.stock !== '' ? String(sku.stock) : '',
      })),
    }
  }

  const groups = []
  const skus = []

  if (product?.colors?.length) {
    const colorGroup = {
      id: 'g-colors',
      name: 'Màu sắc',
      options: product.colors.map((c, i) => ({
        id: `o-color-${i}`,
        label: c.label,
        hex: c.hex || '',
      })),
    }
    groups.push(colorGroup)
    const basePrice = product.price || ''
    colorGroup.options.forEach((opt) => {
      skus.push({
        optionIds: [opt.id],
        price: String(basePrice),
        stock: '',
        image: '',
      })
    })
  }

  const conditionLabels = [
    { label: 'LIKE NEW', key: 'priceLikeNew' },
    { label: '85%', key: 'price85' },
    { label: '70%', key: 'price70' },
    { label: '55%', key: 'price55' },
  ]

  const conditionOptions = conditionLabels
    .filter((c) => product?.[c.key])
    .map((c, i) => ({
      id: `o-cond-${i}`,
      label: c.label,
    }))

  if (conditionOptions.length) {
    const condGroup = {
      id: 'g-condition',
      name: 'Độ mới',
      options: conditionOptions,
    }
    groups.push(condGroup)
    conditionOptions.forEach((opt, i) => {
      const priceKey = conditionLabels.find((c) => c.label === opt.label)?.key
      skus.push({
        optionIds: [opt.id],
        price: String(product[priceKey] || product.price || ''),
        stock: '',
        image: '',
      })
    })
  }

  if (groups.length) {
    const normalized = normalizeLegacySkus(groups, skus)
    return {
      groups,
      skus: generateSkus(groups, normalized).map((sku) => ({
        ...sku,
        price: sku.price != null ? String(sku.price) : '',
        stock: sku.stock != null ? String(sku.stock) : '',
      })),
    }
  }

  return null
}

/** Mô tả ngắn cho preview: "1 Màu sắc × 4 Độ mới · 4 tổ hợp" */
export function getVariantPreviewText(groups, skus = []) {
  const active = getActiveVariantGroups(groups)
  if (!active.length) return { label: 'Không có phân loại', comboCount: 0 }

  const parts = active.map((g) => {
    const n = g.options.filter((o) => String(o.label || '').trim()).length
    const name = String(g.name || '').trim() || 'phân loại'
    return `${n} ${name}`
  })

  const comboCount = generateSkus(active, normalizeLegacySkus(active, skus)).length

  return {
    label: `${parts.join(' × ')} · ${comboCount} tổ hợp`,
    comboCount,
  }
}

export function getProductTotalStock(product) {
  const skus = product?.variants?.skus
  if (!Array.isArray(skus) || !skus.length) return null

  const stocks = skus
    .map((sku) => Number(sku.stock))
    .filter((n) => Number.isInteger(n) && n >= 0)

  if (!stocks.length) return null
  return stocks.reduce((sum, n) => sum + n, 0)
}

export function getMinSkuPrice(skus) {
  const prices = (skus || [])
    .map((sku) => Number(sku.price))
    .filter((p) => Number.isInteger(p) && p >= 1000)
  return prices.length ? Math.min(...prices) : null
}

export function buildVariantsPayload(variantState, basePrice, simpleStock = '') {
  if (!variantState?.groups?.length) {
    const price = Number(basePrice)
    if (!Number.isInteger(price) || price < 1000) return null

    const stock = simpleStock === '' ? null : Number(simpleStock)
    if (simpleStock === '') {
      return null
    }
    if (!Number.isInteger(stock) || stock < 0) return null

    return {
      groups: [],
      skus: [{ optionIds: [], price, stock }],
    }
  }

  const groups = getActiveVariantGroups(variantState.groups).map((g) => ({
    id: ensureGroupId(g),
    name: String(g.name || '').trim(),
    options: (g.options || [])
      .filter((o) => String(o.label || '').trim())
      .map((o) => ({
        id: ensureOptionId(o),
        label: String(o.label || '').trim(),
        ...(o.hex ? { hex: o.hex } : {}),
        ...(o.image ? { image: o.image } : {}),
      })),
  }))

  if (!groups.length) return null

  const validSkuKeys = new Set(
    generateSkus(groups, []).map((sku) => skuKey(sku.optionIds || [])),
  )

  const skus = (variantState.skus || [])
    .filter((sku) => validSkuKeys.has(skuKey(sku.optionIds || [])))
    .map((sku) => ({
      optionIds: sku.optionIds,
      price: Number(sku.price),
      stock:
        sku.stock === '' || sku.stock == null ? null : Number(sku.stock),
      image: sku.image || null,
    }))
    .filter(
      (sku) =>
        Number.isInteger(sku.price) &&
        sku.price >= 1000 &&
        (sku.stock == null ||
          (Number.isInteger(sku.stock) && sku.stock >= 0)),
    )

  return { groups, skus }
}

export function syncLegacyFieldsFromVariants(variants, category) {
  const colors = []
  const legacy = {
    price_like_new: null,
    price_85: null,
    price_70: null,
    price_55: null,
  }

  if (!variants?.groups?.length) {
    return { colors: null, ...legacy }
  }

  const activeGroups = variants.groups.filter((g) =>
    (g.options || []).some((o) => String(o.label || '').trim()),
  )

  const isMachine = (g) => {
    const n = String(g.name || '').toLowerCase()
    return n.includes('loại máy') || n.includes('loai may') || n.includes('machine')
  }
  const isCondition = (g) => {
    const n = String(g.name || '').toLowerCase()
    return n.includes('độ mới') || n.includes('do moi') || n.includes('tình trạng')
  }
  const isColorNamed = (g) => {
    const n = String(g.name || '').toLowerCase()
    return n.includes('màu') || n.includes('mau') || n.includes('color')
  }

  const pushColorOptions = (group) => {
    for (const opt of group.options || []) {
      if (!String(opt.label || '').trim()) continue
      colors.push({
        hex: opt.hex || '#cccccc',
        label: opt.label,
      })
    }
  }

  for (const group of variants.groups) {
    const name = group.name.toLowerCase()
    const isColorGroup = isColorNamed(group)
    const isConditionGroup = isCondition(group)

    if (isColorGroup) {
      pushColorOptions(group)
    }

    if (isConditionGroup && category === 'may-tinh') {
      const skuByOption = new Map()
      for (const sku of variants.skus || []) {
        if (sku.optionIds?.length === 1) {
          skuByOption.set(sku.optionIds[0], sku.price)
        }
      }
      for (const opt of group.options) {
        const price = skuByOption.get(opt.id)
        if (!price) continue
        if (opt.label === 'LIKE NEW') legacy.price_like_new = price
        if (opt.label === '85%') legacy.price_85 = price
        if (opt.label === '70%') legacy.price_70 = price
        if (opt.label === '55%') legacy.price_55 = price
      }
    }
  }

  if (!colors.length && !activeGroups.some(isMachine)) {
    const colorLike = activeGroups.filter((g) => !isMachine(g) && !isCondition(g))
    if (colorLike.length === 1) {
      const labeled = (colorLike[0].options || []).filter((o) =>
        String(o.label || '').trim(),
      )
      if (labeled.length >= 1) {
        pushColorOptions(colorLike[0])
      }
    }
  }

  return {
    colors: colors.length ? colors : null,
    ...legacy,
  }
}

export function resolveProductVariants(product) {
  const fromDb = variantsFromLegacyProduct(product)
  if (fromDb?.groups?.length) return fromDb
  return null
}

/** Bổ sung variants từ colors/legacy khi DB chưa có — dùng khi map API */
export function hydrateVariantsFromLegacy(product) {
  if (product?.variants?.groups?.length) {
    return product.variants
  }

  const legacy = variantsFromLegacyProduct(product)
  if (!legacy?.groups?.length) return product?.variants ?? null

  const skus = (legacy.skus || []).map((sku) => ({
    optionIds: sku.optionIds || [],
    price:
      sku.price != null && sku.price !== '' && Number(sku.price) >= 1000
        ? Number(sku.price)
        : product?.price ?? null,
    stock:
      sku.stock != null && sku.stock !== ''
        ? Number(sku.stock)
        : null,
    image: sku.image || null,
  }))

  return {
    groups: legacy.groups.map((g) => ({
      id: g.id,
      name: g.name,
      options: (g.options || []).map((o) => ({
        id: o.id,
        label: o.label,
        ...(o.hex ? { hex: o.hex } : {}),
        ...(o.image ? { image: o.image } : {}),
      })),
    })),
    skus,
  }
}
