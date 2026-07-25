import { Suspense, useEffect, useRef, useState, type RefObject } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import { ClimateScene } from './climate/ClimateScene'

type Props = {
  intensity?: number
  /** Scroll boost without React re-renders (read in useFrame). */
  scrollBoostRef?: RefObject<number>
}

export function HeroCanvas({ intensity = 1, scrollBoostRef }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [ok, setOk] = useState(true)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    try {
      const c = document.createElement('canvas')
      const gl =
        c.getContext('webgl2', { alpha: true, antialias: true }) ||
        c.getContext('webgl', { alpha: true, antialias: true })
      setOk(Boolean(gl))
    } catch {
      setOk(false)
    }
  }, [])

  // Pause WebGL when the hero leaves the viewport so Lenis scroll stays smooth.
  useEffect(() => {
    const el = wrapRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return undefined
    const io = new IntersectionObserver(
      ([entry]) => setVisible(Boolean(entry?.isIntersecting)),
      { root: null, threshold: 0.05, rootMargin: '80px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  if (!ok) return null

  return (
    <div
      ref={wrapRef}
      data-testid="hero-canvas"
      className="pointer-events-none absolute inset-0 z-0"
      aria-hidden
    >
      <Canvas
        camera={{ position: [0, 0.15, 6.4], fov: 34, near: 0.1, far: 40 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'default',
          failIfMajorPerformanceCaveat: false,
        }}
        frameloop={visible ? 'always' : 'never'}
        style={{ width: '100%', height: '100%', background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <ClimateScene intensity={intensity} scrollBoostRef={scrollBoostRef} />
          <ContactShadows
            position={[0, -1.6, 0]}
            opacity={0.22}
            scale={14}
            blur={2.8}
            far={5}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}
