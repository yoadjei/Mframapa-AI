import { useEffect, useState } from 'react'

/** True when the viewport is short (typical laptop heights). */
export function useShortViewport(maxHeight = 900) {
  const [short, setShort] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia(`(max-height: ${maxHeight}px)`).matches
      : false,
  )

  useEffect(() => {
    const mq = window.matchMedia(`(max-height: ${maxHeight}px)`)
    const onChange = () => setShort(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [maxHeight])

  return short
}
