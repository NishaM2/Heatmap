import { useState } from 'react'
import Navbar from '@/components/Navbar'
import HeatmapGrid from '@/components/HeatmapGrid'
import { useCategories } from '@/hooks/useCategories'
import { useYearLogs, useOverallLogs } from '@/hooks/useLogs'
import { useCategoryStats } from '@/hooks/useStats'
import { useAuth } from '@/hooks/useAuth'
import { useUIStore } from '@/store/uiStore'
import { Flame, Trophy, Calendar, Star, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import DayModal from '@/components/DayModal'
import type { Category } from '@/types'
import { Button } from '@/components/ui/button'
import CreateCategoryModal from '@/components/CreateCategoryModal'

const currentYear = new Date().getFullYear()

// Stats bar for each category
const StatsBar = ({ categoryId }: { categoryId: string }) => {
  const { data: stats } = useCategoryStats(categoryId, currentYear.toString())

  if (!stats) return null

  return (
    <div className="flex gap-6 mb-4">
      <div className="flex items-center gap-1.5">
        <Flame className="h-4 w-4 text-orange-500" />
        <span className="text-sm font-medium">{stats.currentStreak}</span>
        <span className="text-xs text-muted-foreground">current</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Trophy className="h-4 w-4 text-yellow-500" />
        <span className="text-sm font-medium">{stats.longestStreak}</span>
        <span className="text-xs text-muted-foreground">longest</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Calendar className="h-4 w-4 text-blue-500" />
        <span className="text-sm font-medium">{stats.totalActiveDays}</span>
        <span className="text-xs text-muted-foreground">total days</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Star className="h-4 w-4 text-purple-500" />
        <span className="text-sm font-medium">{stats.bestMonth || 'N/A'}</span>
        <span className="text-xs text-muted-foreground">best month</span>
      </div>
    </div>
  )
}

// Single category heatmap card
const CategoryCard = ({ category, year }: { category: Category, year: number }) => {
  const { data: logs = [] } = useYearLogs(category.id, year.toString())
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
      </div>
      <StatsBar categoryId={category.id} />
      <HeatmapGrid
        year={currentYear}
        logs={logs}
        categoryColor={category.color}
        onDayClick={(date) => openDayModal(date, category.id)}
      />
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
        year={currentYear}
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
  const { data: categories = [], isLoading } = useCategories()
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="h-32 bg-muted rounded-lg animate-pulse mb-4" />
          <div className="h-32 bg-muted rounded-lg animate-pulse" />
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
            Hey, {user?.name?.split(' ')[0]} 👋
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

        {/* Overall heatmap */}
        <OverallCard year={year} />

        {/* Category heatmaps */}
        {categories.length === 0 ? (
          <div className="rounded-lg border bg-card p-12 text-center">
            <p className="text-muted-foreground mb-2">No categories yet</p>
            <p className="text-sm text-muted-foreground">
              Create your first category to start tracking
            </p>
          </div>
        ) : (
          categories.map((category: Category) => (
            <CategoryCard key={category.id} category={category}  year={year}/>
          ))
        )}
      </main>
      <DayModal/>
    </div>
  )
}

export default DashboardPage