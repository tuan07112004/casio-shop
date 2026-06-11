import { useEffect, useState } from 'react'
import { fetchProducts } from '../../api/client'
import { formatPrice } from '../../utils/format'
import {
  formatVoucherOffer,
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
  VOUCHER_TYPE_META,
} from '../../utils/voucher'
import { useAuth } from '../../context/AuthContext'
import { useAdminToast } from '../../context/AdminToastContext'
import {
  apiAdminCreateVoucher,
  apiAdminDeleteVoucher,
  apiAdminFetchVouchers,
  apiAdminUpdateVoucher,
} from '../../api/adminVouchers'
import './AdminVouchersPage.css'

const CODE_PREFIX = 'LYTU'
const VOUCHER_TYPES = ['shop', 'product', 'free_ship']

const EMPTY_FORM = {
  name: '',
  code_suffix: '',
  starts_at: '',
  ends_at: '',
  discount_value: '',
  min_order_value: '',
  max_uses: '',
  max_uses_per_user: '1',
  is_active: true,
  product_ids: [],
}

function defaultForm() {
  const start = new Date()
  const end = new Date()
  end.setDate(end.getDate() + 30)
  return {
    ...EMPTY_FORM,
    starts_at: toDatetimeLocalValue(start.toISOString()),
    ends_at: toDatetimeLocalValue(end.toISOString()),
  }
}

function voucherToForm(voucher) {
  return {
    name: voucher.name,
    code_suffix: voucher.code_suffix,
    starts_at: toDatetimeLocalValue(voucher.starts_at),
    ends_at: toDatetimeLocalValue(voucher.ends_at),
    discount_value: String(voucher.discount_value),
    min_order_value:
      voucher.min_order_value > 0 ? String(voucher.min_order_value) : '',
    max_uses: voucher.max_uses != null ? String(voucher.max_uses) : '',
    max_uses_per_user: String(voucher.max_uses_per_user ?? 1),
    is_active: voucher.is_active,
    product_ids: voucher.product_ids || [],
  }
}

export default function AdminVouchersPage() {
  const { token } = useAuth()
  const { showToast } = useAdminToast()
  const [vouchers, setVouchers] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mode, setMode] = useState('list')
  const [formType, setFormType] = useState('shop')
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(defaultForm)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const typeMeta = VOUCHER_TYPE_META[formType] || VOUCHER_TYPE_META.shop
  const visibleVouchers = vouchers.filter((v) => v.voucher_type !== 'private')

  const load = () =>
    Promise.all([
      apiAdminFetchVouchers(token),
      fetchProducts().catch(() => []),
    ])
      .then(([voucherList, productList]) => {
        setVouchers(voucherList)
        setProducts(productList)
      })
      .catch((e) => setError(e.message))

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [token])

  const openCreate = (type) => {
    setFormType(type)
    setEditingId(null)
    const next = defaultForm()
    if (type === 'free_ship') {
      next.discount_value = '0'
    }
    setForm(next)
    setFormError('')
    setMode('form')
  }

  const openEdit = (voucher) => {
    setFormType(voucher.voucher_type || 'shop')
    setEditingId(voucher.id)
    setForm(voucherToForm(voucher))
    setFormError('')
    setMode('form')
  }

  const backToList = () => {
    setMode('list')
    setEditingId(null)
    setFormError('')
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const toggleProduct = (productId) => {
    setForm((prev) => {
      const ids = prev.product_ids || []
      const has = ids.includes(productId)
      return {
        ...prev,
        product_ids: has
          ? ids.filter((id) => id !== productId)
          : [...ids, productId],
      }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')

    const name = form.name.trim()
    const suffix = form.code_suffix.trim().toUpperCase()
    if (!name) return setFormError('Vui lòng nhập tên chương trình.')
    if (!/^[A-Z0-9]{1,5}$/.test(suffix)) {
      return setFormError('Mã voucher: 1–5 ký tự A-Z, 0-9.')
    }

    if (formType !== 'free_ship') {
      const discountValue = Number(form.discount_value)
      if (!Number.isInteger(discountValue) || discountValue < 1000) {
        return setFormError('Mức giảm tối thiểu 1.000đ.')
      }
    }

    if (formType === 'product' && !form.product_ids?.length) {
      return setFormError('Vui lòng chọn ít nhất một sản phẩm áp dụng.')
    }

    const payload = {
      name,
      voucher_type: formType,
      code_prefix: CODE_PREFIX,
      code_suffix: suffix,
      starts_at: fromDatetimeLocalValue(form.starts_at),
      ends_at: fromDatetimeLocalValue(form.ends_at),
      discount_value: formType === 'free_ship' ? 0 : Number(form.discount_value),
      min_order_value: form.min_order_value === '' ? 0 : Number(form.min_order_value),
      max_uses: form.max_uses === '' ? null : Number(form.max_uses),
      max_uses_per_user: Number(form.max_uses_per_user) || 1,
      is_active: form.is_active,
      product_ids: formType === 'product' ? form.product_ids : null,
    }

    const wasNew = !editingId
    setSaving(true)
    try {
      if (editingId) {
        const { voucher } = await apiAdminUpdateVoucher(token, editingId, payload)
        setVouchers((prev) => prev.map((v) => (v.id === voucher.id ? voucher : v)))
      } else {
        const { voucher } = await apiAdminCreateVoucher(token, payload)
        setVouchers((prev) => [...prev, voucher])
      }
      showToast(
        wasNew ? 'Bạn đã thêm mã giảm giá thành công' : 'Bạn đã sửa mã giảm giá thành công',
      )
      backToList()
    } catch (err) {
      setFormError(err.message || 'Không lưu được voucher.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (voucher) => {
    if (!window.confirm(`Xóa voucher ${voucher.code}?`)) return
    try {
      await apiAdminDeleteVoucher(token, voucher.id)
      setVouchers((prev) => prev.filter((v) => v.id !== voucher.id))
      showToast('Bạn đã xóa mã giảm giá thành công')
    } catch (err) {
      alert(err.message || 'Không xóa được voucher.')
    }
  }

  if (loading) {
    return <p className="admin-vouchers admin-vouchers-loading">Đang tải...</p>
  }

  if (error) {
    return <p className="admin-vouchers admin-vouchers--error">{error}</p>
  }

  if (mode === 'form') {
    return (
      <div className="admin-vouchers">
        <header className="admin-vouchers-header">
          <div>
            <h1>
              {editingId ? `Sửa ${typeMeta.title}` : `Tạo ${typeMeta.title}`}
            </h1>
            <p className="admin-vouchers-desc">{typeMeta.desc}</p>
          </div>
          <button type="button" className="admin-vouchers-ghost" onClick={backToList}>
            ← Quay lại
          </button>
        </header>

        <form className="admin-vouchers-form" onSubmit={handleSubmit}>
          <section className="admin-vouchers-panel">
            <h2>Thông tin cơ bản</h2>
            <label className="admin-vouchers-field">
              <span>Tên chương trình giảm giá</span>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                maxLength={100}
                placeholder="Tên nội bộ, không hiển thị cho khách"
              />
            </label>
            <label className="admin-vouchers-field">
              <span>Mã voucher</span>
              <div className="admin-vouchers-code">
                <span className="admin-vouchers-code-prefix">{CODE_PREFIX}</span>
                <input
                  name="code_suffix"
                  value={form.code_suffix}
                  onChange={handleChange}
                  maxLength={5}
                  placeholder="VD: SALE1"
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
              <small>Mã đầy đủ: {CODE_PREFIX}{form.code_suffix.toUpperCase() || '…'}</small>
            </label>
            <div className="admin-vouchers-row">
              <label className="admin-vouchers-field">
                <span>Bắt đầu</span>
                <input
                  type="datetime-local"
                  name="starts_at"
                  value={form.starts_at}
                  onChange={handleChange}
                  required
                />
              </label>
              <label className="admin-vouchers-field">
                <span>Kết thúc</span>
                <input
                  type="datetime-local"
                  name="ends_at"
                  value={form.ends_at}
                  onChange={handleChange}
                  required
                />
              </label>
            </div>
          </section>

          {formType === 'product' && (
            <section className="admin-vouchers-panel">
              <h2>Sản phẩm áp dụng</h2>
              <div className="admin-vouchers-product-pick">
                {products.length === 0 ? (
                  <p className="admin-vouchers-empty">Chưa có sản phẩm.</p>
                ) : (
                  products.map((product) => (
                    <label key={product.id} className="admin-vouchers-product-opt">
                      <input
                        type="checkbox"
                        checked={form.product_ids.includes(product.id)}
                        onChange={() => toggleProduct(product.id)}
                      />
                      <span>{product.name}</span>
                    </label>
                  ))
                )}
              </div>
            </section>
          )}

          <section className="admin-vouchers-panel">
            <h2>Thiết lập mã giảm giá</h2>
            {formType !== 'free_ship' && (
              <label className="admin-vouchers-field">
                <span>Mức giảm</span>
                <div className="admin-vouchers-amount">
                  <span>₫</span>
                  <input
                    name="discount_value"
                    type="number"
                    min="1000"
                    step="1000"
                    value={form.discount_value}
                    onChange={handleChange}
                    required
                  />
                </div>
              </label>
            )}
            <label className="admin-vouchers-field">
              <span>Giá trị đơn hàng tối thiểu</span>
              <div className="admin-vouchers-amount">
                <span>₫</span>
                <input
                  name="min_order_value"
                  type="number"
                  min="0"
                  step="1000"
                  value={form.min_order_value}
                  onChange={handleChange}
                  placeholder="0"
                />
              </div>
            </label>
            <div className="admin-vouchers-row">
              <label className="admin-vouchers-field">
                <span>Tổng lượt sử dụng tối đa</span>
                <input
                  name="max_uses"
                  type="number"
                  min="1"
                  value={form.max_uses}
                  onChange={handleChange}
                  placeholder="Không giới hạn"
                />
              </label>
              <label className="admin-vouchers-field">
                <span>Lượt tối đa / người mua</span>
                <input
                  name="max_uses_per_user"
                  type="number"
                  min="1"
                  max="99"
                  value={form.max_uses_per_user}
                  onChange={handleChange}
                />
              </label>
            </div>
            <label className="admin-vouchers-check">
              <input
                type="checkbox"
                name="is_active"
                checked={form.is_active}
                onChange={handleChange}
              />
              <span>
                {formType === 'private'
                  ? 'Kích hoạt mã (chia sẻ qua mã voucher, không hiển thị công khai)'
                  : 'Đang hiển thị (áp dụng trong thời gian sử dụng)'}
              </span>
            </label>
          </section>

          {formError && <p className="admin-vouchers-form-error">{formError}</p>}

          <footer className="admin-vouchers-footer">
            <button type="button" className="admin-vouchers-ghost" onClick={backToList}>
              Hủy
            </button>
            <button type="submit" className="admin-vouchers-primary" disabled={saving}>
              {saving ? 'Đang lưu...' : 'Xác nhận'}
            </button>
          </footer>
        </form>
      </div>
    )
  }

  return (
    <div className="admin-vouchers">
      <header className="admin-vouchers-header">
        <div>
          <h1>Tạo Voucher</h1>
          <p className="admin-vouchers-desc">
            Tạo mã giảm giá toàn Shop, sản phẩm hoặc miễn phí vận chuyển để thu hút người mua.
          </p>
        </div>
      </header>

      <div className="admin-vouchers-type-grid">
        {VOUCHER_TYPES.map((type) => {
          const meta = VOUCHER_TYPE_META[type]
          return (
            <article key={type} className="admin-vouchers-type-card">
              <div className="admin-vouchers-type-icon" aria-hidden>
                {meta.icon}
              </div>
              <div className="admin-vouchers-type-body">
                <h2>{meta.title}</h2>
                <p>{meta.desc}</p>
              </div>
              <button
                type="button"
                className="admin-vouchers-outline"
                onClick={() => openCreate(type)}
              >
                Tạo
              </button>
            </article>
          )
        })}
      </div>

      <section className="admin-vouchers-list-panel">
        <h2>Danh sách voucher ({visibleVouchers.length})</h2>
        {visibleVouchers.length === 0 ? (
          <p className="admin-vouchers-empty">Chưa có voucher. Chọn loại ở trên để tạo.</p>
        ) : (
          <div className="admin-vouchers-grid">
            {visibleVouchers.map((voucher) => {
              const meta = VOUCHER_TYPE_META[voucher.voucher_type] || VOUCHER_TYPE_META.shop
              return (
                <article key={voucher.id} className="admin-voucher-card">
                  <div className="admin-voucher-card-top">
                    <span className="admin-voucher-type">{meta.badge}</span>
                    <span
                      className={`admin-voucher-status${voucher.is_live ? ' admin-voucher-status--live' : ''}`}
                    >
                      {voucher.is_live ? 'Đang chạy' : voucher.is_active ? 'Chưa/đã hết hạn' : 'Tắt'}
                    </span>
                  </div>
                  <strong className="admin-voucher-code">{voucher.code}</strong>
                  <p className="admin-voucher-offer">
                    {formatVoucherOffer(voucher, formatPrice)}
                  </p>
                  <p className="admin-voucher-name">{voucher.name}</p>
                  <div className="admin-voucher-card-actions">
                    <button type="button" onClick={() => openEdit(voucher)}>
                      Sửa
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => handleDelete(voucher)}
                    >
                      Xóa
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
