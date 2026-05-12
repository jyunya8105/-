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
      .catch(() => setError('従業員データの取得に失敗しました'))
      .finally(() => setLoading(false))
  }, [])

  const now = new Date()
  const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`
  const days = ['日', '月', '火', '水', '木', '金', '土']
  const dayStr = days[now.getDay()]

  if (loading) return <div className="text-center py-20 text-gray-500">読み込み中...</div>

  return (
    <div>
      <div className="text-center mb-8">
        <p className="text-lg text-gray-600 font-medium">{dateStr}（{dayStr}）</p>
        <h1 className="text-3xl font-bold text-primary-700 mt-1">従業員を選択してください</h1>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 rounded-lg p-4 mb-4 text-center">
          {error}
        </div>
      )}

      {employees.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-xl mb-2">従業員が登録されていません</p>
          <p className="text-sm">管理者メニューから従業員を追加してください</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
          {employees.map(emp => (
            <button
              key={emp.id}
              onClick={() => navigate(`/attendance/${emp.id}`)}
              className="bg-white rounded-2xl shadow-md p-6 text-center hover:shadow-lg hover:bg-primary-50 transition-all border-2 border-transparent hover:border-primary-300 active:scale-95"
            >
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-primary-700">
                  {emp.name.charAt(0)}
                </span>
              </div>
              <span className="font-semibold text-gray-800 text-lg">{emp.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
