import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchProducts } from '../../api/client'
import { products as localProducts } from '../../data/products'
import HomeProductSection from '../HomeProductSection/HomeProductSection'
import './ProductShowcase.css'

const CALCULATOR_IDS = ['casio-580vnx', 'casio-880btg', 'casio-570vn-plus']
const ACCESSORY_IDS = ['tua-vit-pin', 'kinh-cuong-luc', 'bao-da']

const ACCESSORY_LABELS = {
  'tua-vit-pin': 'Tô vít',
  'kinh-cuong-luc': 'Kính cường lực',
  'bao-da': 'Bao da',
}

const BAG_IDS = ['balo-cap-1', 'balo-cap-2', 'balo-cap-3']

const BAG_LABELS = {
  'balo-cap-1': 'Cặp đa năng',
  'balo-cap-2': 'Ba lô thời trang',
  'balo-cap-3': 'Balo cấp 2',
}

function pickByIds(list, ids) {
  return ids
    .map((id) => list.find((p) => p.id === id))
    .filter(Boolean)
}

export default function ProductShowcase() {
  const [calculators, setCalculators] = useState(() =>
    pickByIds(localProducts, CALCULATOR_IDS),
  )
  const [accessories, setAccessories] = useState(() =>
    pickByIds(localProducts, ACCESSORY_IDS),
  )
  const [bags, setBags] = useState(() => pickByIds(localProducts, BAG_IDS))

  useEffect(() => {
    fetchProducts()
      .then((data) => {
        setCalculators(pickByIds(data, CALCULATOR_IDS))
        setAccessories(pickByIds(data, ACCESSORY_IDS))
        setBags(pickByIds(data, BAG_IDS))
      })
      .catch(() => {
        /* giữ data local */
      })
  }, [])

  return (
    <div className="product-showcase">
      <HomeProductSection
        title="Máy tính bán chạy"
        products={calculators}
      />
      <HomeProductSection
        title="Phụ kiện máy tính"
        products={accessories}
        labels={ACCESSORY_LABELS}
      />
      <HomeProductSection
        title="Balo học sinh"
        products={bags}
        labels={BAG_LABELS}
        variant="light"
      />
      <p className="showcase-more">
        <Link to="/cua-hang">Xem tất cả sản phẩm →</Link>
      </p>
    </div>
  )
}
