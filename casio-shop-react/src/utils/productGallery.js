import { productHoverImageSrc, productImageSrc } from './format'

const FX580_GALLERY_DIR = '/images/products/may-tinh/580-gallery'
const FX580_VIDEO = '/video/may-tinh/580vnx.mp4'

const FX580_SLIDE_FILES = [
  '01.jpg',
  '02.jpg',
  '03.jpg',
  '04.jpg',
  '05.jpg',
  '06.png',
  '07.png',
  '08.png',
  '09.png',
]

function gallerySlides(dir, files, altPrefix) {
  return files.map((file, i) => ({
    type: 'image',
    src: `${dir}/${file}`,
    alt: `${altPrefix} — mô tả ${i + 1}`,
  }))
}

function buildDetailGallery({ mainImage, mainAlt, slides, extras = [] }) {
  const slideItems = [
    { type: 'image', src: mainImage, alt: mainAlt },
    ...slides,
  ]
  const videos = extras.filter((item) => item.type === 'video')
  const extraImages = extras.filter((item) => item.type === 'image')
  return [...videos, ...slideItems, ...extraImages]
}

function sharedDescriptionSlides(altPrefix) {
  return gallerySlides(FX580_GALLERY_DIR, FX580_SLIDE_FILES, altPrefix)
}

function descriptionSlidesFromGallery(product) {
  const paths = product.galleryImages || []
  if (paths.length <= 2) return null

  return paths.slice(2).map((path, i) => ({
    type: 'image',
    src: productImageSrc(path),
    alt: `${product.name} — mô tả ${i + 1}`,
  }))
}

function calculatorDetailGallery(product) {
  const paths = product.galleryImages || []
  const mainImage = productImageSrc(
    paths[0] || product.galleryMainImage || product.hoverImage || product.image,
  )
  const videoSrc = product.galleryVideo || FX580_VIDEO
  const dbSlides = descriptionSlidesFromGallery(product)
  const slides = dbSlides?.length
    ? dbSlides
    : sharedDescriptionSlides(product.name)

  return buildDetailGallery({
    mainImage,
    mainAlt: product.name,
    slides,
    extras: [
      {
        type: 'video',
        src: videoSrc,
        poster: mainImage,
      },
    ],
  })
}

export function getProductGallery(product) {
  if (!product) return []

  if (product.category === 'may-tinh') {
    return calculatorDetailGallery(product)
  }

  const paths = product.galleryImages || []
  const extras = []

  if (product.galleryVideo) {
    extras.push({
      type: 'video',
      src: product.galleryVideo,
      poster: productImageSrc(
        paths[0] || product.galleryMainImage || product.hoverImage || product.image,
      ),
    })
  }

  if (paths.length) {
    const items = [...extras]
    paths.forEach((path, i) => {
      items.push({
        type: 'image',
        src: productImageSrc(path),
        alt: i < 2 ? product.name : `${product.name} — mô tả ${i - 1}`,
      })
    })
    return items
  }

  const main = {
    type: 'image',
    src: productImageSrc(product.image),
    alt: product.name,
  }
  const hoverSrc = product.hoverImage || productHoverImageSrc(product)
  const hover = hoverSrc
    ? { type: 'image', src: hoverSrc, alt: `${product.name} — góc khác` }
    : null

  const videos = extras.filter((item) => item.type === 'video')
  const items = [...videos, main]
  if (hover) items.push(hover)
  if (product.galleryMainImage && product.galleryMainImage !== product.image) {
    items.push({
      type: 'image',
      src: product.galleryMainImage,
      alt: `${product.name} — chi tiết`,
    })
  }

  return items
}
