/**
 * Danh mục sản phẩm — thêm mục mới tại đây (value = slug, không dấu).
 * Nhớ cập nhật backend/config/shop.php cho khớp.
 */
export const PRODUCT_CATEGORIES = [
  {
    value: 'may-tinh',
    label: 'Máy tính Casio',
    shopLabel: 'Máy tính',
    showcaseTitle: 'Máy tính',
    showcaseImage: '/images/categories/may-tinh.png',
  },
  {
    value: 'balo',
    label: 'Balo & Cặp',
    shopLabel: 'Balo',
    showcaseTitle: 'Balo thời trang',
    showcaseImage: '/images/categories/balo.png',
  },
  {
    value: 'phu-kien',
    label: 'Phụ kiện',
    shopLabel: 'Phụ kiện',
    showcaseTitle: 'Đô dùng học tập',
    showcaseImage: '/images/categories/phu-kien.png',
  },
  {
    value: 'but-ky',
    label: 'Bút ký',
    shopLabel: 'Bút ký',
  },
  {
    value: 'sach',
    label: 'Sách',
    shopLabel: 'Sách',
  },
]

/** Chỉ hiện trên trang chủ — mục 4, 5... chỉ có tab cửa hàng */
export const FEATURED_SHOWCASE_SLUGS = ['may-tinh', 'balo', 'phu-kien']

const DEFAULT_BY_SLUG = Object.fromEntries(
  PRODUCT_CATEGORIES.map((c) => [c.value, c]),
)

export function mapApiCategories(rows) {
  return rows.map((row) => {
    const preset = DEFAULT_BY_SLUG[row.slug]
    return {
      value: row.slug,
      label: row.label,
      shopLabel: row.shop_label || row.label,
      showcaseTitle: preset?.showcaseTitle || row.shop_label || row.label,
      showcaseImage: preset?.showcaseImage || null,
    }
  })
}

export function getCategoryValues(categories = PRODUCT_CATEGORIES) {
  return categories.map((c) => c.value)
}

export const CATEGORY_VALUES = getCategoryValues()

export const CATEGORY_ALIASES = {
  calculator: 'may-tinh',
  'may-tinh': 'may-tinh',
  accessory: 'phu-kien',
  'phu-kien': 'phu-kien',
  bag: 'balo',
  balo: 'balo',
  'but-ky': 'but-ky',
  butky: 'but-ky',
  sach: 'sach',
  book: 'sach',
  books: 'sach',
}

export const CATEGORY_SEARCH_KEYWORDS = {
  'may-tinh': 'máy tính casio',
  'phu-kien': 'phụ kiện',
  balo: 'balo cặp ba lô',
  'but-ky': 'bút ký',
  sach: 'sách',
}

export function normalizeCategoryKey(raw) {
  if (!raw) return ''
  return CATEGORY_ALIASES[raw.toLowerCase()] || raw
}

export function getCategoryLabel(
  value,
  fallback = 'Sản phẩm',
  categories = PRODUCT_CATEGORIES,
) {
  const key = normalizeCategoryKey(value)
  return (
    categories.find((c) => c.value === key)?.shopLabel ||
    categories.find((c) => c.value === key)?.label ||
    fallback
  )
}

export function getAdminCategoryLabel(value, categories = PRODUCT_CATEGORIES) {
  const key = normalizeCategoryKey(value)
  return categories.find((c) => c.value === key)?.label || 'Sản phẩm'
}

export function getShopSections(categories = PRODUCT_CATEGORIES) {
  return categories.map((c) => ({
    key: c.value,
    title: c.shopLabel,
  }))
}

export function getShopCategoryUrl(key) {
  return `/cua-hang?category=${encodeURIComponent(key)}`
}

/** Thẻ danh mục trên trang chủ — chỉ mục có showcaseImage */
export function getCategoryShowcaseItems(categories = PRODUCT_CATEGORIES) {
  return categories
    .filter(
      (c) =>
        c.showcaseImage && FEATURED_SHOWCASE_SLUGS.includes(c.value),
    )
    .map((c) => ({
    title: c.showcaseTitle || c.shopLabel,
    image: c.showcaseImage,
    to: getShopCategoryUrl(c.value),
  }))
}
