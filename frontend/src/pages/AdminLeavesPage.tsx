import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { PaidLeave, getAllLeaves, updateLeaveStatus } from '../utils/api'
import { getJapaneseDay } from '../utils/holidays'
import StatusBadge from '../components/StatusBadge'

export default function AdminLeavesPage() {
  const navigate = useNavigate()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [leaves, setLeaves] = useState<PaidLeave[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')

  useEffect(() => {
    if (sessionStorage.getItem('adminAuth') !== 'true') { navigate('/admin'); return }
  }, [])

  useEffect(() => {
    setLoading(true)
    getAllLeaves(year, month)
      .then(data => setLeaves(data as PaidLeave[]))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [year, month])

  const handleStatus = async (id: number, status: string, empName: string) => {
    const label = status === 'approved' ? '承認' : '却下'
    if (!confirm(`${empName}の有給申請を${label}しますか？`)) return
    try {
      const updated = await updateLeaveStatus(id, status)
      setLeaves(prev => prev.map(l => l.id === id ? { ...l, status: updated.status } : l))
      setMessage({ type: 'success', text: `${label}しました` })
    } catch (e: any) {
      setMessage({ type: 'error', text: e.response?.data?.error || 'エラーが発生しました' })
    }
  }

  const filtered = filter === 'all' ? leaves : leaves.filter(l => l.status === filter)
  const pendingCount = leaves.filter(l => l.status === 'pending').length

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin/dashboard" className="text-gray-500 hover:text-gray-700">← 戻る</Link>
        <h1 className="text-2xl font-bold text-gray-800">有給管理</h1>
        {pendingCount > 0 && (
          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingCount}件の申請中</span>
        )}
      </div>

      {message && (
        <div className={`rounded-lg p-3 mb-4 text-sm font-medium ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>{message.text}</div>
      )}

      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-1">
          <button onClick={() => {
            const d = new Date(year, month - 2)
            setYear(d.getFullYear()); setMonth(d.getMonth() + 1)
          }} className="border rounded px-2 py-1.5 text-sm hover:bg-gray-50">←</button>
          <span className="px-2 text-sm font-medium">{year}年{month}月</span>
          <button onClick={() => {
            const d = new Date(year, month)
            setYear(d.getFullYear()); setMonth(d.getMonth() + 1)
          }} className="border rounded px-2 py-1.5 text-sm hover:bg-gray-50">→</button>
        </div>

        <div className="flex gap-1">
          {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                filter === f ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f === 'all' ? 'すべて' : f === 'pending' ? '申請中' : f === 'approved' ? '承認済' : '却下'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">読み込み中...</div>
      ) : (
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          {filtered.length === 0 ? (
            <div className="px-4 py-10 text-center text-gray-400">申請がありません</div>
          ) : (
            <ul className="divide-y">
              {filtered.map(leave => (
                <li key={leave.id} className="px-4 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-800">{leave.employee_name}</p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {leave.date}（{getJapaneseDay(leave.date)}）
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={leave.status} />
                      {leave.status === 'pending' && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleStatus(leave.id, 'approved', leave.employee_name || '')}
                            className="bg-green-500 text-white px-2.5 py-1 rounded-lg text-xs font-medium hover:bg-green-600"
                          >
                            承認
                          </button>
                          <button
                            onClick={() => handleStatus(leave.id, 'rejected', leave.employee_name || '')}
                            className="bg-red-500 text-white px-2.5 py-1 rounded-lg text-xs font-medium hover:bg-red-600"
                          >
                            却下
                          </button>
                        </div>
                      )}
                      {leave.status === 'approved' && (
                        <button
                          onClick={() => handleStatus(leave.id, 'rejected', leave.employee_name || '')}
                          className="text-xs text-red-500 hover:underline"
                        >
                          取消
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
