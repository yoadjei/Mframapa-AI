import { motion, useReducedMotion } from 'framer-motion'
import { STORE_LINKS } from '../lib/constants'

/**
 * Official store badge artwork (vendor marketing assets), hosted locally.
 * Sources: Apple Media Services, Google Play badges, Huawei AppGallery, Samsung Galaxy Store.
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

  return (
    <div
      className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2 sm:gap-x-3"
      role="list"
      aria-label="Download the app"
    >
      {BADGES.map((badge, i) => {
        const store = STORE_LINKS[badge.id]
        const disabled = store.comingSoon || store.href === '#'
        return (
          <motion.a
            key={badge.id}
            role="listitem"
            href={disabled ? undefined : store.href}
            aria-disabled={disabled}
            title={disabled ? `${badge.alt} (coming soon)` : badge.alt}
            onClick={disabled ? (e) => e.preventDefault() : undefined}
            className={`inline-flex items-center ${disabled ? 'cursor-default opacity-85' : 'hover:opacity-90'}`}
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * i, duration: 0.4 }}
            whileHover={reduce || disabled ? undefined : { y: -2 }}
            whileTap={reduce || disabled ? undefined : { scale: 0.98 }}
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
