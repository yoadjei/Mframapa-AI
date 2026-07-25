import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

const KEY = 'mframapa:motion'

/**
 * Marketing motion policy:
 * OS “reduce motion” only softens intensity — it no longer freezes the site.
 * Users can force full motion via localStorage mframapa:motion=full
 * (or the small “Enable motion” chip when OS reduce is on).
 */
export function useSiteMotion() {
  const osReduce = useReducedMotion()
  const [forced, setForced] = useState(false)

  useEffect(() => {
    try {
      setForced(localStorage.getItem(KEY) === 'full')
    } catch {
      /* ignore */
    }
  }, [])

  const forceFull = () => {
    try {
      localStorage.setItem(KEY, 'full')
    } catch {
      /* ignore */
    }
    setForced(true)
  }

  const soft = Boolean(osReduce) && !forced
  return {
    /** Always true for decorative loops — soft path uses lower amplitude. */
    active: true,
    soft,
    /** 1 = full, ~0.4 = softened OS reduce */
    intensity: soft ? 0.4 : 1,
    osReduce: Boolean(osReduce),
    forced,
    forceFull,
  }
}
