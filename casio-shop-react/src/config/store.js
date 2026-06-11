/** Địa chỉ nhận hàng tại cửa hàng */
export const STORE_PICKUP = {
  name: 'Lytus Shop',
  street: 'Ngõ 345 Khương Trung',
  ward: 'Phường Khương Đình',
  district: 'Quận Thanh Xuân',
  province: 'Hà Nội',
  phone: '0988480655',
  fullAddress:
    'Ngõ 345 Khương Trung, Phường Khương Đình, Quận Thanh Xuân, Hà Nội',
  hours: '8:00 – 20:00 (mọi ngày)',
}

export function storePickupOrderAddress() {
  return `Nhận tại cửa hàng — ${STORE_PICKUP.fullAddress}`
}
