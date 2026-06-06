import {createContext, useContext, useMemo, useState} from 'react'
// createContext: tạo kho dữ liệu dùng chung 
// useContext: lấy dữ liệu từ kho đó ra dùng 
// useMemo: ghi nhớ két quả tính toán, tránh tính lại không cần thiết
// useState: tạo state, tức dữ liệu có thể thay đổi

const CartContext = createContext(null) // tạo kho hàng chưa có dữ liệu gì 
const STORAGE_KEY = 'casio-shop-cart'       // để tên lưu giỏ hàng trong trình duyệt

// hàm lấy giỏ hàng từ local storage
function loadCart() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)   // lấy dữ liệu từ localStorage 
         return raw ? JSON.parse(raw) : []  // nếu có dữ liệu đổi chuỗi JSON thành mảng JavaScript
    } catch {
        return []
    }
}

// hàm lưu giỏ hàng vào local storage
function saveCart(items) {
     localStorage.setItem(STORAGE_KEY, JSON.stringify(items))  // lưu chuỗi items vào localStorage
}


export function CartProvider({children})  // tạo kho hàng giỏ hàng và cung cấp dữ liệu cho các component con
{
    const [items, setItems] = useState(loadCart) // mở web react sẽ gọi loadCart để lấy giỏ hàng cũ từ localStorage

    // tạo hàm cập nhật giỏ hàng thay vì mỗi lần setItems tâ gom về 1 hàm để sau khi cập nhật thì tự lưu vào localStorage
    const updateItems = (updater) => {

        // cập nhật state dựa trên giỏ hàng cũ, prev là giỏ hàng hiện tại trước khi thay đổi
        setItems((prev) => {
            // nếu updater là hàm thì -> chạy updater(prev) để tạo giỏ hàng mới
            // không phải -> lấy luôn updater làm giỏ hàng mới 
            const next = typeof updater === 'function' ? updater(prev) : updater
            
            saveCart(next)  // lưu giỏ hàng mới vào localStorage
            return next
        })
    }

    // product: sản phẩm cần thêm, quantity: số lượng cần thêm
    const addToCart = (product, quantity = 1) => {
        // cập nhật giỏ hàng dựa trên giỏ hàng cũ 
        updateItems((prev) => {
            // tìm kiếm sản phẩm này có trong giỏ chưa, nếu có thì found là sản phẩm đó 
            const found = prev.find((item) => item.productId === product.id)

            // nếu sp tồn tại thì thêm còn không thì tạo mới 
            if(found) {

                return prev.map((item) => // duyệt qua từng sp trong giỏ để tạo mảng mới 
                item.productId === product.id // kiểm tra có đúng sản phẩm cần thêm không
                ? {...item, quantity: item.quantity + quantity} : item,
            )   
        }
        return [
            ...prev,
            {
                productId: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity,
            },
        ]
    })
    }

    //  tạo hàm  xóa sp theo productId
    const removeFromCart = (productId) => {

        // filter tạo mảng mới, chỉ giữ lại sp có productId khác sp cần xóa
        updateItems((prev) => prev.filter((item) => item.productId !== productId)) 
    }

    // hàm cập nhật số lượng sản phẩm 
    const updateQuantity = (productId, quantity) => {
        if(quantity < 1 ) {
            removeFromCart(productId)
            return
        }
        updateItems((prev) => prev.map((item) =>
        item.productId === productId ? {...item, quantity} : item,
    ),
        )
    }

    const clearCart = () => updateItems([])  // xóa tất cả sp trong giỏ 


    const totalItems = useMemo(() => 
    items.reduce((sum, item) => sum + item.quantity, 0),
    [items],   // chỉ tính lại khi items thay đổi 
)

    const totalPrice = useMemo(() => 
        items.reduce((sum, item) => sum + item.price * item.quantity, 0),
        [items],
    )

    const value = {
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
    } // trả về giá trị của kho hàng để các component con có thể sử dụng
    return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
    const ctx = useContext(CartContext)  // lấy dữ liệu từ cartcontext
    if(!ctx) {
        throw new Error('useCart phải nằm trong CartProvider')
    }
    return ctx
}






