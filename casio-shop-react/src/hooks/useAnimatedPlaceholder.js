import { useEffect, useState } from 'react'

const PHRASE = 'Tìm theo tên sản phẩm'

const TYPE_MS = 70
const DELETE_MS = 40
const PAUSE_MS = 2200

export default function useAnimatedPlaceholder(active) {
  const [text, setText] = useState('')

  useEffect(() => {
    if (!active) return undefined

    let charIndex = 0
    let deleting = false
    let timeoutId

    const tick = () => {
      if (!deleting) {
        charIndex += 1
        setText(PHRASE.slice(0, charIndex))

        if (charIndex >= PHRASE.length) {
          deleting = true
          timeoutId = setTimeout(tick, PAUSE_MS)
          return
        }
        timeoutId = setTimeout(tick, TYPE_MS)
        return
      }

      charIndex -= 1
      setText(PHRASE.slice(0, charIndex))

      if (charIndex <= 0) {
        deleting = false
        timeoutId = setTimeout(tick, TYPE_MS)
        return
      }
      timeoutId = setTimeout(tick, DELETE_MS)
    }

    timeoutId = setTimeout(tick, TYPE_MS)
    return () => clearTimeout(timeoutId)
  }, [active])

  return text
}
