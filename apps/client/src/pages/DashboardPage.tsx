import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Bell,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Code2,
  Dumbbell,
  GitBranch,
  GitCompare,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  MoreHorizontal,
  Plus,
  Settings,
  Share2,
  Star,
  Users,
  X,
} from 'lucide-react'

import { useAuth } from '@/hooks/useAuth'
import { useCategories, useDeleteCategory, useUpdateCategory } from '@/hooks/useCategories'
import { useOverallLogs, useYearLogs } from '@/hooks/useLogs'
import { useCategoryStats } from '@/hooks/useStats'
import { useGithubSync } from '@/hooks/useGithub'
import { useSharedGoals } from '@/hooks/useFriends'
import { useUIStore } from '@/store/uiStore'
import { API_URL } from '@/lib/config'
import { generateYearDates, getMonthLabels, groupByWeek, formatDateLabel, checkIsFuture, checkIsToday } from '@/lib/dateUtils'
import type { Category, SharedGoal } from '@/types'

import DayModal from '@/components/DayModal'
import CreateCategoryModal from '@/components/CreateCategoryModal'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

/* ------------------------------------------------------------------ tokens */

const BLUE = '#2b7ff5'
const INK = '#0f172a'
const MUTED = '#64748b'
const BORDER = '#e8eef7'

/** No data → Light → Moderate → Hard → Intense */
const HEAT = ['#eef2f7', '#c9e0fb', '#84b9f5', '#3b8ef0', '#1a63d0'] as const

const LEGEND = [
  { label: 'No data', level: 0 },
  { label: '1. Light', level: 1 },
  { label: '2. Moderate', level: 2 },
  { label: '3. Hard', level: 3 },
  { label: '4. Intense', level: 4 },
] as const

/* ------------------------------------------------------------------- types */

type OverallDay = { date: string; score: number; loggedCount: number; totalCore: number }
type YearLog = { date: string; effortLevel: number | null }
type CategoryStats = {
  currentStreak: number
  longestStreak: number
  totalActiveDays: number
  bestMonth: string | null
}

/* ----------------------------------------------------------------- helpers */

const greeting = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
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

/**
 * Streaks for the combined view. Per-category streaks come from the API
 * (`useCategoryStats`); there is no overall equivalent, so the same rule is
 * applied here over the days the overall grid reports as active.
 */
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

/** Category name → an icon, falling back to a generic one. */
const CategoryIcon = ({
  name,
  className,
  style,
}: {
  name: string
  className?: string
  style?: React.CSSProperties
}) => {
  const n = name.toLowerCase()
  if (n.includes('cod') || n.includes('dev') || n.includes('program'))
    return <Code2 className={className} style={style} />
  if (n.includes('read') || n.includes('book'))
    return <BookOpen className={className} style={style} />
  if (n.includes('workout') || n.includes('gym') || n.includes('fit'))
    return <Dumbbell className={className} style={style} />
  if (n.includes('stud') || n.includes('learn'))
    return <GraduationCap className={className} style={style} />
  return <LayoutDashboard className={className} style={style} />
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
    toast.success('Heatmap downloaded — share it with your friends')
  } catch (err) {
    console.error(err)
    toast.error('Could not generate your heatmap image')
  }
}

/* ----------------------------------------------------------------- sidebar */

const NAV_ICON = 'h-[18px] w-[18px]'

const SidebarContent = ({ comparisonTo, onNavigate }: { comparisonTo: string; onNavigate?: () => void }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const items = [
    { label: 'Dashboard', to: '/dashboard', Icon: LayoutDashboard, active: true },
    { label: 'Friends', to: '/friends', Icon: Users, active: false },
    { label: 'Comparison', to: comparisonTo, Icon: GitCompare, active: false },
    { label: 'Settings', to: '/settings', Icon: Settings, active: false },
  ]

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center gap-2.5 px-6 py-6">
        <span className="grid grid-cols-3 gap-0.75" aria-hidden="true">
          {Array.from({ length: 9 }, (_, i) => (
            <span
              key={i}
              className="block h-1.25 w-1.25 rounded-full"
              style={{ backgroundColor: BLUE, opacity: [0.35, 1, 0.55, 1, 0.7, 1, 0.5, 1, 0.35][i] }}
            />
          ))}
        </span>
        <span className="text-[20px] font-bold tracking-[-0.02em]" style={{ color: INK }}>
          HeatTrack
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-4">
        {items.map(({ label, to, Icon, active }) => (
          <Link
            key={label}
            to={to}
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] transition-colors"
            style={
              active
                ? { backgroundColor: '#e8f1fe', color: BLUE, fontWeight: 600 }
                : { color: '#475569' }
            }
          >
            <Icon className={NAV_ICON} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="border-t px-4 py-4" style={{ borderColor: BORDER }}>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-[#f6f9fe] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2b7ff5]">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.image || ''} alt={user?.name} />
              <AvatarFallback className="text-xs">{user?.name?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="min-w-0 flex-1 truncate text-[14.5px] font-medium" style={{ color: INK }}>
              {user?.name}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0" style={{ color: MUTED }} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={async () => {
                await logout()
                navigate('/login')
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------- heatmap */

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
      <div className="min-w-190">
        <div className="mb-2 flex pl-9.5">
          {months.map((m, i) => (
            <span
              key={m.label + i}
              className="text-[12px]"
              style={{
                color: MUTED,
                marginLeft:
                  i === 0
                    ? `${m.weekIndex * 14}px`
                    : `${(m.weekIndex - months[i - 1].weekIndex - 1) * 14}px`,
              }}
            >
              {m.label}
            </span>
          ))}
        </div>

        <div className="flex gap-2">
          <div className="flex w-7.5 flex-col gap-0.75 pt-px text-[12px]" style={{ color: MUTED }}>
            {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((d, i) => (
              <span key={i} className="flex h-2.75 items-center leading-none">
                {d}
              </span>
            ))}
          </div>

          <div className="flex gap-0.75">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-0.75">
                {week.map((date, di) => {
                  if (!date) return <span key={di} className="h-2.75 w-2.75" />
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
                      className={`h-2.75 w-2.75 rounded-[3px] transition-transform ${
                        clickable ? 'cursor-pointer hover:scale-125' : 'cursor-default'
                      } ${checkIsToday(date) ? 'ring-1 ring-offset-1' : ''}`}
                      style={{
                        backgroundColor: HEAT[level],
                        opacity: future ? 0.45 : 1,
                        ...(checkIsToday(date) ? { boxShadow: `0 0 0 1.5px ${BLUE}` } : {}),
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

/* --------------------------------------------------------------- habit row */

const HabitRow = ({ category, year, isLast }: { category: Category; year: number; isLast: boolean }) => {
  const { data: statsData } = useCategoryStats(category.id, String(year))
  const { data: logsData } = useYearLogs(category.id, String(year))
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()

  const stats = statsData as CategoryStats | undefined

  const recent = useMemo(() => {
    const rows = (logsData ?? []) as YearLog[]
    const byDate = new Map(rows.map((l) => [l.date, l.effortLevel ?? 0]))
    return Array.from({ length: 7 }, (_, i) => byDate.get(shiftDate(localToday(), i - 6)) ?? 0)
  }, [logsData])

  return (
    <div
      className={`flex flex-wrap items-center gap-4 py-4 sm:flex-nowrap ${isLast ? '' : 'border-b'}`}
      style={isLast ? undefined : { borderColor: '#f1f5f9' }}
    >
      <span
        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
        style={{ backgroundColor: category.color }}
      >
        <CategoryIcon name={category.name} className="h-5 w-5 text-white" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-[15px] font-semibold" style={{ color: INK }}>
          {category.name}
          {category.isCore && (
            <span
              className="rounded-md px-2 py-0.5 text-[11px] font-medium"
              style={{ backgroundColor: '#eaf2fe', color: BLUE }}
            >
              Core
            </span>
          )}
        </p>
      </div>

      <div className="flex shrink-0 gap-1" title="Last 7 days">
        {recent.map((lvl, i) => (
          <span key={i} className="h-3.25 w-3.25 rounded-[3px]" style={{ backgroundColor: HEAT[lvl] }} />
        ))}
      </div>

      <div className="w-27.5 shrink-0">
        <p className="text-[12.5px]" style={{ color: MUTED }}>Current streak</p>
        <p className="text-[15px] font-semibold tabular-nums" style={{ color: BLUE }}>
          {stats?.currentStreak ?? 0} <span className="text-[12.5px] font-normal" style={{ color: MUTED }}>days</span>
        </p>
      </div>

      <div className="w-25 shrink-0">
        <p className="text-[12.5px]" style={{ color: MUTED }}>Best streak</p>
        <p className="text-[15px] font-semibold tabular-nums" style={{ color: BLUE }}>
          {stats?.longestStreak ?? 0} <span className="text-[12.5px] font-normal" style={{ color: MUTED }}>days</span>
        </p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Actions for ${category.name}`}
          className="shrink-0 rounded-lg p-2 transition-colors hover:bg-[#f6f9fe] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2b7ff5]"
        >
          <MoreHorizontal className="h-4.5 w-4.5" style={{ color: MUTED }} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem
            onClick={() =>
              updateCategory.mutate({ id: category.id, data: { isCore: !category.isCore } })
            }
          >
            <Star className="mr-2 h-4 w-4" />
            {category.isCore ? 'Remove from core' : 'Mark as core'}
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/settings">
              <Settings className="mr-2 h-4 w-4" />
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
            <X className="mr-2 h-4 w-4" />
            Delete habit
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

/* --------------------------------------------------------------- dashboard */

const DashboardPage = () => {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [selected, setSelected] = useState<string>('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const { user } = useAuth()
  const { openDayModal } = useUIStore()
  const githubSync = useGithubSync()

  const { data: categoriesData, isLoading, isError } = useCategories()
  const categories = (categoriesData ?? []) as Category[]

  const { data: goalsData } = useSharedGoals()
  const goals = (goalsData ?? []) as SharedGoal[]
  const acceptedGoal = goals.find((g) => g.status === 'accepted')
  const comparisonTo = acceptedGoal ? `/comparison/${acceptedGoal.id}` : '/friends'

  const isAll = selected === 'all'
  const activeCategory = categories.find((c) => c.id === selected)

  const { data: overallData } = useOverallLogs(String(year))
  const overall = useMemo(() => (overallData ?? []) as OverallDay[], [overallData])

  const { data: catLogsData } = useYearLogs(isAll ? '' : selected, String(year))
  const catLogs = useMemo(() => (catLogsData ?? []) as YearLog[], [catLogsData])

  const { data: catStatsData } = useCategoryStats(isAll ? '' : selected, String(year))
  const catStats = catStatsData as CategoryStats | undefined

  // Overall grid reports a 0/1/2 score; map it onto the 4-level heat ramp so the
  // legend reads the same in both modes.
  const overallByDate = useMemo(() => {
    const m = new Map<string, number>()
    for (const d of overall) {
      m.set(d.date, d.score === 2 ? 4 : d.score === 1 ? 2 : 0)
    }
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
    const level = levelFor(date)
    const name = LEGEND[level].label.replace(/^\d\.\s*/, '')
    if (isAll) {
      const day = overall.find((d) => d.date === date)
      if (!day) return formatDateLabel(date)
      return `${formatDateLabel(date)} — ${day.loggedCount}/${day.totalCore} core habits`
    }
    return `${formatDateLabel(date)} — ${level === 0 ? 'No data' : name}`
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

  const firstName = user?.name?.split(' ')[0] ?? 'there'

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f4f8fd' }}>
      {/* sidebar — desktop */}
      <aside
        className="fixed inset-y-0 left-0 z-40 hidden w-[256px] border-r lg:block"
        style={{ borderColor: BORDER }}
      >
        <SidebarContent comparisonTo={comparisonTo} />
      </aside>

      {/* sidebar — mobile drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/30"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 w-[256px] shadow-xl">
            <SidebarContent comparisonTo={comparisonTo} onNavigate={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        {/* ------------------------------------------------------- header */}
        <header className="flex flex-wrap items-center gap-3 px-5 py-5 sm:px-8">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            className="rounded-lg p-2 lg:hidden"
            style={{ color: INK }}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setYear((y) => y - 1)}
              aria-label="Previous year"
              className="rounded-lg p-1.5 transition-colors hover:bg-white"
              style={{ color: MUTED }}
            >
              <ChevronLeft className="h-4.5 w-4.5" />
            </button>
            <span
              className="rounded-xl border bg-white px-5 py-2 text-[15px] font-semibold tabular-nums"
              style={{ borderColor: BORDER, color: INK }}
            >
              {year}
            </span>
            <button
              type="button"
              onClick={() => setYear((y) => Math.min(y + 1, currentYear))}
              disabled={year >= currentYear}
              aria-label="Next year"
              className="rounded-lg p-1.5 transition-colors hover:bg-white disabled:opacity-40"
              style={{ color: MUTED }}
            >
              <ChevronRight className="h-4.5 w-4.5" />
            </button>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              onClick={() => githubSync.mutate()}
              disabled={githubSync.isPending}
              className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-[14.5px] font-medium transition-colors hover:bg-[#f8fbff] disabled:opacity-60"
              style={{ borderColor: BORDER, color: INK }}
            >
              <GitBranch className="h-4.25 w-4.25" style={{ color: BLUE }} />
              {githubSync.isPending ? 'Syncing...' : 'Sync GitHub'}
            </button>

            <button
              type="button"
              aria-label="Notifications"
              className="rounded-lg p-2 transition-colors hover:bg-white"
              style={{ color: MUTED }}
            >
              <Bell className="h-4.75 w-4.75" />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2b7ff5]">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user?.image || ''} alt={user?.name} />
                  <AvatarFallback className="text-xs">{user?.name?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <ChevronDown className="h-4 w-4" style={{ color: MUTED }} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="px-5 pb-12 sm:px-8">
          {/* ----------------------------------------------------- intro */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-[30px] font-bold tracking-[-0.025em]" style={{ color: INK }}>
                {greeting()}, {firstName} <span aria-hidden="true">☀️</span>
              </h1>
              <p className="mt-1.5 text-[15px]" style={{ color: MUTED }}>
                Small steps every day lead to big results.
              </p>
            </div>

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-2 rounded-xl border bg-white px-5 py-3 text-[14.5px] font-medium transition-colors hover:bg-[#f8fbff]"
              style={{ borderColor: BORDER, color: INK }}
            >
              <Share2 className="h-4.25 w-4.25" style={{ color: BLUE }} />
              Share Heatmap
            </button>
          </div>

          {/* ------------------------------------------------------ pills */}
          <div className="mt-7 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setSelected('all')}
              className="rounded-full px-6 py-2.5 text-[14.5px] font-medium transition-colors"
              style={
                isAll
                  ? { backgroundColor: BLUE, color: '#fff' }
                  : { backgroundColor: '#fff', color: INK, border: `1px solid ${BORDER}` }
              }
            >
              All
            </button>

            {categories.map((c) => {
              const on = selected === c.id
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelected(c.id)}
                  className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[14.5px] font-medium transition-colors"
                  style={
                    on
                      ? { backgroundColor: BLUE, color: '#fff' }
                      : { backgroundColor: '#fff', color: INK, border: `1px solid ${BORDER}` }
                  }
                >
                  <CategoryIcon name={c.name} className="h-4 w-4" style={{ color: on ? '#fff' : MUTED }} />
                  {c.name}
                </button>
              )
            })}

            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              disabled={categories.length >= 5}
              title={categories.length >= 5 ? 'You can track up to 5 habits' : undefined}
              className="inline-flex items-center gap-1.5 rounded-full border border-dashed px-5 py-2.5 text-[14.5px] font-medium transition-colors hover:bg-white disabled:opacity-50"
              style={{ borderColor: '#b6d3f8', color: BLUE }}
            >
              <Plus className="h-4 w-4" />
              Add Category
            </button>
          </div>

          {/* -------------------------------------------- overall progress */}
          <section
            className="mt-6 rounded-2xl border bg-white p-6 sm:p-7"
            style={{ borderColor: BORDER }}
          >
            <div className="flex flex-wrap items-center justify-between gap-5">
              <h2 className="text-[19px] font-bold tracking-[-0.02em]" style={{ color: INK }}>
                {isAll ? 'Overall Progress' : `${activeCategory?.name ?? ''} Progress`}
              </h2>

              <div className="flex items-center gap-8">
                <div className="flex items-center gap-2.5">
                  <span className="text-[20px]" aria-hidden="true">🔥</span>
                  <div>
                    <p className="text-[12.5px]" style={{ color: MUTED }}>Current streak</p>
                    <p className="text-[19px] font-bold tabular-nums" style={{ color: INK }}>
                      {currentStreak} <span className="text-[13px] font-normal" style={{ color: MUTED }}>days</span>
                    </p>
                  </div>
                </div>
                <div className="hidden h-10 w-px sm:block" style={{ backgroundColor: BORDER }} />
                <div className="flex items-center gap-2.5">
                  <Star className="h-4.75 w-4.75" style={{ color: BLUE }} />
                  <div>
                    <p className="text-[12.5px]" style={{ color: MUTED }}>Best streak</p>
                    <p className="text-[19px] font-bold tabular-nums" style={{ color: INK }}>
                      {bestStreak} <span className="text-[13px] font-normal" style={{ color: MUTED }}>days</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-6 xl:flex-row">
              <div className="min-w-0 flex-1">
                {isLoading ? (
                  <div className="h-32.5 animate-pulse rounded-xl bg-slate-100" />
                ) : (
                  <YearHeatmap
                    year={year}
                    levelFor={levelFor}
                    labelFor={labelFor}
                    onSelect={isAll ? undefined : (date) => openDayModal(date, selected)}
                  />
                )}

                <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-2">
                  {LEGEND.map((l) => (
                    <span key={l.label} className="flex items-center gap-2 text-[12.5px]" style={{ color: MUTED }}>
                      <span
                        className="block h-2.75 w-2.75 rounded-[3px]"
                        style={{ backgroundColor: HEAT[l.level] }}
                      />
                      {l.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* ----------------------------------------- share panel */}
              <div
                className="shrink-0 rounded-2xl p-6 text-center xl:w-75"
                style={{ backgroundColor: '#f3f8fe' }}
              >
                <span
                  className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-white"
                  style={{ color: BLUE }}
                >
                  <Users className="h-5 w-5" />
                </span>
                <p className="mt-3.5 text-[15.5px] font-semibold" style={{ color: INK }}>
                  Share your heatmap
                </p>
                <p className="mt-1.5 text-[13.5px] leading-normal" style={{ color: MUTED }}>
                  Let your friends see your progress and stay accountable.
                </p>
                <button
                  type="button"
                  onClick={handleShare}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-[14px] font-medium text-white transition-colors hover:opacity-90"
                  style={{ backgroundColor: BLUE }}
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </button>
              </div>
            </div>
          </section>

          {/* --------------------------------------------------- my habits */}
          <section
            className="mt-6 rounded-2xl border bg-white p-6 sm:p-7"
            style={{ borderColor: BORDER }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-[19px] font-bold tracking-[-0.02em]" style={{ color: INK }}>
                My Habits
              </h2>
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                disabled={categories.length >= 5}
                title={categories.length >= 5 ? 'You can track up to 5 habits' : undefined}
                className="inline-flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-[14px] font-medium transition-colors hover:bg-[#f8fbff] disabled:opacity-50"
                style={{ borderColor: BORDER, color: INK }}
              >
                <Plus className="h-4 w-4" style={{ color: BLUE }} />
                Add Habit
              </button>
            </div>

            <div className="mt-2">
              {isError ? (
                <p className="py-10 text-center text-[14px] text-destructive">
                  Could not load your habits. Refresh to try again.
                </p>
              ) : isLoading ? (
                <div className="flex flex-col gap-3 py-4">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />
                  ))}
                </div>
              ) : categories.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-[15px] font-semibold" style={{ color: INK }}>No habits yet</p>
                  <p className="mt-1 text-[13.5px]" style={{ color: MUTED }}>
                    Add your first habit to start filling in the grid.
                  </p>
                  <button
                    type="button"
                    onClick={() => setCreateOpen(true)}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-[14px] font-medium text-white"
                    style={{ backgroundColor: BLUE }}
                  >
                    <Plus className="h-4 w-4" />
                    Add Habit
                  </button>
                </div>
              ) : (
                categories.map((c, i) => (
                  <HabitRow key={c.id} category={c} year={year} isLast={i === categories.length - 1} />
                ))
              )}
            </div>
          </section>
        </main>
      </div>

      <CreateCategoryModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <DayModal />
    </div>
  )
}

export default DashboardPage
