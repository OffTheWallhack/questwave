import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Swirl from './components/Swirl'
import TabBar from './components/TabBar'
import { SessionProvider, useSession } from './lib/session'
import { OFFLINE, CONFIGURED } from './lib/supabase'
import { GANG_COLOR } from './lib/types'
import Admin from './pages/Admin'
import Feed from './pages/Feed'
import Legal from './pages/Legal'
import Library from './pages/Library'
import Onboarding from './pages/Onboarding'
import ProfilePage from './pages/ProfilePage'
import SignIn from './pages/SignIn'
import Today from './pages/Today'

/** Keď chýbajú kľúče k databáze, ukáž návod namiesto rozbitej appky. */
function Setup() {
  return (
    <div className="mx-auto max-w-md p-5 pt-12">
      <div className="panel space-y-3 rounded-[12px] p-5">
        <p className="display text-[44px]">Chýba nastavenie</p>
        <p className="text-[22px] leading-tight">
          Appka nevie, ku ktorej databáze sa pripojiť. Doplň premenné <span className="text-gold">VITE_SUPABASE_URL</span> a{' '}
          <span className="text-gold">VITE_SUPABASE_ANON_KEY</span> — lokálne do súboru .env, pri nasadení do
          .github/workflows/pages.yml — a nasaď znova.
        </p>
      </div>
    </div>
  )
}

function Shell() {
  const { session, profile, loading } = useSession()
  if (!OFFLINE && !CONFIGURED) return <Setup />
  const { pathname } = useLocation()

  if (loading) return null


  const legal = ['/about', '/privacy', '/terms'].includes(pathname)
  if (!session && !legal && pathname !== '/signin') return <Navigate to="/signin" replace />
  if (session && !profile && pathname !== '/onboarding' && !legal) return <Navigate to="/onboarding" replace />
  if (session && profile && (pathname === '/onboarding' || pathname === '/signin')) return <Navigate to="/" replace />

  const gang = profile?.gang ? GANG_COLOR[profile.gang] : '#FFB21E'

  return (
    <div className="mx-auto min-h-[100dvh] max-w-md" style={{ ['--gang' as string]: gang }}>
      <Routes>
        <Route path="/" element={<Today />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/library" element={<Library />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/about" element={<Legal kind="about" />} />
        <Route path="/privacy" element={<Legal kind="privacy" />} />
        <Route path="/terms" element={<Legal kind="terms" />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {profile && <TabBar />}
    </div>
  )
}

export default function App() {
  return (
    <SessionProvider>
      <Swirl />
      <Shell />
      <div className="crt" aria-hidden />
    </SessionProvider>
  )
}
