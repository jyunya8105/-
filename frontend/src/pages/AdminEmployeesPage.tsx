import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Employee, getEmployees, createEmployee, updateEmployee, deleteEmployee } from '../utils/api'

type Form = { name: string; hourly_wage: string; paid_leave_days: string }
const defaultForm: Form = { name: '', hourly_wage: '1000', paid_leave_days: '10' }

export default function AdminEmployeesPage() {
  const navigate = useNavigate()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [form, setForm] = useState<Form>(defaultForm)

  useEffect(() => {
    if (sessionStorage.getItem('adminAuth') !== 'true') { navigate('/admin'); return }
    getEmployees().then(setEmployees).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text })
    setTimeout(() => setToast(null), 3000)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const emp = await createEmployee({ name: form.name, hourly_wage: +form.hourly_wage, paid_leave_days: +form.paid_leave_days })
      setEmployees(prev => [...prev, emp])
      setShowAdd(false); setForm(defaultForm)
      showToast('success', `${emp.name}を追加しました`)
    } catch (e: any) { showToast('error', e.response?.data?.error || 'エラーが発生しました') }
  }

  const handleEdit = async (id: number) => {
    try {
      const emp = await updateEmployee(id, { name: form.name, hourly_wage: +form.hourly_wage, paid_leave_days: +form.paid_leave_days })
      setEmployees(prev => prev.map(e => e.id === id ? emp : e))
      setEditingId(null); setForm(defaultForm)
      showToast('success', '更新しました')
    } catch (e: any) { showToast('error', e.response?.data?.error || 'エラーが発生しました') }
  }

  const handleDelete = async (emp: Employee) => {
    if (!confirm(`${emp.name}を削除しますか？打刻記録も削除されます。`)) return
    try {
      await deleteEmployee(emp.id)
      setEmployees(prev => prev.filter(e => e.id !== emp.id))
      showToast('success', `${emp.name}を削除しました`)
    } catch (e: any) { showToast('error', e.response?.data?.error || 'エラーが発生しました') }
  }

  const startEdit = (emp: Employee) => {
    setEditingId(emp.id); setShowAdd(false)
    setForm({ name: emp.name, hourly_wage: String(emp.hourly_wage), paid_leave_days: String(emp.paid_leave_days) })
  }

  const cancelEdit = () => { setEditingId(null); setShowAdd(false); setForm(defaultForm) }

  if (loading) return <Spinner />

  return (
    <div className="max-w-lg mx-auto space-y-5">
      {toast && <Toast toast={toast} />}

      <div className="flex items-center justify-between">
        <h1 className="page-title">従業員管理</h1>
        {!showAdd && !editingId && (
          <button onClick={() => { setShowAdd(true); setForm(defaultForm) }} className="btn-primary text-xs">
            + 追加
          </button>
        )}
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="card p-5">
          <p className="section-title mb-4">新規追加</p>
          <form onSubmit={handleAdd} className="space-y-3">
            <EmployeeForm form={form} setForm={setForm} />
            <div className="flex gap-2 pt-1">
              <button type="submit" className="btn-primary">追加する</button>
              <button type="button" onClick={cancelEdit} className="btn-secondary">キャンセル</button>
            </div>
          </form>
        </div>
      )}

      {/* Employee list */}
      <div className="space-y-2">
        {employees.map(emp => (
          <div key={emp.id} className="card p-4">
            {editingId === emp.id ? (
              <form onSubmit={e => { e.preventDefault(); handleEdit(emp.id) }} className="space-y-3">
                <EmployeeForm form={form} setForm={setForm} />
                <div className="flex gap-2 pt-1">
                  <button type="submit" className="btn-primary text-xs">保存</button>
                  <button type="button" onClick={cancelEdit} className="btn-secondary text-xs">キャンセル</button>
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-gray-500">{emp.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{emp.name}</p>
                    <p className="text-xs text-gray-400">
                      ¥{emp.hourly_wage.toLocaleString()}/h ・ 有給 {emp.paid_leave_days}日
                    </p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => startEdit(emp)} className="btn-ghost text-xs">編集</button>
                  <button onClick={() => handleDelete(emp)} className="btn-ghost text-xs text-red-400 hover:text-red-600 hover:bg-red-50">削除</button>
                </div>
              </div>
            )}
          </div>
        ))}
        {employees.length === 0 && !showAdd && (
          <div className="card p-10 text-center">
            <p className="text-sm text-gray-300">従業員が登録されていません</p>
          </div>
        )}
      </div>
    </div>
  )
}

function EmployeeForm({ form, setForm }: { form: { name: string; hourly_wage: string; paid_leave_days: string }; setForm: React.Dispatch<React.SetStateAction<any>> }) {
  return (
    <>
      <div>
        <label className="label">氏名 *</label>
        <input required type="text" value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} placeholder="山田 太郎" className="input" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">時給（円）</label>
          <input required type="number" min={0} value={form.hourly_wage} onChange={e => setForm((f: any) => ({ ...f, hourly_wage: e.target.value }))} className="input" />
        </div>
        <div>
          <label className="label">有給日数</label>
          <input required type="number" min={0} value={form.paid_leave_days} onChange={e => setForm((f: any) => ({ ...f, paid_leave_days: e.target.value }))} className="input" />
        </div>
      </div>
    </>
  )
}

function Spinner() {
  return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-accent-400 border-t-transparent rounded-full animate-spin" /></div>
}

function Toast({ toast }: { toast: { type: 'success' | 'error'; text: string } }) {
  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${
      toast.type === 'success' ? 'bg-gray-900 text-white' : 'bg-red-500 text-white'
    }`}>{toast.text}</div>
  )
}
