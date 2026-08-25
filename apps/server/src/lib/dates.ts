// Calendar helpers for the heatmap grid.

export const isLeapYear = (year: number) =>
    (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0

export const yearStart = (year: number) => `${year}-01-01`
export const yearEnd = (year: number) => `${year}-12-31`

export const yearDates = (year: number): string[] => {
    const dates: string[] = []
    const monthLengths = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

    for (let m = 0; m < 12; m++) {
        for (let d = 1; d <= monthLengths[m]; d++) {
            dates.push(
                `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
            )
        }
    }
    return dates
}
