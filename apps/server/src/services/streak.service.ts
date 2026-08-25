const startOfLocalDay = (value: string): number => {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00`)
    : new Date(value)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export const calculateCurrentStreak = (dates: string[]): number => {
  if (dates.length === 0) return 0

  const days = [...new Set(dates.map(startOfLocalDay))].sort((a, b) => b - a)

  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)

  // streak survives until end of today: if nothing logged yet today,
  // anchor on yesterday instead
  if (days[0] !== cursor.getTime()) {
    cursor.setDate(cursor.getDate() - 1)
    if (days[0] !== cursor.getTime()) return 0
  }

  let streak = 0
  for (const day of days) {
    if (day !== cursor.getTime()) break
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export const calculateLongestStreak = (dates: string[]): number => {
  if (dates.length === 0) return 0

  const days = [...new Set(dates.map(startOfLocalDay))].sort((a, b) => a - b)

  let longest = 1
  let run = 1
  for (let i = 1; i < days.length; i++) {
    const next = new Date(days[i - 1])
    next.setDate(next.getDate() + 1)
    if (next.getTime() === days[i]) run++
    else run = 1
    if (run > longest) longest = run
  }
  return longest
}

export const totalActiveDays = (dates: string[]): number => {
    //count unique dates
    const uniqueDates = new Set(dates)
    return uniqueDates.size
}

export const bestMonth = (dates: string[]): string | null => {
    if (dates.length === 0) return null

    //count logs per month
    const monthCount: Record<string, number> = {}

    for (const date of dates) {
        //2026-03-15  2026-03
        const month = date.substring(0, 7)
        monthCount[month] = (monthCount[month] || 0) + 1
    }

    //find month with highest count
    let bestMonth = ''
    let highest = 0

    for (const [month, count] of Object.entries(monthCount)) {
        if (count > highest) {
            highest = count
            bestMonth = month
        }
    }
    return bestMonth  //returns "2026-03" format
}