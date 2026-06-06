import { useEffect, useState } from 'react'

const PHRASE = 'Tìm theo tên sản phẩm'
const speed = 70
const deleteSpeed = 40
const stop = 2200

export default function useAnimated(active) {
const [text, setText] = useState('')


useEffect(() => {
    if(!active) return undefined

    let charIndex = 0
let deleting = false
let timeoutId

    const tick = () => {
        if (!deleting) {
            charIndex++ 
            setText(PHRASE.slice(0, charIndex))
            if(charIndex >= PHRASE.length){
                deleting = true
                timeoutId = setTimeout(tick, stop)
                return 
            }

            timeoutId = setTimeout(tick, speed)
            return 
        }

        charIndex -= 1
        setText(PHRASE.slice(0, charIndex))
        if(charIndex <= 0){
            deleting = false 
            timeoutId = setTimeout(tick, speed)
            return 
        } 
        timeoutId = setTimeout(tick, deleteSpeed)

    }
    timeoutId = setTimeout(tick, speed)
    return () => clearTimeout(timeoutId)

}, [active])

return text
}
