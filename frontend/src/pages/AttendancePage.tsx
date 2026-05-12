import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
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
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [leaveDate, setLeaveDate] = useState('')

  const now = new Date()
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1)

  const id = parseInt(employeeId || '0')

  useEffect(() => {
    if (!id) { navigate('/'); return }
    Promise.all([
      getEmployee(id),
      getTodayAttendance(id),
    ]).then(([emp, att]) => {
      setEmployee(emp)
      setToday(att)
    }).catch(() => navigate('/')).finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!id) return
    getMonthlySummary(id, viewYear, viewMonth).then(setSummary).catch(() => {})
    getEmployeeLeaves(id).then(setLeaves).catch(() => {})
  }, [id, viewYear, viewMonth])

  const handleClock = async (action: string) => {
    setActionLoading(true)
    setMessage(null)
    try {
      const updated = await clockAction(id, action)
      setToday(updated)
      setMessage({ type: 'success', text: actionLabels[action] + 'しました' })
      getMonthlySummary(id, viewYear, viewMonth).then(setSummary)
    } catch (e: any) {
      setMessage({ type: 'error', text: e.response?.data?.error || 'エラーが発生しました' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleLeaveRequest = async () => {
    if (!leaveDate) { setMessage({ type: 'error', text: '日付を選択してください' }); return }
    setActionLoading(true)
    setMessage(null)
    try {
      const leave = await requestPaidLeave(id, leaveDate)
      setLeaves(prev => [...prev, leave])
      setLeaveDate('')
      setMessage({ type: 'success', text: '有給休暇を申請しました' })
    } catch (e: any) {
      setMessage({ type: 'error', text: e.response?.data?.error || 'エラーが発生しました' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteLeave = async (leaveId: number) => {
    if (!confirm('申請を取り消しますか？')) return
    try {
      await deletePaidLeave(leaveId)
      setLeaves(prev => prev.filter(l => l.id !== leaveId))
      setMessage({ type: 'success', text: '申請を取り消しました' })
    } catch (e: any) {
      setMessage({ type: 'error', text: e.response?.data?.error || 'エラーが発生しました' })
    }
  }

  if (loading) return <div className="text-center py-20 text-gray-500">読み込み中...</div>
  if (!employee) return null

  const approvedLeaves = leaves.filter(l => l.status === 'approved').length
  const remainingLeaves = employee.paid_leave_days - approvedLeaves

  const todayStr = getTodayStr()

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/')} className="text-gray-500 hover:text-gray-700">
          ← 戻る
        </button>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-lg font-bold text-primary-700">{employee.name.charAt(0)}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">{employee.name}</h1>
        </div>
      </div>

      {message && (
        <div className={`rounded-lg p-3 mb-4 text-center font-medium ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 shadow-sm">
        {(['clock', 'monthly', 'leave'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setMessage(null) }}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              tab === t ? 'bg-primary-600 text-white shadow' : 'text-gray-600 hover:bg-orange-50'
            }`}
          >
            {t === 'clock' ? '打刻' : t === 'monthly' ? '月次確認' : '有給申請'}
          </button>
        ))}
      </div>

      {/* Clock Tab */}
      {tab === 'clock' && (
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-lg font-bold text-gray-700 mb-4">本日の打刻状況</h2>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <TimeCard label="出勤" time={today?.clock_in} />
            <TimeCard label="休憩開始" time={today?.break_start} />
            <TimeCard label="休憩終了" time={today?.break_end} />
            <TimeCard label="退勤" time={today?.clock_out} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ClockButton
              label="出勤"
              action="clock_in"
              disabled={!!today?.clock_in || actionLoading}
              done={!!today?.clock_in}
              onClick={handleClock}
              color="bg-green-500 hover:bg-green-600"
            />
            <ClockButton
              label="休憩開始"
              action="break_start"
              disabled={!today?.clock_in || !!today?.break_start || !!today?.clock_out || actionLoading}
              done={!!today?.break_start}
              onClick={handleClock}
              color="bg-yellow-500 hover:bg-yellow-600"
            />
            <ClockButton
              label="休憩終了"
              action="break_end"
              disabled={!today?.break_start || !!today?.break_end || !!today?.clock_out || actionLoading}
              done={!!today?.break_end}
              onClick={handleClock}
              color="bg-blue-500 hover:bg-blue-600"
            />
            <ClockButton
              label="退勤"
              action="clock_out"
              disabled={!today?.clock_in || !!today?.clock_out || actionLoading}
              done={!!today?.clock_out}
              onClick={handleClock}
              color="bg-red-500 hover:bg-red-600"
            />
          </div>

          {today?.clock_out && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-center text-gray-600 text-sm">
              本日の勤務は終了しました。お疲れ様でした！
            </div>
          )}
        </div>
      )}

      {/* Monthly Tab */}
      {tab === 'monthly' && summary && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => {
                const d = new Date(viewYear, viewMonth - 2)
                setViewYear(d.getFullYear()); setViewMonth(d.getMonth() + 1)
              }}
              className="text-gray-500 hover:text-gray-700 px-3 py-1"
            >← 前月</button>
            <h2 className="font-bold text-gray-800">{viewYear}年{viewMonth}月</h2>
            <button
              onClick={() => {
                const d = new Date(viewYear, viewMonth)
                setViewYear(d.getFullYear()); setViewMonth(d.getMonth() + 1)
              }}
              className="text-gray-500 hover:text-gray-700 px-3 py-1"
            >次月 →</button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-primary-50 border border-primary-200 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">総稼働時間</p>
              <p className="font-bold text-primary-700">{formatMinutes(summary.total_minutes)}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">今月の給与</p>
              <p className="font-bold text-green-700">¥{summary.salary.toLocaleString()}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">有給残日数</p>
              <p className="font-bold text-blue-700">{remainingLeaves}日</p>
            </div>
          </div>

          {/* Daily Records */}
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-gray-600">日付</th>
                  <th className="px-2 py-2 text-center text-gray-600">出勤</th>
                  <th className="px-2 py-2 text-center text-gray-600">退勤</th>
                  <th className="px-2 py-2 text-center text-gray-600">稼働</th>
                </tr>
              </thead>
              <tbody>
                {summary.records.map(r => {
                  const offDay = isOffDay(r.date)
                  const holiday = isHoliday(r.date)
                  const d = new Date(r.date)
                  const dow = getJapaneseDay(r.date)
                  const isPaidLeave = summary.paid_leaves.some(pl => pl.date === r.date)
                  return (
                    <tr key={r.id} className={`border-t ${offDay ? 'bg-red-50' : ''}`}>
                      <td className={`px-3 py-2 ${d.getDay() === 0 ? 'text-red-600' : d.getDay() === 6 ? 'text-blue-600' : ''}`}>
                        <span className="font-medium">{r.date.slice(8)}</span>
                        <span className="ml-1 text-xs">({dow})</span>
                        {holiday && <span className="ml-1 text-xs text-red-500">{holiday}</span>}
                        {isPaidLeave && <span className="ml-1 text-xs text-green-600">有給</span>}
                      </td>
                      <td className="px-2 py-2 text-center text-gray-700">{formatTime(r.clock_in)}</td>
                      <td className="px-2 py-2 text-center text-gray-700">{formatTime(r.clock_out)}</td>
                      <td className="px-2 py-2 text-center text-gray-700">
                        {r.work_minutes ? formatMinutes(r.work_minutes) : '—'}
                      </td>
                    </tr>
                  )
                })}
                {summary.records.length === 0 && (
                  <tr><td colSpan={4} className="px-3 py-6 text-center text-gray-400">打刻記録がありません</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Leave Tab */}
      {tab === 'leave' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="font-bold text-gray-700 mb-4">有給休暇申請</h2>
            <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
              <span>有給残日数：</span>
              <span className="font-bold text-primary-700">{remainingLeaves}日</span>
              <span>/ {employee.paid_leave_days}日</span>
            </div>
            <div className="flex gap-2 mt-4">
              <input
                type="date"
                value={leaveDate}
                onChange={e => setLeaveDate(e.target.value)}
                min={getTodayStr()}
                className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
              <button
                onClick={handleLeaveRequest}
                disabled={actionLoading || remainingLeaves <= 0}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                申請する
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50">
              <h3 className="font-bold text-gray-700">申請履歴</h3>
            </div>
            {leaves.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-400 text-sm">申請履歴がありません</div>
            ) : (
              <ul className="divide-y">
                {leaves.slice().sort((a, b) => b.date.localeCompare(a.date)).map(l => (
                  <li key={l.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <span className="font-medium text-gray-800">{l.date}</span>
                      <span className="ml-2 text-xs text-gray-500">({getJapaneseDay(l.date)})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={l.status} />
                      {l.status === 'pending' && (
                        <button
                          onClick={() => handleDeleteLeave(l.id)}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
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

function TimeCard({ label, time }: { label: string; time: string | null | undefined }) {
  return (
    <div className={`rounded-xl p-3 text-center border ${time ? 'bg-primary-50 border-primary-200' : 'bg-gray-50 border-gray-200'}`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-lg font-bold ${time ? 'text-primary-700' : 'text-gray-400'}`}>
        {formatTime(time || null)}
      </p>
    </div>
  )
}

function ClockButton({ label, action, disabled, done, onClick, color }: {
  label: string; action: string; disabled: boolean; done: boolean
  onClick: (a: string) => void; color: string
}) {
  return (
    <button
      onClick={() => onClick(action)}
      disabled={disabled}
      className={`py-4 rounded-xl text-white font-bold text-base transition-all active:scale-95
        ${done ? 'bg-gray-300 cursor-not-allowed' : disabled ? 'bg-gray-200 cursor-not-allowed text-gray-400' : `${color} shadow-md`}
      `}
    >
      {done ? `✓ ${label}済` : label}
    </button>
  )
}

const actionLabels: Record<string, string> = {
  clock_in: '出勤',
  break_start: '休憩開始',
  break_end: '休憩終了',
  clock_out: '退勤',
}

function getTodayStr() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}
