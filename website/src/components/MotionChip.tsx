import { useSiteMotion } from '../lib/motionPreference'

/** Shown only when OS reduce-motion is freezing the feel — one click unlocks full motion. */
export function MotionChip() {
  const { osReduce, forced, forceFull } = useSiteMotion()
  if (!osReduce || forced) return null

  return (
    <button
      type="button"
      onClick={forceFull}
      className="fixed right-4 bottom-4 z-[80] rounded-full bg-ink px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-ink/30"
    >
      Enable motion
    </button>
  )
}
