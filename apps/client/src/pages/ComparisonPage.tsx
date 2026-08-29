import { useMemo } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { request } from '@/services/api'
import { useAuth } from '@/hooks/useAuth'
import { useFriends, useSharedGoals } from '@/hooks/useFriends'
import { useUIStore } from '@/store/uiStore'
import {
  generateYearDates,
  getMonthLabels,
  groupByWeek,
  formatDateLabel,
  checkIsFuture,
} from '@/lib/dateUtils'
import type { Friend, SharedGoal } from '@/types'

import PageBackdrop from '@/components/PageBackdrop'
import AppNavbar from '@/components/AppNavbar'
import DayModal from '@/components/DayModal'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const HEAT = ['#e2e8f0', '#cbd5e1', '#94a3b8', '#475569', '#0f172a'] as const

type YearLog = { date: string; effortLevel: number | null }
type Side = { userId: string; categoryId: string | null; logs: YearLog[] }
type Comparison = { initiator: Side; receiver: Side }

const localToday = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const shiftDate = (iso: string, days: number) => {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d + days)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

// Every consecutive run of active days, longest first. 
const streakRuns = (activeDays: string[]) => {
  const sorted = [...new Set(activeDays)].sort()
  const runs: { length: number; start: string; end: string }[] = []
  let start = sorted[0]
  let len = 0

  for (let i = 0; i < sorted.length; i++) {
    if (i === 0 || shiftDate(sorted[i - 1], 1) !== sorted[i]) {
      if (len > 0) runs.push({ length: len, start, end: sorted[i - 1] })
      start = sorted[i]
      len = 1
    } else {
      len++
    }
  }
  if (len > 0) runs.push({ length: len, start, end: sorted[sorted.length - 1] })
  return runs.sort((a, b) => b.length - a.length)
}

const statsFor = (logs: YearLog[], year: number) => {
  const active = logs.filter((l) => l.effortLevel !== null && l.effortLevel > 0).map((l) => l.date)
  const set = new Set(active)
  const runs = streakRuns(active)

  // Consistency is measured against days elapsed, so a year in progress is not
  // punished for days that have not happened yet.
  const today = localToday()
  const elapsed = logs.filter((l) => l.date <= today).length || 1
  const thisYear = year === new Date().getFullYear()

  let current = 0
  let cursor = today
  if (thisYear) {
    if (!set.has(cursor)) cursor = shiftDate(cursor, -1)
    while (set.has(cursor)) {
      current++
      cursor = shiftDate(cursor, -1)
    }
  }

  return {
    activeDays: set.size,
    consistency: Math.round((set.size / elapsed) * 100),
    currentStreak: current,
    bestStreak: runs[0]?.length ?? 0,
    runs,
  }
}

// Heatmap 

const MiniHeatmap = ({
  year,
  logs,
  onSelect,
}: {
  year: number
  logs: YearLog[]
  onSelect?: (date: string) => void
}) => {
  const dates = useMemo(() => generateYearDates(year), [year])
  const weeks = useMemo(() => groupByWeek(dates), [dates])
  const months = useMemo(() => getMonthLabels(dates), [dates])
  const byDate = useMemo(() => {
    const m = new Map<string, number>()
    for (const l of logs) m.set(l.date, l.effortLevel ?? 0)
    return m
  }, [logs])

  return (
    <div className="overflow-x-auto pb-1">
      <div className="min-w-150">
        <div className="mb-1.5 flex text-[10px] text-neutral-400">
          {months.map((m, i) => (
            <span
              key={m.label + i}
              style={{
                marginLeft:
                  i === 0
                    ? `${m.weekIndex * 11}px`
                    : `${(m.weekIndex - months[i - 1].weekIndex - 1) * 11}px`,
              }}
            >
              {m.label}
            </span>
          ))}
        </div>
        <div className="flex gap-0.75">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-0.75">
              {week.map((date, di) => {
                if (!date) return <span key={di} className="size-2" />
                const future = checkIsFuture(date)
                const level = future ? 0 : byDate.get(date) ?? 0
                const clickable = !!onSelect && !future
                return (
                  <button
                    key={di}
                    type="button"
                    title={`${formatDateLabel(date)}${level ? ` — level ${level}` : ''}`}
                    disabled={!clickable}
                    onClick={clickable ? () => onSelect(date) : undefined}
                    className={`size-2 rounded-xs ${clickable ? 'cursor-pointer hover:scale-125' : 'cursor-default'} transition-transform`}
                    style={{ backgroundColor: HEAT[level], opacity: future ? 0.4 : 1 }}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// page 

const ComparisonPage = () => {
  const { goalId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { openDayModal } = useUIStore()
  const year = new Date().getFullYear()

  const { data: goalsData = [] } = useSharedGoals()
  const goals = goalsData as SharedGoal[]
  const accepted = goals.filter((g) => g.status === 'accepted')

  const { data: friendsData = [] } = useFriends()
  const friends = friendsData as Friend[]

  // Falling back to the first accepted goal lets /comparison work without an id.
  const activeGoalId = goalId ?? accepted[0]?.id

  const { data: comparisonData, isLoading } = useQuery({
    queryKey: ['comparison', activeGoalId, String(year)],
    queryFn: () => request(`/shared-goals/${activeGoalId}/comparison?year=${year}`),
    enabled: !!activeGoalId,
  })
  const comparison = comparisonData as Comparison | undefined

  // Name/avatar for the other party, resolved from the friends list.
  const partnerOf = (goal: SharedGoal) => {
    const otherId = goal.initiatorId === user?.id ? goal.receiverId : goal.initiatorId
    return friends.find((f) => f.user.id === otherId)?.user
  }

  const mine = comparison
    ? comparison.initiator.userId === user?.id
      ? comparison.initiator
      : comparison.receiver
    : undefined
  const theirs = comparison
    ? comparison.initiator.userId === user?.id
      ? comparison.receiver
      : comparison.initiator
    : undefined

  const myStats = useMemo(() => (mine ? statsFor(mine.logs, year) : null), [mine, year])
  const theirStats = useMemo(() => (theirs ? statsFor(theirs.logs, year) : null), [theirs, year])

  const activeGoal = accepted.find((g) => g.id === activeGoalId)
  const partner = activeGoal ? partnerOf(activeGoal) : undefined
  const partnerName = partner?.name ?? 'Your friend'

  // Top three runs across both people, so the ranking means something with two.
  const topRuns =
    myStats && theirStats
      ? [
          ...myStats.runs.map((r) => ({ ...r, who: 'You', image: user?.image ?? null })),
          ...theirStats.runs.map((r) => ({
            ...r,
            who: partnerName,
            image: partner?.image ?? null,
          })),
        ]
          .sort((a, b) => b.length - a.length)
          .slice(0, 3)
      : []

  const SUMMARY = [
    { label: 'Active days', mine: myStats?.activeDays, theirs: theirStats?.activeDays, suffix: '' },
    { label: 'Consistency', mine: myStats?.consistency, theirs: theirStats?.consistency, suffix: '%' },
    { label: 'Current streak', mine: myStats?.currentStreak, theirs: theirStats?.currentStreak, suffix: '' },
    { label: 'Best streak', mine: myStats?.bestStreak, theirs: theirStats?.bestStreak, suffix: '' },
  ]

  return (
    <div className="relative min-h-screen bg-white p-3 font-sans text-neutral-900 antialiased">
      <PageBackdrop />

      <div className="relative z-10 mx-auto w-full max-w-5xl px-3 pb-16 sm:px-5">
        <AppNavbar active="comparison" />

        <h1 className="font-Hero text-[34px] leading-none tracking-tight sm:text-[40px]">
          Comparison
        </h1>

        {/* goal picker */}
        <div className="mt-6 flex flex-wrap items-center gap-2 text-[15px]">
          <span className="text-neutral-500">Compare</span>
          <span className="inline-flex h-9 items-center rounded-md border border-neutral-200 bg-neutral-50 px-3 text-sm font-medium">
            You
          </span>
          <span className="text-neutral-500">with</span>
          <select
            value={activeGoalId ?? ''}
            onChange={(e) => navigate(`/comparison/${e.target.value}`)}
            disabled={accepted.length === 0}
            aria-label="Choose who to compare with"
            className="h-9 rounded-md border border-neutral-200 bg-white px-3 text-sm font-medium shadow-sm outline-none transition-colors focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 disabled:opacity-60"
          >
            {accepted.length === 0 && <option value="">No shared goals yet</option>}
            {accepted.map((g) => (
              <option key={g.id} value={g.id}>
                {partnerOf(g)?.name ?? 'Your friend'}
              </option>
            ))}
          </select>
        </div>

        {accepted.length === 0 ? (
          <div className="mt-10 rounded-xl border border-neutral-200 bg-white p-10 text-center shadow-sm">
            <p className="font-Hero text-[22px]">No shared goals yet</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-500">
              Pair up with a friend on a habit and both of your grids will show up here,
              side by side.
            </p>
            <Link
              to="/friends"
              className="mt-5 inline-flex h-9 items-center rounded-md bg-neutral-900 px-4 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
            >
              Go to Friends
            </Link>
          </div>
        ) : isLoading || !mine || !theirs || !myStats || !theirStats ? (
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-56 animate-pulse rounded-xl bg-neutral-100" />
            ))}
          </div>
        ) : (
          <>
            {/* two grids */}
            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              {[
                { who: 'You', image: user?.image ?? null, side: mine, stats: myStats, clickable: true },
                { who: partnerName, image: partner?.image ?? null, side: theirs, stats: theirStats, clickable: false },
              ].map((p) => (
                <section
                  key={p.who}
                  className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <Avatar className="size-8">
                      <AvatarImage src={p.image || ''} alt={p.who} />
                      <AvatarFallback className="text-xs">{p.who.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <p className="min-w-0 flex-1 truncate text-[15px] font-medium">{p.who}</p>

                    <div className="flex shrink-0 gap-5 text-right">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-neutral-500">Current</p>
                        <p className="font-Hero text-[20px] leading-none tabular-nums">
                          {p.stats.currentStreak}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-neutral-500">Best</p>
                        <p className="font-Hero text-[20px] leading-none tabular-nums text-neutral-500">
                          {p.stats.bestStreak}
                        </p>
                      </div>
                    </div>
                  </div>

                  <MiniHeatmap
                    year={year}
                    logs={p.side.logs}
                    onSelect={
                      p.clickable && p.side.categoryId
                        ? (date) => openDayModal(date, p.side.categoryId as string)
                        : undefined
                    }
                  />
                </section>
              ))}
            </div>

            {/* yearly summary */}
            <section className="mt-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="font-Hero text-[22px] leading-none tracking-tight">
                Yearly summary
              </h2>

              <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
                {SUMMARY.map((row) => (
                  <div key={row.label}>
                    <p className="text-[11px] uppercase tracking-wider text-neutral-500">
                      {row.label}
                    </p>
                    <div className="mt-2 flex items-baseline gap-4">
                      <span className="font-Hero text-[26px] leading-none tabular-nums">
                        {row.mine}{row.suffix}
                      </span>
                      <span className="font-Hero text-[26px] leading-none tabular-nums text-neutral-400">
                        {row.theirs}{row.suffix}
                      </span>
                    </div>
                    <div className="mt-1.5 flex gap-4 text-[11px] text-neutral-500">
                      <span className="w-6.5">You</span>
                      <span className="truncate">{partnerName}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* longest streaks */}
            <section className="mt-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="font-Hero text-[22px] leading-none tracking-tight">
                Longest streaks
              </h2>
              <p className="mt-1.5 text-xs text-neutral-500">
                The three best runs between you this year.
              </p>

              {topRuns.length === 0 ? (
                <p className="py-6 text-sm text-neutral-500">No streaks logged yet.</p>
              ) : (
                <ol className="mt-4">
                  {topRuns.map((r, i) => (
                    <li
                      key={`${r.who}-${r.start}`}
                      className="flex items-center gap-4 border-b border-neutral-200 py-3.5 last:border-b-0"
                    >
                      <span className="w-4 shrink-0 font-Hero text-[18px] leading-none text-neutral-400">
                        {i + 1}
                      </span>
                      <Avatar className="size-8">
                        <AvatarImage src={r.image || ''} alt={r.who} />
                        <AvatarFallback className="text-xs">
                          {r.who.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-medium">{r.who}</p>
                        <p className="truncate text-xs text-neutral-500">
                          {formatDateLabel(r.start)} → {formatDateLabel(r.end)}
                        </p>
                      </div>
                      <p className="shrink-0 font-Hero text-[20px] leading-none tabular-nums">
                        {r.length}
                        <span className="ml-1 font-sans text-[11px] text-neutral-500">days</span>
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </>
        )}
      </div>
      <DayModal />
    </div>
  )
}

export default ComparisonPage
