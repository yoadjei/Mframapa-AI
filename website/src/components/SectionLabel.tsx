type Props = {
  children: string
  onDark?: boolean
}

export function SectionLabel({ children, onDark = false }: Props) {
  return (
    <p
      className={`mb-3 text-xs font-semibold tracking-[0.18em] uppercase ${
        onDark ? 'text-mint' : 'text-mint-dark'
      }`}
    >
      {children}
    </p>
  )
}
