import type { Transition, Variants } from 'framer-motion'

export const easeOut = [0.22, 1, 0.36, 1] as const

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: easeOut },
  },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.55, ease: easeOut },
  },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.75, ease: easeOut },
  },
}

export const slideLeft: Variants = {
  hidden: { opacity: 0, x: -36 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.65, ease: easeOut },
  },
}

export const slideRight: Variants = {
  hidden: { opacity: 0, x: 36 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.65, ease: easeOut },
  },
}

export const stagger: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.14, delayChildren: 0.1 },
  },
}

export const softSpring: Transition = {
  type: 'spring',
  stiffness: 120,
  damping: 18,
}

/** Trigger earlier so entrances are visible while scrolling. */
export const viewportOnce = { once: true, amount: 0.25 as const }
