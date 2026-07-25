import { Link } from 'react-router-dom'
import { APP_URL, LINKEDIN_URL } from '../lib/constants'
import { copy } from '../content/copy'
import { RainMark } from './RainMark'

const links = [
  { to: '/about', label: 'Company' },
  { to: '/support', label: 'Support' },
  { to: '/privacy', label: 'Privacy policy' },
  { to: '/terms', label: 'Terms of use' },
]

export function Footer() {
  return (
    <footer className="border-t border-line bg-canvas">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-12 md:flex-row md:items-start md:justify-between md:px-8">
        <div>
          <p className="inline-flex items-center gap-2 font-display text-lg font-bold lowercase text-ink">
            <RainMark size={22} />
            <span>
              <span className="text-mint">m</span>framapa
            </span>
          </p>
          <p className="mt-2 text-sm text-muted">© {new Date().getFullYear()}</p>
          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-ink"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.26 2.37 4.26 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.23 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.73V1.73C24 .77 23.21 0 22.23 0z" />
            </svg>
            LinkedIn
          </a>
        </div>

        <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Footer">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="text-sm text-muted transition hover:text-ink">
              {l.label}
            </Link>
          ))}
        </nav>

        <a
          href={APP_URL}
          className="inline-flex w-fit rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white"
        >
          {copy.nav.cta}
        </a>
      </div>
    </footer>
  )
}
