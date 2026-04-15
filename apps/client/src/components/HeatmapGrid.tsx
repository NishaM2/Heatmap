import { useMemo } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { generateYearDates, groupByWeek, formatDateLabel, checkIsToday, checkIsFuture, getMonthLabels } from '@/lib/dateUtils'
import { getSquareStyle, getOverallColor } from '@/lib/colorUtils'

interface LogData {
  date: string
  effortLevel: number | null
}

interface HeatmapGridProps {
  year: number
  logs: LogData[]
  categoryColor: string
  onDayClick: (date: string) => void
  isOverall?: boolean
  overallLogs?: { date: string; score: number }[]
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const HeatmapGrid = ({
  year,
  logs,
  categoryColor,
  onDayClick,
  isOverall = false,
  overallLogs = []
}: HeatmapGridProps) => {

  // Generate all dates for the year
  const allDates = useMemo(() => generateYearDates(year), [year])

  // Group into weeks
  const weeks = useMemo(() => groupByWeek(allDates), [allDates])

  // Month labels
  const monthLabels = useMemo(() => getMonthLabels(allDates), [allDates])

  // Create a map for quick lookup: date → effortLevel
  const logMap = useMemo(() => {
    const map: Record<string, number> = {}
    logs.forEach(log => {
      if (log.effortLevel) map[log.date] = log.effortLevel
    })
    return map
  }, [logs])

  // Overall score map
  const overallMap = useMemo(() => {
    const map: Record<string, number> = {}
    overallLogs.forEach(log => {
      map[log.date] = log.score
    })
    return map
  }, [overallLogs])

  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        {/* Month labels */}
        <div className="flex mb-1 ml-8">
          {monthLabels.map((month, i) => (
            <div
              key={i}
              className="text-xs text-muted-foreground"
              style={{ marginLeft: i === 0 ? `${month.weekIndex * 14}px` : `${(month.weekIndex - (monthLabels[i-1]?.weekIndex || 0) - 1) * 14}px` }}
            >
              {month.label}
            </div>
          ))}
        </div>

        <div className="flex gap-1">
          {/* Day labels */}
          <div className="flex flex-col gap-0.5 mr-1">
            {DAYS.map((day, i) => (
              <div key={i} className="h-3 w-6 text-xs text-muted-foreground flex items-center">
                {i % 2 !== 0 ? day.slice(0, 3) : ''}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div className="flex gap-0.5">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-0.5">
                {week.map((date, dayIndex) => {
                  if (!date) {
                    return <div key={dayIndex} className="h-3 w-3" />
                  }

                  const isFutureDate = checkIsFuture(date)
                  const isTodayDate = checkIsToday(date)

                  if (isOverall) {
                    const score = overallMap[date] || 0
                    return (
                      <Tooltip key={dayIndex}>
                        <TooltipTrigger asChild>
                          <div
                            className={`h-3 w-3 rounded-sm cursor-pointer transition-transform hover:scale-125
                              ${getOverallColor(score)}
                              ${isTodayDate ? 'ring-1 ring-primary ring-offset-1' : ''}
                              ${isFutureDate ? 'opacity-30' : ''}
                            `}
                            onClick={() => !isFutureDate && onDayClick(date)}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs font-medium">{formatDateLabel(date)}</p>
                          <p className="text-xs text-muted-foreground">
                            {score === 0 ? 'No activity' : score === 1 ? 'Partial' : 'Complete'}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    )
                  }

                  const effortLevel = logMap[date] || null

                  return (
                    <Tooltip key={dayIndex}>
                      <TooltipTrigger asChild>
                        <div
                          className={`h-3 w-3 rounded-sm cursor-pointer transition-transform hover:scale-125
                            ${!effortLevel ? 'bg-muted' : ''}
                            ${isTodayDate ? 'ring-1 ring-primary ring-offset-1' : ''}
                            ${isFutureDate ? 'opacity-30 cursor-default' : ''}
                          `}
                          style={effortLevel ? getSquareStyle(effortLevel, categoryColor) : {}}
                          onClick={() => !isFutureDate && onDayClick(date)}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs font-medium">{formatDateLabel(date)}</p>
                        <p className="text-xs text-muted-foreground">
                          {effortLevel
                            ? `Effort level ${effortLevel}`
                            : 'No activity logged'}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

export default HeatmapGrid