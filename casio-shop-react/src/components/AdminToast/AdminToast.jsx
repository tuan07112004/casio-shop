import './AdminToast.css'

export default function AdminToast({ message }) {
  return (
    <div className="admin-toast" role="status">
      <span className="admin-toast-icon" aria-hidden>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M3.5 8.2L6.4 11.1L12.5 5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="admin-toast-message">{message}</span>
    </div>
  )
}
