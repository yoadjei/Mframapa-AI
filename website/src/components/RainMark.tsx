/** Rain cloud mark only — matches the app icon, no wordmark. */
export function RainMark({
  size = 28,
  className = '',
}: {
  size?: number
  className?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {/* Cloud outline */}
      <path
        d="M14.5 28.5c-3.6 0-6.5-2.8-6.5-6.3 0-3.2 2.4-5.9 5.5-6.3C14.5 11.5 18.2 8.5 23 8.5c5.2 0 9.3 3.7 10.1 8.6 3.4.4 6 3.2 6 6.6 0 3.7-3 6.8-6.8 6.8H14.5z"
        stroke="#00C896"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Rain bars */}
      <path
        d="M18 33.5v7.5M24 32v9M30 33.5v7.5"
        stroke="#00C896"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
    </svg>
  )
}
