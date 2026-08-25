import { useState } from 'react'
import Navbar from '@/components/Navbar'
import HeatmapGrid from '@/components/HeatmapGrid'
import { useCategories } from '@/hooks/useCategories'
import { useYearLogs, useOverallLogs } from '@/hooks/useLogs'
import { useCategoryStats } from '@/hooks/useStats'
import { useAuth } from '@/hooks/useAuth'
import { useUIStore } from '@/store/uiStore'
import { ChevronLeft, ChevronRight, Plus, Globe } from 'lucide-react'
import DayModal from '@/components/DayModal'
import type { Category } from '@/types'
import { Button } from '@/components/ui/button'
import CreateCategoryModal from '@/components/CreateCategoryModal'
import HeatmapSkeleton from '@/components/HeatmapSkeleton'
import { useGithubSync } from '@/hooks/useGithub'
import StreakCounter from '@/components/StreakCounter'
import MilestoneAlert from '@/components/MilestoneAlert'
import { Share2 } from 'lucide-react'
import { API_URL } from '@/lib/config'
import { toast } from 'sonner'

const currentYear = new Date().getFullYear()

// Single category heatmap card
const CategoryCard = ({ category, year }: { category: Category, year: number }) => {
  const { data: logs = [] } = useYearLogs(category.id, year.toString())
  const { data: stats } = useCategoryStats(category.id, year.toString())
  const { openDayModal } = useUIStore()

  return (
    <div className="rounded-lg border bg-card p-6 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <div
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: category.color }}
        />
        <h2 className="text-lg font-semibold">{category.name}</h2>
        {category.isCore && (
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            Core
          </span>
        )}
        <div className="ml-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              // Open the intent window synchronously. Once an await breaks the
              // user-activation chain, popup blockers reject window.open().
              const tweetText = `My ${category.name} heatmap — tracked with HeatTrack 🔥`
              window.open(
                `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`,
                '_blank',
                'noopener,noreferrer'
              )

              try {
                const res = await fetch(`${API_URL}/api/share/${category.id}?year=${year}`, {
                  credentials: 'include',
                })
                if (!res.ok) throw new Error(`Share failed: ${res.status}`)

                const blob = await res.blob()
                const objectUrl = URL.createObjectURL(blob)

                const link = document.createElement('a')
                link.href = objectUrl
                link.download = `${category.name}-heatmap.png`
                document.body.appendChild(link)
                link.click()
                link.remove()
                URL.revokeObjectURL(objectUrl)

                toast.success('Heatmap downloaded — attach it to your post')
              } catch (err) {
                console.error(err)
                toast.error('Could not generate your heatmap image')
              }
            }}
          >
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
        </div>
      </div>

      {stats && (
        <>
          <MilestoneAlert currentStreak={stats.currentStreak} />
          <StreakCounter
            currentStreak={stats.currentStreak}
            longestStreak={stats.longestStreak}
          />
        </>
      )}

      <div className="mt-4">
        <HeatmapGrid
          year={year}
          logs={logs}
          categoryColor={category.color}
          onDayClick={(date) => openDayModal(date, category.id)}
        />
      </div>
    </div>
  )
}

// Overall heatmap card
const OverallCard = ({ year }: { year: number }) => {
  const { data: overallLogs = [] } = useOverallLogs(year.toString())
  const { openDayModal } = useUIStore()

  return (
    <div className="rounded-lg border bg-card p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-semibold">Overall</h2>
        <span className="text-xs text-muted-foreground">
          All core categories combined
        </span>
      </div>
      <HeatmapGrid
        year={year}
        logs={[]}
        categoryColor="#6366f1"
        onDayClick={(date) => openDayModal(date, '')}
        isOverall={true}
        overallLogs={overallLogs}
      />
    </div>
  )
}

const DashboardPage = () => {
  const [year, setYear] = useState(new Date().getFullYear())
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const { user } = useAuth()
  const githubSync = useGithubSync()
  const { data: categories = [], isLoading } = useCategories()
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="h-8 w-48 bg-muted rounded animate-pulse mb-2" />
            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
          </div>
          <HeatmapSkeleton />
          <HeatmapSkeleton />
          <HeatmapSkeleton />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">
            Hey, {user?.name?.split(' ')[0]} 
          </h1>
          <p className="text-muted-foreground">
            Track your daily consistency
          </p>
        </div>

        <div className="flex items-center gap-2 mb-6 justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setYear(y => y - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium w-12 text-center">{year}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setYear(y => y + 1)}
            disabled={year >= currentYear}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Button
          size="sm"
          onClick={() => setCreateModalOpen(true)}
          disabled={categories.length >= 5}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Category
        </Button>

        <CreateCategoryModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
        />

        <Button
          variant="outline"
          size="sm"
          onClick={() => githubSync.mutate()}
          disabled={githubSync.isPending}
        >
          <Globe className="h-4 w-4 mr-1" />
          {githubSync.isPending ? 'Syncing...' : 'Sync GitHub'}
        </Button>

        {githubSync.isSuccess && (
          <span className="text-xs text-green-500">
            ✓ Synced successfully
          </span>
        )}

        {githubSync.isError && (
          <span className="text-xs text-destructive">
            Sync failed
          </span>
        )}

        <OverallCard year={year} />

        {categories.length === 0 ? (
          <div className="rounded-lg border bg-card p-12 text-center">
            <div className="text-4xl mb-4">🌱</div>
            <h3 className="text-lg font-semibold mb-2">Start your journey</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Create your first category to begin tracking your consistency
            </p>
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create your first category
            </Button>
          </div>
        ) : (
          categories.map((category: Category) => (
            <CategoryCard key={category.id} category={category} year={year} />
          ))
        )}
      </main>
      <DayModal/>
    </div>
  )
}

export default DashboardPage