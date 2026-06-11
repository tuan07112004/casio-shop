# Lytus Shop — Website bán máy tính Casio

Website thương mại điện tử bán máy tính Casio và phụ kiện, gồm **cửa hàng cho khách** và **trang quản trị** cho shop. Dự án dùng **React (Vite)** cho frontend và **Laravel** cho API/backend.

---

## Tính năng chính

### Khách hàng
- Xem danh sách sản phẩm, tìm kiếm, chi tiết sản phẩm (phân loại, màu, gallery)
- Giỏ hàng, xem nhanh sản phẩm
- Giá khuyến mãi theo chương trình admin (không fix cứng trên giao diện)
- Thanh toán: **COD**, **chuyển khoản ngân hàng (VietQR)**
- Giao hàng: **GHN** (tính phí theo địa chỉ) hoặc **nhận tại shop**
- Áp dụng tối đa **2 mã giảm giá** (1 mã giảm tiền + 1 mã free ship)
- Đặt hàng không bắt buộc đăng nhập; tra cứu đơn / tài khoản khách

### Quản trị (Admin)
- Quản lý sản phẩm: ảnh, video, phân loại, kho, danh mục
- Quản lý đơn hàng và trạng thái
- **Khuyến mãi shop**: tạo chương trình, chọn sản phẩm, giảm % hàng loạt
- **Mã giảm giá**: toàn shop / theo sản phẩm / free ship
- Phân tích bán hàng
- Thông báo toast khi thêm/sửa/xóa dữ liệu

---

## Công nghệ sử dụng

| Thành phần | Công nghệ |
|------------|-----------|
| Frontend | React 19, Vite, React Router |
| Backend | Laravel 13, Sanctum |
| Cơ sở dữ liệu | SQLite (mặc định), hỗ trợ MySQL |
| Vận chuyển | API Giao Hàng Nhanh (GHN) |
| Thanh toán | COD, chuyển khoản + VietQR |

---

## Cấu trúc thư mục

```
casio-shop-react/          # Repo gốc
├── casio-shop-react/      # Frontend React (Vite)
│   ├── public/            # Ảnh, icon, video tĩnh
│   └── src/               # Pages, components, API client
└── backend/               # API Laravel
    ├── app/               # Controllers, Models, Services
    ├── database/          # Migrations
    └── routes/api.php     # Định tuyến API
```

---

## Yêu cầu hệ thống

- **Node.js** 18+ (khuyến nghị 20+)
- **PHP** 8.3+
- **Composer**
- **Git**

---

## Cài đặt và chạy local

### 1. Clone repository

```bash
git clone <url-repo-cua-ban>
cd casio-shop-react
```

### 2. Backend (Laravel)

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

API mặc định chạy tại: `http://127.0.0.1:8000`

### 3. Frontend (React)

Mở terminal mới:

```bash
cd casio-shop-react
npm install
npm run dev
```

Website mặc định: `http://localhost:5173`

### 4. Biến môi trường

**Backend** — file `backend/.env`:

```env
APP_URL=http://127.0.0.1:8000
FRONTEND_URL=http://localhost:5173

# GHN — lấy token tại https://api.ghn.vn (không bắt buộc để chạy, nhưng cần để tính phí ship thật)
GHN_TOKEN=
GHN_SHOP_ID=
GHN_FROM_DISTRICT_ID=
GHN_FROM_WARD_CODE=
GHN_DEFAULT_WEIGHT_GRAM=500
```

> **Lưu ý:** Không commit file `.env` có token thật lên GitHub.

**Frontend** — tạo file `casio-shop-react/.env` (nếu cần đổi URL API):

```env
VITE_API_URL=http://127.0.0.1:8000
```

Nếu không có file này, frontend tự dùng `http://127.0.0.1:8000`.

### 5. Tài khoản admin

Tạo user qua đăng ký trên web, sau đó trong database đặt `role = admin` cho user đó (hoặc dùng seeder/tinker nếu bạn đã cấu hình).

Đăng nhập tại `/dang-nhap`, tick **Admin** để vào `/admin`.

---

## Scripts hữu ích

| Lệnh | Mô tả |
|------|--------|
| `npm run dev` | Chạy frontend development |
| `npm run build` | Build production frontend |
| `php artisan serve` | Chạy API Laravel |
| `php artisan migrate` | Chạy migration database |
| `php artisan migrate:fresh` | Reset DB và migrate lại (xóa dữ liệu) |

---

## API chính

| Endpoint | Mô tả |
|----------|--------|
| `GET /api/products` | Danh sách sản phẩm |
| `POST /api/orders` | Đặt hàng |
| `POST /api/vouchers/validate` | Kiểm tra mã giảm giá |
| `POST /api/shipping/ghn/quote` | Báo phí GHN |
| `GET /api/admin/promotions` | Quản lý khuyến mãi (cần token admin) |

Chi tiết đầy đủ xem trong `backend/routes/api.php`.

---

## Hạn chế đã biết

- MoMo / VNPay chưa tích hợp thanh toán thật (chỉ COD + chuyển khoản)
- GHN mới dùng để **báo phí**, chưa tự tạo vận đơn sau đặt hàng
- Hủy đơn chưa hoàn lại tồn kho
- Module chat admin đang để placeholder

---

## Tác giả

**Lò Văn Bằng** — Đồ án / ĐATN

---

## Giấy phép

Dự án học tập. Liên hệ tác giả trước khi sử dụng thương mại.
