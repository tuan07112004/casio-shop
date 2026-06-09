import { Link, useSearchParams } from 'react-router-dom'
import {
  BANK_TRANSFER_INFO,
  bankTransferNote,
  buildVietQrUrl,
} from '../../config/payment'
import { formatPrice } from '../../utils/format'
import './OrderSuccessPage.css'

export default function OrderSuccessPage() {
  const [params] = useSearchParams()
  const orderId = params.get('ma')
  const payment = params.get('payment')
  const amount = params.get('amount')
  const isBankTransfer = payment === 'bank_transfer'
  const qrUrl = isBankTransfer && orderId ? buildVietQrUrl(orderId, amount) : null

  return (
    <div className="order-success">
      <h1>Đặt hàng thành công!</h1>
      {orderId && (
        <p className="order-success-id">
          Mã đơn: <strong>#{orderId}</strong>
        </p>
      )}

      {isBankTransfer ? (
        <div className="order-success-bank">
          <h2>Thông tin chuyển khoản</h2>
          <p className="order-success-bank-lead">
            Vui lòng chuyển khoản để xác nhận đơn hàng:
          </p>

          {qrUrl && (
            <div className="order-success-qr">
              <img src={qrUrl} alt="Mã QR chuyển khoản VietQR" width={240} height={240} />
              <p className="order-success-qr-hint">
                Quét mã bằng app TPBank / MoMo / ViettelPay
                {amount ? (
                  <>
                    {' '}
                    — Số tiền: <strong>{formatPrice(Number(amount))}</strong>
                  </>
                ) : null}
              </p>
            </div>
          )}

          <dl className="order-success-bank-details">
            <div>
              <dt>Ngân hàng</dt>
              <dd>{BANK_TRANSFER_INFO.bank}</dd>
            </div>
            <div>
              <dt>Số tài khoản</dt>
              <dd className="order-success-bank-highlight">
                {BANK_TRANSFER_INFO.accountNumber}
              </dd>
            </div>
            <div>
              <dt>Chủ tài khoản</dt>
              <dd>{BANK_TRANSFER_INFO.accountName}</dd>
            </div>
            {orderId && (
              <div>
                <dt>Nội dung chuyển khoản</dt>
                <dd className="order-success-bank-highlight">
                  {bankTransferNote(orderId)}
                </dd>
              </div>
            )}
          </dl>
          <p className="order-success-bank-note">
            Sau khi chuyển khoản, chúng tôi sẽ xác nhận và giao hàng trong thời
            gian sớm nhất.
          </p>
        </div>
      ) : (
        <p>Chúng tôi sẽ liên hệ xác nhận qua điện thoại hoặc email.</p>
      )}

      {orderId && (
        <p className="order-success-lookup-hint">
          Lưu mã đơn và số điện thoại để tra cứu sau.{' '}
          <Link to="/tra-cuu-don">Tra cứu đơn hàng</Link>
        </p>
      )}

      <div className="order-success-actions">
        <Link to="/cua-hang">Tiếp tục mua</Link>
        <Link to="/">Về trang chủ</Link>
      </div>
    </div>
  )
}
