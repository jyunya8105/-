import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { changeAdminPassword } from '../utils/api'

export default function AdminDashboardPage() {
  const navigate = useNavigate()

  useEffect(() => {
    if (sessionStorage.getItem('adminAuth') !== 'true') {
      navigate('/admin')
    }
  }, [])

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuth')
    navigate('/admin')
  }

  const menuItems = [
    { to: '/admin/employees', icon: '👥', title: '従業員管理', desc: '従業員の追加・編集・削除' },
    { to: '/admin/attendance', icon: '📋', title: '打刻修正', desc: '勤怠打刻の修正・追加' },
    { to: '/admin/salary', icon: '💰', title: '給与計算', desc: '月次稼働時間と給与確認' },
    { to: '/admin/leaves', icon: '📅', title: '有給管理', desc: '有給申請の承認・却下' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">管理者ダッシュボード</h1>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-gray-700 border rounded-lg px-3 py-1.5 hover:bg-gray-50"
        >
          ログアウト
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {menuItems.map(item => (
          <Link
            key={item.to}
            to={item.to}
            className="bg-white rounded-2xl shadow p-6 hover:shadow-md hover:bg-primary-50 transition-all border-2 border-transparent hover:border-primary-200"
          >
            <span className="text-4xl mb-3 block">{item.icon}</span>
            <h2 className="font-bold text-gray-800 text-lg">{item.title}</h2>
            <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="font-bold text-gray-700 mb-4">パスワード変更</h2>
        <PasswordChangeForm />
      </div>
    </div>
  )
}

function PasswordChangeForm() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (next !== confirm) { setMessage({ type: 'error', text: '新しいパスワードが一致しません' }); return }
    if (next.length < 4) { setMessage({ type: 'error', text: 'パスワードは4文字以上にしてください' }); return }
    setLoading(true)
    setMessage(null)
    try {
      await changeAdminPassword(current, next)
      setMessage({ type: 'success', text: 'パスワードを変更しました' })
      setCurrent(''); setNext(''); setConfirm('')
    } catch (e: any) {
      setMessage({ type: 'error', text: e.response?.data?.error || 'エラーが発生しました' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 max-w-sm">
      <input
        type="password"
        placeholder="現在のパスワード"
        value={current}
        onChange={e => setCurrent(e.target.value)}
        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
      />
      <input
        type="password"
        placeholder="新しいパスワード（4文字以上）"
        value={next}
        onChange={e => setNext(e.target.value)}
        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
      />
      <input
        type="password"
        placeholder="新しいパスワード（確認）"
        value={confirm}
        onChange={e => setConfirm(e.target.value)}
        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
      />
      {message && (
        <p className={`text-sm ${message.type === 'success' ? 'text-green-700' : 'text-red-600'}`}>
          {message.text}
        </p>
      )}
      <button
        type="submit"
        disabled={loading || !current || !next || !confirm}
        className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
      >
        変更する
      </button>
    </form>
  )
}
