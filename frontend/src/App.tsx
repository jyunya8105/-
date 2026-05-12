import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import AttendancePage from './pages/AttendancePage'
import EmployeeManagePage from './pages/EmployeeManagePage'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminEmployeesPage from './pages/AdminEmployeesPage'
import AdminAttendancePage from './pages/AdminAttendancePage'
import AdminSalaryPage from './pages/AdminSalaryPage'
import AdminLeavesPage from './pages/AdminLeavesPage'

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/attendance/:employeeId" element={<AttendancePage />} />
          <Route path="/admin" element={<AdminLoginPage />} />
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/employees" element={<AdminEmployeesPage />} />
          <Route path="/admin/attendance" element={<AdminAttendancePage />} />
          <Route path="/admin/salary" element={<AdminSalaryPage />} />
          <Route path="/admin/leaves" element={<AdminLeavesPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
