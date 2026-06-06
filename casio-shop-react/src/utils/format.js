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



/** Map legacy flat /images/*.png paths to /images/sanpham/ */

export function productImageSrc(image) {

  if (!image) return ''

  if (image.startsWith('/images/sanpham/')) return image

  const legacy = image.match(/^\/images\/([^/]+\.(png|jpe?g|webp))$/i)

  if (legacy) return `/images/sanpham/${legacy[1]}`

  return image

}


