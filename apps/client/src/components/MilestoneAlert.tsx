import { Trophy } from 'lucide-react'

interface MilestoneAlertProps {
  currentStreak: number
}

const MILESTONES = [7, 30, 60, 100, 365]

const MilestoneAlert = ({ currentStreak }: MilestoneAlertProps) => {
  const milestone = MILESTONES.find(m => m === currentStreak)

  if (!milestone) return null

  return (
    <div className="flex items-center gap-2 bg-primary/10 text-primary rounded-lg px-4 py-2 mb-4">
      <Trophy className="h-4 w-4" />
      <span className="text-sm font-medium">
        🎉 You hit a {milestone}-day streak! Keep going!
      </span>
    </div>
  )
}

export default MilestoneAlert