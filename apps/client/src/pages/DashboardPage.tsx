import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Plus,
  Settings,
  Share2,
  Star,
  X,
} from 'lucide-react'
import { useCategories, useDeleteCategory, useUpdateCategory } from '@/hooks/useCategories'
import { useOverallLogs, useYearLogs } from '@/hooks/useLogs'
import { useCategoryStats } from '@/hooks/useStats'
import { useUIStore } from '@/store/uiStore'
import { API_URL } from '@/lib/config'
import {
  generateYearDates,
  getMonthLabels,
  groupByWeek,
  formatDateLabel,
  checkIsFuture,
  checkIsToday,
} from '@/lib/dateUtils'
import type { Category } from '@/types'
import PageBackdrop from '@/components/PageBackdrop'
import AppNavbar from '@/components/AppNavbar'
import DayModal from '@/components/DayModal'
import CreateCategoryModal from '@/components/CreateCategoryModal'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'


// No data → Light → Moderate → Hard → Intense, matching the landing palette. 
const HEAT = ['#e2e8f0', '#cbd5e1', '#94a3b8', '#475569', '#0f172a'] as const

const LEGEND = [
  { label: 'No data', level: 0 },
  { label: 'Light', level: 1 },
  { label: 'Moderate', level: 2 },
  { label: 'Hard', level: 3 },
  { label: 'Intense', level: 4 },
] as const


type OverallDay = { date: string; score: number; loggedCount: number; totalCore: number }
type YearLog = { date: string; effortLevel: number | null }
type CategoryStats = {
  currentStreak: number
  longestStreak: number
  totalActiveDays: number
  bestMonth: string | null
}


const localToday = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const shiftDate = (iso: string, days: number) => {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d + days)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}


const streaksFromActiveDays = (activeDays: string[]) => {
  if (activeDays.length === 0) return { currentStreak: 0, longestStreak: 0 }
  const set = new Set(activeDays)
  const sorted = [...set].sort()

  let longest = 1
  let run = 1
  for (let i = 1; i < sorted.length; i++) {
    if (shiftDate(sorted[i - 1], 1) === sorted[i]) run++
    else run = 1
    if (run > longest) longest = run
  }

  // A streak survives until the end of today, so anchor on today or yesterday.
  let cursor = localToday()
  if (!set.has(cursor)) {
    cursor = shiftDate(cursor, -1)
    if (!set.has(cursor)) return { currentStreak: 0, longestStreak: longest }
  }
  let current = 0
  while (set.has(cursor)) {
    current++
    cursor = shiftDate(cursor, -1)
  }
  return { currentStreak: current, longestStreak: longest }
}

const downloadHeatmap = async (categoryId: string, categoryName: string, year: number) => {
  try {
    const res = await fetch(`${API_URL}/api/share/${categoryId}?year=${year}`, {
      credentials: 'include',
    })
    if (!res.ok) throw new Error(`Share failed (${res.status})`)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${categoryName}-heatmap-${year}.png`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    toast.success('Heatmap downloaded')
  } catch (err) {
    console.error(err)
    toast.error('Could not generate your heatmap image')
  }
}

// Heatmap 

const YearHeatmap = ({
  year,
  levelFor,
  labelFor,
  onSelect,
}: {
  year: number
  levelFor: (date: string) => number
  labelFor: (date: string) => string
  onSelect?: (date: string) => void
}) => {
  const dates = useMemo(() => generateYearDates(year), [year])
  const weeks = useMemo(() => groupByWeek(dates), [dates])
  const months = useMemo(() => getMonthLabels(dates), [dates])

  return (
    <div className="overflow-x-auto pb-1">
      <div className="min-w-185">
        <div className="mb-2 flex pl-8.5">
          {months.map((m, i) => (
            <span
              key={m.label + i}
              className="text-[11px] text-neutral-400"
              style={{
                marginLeft:
                  i === 0
                    ? `${m.weekIndex * 13}px`
                    : `${(m.weekIndex - months[i - 1].weekIndex - 1) * 13}px`,
              }}
            >
              {m.label}
            </span>
          ))}
        </div>

        <div className="flex gap-2">
          <div className="flex w-6.5 flex-col gap-0.75 pt-px text-[11px] text-neutral-400">
            {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((d, i) => (
              <span key={i} className="flex h-2.5 items-center leading-none">{d}</span>
            ))}
          </div>

          <div className="flex gap-0.75">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-0.75">
                {week.map((date, di) => {
                  if (!date) return <span key={di} className="h-2.5 w-2.5" />
                  const future = checkIsFuture(date)
                  const level = future ? 0 : levelFor(date)
                  const clickable = !!onSelect && !future
                  return (
                    <button
                      key={di}
                      type="button"
                      title={labelFor(date)}
                      disabled={!clickable}
                      onClick={clickable ? () => onSelect(date) : undefined}
                      className={`h-2.5 w-2.5 rounded-xs transition-transform ${
                        clickable ? 'cursor-pointer hover:scale-125' : 'cursor-default'
                      }`}
                      style={{
                        backgroundColor: HEAT[level],
                        opacity: future ? 0.4 : 1,
                        ...(checkIsToday(date) ? { boxShadow: '0 0 0 1.5px #0f172a' } : {}),
                      }}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Habit row

const HabitRow = ({ category, year }: { category: Category; year: number }) => {
  const { data: statsData } = useCategoryStats(category.id, String(year))
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()
  const stats = statsData as CategoryStats | undefined

  return (
    <div className="flex items-center gap-4 border-b border-neutral-200 py-4 last:border-b-0">
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: category.color }}
      />

      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 truncate text-[15px] font-medium text-neutral-900">
          {category.name}
          {category.isCore && (
            <span className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
              Core
            </span>
          )}
        </p>
      </div>

      <div className="w-16 shrink-0 text-right">
        <p className="font-Hero text-[20px] leading-none tabular-nums text-neutral-900">
          {stats?.currentStreak ?? 0}
        </p>
      </div>
      <div className="w-16 shrink-0 text-right">
        <p className="font-Hero text-[20px] leading-none tabular-nums text-neutral-500">
          {stats?.longestStreak ?? 0}
        </p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Actions for ${category.name}`}
          className="shrink-0 rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem
            onClick={() => updateCategory.mutate({ id: category.id, data: { isCore: !category.isCore } })}
          >
            <Star className="mr-2 size-4" />
            {category.isCore ? 'Remove from core' : 'Mark as core'}
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/settings">
              <Settings className="mr-2 size-4" />
              Rename in Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => {
              if (confirm(`Delete "${category.name}" and all of its logs?`)) {
                deleteCategory.mutate(category.id)
              }
            }}
          >
            <X className="mr-2 size-4" />
            Delete habit
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// Dashboard 

const DashboardPage = () => {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [selected, setSelected] = useState<string>('all')
  const [createOpen, setCreateOpen] = useState(false)

  const { openDayModal } = useUIStore()

  const { data: categoriesData, isLoading, isError } = useCategories()
  const categories = (categoriesData ?? []) as Category[]

  const isAll = selected === 'all'
  const activeCategory = categories.find((c) => c.id === selected)

  const { data: overallData } = useOverallLogs(String(year))
  const overall = useMemo(() => (overallData ?? []) as OverallDay[], [overallData])

  const { data: catLogsData } = useYearLogs(isAll ? '' : selected, String(year))
  const catLogs = useMemo(() => (catLogsData ?? []) as YearLog[], [catLogsData])

  const { data: catStatsData } = useCategoryStats(isAll ? '' : selected, String(year))
  const catStats = catStatsData as CategoryStats | undefined

  // The overall grid reports a 0/1/2 score; map it onto the 4-level ramp so the
  // legend reads the same in both modes.
  const overallByDate = useMemo(() => {
    const m = new Map<string, number>()
    for (const d of overall) m.set(d.date, d.score === 2 ? 4 : d.score === 1 ? 2 : 0)
    return m
  }, [overall])

  const catByDate = useMemo(() => {
    const m = new Map<string, number>()
    for (const l of catLogs) m.set(l.date, l.effortLevel ?? 0)
    return m
  }, [catLogs])

  const overallStreaks = useMemo(
    () => streaksFromActiveDays(overall.filter((d) => d.score > 0).map((d) => d.date)),
    [overall]
  )

  const currentStreak = isAll ? overallStreaks.currentStreak : catStats?.currentStreak ?? 0
  const bestStreak = isAll ? overallStreaks.longestStreak : catStats?.longestStreak ?? 0

  const levelFor = (date: string) => (isAll ? overallByDate.get(date) ?? 0 : catByDate.get(date) ?? 0)

  const labelFor = (date: string) => {
    if (isAll) {
      const day = overall.find((d) => d.date === date)
      return day
        ? `${formatDateLabel(date)} — ${day.loggedCount}/${day.totalCore} core habits`
        : formatDateLabel(date)
    }
    const level = levelFor(date)
    return `${formatDateLabel(date)} — ${LEGEND[level].label}`
  }

  // The share image is generated per category, so "All" shares the first one.
  const shareTarget = activeCategory ?? categories[0]
  const handleShare = () => {
    if (!shareTarget) {
      toast.error('Create a habit first — there is nothing to share yet')
      return
    }
    void downloadHeatmap(shareTarget.id, shareTarget.name, year)
  }

  return (
    <div className="relative min-h-screen bg-white p-3 font-sans text-neutral-900 antialiased">
      <PageBackdrop />

      <div className="relative z-10 mx-auto w-full max-w-5xl px-3 pb-16 sm:px-5">

        <AppNavbar active="dashboard" showSync />

        {/* pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => setSelected('all')}
            className={`h-9 rounded-full border px-5 text-sm font-medium transition-colors ${
              isAll
                ? 'border-neutral-900 bg-neutral-900 text-white'
                : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            All
          </button>

          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelected(c.id)}
              className={`inline-flex h-9 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors ${
                selected === c.id
                  ? 'border-neutral-900 bg-neutral-900 text-white'
                  : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <span className="size-2 rounded-full" style={{ backgroundColor: c.color }} />
              {c.name}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            disabled={categories.length >= 5}
            title={categories.length >= 5 ? 'You can track up to 5 habits' : undefined}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-dashed border-neutral-300 px-4 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50 disabled:opacity-50"
          >
            <Plus className="size-3.5" />
            Add category
          </button>
        </div>

        {/* heatmap card */}
        <section className="mt-5 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setYear((y) => y - 1)}
                aria-label="Previous year"
                className="rounded-md p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="font-Hero text-[20px] tabular-nums">{year}</span>
              <button
                type="button"
                onClick={() => setYear((y) => Math.min(y + 1, currentYear))}
                disabled={year >= currentYear}
                aria-label="Next year"
                className="rounded-md p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-30"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 text-sm font-medium shadow-sm transition-colors hover:bg-neutral-50"
            >
              <Share2 className="size-3.5" />
              Share
            </button>
          </div>

          {isLoading ? (
            <div className="h-30 animate-pulse rounded-lg bg-neutral-100" />
          ) : (
            <YearHeatmap
              year={year}
              levelFor={levelFor}
              labelFor={labelFor}
              onSelect={isAll ? undefined : (date) => openDayModal(date, selected)}
            />
          )}

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-neutral-100 pt-4">
            {LEGEND.map((l) => (
              <span key={l.label} className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                <span
                  className="size-2.5 rounded-xs"
                  style={{ backgroundColor: HEAT[l.level] }}
                />
                {l.label}
              </span>
            ))}
          </div>
        </section>

        {/* habits */}
        <section className="mt-8">
          <div className="flex items-end justify-between gap-4 border-b border-neutral-900 pb-3">
            <h2 className="font-Hero text-[26px] leading-none tracking-tight">Habits</h2>
            <div className="flex shrink-0 gap-4 text-[11px] uppercase tracking-wider text-neutral-500">
              <span className="w-16 text-right">Streak</span>
              <span className="w-16 text-right">Best streak</span>
              <span className="w-7" aria-hidden />
            </div>
          </div>

          {isError ? (
            <p className="py-10 text-center text-sm text-red-600">
              Could not load your habits. Refresh to try again.
            </p>
          ) : isLoading ? (
            <div className="flex flex-col gap-3 py-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-neutral-100" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="py-12 text-center">
              <p className="font-Hero text-[20px]">No habits yet</p>
              <p className="mt-1 text-sm text-neutral-500">
                Add your first habit to start filling in the grid.
              </p>
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-md bg-neutral-900 px-4 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
              >
                <Plus className="size-3.5" />
                Add category
              </button>
            </div>
          ) : (
            <>
              {categories.map((c) => (
                <HabitRow key={c.id} category={c} year={year} />
              ))}

              <div className="flex items-center gap-4 pt-4">
                <span className="w-2.5" aria-hidden />
                <p className="min-w-0 flex-1 text-[13px] uppercase tracking-wider text-neutral-500">
                  {isAll ? 'All habits' : activeCategory?.name}
                </p>
                <p className="w-16 text-right font-Hero text-[24px] leading-none tabular-nums">
                  {currentStreak}
                </p>
                <p className="w-16 text-right font-Hero text-[24px] leading-none tabular-nums text-neutral-500">
                  {bestStreak}
                </p>
                <span className="w-7" aria-hidden />
              </div>
            </>
          )}
        </section>
      </div>
      <CreateCategoryModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <DayModal />
    </div>
  )
}

export default DashboardPage
