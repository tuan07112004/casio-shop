/** Thông tin chuyển khoản — hiện khi khách chọn "Chuyển khoản" */
export const BANK_TRANSFER_INFO = {
  bank: 'TPBank',
  /** Mã BIN ngân hàng — dùng cho VietQR (TPBank = 970423) */
  vietqrBin: '970423',
  accountNumber: '03762079901',
  accountName: 'Đỗ Minh Tuấn',
  /** Tên không dấu cho VietQR */
  accountNameAscii: 'DO MINH TUAN',
}

export function bankTransferNote(orderId) {
  return `LYTUS DH${orderId}`
}

/** URL ảnh QR VietQR — quét bằng app ngân hàng */
export function buildVietQrUrl(orderId, amount) {
  const { vietqrBin, accountNumber, accountNameAscii } = BANK_TRANSFER_INFO
  const addInfo = bankTransferNote(orderId)
  const base = `https://img.vietqr.io/image/${vietqrBin}-${accountNumber}-compact2.jpg`
  const params = new URLSearchParams({
    addInfo,
    accountName: accountNameAscii,
  })
  if (amount && Number(amount) > 0) {
    params.set('amount', String(Math.round(Number(amount))))
  }
  return `${base}?${params.toString()}`
}
