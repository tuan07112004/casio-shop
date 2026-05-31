/** Hiển thị tồn kho — stock có trong DB/seeder cho cả 9 sản phẩm */
export function getStockInfo(stock) {
  if (stock == null || stock === undefined) return null
  const qty = Number(stock)
  if (Number.isNaN(qty)) return null
  if (qty <= 0) {
    return { text: 'Hết hàng', className: 'stock-out' }
  }
  if (qty <= 5) {
    return { text: `Còn ${qty} sản phẩm`, className: 'stock-low' }
  }
  return { text: `Còn ${qty} sản phẩm`, className: 'stock-in' }
}
