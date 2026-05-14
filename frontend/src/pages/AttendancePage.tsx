import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Employee, AttendanceRecord, MonthlySummary, PaidLeave,
  getEmployee, getTodayAttendance, clockAction, getMonthlySummary,
  requestPaidLeave, getEmployeeLeaves, deletePaidLeave
} from '../utils/api'
import { formatTime, formatMinutes, getJapaneseDay, isOffDay, isHoliday } from '../utils/holidays'
import StatusBadge from '../components/StatusBadge'

type Tab = 'clock' | 'monthly' | 'leave'

export default function AttendancePage() {
  const { employeeId } = useParams<{ employeeId: string }>()
  const navigate = useNavigate()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [today, setToday] = useState<AttendanceRecord | null>(null)
  const [summary, setSummary] = useState<MonthlySummary | null>(null)
  const [leaves, setLeaves] = useState<PaidLeave[]>([])
  const [tab, setTab] = useState<Tab>('clock')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [leaveDate, setLeaveDate] = useState('')

  const now = new Date()
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1)
  const id = parseInt(employeeId || '0')

  useEffect(() => {
    if (!id) { navigate('/'); return }
    Promise.all([getEmployee(id), getTodayAttendance(id)])
      .then(([emp, att]) => { setEmployee(emp); setToday(att) })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!id) return
    getMonthlySummary(id, viewYear, viewMonth).then(setSummary).catch(() => {})
    getEmployeeLeaves(id).then(setLeaves).catch(() => {})
  }, [id, viewYear, viewMonth])

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text })
    setTimeout(() => setToast(null), 3000)
  }

  const handleClock = async (action: string) => {
    setActionLoading(true)
    try {
      const updated = await clockAction(id, action)
      setToday(updated)
      showToast('success', actionLabels[action] + 'しました')
      getMonthlySummary(id, viewYear, viewMonth).then(setSummary)
    } catch (e: any) {
      showToast('error', e.response?.data?.error || 'エラーが発生しました')
    } finally {
      setActionLoading(false)
    }
  }

  const handleLeaveRequest = async () => {
    if (!leaveDate) { showToast('error', '日付を選択してください'); return }
    setActionLoading(true)
    try {
      const leave = await requestPaidLeave(id, leaveDate)
      setLeaves(prev => [...prev, leave])
      setLeaveDate('')
      showToast('success', '有給休暇を申請しました')
    } catch (e: any) {
      showToast('error', e.response?.data?.error || 'エラーが発生しました')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteLeave = async (leaveId: number) => {
    if (!confirm('申請を取り消しますか？')) return
    try {
      await deletePaidLeave(leaveId)
      setLeaves(prev => prev.filter(l => l.id !== leaveId))
      showToast('success', '申請を取り消しました')
    } catch (e: any) {
      showToast('error', e.response?.data?.error || 'エラーが発生しました')
    }
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-6 h-6 border-2 border-accent-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!employee) return null

  const approvedLeaves = leaves.filter(l => l.status === 'approved').length
  const remainingLeaves = employee.paid_leave_days - approvedLeaves

  return (
    <div className="max-w-lg mx-auto">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
          toast.type === 'success' ? 'bg-gray-900 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.text}
        </div>
      )}

      {/* Back + Employee name */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/')} className="btn-ghost text-xs px-2">
          ← 戻る
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent-50 rounded-lg flex items-center justify-center">
            <span className="text-sm font-bold text-accent-600">{employee.name.charAt(0)}</span>
          </div>
          <h1 className="font-bold text-gray-900">{employee.name}</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
        {(['clock', 'monthly', 'leave'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              tab === t ? 'bg-white text-gray-900 shadow-card' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {t === 'clock' ? '打刻' : t === 'monthly' ? '月次確認' : '有給申請'}
          </button>
        ))}
      </div>

      {/* ── Clock Tab ── */}
      {tab === 'clock' && (
        <div className="space-y-4">
          {/* Today status */}
          <div className="card p-5">
            <p className="section-title mb-4">本日の打刻</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: '出勤', value: today?.clock_in },
                { label: '休憩開始', value: today?.break_start },
                { label: '休憩終了', value: today?.break_end },
                { label: '退勤', value: today?.clock_out },
              ].map(({ label, value }) => (
                <div key={label} className={`rounded-lg p-3 ${value ? 'bg-accent-50' : 'bg-gray-50'}`}>
                  <p className="text-xs text-gray-400 mb-1">{label}</p>
                  <p className={`text-lg font-bold tabular-nums ${value ? 'text-accent-600' : 'text-gray-300'}`}>
                    {formatTime(value ?? null)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Clock buttons */}
          <div className="card p-5">
            <p className="section-title mb-4">打刻</p>
            <div className="grid grid-cols-2 gap-2.5">
              <ClockBtn label="出勤" action="clock_in"
                done={!!today?.clock_in}
                disabled={!!today?.clock_in || actionLoading}
                onClick={handleClock}
                color="bg-emerald-500 hover:bg-emerald-600"
              />
              <ClockBtn label="休憩開始" action="break_start"
                done={!!today?.break_start}
                disabled={!today?.clock_in || !!today?.break_start || !!today?.clock_out || actionLoading}
                onClick={handleClock}
                color="bg-amber-400 hover:bg-amber-500"
              />
              <ClockBtn label="休憩終了" action="break_end"
                done={!!today?.break_end}
                disabled={!today?.break_start || !!today?.break_end || !!today?.clock_out || actionLoading}
                onClick={handleClock}
                color="bg-blue-400 hover:bg-blue-500"
              />
              <ClockBtn label="退勤" action="clock_out"
                done={!!today?.clock_out}
                disabled={!today?.clock_in || !!today?.clock_out || actionLoading}
                onClick={handleClock}
                color="bg-gray-700 hover:bg-gray-800"
              />
            </div>
          </div>

          {today?.clock_out && (
            <p className="text-center text-sm text-gray-400">お疲れ様でした！</p>
          )}
        </div>
      )}

      {/* ── Monthly Tab ── */}
      {tab === 'monthly' && summary && (
        <div className="space-y-4">
          <MonthNav year={viewYear} month={viewMonth}
            onPrev={() => { const d = new Date(viewYear, viewMonth - 2); setViewYear(d.getFullYear()); setViewMonth(d.getMonth() + 1) }}
            onNext={() => { const d = new Date(viewYear, viewMonth); setViewYear(d.getFullYear()); setViewMonth(d.getMonth() + 1) }}
          />

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="稼働時間" value={`${summary.total_hours}h${summary.remain_minutes}m`} color="text-gray-900" />
            <StatCard label="今月給与" value={`¥${summary.salary.toLocaleString()}`} color="text-emerald-600" />
            <StatCard label="有給残" value={`${remainingLeaves}日`} color="text-blue-600" />
          </div>

          {/* Daily records */}
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">日付</th>
                  <th className="px-3 py-3 text-center text-xs text-gray-400 font-medium">出勤</th>
                  <th className="px-3 py-3 text-center text-xs text-gray-400 font-medium">退勤</th>
                  <th className="px-3 py-3 text-center text-xs text-gray-400 font-medium">時間</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {summary.records.map(r => {
                  const d = new Date(r.date)
                  const dow = getJapaneseDay(r.date)
                  const offDay = isOffDay(r.date)
                  const holiday = isHoliday(r.date)
                  const isSun = d.getDay() === 0
                  const isSat = d.getDay() === 6
                  const isPaidLeave = summary.paid_leaves.some(pl => pl.date === r.date)

                  return (
                    <tr key={r.id} className={offDay ? 'bg-red-50/40' : ''}>
                      <td className="px-4 py-2.5">
                        <span className={`font-medium tabular-nums ${isSun ? 'text-red-500' : isSat ? 'text-blue-500' : 'text-gray-700'}`}>
                          {r.date.slice(5).replace('-', '/')}
                        </span>
                        <span className="ml-1 text-xs text-gray-300">({dow})</span>
                        {holiday && <span className="ml-1 text-xs text-red-400">{holiday}</span>}
                        {isPaidLeave && <span className="ml-1.5 text-xs bg-emerald-100 text-emerald-600 px-1 rounded">有給</span>}
                      </td>
                      <td className="px-3 py-2.5 text-center text-gray-600 tabular-nums">{formatTime(r.clock_in)}</td>
                      <td className="px-3 py-2.5 text-center text-gray-600 tabular-nums">{formatTime(r.clock_out)}</td>
                      <td className="px-3 py-2.5 text-center text-gray-500 text-xs">
                        {r.work_minutes ? `${Math.floor(r.work_minutes / 60)}h${r.work_minutes % 60}m` : '—'}
                      </td>
                    </tr>
                  )
                })}
                {summary.records.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-300 text-sm">記録がありません</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Leave Tab ── */}
      {tab === 'leave' && (
        <div className="space-y-4">
          {/* Request */}
          <div className="card p-5">
            <p className="section-title mb-4">有給休暇申請</p>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl font-bold text-gray-900">{remainingLeaves}</span>
              <span className="text-sm text-gray-400">/ {employee.paid_leave_days} 日残</span>
            </div>
            <div className="flex gap-2">
              <input
                type="date"
                value={leaveDate}
                onChange={e => setLeaveDate(e.target.value)}
                min={getTodayStr()}
                className="input flex-1"
              />
              <button
                onClick={handleLeaveRequest}
                disabled={actionLoading || remainingLeaves <= 0 || !leaveDate}
                className="btn-primary"
              >
                申請
              </button>
            </div>
          </div>

          {/* History */}
          <div className="card overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <p className="section-title">申請履歴</p>
            </div>
            {leaves.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-gray-300">申請履歴がありません</p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {leaves.slice().sort((a, b) => b.date.localeCompare(a.date)).map(l => (
                  <li key={l.id} className="px-5 py-3.5 flex items-center justify-between">
                    <div>
                      <span className="font-medium text-gray-800 tabular-nums">{l.date}</span>
                      <span className="ml-1.5 text-xs text-gray-300">({getJapaneseDay(l.date)})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={l.status} />
                      {l.status === 'pending' && (
                        <button onClick={() => handleDeleteLeave(l.id)} className="text-xs text-gray-300 hover:text-red-400 transition-colors">
                          取消
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ClockBtn({ label, action, done, disabled, onClick, color }: {
  label: string; action: string; done: boolean; disabled: boolean
  onClick: (a: string) => void; color: string
}) {
  return (
    <button
      onClick={() => onClick(action)}
      disabled={disabled}
      className={`py-4 rounded-xl text-sm font-semibold transition-all active:scale-[0.97]
        ${done
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
          : disabled
          ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
          : `${color} text-white shadow-sm`
        }`}
    >
      {done ? `✓ ${label}` : label}
    </button>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="card p-3.5 text-center">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`font-bold text-base ${color}`}>{value}</p>
    </div>
  )
}

function MonthNav({ year, month, onPrev, onNext }: { year: number; month: number; onPrev: () => void; onNext: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <button onClick={onPrev} className="btn-ghost px-2">←</button>
      <span className="font-semibold text-gray-900">{year}年{month}月</span>
      <button onClick={onNext} className="btn-ghost px-2">→</button>
    </div>
  )
}

const actionLabels: Record<string, string> = {
  clock_in: '出勤', break_start: '休憩開始', break_end: '休憩終了', clock_out: '退勤',
}

function getTodayStr() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}
