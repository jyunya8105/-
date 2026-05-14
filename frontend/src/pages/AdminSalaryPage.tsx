import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSalaryReport } from '../utils/api'

interface SalaryEntry {
  employee: { id: number; name: string; hourly_wage: number; paid_leave_days: number }
  total_minutes: number; total_hours: number; remain_minutes: number; salary: number; paid_leaves: number
}

export default function AdminSalaryPage() {
  const navigate = useNavigate()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [report, setReport] = useState<SalaryEntry[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem('adminAuth') !== 'true') { navigate('/admin'); return }
  }, [])

  useEffect(() => {
    setLoading(true)
    getSalaryReport(year, month).then(data => setReport(data as SalaryEntry[])).catch(() => {}).finally(() => setLoading(false))
  }, [year, month])

  const totalSalary = report.reduce((s, r) => s + r.salary, 0)
  const totalMinutes = report.reduce((s, r) => s + r.total_minutes, 0)

  return (
    <div className="space-y-5">
      <h1 className="page-title">給与計算</h1>

      {/* Month nav */}
      <div className="flex items-center gap-1">
        <button onClick={() => { const d = new Date(year, month - 2); setYear(d.getFullYear()); setMonth(d.getMonth() + 1) }} className="btn-secondary px-2.5">←</button>
        <span className="px-3 font-semibold text-gray-900">{year}年{month}月</span>
        <button onClick={() => { const d = new Date(year, month); setYear(d.getFullYear()); setMonth(d.getMonth() + 1) }} className="btn-secondary px-2.5">→</button>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <p className="text-xs text-gray-400 mb-1">総稼働時間</p>
          <p className="text-xl font-bold text-gray-900">
            {Math.floor(totalMinutes / 60)}<span className="text-sm font-normal text-gray-400 ml-0.5">h</span>
            {totalMinutes % 60}<span className="text-sm font-normal text-gray-400 ml-0.5">m</span>
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-400 mb-1">給与合計</p>
          <p className="text-xl font-bold text-emerald-600">¥{totalSalary.toLocaleString()}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-accent-400 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-2.5">
          {report.map(entry => (
            <div key={entry.employee.id} className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-gray-500">{entry.employee.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{entry.employee.name}</p>
                    <p className="text-xs text-gray-400">¥{entry.employee.hourly_wage.toLocaleString()}/h</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-emerald-600">¥{entry.salary.toLocaleString()}</p>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-50">
                <div className="text-center">
                  <p className="text-xs text-gray-400 mb-0.5">稼働時間</p>
                  <p className="text-sm font-semibold text-gray-700">
                    {entry.total_hours}h{entry.remain_minutes}m
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400 mb-0.5">有給取得</p>
                  <p className="text-sm font-semibold text-gray-700">{entry.paid_leaves}日</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400 mb-0.5">計算式</p>
                  <p className="text-xs text-gray-400">
                    {entry.total_hours}h{entry.remain_minutes}m × ¥{entry.employee.hourly_wage.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {report.length === 0 && (
            <div className="card p-10 text-center text-sm text-gray-300">データがありません</div>
          )}
        </div>
      )}
    </div>
  )
}
