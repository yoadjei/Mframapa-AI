import { Link } from 'react-router-dom'
import { RainMark } from './RainMark'

type Props = {
  onDark?: boolean
}

/** Rain icon + mframapa wordmark (not the full PNG lockup). */
export function Logo({ onDark = false }: Props) {
  const word = onDark ? 'text-white' : 'text-ink'

  return (
    <Link to="/" className="inline-flex items-center gap-2.5 no-underline">
      <RainMark size={28} />
      <span className={`font-display text-[1.15rem] font-bold tracking-tight lowercase ${word}`}>
        <span className="text-mint">m</span>framapa
      </span>
    </Link>
  )
}
