import { useEffect } from 'react'

const SITE_NAME = 'Casio Shop'
const DEFAULT_DESC =
  'Cửa hàng máy tính Casio chính hãng — FX-570, FX-580, FX-880 và phụ kiện. Giao hàng nhanh toàn quốc.'

function upsertMeta(attr, key, content) {
  if (!content) return
  let el = document.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertLink(rel, href) {
  if (!href) return
  let el = document.querySelector(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

function upsertJsonLd(id, data) {
  let el = document.getElementById(id)
  if (!data) {
    el?.remove()
    return
  }
  if (!el) {
    el = document.createElement('script')
    el.id = id
    el.type = 'application/ld+json'
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(
    Array.isArray(data) ? { '@context': 'https://schema.org', '@graph': data } : data,
  )
}

export default function PageMeta({
  title,
  description = DEFAULT_DESC,
  canonical,
  ogImage,
  ogType = 'website',
  jsonLd,
}) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME

  useEffect(() => {
    document.title = fullTitle
    upsertMeta('name', 'description', description)
    upsertMeta('property', 'og:title', fullTitle)
    upsertMeta('property', 'og:description', description)
    upsertMeta('property', 'og:type', ogType)
    upsertMeta('property', 'og:locale', 'vi_VN')
    if (ogImage) upsertMeta('property', 'og:image', ogImage)
    if (canonical) upsertLink('canonical', canonical)
    upsertJsonLd('page-jsonld', jsonLd)
  }, [fullTitle, description, canonical, ogImage, ogType, jsonLd])

  return null
}
