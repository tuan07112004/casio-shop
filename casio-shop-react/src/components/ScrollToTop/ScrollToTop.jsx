import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop() {
    const { pathname, hash } = useLocation()
    // path: đường dẫn trang, hash: phần # trong url

    // khi trang thay đổi chạy useEffect
    useEffect(() => {
        if(hash) {
            const id = hash.replace('#', '')
            const el = document.getElementById(id)

            if(el) {
                el.scrollIntoView({behavior: 'smooth', block: 'start' })    // scroll  lên đầu id
                return 
            }
        }
        window.scrollTo(0, 0)  // ko có id thì tự lên đầu 
         }, [pathname, hash])

         return null
}