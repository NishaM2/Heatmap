import { 
  startOfYear, 
  endOfYear, 
  eachDayOfInterval, 
  format, 
  getDay,
  isToday,
  isFuture,
  parseISO
} from 'date-fns'

// Generate all dates for a given year
export const generateYearDates = (year: number): string[] => {
  const start = startOfYear(new Date(year, 0, 1))
  const end = endOfYear(new Date(year, 0, 1))
  const days = eachDayOfInterval({ start, end })
  return days.map(day => format(day, 'yyyy-MM-dd'))
}

// Group dates into weeks (arrays of 7)
export const groupByWeek = (dates: string[]): (string | null)[][] => {
  const weeks: (string | null)[][] = []
  
  // Find what day of week the year starts on (0=Sun, 1=Mon...6=Sat)
  const firstDate = parseISO(dates[0])
  const firstDayOfWeek = getDay(firstDate)
  // getDay returns 0 for Sunday, pad the beginning
  
  let currentWeek: (string | null)[] = Array(firstDayOfWeek).fill(null)
  
  for (const date of dates) {
    currentWeek.push(date)
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  }
  
  // Push last partial week
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null)
    weeks.push(currentWeek)
  }
  
  return weeks
}

// Format date for display
export const formatDateLabel = (date: string): string => {
  return format(parseISO(date), 'EEEE, MMMM d, yyyy')
  // "Monday, March 8, 2025"
}

// Check if date is today
export const checkIsToday = (date: string): boolean => {
  return isToday(parseISO(date))
}

// Check if date is in the future
export const checkIsFuture = (date: string): boolean => {
  return isFuture(parseISO(date))
}

// Get month labels for heatmap header
export const getMonthLabels = (dates: string[]): { label: string, weekIndex: number }[] => {
  const months: { label: string, weekIndex: number }[] = []
  let currentMonth = ''

  for (let i = 0; i < dates.length; i++) {
    const month = format(parseISO(dates[i]), 'MMM')
    if (month !== currentMonth) {
      currentMonth = month
      months.push({ label: month, weekIndex: Math.floor(i / 7) })
    }
  }

  return months
}