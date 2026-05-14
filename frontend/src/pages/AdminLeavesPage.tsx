import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PaidLeave, getAllLeaves, updateLeaveStatus } from '../utils/api'
import { getJapaneseDay } from '../utils/holidays'
import StatusBadge from '../components/StatusBadge'

type Filter = 'all' | 'pending' | 'approved' | 'rejected'

export default function AdminLeavesPage() {
  const navigate = useNavigate()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [leaves, setLeaves] = useState<PaidLeave[]>([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    if (sessionStorage.getItem('adminAuth') !== 'true') { navigate('/admin'); return }
  }, [])

  useEffect(() => {
    setLoading(true)
    getAllLeaves(year, month).then(data => setLeaves(data as PaidLeave[])).catch(() => {}).finally(() => setLoading(false))
  }, [year, month])

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text }); setTimeout(() => setToast(null), 3000)
  }

  const handleStatus = async (id: number, status: string, empName: string) => {
    const label = status === 'approved' ? '承認' : '却下'
    if (!confirm(`${empName}の有給申請を${label}しますか？`)) return
    try {
      const updated = await updateLeaveStatus(id, status)
      setLeaves(prev => prev.map(l => l.id === id ? { ...l, status: updated.status } : l))
      showToast('success', `${label}しました`)
    } catch (e: any) { showToast('error', e.response?.data?.error || 'エラーが発生しました') }
  }

  const filtered = filter === 'all' ? leaves : leaves.filter(l => l.status === filter)
  const pendingCount = leaves.filter(l => l.status === 'pending').length

  const filterLabels: Record<Filter, string> = { all: 'すべて', pending: '申請中', approved: '承認済', rejected: '却下' }

  return (
    <div className="space-y-5">
      {toast && <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.type === 'success' ? 'bg-gray-900 text-white' : 'bg-red-500 text-white'}`}>{toast.text}</div>}

      <div className="flex items-center gap-3">
        <h1 className="page-title">有給管理</h1>
        {pendingCount > 0 && (
          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">{pendingCount}</span>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="flex items-center gap-1">
          <button onClick={() => { const d = new Date(year, month - 2); setYear(d.getFullYear()); setMonth(d.getMonth() + 1) }} className="btn-secondary px-2.5">←</button>
          <span className="px-3 text-sm font-medium text-gray-700">{year}年{month}月</span>
          <button onClick={() => { const d = new Date(year, month); setYear(d.getFullYear()); setMonth(d.getMonth() + 1) }} className="btn-secondary px-2.5">→</button>
        </div>

        <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
          {(['all', 'pending', 'approved', 'rejected'] as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {filterLabels[f]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-accent-400 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="card overflow-hidden">
          {filtered.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-gray-300">申請がありません</p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {filtered.map(leave => (
                <li key={leave.id} className="px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{leave.employee_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5 tabular-nums">
                      {leave.date}（{getJapaneseDay(leave.date)}）
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={leave.status} />
                    {leave.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatus(leave.id, 'approved', leave.employee_name || '')}
                          className="bg-emerald-500 text-white px-2.5 py-1 rounded-lg text-xs font-medium hover:bg-emerald-600"
                        >承認</button>
                        <button
                          onClick={() => handleStatus(leave.id, 'rejected', leave.employee_name || '')}
                          className="bg-red-500 text-white px-2.5 py-1 rounded-lg text-xs font-medium hover:bg-red-600"
                        >却下</button>
                      </>
                    )}
                    {leave.status === 'approved' && (
                      <button onClick={() => handleStatus(leave.id, 'rejected', leave.employee_name || '')} className="text-xs text-gray-300 hover:text-red-400 transition-colors">取消</button>
                    )}
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
