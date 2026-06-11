const SITE_ORIGIN =
  import.meta.env.VITE_SITE_URL ||
  (typeof window !== 'undefined' ? window.location.origin : '')

export function absoluteUrl(path = '/') {
  const base = SITE_ORIGIN.replace(/\/$/, '')
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
}

export function productJsonLd(product, salePrice) {
  if (!product) return null
  const slug = product.slug || product.id
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || product.name,
    image: product.image ? absoluteUrl(product.image) : undefined,
    sku: String(product.id),
    offers: {
      '@type': 'Offer',
      url: absoluteUrl(`/san-pham/${slug}`),
      priceCurrency: 'VND',
      price: salePrice ?? product.price,
      availability: 'https://schema.org/InStock',
    },
  }
}

export function breadcrumbJsonLd(items) {
  if (!items?.length) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url ? absoluteUrl(item.url) : undefined,
    })),
  }
}
