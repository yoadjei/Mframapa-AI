import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, type CSSProperties } from 'react'
import { iosScreen } from '../lib/ios'
import { useSiteMotion } from '../lib/motionPreference'

export type PhoneScreen = 'home' | 'map' | 'alerts' | 'home-dark'

type Props = {
  screen?: PhoneScreen
  className?: string
  floating?: boolean
  size?: 'md' | 'lg'
  tilted?: boolean
  media?: 'image' | 'video'
  frame?: boolean
  onEnded?: () => void
}

type Shot = {
  alt: string
  /** Default / largest still. */
  poster: string
  /** Responsive stills for marketing (mobile-first). */
  posterSrcSet?: string
  posterSizes?: string
  webm?: string
  mp4?: string
}

const SHOTS: Record<PhoneScreen, Shot> = {
  home: {
    poster: '/mockups/home-light-720.png',
    posterSrcSet:
      '/mockups/home-light-720.png 720w, /mockups/home-light-1080.png 1080w, /mockups/home-light.png 1290w',
    posterSizes: '(max-width: 640px) 240px, (max-width: 1024px) 300px, 360px',
    webm: '/mockups/step-1-city.webm',
    mp4: '/mockups/step-1-city.mp4',
    alt: 'Mframapa home — air quality in Kumasi with What to do guidance',
  },
  map: {
    poster: '/mockups/map-light.png',
    webm: '/mockups/step-2-map.webm',
    mp4: '/mockups/step-2-map.mp4',
    alt: 'Recording: browse the Africa map and open a city reading',
  },
  alerts: {
    poster: '/mockups/alerts-light.png',
    webm: '/mockups/step-3-alerts.webm',
    mp4: '/mockups/step-3-alerts.mp4',
    alt: 'Recording: turn on dust alerts in notification settings',
  },
  'home-dark': {
    poster: '/mockups/home-dark.png',
    alt: 'Mframapa home screen in dark mode',
  },
}

const SCREEN_ASPECT = '1290 / 2796'

const MAX_WIDTH = {
  md: 280,
  lg: 340,
} as const

function PhoneScreenMedia({
  shot,
  media,
  onEnded,
}: {
  shot: Shot
  media: 'image' | 'video'
  onEnded?: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const useVideo = media === 'video' && Boolean(shot.webm || shot.mp4)
  const loop = !onEnded

  useEffect(() => {
    const el = videoRef.current
    if (!el || !useVideo) return
    el.currentTime = 0
    el.load()
    void el.play().catch(() => {
      /* ignore autoplay blocks */
    })
  }, [useVideo, shot.webm, shot.mp4])

  if (useVideo) {
    return (
      <video
        key={`${shot.webm}|${shot.mp4}`}
        ref={videoRef}
        // Slight zoom kills light hairline gaps at the rounded glass edge.
        className="block h-full w-full origin-center scale-[1.03] object-cover object-top"
        poster={shot.poster}
        autoPlay
        muted
        loop={loop}
        playsInline
        preload="metadata"
        aria-label={shot.alt}
        onEnded={() => {
          if (onEnded) onEnded()
        }}
      >
        {shot.webm ? <source src={shot.webm} type="video/webm" /> : null}
        {shot.mp4 ? <source src={shot.mp4} type="video/mp4" /> : null}
      </video>
    )
  }

  // Plain <img> — no Framer opacity. Reduced-motion was leaving motion.img invisible.
  return (
    <img
      key={shot.poster}
      src={shot.poster}
      srcSet={shot.posterSrcSet}
      sizes={shot.posterSizes}
      alt={shot.alt}
      width={720}
      height={1561}
      className="block h-full w-full object-cover object-top"
      draggable={false}
      decoding="async"
      fetchPriority="high"
    />
  )
}

function shellStyle(size: 'md' | 'lg'): CSSProperties {
  // Width from aspect + maxWidth; height comes from Tailwind responsive classes.
  return {
    width: 'auto',
    maxWidth: `min(92vw, ${MAX_WIDTH[size]}px)`,
    aspectRatio: SCREEN_ASPECT,
  }
}

export function PhoneMockup({
  screen = 'home',
  className = '',
  floating = true,
  size = 'md',
  tilted = false,
  media = 'image',
  frame = true,
  onEnded,
}: Props) {
  const { soft } = useSiteMotion()
  const shot = SHOTS[screen]
  const softClass = soft && frame ? 'phone-soft' : ''
  const floatOk = floating && frame ? (tilted ? 'phone-tilt' : 'phone-float') : ''
  const style = shellStyle(size)

  if (!frame) {
    return (
      <div
        className={`relative mx-auto isolate h-[min(58dvh,520px)] overflow-hidden rounded-[2.4rem] shadow-[0_28px_64px_-30px_rgba(10,10,10,0.5)] sm:h-[min(65dvh,580px)] md:h-[min(70dvh,620px)] ${className}`}
        style={style}
      >
        <PhoneScreenMedia
          key={`${screen}-${media}-bare`}
          shot={shot}
          media={media}
          onEnded={onEnded}
        />
      </div>
    )
  }

  return (
    <div
      className={`relative mx-auto h-[min(58dvh,520px)] sm:h-[min(65dvh,580px)] md:h-[min(70dvh,620px)] ${floatOk} ${softClass} ${className}`}
      style={style}
    >
      {floating ? (
        <div
          className="pointer-events-none absolute -bottom-7 left-1/2 h-11 w-[72%] -translate-x-1/2 rounded-[100%] bg-ink/20 blur-2xl phone-shadow-pulse"
          aria-hidden
        />
      ) : null}

      <div
        className="box-border h-full w-full overflow-hidden rounded-[2.4rem] p-[8px] ring-1 ring-black/20 sm:p-[9px]"
        style={{
          background:
            'linear-gradient(160deg, #2a2a2e 0%, #141416 45%, #0a0a0c 100%)',
          boxShadow:
            '0 50px 100px -36px rgba(10,10,10,0.55), 0 20px 40px -18px rgba(10,10,10,0.3), inset 0 1px 0 rgba(255,255,255,0.12)',
        }}
      >
        <div
          className={`relative h-full w-full overflow-hidden rounded-[1.9rem] ${
            media === 'video' ? 'bg-black' : 'bg-[#E8ECF2]'
          }`}
        >
          <div
            className="pointer-events-none absolute top-[9px] left-1/2 z-20 h-[20px] w-[88px] -translate-x-1/2 rounded-full bg-black sm:top-[10px] sm:h-[22px] sm:w-[96px]"
            aria-hidden
          />
          <AnimatePresence mode="sync" initial={false}>
            <motion.div
              key={`${screen}-${media}`}
              className="h-full w-full"
              initial={false}
              animate={{ opacity: 1 }}
              transition={iosScreen}
            >
              <PhoneScreenMedia shot={shot} media={media} onEnded={onEnded} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
