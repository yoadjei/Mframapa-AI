import type { Transition, Variants } from 'framer-motion'

/**
 * iOS-feel motion presets.
 * iOS UIKit uses spring damping — not linear CSS ease.
 * Curve approx for CSS: cubic-bezier(0.32, 0.72, 0, 1)
 */

/** Snappy sheet / button (UIKit spring-ish). */
export const iosSpring: Transition = {
  type: 'spring',
  stiffness: 380,
  damping: 32,
  mass: 0.9,
}

/** Softer float / modal present. */
export const iosSoft: Transition = {
  type: 'spring',
  stiffness: 160,
  damping: 22,
  mass: 1,
}

/** Screen push/pop inside a phone. */
export const iosScreen: Transition = {
  type: 'spring',
  stiffness: 280,
  damping: 30,
  mass: 0.85,
}

export const iosEase = [0.32, 0.72, 0, 1] as const

export const iosFadeUp: Variants = {
  hidden: { opacity: 0, y: 28, filter: 'blur(6px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: iosSoft,
  },
}

export const iosStagger: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.09, delayChildren: 0.06 },
  },
}

export const iosViewport = { once: true, amount: 0.2 as const }
