import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { fetchProducts } from '../../api/client'
import {
  apiAdminCreateProduct,
  apiAdminUpdateProduct,
  apiAdminDeleteProduct,
  apiAdminUploadImage,
} from '../../api/adminProducts'
import { formatPrice, productImageSrc } from '../../utils/format'
import './AdminProductsPage.css'

const CATEGORIES = [
  { value: 'may-tinh', label: 'Máy tính' },
  { value: 'balo', label: 'Balo' },
  { value: 'phu-kien', label: 'Phụ kiện' },
]

const EMPTY_FORM = {
  name: '',
  price: '',
  image: '',
  category: 'may-tinh',
}

export default function AdminProductsPage() {
  const { token } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [localPreview, setLocalPreview] = useState('')
  const [formError, setFormError] = useState('')

  const loadProducts = () =>
    fetchProducts()
      .then(setProducts)
      .catch((e) => setError(e.message))

  useEffect(() => {
    loadProducts().finally(() => setLoading(false))
  }, [])

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setFormError('')
    setLocalPreview('')
  }

  const startEdit = (product) => {
    setEditingId(product.id)
    setForm({
      name: product.name,
      price: String(product.price),
      image: product.image,
      category: product.category,
    })
    setFormError('')
    setLocalPreview('')
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setFormError('Chỉ chấp nhận file ảnh (JPG, PNG, WebP).')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setFormError('Ảnh tối đa 2MB.')
      return
    }

    setLocalPreview(URL.createObjectURL(file))
    setUploading(true)
    setFormError('')

    try {
      const path = await apiAdminUploadImage(token, file)
      setForm((prev) => ({ ...prev, image: path }))
    } catch (err) {
      setFormError(err.message || 'Không tải được ảnh.')
      setLocalPreview('')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')

    const name = form.name.trim()
    const price = Number(form.price)
    const image = form.image.trim()

    if (!name) return setFormError('Vui lòng nhập tên sản phẩm.')
    if (!Number.isInteger(price) || price < 1000)
      return setFormError('Giá phải là số nguyên, tối thiểu 1.000đ.')
    if (!image) return setFormError('Vui lòng tải ảnh sản phẩm lên.')
    if (uploading) return setFormError('Đang tải ảnh, vui lòng đợi.')

    const payload = { name, price, image, category: form.category }

    setSaving(true)
    try {
      if (editingId) {
        const updated = await apiAdminUpdateProduct(token, editingId, payload)
        setProducts((prev) =>
          prev.map((p) => (p.id === updated.id ? updated : p)),
        )
      } else {
        const created = await apiAdminCreateProduct(token, payload)
        setProducts((prev) => [...prev, created].sort((a, b) => a.id - b.id))
      }
      resetForm()
    } catch (err) {
      setFormError(err.message || 'Không lưu được sản phẩm.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (product) => {
    if (!window.confirm(`Xóa "${product.name}"?`)) return

    try {
      await apiAdminDeleteProduct(token, product.id)
      setProducts((prev) => prev.filter((p) => p.id !== product.id))
      if (editingId === product.id) resetForm()
    } catch (err) {
      alert(err.message || 'Không xóa được sản phẩm.')
    }
  }

  const previewSrc = localPreview || (form.image ? productImageSrc(form.image) : '')

  if (loading) return <p className="admin-products">Đang tải...</p>
  if (error) return <p className="admin-products admin-products--error">{error}</p>

  return (
    <div className="admin-products">
      <header className="admin-products-header">
        <h1>Quản lý sản phẩm</h1>
        <Link to="/admin">← Về admin</Link>
      </header>

      <section className="admin-products-form-card">
        <h2>{editingId ? `Sửa sản phẩm #${editingId}` : 'Thêm sản phẩm mới'}</h2>
        <form className="admin-products-form" onSubmit={handleSubmit}>
          <label>
            Tên sản phẩm
            <input name="name" value={form.name} onChange={handleChange} required />
          </label>

          <label>
            Giá (VNĐ)
            <input
              name="price"
              type="number"
              min="1000"
              step="1000"
              value={form.price}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Danh mục
            <select name="category" value={form.category} onChange={handleChange}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <div className="admin-products-upload">
            <span className="admin-products-upload-label">Ảnh sản phẩm</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              disabled={uploading}
            />
            {uploading && <p className="admin-products-upload-status">Đang tải ảnh...</p>}
            {form.image && !uploading && (
              <p className="admin-products-upload-path">{form.image}</p>
            )}
          </div>

          {previewSrc && (
            <div className="admin-products-preview">
              <img src={previewSrc} alt="Xem trước" />
            </div>
          )}

          {formError && <p className="admin-products-form-error">{formError}</p>}

          <div className="admin-products-form-actions">
            <button
              type="submit"
              className="admin-products-btn admin-products-btn--primary"
              disabled={saving || uploading}
            >
              {saving ? 'Đang lưu...' : editingId ? 'Cập nhật' : 'Thêm sản phẩm'}
            </button>
            {editingId && (
              <button type="button" className="admin-products-btn" onClick={resetForm}>
                Hủy sửa
              </button>
            )}
          </div>
        </form>
        <p className="admin-products-hint">
          Chọn ảnh từ máy tính (JPG, PNG, WebP — tối đa 2MB). Ảnh lưu vào{' '}
          <code>public/images/sanpham/</code>
        </p>
      </section>

      <section className="admin-products-list">
        <h2>Danh sách ({products.length})</h2>
        {products.length === 0 ? (
          <p>Chưa có sản phẩm.</p>
        ) : (
          <div className="admin-products-table-wrap">
            <table className="admin-products-table">
              <thead>
                <tr>
                  <th>Ảnh</th>
                  <th>Tên</th>
                  <th>Giá</th>
                  <th>Danh mục</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <img
                        className="admin-products-thumb"
                        src={productImageSrc(product.image)}
                        alt=""
                      />
                    </td>
                    <td>{product.name}</td>
                    <td>{formatPrice(product.price)}</td>
                    <td>
                      {CATEGORIES.find((c) => c.value === product.category)?.label ||
                        product.category}
                    </td>
                    <td className="admin-products-row-actions">
                      <button type="button" onClick={() => startEdit(product)}>
                        Sửa
                      </button>
                      <button
                        type="button"
                        className="admin-products-delete"
                        onClick={() => handleDelete(product)}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
