import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
})

export interface Employee {
  id: number
  name: string
  hourly_wage: number
  paid_leave_days: number
  created_at: string
}

export interface AttendanceRecord {
  id: number
  employee_id: number
  date: string
  clock_in: string | null
  break_start: string | null
  break_end: string | null
  clock_out: string | null
  note: string | null
  modified_by: string | null
  modified_at: string | null
  work_minutes?: number
}

export interface PaidLeave {
  id: number
  employee_id: number
  date: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  employee_name?: string
}

export interface MonthlySummary {
  employee: Employee
  year: number
  month: number
  records: AttendanceRecord[]
  paid_leaves: PaidLeave[]
  total_minutes: number
  total_hours: number
  remain_minutes: number
  salary: number
}

// Employees
export const getEmployees = () => api.get<Employee[]>('/employees').then(r => r.data)
export const getEmployee = (id: number) => api.get<Employee>(`/employees/${id}`).then(r => r.data)
export const createEmployee = (data: Omit<Employee, 'id' | 'created_at'>) =>
  api.post<Employee>('/employees', data).then(r => r.data)
export const updateEmployee = (id: number, data: Omit<Employee, 'id' | 'created_at'>) =>
  api.put<Employee>(`/employees/${id}`, data).then(r => r.data)
export const deleteEmployee = (id: number) =>
  api.delete(`/employees/${id}`).then(r => r.data)

// Attendance
export const getTodayAttendance = (employeeId: number) =>
  api.get<AttendanceRecord | null>(`/attendance/employee/${employeeId}/today`).then(r => r.data)
export const getMonthlyAttendance = (employeeId: number, year: number, month: number) =>
  api.get<AttendanceRecord[]>(`/attendance/employee/${employeeId}`, { params: { year, month } }).then(r => r.data)
export const clockAction = (employeeId: number, action: string) =>
  api.post<AttendanceRecord>('/attendance/clock', { employee_id: employeeId, action }).then(r => r.data)
export const getMonthlySummary = (employeeId: number, year: number, month: number) =>
  api.get<MonthlySummary>(`/attendance/employee/${employeeId}/summary`, { params: { year, month } }).then(r => r.data)
export const updateAttendance = (id: number, data: Partial<AttendanceRecord> & { admin_name?: string }) =>
  api.put<AttendanceRecord>(`/attendance/${id}`, data).then(r => r.data)
export const createAttendanceAdmin = (data: {
  employee_id: number
  date: string
  clock_in?: string
  break_start?: string
  break_end?: string
  clock_out?: string
  note?: string
  admin_name?: string
}) => api.post<AttendanceRecord>('/attendance/admin/create', data).then(r => r.data)

// Paid Leaves
export const getEmployeeLeaves = (employeeId: number, year?: number, month?: number) =>
  api.get<PaidLeave[]>(`/leaves/employee/${employeeId}`, { params: { year, month } }).then(r => r.data)
export const requestPaidLeave = (employeeId: number, date: string) =>
  api.post<PaidLeave>('/leaves/request', { employee_id: employeeId, date }).then(r => r.data)
export const getPendingLeaves = () =>
  api.get<PaidLeave[]>('/leaves/pending').then(r => r.data)
export const getAllLeaves = (year?: number, month?: number) =>
  api.get<PaidLeave[]>('/leaves/all', { params: { year, month } }).then(r => r.data)
export const updateLeaveStatus = (id: number, status: string) =>
  api.put<PaidLeave>(`/leaves/${id}/status`, { status }).then(r => r.data)
export const deletePaidLeave = (id: number) =>
  api.delete(`/leaves/${id}`).then(r => r.data)

// Admin
export const adminLogin = (password: string) =>
  api.post('/admin/login', { password }).then(r => r.data)
export const changeAdminPassword = (current_password: string, new_password: string) =>
  api.post('/admin/change-password', { current_password, new_password }).then(r => r.data)
export const getAdminAttendance = (year: number, month: number) =>
  api.get<(AttendanceRecord & { employee_name: string; hourly_wage: number })[]>(
    '/admin/attendance', { params: { year, month } }
  ).then(r => r.data)
export const getSalaryReport = (year: number, month: number) =>
  api.get('/admin/salary-report', { params: { year, month } }).then(r => r.data)

export default api
