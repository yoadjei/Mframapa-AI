import { useEffect, useState } from 'react'

/** True below Tailwind `md` (768px). Phone-only: heavy motion / WebGL stay off. */
export function useIsMobile(breakpoint = 768) {
  const [mobile, setMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(`(max-width: ${breakpoint - 1}px)`).matches : false,
  )

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    const onChange = () => setMobile(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [breakpoint])

  return mobile
}

/**
 * Phone + tablet portrait / small landscape (below Tailwind `lg` / 1024px).
 * Use for layouts that only work as two columns at desktop width — iPads
 * otherwise get a broken middle state (desktop component, single column).
 */
export function useIsCompact(breakpoint = 1024) {
  return useIsMobile(breakpoint)
}
