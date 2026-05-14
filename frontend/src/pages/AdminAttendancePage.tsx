import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Employee, AttendanceRecord,
  getEmployees, getMonthlyAttendance, updateAttendance, createAttendanceAdmin
} from '../utils/api'
import { formatTime, getJapaneseDay, isOffDay, isHoliday } from '../utils/holidays'

type EditForm = { clock_in: string; break_start: string; break_end: string; clock_out: string; note: string }
const emptyForm: EditForm = { clock_in: '', break_start: '', break_end: '', clock_out: '', note: '' }

export default function AdminAttendancePage() {
  const navigate = useNavigate()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmpId, setSelectedEmpId] = useState<number | null>(null)
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [addingDate, setAddingDate] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditForm>(emptyForm)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem('adminAuth') !== 'true') { navigate('/admin'); return }
    getEmployees().then(setEmployees).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedEmpId) return
    setLoading(true)
    getMonthlyAttendance(selectedEmpId, year, month).then(setRecords).catch(() => {}).finally(() => setLoading(false))
  }, [selectedEmpId, year, month])

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text }); setTimeout(() => setToast(null), 3000)
  }

  const startEdit = (r: AttendanceRecord) => {
    setEditingId(r.id); setAddingDate(null)
    setEditForm({ clock_in: timeOnly(r.clock_in), break_start: timeOnly(r.break_start), break_end: timeOnly(r.break_end), clock_out: timeOnly(r.clock_out), note: r.note || '' })
  }

  const startAdd = (date: string) => {
    setAddingDate(date); setEditingId(null); setEditForm(emptyForm)
  }

  const cancel = () => { setEditingId(null); setAddingDate(null) }

  const handleUpdate = async (recordId: number, date: string) => {
    try {
      await updateAttendance(recordId, {
        clock_in:    editForm.clock_in    ? `${date} ${editForm.clock_in}:00`    : '',
        break_start: editForm.break_start ? `${date} ${editForm.break_start}:00` : '',
        break_end:   editForm.break_end   ? `${date} ${editForm.break_end}:00`   : '',
        clock_out:   editForm.clock_out   ? `${date} ${editForm.clock_out}:00`   : '',
        note: editForm.note, admin_name: '管理者',
      })
      setRecords(await getMonthlyAttendance(selectedEmpId!, year, month))
      setEditingId(null); showToast('success', '修正しました')
    } catch (e: any) { showToast('error', e.response?.data?.error || 'エラーが発生しました') }
  }

  const handleCreate = async (date: string) => {
    try {
      await createAttendanceAdmin({
        employee_id: selectedEmpId!, date,
        clock_in:    editForm.clock_in    ? `${date} ${editForm.clock_in}:00`    : undefined,
        break_start: editForm.break_start ? `${date} ${editForm.break_start}:00` : undefined,
        break_end:   editForm.break_end   ? `${date} ${editForm.break_end}:00`   : undefined,
        clock_out:   editForm.clock_out   ? `${date} ${editForm.clock_out}:00`   : undefined,
        note: editForm.note || undefined, admin_name: '管理者',
      })
      setRecords(await getMonthlyAttendance(selectedEmpId!, year, month))
      setAddingDate(null); showToast('success', '追加しました')
    } catch (e: any) { showToast('error', e.response?.data?.error || 'エラーが発生しました') }
  }

  const allDays = (() => {
    const days: string[] = []; const d = new Date(year, month - 1, 1)
    while (d.getMonth() === month - 1) {
      days.push(`${year}-${String(month).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
      d.setDate(d.getDate() + 1)
    }
    return days
  })()
  const recordMap = new Map(records.map(r => [r.date, r]))

  return (
    <div className="space-y-5">
      {toast && <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.type === 'success' ? 'bg-gray-900 text-white' : 'bg-red-500 text-white'}`}>{toast.text}</div>}

      <h1 className="page-title">打刻修正</h1>

      {/* Controls */}
      <div className="flex gap-3 items-center flex-wrap">
        <select
          value={selectedEmpId || ''}
          onChange={e => setSelectedEmpId(Number(e.target.value) || null)}
          className="input w-auto"
        >
          <option value="">従業員を選択</option>
          {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>

        <div className="flex items-center gap-1">
          <button onClick={() => { const d = new Date(year, month - 2); setYear(d.getFullYear()); setMonth(d.getMonth() + 1) }} className="btn-secondary px-2.5">←</button>
          <span className="px-3 text-sm font-medium text-gray-700">{year}年{month}月</span>
          <button onClick={() => { const d = new Date(year, month); setYear(d.getFullYear()); setMonth(d.getMonth() + 1) }} className="btn-secondary px-2.5">→</button>
        </div>
      </div>

      {!selectedEmpId ? (
        <div className="card p-10 text-center text-sm text-gray-300">従業員を選択してください</div>
      ) : loading ? (
        <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-accent-400 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium w-24">日付</th>
                <th className="px-2 py-3 text-center text-xs text-gray-400 font-medium">出勤</th>
                <th className="px-2 py-3 text-center text-xs text-gray-400 font-medium">休憩開始</th>
                <th className="px-2 py-3 text-center text-xs text-gray-400 font-medium">休憩終了</th>
                <th className="px-2 py-3 text-center text-xs text-gray-400 font-medium">退勤</th>
                <th className="px-2 py-3 text-center text-xs text-gray-400 font-medium w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {allDays.map(date => {
                const record = recordMap.get(date)
                const offDay = isOffDay(date)
                const holiday = isHoliday(date)
                const d = new Date(date)
                const isSun = d.getDay() === 0; const isSat = d.getDay() === 6
                const isEditing = editingId === (record?.id ?? -1)
                const isAdding = addingDate === date

                return (
                  <tr key={date} className={`${offDay ? 'bg-red-50/30' : ''}`}>
                    <td className="px-4 py-2.5">
                      <span className={`font-medium tabular-nums text-sm ${isSun ? 'text-red-500' : isSat ? 'text-blue-500' : 'text-gray-700'}`}>
                        {date.slice(5).replace('-', '/')}
                      </span>
                      <span className="text-xs text-gray-300 ml-1">({getJapaneseDay(date)})</span>
                      {holiday && <span className="block text-xs text-red-400 leading-tight">{holiday}</span>}
                    </td>

                    {(isEditing || isAdding) ? (
                      <>
                        {(['clock_in', 'break_start', 'break_end', 'clock_out'] as const).map(field => (
                          <td key={field} className="px-1 py-1.5">
                            <input
                              type="time"
                              value={editForm[field]}
                              onChange={e => setEditForm(f => ({ ...f, [field]: e.target.value }))}
                              className="border border-gray-200 rounded-lg px-1.5 py-1 text-xs w-24 bg-white focus:outline-none focus:ring-1 focus:ring-accent-300"
                            />
                          </td>
                        ))}
                        <td className="px-2 py-1.5">
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => isEditing ? handleUpdate(record!.id, date) : handleCreate(date)}
                              className="bg-accent-500 text-white px-2 py-0.5 rounded text-xs hover:bg-accent-600"
                            >保存</button>
                            <button onClick={cancel} className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-xs hover:bg-gray-200">取消</button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-2 py-2.5 text-center text-gray-600 tabular-nums text-xs">{formatTime(record?.clock_in ?? null)}</td>
                        <td className="px-2 py-2.5 text-center text-gray-600 tabular-nums text-xs">{formatTime(record?.break_start ?? null)}</td>
                        <td className="px-2 py-2.5 text-center text-gray-600 tabular-nums text-xs">{formatTime(record?.break_end ?? null)}</td>
                        <td className="px-2 py-2.5 text-center text-gray-600 tabular-nums text-xs">{formatTime(record?.clock_out ?? null)}</td>
                        <td className="px-2 py-2.5 text-center">
                          {record
                            ? <button onClick={() => startEdit(record)} className="text-xs text-accent-500 hover:underline">修正</button>
                            : !offDay
                            ? <button onClick={() => startAdd(date)} className="text-xs text-gray-300 hover:text-accent-500 hover:underline">追加</button>
                            : null}
                        </td>
                      </>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function timeOnly(dt: string | null | undefined): string {
  if (!dt) return ''
  const parts = dt.split(' ')
  return (parts[1] || parts[0]).substring(0, 5)
}
