import { AnimatePresence, motion } from 'framer-motion'
import { iosScreen } from '../lib/ios'
import { useSiteMotion } from '../lib/motionPreference'

export type PhoneScreen = 'home' | 'map' | 'alerts' | 'home-dark'

type Props = {
  screen?: PhoneScreen
  className?: string
  floating?: boolean
  size?: 'md' | 'lg'
  tilted?: boolean
}

const SHOTS: Record<PhoneScreen, { src: string; alt: string }> = {
  home: {
    src: '/mockups/home-light.png',
    alt: 'Mframapa home screen showing air quality in Kumasi',
  },
  map: {
    src: '/mockups/map-light.png',
    alt: 'Mframapa map of Africa with city readings',
  },
  alerts: {
    src: '/mockups/alerts-light.png',
    alt: 'Mframapa alerts screen for turning on dust notifications',
  },
  'home-dark': {
    src: '/mockups/home-dark.png',
    alt: 'Mframapa home screen in dark mode',
  },
}

const WIDTH = {
  md: 'w-[240px] sm:w-[280px] md:w-[300px]',
  lg: 'w-[270px] sm:w-[310px] md:w-[340px] lg:w-[360px]',
} as const

export function PhoneMockup({
  screen = 'home',
  className = '',
  floating = true,
  size = 'md',
  tilted = false,
}: Props) {
  const { soft } = useSiteMotion()
  const shot = SHOTS[screen]
  const floatClass = floating ? (tilted ? 'phone-tilt' : 'phone-float') : ''
  const softClass = soft ? 'phone-soft' : ''

  return (
    <div
      className={`relative mx-auto ${WIDTH[size]} ${floatClass} ${softClass} ${className}`}
      style={{
        // Cap height on short laptops; width follows aspect so the mockup never clips.
        maxHeight: 'min(72dvh, 620px)',
        width: 'min(100%, calc(min(72dvh, 620px) * 9 / 19.2))',
      }}
    >
      <div
        className={`pointer-events-none absolute -bottom-7 left-1/2 h-11 w-[72%] -translate-x-1/2 rounded-[100%] bg-ink/20 blur-2xl ${
          floating ? 'phone-shadow-pulse' : ''
        }`}
        aria-hidden
      />

      <div
        className="relative h-full w-full overflow-hidden rounded-[2.7rem] p-[11px] ring-1 ring-black/20"
        style={{
          background:
            'linear-gradient(160deg, #2a2a2e 0%, #141416 45%, #0a0a0c 100%)',
          boxShadow:
            '0 50px 100px -36px rgba(10,10,10,0.55), 0 20px 40px -18px rgba(10,10,10,0.3), inset 0 1px 0 rgba(255,255,255,0.12)',
          aspectRatio: '9 / 19.2',
          maxHeight: 'inherit',
        }}
      >
        <div className="absolute top-[13px] left-1/2 z-20 h-[24px] w-[104px] -translate-x-1/2 rounded-full bg-black" />
        <div className="h-full w-full overflow-hidden rounded-[2.15rem] bg-white">
          <AnimatePresence mode="wait">
            <motion.img
              key={shot.src}
              src={shot.src}
              alt={shot.alt}
              className="h-full w-full object-cover object-[50%_6%]"
              draggable={false}
              initial={{ opacity: 0, scale: 1.08, filter: 'blur(10px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.94, filter: 'blur(8px)' }}
              transition={iosScreen}
            />
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
