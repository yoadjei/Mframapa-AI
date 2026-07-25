import { useMemo, useRef, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import * as THREE from 'three'

type Props = {
  intensity?: number
  scrollBoostRef?: RefObject<number>
}

function useBoost(ref?: RefObject<number>) {
  return () => ref?.current ?? 0
}

function Globe({ intensity = 1 }: { intensity?: number }) {
  const earth = useRef<THREE.Mesh>(null)
  const haze = useRef<THREE.Mesh>(null)

  useFrame((_, delta) => {
    if (!earth.current) return
    earth.current.rotation.y += delta * 0.22 * intensity
    if (haze.current) haze.current.rotation.y -= delta * 0.07 * intensity
  })

  return (
    <Float speed={1.3 * intensity} floatIntensity={1.1 * intensity} rotationIntensity={0.25}>
      <group position={[-2.25, 0.1, 0]} scale={1.08}>
        <mesh ref={earth}>
          <sphereGeometry args={[1.05, 64, 64]} />
          <meshStandardMaterial
            color="#0f3d4c"
            roughness={0.55}
            metalness={0.15}
            emissive="#0a2a33"
            emissiveIntensity={0.28}
          />
        </mesh>
        <mesh rotation={[0.25, -0.55, 0.08]}>
          <sphereGeometry args={[1.065, 64, 64]} />
          <meshStandardMaterial
            color="#1f7a4c"
            roughness={0.9}
            transparent
            opacity={0.5}
          />
        </mesh>
        <mesh ref={haze} scale={1.14}>
          <sphereGeometry args={[1.05, 48, 48]} />
          <meshBasicMaterial color="#7dd3c0" transparent opacity={0.16} />
        </mesh>
      </group>
    </Float>
  )
}

function DustField({
  intensity = 1,
  scrollBoostRef,
}: {
  intensity?: number
  scrollBoostRef?: RefObject<number>
}) {
  const ref = useRef<THREE.Points>(null)
  const mat = useRef<THREE.PointsMaterial>(null)
  const getBoost = useBoost(scrollBoostRef)
  // Fewer points + staggered updates keep main-thread free for Lenis during scroll.
  const count = 220
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 10
      arr[i * 3 + 1] = (Math.random() - 0.5) * 6
      arr[i * 3 + 2] = (Math.random() - 0.5) * 4
    }
    return arr
  }, [])
  const phase = useRef(0)

  useFrame((_, delta) => {
    if (!ref.current) return
    const scrollBoost = getBoost()
    const speed = (0.45 + scrollBoost * 1.1) * intensity
    ref.current.rotation.y += delta * 0.1 * intensity
    const pos = ref.current.geometry.attributes.position
    phase.current = (phase.current + 1) % 2
    // Update half the particles each frame (full cycle still looks continuous).
    for (let i = phase.current; i < count; i += 2) {
      let y = pos.getY(i) + delta * speed * (0.18 + (i % 5) * 0.05) * 2
      if (y > 3) y = -3
      pos.setY(i, y)
      let x = pos.getX(i) + delta * speed * 0.15 * 2
      if (x > 5) x = -5
      pos.setX(i, x)
    }
    pos.needsUpdate = true
    if (mat.current) {
      mat.current.size = 0.038 + scrollBoost * 0.025
      mat.current.opacity = 0.6 + scrollBoost * 0.28
    }
  })

  return (
    <points ref={ref} position={[2.15, 0.25, 0]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={mat}
        size={0.038}
        color="#d4a574"
        transparent
        opacity={0.6}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  )
}

function Clouds({ intensity = 1 }: { intensity?: number }) {
  const g = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (!g.current) return
    const t = state.clock.elapsedTime
    g.current.rotation.y += 0.004 * intensity
    g.current.position.y = 0.5 + Math.sin(t * 0.7) * 0.12 * intensity
    g.current.position.x = 2.35 + Math.cos(t * 0.45) * 0.1 * intensity
  })

  return (
    <group ref={g} position={[2.35, 0.5, -0.35]}>
      {[
        [0, 0, 0, 0.58],
        [0.48, 0.12, 0.12, 0.42],
        [-0.38, -0.06, 0.16, 0.44],
        [0.18, -0.22, -0.12, 0.36],
      ].map(([x, y, z, s], i) => (
        <mesh key={i} position={[x, y, z]} scale={s}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial
            color="#e8f7f2"
            transparent
            opacity={0.58}
            roughness={1}
          />
        </mesh>
      ))}
    </group>
  )
}

function WindRibbons({
  intensity = 1,
  scrollBoostRef,
}: {
  intensity?: number
  scrollBoostRef?: RefObject<number>
}) {
  const group = useRef<THREE.Group>(null)
  const getBoost = useBoost(scrollBoostRef)
  const geos = useMemo(() => {
    return [0, 1, 2].map((i) => {
      const y = -0.55 + i * 0.42
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-3.3, y, 0.2),
        new THREE.Vector3(-1.2, y + 0.35, 0.45),
        new THREE.Vector3(0.5, y - 0.12, 0.1),
        new THREE.Vector3(2.3, y + 0.28, -0.25),
        new THREE.Vector3(3.5, y, 0),
      ])
      return new THREE.TubeGeometry(curve, 72, 0.018 + i * 0.01, 8, false)
    })
  }, [])

  useFrame((state) => {
    if (!group.current) return
    const t = state.clock.elapsedTime
    const scrollBoost = getBoost()
    group.current.position.x = Math.sin(t * 0.5 * intensity) * 0.15
    group.current.children.forEach((child, i) => {
      const mesh = child as THREE.Mesh
      const m = mesh.material as THREE.MeshBasicMaterial
      m.opacity =
        0.2 + Math.sin(t * (1.3 + i * 0.25) + i) * 0.1 + scrollBoost * 0.15
    })
  })

  return (
    <group ref={group}>
      {geos.map((geo, i) => (
        <mesh key={i} geometry={geo}>
          <meshBasicMaterial
            color={i === 1 ? '#00c896' : '#93c5fd'}
            transparent
            opacity={0.24}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}

export function ClimateScene({ intensity = 1, scrollBoostRef }: Props) {
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 6, 3]} intensity={1.45} color="#fff7ed" />
      <directionalLight position={[-4, 2, -2]} intensity={0.65} color="#7dd3c0" />
      <Globe intensity={intensity} />
      <Clouds intensity={intensity} />
      <DustField intensity={intensity} scrollBoostRef={scrollBoostRef} />
      <WindRibbons intensity={intensity} scrollBoostRef={scrollBoostRef} />
    </>
  )
}
