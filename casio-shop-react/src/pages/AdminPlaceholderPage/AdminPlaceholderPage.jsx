import './AdminPlaceholderPage.css'

export default function AdminPlaceholderPage({ title, description }) {
  return (
    <div className="admin-placeholder">
      <h1>{title}</h1>
      <p>{description || 'Tính năng đang được phát triển.'}</p>
    </div>
  )
}
