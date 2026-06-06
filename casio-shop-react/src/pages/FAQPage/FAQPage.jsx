import { useState } from 'react'
import './FAQPage.css'

const FAQ_ITEMS = [
  {
    id: 1,
    question: 'Giao hàng mất bao lâu?',
    answer:
      'Đơn nội thành TP.HCM và Hà Nội thường giao trong 1–2 ngày làm việc. Các tỉnh thành khác khoảng 3–5 ngày. Thời gian có thể thay đổi theo đơn vị vận chuyển và dịp cao điểm.',
  },
  {
    id: 2,
    question: 'Lytus có giao hàng quốc tế không?',
    answer:
      'Hiện tại chúng tôi chỉ giao hàng trong lãnh thổ Việt Nam. Khi có hình thức giao quốc tế, thông tin sẽ được cập nhật trên website.',
  },
  {
    id: 3,
    question: 'Tôi kiểm tra đơn hàng và vận chuyển ở đâu?',
    answer:
      'Sau khi đặt hàng, bạn nhận email hoặc tin nhắn xác nhận kèm mã vận đơn (nếu có). Bạn có thể liên hệ hotline 0988 480 655 để được hỗ trợ tra cứu.',
  },
  {
    id: 4,
    question: 'Phí giao hàng là bao nhiêu?',
    answer:
      'Phí giao hàng tính theo khu vực và trọng lượng đơn hàng. Một số chương trình miễn phí giao hàng có thể áp dụng theo từng thời điểm — chi tiết hiển thị khi thanh toán.',
  },
  {
    id: 5,
    question: 'Tôi vô tình gửi sai địa chỉ thì làm thế nào?',
    answer:
      'Vui lòng gọi ngay hotline 0988 480 655 hoặc nhắn hỗ trợ trong vòng 2 giờ sau khi đặt hàng. Nếu đơn chưa được bàn giao cho đơn vị vận chuyển, chúng tôi sẽ hỗ trợ sửa địa chỉ.',
  },
  {
    id: 6,
    question: 'Đơn hàng được xác nhận trong bao lâu?',
    answer:
      'Đơn hàng thường được xác nhận trong vòng 24 giờ làm việc. Đơn đặt cuối tuần hoặc ngày lễ có thể xử lý vào ngày làm việc kế tiếp.',
  },
  {
    id: 7,
    question: 'Sản phẩm Casio có bảo hành không?',
    answer:
      'Máy tính Casio chính hãng được bảo hành theo chính sách nhà sản xuất. Vui lòng giữ hóa đơn và tem bảo hành khi nhận hàng.',
  },
  {
    id: 8,
    question: 'Tôi có thể đổi/trả hàng không?',
    answer:
      'Bạn có thể đổi/trả trong 7 ngày nếu sản phẩm lỗi do nhà sản xuất hoặc giao sai mẫu. Sản phẩm cần còn nguyên hộp, phụ kiện và chưa qua sử dụng.',
  },
  {
    id: 9,
    question: 'Lytus sử dụng dịch vụ nào để vận chuyển?',
    answer:
      'Chúng tôi hợp tác các đơn vị như GHN, GHTK, Viettel Post tùy khu vực. Đơn vị cụ thể sẽ được thông báo khi đơn hàng được gửi đi.',
  },
  {
    id: 10,
    question: 'Tôi có thể yêu cầu thời gian nhận hàng không?',
    answer:
      'Bạn có thể ghi chú khung giờ mong muốn khi đặt hàng. Chúng tôi sẽ cố gắng sắp xếp; tuy nhiên thời gian giao phụ thuộc lịch trình của đơn vị vận chuyển.',
  },
]

export default function FAQPage() {
  const [openId, setOpenId] = useState(null)

  const toggle = (id) => {
    setOpenId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="faq-page">
      <h1 className="faq-title">Câu hỏi thường gặp (FAQ)</h1>

      <div className="faq-list">
        {FAQ_ITEMS.map((item) => {
          const isOpen = openId === item.id

          return (
            <div
              key={item.id}
              className={`faq-item${isOpen ? ' is-open' : ''}`}
            >
              <button
                type="button"
                className="faq-question"
                onClick={() => toggle(item.id)}
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${item.id}`}
              >
                <span className="faq-question-text">
                  <span className="faq-number">{item.id}.</span>
                  {item.question}
                </span>
                <span className="faq-icon" aria-hidden>
                  {isOpen ? '−' : '+'}
                </span>
              </button>

              <div
                id={`faq-answer-${item.id}`}
                className="faq-answer-wrap"
                role="region"
                aria-hidden={!isOpen}
              >
                <div className="faq-answer-inner">
                  <p className="faq-answer">{item.answer}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
