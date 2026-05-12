import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { getSalaryReport } from '../utils/api'
import { formatMinutes } from '../utils/holidays'

interface SalaryEntry {
  employee: { id: number; name: string; hourly_wage: number; paid_leave_days: number }
  total_minutes: number
  total_hours: number
  remain_minutes: number
  salary: number
  paid_leaves: number
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
    getSalaryReport(year, month)
      .then(data => setReport(data as SalaryEntry[]))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [year, month])

  const totalSalary = report.reduce((sum, r) => sum + r.salary, 0)
  const totalMinutes = report.reduce((sum, r) => sum + r.total_minutes, 0)

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin/dashboard" className="text-gray-500 hover:text-gray-700">← 戻る</Link>
        <h1 className="text-2xl font-bold text-gray-800">給与計算</h1>
      </div>

      <div className="flex items-center gap-1 mb-6">
        <button onClick={() => {
          const d = new Date(year, month - 2)
          setYear(d.getFullYear()); setMonth(d.getMonth() + 1)
        }} className="border rounded px-2 py-1.5 text-sm hover:bg-gray-50">←</button>
        <span className="px-3 font-bold text-gray-800">{year}年{month}月</span>
        <button onClick={() => {
          const d = new Date(year, month)
          setYear(d.getFullYear()); setMonth(d.getMonth() + 1)
        }} className="border rounded px-2 py-1.5 text-sm hover:bg-gray-50">→</button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 text-center">
          <p className="text-sm text-gray-500 mb-1">全従業員 総稼働時間</p>
          <p className="text-xl font-bold text-primary-700">{formatMinutes(totalMinutes)}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-sm text-gray-500 mb-1">全従業員 給与合計</p>
          <p className="text-xl font-bold text-green-700">¥{totalSalary.toLocaleString()}</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">読み込み中...</div>
      ) : (
        <div className="space-y-3">
          {report.map(entry => (
            <div key={entry.employee.id} className="bg-white rounded-2xl shadow p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="font-bold text-primary-700 text-sm">{entry.employee.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{entry.employee.name}</p>
                    <p className="text-xs text-gray-500">時給 ¥{entry.employee.hourly_wage.toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-700">¥{entry.salary.toLocaleString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t">
                <div className="text-center">
                  <p className="text-xs text-gray-400">稼働時間</p>
                  <p className="font-semibold text-gray-700 text-sm">{formatMinutes(entry.total_minutes)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400">有給取得</p>
                  <p className="font-semibold text-gray-700 text-sm">{entry.paid_leaves}日</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400">時給 × 時間</p>
                  <p className="text-xs text-gray-500">
                    ¥{entry.employee.hourly_wage.toLocaleString()} × {entry.total_hours}h{entry.remain_minutes}m
                  </p>
                </div>
              </div>
            </div>
          ))}

          {report.length === 0 && (
            <div className="text-center py-12 text-gray-400">データがありません</div>
          )}
        </div>
      )}
    </div>
  )
}
