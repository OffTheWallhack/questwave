import { Globe2, Layers, Sparkles, User } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { t } from '../lib/i18n'
import { useSession } from '../lib/session'

const items = [
  { to: '/', key: 'today' as const, Icon: Globe2, color: '#FFB21E' },
  { to: '/feed', key: 'feed' as const, Icon: Sparkles, color: '#FF4B4B' },
  { to: '/library', key: 'library' as const, Icon: Layers, color: '#1FA2FF' },
  { to: '/profile', key: 'profile' as const, Icon: User, color: '#3FCB8A' },
]

export default function TabBar() {
  const { lang } = useSession()
  return (
    <nav className="fixed inset-x-0 z-40 mx-auto max-w-md px-3" style={{ bottom: 'calc(var(--safe-bottom) + 10px)' }}>
      <ul className="panel flex gap-1.5 rounded-[14px] p-2">
        {items.map(({ to, key, Icon, color }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={to === '/'}
              className="flex flex-col items-center gap-0.5 rounded-[10px] border-[3px] py-1.5 text-[18px] leading-none transition-transform active:translate-y-[3px]"
              style={({ isActive }) =>
                isActive
                  ? { background: color, borderColor: '#120E20', boxShadow: 'inset 0 -4px 0 rgba(0,0,0,0.25), 0 3px 0 rgba(0,0,0,0.5)' }
                  : { borderColor: 'transparent', color: '#B5AECB' }
              }
            >
              <Icon size={22} strokeWidth={2.4} />
              {t(key, lang)}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
