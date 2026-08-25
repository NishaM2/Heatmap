import { useParams } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import HeatmapGrid from '@/components/HeatmapGrid'
import { useUIStore } from '@/store/uiStore'
import { useQuery } from '@tanstack/react-query'
import { request } from '@/services/api'
import { useAuth } from '@/hooks/useAuth'
import DayModal from '@/components/DayModal'

const ComparisonPage = () => {
  const { goalId } = useParams()
  const { user } = useAuth()
  const { openDayModal } = useUIStore()
  const year = new Date().getFullYear().toString()

  const { data: comparison, isLoading } = useQuery({
    queryKey: ['comparison', goalId, year],
    queryFn: () => request(`/shared-goals/${goalId}/comparison?year=${year}`),
    enabled: !!goalId,
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="h-48 bg-muted rounded-lg animate-pulse mb-4" />
          <div className="h-48 bg-muted rounded-lg animate-pulse" />
        </main>
      </div>
    )
  }

  if (!comparison) return null

  const isInitiator = comparison.initiator.userId === user?.id

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Shared Goal</h1>
          <p className="text-muted-foreground text-sm">
            Side by side comparison
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-medium">
              {isInitiator ? 'You (Initiator)' : 'You (Receiver)'}
            </span>
          </div>
          <HeatmapGrid
            year={parseInt(year)}
            logs={isInitiator ? comparison.initiator.logs : comparison.receiver.logs}
            categoryColor="#22c55e"
            onDayClick={(date) => openDayModal(date,
              isInitiator
                ? comparison.initiator.categoryId
                : comparison.receiver.categoryId
            )}
          />
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-medium">
              {isInitiator ? 'Friend (Receiver)' : 'Friend (Initiator)'}
            </span>
          </div>
          <HeatmapGrid
            year={parseInt(year)}
            logs={isInitiator ? comparison.receiver.logs : comparison.initiator.logs}
            categoryColor="#3b82f6"
            onDayClick={() => {}}
          />
        </div>
      </main>
      <DayModal />
    </div>
  )
}

export default ComparisonPage