import { createContext, useContext, useMemo, useState } from 'react'
import { buildCartLine, normalizeCartItem } from '../utils/cartLine'

const CartContext = createContext(null)
const STORAGE_KEY = 'casio-shop-cart'
const VERSION_KEY = 'casio-shop-cart-version'
/** Tăng khi đổi cấu trúc giỏ (optionIds, lineKey, phân loại) */
const CART_SCHEMA_VERSION = 2

function loadCart() {
  try {
    const version = Number(localStorage.getItem(VERSION_KEY))
    if (version !== CART_SCHEMA_VERSION) {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.setItem(VERSION_KEY, String(CART_SCHEMA_VERSION))
      return []
    }

    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    if (!Array.isArray(parsed)) return []

    const normalized = parsed.map(normalizeCartItem)
    const stale = normalized.some(
      (item) => !item.lineKey || item.productId == null,
    )
    if (stale) {
      localStorage.removeItem(STORAGE_KEY)
      return []
    }

    return normalized
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return []
  }
}

function saveCart(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  localStorage.setItem(VERSION_KEY, String(CART_SCHEMA_VERSION))
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart)
  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false)
  const [cartError, setCartError] = useState('')

  const openMiniCart = () => setIsMiniCartOpen(true)
  const closeMiniCart = () => setIsMiniCartOpen(false)

  const updateItems = (updater) => {
    setItems((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      saveCart(next)
      return next
    })
  }

  const clampQuantity = (line, quantity) => {
    if (line.maxStock != null && quantity > line.maxStock) {
      setCartError(`"${line.name}" chỉ còn ${line.maxStock} sản phẩm.`)
      return line.maxStock
    }
    setCartError('')
    return quantity
  }

  const addToCart = (product, quantity = 1, selections = {}) => {
    const line = buildCartLine(product, { quantity, ...selections })
    const qty = clampQuantity(line, quantity)
    if (qty < 1) return

    updateItems((prev) => {
      const found = prev.find((item) => item.lineKey === line.lineKey)
      if (found) {
        const newQty = clampQuantity(line, found.quantity + qty)
        if (newQty < 1) return prev
        return prev.map((item) =>
          item.lineKey === line.lineKey
            ? { ...item, quantity: newQty, price: line.price }
            : item,
        )
      }
      return [...prev, { ...line, quantity: qty }]
    })
  }

  const removeFromCart = (lineKey) => {
    setCartError('')
    updateItems((prev) => prev.filter((item) => item.lineKey !== lineKey))
  }

  const updateQuantity = (lineKey, quantity) => {
    if (quantity < 1) {
      removeFromCart(lineKey)
      return
    }
    updateItems((prev) =>
      prev.map((item) => {
        if (item.lineKey !== lineKey) return item
        const qty = clampQuantity(item, quantity)
        return { ...item, quantity: qty }
      }),
    )
  }

  const clearCart = () => {
    setCartError('')
    updateItems([])
  }

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
    isMiniCartOpen,
    openMiniCart,
    closeMiniCart,
    cartError,
    clearCartError: () => setCartError(''),
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error('useCart phải nằm trong CartProvider')
  }
  return ctx
}
