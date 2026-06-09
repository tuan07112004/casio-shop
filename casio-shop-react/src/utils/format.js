/** Thông báo lỗi email — dùng chung form đăng ký / đăng nhập */

export const EMAIL_ERROR_MSG =

  'Email phải là @gmail.com, đuôi .vn (vd: ten@congty.vn) hoặc .com phổ biến (yahoo, outlook, hotmail...). Không dùng @gail.com, @g.com...'



const ALLOWED_COM_DOMAINS = new Set([

  'gmail.com',

  'yahoo.com',

  'outlook.com',

  'hotmail.com',

  'live.com',

  'icloud.com',

])



function hasValidDomainLabels(domain) {

  return domain.split('.').every((label) => label.length >= 2)

}



/**

 * Chỉ chấp nhận:

 * - *@gmail.com (và các .com phổ biến trong whitelist — chặn @gail.com)

 * - *@*....vn

 */

export function isValidEmail(email) {

  const trimmed = String(email).trim().toLowerCase()

  if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+$/.test(trimmed)) return false



  const domain = trimmed.split('@')[1]

  if (!domain || !hasValidDomainLabels(domain)) return false



  if (domain.endsWith('.vn')) return true

  if (ALLOWED_COM_DOMAINS.has(domain)) return true



  return false

}



export function formatPrice(vnd) {

  return new Intl.NumberFormat('vi-VN', {

    style: 'currency',

    currency: 'VND',

  }).format(vnd)

}



/** Đường dẫn ảnh sản phẩm mới: /images/products/{category}/{file} */

const LEGACY_SANPHAM_MAP = {
  '570vn.png': '/images/products/may-tinh/570vn.png',
  '580vnx.png': '/images/products/may-tinh/580vnx.png',
  '880btg.png': '/images/products/may-tinh/880btg.png',
  'balo.png': '/images/products/balo/balo.png',
  'baloc2.png': '/images/products/balo/baloc2.png',
  'cap.png': '/images/products/balo/cap.png',
  'baoda.png': '/images/products/phu-kien/baoda.png',
  'tovit.png': '/images/products/phu-kien/tovit.png',
  'cuongluc.png': '/images/products/phu-kien/cuongluc.png',
}

/** Chuẩn hóa đường dẫn ảnh (hỗ trợ legacy /images/sanpham/ và giỏ hàng cũ). */
export function productImageSrc(image) {
  if (!image) return ''

  if (image.startsWith('/images/products/')) return image

  const sanpham = image.match(/^\/images\/sanpham\/([^/]+)$/i)
  if (sanpham) {
    return LEGACY_SANPHAM_MAP[sanpham[1]] || `/images/products/_legacy/${sanpham[1]}`
  }

  const flat = image.match(/^\/images\/([^/]+\.(png|jpe?g|webp))$/i)
  if (flat && LEGACY_SANPHAM_MAP[flat[1]]) return LEGACY_SANPHAM_MAP[flat[1]]

  return image
}

/** Ảnh hover theo id sản phẩm (file đặt cùng thư mục category). */
const PRODUCT_HOVER_IMAGES = {
  1: '/images/products/may-tinh/570Hover.jpg',
  2: '/images/products/may-tinh/580Hover.jpg',
  3: '/images/products/may-tinh/880Hover.jpg',
  4: '/images/products/balo/baloHover.png',
  5: '/images/products/balo/baloc2Hover.png',
  6: '/images/products/phu-kien/baodaHover.png',
  7: '/images/products/balo/capHover.png',
  8: '/images/products/phu-kien/tovitHover.jpg',
  9: '/images/products/phu-kien/cuonglucHover.jpg',
}

export function productHoverImageSrc(productOrId) {
  if (typeof productOrId === 'object' && productOrId?.hoverImage) {
    return productOrId.hoverImage
  }
  const id =
    typeof productOrId === 'object' ? productOrId?.id : productOrId
  return PRODUCT_HOVER_IMAGES[id] ?? ''
}


