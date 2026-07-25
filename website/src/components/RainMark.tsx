/**
 * Rain cloud mark — same paths as PWA/mobile `MframapaLogo` (Lucide cloud-rain).
 * Icon only; wordmark sits beside it in Logo/Footer.
 */
export function RainMark({
  size = 28,
  className = '',
  color = '#00C896',
}: {
  size?: number
  className?: string
  color?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
      <path d="M8 14v7" />
      <path d="M12 16v7" />
      <path d="M16 14v7" />
    </svg>
  )
}
