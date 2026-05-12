import React from 'react'
import { Link, useLocation } from 'react-router-dom'

interface Props {
  children: React.ReactNode
}

export default function Layout({ children }: Props) {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-orange-50">
      <header className="bg-primary-700 text-white shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold tracking-wide">岡商店</span>
            <span className="text-sm opacity-80 mt-1">勤怠管理</span>
          </Link>
          <nav className="flex gap-1">
            <NavLink to="/" label="ホーム" active={location.pathname === '/'} />
            <NavLink to="/admin" label="管理者" active={location.pathname.startsWith('/admin')} />
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}

function NavLink({ to, label, active }: { to: string; label: string; active: boolean }) {
  return (
    <Link
      to={to}
      className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
        active
          ? 'bg-white text-primary-700'
          : 'text-white hover:bg-primary-600'
      }`}
    >
      {label}
    </Link>
  )
}
