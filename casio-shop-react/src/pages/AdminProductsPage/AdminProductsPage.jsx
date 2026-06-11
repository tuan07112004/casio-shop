import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useAdminToast } from '../../context/AdminToastContext'
import AdminProductFormShopee from '../AdminProductFormPage/AdminProductFormShopee'
import { fetchProducts } from '../../api/client'
import {
  apiAdminCreateProduct,
  apiAdminUpdateProduct,
  apiAdminDeleteProduct,
  apiAdminUploadImage,
  apiAdminUploadVideo,
} from '../../api/adminProducts'
import { formatPrice, productImageSrc } from '../../utils/format'
import {
  buildVariantsPayload,
  getActiveVariantGroups,
  getMinSkuPrice,
  getProductTotalStock,
  getSkuDisplayLabel,
  syncLegacyFieldsFromVariants,
  variantsFromLegacyProduct,
} from '../../utils/productVariants'
import {
  formatProductListPrice,
  getProductListPrice,
} from '../../utils/productCard'
import { apiAdminCreateCategory } from '../../api/categories'
import { useCategories } from '../../context/CategoriesContext'
import './AdminProductsPage.css'

const ICON_PEN = '/images/icon/pen.png'
const ICON_TRASH = '/images/icon/iconTrash.png'

const SORT_OPTIONS = [
  { key: 'default', label: 'Mặc định' },
  { key: 'price', label: 'Giá' },
  { key: 'stock', label: 'Kho hàng' },
]

const EMPTY_FORM = {
  name: '',
  price: '',
  image: '',
  category: '',
  description: '',
  hover_image: '',
  price_like_new: '',
  price_85: '',
  price_70: '',
  price_55: '',
  colorKeys: [],
  gallery_images: [],
  gallery_main_image: '',
  gallery_video: '',
  variantsData: null,
  simpleStock: '',
}

function syncGalleryFields(images) {
  return {
    gallery_images: images,
    image: images[0] || '',
    hover_image: images[1] || '',
    gallery_main_image: images[0] || '',
  }
}

function buildGalleryImages(product) {
  if (product.galleryImages?.length) {
    return product.galleryImages.map((p) => String(p).trim()).filter(Boolean)
  }

  const images = []
  const add = (path) => {
    const value = String(path || '').trim()
    if (value && !images.includes(value)) images.push(value)
  }

  add(product.imagePath || product.image)
  add(product.hoverImagePath)
  return images
}

function parseOptionalPrice(value) {
  if (value === '' || value == null) return null
  const n = Number(value)
  return Number.isInteger(n) && n >= 1000 ? n : null
}

function productToForm(product) {
  const variantsData = variantsFromLegacyProduct(product)
  const simpleStock =
    product.variants?.skus?.length === 1 &&
    !(product.variants.skus[0].optionIds || []).length
      ? String(product.variants.skus[0].stock ?? '')
      : ''

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
    colorKeys: [],
    gallery_images: buildGalleryImages(product),
    gallery_main_image: product.galleryMainImagePath || product.imagePath || '',
    gallery_video: product.galleryVideo || '',
    variantsData,
    simpleStock,
  }
}

export default function AdminProductsPage({ addMode = false }) {
  const { token } = useAuth()
  const { showToast } = useAdminToast()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [uploadingField, setUploadingField] = useState('')
  const [localPreviews, setLocalPreviews] = useState({})
  const [formError, setFormError] = useState('')
  const [sortBy, setSortBy] = useState('default')
  const [sortDir, setSortDir] = useState('asc')
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [pendingGallery, setPendingGallery] = useState([])
  const { categories, refresh: refreshCategories } = useCategories()

  const sortedProducts = useMemo(() => {
    const list = [...products]
    if (sortBy === 'default') return list

    list.sort((a, b) => {
      let cmp = 0
      if (sortBy === 'price') {
        cmp = getProductListPrice(a) - getProductListPrice(b)
      } else if (sortBy === 'stock') {
        const sa = getProductTotalStock(a)
        const sb = getProductTotalStock(b)
        cmp = (sa ?? -1) - (sb ?? -1)
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return list
  }, [products, sortBy, sortDir])

  const handleSort = (key) => {
    if (key === 'default') {
      setSortBy('default')
      setSortDir('asc')
      return
    }
    if (sortBy === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(key)
      setSortDir('asc')
    }
  }

  const loadProducts = () =>
    fetchProducts()
      .then(setProducts)
      .catch((e) => setError(e.message))

  useEffect(() => {
    loadProducts().finally(() => setLoading(false))
  }, [])

  const resetForm = () => {
    pendingGallery.forEach((item) => URL.revokeObjectURL(item.previewUrl))
    setPendingGallery([])
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

  useEffect(() => {
    if (!addMode || loading) return
    resetForm()
  }, [addMode, loading])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const normalizePastedImageFile = (file) => {
    if (file.name) return file
    const ext = file.type.split('/')[1]?.replace('jpeg', 'jpg') || 'png'
    return new File([file], `pasted-${Date.now()}.${ext}`, { type: file.type })
  }

  const uploadGalleryFile = useCallback(
    async (rawFile, category) => {
      if (!rawFile || !category?.trim()) return false

      const file = normalizePastedImageFile(rawFile)

      if (!file.type.startsWith('image/')) {
        setFormError('Chỉ chấp nhận file ảnh (JPG, PNG, WebP).')
        return false
      }
      if (file.size > 2 * 1024 * 1024) {
        setFormError('Ảnh tối đa 2MB.')
        return false
      }

      let previewKey = ''
      let imageIndex = 0
      let productName = ''
      setForm((prev) => {
        imageIndex = prev.gallery_images?.length || 0
        productName = prev.name || ''
        previewKey = `gallery-${imageIndex}`
        return prev
      })

      const previewUrl = URL.createObjectURL(file)
      setLocalPreviews((prev) => ({ ...prev, [previewKey]: previewUrl }))
      setUploadingField('gallery')
      setFormError('')

      try {
        const path = await apiAdminUploadImage(token, file, category, {
          productName,
          imageIndex,
        })
        setForm((prev) => {
          const images = [...(prev.gallery_images || []), path]
          return { ...prev, ...syncGalleryFields(images) }
        })
        return true
      } catch (err) {
        setFormError(err.message || 'Không tải được ảnh.')
        setLocalPreviews((prev) => {
          const next = { ...prev }
          delete next[previewKey]
          return next
        })
        return false
      } finally {
        setUploadingField('')
      }
    },
    [token],
  )

  const uploadGalleryImage = useCallback(
    async (rawFile) => {
      if (!rawFile) return false

      const file = normalizePastedImageFile(rawFile)

      if (!file.type.startsWith('image/')) {
        setFormError('Chỉ chấp nhận file ảnh (JPG, PNG, WebP).')
        return false
      }
      if (file.size > 2 * 1024 * 1024) {
        setFormError('Ảnh tối đa 2MB.')
        return false
      }

      if (!form.category?.trim()) {
        const id = `pending-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
        setPendingGallery((prev) => [
          ...prev,
          { id, file, previewUrl: URL.createObjectURL(file) },
        ])
        setFormError('')
        return true
      }

      return uploadGalleryFile(file, form.category)
    },
    [form.category, uploadGalleryFile],
  )

  useEffect(() => {
    if (!form.category?.trim()) return

    setPendingGallery((prev) => {
      if (!prev.length) return prev

      const queue = [...prev]
      ;(async () => {
        for (const item of queue) {
          await uploadGalleryFile(item.file, form.category)
          URL.revokeObjectURL(item.previewUrl)
        }
      })()

      return []
    })
  }, [form.category, uploadGalleryFile])

  const handleGalleryUpload = async (e) => {
    const file = e.target.files?.[0]
    await uploadGalleryImage(file)
    e.target.value = ''
  }

  useEffect(() => {
    if (!addMode && !editingId) return

    const onPaste = async (e) => {
      const items = e.clipboardData?.items
      if (!items?.length) return

      const imageFiles = []
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) imageFiles.push(file)
        }
      }
      if (!imageFiles.length) return

      e.preventDefault()
      e.stopPropagation()
      for (const file of imageFiles) {
        await uploadGalleryImage(file)
      }
    }

    document.addEventListener('paste', onPaste, true)
    return () => document.removeEventListener('paste', onPaste, true)
  }, [addMode, editingId, uploadGalleryImage])

  const handleGalleryRemove = (index) => {
    setForm((prev) => {
      const images = (prev.gallery_images || []).filter((_, i) => i !== index)
      return { ...prev, ...syncGalleryFields(images) }
    })
    setLocalPreviews((prev) => {
      const next = { ...prev }
      delete next[`gallery-${index}`]
      return next
    })
  }

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!form.category?.trim()) {
      setFormError('Vui lòng chọn danh mục trước khi tải video.')
      return
    }

    if (!file.type.startsWith('video/')) {
      setFormError('Chỉ chấp nhận file video (MP4, WebM).')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      setFormError('Video tối đa 20MB.')
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setLocalPreviews((prev) => ({ ...prev, video: previewUrl }))
    setUploadingField('video')
    setFormError('')

    try {
      const path = await apiAdminUploadVideo(token, file, form.category)
      setForm((prev) => ({ ...prev, gallery_video: path }))
    } catch (err) {
      setFormError(err.message || 'Không tải được video.')
      setLocalPreviews((prev) => {
        const next = { ...prev }
        delete next.video
        return next
      })
    } finally {
      setUploadingField('')
      e.target.value = ''
    }
  }

  const handleVideoRemove = () => {
    setForm((prev) => ({ ...prev, gallery_video: '' }))
    setLocalPreviews((prev) => {
      const next = { ...prev }
      delete next.video
      return next
    })
  }

  const handleSkuImageUpload = async (file, previewKey) => {
    if (!file.type.startsWith('image/')) {
      throw new Error('Chỉ chấp nhận file ảnh (JPG, PNG, WebP).')
    }
    if (file.size > 2 * 1024 * 1024) {
      throw new Error('Ảnh tối đa 2MB.')
    }

    const previewUrl = URL.createObjectURL(file)
    setLocalPreviews((prev) => ({ ...prev, [previewKey]: previewUrl }))
    setUploadingField('sku-image')

    try {
      return await apiAdminUploadImage(token, file, form.category)
    } finally {
      setUploadingField('')
    }
  }

  const buildPayload = (sourceForm = form) => {
    const name = sourceForm.name.trim()
    const image = sourceForm.image.trim()
    const category = sourceForm.category

    const variants = buildVariantsPayload(
      sourceForm.variantsData,
      Number(sourceForm.price),
      sourceForm.simpleStock,
    )
    const legacy = syncLegacyFieldsFromVariants(variants, category)
    const minVariantPrice = getMinSkuPrice(variants?.skus)
    const price =
      variants?.skus?.length && minVariantPrice != null
        ? minVariantPrice
        : Number(sourceForm.price)

    return {
      name,
      price,
      image,
      category,
      description: sourceForm.description.trim() || null,
      hover_image: sourceForm.hover_image.trim() || null,
      gallery_main_image: sourceForm.gallery_main_image.trim() || null,
      gallery_video: sourceForm.gallery_video.trim() || null,
      gallery_images: (sourceForm.gallery_images || [])
        .map((p) => String(p).trim())
        .filter(Boolean),
      variants,
      colors: legacy.colors,
      price_like_new: legacy.price_like_new,
      price_85: legacy.price_85,
      price_70: legacy.price_70,
      price_55: legacy.price_55,
    }
  }

  const handleSubmit = async (e, formOverride, variantMeta) => {
    e.preventDefault()
    setFormError('')

    const data = formOverride || form
    const name = data.name.trim()
    const image = data.image.trim()
    if (!name) return setFormError('Vui lòng nhập tên sản phẩm.')
    if (!data.category?.trim()) {
      return setFormError('Vui lòng chọn danh mục sản phẩm.')
    }
    if (!image) return setFormError('Vui lòng tải ít nhất ảnh bìa (ảnh đầu tiên).')
    if (!editingId && !data.description?.trim()) {
      return setFormError('Vui lòng nhập mô tả sản phẩm.')
    }
    if (uploadingField)
      return setFormError('Đang tải file, vui lòng đợi.')

    if (variantMeta?.hasVariants) {
      const activeGroups = getActiveVariantGroups(variantMeta.variantGroups || [])
      if (!activeGroups.length) {
        return setFormError(
          'Vui lòng nhập ít nhất một nhóm phân loại có tên và tùy chọn (vd: Loại máy → 570VN). Phân loại 2 không bắt buộc — để trống sẽ bỏ qua.',
        )
      }

      const previewVariants = buildVariantsPayload(
        {
          groups: variantMeta.variantGroups,
          skus: variantMeta.variantSkus,
        },
        0,
        '',
      )
      const skus = previewVariants?.skus || []

      if (!skus.length) {
        return setFormError(
          'Vui lòng nhập giá (tối thiểu 1.000đ) cho ít nhất một phân loại trong bảng.',
        )
      }

      for (const sku of skus) {
        const skuPrice = Number(sku.price)
        const label =
          getSkuDisplayLabel(previewVariants.groups, sku) || 'phân loại'
        if (!Number.isInteger(skuPrice) || skuPrice < 1000) {
          return setFormError(`Giá "${label}" phải tối thiểu 1.000đ.`)
        }
        if (sku.stock !== '' && sku.stock != null) {
          const stock = Number(sku.stock)
          if (!Number.isInteger(stock) || stock < 0) {
            return setFormError('Kho hàng phải là số nguyên không âm.')
          }
        }
      }
    } else {
      const price = Number(data.price)
      if (!Number.isInteger(price) || price < 1000) {
        return setFormError('Giá phải là số nguyên, tối thiểu 1.000đ.')
      }
      const stockRaw = data.simpleStock
      if (stockRaw !== '' && stockRaw != null) {
        const stock = Number(stockRaw)
        if (!Number.isInteger(stock) || stock < 0) {
          return setFormError('Kho hàng phải là số nguyên không âm.')
        }
      }
    }

    const payload = buildPayload(data)

    const wasNew = !editingId
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
      showToast(
        wasNew ? 'Bạn đã thêm sản phẩm thành công' : 'Bạn đã sửa sản phẩm thành công',
      )
      resetForm()
      navigate('/admin/san-pham')
    } catch (err) {
      setFormError(err.message || 'Không lưu được sản phẩm.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelForm = () => {
    resetForm()
    navigate('/admin/san-pham')
  }

  const handleDelete = async (product) => {
    if (!window.confirm(`Xóa "${product.name}"?`)) return

    try {
      await apiAdminDeleteProduct(token, product.id)
      setProducts((prev) => prev.filter((p) => p.id !== product.id))
      if (editingId === product.id) resetForm()
      showToast('Bạn đã xóa sản phẩm thành công')
    } catch (err) {
      alert(err.message || 'Không xóa được sản phẩm.')
    }
  }

  const previewFor = (field, path) => {
    if (localPreviews[field]) return localPreviews[field]
    return path ? productImageSrc(path) : ''
  }

  const handleCreateCategory = async (label) => {
    const name = String(label || '').trim()
    if (!name) throw new Error('Vui lòng nhập tên danh mục.')

    setCreatingCategory(true)
    setFormError('')
    try {
      const category = await apiAdminCreateCategory(token, { label: name })
      await refreshCategories()
      setForm((prev) => ({ ...prev, category: category.slug }))
      return category
    } finally {
      setCreatingCategory(false)
    }
  }

  if (loading) return <p className="admin-products">Đang tải...</p>
  if (error) return <p className="admin-products admin-products--error">{error}</p>

  if (addMode || editingId) {
    return (
      <AdminProductFormShopee
        form={form}
        setForm={setForm}
        editingId={editingId}
        saving={saving}
        uploadingField={uploadingField}
        formError={formError}
        localPreviews={localPreviews}
        onChange={handleChange}
        onGalleryUpload={handleGalleryUpload}
        onGalleryPaste={uploadGalleryImage}
        pendingGallery={pendingGallery}
        onPendingGalleryRemove={(id) => {
          setPendingGallery((prev) => {
            const item = prev.find((p) => p.id === id)
            if (item) URL.revokeObjectURL(item.previewUrl)
            return prev.filter((p) => p.id !== id)
          })
        }}
        onGalleryRemove={handleGalleryRemove}
        onVideoUpload={handleVideoUpload}
        onVideoRemove={handleVideoRemove}
        onSkuImageUpload={handleSkuImageUpload}
        onSubmit={handleSubmit}
        onCancel={editingId ? resetForm : handleCancelForm}
        previewFor={previewFor}
        categories={categories}
        onCreateCategory={handleCreateCategory}
        creatingCategory={creatingCategory}
      />
    )
  }

  return (
    <div className="admin-products">
      <header className="admin-products-header">
        <h1>Tất cả sản phẩm</h1>
      </header>

      <section className="admin-products-list">
        <div className="admin-products-list-head">
          <h2>Danh sách ({products.length})</h2>
          {products.length > 0 && (
            <div className="admin-products-sort">
              <span className="admin-products-sort-label">Sắp xếp theo:</span>
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  className={`admin-products-sort-btn${
                    sortBy === opt.key ? ' admin-products-sort-btn--active' : ''
                  }`}
                  onClick={() => handleSort(opt.key)}
                >
                  {opt.label}
                  {sortBy === opt.key && opt.key !== 'default' && (
                    <span className="admin-products-sort-arrow" aria-hidden>
                      {sortDir === 'asc' ? ' ↑' : ' ↓'}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        {products.length === 0 ? (
          <p className="admin-products-empty">Chưa có sản phẩm.</p>
        ) : (
          <div className="admin-products-grid-shopee">
            {sortedProducts.map((product) => {
              const stock = getProductTotalStock(product)

              return (
                <article key={product.id} className="admin-product-card">
                  <button
                    type="button"
                    className="admin-product-card-image"
                    onClick={() => startEdit(product)}
                    aria-label={`Sửa ${product.name}`}
                    title="Sửa sản phẩm"
                  >
                    <img src={product.image} alt="" />
                  </button>
                  <div className="admin-product-card-body">
                    <h3 className="admin-product-card-name">{product.name}</h3>
                    <p className="admin-product-card-price">
                      {formatProductListPrice(product, formatPrice)}
                    </p>
                    <p className="admin-product-card-stock">
                      Kho hàng{' '}
                      <span>{stock != null ? stock : '—'}</span>
                    </p>
                  </div>
                  <footer className="admin-product-card-actions">
                    <button
                      type="button"
                      className="admin-product-card-action admin-product-card-action--edit"
                      onClick={() => startEdit(product)}
                      aria-label={`Sửa ${product.name}`}
                      title="Sửa"
                    >
                      <img src={ICON_PEN} alt="" />
                    </button>
                    <span
                      className="admin-product-card-actions-divider"
                      aria-hidden
                    />
                    <button
                      type="button"
                      className="admin-product-card-action admin-product-card-action--delete"
                      onClick={() => handleDelete(product)}
                      aria-label={`Xóa ${product.name}`}
                      title="Xóa"
                    >
                      <img src={ICON_TRASH} alt="" />
                    </button>
                  </footer>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <Link to="/admin/san-pham/them" className="admin-products-fab">
        + Thêm sản phẩm
      </Link>
    </div>
  )
}
