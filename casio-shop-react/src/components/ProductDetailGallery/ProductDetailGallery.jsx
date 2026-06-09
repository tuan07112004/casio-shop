import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './ProductDetailGallery.css'

const THUMB_SCROLL_STEP = 246

export default function ProductDetailGallery({
  items,
  productName,
  stageOverride = null,
}) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [brokenSrc, setBrokenSrc] = useState(() => new Set())
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const videoRef = useRef(null)
  const thumbsRef = useRef(null)

  useEffect(() => {
    setActiveIndex(0)
    setBrokenSrc(new Set())
  }, [items])

  const visibleItems = useMemo(
    () =>
      (items || []).filter(
        (item) => item.type === 'video' || !brokenSrc.has(item.src),
      ),
    [items, brokenSrc],
  )

  const markBroken = (src) => {
    setBrokenSrc((prev) => {
      if (prev.has(src)) return prev
      const next = new Set(prev)
      next.add(src)
      return next
    })
  }

  const updateScrollArrows = useCallback(() => {
    const el = thumbsRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    setCanScrollLeft(scrollLeft > 2)
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2)
  }, [])

  useEffect(() => {
    if (activeIndex >= visibleItems.length) {
      setActiveIndex(Math.max(0, visibleItems.length - 1))
    }
  }, [activeIndex, visibleItems.length])

  const active = visibleItems.length
    ? (visibleItems[activeIndex] ?? visibleItems[0])
    : null

  useEffect(() => {
    if ((stageOverride || active?.type !== 'video') && videoRef.current) {
      videoRef.current.pause()
    }
  }, [activeIndex, active?.type, stageOverride])

  useEffect(() => {
    updateScrollArrows()
    const el = thumbsRef.current
    if (!el) return undefined

    el.addEventListener('scroll', updateScrollArrows, { passive: true })
    const ro = new ResizeObserver(updateScrollArrows)
    ro.observe(el)

    return () => {
      el.removeEventListener('scroll', updateScrollArrows)
      ro.disconnect()
    }
  }, [visibleItems.length, updateScrollArrows])

  useEffect(() => {
    const el = thumbsRef.current
    if (!el) return
    const thumb = el.children[activeIndex]
    thumb?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest',
    })
  }, [activeIndex])

  const scrollThumbs = (dir) => {
    thumbsRef.current?.scrollBy({
      left: dir * THUMB_SCROLL_STEP,
      behavior: 'smooth',
    })
  }

  if (!visibleItems.length) return null

  const stageItem = stageOverride
    ? { type: 'image', src: stageOverride, alt: productName }
    : active

  const thumbPoster = (item) => {
    if (item.type === 'video') {
      return item.poster || visibleItems.find((i) => i.type === 'image')?.src
    }
    return item.src
  }

  return (
    <div className="product-detail-gallery">
      <div className="product-detail-stage">
        {stageItem.type === 'video' ? (
          <video
            ref={videoRef}
            key={stageItem.src}
            className="product-detail-stage-media product-detail-stage-video"
            src={stageItem.src}
            poster={stageItem.poster}
            controls
            playsInline
          >
            Trình duyệt không hỗ trợ video.
          </video>
        ) : (
          <img
            key={stageItem.src}
            src={stageItem.src}
            alt={stageItem.alt || productName}
            className="product-detail-stage-media"
            onError={() => markBroken(stageItem.src)}
          />
        )}
      </div>

      {visibleItems.length > 1 && (
        <div className="product-detail-thumbs-wrap">
          {canScrollLeft && (
            <button
              type="button"
              className="product-detail-thumbs-arrow product-detail-thumbs-arrow--prev"
              onClick={() => scrollThumbs(-1)}
              aria-label="Xem ảnh trước"
            >
              ‹
            </button>
          )}

          <div className="product-detail-thumbs" ref={thumbsRef}>
            {visibleItems.map((item, i) => (
              <div
                key={`${item.type}-${item.src}-${i}`}
                className={`product-detail-thumb${i === activeIndex ? ' product-detail-thumb--active' : ''}`}
                onMouseEnter={() => setActiveIndex(i)}
              >
                <img
                  src={thumbPoster(item)}
                  alt=""
                  onError={() => markBroken(item.src)}
                />
                {item.type === 'video' && (
                  <span className="product-detail-thumb-play" aria-hidden>
                    ▶
                  </span>
                )}
              </div>
            ))}
          </div>

          {canScrollRight && (
            <button
              type="button"
              className="product-detail-thumbs-arrow product-detail-thumbs-arrow--next"
              onClick={() => scrollThumbs(1)}
              aria-label="Xem ảnh sau"
            >
              ›
            </button>
          )}
        </div>
      )}
    </div>
  )
}
