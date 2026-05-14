import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

interface Props {
  children: React.ReactNode
}

export default function Layout({ children }: Props) {
  const location = useLocation()
  const navigate = useNavigate()
  const isAdmin = location.pathname.startsWith('/admin')
  const isAdminAuthed = sessionStorage.getItem('adminAuth') === 'true'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-accent-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">岡</span>
            </div>
            <span className="font-bold text-gray-900 tracking-tight">岡商店</span>
            <span className="text-gray-300 text-sm">|</span>
            <span className="text-gray-400 text-sm">勤怠管理</span>
          </Link>

          <div className="flex items-center gap-1">
            {isAdmin && isAdminAuthed ? (
              <button
                onClick={() => { sessionStorage.removeItem('adminAuth'); navigate('/admin') }}
                className="btn-ghost text-xs"
              >
                ログアウト
              </button>
            ) : (
              <Link
                to="/admin"
                className={`btn-ghost text-xs ${location.pathname.startsWith('/admin') ? 'text-accent-600 bg-accent-50' : ''}`}
              >
                管理者
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Admin breadcrumb */}
      {isAdmin && isAdminAuthed && location.pathname !== '/admin/dashboard' && (
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-4 py-2 flex items-center gap-2 text-xs text-gray-400">
            <Link to="/admin/dashboard" className="hover:text-gray-600 transition-colors">管理者</Link>
            <span>/</span>
            <span className="text-gray-600">{breadcrumbLabel(location.pathname)}</span>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}

function breadcrumbLabel(path: string) {
  const map: Record<string, string> = {
    '/admin/employees': '従業員管理',
    '/admin/attendance': '打刻修正',
    '/admin/salary': '給与計算',
    '/admin/leaves': '有給管理',
  }
  return map[path] ?? ''
}
