import { Link } from 'react-router-dom'

type Props = {
  onDark?: boolean
}

/** App mark from mobile/assets/icon.png — cloud + rain bars. */
export function Logo({ onDark = false }: Props) {
  const word = onDark ? 'text-white' : 'text-ink'

  return (
    <Link to="/" className="inline-flex items-center gap-2.5 no-underline">
      <img
        src="/logo.png"
        alt=""
        width={28}
        height={28}
        className="h-7 w-7 object-contain"
        decoding="async"
      />
      <span className={`font-display text-[1.15rem] font-bold tracking-tight ${word}`}>
        <span className="text-mint">m</span>framapa
      </span>
    </Link>
  )
}
