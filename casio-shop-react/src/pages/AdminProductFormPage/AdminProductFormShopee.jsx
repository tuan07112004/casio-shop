import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ADMIN_COLOR_OPTIONS } from '../../utils/productCard'
import { formatPrice } from '../../utils/format'
import {
  buildSkuTableRows,
  createVariantGroup,
  createVariantOption,
  generateSkus,
  getActiveVariantGroups,
  getMinSkuPrice,
  getVariantPreviewText,
  setGroupOptionImage,
} from '../../utils/productVariants'
import './AdminProductFormShopee.css'

const ICON_TRASH = '/images/icon/iconTrash.png'
const ICON_ADD_IMAGE = '/images/icon/themSanPham.png'

function hexForLabel(label) {
  const found = ADMIN_COLOR_OPTIONS.find(
    (o) => o.label.toLowerCase() === String(label).trim().toLowerCase(),
  )
  return found?.hex || '#cccccc'
}

export default function AdminProductFormShopee({
  form,
  setForm,
  editingId,
  saving,
  uploadingField,
  formError,
  onChange,
  onGalleryUpload,
  onGalleryPaste,
  pendingGallery = [],
  onPendingGalleryRemove,
  onGalleryRemove,
  onVideoUpload,
  onVideoRemove,
  onSkuImageUpload,
  onSubmit,
  onCancel,
  previewFor,
  categories = [],
  onCreateCategory,
  creatingCategory = false,
}) {
  const galleryImages = form.gallery_images || []
  const [addingCategory, setAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [categoryAddError, setCategoryAddError] = useState('')
  const initialVariants = form.variantsData

  const [hasVariants, setHasVariants] = useState(
    () => !!initialVariants?.groups?.length,
  )
  const [variantGroups, setVariantGroups] = useState(() =>
    initialVariants?.groups?.length
      ? initialVariants.groups
      : [createVariantGroup()],
  )
  const [variantSkus, setVariantSkus] = useState(() => {
    const groups = initialVariants?.groups?.length
      ? initialVariants.groups
      : [createVariantGroup()]
    return generateSkus(groups, initialVariants?.skus || [])
  })
  const [simpleStock, setSimpleStock] = useState(() => form.simpleStock || '')

  useEffect(() => {
    const iv = form.variantsData
    if (iv?.groups?.length) {
      setHasVariants(true)
      setVariantGroups(iv.groups)
      setVariantSkus(generateSkus(iv.groups, iv.skus || []))
    } else {
      setHasVariants(false)
      setVariantGroups([createVariantGroup()])
      setVariantSkus([])
    }
    setSimpleStock(form.simpleStock || '')
  }, [editingId])

  const previewImage = galleryImages[0]
    ? previewFor('gallery-0', galleryImages[0])
    : previewFor('image', form.image)
  const videoPreview = previewFor('video', form.gallery_video)

  const activeGroups = useMemo(
    () => getActiveVariantGroups(variantGroups),
    [variantGroups],
  )

  const skuTableRows = useMemo(
    () => buildSkuTableRows(variantGroups, variantSkus),
    [variantGroups, variantSkus],
  )

  const displayListPrice = useMemo(() => {
    if (hasVariants) {
      const min = getMinSkuPrice(variantSkus)
      return min != null ? min : 0
    }
    return Number(form.price) || 0
  }, [hasVariants, variantSkus, form.price])

  const variantPreview = useMemo(
    () => getVariantPreviewText(variantGroups, variantSkus),
    [variantGroups, variantSkus],
  )

  const syncSkus = (groups, currentSkus) => {
    setVariantSkus(generateSkus(groups, currentSkus))
  }

  const enableVariants = () => {
    const group = createVariantGroup()
    setHasVariants(true)
    setVariantGroups([group])
    syncSkus([group], [])
  }

  const disableVariants = () => {
    setHasVariants(false)
    setVariantGroups([createVariantGroup()])
    setVariantSkus([])
  }

  const addGroup = () => {
    if (variantGroups.length >= 2) return
    const next = [...variantGroups, createVariantGroup()]
    setVariantGroups(next)
    syncSkus(next, variantSkus)
  }

  const removeGroup = (groupIndex) => {
    const next =
      variantGroups.length <= 1
        ? [createVariantGroup()]
        : variantGroups.filter((_, i) => i !== groupIndex)
    setVariantGroups(next)
    syncSkus(next, variantSkus)
  }

  const updateGroupName = (groupIndex, name) => {
    const next = variantGroups.map((g, i) =>
      i === groupIndex ? { ...g, name: name.slice(0, 14) } : g,
    )
    setVariantGroups(next)
    syncSkus(next, variantSkus)
  }

  const updateOption = (groupIndex, optionIndex, label) => {
    const trimmed = label.slice(0, 20)
    let next = variantGroups.map((g, gi) => {
      if (gi !== groupIndex) return g
      return {
        ...g,
        options: g.options.map((o, oi) =>
          oi === optionIndex ? { ...o, label: trimmed } : o,
        ),
      }
    })

    const group = next[groupIndex]
    const isLast = optionIndex === group.options.length - 1
    if (trimmed.trim() && isLast && group.options.length < 20) {
      next = next.map((g, gi) =>
        gi === groupIndex
          ? { ...g, options: [...g.options, createVariantOption()] }
          : g,
      )
    }

    setVariantGroups(next)
    syncSkus(next, variantSkus)
  }

  const addOption = (groupIndex) => {
    const next = variantGroups.map((g, gi) => {
      if (gi !== groupIndex) return g
      if (g.options.length >= 20) return g
      return { ...g, options: [...g.options, createVariantOption()] }
    })
    setVariantGroups(next)
    syncSkus(next, variantSkus)
  }

  const removeOption = (groupIndex, optionIndex) => {
    const next = variantGroups.map((g, gi) => {
      if (gi !== groupIndex) return g
      const options =
        g.options.length <= 1
          ? [createVariantOption()]
          : g.options.filter((_, oi) => oi !== optionIndex)
      return { ...g, options }
    })
    setVariantGroups(next)
    syncSkus(next, variantSkus)
  }

  const updateSkuField = (skuIndex, field, value) => {
    setVariantSkus((prev) =>
      prev.map((sku, i) => (i === skuIndex ? { ...sku, [field]: value } : sku)),
    )
  }

  const handleOptionImageUpload = async (e, optionId) => {
    const file = e.target.files?.[0]
    if (!file || !onSkuImageUpload) return

    const previewKey = `sku-opt-${optionId}`
    try {
      const path = await onSkuImageUpload(file, previewKey)
      const updated = setGroupOptionImage(
        variantGroups,
        variantSkus,
        0,
        optionId,
        path,
      )
      setVariantGroups(updated.groups)
      setVariantSkus(updated.skus)
    } catch (err) {
      console.error(err)
    } finally {
      e.target.value = ''
    }
  }

  const buildMergedForm = () => ({
    ...form,
    variantsData: hasVariants ? { groups: variantGroups, skus: variantSkus } : null,
    simpleStock,
  })

  const handleSave = (e) => {
    onSubmit(e, buildMergedForm(), {
      hasVariants,
      variantGroups,
      variantSkus,
      simpleStock,
    })
  }

  const handleCategoryChange = (e) => {
    if (e.target.value === '__add__') {
      setAddingCategory(true)
      setCategoryAddError('')
      return
    }
    onChange(e)
  }

  const handleAddCategory = async () => {
    if (!onCreateCategory) return
    setCategoryAddError('')
    try {
      await onCreateCategory(newCategoryName)
      setNewCategoryName('')
      setAddingCategory(false)
    } catch (err) {
      setCategoryAddError(err.message || 'Không thêm được danh mục.')
    }
  }

  const cancelAddCategory = () => {
    setAddingCategory(false)
    setNewCategoryName('')
    setCategoryAddError('')
  }

  return (
    <div className="shopee-product-form">
      <nav className="shopee-breadcrumb" aria-label="Đường dẫn">
        <Link to="/admin">Trang chủ</Link>
        <span>/</span>
        <Link to="/admin/san-pham">Quản lý sản phẩm</Link>
        <span>/</span>
        <span>{editingId ? `Sửa sản phẩm #${editingId}` : 'Thêm sản phẩm mới'}</span>
      </nav>

      <div className="shopee-form-layout">
        <div className="shopee-form-main">
          <form className="shopee-form-card" onSubmit={handleSave}>
            <div className="shopee-panel">
              <h2>Thông tin cơ bản</h2>

              <div className="shopee-field">
                <span className="shopee-label">
                  Hình ảnh sản phẩm <em>*</em>
                </span>
                <div
                  className="shopee-gallery"
                  onPaste={(e) => {
                    const items = e.clipboardData?.items
                    if (!items?.length || !onGalleryPaste) return
                    const files = []
                    for (const item of items) {
                      if (item.type.startsWith('image/')) {
                        const file = item.getAsFile()
                        if (file) files.push(file)
                      }
                    }
                    if (!files.length) return
                    e.preventDefault()
                    files.forEach((file) => onGalleryPaste(file))
                  }}
                >
                  {pendingGallery.map((item) => (
                    <div key={item.id} className="shopee-gallery-item shopee-gallery-item--pending">
                      <span className="shopee-gallery-badge shopee-gallery-badge--pending">
                        Chờ danh mục
                      </span>
                      <img src={item.previewUrl} alt="" />
                      <button
                        type="button"
                        className="shopee-gallery-remove"
                        onClick={() => onPendingGalleryRemove?.(item.id)}
                        aria-label="Xóa ảnh"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {galleryImages.map((src, index) => (
                    <div key={`${src}-${index}`} className="shopee-gallery-item">
                      {index === 0 && !pendingGallery.length && (
                        <span className="shopee-gallery-badge">Ảnh bìa</span>
                      )}
                      <img src={previewFor(`gallery-${index}`, src)} alt="" />
                      <button
                        type="button"
                        className="shopee-gallery-remove"
                        onClick={() => onGalleryRemove(index)}
                        aria-label="Xóa ảnh"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <label className="shopee-upload-box shopee-gallery-add shopee-gallery-add--red">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={onGalleryUpload}
                      disabled={uploadingField === 'gallery'}
                      hidden
                    />
                    <img
                      src={ICON_ADD_IMAGE}
                      alt=""
                      className="shopee-upload-img-icon"
                    />
                    <span className="shopee-upload-red-text">Thêm hình ảnh</span>
                    <span className="shopee-upload-red-count">
                      ({galleryImages.length + pendingGallery.length})
                    </span>
                  </label>
                </div>
                {uploadingField === 'gallery' && (
                  <p className="shopee-hint">Đang tải ảnh...</p>
                )}
              </div>

              <div className="shopee-field">
                <span className="shopee-label">Video sản phẩm</span>
                <div className="shopee-gallery">
                  {form.gallery_video ? (
                    <div className="shopee-gallery-item shopee-video-item">
                      <video src={videoPreview} muted playsInline />
                      <button
                        type="button"
                        className="shopee-gallery-remove"
                        onClick={onVideoRemove}
                        aria-label="Xóa video"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <label className="shopee-upload-box shopee-gallery-add">
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime"
                        onChange={onVideoUpload}
                        disabled={uploadingField === 'video'}
                        hidden
                      />
                      <span className="shopee-upload-icon">+</span>
                      <span>Thêm video</span>
                    </label>
                  )}
                </div>
                {uploadingField === 'video' && (
                  <p className="shopee-hint">Đang tải video...</p>
                )}
              </div>

              <div className="shopee-field">
                <span className="shopee-label">
                  Tên sản phẩm <em>*</em>
                </span>
                <input
                  name="name"
                  value={form.name}
                  onChange={onChange}
                  maxLength={120}
                  className="shopee-input"
                  required
                />
                <span className="shopee-counter">{form.name.length}/120</span>
              </div>

              <div className="shopee-field">
                <span className="shopee-label">
                  Danh mục <em>*</em>
                </span>
                {addingCategory ? (
                  <div className="shopee-category-add">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="shopee-input"
                      placeholder="Tên danh mục mới, vd: Vở học sinh"
                      maxLength={120}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddCategory()
                        }
                      }}
                    />
                    <div className="shopee-category-add-actions">
                      <button
                        type="button"
                        className="shopee-btn shopee-btn--primary"
                        onClick={handleAddCategory}
                        disabled={creatingCategory || !newCategoryName.trim()}
                      >
                        {creatingCategory ? 'Đang thêm...' : 'Thêm danh mục'}
                      </button>
                      <button
                        type="button"
                        className="shopee-btn shopee-btn--ghost"
                        onClick={cancelAddCategory}
                        disabled={creatingCategory}
                      >
                        Hủy
                      </button>
                    </div>
                    {categoryAddError && (
                      <p className="shopee-field-error">{categoryAddError}</p>
                    )}
                  </div>
                ) : (
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleCategoryChange}
                    className="shopee-input"
                    required
                  >
                    <option value="" disabled>
                      Chọn danh mục
                    </option>
                    {categories.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                    <option value="__add__">＋ Thêm danh mục mới...</option>
                  </select>
                )}
              </div>
            </div>

            <div className="shopee-panel shopee-panel--section">
              <h2>Mô tả</h2>
              <div className="shopee-field">
                <span className="shopee-label">
                  Mô tả sản phẩm <em>*</em>
                </span>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={onChange}
                  maxLength={3000}
                  rows={12}
                  className="shopee-textarea"
                />
                <span className="shopee-counter">{form.description.length}/3000</span>
              </div>
            </div>

            <div className="shopee-panel shopee-panel--section">
              <h2>Thông tin bán hàng</h2>

              {!hasVariants ? (
                <>
                  <div className="shopee-field">
                    <span className="shopee-label">Phân loại hàng</span>
                    <button
                      type="button"
                      className="shopee-add-variant-btn"
                      onClick={enableVariants}
                    >
                      + Thêm nhóm phân loại
                    </button>
                  </div>
                  <div className="shopee-field">
                    <span className="shopee-label">
                      Giá <em>*</em>
                    </span>
                    <div className="shopee-price-input">
                      <span>₫</span>
                      <input
                        name="price"
                        type="number"
                        min="1000"
                        step="1000"
                        value={form.price}
                        onChange={onChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="shopee-field">
                    <span className="shopee-label">Kho hàng</span>
                    <input
                      type="number"
                      min="0"
                      value={simpleStock}
                      onChange={(e) => setSimpleStock(e.target.value)}
                      className="shopee-input"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="shopee-field">
                    <span className="shopee-label">
                      Phân loại hàng <em>*</em>
                    </span>
                    <div className="shopee-variant-stack">
                      {variantGroups.map((group, groupIndex) => (
                        <div key={group.id} className="shopee-variant-box">
                          <button
                            type="button"
                            className="shopee-variant-box-close"
                            onClick={() =>
                              variantGroups.length <= 1
                                ? disableVariants()
                                : removeGroup(groupIndex)
                            }
                            aria-label="Xóa nhóm phân loại"
                          >
                            ×
                          </button>

                          <div className="shopee-variant-row">
                            <span className="shopee-variant-row-label">
                              Phân loại {groupIndex + 1}
                            </span>
                            <div className="shopee-variant-row-field">
                              <div className="shopee-variant-input-wrap">
                                <input
                                  value={group.name}
                                  onChange={(e) =>
                                    updateGroupName(groupIndex, e.target.value)
                                  }
                                  maxLength={14}
                                  placeholder="Nhập"
                                  className="shopee-input shopee-input--variant"
                                  aria-label={`Tên phân loại ${groupIndex + 1}`}
                                />
                                <span className="shopee-variant-inline-counter">
                                  {group.name.length}/14
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="shopee-variant-row shopee-variant-row--options">
                            <span className="shopee-variant-row-label">
                              Tùy chọn
                            </span>
                            <div className="shopee-variant-options-grid">
                              {group.options.map((opt, optionIndex) => (
                                <div
                                  key={opt.id}
                                  className="shopee-variant-option"
                                >
                                  <div className="shopee-variant-input-wrap">
                                    <input
                                      value={opt.label}
                                      onChange={(e) =>
                                        updateOption(
                                          groupIndex,
                                          optionIndex,
                                          e.target.value,
                                        )
                                      }
                                      maxLength={20}
                                      placeholder="Nhập"
                                      className="shopee-input shopee-input--variant"
                                    />
                                    <span className="shopee-variant-inline-counter">
                                      {opt.label.length}/20
                                    </span>
                                  </div>
                                  {opt.label.trim() && (
                                    <button
                                      type="button"
                                      className="shopee-variant-remove"
                                      onClick={() =>
                                        removeOption(groupIndex, optionIndex)
                                      }
                                      aria-label="Xóa tùy chọn"
                                    >
                                      <img src={ICON_TRASH} alt="" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}

                      {variantGroups.length < 2 && (
                        <button
                          type="button"
                          className="shopee-add-variant-btn"
                          onClick={addGroup}
                        >
                          + Thêm nhóm phân loại 2
                        </button>
                      )}

                      {skuTableRows.length > 0 && (
                        <div className="shopee-sku-table-wrap shopee-sku-table-wrap--panel">
                          <table className="shopee-sku-table shopee-sku-table--styled">
                            <thead>
                              <tr>
                                <th>
                                  {activeGroups[0]?.name?.trim() ||
                                    'Phân loại 1'}
                                </th>
                                {activeGroups.length > 1 && (
                                  <th>
                                    {activeGroups[1]?.name?.trim() ||
                                      'Phân loại 2'}
                                  </th>
                                )}
                                <th>
                                  Giá <em>*</em>
                                </th>
                                <th>
                                  Kho hàng <em>*</em>
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {skuTableRows.map((row) => {
                                const sku = variantSkus[row.skuIndex]
                                const showGroupCell = activeGroups.length > 1
                                const imagePreviewKey = `sku-opt-${row.col0?.optionId}`

                                return (
                                  <tr key={sku.optionIds.join('-')}>
                                    {row.col0?.show && (
                                      <td
                                        rowSpan={
                                          showGroupCell
                                            ? row.col0.rowSpan
                                            : undefined
                                        }
                                        className="shopee-sku-group-cell"
                                      >
                                        <div className="shopee-sku-group">
                                          <label className="shopee-sku-thumb-upload">
                                            {row.col0.image ? (
                                              <img
                                                src={previewFor(
                                                  imagePreviewKey,
                                                  row.col0.image,
                                                )}
                                                alt=""
                                                className="shopee-sku-thumb"
                                              />
                                            ) : (
                                              <span className="shopee-sku-thumb shopee-sku-thumb--empty">
                                                <img
                                                  src={ICON_ADD_IMAGE}
                                                  alt=""
                                                />
                                              </span>
                                            )}
                                            <input
                                              type="file"
                                              accept="image/jpeg,image/png,image/webp"
                                              onChange={(e) =>
                                                handleOptionImageUpload(
                                                  e,
                                                  row.col0.optionId,
                                                )
                                              }
                                              disabled={
                                                uploadingField === 'sku-image'
                                              }
                                              hidden
                                            />
                                          </label>
                                          <span className="shopee-sku-group-label">
                                            {row.col0.label}
                                          </span>
                                        </div>
                                      </td>
                                    )}
                                    {row.col1 && (
                                      <td className="shopee-sku-option-cell">
                                        <span className="shopee-sku-option-pill">
                                          {row.col1.label}
                                        </span>
                                      </td>
                                    )}
                                    <td className="shopee-sku-price-cell">
                                      <div className="shopee-price-input shopee-price-input--compact shopee-price-input--sku">
                                        <span>₫</span>
                                        <input
                                          type="number"
                                          min="1000"
                                          step="1000"
                                          value={sku.price}
                                          onChange={(e) =>
                                            updateSkuField(
                                              row.skuIndex,
                                              'price',
                                              e.target.value,
                                            )
                                          }
                                          placeholder="0"
                                        />
                                      </div>
                                    </td>
                                    <td className="shopee-sku-stock-cell">
                                      <input
                                        type="number"
                                        min="0"
                                        value={sku.stock}
                                        onChange={(e) =>
                                          updateSkuField(
                                            row.skuIndex,
                                            'stock',
                                            e.target.value,
                                          )
                                        }
                                        className="shopee-input shopee-input--compact shopee-input--stock"
                                        placeholder="0"
                                      />
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {formError && <p className="shopee-form-error">{formError}</p>}

            <footer className="shopee-form-footer">
              <button type="button" className="shopee-btn shopee-btn--ghost" onClick={onCancel}>
                Hủy
              </button>
              <button
                type="submit"
                className="shopee-btn shopee-btn--primary"
                disabled={saving || !!uploadingField}
              >
                {saving ? 'Đang lưu...' : 'Lưu & Hiển thị'}
              </button>
            </footer>
          </form>
        </div>

        <aside className="shopee-preview">
          <div className="shopee-preview-card">
            <h3>Xem trước</h3>
            <div className="shopee-preview-phone">
              <div className="shopee-preview-image">
                {previewImage ? (
                  <img src={previewImage} alt="" />
                ) : (
                  <span>Ảnh sản phẩm</span>
                )}
              </div>
              <p className="shopee-preview-name">{form.name || 'Tên sản phẩm'}</p>
              <p className="shopee-preview-price">
                {hasVariants && displayListPrice
                  ? `từ ${formatPrice(displayListPrice)}`
                  : displayListPrice
                    ? formatPrice(displayListPrice)
                    : '0 ₫'}
              </p>
              <p className="shopee-preview-variants">
                {hasVariants
                  ? `${variantPreview.label} · giá từ ${displayListPrice ? formatPrice(displayListPrice) : '0 ₫'}`
                  : 'Không có phân loại'}
              </p>
              {hasVariants && activeGroups[0] && (
                <div className="shopee-preview-swatch-row">
                  {activeGroups[0].options
                    .filter((o) => o.label.trim())
                    .map((opt) => (
                      <span
                        key={opt.id}
                        className="shopee-preview-swatch"
                        style={{ backgroundColor: hexForLabel(opt.label) }}
                        title={opt.label}
                      />
                    ))}
                </div>
              )}
              <div className="shopee-preview-actions">
                <span className="shopee-preview-chat">Chat</span>
                <span className="shopee-preview-buy">Mua ngay</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
