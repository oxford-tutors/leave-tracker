'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Profile } from '@/types'

const NAV = [
  { href: '/dashboard',            label: 'Dashboard',     icon: '▦',  adminOnly: false },
  { href: '/dashboard/my-leave',   label: 'My Leave',      icon: '📅', adminOnly: false },
  { href: '/dashboard/request',    label: 'Request Leave', icon: '+',  adminOnly: false },
  { href: '/dashboard/calendar',   label: 'Calendar',      icon: '🗓', adminOnly: false },
  { href: '/dashboard/approvals',  label: 'Approvals',     icon: '✓',  adminOnly: true  },
  { href: '/dashboard/team',       label: 'Team Overview', icon: '👥', adminOnly: true  },
  { href: '/dashboard/employees',  label: 'Employees',     icon: '⚙',  adminOnly: true  },
]

export default function Sidebar({ profile, email }: { profile: Profile; email: string }) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = profile.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <aside className="fixed top-0 left-0 h-full w-64 bg-oxford flex flex-col z-10">
      {/* Logo */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <img src="https://oxfordtutors.com/OTlogo.jpg" alt="Logo"
               className="w-9 h-9 rounded-lg object-cover" />
          <div>
            <div className="font-display font-bold text-white text-xs leading-tight">
              OXFORD <span className="text-gold">&</span> CAMBRIDGE
            </div>
            <div className="text-blue-300 text-xs">Leave Management</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {profile.role === 'admin' && (
          <p className="text-blue-400 text-xs font-semibold uppercase tracking-wider px-3 mb-2 mt-1">Menu</p>
        )}
        {NAV.filter(n => !n.adminOnly).map(item => (
          <NavItem key={item.href} item={item} active={pathname === item.href} />
        ))}

        {profile.role === 'admin' && (
          <>
            <p className="text-blue-400 text-xs font-semibold uppercase tracking-wider px-3 mb-2 mt-4">Admin</p>
            {NAV.filter(n => n.adminOnly).map(item => (
              <NavItem key={item.href} item={item} active={pathname === item.href} />
            ))}
          </>
        )}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-gold flex items-center justify-center
                          font-display font-bold text-oxford text-sm shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="text-white text-sm font-medium truncate">{profile.name}</div>
            <div className="text-blue-300 text-xs truncate">{email}</div>
          </div>
        </div>
        <button onClick={signOut}
                className="w-full text-center text-sm text-blue-300 hover:text-white
                           py-2 rounded-lg hover:bg-white/10 transition-colors duration-150">
          Sign out
        </button>
      </div>
    </aside>
  )
}

function NavItem({ item, active }: { item: typeof NAV[0]; active: boolean }) {
  return (
    <Link href={item.href}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150
            ${active
              ? 'bg-gold text-oxford font-semibold'
              : 'text-blue-100 hover:bg-white/10 hover:text-white'}`}>
      <span className="text-base w-5 text-center">{item.icon}</span>
      {item.label}
    </Link>
  )
}
