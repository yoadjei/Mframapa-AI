/**
 * Rain-only favicons from the canonical MframapaLogo cloud-rain paths.
 * Not the full lockup PNG (rain + wordmark) — that squashes in browser tabs.
 */
import sharp from 'sharp'
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = join(root, 'public')

function rainSvg(size, bg = null) {
  const pad = size * 0.18
  const inner = size - pad * 2
  const bgRect = bg
    ? `<rect width="${size}" height="${size}" rx="${size * 0.18}" fill="${bg}"/>`
    : ''
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  ${bgRect}
  <g transform="translate(${pad},${pad}) scale(${inner / 24})">
    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" fill="none" stroke="#00C896" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M8 14v7" fill="none" stroke="#00C896" stroke-width="2" stroke-linecap="round"/>
    <path d="M12 16v7" fill="none" stroke="#00C896" stroke-width="2" stroke-linecap="round"/>
    <path d="M16 14v7" fill="none" stroke="#00C896" stroke-width="2" stroke-linecap="round"/>
  </g>
</svg>`)
}

const jobs = [
  { file: 'favicon.png', size: 32, bg: null },
  { file: 'favicon-192.png', size: 192, bg: '#FFFFFF' },
  { file: 'apple-touch-icon.png', size: 180, bg: '#0A0D12' },
  { file: 'og-icon.png', size: 512, bg: '#FFFFFF' },
]

for (const job of jobs) {
  const out = join(publicDir, job.file)
  await sharp(rainSvg(job.size, job.bg)).png().toFile(out)
  console.log('wrote', job.file)
}

// Keep favicon.svg in sync (transparent, mark only)
writeFileSync(
  join(publicDir, 'favicon.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#00C896" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/>
  <path d="M8 14v7"/>
  <path d="M12 16v7"/>
  <path d="M16 14v7"/>
</svg>
`,
)
console.log('wrote favicon.svg')
