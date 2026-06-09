import { productHoverImageSrc, productImageSrc } from './format'

const FX580_GALLERY_DIR = '/images/products/may-tinh/580-gallery'
const FX580_VIDEO = '/video/may-tinh/580vnx.mp4'

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

/** 9 ảnh mô tả dùng chung cho máy tính */
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

function sharedDescriptionSlides(altPrefix) {
  return gallerySlides(FX580_GALLERY_DIR, FX580_SLIDE_FILES, altPrefix)
}

function calculatorDetailGallery({ mainImage, mainAlt, videoSrc }) {
  const video = videoSrc || FX580_VIDEO
  return buildDetailGallery({
    mainImage,
    mainAlt,
    slides: sharedDescriptionSlides(mainAlt),
    extras: [
      {
        type: 'video',
        src: video,
        poster: mainImage,
      },
    ],
  })
}

export function getProductGallery(product) {
  if (!product) return []

  if (product.category === 'may-tinh') {
    const mainImage =
      product.galleryMainImage || product.hoverImage || product.image
    return calculatorDetailGallery({
      mainImage,
      mainAlt: product.name,
      videoSrc: product.galleryVideo || FX580_VIDEO,
    })
  }

  const extras = []
  if (product.galleryVideo) {
    extras.push({
      type: 'video',
      src: product.galleryVideo,
      poster:
        product.galleryMainImage ||
        product.hoverImage ||
        product.image,
    })
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
  const extraImages = extras.filter((item) => item.type === 'image')

  const items = [...videos, main]
  if (hover) items.push(hover)
  if (product.galleryMainImage && product.galleryMainImage !== product.image) {
    items.push({
      type: 'image',
      src: product.galleryMainImage,
      alt: `${product.name} — chi tiết`,
    })
  }
  items.push(...extraImages)

  return items
}
