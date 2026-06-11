import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { fetchCategories } from '../api/categories'
import { mapApiCategories, PRODUCT_CATEGORIES } from '../config/categories'

const CategoriesContext = createContext(null)

export function CategoriesProvider({ children }) {
  const [apiRows, setApiRows] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const rows = await fetchCategories()
      setApiRows(rows)
    } catch {
      setApiRows(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const categories = useMemo(() => {
    if (!apiRows?.length) return PRODUCT_CATEGORIES
    return mapApiCategories(apiRows)
  }, [apiRows])

  const value = useMemo(
    () => ({ categories, loading, refresh }),
    [categories, loading, refresh],
  )

  return (
    <CategoriesContext.Provider value={value}>
      {children}
    </CategoriesContext.Provider>
  )
}

export function useCategories() {
  const ctx = useContext(CategoriesContext)
  if (!ctx) {
    return {
      categories: PRODUCT_CATEGORIES,
      loading: false,
      refresh: async () => {},
    }
  }
  return ctx
}
