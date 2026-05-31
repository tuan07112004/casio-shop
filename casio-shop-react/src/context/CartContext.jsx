import { createContext, useContext, useMemo, useState } from 'react'

const CartContext = createContext(null)

const STORAGE_KEY = 'casio-shop-cart'

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveCart(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart)

  const updateItems = (updater) => {
    setItems((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      saveCart(next)
      return next
    })
  }

  const addToCart = (product, quantity = 1) => {
    updateItems((prev) => {
      const found = prev.find((item) => item.productId === product.id)
      if (found) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        )
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity,
        },
      ]
    })
  }

  const removeFromCart = (productId) => {
    updateItems((prev) => prev.filter((item) => item.productId !== productId))
  }

  const updateQuantity = (productId, quantity) => {
    if (quantity < 1) {
      removeFromCart(productId)
      return
    }
    updateItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity } : item,
      ),
    )
  }

  const clearCart = () => updateItems([])

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  )

  const totalPrice = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  )

  const value = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart phải nằm trong CartProvider')
  return ctx
}
