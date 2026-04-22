import { Flame } from 'lucide-react'

interface StreakCounterProps {
  currentStreak: number
  longestStreak: number
}

const StreakCounter = ({ currentStreak, longestStreak }: StreakCounterProps) => {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-1.5">
        <Flame
          className={`h-5 w-5 ${currentStreak > 0 ? 'text-orange-500' : 'text-muted-foreground'}`}
        />
        <span className="text-xl font-bold">{currentStreak}</span>
        <span className="text-sm text-muted-foreground">day streak</span>
      </div>
      {longestStreak > 0 && (
        <div className="text-xs text-muted-foreground">
          Best: {longestStreak} days
        </div>
      )}
    </div>
  )
}

export default StreakCounter