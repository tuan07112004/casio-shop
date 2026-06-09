import { useEffect } from 'react'
import { productHoverImageSrc, productImageSrc } from '../../utils/format'

export default function ProductCardVisual({ product, category, children }) {
  const mainSrc = productImageSrc(product.image)
  const hoverSrc = productHoverImageSrc(product)

  useEffect(() => {
    if (!hoverSrc) return
    const img = new Image()
    img.src = hoverSrc
  }, [hoverSrc])

  return (
    <div className={`product-showcase-visual product-showcase-visual--${category}`}>
      <div className="product-showcase-img-stack">
        <img
          className="product-showcase-img product-showcase-img--main"
          src={mainSrc}
          alt={product.name}
          loading="lazy"
        />
        {hoverSrc && (
          <img
            className="product-showcase-img product-showcase-img--hover"
            src={hoverSrc}
            alt=""
            aria-hidden
            loading="lazy"
          />
        )}
      </div>
      {children}
    </div>
  )
}
