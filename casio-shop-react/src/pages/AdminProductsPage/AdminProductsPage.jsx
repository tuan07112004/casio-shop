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
import { ADMIN_COLOR_OPTIONS } from '../../utils/productCard'
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
  description: '',
  hover_image: '',
  price_like_new: '',
  price_85: '',
  price_70: '',
  price_55: '',
  colorKeys: [],
  gallery_main_image: '',
  gallery_video: '',
}

function colorKeysFromProduct(product) {
  if (!product?.colors?.length) return []
  return product.colors
    .map((c) => {
      const found = ADMIN_COLOR_OPTIONS.find(
        (o) => o.hex === c.hex && o.label === c.label,
      )
      return found?.key
    })
    .filter(Boolean)
}

function parseOptionalPrice(value) {
  if (value === '' || value == null) return null
  const n = Number(value)
  return Number.isInteger(n) && n >= 1000 ? n : null
}

function productToForm(product) {
  return {
    name: product.name,
    price: String(product.price),
    image: product.imagePath || product.image,
    category: product.category,
    description: product.description || '',
    hover_image: product.hoverImagePath || '',
    price_like_new: product.priceLikeNew ? String(product.priceLikeNew) : '',
    price_85: product.price85 ? String(product.price85) : '',
    price_70: product.price70 ? String(product.price70) : '',
    price_55: product.price55 ? String(product.price55) : '',
    colorKeys: colorKeysFromProduct(product),
    gallery_main_image: product.galleryMainImagePath || '',
    gallery_video: product.galleryVideo || '',
  }
}

export default function AdminProductsPage() {
  const { token } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [uploadingField, setUploadingField] = useState('')
  const [localPreviews, setLocalPreviews] = useState({})
  const [formError, setFormError] = useState('')

  const loadProducts = () =>
    fetchProducts()
      .then(setProducts)
      .catch((e) => setError(e.message))

  useEffect(() => {
    loadProducts().finally(() => setLoading(false))
  }, [])

  const isMayTinh = form.category === 'may-tinh'

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setFormError('')
    setLocalPreviews({})
  }

  const startEdit = (product) => {
    setEditingId(product.id)
    setForm(productToForm(product))
    setFormError('')
    setLocalPreviews({})
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const toggleColor = (key) => {
    setForm((prev) => {
      const has = prev.colorKeys.includes(key)
      return {
        ...prev,
        colorKeys: has
          ? prev.colorKeys.filter((k) => k !== key)
          : [...prev.colorKeys, key],
      }
    })
  }

  const handleFileChange = async (field, e) => {
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

    const previewUrl = URL.createObjectURL(file)
    setLocalPreviews((prev) => ({ ...prev, [field]: previewUrl }))
    setUploadingField(field)
    setFormError('')

    try {
      const path = await apiAdminUploadImage(token, file, form.category)
      setForm((prev) => ({ ...prev, [field]: path }))
    } catch (err) {
      setFormError(err.message || 'Không tải được ảnh.')
      setLocalPreviews((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    } finally {
      setUploadingField('')
      e.target.value = ''
    }
  }

  const buildPayload = () => {
    const name = form.name.trim()
    const price = Number(form.price)
    const image = form.image.trim()

    const colors = form.colorKeys
      .map((key) => ADMIN_COLOR_OPTIONS.find((o) => o.key === key))
      .filter(Boolean)
      .map(({ hex, label }) => ({ hex, label }))

    return {
      name,
      price,
      image,
      category: form.category,
      description: form.description.trim() || null,
      hover_image: form.hover_image.trim() || null,
      gallery_main_image: form.gallery_main_image.trim() || null,
      gallery_video: form.gallery_video.trim() || null,
      colors: colors.length ? colors : null,
      price_like_new: isMayTinh
        ? parseOptionalPrice(form.price_like_new)
        : null,
      price_85: isMayTinh ? parseOptionalPrice(form.price_85) : null,
      price_70: isMayTinh ? parseOptionalPrice(form.price_70) : null,
      price_55: isMayTinh ? parseOptionalPrice(form.price_55) : null,
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
      return setFormError('Giá niêm yết phải là số nguyên, tối thiểu 1.000đ.')
    if (!image) return setFormError('Vui lòng tải ảnh đại diện (thumbnail) lên.')
    if (uploadingField)
      return setFormError('Đang tải ảnh, vui lòng đợi.')

    if (isMayTinh) {
      const tiers = [
        form.price_like_new,
        form.price_85,
        form.price_70,
        form.price_55,
      ].filter((v) => v !== '')
      for (const v of tiers) {
        const n = Number(v)
        if (!Number.isInteger(n) || n < 1000) {
          return setFormError('Giá theo độ mới phải là số nguyên, tối thiểu 1.000đ.')
        }
      }
    }

    const payload = buildPayload()

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

  const previewFor = (field, path) =>
    localPreviews[field] || (path ? productImageSrc(path) : '')

  const renderUpload = (field, label, required = false) => (
    <div className="admin-products-upload" key={field}>
      <span className="admin-products-upload-label">
        {label}
        {required && ' *'}
      </span>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => handleFileChange(field, e)}
        disabled={!!uploadingField}
      />
      {uploadingField === field && (
        <p className="admin-products-upload-status">Đang tải ảnh...</p>
      )}
      {form[field] && uploadingField !== field && (
        <p className="admin-products-upload-path">{form[field]}</p>
      )}
      {previewFor(field, form[field]) && (
        <div className="admin-products-preview">
          <img src={previewFor(field, form[field])} alt="" />
        </div>
      )}
    </div>
  )

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
          <fieldset className="admin-products-fieldset">
            <legend>Thông tin cơ bản</legend>
            <div className="admin-products-grid">
              <label>
                Tên sản phẩm *
                <input name="name" value={form.name} onChange={handleChange} required />
              </label>
              <label>
                Giá niêm yết (VNĐ) *
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
                Danh mục *
                <select name="category" value={form.category} onChange={handleChange}>
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {renderUpload('image', 'Ảnh đại diện (thumbnail / cửa hàng)', true)}
          </fieldset>

          <fieldset className="admin-products-fieldset">
            <legend>Trang chi tiết</legend>
            <label>
              Mô tả sản phẩm
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                placeholder="Mô tả hiển thị tab Mô tả trên trang sản phẩm..."
              />
            </label>
            {renderUpload('hover_image', 'Ảnh hover (card / góc khác)')}
            {renderUpload(
              'gallery_main_image',
              'Ảnh bìa gallery (trang chi tiết)',
            )}
            <label>
              Video gallery (đường dẫn)
              <input
                name="gallery_video"
                value={form.gallery_video}
                onChange={handleChange}
                placeholder="/video/may-tinh/580vnx.mp4"
              />
            </label>
          </fieldset>

          <fieldset className="admin-products-fieldset">
            <legend>Màu sắc</legend>
            <div className="admin-products-colors">
              {ADMIN_COLOR_OPTIONS.map((opt) => {
                const active = form.colorKeys.includes(opt.key)
                return (
                  <label
                    key={opt.key}
                    className={`admin-products-color-opt${active ? ' admin-products-color-opt--active' : ''}`}
                    title={opt.label}
                  >
                    <input
                      type="checkbox"
                      className="admin-products-color-check"
                      checked={active}
                      onChange={() => toggleColor(opt.key)}
                      aria-label={opt.label}
                    />
                    <span
                      className="admin-products-color-swatch"
                      style={{ backgroundColor: opt.hex }}
                      aria-hidden
                    />
                  </label>
                )
              })}
            </div>
          </fieldset>

          {isMayTinh && (
            <fieldset className="admin-products-fieldset">
              <legend>Giá theo độ mới (máy tính)</legend>
              <div className="admin-products-grid admin-products-grid--4">
                <label>
                  LIKE NEW
                  <input
                    name="price_like_new"
                    type="number"
                    min="1000"
                    step="1000"
                    value={form.price_like_new}
                    onChange={handleChange}
                    placeholder="520000"
                  />
                </label>
                <label>
                  85%
                  <input
                    name="price_85"
                    type="number"
                    min="1000"
                    step="1000"
                    value={form.price_85}
                    onChange={handleChange}
                    placeholder="465000"
                  />
                </label>
                <label>
                  70%
                  <input
                    name="price_70"
                    type="number"
                    min="1000"
                    step="1000"
                    value={form.price_70}
                    onChange={handleChange}
                    placeholder="415000"
                  />
                </label>
                <label>
                  55%
                  <input
                    name="price_55"
                    type="number"
                    min="1000"
                    step="1000"
                    value={form.price_55}
                    onChange={handleChange}
                    placeholder="355000"
                  />
                </label>
              </div>
            </fieldset>
          )}

          {formError && <p className="admin-products-form-error">{formError}</p>}

          <div className="admin-products-form-actions">
            <button
              type="submit"
              className="admin-products-btn admin-products-btn--primary"
              disabled={saving || !!uploadingField}
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
                        src={product.image}
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
