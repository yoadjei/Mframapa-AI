import { motion, useReducedMotion } from 'framer-motion'
import { APP_URL, STORE_LINKS } from '../lib/constants'

/**
 * Official store badge artwork (vendor marketing assets), hosted locally.
 * Only show live store links. Dead "#" badges are hidden so users are not
 * tricked into a broken download — the primary path is the live PWA.
 */
const BADGES = [
  {
    id: 'apple' as const,
    src: '/badges/app-store.svg',
    alt: 'Download on the App Store',
    height: 36,
  },
  {
    id: 'google' as const,
    src: '/badges/google-play.png',
    alt: 'Get it on Google Play',
    height: 54,
    pad: true,
  },
  {
    id: 'huawei' as const,
    src: '/badges/huawei-appgallery.png',
    alt: 'Explore it on AppGallery',
    height: 36,
  },
  {
    id: 'samsung' as const,
    src: '/badges/galaxy-store.png',
    alt: 'Available on Galaxy Store',
    height: 36,
  },
] as const

export function StoreBadges() {
  const reduce = useReducedMotion()
  const live = BADGES.filter((badge) => {
    const store = STORE_LINKS[badge.id]
    return store && !store.comingSoon && store.href && store.href !== '#'
  })

  if (live.length === 0) {
    return (
      <motion.a
        href={APP_URL}
        className="inline-flex items-center justify-center rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white"
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={reduce ? undefined : { y: -2 }}
        whileTap={reduce ? undefined : { scale: 0.98 }}
      >
        Open the free app
      </motion.a>
    )
  }

  return (
    <div
      className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2 sm:gap-x-3"
      role="list"
      aria-label="Download the app"
    >
      {live.map((badge, i) => {
        const store = STORE_LINKS[badge.id]
        return (
          <motion.a
            key={badge.id}
            role="listitem"
            href={store.href}
            title={badge.alt}
            className="inline-flex items-center hover:opacity-90"
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * i, duration: 0.4 }}
            whileHover={reduce ? undefined : { y: -2 }}
            whileTap={reduce ? undefined : { scale: 0.98 }}
          >
            <img
              src={badge.src}
              alt={badge.alt}
              height={badge.height}
              className={`w-auto max-w-[42vw] sm:max-w-none ${'pad' in badge && badge.pad ? '-my-1.5' : ''}`}
              style={{ height: badge.height }}
              loading="lazy"
              decoding="async"
            />
          </motion.a>
        )
      })}
    </div>
  )
}
