import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchProducts, filterProductsByQuery } from '../../api/client'
import {
  apiAdminCreatePromotion,
  apiAdminDeletePromotion,
  apiAdminFetchPromotion,
  apiAdminFetchPromotions,
  apiAdminSyncPromotionItems,
  apiAdminUpdatePromotion,
} from '../../api/adminPromotions'
import { useAuth } from '../../context/AuthContext'
import { useAdminToast } from '../../context/AdminToastContext'
import { formatPrice, productImageSrc } from '../../utils/format'
import { getProductListPrice } from '../../utils/productCard'
import { getMinSkuPrice, getProductTotalStock } from '../../utils/productVariants'
import { fromDatetimeLocalValue, toDatetimeLocalValue } from '../../utils/voucher'
import './AdminPromotionsPage.css'

const EMPTY_FORM = {
  name: '',
  discount_percent: '10',
  starts_at: '',
  ends_at: '',
  is_active: true,
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

function promotionToForm(promotion) {
  return {
    name: promotion.name,
    discount_percent: String(promotion.discount_percent),
    starts_at: toDatetimeLocalValue(promotion.starts_at),
    ends_at: toDatetimeLocalValue(promotion.ends_at),
    is_active: promotion.is_active,
  }
}

function calcSalePrice(basePrice, percent) {
  const p = Math.max(1, Math.min(99, Number(percent) || 0))
  return Math.round((basePrice * (100 - p)) / 100)
}

function formatProductPriceRange(product) {
  const skus = product?.variants?.skus || []
  const prices = skus
    .map((sku) => Number(sku.price))
    .filter((p) => Number.isInteger(p) && p >= 1000)

  if (prices.length > 1) {
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    if (min !== max) return `${formatPrice(min)} - ${formatPrice(max)}`
    return formatPrice(min)
  }

  const min = getMinSkuPrice(skus)
  if (min != null) return formatPrice(min)
  return formatPrice(product?.price ?? 0)
}

function formatStock(product) {
  const total = getProductTotalStock(product)
  if (total == null) return '—'
  return total.toLocaleString('vi-VN')
}

function formatListPeriod(startsAt, endsAt) {
  const fmt = (iso) => {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }
  return `${fmt(startsAt)} - ${fmt(endsAt)}`
}

function itemsToPayload(items) {
  return items.map((item) => ({
    product_id: item.product_id,
    discount_percent: Number(item.discount_percent),
    is_enabled: item.is_enabled !== false,
  }))
}

export default function AdminPromotionsPage() {
  const { token } = useAuth()
  const { showToast } = useAdminToast()
  const [promotions, setPromotions] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [productsLoading, setProductsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showList, setShowList] = useState(true)
  const [listSearchDraft, setListSearchDraft] = useState('')
  const [listSearch, setListSearch] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(defaultForm)
  const [items, setItems] = useState([])
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerDraft, setPickerDraft] = useState('')
  const [pickerQuery, setPickerQuery] = useState('')
  const [pickerInStockOnly, setPickerInStockOnly] = useState(true)
  const [pickerSelected, setPickerSelected] = useState(() => new Set())
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [batchPercent, setBatchPercent] = useState('10')

  const productMap = useMemo(
    () => Object.fromEntries(products.map((p) => [p.id, p])),
    [products],
  )

  const existingItemIds = useMemo(
    () => new Set(items.map((i) => i.product_id)),
    [items],
  )

  const loadProducts = useCallback(async () => {
    setProductsLoading(true)
    try {
      const prods = await fetchProducts()
      setProducts(prods)
      return prods
    } catch (e) {
      setError(e.message || 'Không tải được sản phẩm')
      return []
    } finally {
      setProductsLoading(false)
    }
  }, [])

  const loadPromotion = useCallback(
    async (id) => {
      const data = await apiAdminFetchPromotion(token, id)
      setEditingId(id)
      setForm(promotionToForm(data))
      setItems(data.items || [])
      setSelectedIds(new Set())
      setBatchPercent(String(data.discount_percent || 10))
      setShowList(false)
    },
    [token],
  )

  const resetToNew = useCallback(() => {
    setEditingId(null)
    setForm(defaultForm())
    setItems([])
    setSelectedIds(new Set())
    setBatchPercent('10')
    setFormError('')
    setShowList(false)
  }, [])

  const goToList = useCallback(() => {
    setShowList(true)
    setFormError('')
  }, [])

  useEffect(() => {
    let cancelled = false

    async function init() {
      setLoading(true)
      setError('')

      try {
        const promos = await apiAdminFetchPromotions(token)
        if (!cancelled) setPromotions(promos)
      } catch (e) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }

      loadProducts()
    }

    init()
    return () => {
      cancelled = true
    }
  }, [token, loadProducts])

  const filteredPromotions = useMemo(() => {
    const q = listSearch.trim().toLowerCase()
    if (!q) return promotions
    return promotions.filter((p) => p.name.toLowerCase().includes(q))
  }, [promotions, listSearch])

  const filteredPickerProducts = useMemo(() => {
    let list = filterProductsByQuery(products, pickerQuery)
    if (pickerInStockOnly) {
      list = list.filter((p) => {
        const stock = getProductTotalStock(p)
        return stock == null || stock > 0
      })
    }
    return list
  }, [products, pickerQuery, pickerInStockOnly])

  const pickerSelectable = useMemo(
    () => filteredPickerProducts.filter((p) => !existingItemIds.has(p.id)),
    [filteredPickerProducts, existingItemIds],
  )

  const openPicker = async () => {
    setPickerDraft(pickerQuery)
    setPickerSelected(new Set())
    setPickerOpen(true)
    if (!products.length) {
      await loadProducts()
    }
  }

  const runPickerSearch = () => {
    setPickerQuery(pickerDraft.trim())
  }

  const resetPickerSearch = () => {
    setPickerDraft('')
    setPickerQuery('')
  }

  const togglePickerProduct = (productId) => {
    if (existingItemIds.has(productId)) return
    setPickerSelected((prev) => {
      const next = new Set(prev)
      if (next.has(productId)) next.delete(productId)
      else next.add(productId)
      return next
    })
  }

  const togglePickerAll = () => {
    const ids = pickerSelectable.map((p) => p.id)
    if (ids.every((id) => pickerSelected.has(id))) {
      setPickerSelected(new Set())
    } else {
      setPickerSelected(new Set(ids))
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa chương trình khuyến mãi này?')) return
    try {
      await apiAdminDeletePromotion(token, id)
      const promos = await apiAdminFetchPromotions(token)
      setPromotions(promos)
      goToList()
      showToast('Bạn đã xóa chương trình khuyến mãi thành công')
    } catch (e) {
      setError(e.message)
    }
  }

  const savePromotion = async () => {
    setFormError('')
    if (!form.name.trim()) {
      setFormError('Vui lòng nhập tên chương trình.')
      return
    }

    const wasNew = !editingId
    setSaving(true)
    const payload = {
      name: form.name.trim(),
      discount_percent: Number(form.discount_percent) || Number(batchPercent) || 10,
      starts_at: fromDatetimeLocalValue(form.starts_at),
      ends_at: fromDatetimeLocalValue(form.ends_at),
      is_active: form.is_active,
    }

    try {
      let promotionId = editingId
      if (editingId) {
        await apiAdminUpdatePromotion(token, editingId, payload)
      } else {
        const res = await apiAdminCreatePromotion(token, payload)
        promotionId = res.promotion.id
        setEditingId(promotionId)
      }

      if (promotionId) {
        await apiAdminSyncPromotionItems(token, promotionId, itemsToPayload(items))
      }

      const promos = await apiAdminFetchPromotions(token)
      setPromotions(promos)
      setFormError('')
      goToList()
      showToast(
        wasNew
          ? 'Bạn đã tạo chương trình khuyến mãi thành công'
          : 'Bạn đã sửa chương trình khuyến mãi thành công',
      )
    } catch (e) {
      setFormError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const confirmPicker = () => {
    const percent = Number(batchPercent) || Number(form.discount_percent) || 10
    const newItems = [...items]
    pickerSelected.forEach((productId) => {
      if (existingItemIds.has(productId)) return
      const product = productMap[productId]
      if (!product) return
      const basePrice = getProductListPrice(product)
      newItems.push({
        product_id: productId,
        discount_percent: percent,
        is_enabled: true,
        product: {
          id: product.id,
          name: product.name,
          image: product.imagePath || product.image,
          price: basePrice,
          sale_price: calcSalePrice(basePrice, percent),
        },
      })
    })
    setItems(newItems)
    setPickerSelected(new Set())
    setPickerOpen(false)
    showToast('Bạn đã thêm sản phẩm thành công')
  }

  const toggleRow = (productId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(productId)) next.delete(productId)
      else next.add(productId)
      return next
    })
  }

  const toggleAllRows = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(items.map((i) => i.product_id)))
    }
  }

  const applyBatch = () => {
    const percent = Number(batchPercent)
    if (!percent || percent < 1 || percent > 99) return
    setForm((f) => ({ ...f, discount_percent: String(percent) }))
    setItems((prev) =>
      prev.map((item) => {
        if (!selectedIds.has(item.product_id)) return item
        const basePrice = item.product?.price ?? getProductListPrice(productMap[item.product_id])
        return {
          ...item,
          discount_percent: percent,
          product: {
            ...item.product,
            price: basePrice,
            sale_price: calcSalePrice(basePrice, percent),
          },
        }
      }),
    )
  }

  const removeSelected = () => {
    setItems((prev) => prev.filter((i) => !selectedIds.has(i.product_id)))
    setSelectedIds(new Set())
  }

  const updateItemPercent = (productId, value) => {
    const percent = Number(value)
    setItems((prev) =>
      prev.map((item) => {
        if (item.product_id !== productId) return item
        const basePrice = item.product?.price ?? getProductListPrice(productMap[productId])
        return {
          ...item,
          discount_percent: percent,
          product: {
            ...item.product,
            price: basePrice,
            sale_price: calcSalePrice(basePrice, percent),
          },
        }
      }),
    )
  }

  const toggleItemEnabled = (productId) => {
    setItems((prev) =>
      prev.map((item) =>
        item.product_id === productId
          ? { ...item, is_enabled: !item.is_enabled }
          : item,
      ),
    )
  }

  const removeItem = (productId) => {
    setItems((prev) => prev.filter((i) => i.product_id !== productId))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.delete(productId)
      return next
    })
  }

  if (loading) {
    return <div className="admin-promotions admin-promotions--loading">Đang tải…</div>
  }

  if (showList) {
    return (
      <div className="admin-promotions">
        <div className="admin-promotions-list-head">
          <h1>Danh sách chương trình</h1>
          <button type="button" className="admin-promotions-btn admin-promotions-btn--primary" onClick={resetToNew}>
            + Tạo chương trình
          </button>
        </div>

        <div className="admin-promotions-panel admin-promotions-panel--filters">
          <div className="admin-promotions-list-filters">
            <label className="admin-promotions-list-filter">
              <span>Tìm kiếm</span>
              <div className="admin-promotions-list-filter-row">
                <select defaultValue="name">
                  <option value="name">Tên chương trình</option>
                </select>
                <input
                  type="search"
                  value={listSearchDraft}
                  onChange={(e) => setListSearchDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setListSearch(listSearchDraft.trim())
                  }}
                />
              </div>
            </label>
            <div className="admin-promotions-list-filter-actions">
              <button
                type="button"
                className="admin-promotions-btn admin-promotions-btn--search"
                onClick={() => setListSearch(listSearchDraft.trim())}
              >
                Tìm
              </button>
              <button
                type="button"
                className="admin-promotions-btn"
                onClick={() => {
                  setListSearchDraft('')
                  setListSearch('')
                }}
              >
                Đặt lại
              </button>
            </div>
          </div>
        </div>

        {error && <p className="admin-promotions--error">{error}</p>}

        {filteredPromotions.length === 0 ? (
          <div className="admin-promotions-panel admin-promotions-panel--empty">Chưa có chương trình</div>
        ) : (
          <div className="admin-promotions-panel admin-promotions-panel--list">
            <table className="admin-promotions-table admin-promotions-table--programs">
              <thead>
                <tr>
                  <th>Tất cả</th>
                  <th>Loại khuyến mãi</th>
                  <th>Sản phẩm</th>
                  <th>Thời Gian</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredPromotions.map((p) => {
                  const previews = p.preview_products || []
                  const extraCount = Math.max(0, (p.items_count || 0) - previews.length)
                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="admin-promotions-program-name">
                          <span
                            className={`admin-promotions-status-badge${
                              p.is_running ? ' admin-promotions-status-badge--on' : ''
                            }`}
                          >
                            {p.is_running ? 'Đang diễn ra' : p.is_active ? 'Sắp diễn ra' : 'Đã tắt'}
                          </span>
                          <span>{p.name}</span>
                        </div>
                      </td>
                      <td>Giảm giá {p.discount_percent}%</td>
                      <td>
                        <div className="admin-promotions-thumbs">
                          {previews.slice(0, 4).map((product) => (
                            <img
                              key={product.id}
                              src={productImageSrc(product.image)}
                              alt=""
                              title={product.name}
                            />
                          ))}
                          {extraCount > 0 && (
                            <span className="admin-promotions-thumbs-more">+{extraCount}</span>
                          )}
                        </div>
                      </td>
                      <td className="admin-promotions-period">
                        {formatListPeriod(p.starts_at, p.ends_at)}
                      </td>
                      <td className="admin-promotions-program-actions">
                        <button type="button" onClick={() => loadPromotion(p.id)}>Chỉnh sửa</button>
                        <button type="button" onClick={() => handleDelete(p.id)}>Xóa</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="admin-promotions admin-promotions--form">
      {error && <p className="admin-promotions--error">{error}</p>}
      {formError && <p className="admin-promotions--error">{formError}</p>}

      <section className="admin-promotions-panel">
        <h2 className="admin-promotions-panel-title">Thông tin cơ bản</h2>

        <label className="admin-promotions-label">
          <span className="admin-promotions-label-text">Tên chương trình khuyến mãi</span>
          <div className="admin-promotions-input-wrap">
            <input
              type="text"
              maxLength={150}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <span className="admin-promotions-counter">{form.name.length}/150</span>
          </div>
        </label>

        <div className="admin-promotions-label">
          <span className="admin-promotions-label-text">Thời gian khuyến mãi</span>
          <div className="admin-promotions-time-row">
            <input
              type="datetime-local"
              value={form.starts_at}
              onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
            />
            <span className="admin-promotions-time-sep">–</span>
            <input
              type="datetime-local"
              value={form.ends_at}
              onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
            />
          </div>
        </div>
      </section>

      <section className="admin-promotions-panel">
        <h2 className="admin-promotions-panel-title">Sản phẩm khuyến mãi</h2>

        <button type="button" className="admin-promotions-add-btn" onClick={openPicker}>
          + Thêm sản phẩm
        </button>

        {items.length > 0 && (
          <>
            <div className="admin-promotions-batch">
              <span className="admin-promotions-batch-count">{selectedIds.size} sản phẩm đã chọn</span>
              <label className="admin-promotions-batch-field">
                <span>Khuyến Mãi</span>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={batchPercent}
                  onChange={(e) => setBatchPercent(e.target.value)}
                />
                <span className="admin-promotions-batch-suffix">%GIẢM</span>
              </label>
              <button
                type="button"
                className="admin-promotions-btn admin-promotions-btn--batch"
                disabled={selectedIds.size === 0}
                onClick={applyBatch}
              >
                Cập nhật hàng loạt
              </button>
              <button
                type="button"
                className="admin-promotions-btn admin-promotions-btn--ghost"
                disabled={selectedIds.size === 0}
                onClick={removeSelected}
              >
                Xóa
              </button>
            </div>

            <div className="admin-promotions-table-wrap">
              <table className="admin-promotions-table admin-promotions-table--items">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={selectedIds.size === items.length && items.length > 0}
                        onChange={toggleAllRows}
                      />
                    </th>
                    <th>Tên sản phẩm</th>
                    <th>Giá gốc</th>
                    <th>Giá sau giảm</th>
                    <th>Giảm giá</th>
                    <th>Bật / Tắt</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const product = item.product || productMap[item.product_id]
                    const basePrice =
                      product?.price ?? getProductListPrice(productMap[item.product_id])
                    const salePrice = calcSalePrice(basePrice, item.discount_percent)
                    return (
                      <tr key={item.product_id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(item.product_id)}
                            onChange={() => toggleRow(item.product_id)}
                          />
                        </td>
                        <td className="admin-promotions-product-cell">
                          <img src={productImageSrc(product?.image || product?.imagePath)} alt="" />
                          <span>{product?.name}</span>
                        </td>
                        <td>{formatPrice(basePrice)}</td>
                        <td>{formatPrice(salePrice)}</td>
                        <td>
                          <div className="admin-promotions-discount-cell">
                            <input
                              type="number"
                              min={1}
                              max={99}
                              value={item.discount_percent}
                              onChange={(e) => updateItemPercent(item.product_id, e.target.value)}
                            />
                            <span>%GIẢM</span>
                          </div>
                        </td>
                        <td>
                          <button
                            type="button"
                            className={`admin-promotions-switch${
                              item.is_enabled !== false ? ' admin-promotions-switch--on' : ''
                            }`}
                            onClick={() => toggleItemEnabled(item.product_id)}
                          />
                        </td>
                        <td>
                          <button type="button" className="admin-promotions-link" onClick={() => removeItem(item.product_id)}>
                            Xóa
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <footer className="admin-promotions-bar">
        <button type="button" className="admin-promotions-btn" onClick={goToList}>
          Hủy
        </button>
        <button
          type="button"
          className="admin-promotions-btn admin-promotions-btn--confirm"
          disabled={saving}
          onClick={savePromotion}
        >
          {saving ? 'Đang lưu…' : 'Xác nhận'}
        </button>
      </footer>

      {pickerOpen && (
        <div className="admin-promotions-modal-backdrop" onClick={() => setPickerOpen(false)}>
          <div className="admin-promotions-modal admin-promotions-modal--picker" onClick={(e) => e.stopPropagation()}>
            <div className="admin-promotions-modal-head">
              <h3>Chọn Sản phẩm</h3>
              <button type="button" className="admin-promotions-modal-close" onClick={() => setPickerOpen(false)}>×</button>
            </div>

            <div className="admin-promotions-picker-tabs">
              <span className="admin-promotions-picker-tab admin-promotions-picker-tab--active">Chọn</span>
            </div>

            <div className="admin-promotions-picker-filters">
              <span className="admin-promotions-picker-filter-label">Tìm</span>
              <input
                type="search"
                className="admin-promotions-picker-search-input"
                placeholder="Nhập vào"
                value={pickerDraft}
                onChange={(e) => setPickerDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') runPickerSearch()
                }}
              />
              <button type="button" className="admin-promotions-btn admin-promotions-btn--search" onClick={runPickerSearch}>
                Tìm
              </button>
              <button type="button" className="admin-promotions-btn" onClick={resetPickerSearch}>
                Đặt lại
              </button>
              <label className="admin-promotions-picker-stock">
                <input
                  type="checkbox"
                  checked={pickerInStockOnly}
                  onChange={(e) => setPickerInStockOnly(e.target.checked)}
                />
                Xem sản phẩm có sẵn
              </label>
            </div>

            <div className="admin-promotions-picker-table-wrap">
              {productsLoading ? (
                <p className="admin-promotions-picker-status">Đang tải sản phẩm…</p>
              ) : filteredPickerProducts.length === 0 ? (
                <p className="admin-promotions-picker-status">
                  {products.length === 0 ? 'Chưa có sản phẩm trong shop.' : 'Không tìm thấy sản phẩm.'}
                </p>
              ) : (
                <table className="admin-promotions-picker-table">
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          checked={
                            pickerSelectable.length > 0 &&
                            pickerSelectable.every((p) => pickerSelected.has(p.id))
                          }
                          onChange={togglePickerAll}
                        />
                      </th>
                      <th>Sản Phẩm</th>
                      <th>Giá</th>
                      <th>Kho hàng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPickerProducts.map((p) => {
                      const added = existingItemIds.has(p.id)
                      return (
                        <tr key={p.id} className={added ? 'admin-promotions-picker-row--added' : ''}>
                          <td>
                            <input
                              type="checkbox"
                              checked={added || pickerSelected.has(p.id)}
                              disabled={added}
                              onChange={() => togglePickerProduct(p.id)}
                            />
                          </td>
                          <td>
                            <div className="admin-promotions-picker-product">
                              <img src={productImageSrc(p.image)} alt="" />
                              <div>
                                <div className="admin-promotions-picker-product-name">{p.name}</div>
                                <div className="admin-promotions-picker-product-code">Mã: {p.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="admin-promotions-picker-price-cell">
                            {formatProductPriceRange(p)}
                          </td>
                          <td>{formatStock(p)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <footer className="admin-promotions-modal-foot">
              <button type="button" className="admin-promotions-btn" onClick={() => setPickerOpen(false)}>
                Hủy
              </button>
              <button
                type="button"
                className="admin-promotions-btn admin-promotions-btn--confirm"
                disabled={pickerSelected.size === 0}
                onClick={confirmPicker}
              >
                Xác nhận
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  )
}
