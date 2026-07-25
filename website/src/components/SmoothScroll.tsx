import { useEffect, type ReactNode } from 'react'
import Lenis from 'lenis'
import { cancelFrame, frame } from 'framer-motion'

/**
 * Always-on smooth scroll. Softened when OS asks for reduced motion,
 * never disabled — a frozen page reads as broken for this marketing site.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    const soft = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let forced = false
    try {
      forced = localStorage.getItem('mframapa:motion') === 'full'
    } catch {
      /* ignore */
    }

    const lenis = new Lenis({
      duration: soft && !forced ? 0.7 : 1.25,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.5,
    })

    const update = (data: { timestamp: number }) => {
      lenis.raf(data.timestamp)
    }
    frame.update(update, true)

    return () => {
      cancelFrame(update)
      lenis.destroy()
    }
  }, [])

  return children
}
