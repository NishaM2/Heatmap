export const calculateCurrentStreak = (dates: string[]): number => {
    //if no dates, streak is 0
    if(dates.length === 0) return 0

    // 'b'.localeCompare(a) = descending order for strings
    const sorted = [...dates].sort((a,b) => b.localeCompare(a))

    //start counting from today
    let streak = 0
    const today = new Date()
    today.setHours(0,0,0,0)
    //remove time part so we only compare dates

    //loop through sorted dates
    for (let i = 0; i < sorted.length; i++) {
        const logDate = new Date(sorted[i])
        logDate.setHours(0,0,0,0)
        const expectedDate = new Date(today)
        expectedDate.setDate(today.getDate() - i)
        // i=0 today, i=1 yesterday, i=2 day before

        // if log date matches expected date → consecutive
        if (logDate.getTime() === expectedDate.getTime()) {
            streak++
        } else {
            // gap found stop counting
            break
        }
    }
    return streak
}

export const calculateLongestStreak = (dates: string[]): number => {
    if (dates.length === 0) return 0

    //sort oldest first for this one
    const sorted = [...dates].sort((a, b) => a.localeCompare(b))

    let longest = 1
    let current = 1

    for (let i = 1; i < sorted.length; i++) {
        const prev = new Date(sorted[i - 1])
        const curr = new Date(sorted[i])

        //difference in days between consecutive entries
        const diffTime = curr.getTime() - prev.getTime()
        const diffDays = diffTime / (1000 * 60 * 60 * 24)

        if (diffDays === 1) {
            //consecutive day extend current streak
            current++
            longest = Math.max(longest, current)
        } else {
            //gap found reset current streak
            current = 1
        }
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