import { Suspense, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import { ClimateScene } from './climate/ClimateScene'

type Props = {
  intensity?: number
  scrollBoost?: number
}

export function HeroCanvas({ intensity = 1, scrollBoost = 0 }: Props) {
  const [ok, setOk] = useState(true)

  useEffect(() => {
    try {
      const c = document.createElement('canvas')
      const gl =
        c.getContext('webgl2') ||
        c.getContext('webgl') ||
        c.getContext('experimental-webgl')
      setOk(Boolean(gl))
    } catch {
      setOk(false)
    }
  }, [])

  if (!ok) return null

  return (
    <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
      <Canvas
        camera={{ position: [0, 0.15, 6.4], fov: 34, near: 0.1, far: 40 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        frameloop="always"
        style={{ width: '100%', height: '100%', background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <ClimateScene intensity={intensity} scrollBoost={scrollBoost} />
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
