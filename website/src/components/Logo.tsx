import { Link } from 'react-router-dom'

type Props = {
  onDark?: boolean
}

export function Logo({ onDark = false }: Props) {
  const word = onDark ? 'text-white' : 'text-ink'

  return (
    <Link to="/" className="inline-flex items-center gap-2.5 no-underline">
      <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#00C896"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
        <path d="M8 14v7" />
        <path d="M12 16v7" />
        <path d="M16 14v7" />
      </svg>
      <span className={`font-display text-[1.15rem] font-bold tracking-tight ${word}`}>
        <span className="text-mint">M</span>framapa
      </span>
    </Link>
  )
}
