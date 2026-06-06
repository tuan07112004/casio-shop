import CategoryShowcase from '../../components/CategoryShowcase/CategoryShowcase'
import ProductShowcase from '../../components/ProductShowcase/ProductShowcase'
import './HomePage.css'

export default function HomePage() {
  return (
    <div className="home-page">
      <CategoryShowcase />
      <ProductShowcase />
    </div>
  )
}