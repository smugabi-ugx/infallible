import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import {
  Smartphone, Plus, LogOut, LayoutDashboard,
  Bell, Command, Settings, Menu, X, ChevronRight
} from 'lucide-react'
import InfallibleIcon from './InfallibleIcon'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/dashboard/add-device', icon: Plus, label: 'Add Device' },
  { to: '#alerts', icon: Bell, label: 'Alerts', soon: true },
  { to: '#commands', icon: Command, label: 'Commands', soon: true },
  { to: '#settings', icon: Settings, label: 'Settings', soon: true },
]

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase()

  const isActive = (item) => item.exact
    ? location.pathname === item.to
    : location.pathname.startsWith(item.to) && item.to !== '/dashboard'

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-64 flex-shrink-0 flex flex-col
        bg-[#0b1120] border-r border-white/5
        transition-transform duration-200
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-white/5">
          <Link to="/dashboard" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
            <InfallibleIcon size={32} />
            <span className="font-bold text-white tracking-tight">Infallible</span>
          </Link>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Navigation</p>
          {NAV.map(item => {
            const active = isActive(item)
            return (
              <Link
                key={item.label}
                to={item.soon ? '#' : item.to}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group
                  ${active
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : item.soon
                      ? 'text-slate-600 cursor-default'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.soon && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-500">
                    Soon
                  </span>
                )}
                {active && !item.soon && <ChevronRight className="h-3.5 w-3.5 opacity-60" />}
              </Link>
            )
          })}
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-indigo-900 flex items-center justify-center flex-shrink-0 border border-indigo-700">
              <span className="text-xs font-bold text-indigo-300">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              {user?.name && <p className="text-sm font-semibold text-white truncate">{user.name}</p>}
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="p-1.5 text-slate-600 hover:text-slate-300 hover:bg-white/5 rounded-lg transition-colors flex-shrink-0"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <div className="flex lg:hidden items-center gap-3 px-4 h-14 bg-white border-b border-slate-200 flex-shrink-0">
          <button onClick={() => setMobileOpen(true)} className="p-2 text-slate-500 hover:text-slate-900">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md overflow-hidden">
              <InfallibleIcon size={24} />
            </div>
            <span className="font-bold text-slate-900">Infallible</span>
          </div>
          <div className="ml-auto">
            <Link to="/dashboard/add-device" className="btn-primary text-xs py-1.5 px-3">
              <Plus className="h-3.5 w-3.5" /> Add
            </Link>
          </div>
        </div>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
