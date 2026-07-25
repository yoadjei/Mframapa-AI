/**
 * Export Mentismint-style hero sculptures as real GLB assets (Node-safe).
 * Run: npm run export:models
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as THREE from 'three'
import { Document, NodeIO } from '@gltf-transform/core'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '../public/models')
mkdirSync(outDir, { recursive: true })

function buildJackMeshes() {
  const meshes = []
  const hub = new THREE.SphereGeometry(0.42, 48, 48)
  meshes.push({ geometry: hub, name: 'hub' })

  const armGeo = new THREE.CylinderGeometry(0.16, 0.2, 0.95, 32)
  const capGeo = new THREE.SphereGeometry(0.22, 32, 32)
  const axes = [
    { rot: [0, 0, 0], axis: 'y' },
    { rot: [0, 0, Math.PI / 2], axis: 'x' },
    { rot: [Math.PI / 2, 0, 0], axis: 'z' },
  ]

  axes.forEach(({ rot, axis }, i) => {
    const arm = armGeo.clone()
    arm.rotateX(rot[0])
    arm.rotateY(rot[1])
    arm.rotateZ(rot[2])
    meshes.push({ geometry: arm, name: `arm-${i}` })

    for (const sign of [-1, 1]) {
      const cap = capGeo.clone()
      const pos = new THREE.Vector3()
      if (axis === 'y') pos.y = sign * 0.55
      if (axis === 'x') pos.x = sign * 0.55
      if (axis === 'z') pos.z = sign * 0.55
      cap.translate(pos.x, pos.y, pos.z)
      meshes.push({ geometry: cap, name: `cap-${axis}-${sign}` })
    }
  })

  return meshes
}

function buildBlobMeshes() {
  const knot = new THREE.TorusKnotGeometry(0.55, 0.2, 180, 32, 2, 3)
  knot.rotateX(0.35)
  knot.rotateY(0.4)
  knot.rotateZ(0.15)

  const accent = new THREE.SphereGeometry(0.28, 48, 48)
  accent.translate(0.35, -0.15, 0.2)

  return [
    { geometry: knot, name: 'knot' },
    { geometry: accent, name: 'accent' },
  ]
}

function mergeGeometries(parts) {
  const geos = parts.map((p) => {
    const g = p.geometry.index ? p.geometry : p.geometry.toNonIndexed()
    g.computeVertexNormals()
    return g
  })
  // Manual merge — avoid BufferGeometryUtils ESM quirks in Node
  let vCount = 0
  let iCount = 0
  for (const g of geos) {
    vCount += g.attributes.position.count
    iCount += g.index ? g.index.count : g.attributes.position.count
  }

  const positions = new Float32Array(vCount * 3)
  const normals = new Float32Array(vCount * 3)
  const indices = new Uint32Array(iCount)

  let vOffset = 0
  let iOffset = 0
  for (const g of geos) {
    const pos = g.attributes.position.array
    const nor = g.attributes.normal.array
    positions.set(pos, vOffset * 3)
    normals.set(nor, vOffset * 3)

    if (g.index) {
      const idx = g.index.array
      for (let i = 0; i < idx.length; i++) indices[iOffset + i] = idx[i] + vOffset
      iOffset += idx.length
    } else {
      for (let i = 0; i < g.attributes.position.count; i++) {
        indices[iOffset + i] = vOffset + i
      }
      iOffset += g.attributes.position.count
    }
    vOffset += g.attributes.position.count
  }

  return { positions, normals, indices }
}

async function writeGlb(basename, parts, colorHex, extras = {}) {
  const { positions, normals, indices } = mergeGeometries(parts)
  const doc = new Document()
  const buffer = doc.createBuffer()
  const material = doc
    .createMaterial(basename)
    .setBaseColorFactor([
      extras.r ?? Number.parseInt(colorHex.slice(1, 3), 16) / 255,
      extras.g ?? Number.parseInt(colorHex.slice(3, 5), 16) / 255,
      extras.b ?? Number.parseInt(colorHex.slice(5, 7), 16) / 255,
      1,
    ])
    .setMetallicFactor(extras.metalness ?? 0.12)
    .setRoughnessFactor(extras.roughness ?? 0.2)

  const position = doc
    .createAccessor('position')
    .setType('VEC3')
    .setArray(positions)
    .setBuffer(buffer)
  const normal = doc
    .createAccessor('normal')
    .setType('VEC3')
    .setArray(normals)
    .setBuffer(buffer)
  const index = doc
    .createAccessor('indices')
    .setType('SCALAR')
    .setArray(indices)
    .setBuffer(buffer)

  const prim = doc
    .createPrimitive()
    .setAttribute('POSITION', position)
    .setAttribute('NORMAL', normal)
    .setIndices(index)
    .setMaterial(material)

  const mesh = doc.createMesh(basename).addPrimitive(prim)
  const node = doc.createNode(basename).setMesh(mesh).setScale([1.15, 1.15, 1.15])
  const scene = doc.createScene(basename).addChild(node)
  doc.getRoot().setDefaultScene(scene)

  const io = new NodeIO()
  const glb = await io.writeBinary(doc)
  const path = join(outDir, `${basename}.glb`)
  writeFileSync(path, glb)
  console.log(`Wrote ${path} (${(glb.byteLength / 1024).toFixed(1)} KB)`)
}

await writeGlb('blue-jack', buildJackMeshes(), '#1d4ed8', {
  metalness: 0.15,
  roughness: 0.22,
})
await writeGlb('mint-blob', buildBlobMeshes(), '#00c896', {
  metalness: 0.05,
  roughness: 0.18,
})
console.log('Done.')
