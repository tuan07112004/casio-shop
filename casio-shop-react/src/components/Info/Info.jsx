import './Info.css'

const items = [
  {
    icon: '/svgs/chinhHang.svg',
    title: 'Chính hãng 100%',
    desc: 'Máy Casio nhập khẩu, tem đầy đủ',
  },
  {
    icon: '/svgs/hoTro.svg',
    title: 'Hỗ trợ tư vấn',
    desc: 'Tư vấn chọn máy phù hợp lớp & kỳ thi',
  },
  {
    icon: '/svgs/phongThi.svg',
    title: 'Bảo vệ phòng thi',
    desc: 'Đúng quy chuẩn thi cử',
  },
  {
    icon: '/svgs/truckIcon.svg',
    title: 'Giao hàng nhanh',
    desc: 'Đóng gói cẩn thận, giao toàn quốc',
  },
]

export default function Info() {
  return (
    <section className="info" id="gioi-thieu">
      <ul className="info-list">
        {items.map((item) => (
          <li key={item.title} className="info-item">
            <img src={item.icon} alt="" className="info-icon" />
            <div>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
