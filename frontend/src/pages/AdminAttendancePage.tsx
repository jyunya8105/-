import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Employee, AttendanceRecord,
  getEmployees, getMonthlyAttendance, updateAttendance, createAttendanceAdmin
} from '../utils/api'
import { formatTime, getJapaneseDay, isOffDay, isHoliday } from '../utils/holidays'

type EditForm = {
  clock_in: string
  break_start: string
  break_end: string
  clock_out: string
  note: string
}

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
  const [editForm, setEditForm] = useState<EditForm>({ clock_in: '', break_start: '', break_end: '', clock_out: '', note: '' })
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem('adminAuth') !== 'true') { navigate('/admin'); return }
    getEmployees().then(setEmployees).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedEmpId) return
    setLoading(true)
    getMonthlyAttendance(selectedEmpId, year, month)
      .then(setRecords)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [selectedEmpId, year, month])

  const startEdit = (r: AttendanceRecord) => {
    setEditingId(r.id)
    setAddingDate(null)
    setEditForm({
      clock_in: timeOnly(r.clock_in),
      break_start: timeOnly(r.break_start),
      break_end: timeOnly(r.break_end),
      clock_out: timeOnly(r.clock_out),
      note: r.note || '',
    })
  }

  const startAdd = (date: string) => {
    setAddingDate(date)
    setEditingId(null)
    setEditForm({ clock_in: '', break_start: '', break_end: '', clock_out: '', note: '' })
  }

  const handleUpdate = async (recordId: number, date: string) => {
    try {
      const payload = {
        clock_in: editForm.clock_in ? `${date} ${editForm.clock_in}:00` : '',
        break_start: editForm.break_start ? `${date} ${editForm.break_start}:00` : '',
        break_end: editForm.break_end ? `${date} ${editForm.break_end}:00` : '',
        clock_out: editForm.clock_out ? `${date} ${editForm.clock_out}:00` : '',
        note: editForm.note,
        admin_name: '管理者',
      }
      await updateAttendance(recordId, payload)
      const updated = await getMonthlyAttendance(selectedEmpId!, year, month)
      setRecords(updated)
      setEditingId(null)
      setMessage({ type: 'success', text: '打刻を修正しました' })
    } catch (e: any) {
      setMessage({ type: 'error', text: e.response?.data?.error || 'エラーが発生しました' })
    }
  }

  const handleCreate = async (date: string) => {
    try {
      await createAttendanceAdmin({
        employee_id: selectedEmpId!,
        date,
        clock_in: editForm.clock_in ? `${date} ${editForm.clock_in}:00` : undefined,
        break_start: editForm.break_start ? `${date} ${editForm.break_start}:00` : undefined,
        break_end: editForm.break_end ? `${date} ${editForm.break_end}:00` : undefined,
        clock_out: editForm.clock_out ? `${date} ${editForm.clock_out}:00` : undefined,
        note: editForm.note || undefined,
        admin_name: '管理者',
      })
      const updated = await getMonthlyAttendance(selectedEmpId!, year, month)
      setRecords(updated)
      setAddingDate(null)
      setMessage({ type: 'success', text: '打刻を追加しました' })
    } catch (e: any) {
      setMessage({ type: 'error', text: e.response?.data?.error || 'エラーが発生しました' })
    }
  }

  // Build full calendar days for the month
  const getDaysInMonth = () => {
    const days: string[] = []
    const d = new Date(year, month - 1, 1)
    while (d.getMonth() === month - 1) {
      days.push(`${year}-${String(month).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
      d.setDate(d.getDate() + 1)
    }
    return days
  }

  const allDays = getDaysInMonth()
  const recordMap = new Map(records.map(r => [r.date, r]))

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin/dashboard" className="text-gray-500 hover:text-gray-700">← 戻る</Link>
        <h1 className="text-2xl font-bold text-gray-800">打刻修正</h1>
      </div>

      {message && (
        <div className={`rounded-lg p-3 mb-4 text-sm font-medium ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>{message.text}</div>
      )}

      <div className="flex gap-3 mb-4 flex-wrap">
        <select
          value={selectedEmpId || ''}
          onChange={e => setSelectedEmpId(Number(e.target.value) || null)}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
        >
          <option value="">従業員を選択</option>
          {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>

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
      </div>

      {!selectedEmpId ? (
        <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-400">従業員を選択してください</div>
      ) : loading ? (
        <div className="text-center py-10 text-gray-500">読み込み中...</div>
      ) : (
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-gray-600 w-20">日付</th>
                <th className="px-2 py-2 text-center text-gray-600">出勤</th>
                <th className="px-2 py-2 text-center text-gray-600">休憩開始</th>
                <th className="px-2 py-2 text-center text-gray-600">休憩終了</th>
                <th className="px-2 py-2 text-center text-gray-600">退勤</th>
                <th className="px-2 py-2 text-center text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {allDays.map(date => {
                const record = recordMap.get(date)
                const offDay = isOffDay(date)
                const holiday = isHoliday(date)
                const d = new Date(date)
                const dow = getJapaneseDay(date)
                const isEditing = editingId === (record?.id ?? null)
                const isAdding = addingDate === date

                return (
                  <tr key={date} className={`border-t ${offDay ? 'bg-red-50' : ''}`}>
                    <td className={`px-3 py-2 ${d.getDay() === 0 ? 'text-red-600' : d.getDay() === 6 ? 'text-blue-600' : ''}`}>
                      <span className="font-medium">{date.slice(8)}</span>
                      <span className="text-xs ml-1">({dow})</span>
                      {holiday && <span className="block text-xs text-red-400">{holiday}</span>}
                    </td>

                    {(isEditing || isAdding) ? (
                      <>
                        {(['clock_in', 'break_start', 'break_end', 'clock_out'] as const).map(field => (
                          <td key={field} className="px-1 py-1">
                            <input
                              type="time"
                              value={editForm[field]}
                              onChange={e => setEditForm(f => ({ ...f, [field]: e.target.value }))}
                              className="border rounded px-1 py-0.5 text-xs w-24 focus:outline-none focus:ring-1 focus:ring-primary-300"
                            />
                          </td>
                        ))}
                        <td className="px-2 py-1">
                          <div className="flex gap-1">
                            <button
                              onClick={() => isEditing ? handleUpdate(record!.id, date) : handleCreate(date)}
                              className="bg-primary-600 text-white px-2 py-0.5 rounded text-xs hover:bg-primary-700"
                            >保存</button>
                            <button
                              onClick={() => { setEditingId(null); setAddingDate(null) }}
                              className="border px-2 py-0.5 rounded text-xs hover:bg-gray-50"
                            >取消</button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-2 py-2 text-center text-gray-700">{formatTime(record?.clock_in ?? null)}</td>
                        <td className="px-2 py-2 text-center text-gray-700">{formatTime(record?.break_start ?? null)}</td>
                        <td className="px-2 py-2 text-center text-gray-700">{formatTime(record?.break_end ?? null)}</td>
                        <td className="px-2 py-2 text-center text-gray-700">{formatTime(record?.clock_out ?? null)}</td>
                        <td className="px-2 py-2 text-center">
                          {record ? (
                            <button onClick={() => startEdit(record)} className="text-xs text-primary-600 hover:underline">修正</button>
                          ) : !offDay ? (
                            <button onClick={() => startAdd(date)} className="text-xs text-gray-400 hover:text-primary-600 hover:underline">追加</button>
                          ) : null}
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
  const time = parts[1] || parts[0]
  return time.substring(0, 5)
}
