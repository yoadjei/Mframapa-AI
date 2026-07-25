import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const src = readFileSync(
  join(root, '../../frontend-pwa/src/data/africanCities.js'),
  'utf8',
)
const names = [...src.matchAll(/name:\s*"([^"]+)"/g)].map((m) => m[1])
const unique = [...new Set(names)].sort((a, b) => a.localeCompare(b))

const out = `/** City names from frontend-pwa africanCities — full list for inclusive marquee. */
export const AFRICAN_CITIES = ${JSON.stringify(unique, null, 2)} as const
`

writeFileSync(join(root, '../src/content/cities.ts'), out)
console.log(`Wrote ${unique.length} cities`)
