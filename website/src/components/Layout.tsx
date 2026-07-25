import { Outlet } from 'react-router-dom'
import { Nav } from './Nav'
import { Footer } from './Footer'
import { SmoothScroll } from './SmoothScroll'
import { ScrollProgress } from './ScrollProgress'
import { MotionChip } from './MotionChip'

export function Layout() {
  return (
    <SmoothScroll>
      <ScrollProgress />
      <MotionChip />
      <div className="flex min-h-dvh flex-col">
        <Nav />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </SmoothScroll>
  )
}
