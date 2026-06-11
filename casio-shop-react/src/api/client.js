import { CATEGORY_SEARCH_KEYWORDS } from '../config/categories'
import { productImageSrc } from '../utils/format'
import { hydrateVariantsFromLegacy } from '../utils/productVariants'

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'  // khai báo địa chỉ BE

function parseVariants(raw) {
  if (!raw) return null
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  }
  return typeof raw === 'object' ? raw : null
}

function normalizeVariants(variants) {
  if (!variants) return null
  const skus = (variants.skus || []).map((sku) => ({
    ...sku,
    optionIds: Array.isArray(sku.optionIds) ? sku.optionIds : [],
    price: sku.price != null && sku.price !== '' ? Number(sku.price) : sku.price,
    stock:
      sku.stock != null && sku.stock !== ''
        ? Number(sku.stock)
        : null,
  }))
  return { ...variants, skus }
}

// BE trả về dữ liệu 
export function mapApiProduct(row) {
  const base = {
    id: row.id,
    slug: row.slug || String(row.id),
    name: row.name,
    price: row.price,
    image: productImageSrc(row.image),
    imagePath: row.image,
    category: row.category,
    description: row.description || '',
    hoverImage: row.hover_image ? productImageSrc(row.hover_image) : '',
    hoverImagePath: row.hover_image || '',
    priceLikeNew: row.price_like_new ?? null,
    price85: row.price_85 ?? null,
    price70: row.price_70 ?? null,
    price55: row.price_55 ?? null,
    colors: Array.isArray(row.colors) ? row.colors : null,
    variants: normalizeVariants(parseVariants(row.variants)),
    galleryMainImage: row.gallery_main_image
      ? productImageSrc(row.gallery_main_image)
      : '',
    galleryMainImagePath: row.gallery_main_image || '',
    galleryVideo: row.gallery_video || '',
    galleryImages: Array.isArray(row.gallery_images) ? row.gallery_images : null,
    promotion: row.promotion?.active ? row.promotion : null,
  }

  return {
    ...base,
    variants: normalizeVariants(hydrateVariantsFromLegacy(base)),
  }
}

export async function fetchProducts() {
  const res = await fetch(`${API}/api/products`) // gọi API để lấy danh sách sản phẩm
  if (!res.ok) throw new Error('Không tải được danh sách sản phẩm')
  const data = await res.json()  // chuyển json thành object
  return data.map(mapApiProduct) // áp dụng hàm mapApiProduct cho mỗi sản phẩm
}

export async function fetchShopVouchers(productId) {
  const qs = productId ? `?product_id=${encodeURIComponent(productId)}` : ''
  const res = await fetch(`${API}/api/vouchers${qs}`)
  if (!res.ok) return []
  return res.json()
}

export async function fetchProduct(idOrSlug) {
  const res = await fetch(`${API}/api/products/${encodeURIComponent(idOrSlug)}`)
  if (!res.ok) throw new Error('Không tìm thấy sản phẩm')
  return mapApiProduct(await res.json())
}

/** Bỏ dấu tiếng Việt để "ma" khớp "máy", "may tinh"... */
function normalizeSearchText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
}

/** Tìm theo tên, mô tả, danh mục; hỗ trợ nhiều từ, không phân biệt dấu */
export function filterProductsByQuery(products, rawQuery) {
  const q = normalizeSearchText(String(rawQuery || '').trim())
  if (!q) return products

  const terms = q.split(/\s+/).filter(Boolean)

  return products.filter((p) => {
    const haystack = normalizeSearchText(
      `${p.name} ${p.description || ''} ${CATEGORY_SEARCH_KEYWORDS[p.category] || p.category}`,
    )
    return terms.every((term) => haystack.includes(term))
  })
}
