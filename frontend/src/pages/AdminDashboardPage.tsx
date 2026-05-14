import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { changeAdminPassword } from '../utils/api'

export default function AdminDashboardPage() {
  const navigate = useNavigate()

  useEffect(() => {
    if (sessionStorage.getItem('adminAuth') !== 'true') navigate('/admin')
  }, [])

  const menuItems = [
    { to: '/admin/employees', icon: '👥', title: '従業員管理', desc: '追加・編集・削除' },
    { to: '/admin/attendance', icon: '📋', title: '打刻修正',   desc: '記録の修正・追加' },
    { to: '/admin/salary',    icon: '💰', title: '給与計算',   desc: '月次レポート' },
    { to: '/admin/leaves',    icon: '📅', title: '有給管理',   desc: '申請の承認・却下' },
  ]

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="page-title">管理者メニュー</h1>

      <div className="grid grid-cols-2 gap-3">
        {menuItems.map(item => (
          <Link
            key={item.to}
            to={item.to}
            className="card p-5 hover:shadow-card-md hover:ring-1 hover:ring-gray-200 active:scale-[0.98] transition-all"
          >
            <span className="text-2xl mb-3 block">{item.icon}</span>
            <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
            <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
          </Link>
        ))}
      </div>

      <div className="card p-5">
        <p className="section-title mb-4">パスワード変更</p>
        <PasswordChangeForm />
      </div>
    </div>
  )
}

function PasswordChangeForm() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (next !== confirm) { setMsg({ type: 'error', text: '新しいパスワードが一致しません' }); return }
    if (next.length < 4)  { setMsg({ type: 'error', text: '4文字以上にしてください' }); return }
    setLoading(true); setMsg(null)
    try {
      await changeAdminPassword(current, next)
      setMsg({ type: 'success', text: 'パスワードを変更しました' })
      setCurrent(''); setNext(''); setConfirm('')
    } catch (e: any) {
      setMsg({ type: 'error', text: e.response?.data?.error || 'エラーが発生しました' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="label">現在のパスワード</label>
        <input type="password" placeholder="••••••••" value={current} onChange={e => setCurrent(e.target.value)} className="input" />
      </div>
      <div>
        <label className="label">新しいパスワード（4文字以上）</label>
        <input type="password" placeholder="••••••••" value={next} onChange={e => setNext(e.target.value)} className="input" />
      </div>
      <div>
        <label className="label">確認</label>
        <input type="password" placeholder="••••••••" value={confirm} onChange={e => setConfirm(e.target.value)} className="input" />
      </div>
      {msg && (
        <p className={`text-xs ${msg.type === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>{msg.text}</p>
      )}
      <button type="submit" disabled={loading || !current || !next || !confirm} className="btn-primary">
        変更する
      </button>
    </form>
  )
}
