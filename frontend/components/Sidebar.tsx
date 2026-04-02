'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Users, TrendingUp, CheckSquare, Mic, LogOut, Building2 } from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import clsx from 'clsx'

const nav = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/clients', icon: Users, label: 'Clientes' },
  { href: '/dashboard/pipeline', icon: TrendingUp, label: 'Pipeline' },
  { href: '/dashboard/tasks', icon: CheckSquare, label: 'Tareas' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, company, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center shadow-md shadow-brand-500/30">
            <Mic className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">VoiceCRM</p>
            <p className="text-xs text-gray-400 truncate max-w-[120px]">{company?.name}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {nav.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
              pathname === href
                ? 'bg-brand-50 text-brand-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            <Icon className="w-4.5 h-4.5 w-[18px] h-[18px]" />
            {label}
          </Link>
        ))}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center">
            <span className="text-brand-600 text-xs font-bold">{user?.name?.[0]?.toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 truncate">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
