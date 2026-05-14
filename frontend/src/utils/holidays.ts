// Japanese national holidays (fixed-date and moveable feasts for 2024-2027)
const FIXED_HOLIDAYS: Record<string, string> = {
  '01-01': '元日',
  '02-11': '建国記念の日',
  '02-23': '天皇誕生日',
  '03-20': '春分の日',
  '04-29': '昭和の日',
  '05-03': '憲法記念日',
  '05-04': 'みどりの日',
  '05-05': 'こどもの日',
  '08-11': '山の日',
  '09-23': '秋分の日',
  '11-03': '文化の日',
  '11-23': '勤労感謝の日',
}

// Moveable holidays by year
const MOVEABLE_HOLIDAYS: Record<string, Record<string, string>> = {
  '2024': {
    '01-08': '成人の日',
    '03-20': '春分の日',
    '07-15': '海の日',
    '09-16': '敬老の日',
    '09-22': '秋分の日',
    '10-14': '体育の日',
  },
  '2025': {
    '01-13': '成人の日',
    '03-20': '春分の日',
    '07-21': '海の日',
    '09-15': '敬老の日',
    '09-23': '秋分の日',
    '10-13': '体育の日',
  },
  '2026': {
    '01-12': '成人の日',
    '03-20': '春分の日',
    '07-20': '海の日',
    '09-21': '敬老の日',
    '09-23': '秋分の日',
    '10-12': '体育の日',
  },
  '2027': {
    '01-11': '成人の日',
    '03-21': '春分の日',
    '07-19': '海の日',
    '09-20': '敬老の日',
    '09-23': '秋分の日',
    '10-11': '体育の日',
  },
}

export function isHoliday(dateStr: string): string | null {
  const date = new Date(dateStr)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const year = String(date.getFullYear())
  const mmdd = `${month}-${day}`

  if (FIXED_HOLIDAYS[mmdd]) return FIXED_HOLIDAYS[mmdd]
  if (MOVEABLE_HOLIDAYS[year]?.[mmdd]) return MOVEABLE_HOLIDAYS[year][mmdd]
  return null
}

export function isWeekend(dateStr: string): boolean {
  const d = new Date(dateStr)
  const dow = d.getDay()
  return dow === 0 || dow === 6
}

export function isOffDay(dateStr: string): boolean {
  return isWeekend(dateStr) || !!isHoliday(dateStr)
}

export function getWorkingDays(year: number, month: number): number {
  const date = new Date(year, month - 1, 1)
  let count = 0
  while (date.getMonth() === month - 1) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    if (!isOffDay(dateStr)) count++
    date.setDate(date.getDate() + 1)
  }
  return count
}

export function formatTime(datetime: string | null): string {
  if (!datetime) return '--:--'
  const parts = datetime.split(' ')
  const time = parts[1] || parts[0]
  return time.substring(0, 5)
}

export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}時間${m}分`
}

export function getJapaneseDay(dateStr: string): string {
  const days = ['日', '月', '火', '水', '木', '金', '土']
  const d = new Date(dateStr)
  return days[d.getDay()]
}
