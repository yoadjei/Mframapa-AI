import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { Logo } from './Logo'
import { APP_URL } from '../lib/constants'
import { copy } from '../content/copy'

const links = [
  { to: '/about', label: 'Company' },
  { to: '/support', label: 'Support' },
]

export function Nav() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-canvas/80 backdrop-blur-xl">
      <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between px-5 md:px-8">
        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `text-[15px] font-medium transition ${
                  isActive ? 'text-ink' : 'text-muted hover:text-ink'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="md:absolute md:left-1/2 md:-translate-x-1/2">
          <Logo />
        </div>

        <div className="flex items-center gap-3">
          <a
            href={APP_URL}
            className="hidden rounded-full bg-ink px-5 py-2.5 text-[14px] font-semibold text-white transition hover:opacity-90 md:inline-flex"
          >
            {copy.nav.cta}
          </a>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl md:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-line bg-canvas px-5 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="text-base font-medium text-ink"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <a
              href={APP_URL}
              className="inline-flex w-fit rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white"
            >
              {copy.nav.cta}
            </a>
          </div>
        </div>
      ) : null}
    </header>
  )
}
