import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './ProductDetailGallery.css'

const THUMB_SCROLL_STEP = 110
const ICON_ARROW_DOWN = '/images/icon/down-arrow.png'

export default function ProductDetailGallery({
  items,
  productName,
  stageOverride = null,
  onThumbSelect,
}) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [brokenSrc, setBrokenSrc] = useState(() => new Set())
  const [canScrollUp, setCanScrollUp] = useState(false)
  const [canScrollDown, setCanScrollDown] = useState(false)
  const videoRef = useRef(null)
  const thumbsRef = useRef(null)
  const shouldAutoplayVideo = useRef(false)

  useEffect(() => {
    setActiveIndex(0)
    setBrokenSrc(new Set())
    shouldAutoplayVideo.current = false
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
    const { scrollTop, scrollHeight, clientHeight } = el
    setCanScrollUp(scrollTop > 2)
    setCanScrollDown(scrollTop + clientHeight < scrollHeight - 2)
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
    if (stageOverride || active?.type !== 'video' || !shouldAutoplayVideo.current) {
      return
    }

    shouldAutoplayVideo.current = false
    const video = videoRef.current
    if (!video) return

    const playVideo = () => {
      video.play().catch(() => {})
    }

    if (video.readyState >= 2) {
      playVideo()
      return
    }

    video.addEventListener('loadeddata', playVideo, { once: true })
    return () => video.removeEventListener('loadeddata', playVideo)
  }, [activeIndex, active?.src, active?.type, stageOverride])

  const selectThumb = (index, isVideo) => {
    onThumbSelect?.()
    if (isVideo) {
      if (index === activeIndex && videoRef.current) {
        videoRef.current.play().catch(() => {})
        return
      }
      shouldAutoplayVideo.current = true
    }
    setActiveIndex(index)
  }

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
      top: dir * THUMB_SCROLL_STEP,
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

  const hasMultiple = visibleItems.length > 1

  return (
    <div className={`product-detail-gallery${hasMultiple ? '' : ' product-detail-gallery--single'}`}>
      {hasMultiple && (
        <div className="product-detail-thumbs-wrap">
          {canScrollUp && (
            <button
              type="button"
              className="product-detail-thumbs-arrow product-detail-thumbs-arrow--up"
              onClick={() => scrollThumbs(-1)}
              aria-label="Xem ảnh phía trên"
            >
              <img src={ICON_ARROW_DOWN} alt="" />
            </button>
          )}

          <div className="product-detail-thumbs" ref={thumbsRef}>
            {visibleItems.map((item, i) => (
              <div
                key={`${item.type}-${item.src}-${i}`}
                role="button"
                tabIndex={0}
                className={`product-detail-thumb${i === activeIndex ? ' product-detail-thumb--active' : ''}`}
                onMouseEnter={() => {
                  onThumbSelect?.()
                  setActiveIndex(i)
                }}
                onClick={() => selectThumb(i, item.type === 'video')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    selectThumb(i, item.type === 'video')
                  }
                }}
              >
                <img
                  src={thumbPoster(item)}
                  alt=""
                  loading="lazy"
                  decoding="async"
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

          {canScrollDown && (
            <button
              type="button"
              className="product-detail-thumbs-arrow product-detail-thumbs-arrow--down"
              onClick={() => scrollThumbs(1)}
              aria-label="Xem ảnh phía dưới"
            >
              <img src={ICON_ARROW_DOWN} alt="" />
            </button>
          )}
        </div>
      )}

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
            loading="eager"
            decoding="async"
            fetchPriority="high"
            onError={() => markBroken(stageItem.src)}
          />
        )}
      </div>
    </div>
  )
}
