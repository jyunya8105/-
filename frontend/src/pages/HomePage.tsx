import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Employee, getEmployees } from '../utils/api'

export default function HomePage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    getEmployees()
      .then(setEmployees)
      .catch(() => setError('データの取得に失敗しました'))
      .finally(() => setLoading(false))
  }, [])

  const now = new Date()
  const dateStr = now.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })

  return (
    <div className="max-w-lg mx-auto">
      {/* Date + greeting */}
      <div className="mb-8 text-center">
        <p className="text-xs text-gray-400 font-medium tracking-widest uppercase mb-1">{dateStr}</p>
        <h1 className="text-2xl font-bold text-gray-900">おはようございます</h1>
        <p className="text-sm text-gray-400 mt-1">名前を選択して打刻してください</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 mb-6 text-center">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-accent-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : employees.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-gray-400 text-sm">従業員が登録されていません</p>
          <p className="text-gray-300 text-xs mt-1">管理者メニューから追加してください</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {employees.map(emp => (
            <button
              key={emp.id}
              onClick={() => navigate(`/attendance/${emp.id}`)}
              className="group card p-5 text-center hover:shadow-card-md hover:ring-1 hover:ring-accent-300 active:scale-[0.98] transition-all duration-150"
            >
              <div className="w-12 h-12 bg-gray-100 group-hover:bg-accent-50 rounded-xl flex items-center justify-center mx-auto mb-3 transition-colors">
                <span className="text-xl font-bold text-gray-500 group-hover:text-accent-600 transition-colors">
                  {emp.name.charAt(0)}
                </span>
              </div>
              <span className="text-sm font-semibold text-gray-800">{emp.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
