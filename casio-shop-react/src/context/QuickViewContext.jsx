import { createContext, useContext, useState } from 'react'

const QuickViewContext = createContext(null)

export function QuickViewProvider({ children }) {
  const [product, setProduct] = useState(null)

  const openQuickView = (item) => setProduct(item)
  const closeQuickView = () => setProduct(null)

  return (
    <QuickViewContext.Provider value={{ product, openQuickView, closeQuickView }}>
      {children}
    </QuickViewContext.Provider>
  )
}

export function useQuickView() {
  const ctx = useContext(QuickViewContext)
  if (!ctx) {
    throw new Error('useQuickView phải nằm trong QuickViewProvider')
  }
  return ctx
}
