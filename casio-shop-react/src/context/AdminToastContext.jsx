import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import AdminToast from '../components/AdminToast/AdminToast'
import './AdminToastContext.css'

const AdminToastContext = createContext(null)

export function AdminToastProvider({ children }) {
  const [toast, setToast] = useState(null)
  const timerRef = useRef(null)

  const hideToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setToast(null)
  }, [])

  const showToast = useCallback(
    (message) => {
      if (!message) return
      if (timerRef.current) clearTimeout(timerRef.current)
      setToast({ id: Date.now(), message })
      timerRef.current = setTimeout(() => {
        setToast(null)
        timerRef.current = null
      }, 3200)
    },
    [],
  )

  const value = useMemo(() => ({ showToast, hideToast }), [showToast, hideToast])

  return (
    <AdminToastContext.Provider value={value}>
      {children}
      <div className="admin-toast-host" aria-live="polite">
        {toast && (
          <AdminToast key={toast.id} message={toast.message} onClose={hideToast} />
        )}
      </div>
    </AdminToastContext.Provider>
  )
}

export function useAdminToast() {
  const ctx = useContext(AdminToastContext)
  if (!ctx) {
    throw new Error('useAdminToast must be used within AdminToastProvider')
  }
  return ctx
}
