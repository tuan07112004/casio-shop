import Info from '../../components/Info/Info'
import ProductShowcase from '../../components/ProductShowcase/ProductShowcase'
import './HomePage.css'

export default function HomePage() {
  return (
    <div className="home-page">
      <Info />
      <ProductShowcase />
    </div>
  )
}
