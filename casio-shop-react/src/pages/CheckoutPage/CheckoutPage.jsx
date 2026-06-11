import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { apiCreateOrder } from '../../api/orders'
import {
  apiFetchCheckoutVouchers,
  apiValidateVouchers,
} from '../../api/vouchers'
import { BANK_TRANSFER_INFO } from '../../config/payment'
import { STORE_PICKUP, storePickupOrderAddress } from '../../config/store'
import { formatPrice, isValidEmail, EMAIL_ERROR_MSG } from '../../utils/format'
import { formatVoucherOffer } from '../../utils/voucher'
import {
  apiGhnDistricts,
  apiGhnProvinces,
  apiGhnQuote,
  apiGhnStatus,
  apiGhnWards,
  prefetchGhnProvinces,
} from '../../api/shipping'
import {
  fetchProvinces,
  fetchDistricts,
  fetchWards,
  formatFullAddress,
  STANDARD_SHIPPING_FEE,
} from '../../utils/vietnamAddress'
import './CheckoutPage.css'

function cartItemsPayload(items) {
  return items.map((item) => ({
    product_id: item.productId,
    quantity: item.quantity,
    option_ids: item.optionIds?.length ? item.optionIds : undefined,
  }))
}

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { user, token, isLoggedIn } = useAuth()
  const { items, totalPrice, clearCart } = useCart()

  const [form, setForm] = useState({
    guest_name: user?.name || '',
    guest_phone: '',
    guest_email: user?.email || '',
    street: '',
    payment_method: 'cod',
    note: '',
  })
  const [provinces, setProvinces] = useState([])
  const [districts, setDistricts] = useState([])
  const [wards, setWards] = useState([])
  const [provinceCode, setProvinceCode] = useState('')
  const [districtCode, setDistrictCode] = useState('')
  const [wardCode, setWardCode] = useState('')
  const [districtLoading, setDistrictLoading] = useState(false)
  const [wardLoading, setWardLoading] = useState(false)

  const [voucherInput, setVoucherInput] = useState('')
  const [appliedVouchers, setAppliedVouchers] = useState([])
  const [voucherError, setVoucherError] = useState('')
  const [voucherLoading, setVoucherLoading] = useState(false)
  const [availableVouchers, setAvailableVouchers] = useState([])
  const [showVoucherList, setShowVoucherList] = useState(false)

  const [deliveryType, setDeliveryType] = useState('delivery')
  const [ghnEnabled, setGhnEnabled] = useState(false)
  const [ghnAddresses, setGhnAddresses] = useState(false)
  const [ghnSetup, setGhnSetup] = useState(null)
  const [shippingQuote, setShippingQuote] = useState(null)
  const [shippingLoading, setShippingLoading] = useState(false)
  const [shippingError, setShippingError] = useState('')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const cartWeight = useMemo(
    () =>
      Math.max(
        500,
        items.reduce((sum, item) => sum + item.quantity * 300, 0),
      ),
    [items],
  )

  const subtotal = totalPrice
  const isPickup = deliveryType === 'pickup'
  const shippingFee = isPickup
    ? 0
    : ghnEnabled && shippingQuote
      ? shippingQuote.fee
      : ghnAddresses
        ? 0
        : provinceCode
          ? STANDARD_SHIPPING_FEE
          : 0
  const discount = appliedVouchers.reduce((sum, v) => sum + (v.discount || 0), 0)
  const shippingDiscount = appliedVouchers.reduce(
    (sum, v) => sum + (v.free_shipping ? v.shipping_discount || 0 : 0),
    0,
  )
  const hasFreeShipVoucher = appliedVouchers.some((v) => v.free_shipping)
  const canAddVoucher = appliedVouchers.length < 2
  const chargedShipping = Math.max(0, shippingFee - shippingDiscount)
  const grandTotal = Math.max(0, subtotal - discount + chargedShipping)

  const provinceName = ghnAddresses
    ? provinces.find((p) => String(p.id) === provinceCode)?.name
    : provinces.find((p) => String(p.code) === provinceCode)?.name
  const districtName = ghnAddresses
    ? districts.find((d) => String(d.id) === districtCode)?.name
    : districts.find((d) => String(d.code) === districtCode)?.name
  const wardName = ghnAddresses
    ? wards.find((w) => String(w.code) === wardCode)?.name
    : wards.find((w) => String(w.code) === wardCode)?.name

  useEffect(() => {
    const statusPromise = apiGhnStatus()
    const provincesPromise = prefetchGhnProvinces().catch(() => null)

    statusPromise
      .then(async (status) => {
        const useGhnAddresses = !!(status.addresses_available || status.enabled)
        setGhnEnabled(!!status.enabled)
        setGhnAddresses(useGhnAddresses)
        setGhnSetup(status.setup || null)
        if (useGhnAddresses) {
          const cached = await provincesPromise
          if (cached) {
            setProvinces(cached)
            return
          }
          return apiGhnProvinces().then(setProvinces)
        }
        return fetchProvinces().then(setProvinces)
      })
      .catch(() => fetchProvinces().then(setProvinces))
  }, [])

  useEffect(() => {
    if (!items.length) return
    apiFetchCheckoutVouchers(items.map((i) => i.productId))
      .then(setAvailableVouchers)
      .catch(() => setAvailableVouchers([]))
  }, [items])

  useEffect(() => {
    if (!provinceCode) {
      setDistricts([])
      setDistrictCode('')
      return
    }
    setDistrictLoading(true)
    setShippingQuote(null)
    setShippingError('')
    const loadDistricts = ghnAddresses
      ? apiGhnDistricts(provinceCode)
      : fetchDistricts(provinceCode)
    loadDistricts
      .then(setDistricts)
      .catch(() => setDistricts([]))
      .finally(() => setDistrictLoading(false))
    setDistrictCode('')
    setWardCode('')
    setWards([])
  }, [provinceCode, ghnAddresses])

  useEffect(() => {
    if (!districtCode) {
      setWards([])
      setWardCode('')
      return
    }
    setWardLoading(true)
    setShippingQuote(null)
    setShippingError('')
    const loadWards = ghnAddresses
      ? apiGhnWards(districtCode)
      : fetchWards(districtCode)
    loadWards
      .then(setWards)
      .catch(() => setWards([]))
      .finally(() => setWardLoading(false))
    setWardCode('')
  }, [districtCode, ghnAddresses])

  useEffect(() => {
    if (isPickup || !ghnEnabled || !districtCode || !wardCode) {
      setShippingQuote(null)
      setShippingLoading(false)
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(() => {
      setShippingLoading(true)
      setShippingError('')
      apiGhnQuote({
        toDistrictId: Number(districtCode),
        toWardCode: wardCode,
        weight: cartWeight,
        signal: controller.signal,
      })
        .then(setShippingQuote)
        .catch((err) => {
          if (err.name === 'AbortError') return
          setShippingQuote(null)
          setShippingError(err.message || 'Không tính được phí GHN.')
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setShippingLoading(false)
          }
        })
    }, 350)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [isPickup, ghnEnabled, districtCode, wardCode, cartWeight])

  useEffect(() => {
    if (!appliedVouchers.length || voucherLoading) return
    if (isPickup && appliedVouchers.some((v) => v.free_shipping)) {
      setAppliedVouchers((prev) => prev.filter((v) => !v.free_shipping))
      setVoucherError('Mã miễn phí ship không áp dụng khi nhận tại cửa hàng.')
      return
    }
    if (appliedVouchers.some((v) => v.free_shipping) && shippingFee <= 0) return

    apiValidateVouchers(
      appliedVouchers.map((v) => v.code),
      cartItemsPayload(items),
      { shippingFee, deliveryType },
    )
      .then((result) => setAppliedVouchers(result.items || []))
      .catch((err) => {
        setAppliedVouchers([])
        setVoucherError(err.message || 'Mã không còn hợp lệ.')
      })
  }, [shippingFee, deliveryType, isPickup])

  const visibleVouchers = useMemo(
    () => availableVouchers.slice(0, showVoucherList ? 8 : 2),
    [availableVouchers, showVoucherList],
  )

  if (items.length === 0) {
    return (
      <div className="checkout-page">
        <h1 className="checkout-title">Thanh toán</h1>
        <p className="checkout-empty">Giỏ hàng trống.</p>
        <Link to="/cua-hang">Mua sắm ngay</Link>
      </div>
    )
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const applyVoucher = async (code) => {
    const normalized = String(code || '').trim().toUpperCase()
    if (!normalized) return setVoucherError('Vui lòng nhập mã giảm giá.')
    if (!canAddVoucher) {
      return setVoucherError('Chỉ được áp dụng tối đa 2 mã giảm giá.')
    }
    if (appliedVouchers.some((v) => v.code === normalized)) {
      return setVoucherError('Mã này đã được áp dụng.')
    }

    setVoucherError('')
    setVoucherLoading(true)
    try {
      const result = await apiValidateVouchers(
        [...appliedVouchers.map((v) => v.code), normalized],
        cartItemsPayload(items),
        { shippingFee, deliveryType },
      )
      setAppliedVouchers(result.items || [])
      setVoucherInput('')
    } catch (err) {
      setVoucherError(err.message || 'Mã không hợp lệ.')
    } finally {
      setVoucherLoading(false)
    }
  }

  const removeVoucher = async (code) => {
    const remaining = appliedVouchers.filter((v) => v.code !== code)
    setVoucherInput('')
    setVoucherError('')

    if (!remaining.length) {
      setAppliedVouchers([])
      return
    }

    setVoucherLoading(true)
    try {
      const result = await apiValidateVouchers(
        remaining.map((v) => v.code),
        cartItemsPayload(items),
        { shippingFee, deliveryType },
      )
      setAppliedVouchers(result.items || [])
    } catch (err) {
      setAppliedVouchers([])
      setVoucherError(err.message || 'Mã không còn hợp lệ.')
    } finally {
      setVoucherLoading(false)
    }
  }

  const buildGuestAddress = () =>
    formatFullAddress({
      street: form.street.trim(),
      wardName,
      districtName,
      provinceName,
    })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.guest_name.trim()) return setError('Vui lòng nhập họ và tên.')
    if (!/^0\d{8,10}$/.test(form.guest_phone.trim()))
      return setError('Số điện thoại phải bắt đầu bằng 0 và có 9–11 số.')
    if (!isValidEmail(form.guest_email)) return setError(EMAIL_ERROR_MSG)

    let guestAddress = ''
    if (isPickup) {
      guestAddress = storePickupOrderAddress()
    } else {
      if (!form.street.trim()) return setError('Vui lòng nhập địa chỉ.')
      if (!provinceCode) return setError('Vui lòng chọn tỉnh / thành.')
      if (!districtCode) return setError('Vui lòng chọn quận / huyện.')
      if (!wardCode) return setError('Vui lòng chọn phường / xã.')
      guestAddress = buildGuestAddress()
      if (!guestAddress.trim()) return setError('Vui lòng nhập địa chỉ giao hàng.')
    }

    setLoading(true)
    try {
      if (!isPickup && ghnAddresses && !ghnEnabled) {
        return setError(
          'Chưa cấu hình địa chỉ kho GHN nên chưa tính được phí ship. Liên hệ shop hoặc cấu hình GHN_FROM_DISTRICT_ID / GHN_FROM_WARD_CODE.',
        )
      }

      if (
        !isPickup &&
        ghnEnabled &&
        (!shippingQuote || shippingFee <= 0)
      ) {
        return setError('Vui lòng đợi GHN tính phí vận chuyển hoặc chọn lại địa chỉ.')
      }

      const order = await apiCreateOrder(
        {
          guest_name: form.guest_name.trim(),
          guest_phone: form.guest_phone.trim(),
          guest_email: form.guest_email.trim(),
          guest_address: guestAddress,
          payment_method: form.payment_method,
          delivery_type: deliveryType,
          shipping_method: isPickup
            ? 'pickup'
            : ghnEnabled
              ? 'ghn'
              : 'standard',
          shipping_fee: shippingFee,
          ghn_to_district_id:
            !isPickup && ghnEnabled ? Number(districtCode) : undefined,
          ghn_to_ward_code: !isPickup && ghnEnabled ? wardCode : undefined,
          ghn_service_id: !isPickup ? shippingQuote?.service_id : undefined,
          voucher_codes: appliedVouchers.map((v) => v.code),
          note: form.note.trim() || undefined,
          items: cartItemsPayload(items),
        },
        isLoggedIn ? token : null,
      )

      clearCart()
      const qs = new URLSearchParams({
        ma: String(order.id),
        payment: form.payment_method,
        amount: String(order.totalAmount),
      })
      navigate(`/dat-hang-thanh-cong?${qs.toString()}`, { replace: true })
    } catch (err) {
      setError(err.message || 'Không đặt được hàng.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="checkout-page">
      <nav className="checkout-breadcrumb" aria-label="Breadcrumb">
        <Link to="/gio-hang">Giỏ hàng</Link>
        <span aria-hidden>›</span>
        <span>Thông tin giao hàng</span>
      </nav>

      <div className="checkout-layout">
        <form className="checkout-main" onSubmit={handleSubmit} noValidate>
          <section className="checkout-section">
            <h2 className="checkout-section-title">Thông tin giao hàng</h2>
            {!isLoggedIn && (
              <p className="checkout-login-hint">
                Bạn đã có tài khoản? <Link to="/dang-nhap">Đăng nhập</Link>
              </p>
            )}

            <label className="checkout-field">
              <span>Họ và tên</span>
              <input
                name="guest_name"
                value={form.guest_name}
                onChange={handleChange}
                required
              />
            </label>

            <div className="checkout-field-row">
              <label className="checkout-field">
                <span>Email</span>
                <input
                  name="guest_email"
                  type="email"
                  value={form.guest_email}
                  onChange={handleChange}
                  required
                />
              </label>
              <label className="checkout-field">
                <span>Số điện thoại</span>
                <input
                  name="guest_phone"
                  value={form.guest_phone}
                  onChange={handleChange}
                  placeholder="0901234567"
                  required
                />
              </label>
            </div>
          </section>

          <section className="checkout-section">
            <h2 className="checkout-section-title">Vận chuyển</h2>
            <fieldset className="checkout-radio-group">
              <label className="checkout-radio">
                <input
                  type="radio"
                  name="delivery_type"
                  value="delivery"
                  checked={deliveryType === 'delivery'}
                  onChange={() => setDeliveryType('delivery')}
                />
                Giao tận nơi
              </label>
              <label className="checkout-radio">
                <input
                  type="radio"
                  name="delivery_type"
                  value="pickup"
                  checked={deliveryType === 'pickup'}
                  onChange={() => setDeliveryType('pickup')}
                />
                Nhận tại cửa hàng
              </label>
            </fieldset>

            {isPickup ? (
              <div className="checkout-pickup-info">
                <p className="checkout-pickup-title">Địa chỉ cửa hàng</p>
                <p className="checkout-pickup-name">{STORE_PICKUP.name}</p>
                <p>{STORE_PICKUP.fullAddress}</p>
                <p>
                  Điện thoại:{' '}
                  <a href={`tel:${STORE_PICKUP.phone}`}>{STORE_PICKUP.phone}</a>
                </p>
                <p className="checkout-pickup-hours">
                  Giờ nhận hàng: {STORE_PICKUP.hours}
                </p>
              </div>
            ) : (
              <div className="checkout-address">
                <label className="checkout-field">
                  <span>Địa chỉ</span>
                  <input
                    name="street"
                    value={form.street}
                    onChange={handleChange}
                    placeholder="Số nhà, tên đường..."
                  />
                </label>
                <div className="checkout-field-row checkout-field-row--3">
                  <label className="checkout-field">
                    <span>Tỉnh / thành</span>
                    <select
                      value={provinceCode}
                      onChange={(e) => setProvinceCode(e.target.value)}
                    >
                      <option value="">Chọn tỉnh / thành</option>
                      {provinces.map((p) => (
                        <option
                          key={ghnAddresses ? p.id : p.code}
                          value={ghnAddresses ? p.id : p.code}
                        >
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="checkout-field">
                    <span>Quận / huyện</span>
                    <select
                      value={districtCode}
                      onChange={(e) => setDistrictCode(e.target.value)}
                      disabled={!provinceCode || districtLoading}
                    >
                      <option value="">Chọn quận / huyện</option>
                      {districts.map((d) => (
                        <option
                          key={ghnAddresses ? d.id : d.code}
                          value={ghnAddresses ? d.id : d.code}
                        >
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="checkout-field">
                    <span>Phường / xã</span>
                    <select
                      value={wardCode}
                      onChange={(e) => setWardCode(e.target.value)}
                      disabled={!districtCode || wardLoading}
                    >
                      <option value="">Chọn phường / xã</option>
                      {wards.map((w) => (
                        <option key={w.code} value={w.code}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            )}
          </section>

          <section className="checkout-section">
            <h2 className="checkout-section-title">Phương thức vận chuyển</h2>
            {isPickup ? (
              <label className="checkout-shipping-option">
                <input type="radio" name="shipping" checked readOnly />
                <span className="checkout-shipping-option-body">
                  <span>Nhận tại cửa hàng</span>
                  <strong>Miễn phí</strong>
                </span>
              </label>
            ) : !wardCode ? (
              <p className="checkout-shipping-placeholder">
                Vui lòng chọn đủ tỉnh / quận / phường để tính phí vận chuyển.
              </p>
            ) : ghnAddresses && !ghnEnabled ? (
              <p className="checkout-shipping-placeholder checkout-shipping-setup">
                GHN chưa có địa chỉ kho nên chưa tính được phí theo khu vực.
                {ghnSetup?.shop_needs_address
                  ? ' Vào khachhang.ghn.vn → Cài đặt cửa hàng → thêm địa chỉ lấy hàng, hoặc điền GHN_FROM_DISTRICT_ID và GHN_FROM_WARD_CODE trong backend/.env.'
                  : ' Kiểm tra GHN_FROM_DISTRICT_ID và GHN_FROM_WARD_CODE trong backend/.env.'}
              </p>
            ) : ghnEnabled ? (
              <>
                {shippingLoading && !shippingQuote && (
                  <p className="checkout-shipping-placeholder">
                    Đang lấy phí Giao Hàng Nhanh...
                  </p>
                )}
                {shippingError && (
                  <p className="checkout-voucher-error">{shippingError}</p>
                )}
                {shippingQuote && (
                  <label className="checkout-shipping-option">
                    <input type="radio" name="shipping" checked readOnly />
                    <span className="checkout-shipping-option-body">
                      <span>
                        Giao Hàng Nhanh — {shippingQuote.service_name}
                      </span>
                      <strong>{formatPrice(shippingQuote.fee)}</strong>
                    </span>
                  </label>
                )}
              </>
            ) : (
              <label className="checkout-shipping-option">
                <input type="radio" name="shipping" checked readOnly />
                <span className="checkout-shipping-option-body">
                  <span>Giao hàng tiêu chuẩn</span>
                  <strong>{formatPrice(STANDARD_SHIPPING_FEE)}</strong>
                </span>
              </label>
            )}
          </section>

          <section className="checkout-section">
            <h2 className="checkout-section-title">Phương thức thanh toán</h2>
            <div className="checkout-payment-list">
              <label
                className={`checkout-payment-card${form.payment_method === 'cod' ? ' checkout-payment-card--active' : ''}`}
              >
                <input
                  type="radio"
                  name="payment_method"
                  value="cod"
                  checked={form.payment_method === 'cod'}
                  onChange={handleChange}
                />
                <span className="checkout-payment-icon">
                  <img src="/images/icon/cod.png" alt="" />
                </span>
                <span className="checkout-payment-text">
                  <strong>Thanh toán khi giao hàng (COD)</strong>
                  <span>Thanh toán tiền mặt khi nhận hàng</span>
                </span>
              </label>

              <label
                className={`checkout-payment-card${form.payment_method === 'bank_transfer' ? ' checkout-payment-card--active' : ''}`}
              >
                <input
                  type="radio"
                  name="payment_method"
                  value="bank_transfer"
                  checked={form.payment_method === 'bank_transfer'}
                  onChange={handleChange}
                />
                <span className="checkout-payment-text">
                  <strong>Chuyển khoản ngân hàng</strong>
                  <span>
                    {BANK_TRANSFER_INFO.bank} — {BANK_TRANSFER_INFO.accountNumber} (
                    {BANK_TRANSFER_INFO.accountName})
                  </span>
                </span>
              </label>
            </div>
            {form.payment_method === 'bank_transfer' && (
              <p className="checkout-bank-hint">
                Sau khi đặt hàng, bạn sẽ nhận mã QR VietQR và nội dung chuyển khoản để
                thanh toán.
              </p>
            )}
          </section>

          <label className="checkout-field checkout-field--optional">
            <span>Ghi chú (tùy chọn)</span>
            <textarea
              name="note"
              value={form.note}
              onChange={handleChange}
              rows={2}
            />
          </label>

          {error && <p className="checkout-error">{error}</p>}

          <div className="checkout-form-footer">
            <Link to="/gio-hang" className="checkout-back-link">
              ‹ Giỏ hàng
            </Link>
            <button type="submit" className="checkout-submit" disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Hoàn tất đơn hàng'}
            </button>
          </div>
        </form>

        <aside className="checkout-sidebar">
          <ul className="checkout-items">
            {items.map((item) => (
              <li key={item.lineKey} className="checkout-item">
                <div className="checkout-item-thumb">
                  {item.image ? (
                    <img src={item.image} alt="" />
                  ) : (
                    <span />
                  )}
                  <span className="checkout-item-qty">{item.quantity}</span>
                </div>
                <div>
                  <p className="checkout-item-name">{item.name}</p>
                  {item.variantLabel && (
                    <p className="checkout-item-variant">
                      {item.variantLabel.includes('Màu')
                        ? item.variantLabel
                        : `Màu: ${item.variantLabel}`}
                    </p>
                  )}
                </div>
                <p className="checkout-item-price">
                  {formatPrice(item.price * item.quantity)}
                </p>
              </li>
            ))}
          </ul>

          <div className="checkout-voucher">
            {canAddVoucher && (
              <div className="checkout-voucher-row">
                <input
                  className="checkout-voucher-input"
                  type="text"
                  placeholder={
                    appliedVouchers.length
                      ? 'Nhập mã thứ 2'
                      : 'Mã giảm giá'
                  }
                  value={voucherInput}
                  onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                />
                <button
                  type="button"
                  className="checkout-voucher-btn"
                  onClick={() => applyVoucher(voucherInput)}
                  disabled={voucherLoading}
                >
                  {voucherLoading ? '...' : 'Sử dụng'}
                </button>
              </div>
            )}
            {voucherError && (
              <p className="checkout-voucher-error">{voucherError}</p>
            )}
            {appliedVouchers.length > 0 && (
              <ul className="checkout-voucher-applied-list">
                {appliedVouchers.map((voucher) => (
                  <li key={voucher.code} className="checkout-voucher-applied">
                    <span>
                      ✓ {voucher.code} —{' '}
                      {voucher.free_shipping
                        ? `miễn phí vận chuyển (${formatPrice(voucher.shipping_discount || shippingFee)})`
                        : `giảm ${formatPrice(voucher.discount)}`}
                    </span>
                    <button
                      type="button"
                      className="checkout-voucher-remove"
                      onClick={() => removeVoucher(voucher.code)}
                    >
                      Hủy
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {availableVouchers.length > 0 && canAddVoucher && (
              <>
                <button
                  type="button"
                  className="checkout-voucher-more"
                  onClick={() => setShowVoucherList((v) => !v)}
                >
                  {showVoucherList
                    ? 'Thu gọn mã giảm giá'
                    : 'Xem thêm mã giảm giá'}
                </button>
                <div className="checkout-voucher-tags">
                  {visibleVouchers
                    .filter(
                      (v) =>
                        !appliedVouchers.some((applied) => applied.code === v.code),
                    )
                    .map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      className="checkout-voucher-tag"
                      onClick={() => applyVoucher(v.code)}
                      disabled={voucherLoading}
                    >
                      <strong>{formatVoucherOffer(v, formatPrice)}</strong>
                      <span>{v.code}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <dl className="checkout-totals">
            <div>
              <dt>Tạm tính</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            {discount > 0 && (
              <div className="checkout-totals-discount">
                <dt>Giảm giá</dt>
                <dd>−{formatPrice(discount)}</dd>
              </div>
            )}
            <div>
              <dt>Phí vận chuyển</dt>
              <dd>
                {isPickup
                  ? 'Miễn phí'
                  : shippingFee > 0
                    ? hasFreeShipVoucher
                      ? `Miễn phí (tiết kiệm ${formatPrice(shippingDiscount)})`
                      : formatPrice(shippingFee)
                    : shippingLoading
                      ? 'Đang tính...'
                      : '—'}
              </dd>
            </div>
            <div className="checkout-totals-grand">
              <dt>Tổng cộng</dt>
              <dd>{formatPrice(grandTotal)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  )
}
