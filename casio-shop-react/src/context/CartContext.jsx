import {createContext, useContext, useMemo, useState} from 'react'
// createContext: tạo kho 
// useContext: đọc kho 
// useMemo: ghi nhớ két quả tính toán

const CartContext = createContext(null) // tạo kho hàng 
const STORAGE_KEY = 'casio-shop-cart'       // để tên localStorage

// hàm lấy giỏ hàng từ local storage
function loadCart() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)   
         return raw ? JSON.parse(raw) : []  // có chuỗi chuyển thành mảng 
    } catch {
        return []
    }
}

// hàm lưu giỏ hàng vào local storage
function saveCart(items) {
     localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) 
}

// tạo kho và giỏ hàng cũng cấp dữ liệu cho các component con 
export function CartProvider({children})  
{
    const [items, setItems] = useState(loadCart) //  gọi loadCart để lấy giỏ hàng cũ từ localStorage

    // tạo hàm cập nhật giỏ hàng, sau khi cập nhật thì tự lưu vào localStorage
    const updateItems = (updater) => {

        // cập nhật state dựa trên giỏ hàng cũ(prev)
        setItems((prev) => {
            // nếu updater là hàm -> tính từ giỏ cũ 
            // không hàm -> lấy luôn updater làm giỏ hàng mới 
            const next = typeof updater === 'function' ? updater(prev) : updater
            
            saveCart(next)  // lưu giỏ hàng mới vào localStorage
            return next
        })
    }

    // 1: sản phẩm cần thêm, 2: số lượng cần thêm
    const addToCart = (product, quantity = 1) => {
        // cập nhật giỏ hàng dựa trên giỏ hàng cũ 
        updateItems((prev) => {
            // tìm kiếm sản phẩm này có trong giỏ chưa, nếu có thì found là sản phẩm đó 
            const found = prev.find((item) => item.productId === product.id)

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

    const clearCart = () => updateItems([])  

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






