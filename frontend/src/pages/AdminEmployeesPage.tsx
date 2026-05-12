import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Employee, getEmployees, createEmployee, updateEmployee, deleteEmployee } from '../utils/api'

export default function AdminEmployeesPage() {
  const navigate = useNavigate()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [form, setForm] = useState({ name: '', hourly_wage: '1000', paid_leave_days: '10' })

  useEffect(() => {
    if (sessionStorage.getItem('adminAuth') !== 'true') { navigate('/admin'); return }
    loadEmployees()
  }, [])

  const loadEmployees = async () => {
    try {
      const data = await getEmployees()
      setEmployees(data)
    } catch {
      setMessage({ type: 'error', text: '読み込みに失敗しました' })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => setForm({ name: '', hourly_wage: '1000', paid_leave_days: '10' })

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const emp = await createEmployee({
        name: form.name,
        hourly_wage: parseInt(form.hourly_wage),
        paid_leave_days: parseInt(form.paid_leave_days),
      })
      setEmployees(prev => [...prev, emp])
      setShowAdd(false)
      resetForm()
      setMessage({ type: 'success', text: `${emp.name}を追加しました` })
    } catch (e: any) {
      setMessage({ type: 'error', text: e.response?.data?.error || 'エラーが発生しました' })
    }
  }

  const handleEdit = async (id: number) => {
    try {
      const emp = await updateEmployee(id, {
        name: form.name,
        hourly_wage: parseInt(form.hourly_wage),
        paid_leave_days: parseInt(form.paid_leave_days),
      })
      setEmployees(prev => prev.map(e => e.id === id ? emp : e))
      setEditingId(null)
      resetForm()
      setMessage({ type: 'success', text: '更新しました' })
    } catch (e: any) {
      setMessage({ type: 'error', text: e.response?.data?.error || 'エラーが発生しました' })
    }
  }

  const handleDelete = async (emp: Employee) => {
    if (!confirm(`${emp.name}を削除しますか？\n打刻記録も全て削除されます。`)) return
    try {
      await deleteEmployee(emp.id)
      setEmployees(prev => prev.filter(e => e.id !== emp.id))
      setMessage({ type: 'success', text: `${emp.name}を削除しました` })
    } catch (e: any) {
      setMessage({ type: 'error', text: e.response?.data?.error || 'エラーが発生しました' })
    }
  }

  const startEdit = (emp: Employee) => {
    setEditingId(emp.id)
    setShowAdd(false)
    setForm({ name: emp.name, hourly_wage: String(emp.hourly_wage), paid_leave_days: String(emp.paid_leave_days) })
  }

  if (loading) return <div className="text-center py-20 text-gray-500">読み込み中...</div>

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin/dashboard" className="text-gray-500 hover:text-gray-700">← 戻る</Link>
        <h1 className="text-2xl font-bold text-gray-800">従業員管理</h1>
      </div>

      {message && (
        <div className={`rounded-lg p-3 mb-4 text-sm font-medium ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Add Employee Button */}
      {!showAdd && !editingId && (
        <button
          onClick={() => { setShowAdd(true); resetForm() }}
          className="mb-4 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700"
        >
          + 従業員を追加
        </button>
      )}

      {/* Add Form */}
      {showAdd && (
        <div className="bg-white rounded-2xl shadow p-5 mb-4">
          <h2 className="font-bold text-gray-700 mb-3">新規従業員追加</h2>
          <form onSubmit={handleAdd} className="space-y-3">
            <FormFields form={form} setForm={setForm} />
            <div className="flex gap-2">
              <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">
                追加する
              </button>
              <button type="button" onClick={() => setShowAdd(false)} className="border px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                キャンセル
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Employee List */}
      <div className="space-y-3">
        {employees.map(emp => (
          <div key={emp.id} className="bg-white rounded-2xl shadow p-4">
            {editingId === emp.id ? (
              <div>
                <h3 className="font-bold text-gray-700 mb-3">編集中</h3>
                <form onSubmit={e => { e.preventDefault(); handleEdit(emp.id) }} className="space-y-3">
                  <FormFields form={form} setForm={setForm} />
                  <div className="flex gap-2">
                    <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">
                      保存する
                    </button>
                    <button type="button" onClick={() => setEditingId(null)} className="border px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                      キャンセル
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="font-bold text-primary-700">{emp.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{emp.name}</p>
                    <p className="text-sm text-gray-500">
                      時給 ¥{emp.hourly_wage.toLocaleString()} ／ 有給 {emp.paid_leave_days}日
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(emp)}
                    className="border border-primary-300 text-primary-700 px-3 py-1.5 rounded-lg text-sm hover:bg-primary-50"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDelete(emp)}
                    className="border border-red-300 text-red-600 px-3 py-1.5 rounded-lg text-sm hover:bg-red-50"
                  >
                    削除
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {employees.length === 0 && (
          <div className="text-center py-12 text-gray-400">従業員が登録されていません</div>
        )}
      </div>
    </div>
  )
}

function FormFields({
  form,
  setForm,
}: {
  form: { name: string; hourly_wage: string; paid_leave_days: string }
  setForm: React.Dispatch<React.SetStateAction<typeof form>>
}) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">氏名 *</label>
        <input
          type="text"
          required
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="例: 山田 太郎"
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">時給（円）*</label>
          <input
            type="number"
            required
            min={0}
            value={form.hourly_wage}
            onChange={e => setForm(f => ({ ...f, hourly_wage: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">有給日数</label>
          <input
            type="number"
            required
            min={0}
            value={form.paid_leave_days}
            onChange={e => setForm(f => ({ ...f, paid_leave_days: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
        </div>
      </div>
    </>
  )
}
