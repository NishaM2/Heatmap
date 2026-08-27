import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Code2,
  Dumbbell,
  GitBranch,
  GitCompare,
  Laptop,
  LayoutDashboard,
  LayoutGrid,
  LineChart,
  Menu,
  MoreHorizontal,
  Plus,
  Settings,
  Sparkles,
  Users,
  X,
} from 'lucide-react'

/**
 * Marketing page for HeatTrack.
 *
 * Self-contained by design: it paints its own light palette instead of reading the
 * app's theme tokens, so it renders identically whether or not the visitor has the
 * dashboard in dark mode. Every capability described here maps to something the
 * app actually does — categories, effort levels, streak stats, GitHub sync,
 * friends, shared goals, notifications and PNG export.
 */


// Deterministic pseudo-random so the demo grids stay stable across re-renders.
const seeded = (i: number) => {
  const x = Math.sin(i * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

const demoLevels = (count: number, offset = 0, density = 0.72) =>
  Array.from({ length: count }, (_, i) => {
    const v = seeded(i + offset)
    if (v > density) return 0
    return Math.min(4, Math.floor((v / density) * 4) + 1)
  })


/* ---------------------------------------------------------------- primitives */

/* -------------------------------------------------------------- demo visuals */


const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/* ------------------------------------------------------------------ sections */

const NAV_LINKS = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Features', href: '#features' },
  { label: 'Together', href: '#together' },
  { label: 'Sharing', href: '#sharing' },
]

/* ------------------------------------------------------------- hero tokens */

const BLUE = '#2b7ff5'
const HAIRLINE = '#ecedf0'
const HAIRLINE_SOFT = '#f2f3f5'
const INK = '#111318'

const SH_LG =
  'shadow-[0_2px_6px_rgba(16,24,40,0.05),0_26px_50px_-20px_rgba(16,24,40,0.18)]'
const SH_MD =
  'shadow-[0_1px_2px_rgba(16,24,40,0.04),0_14px_30px_-12px_rgba(16,24,40,0.14)]'

const Nav = () => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <nav className="flex items-center justify-between gap-6 px-2 pb-5 pt-2.5 sm:px-5">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <Activity className="h- w-6" style={{ color: BLUE }} />
          <span className="text-[22px] font-semibold tracking-[-0.022em] sm:text-xl" style={{ color: INK }}>
            HeatTrack
          </span>
        </Link>

        <div className="hidden items-center gap-8 lg:flex xl:gap-10">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-md py-1.5 text-[15.5px] tracking-[-0.006em] transition-colors hover:text-[#2b7ff5]"
              style={{ color: INK }}
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-3 sm:gap-5">
          <Link
            to="/login"
            className="hidden rounded-md py-1.5 text-[15px] text-[#6b7280] transition-colors hover:text-[#111318] sm:block"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="rounded-[10px] border-[1.5px] bg-white px-4 py-2.5 text-[15px] font-medium transition-colors hover:bg-[#2b7ff5] hover:text-white sm:px-[22px] sm:text-[15.5px]"
            style={{ borderColor: BLUE, color: BLUE }}
          >
            Get started
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            className="rounded-lg p-1.5 text-slate-700 transition hover:bg-slate-100 lg:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="mb-3 flex flex-col gap-1 rounded-2xl border border-[#f2f3f5] bg-white p-3 lg:hidden">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-[#fbfbfc]"
            >
              {l.label}
            </a>
          ))}
          <Link to="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-[#fbfbfc] sm:hidden">
            Sign in
          </Link>
        </div>
      )}
    </>
  )
}

/* --------------------------------------------------- today's habits card */

// Effort maps 1-4 onto a ten-cell ramp, so the strip reads like a row of
// heatmap squares rather than a percentage bar.
const EFFORT_CELLS = 10

const EffortStrip = ({ level }: { level: number }) => {
  const filled = Math.round((level / 4) * EFFORT_CELLS)
  return (
    <div className="flex gap-[3px]">
      {Array.from({ length: EFFORT_CELLS }, (_, i) => (
        <span
          key={i}
          className="h-[11px] w-[11px] rounded-[3px]"
          style={
            i < filled
              ? {
                  backgroundColor: BLUE,
                  opacity: 0.16 + (i / Math.max(filled - 1, 1)) * 0.84,
                }
              : { backgroundColor: '#e6e8ec' }
          }
        />
      ))}
    </div>
  )
}

const TODAY = [
  { name: 'Deep Work', level: 3, Icon: Laptop },
  { name: 'Workout', level: 4, Icon: Dumbbell },
  { name: 'Read', level: 2, Icon: BookOpen },
]

const TodayCard = () => (
  <div className={`rounded-2xl border border-[${HAIRLINE_SOFT}] bg-white p-[22px] ${SH_LG}`}>
    <h3 className="mb-4 text-[16.5px] font-semibold tracking-[-0.018em]" style={{ color: INK }}>
      Today's habits
    </h3>

    <div className="flex flex-col gap-[14px]">
      {TODAY.map(({ name, level, Icon }) => (
        <div key={name} className="flex items-center gap-3">
          <span
            className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[10px]"
            style={{ backgroundColor: BLUE }}
          >
            <Icon className="h-[17px] w-[17px] text-white" />
          </span>

          <div className="min-w-0 flex-1">
            <p className="mb-[7px] text-[14.5px] font-medium tracking-[-0.008em]" style={{ color: INK }}>
              {name}
            </p>
            <EffortStrip level={level} />
          </div>

          <span className="shrink-0 text-[13.5px] tabular-nums text-[#8a9099]">
            {level}/4
          </span>
        </div>
      ))}
    </div>
  </div>
)

const newLocal = "grid justify-items-center gap-1.75 text-[11px] text-[#a8adb5]"
/* -------------------------------------------------------------------- hero */

const Hero = () => (
  <div className="px-3 pt-3 sm:px-5 sm:pt-5 ">
    <div
      className="mx-auto w-full max-w-340 rounded-[30px] border bg-[#fdfdfe] p-3 sm:p-4.5"
      style={{ borderColor: HAIRLINE }}
    >
      <Nav />

      <section
        className="relative flex min-h-150 items-center justify-center overflow-hidden rounded-[22px] border bg-white bg-[radial-gradient(circle,rgba(17,19,24,0.055)_1px,transparent_1px)] bg-[length:22px_22px] px-5 py-12 sm:px-10 lg:min-h-[720px] lg:py-24"
        style={{ borderColor: HAIRLINE }}
      >
        {/* ------------------------------------------------------- core */}
        <div className="relative z-30 flex max-w-195 flex-col items-center text-center">
          <div
            className={`mb-7 grid h-18.5 w-18.5 place-items-center rounded-[18px] border bg-white sm:mb-11 ${SH_MD}`}
            style={{ borderColor: HAIRLINE_SOFT }}
          >
            <Activity className="h-9 w-9" style={{ color: BLUE }} />
          </div>

          <h1
            className="text-balance text-[40px] font-bold leading-[1.04] tracking-[-0.04em] sm:text-[56px] lg:text-[60px]"
            style={{ color: INK }}
          >
            Build better habits
            <span className="mt-[0.1em] block font-medium text-[#8a9099]">
              all in one place
            </span>
          </h1>

          <p className="mt-5 max-w-[26ch] text-balance text-base leading-[1.55] text-[#6b7280] sm:mt-7 sm:text-[15px]">
            Track your habits, stay consistent, and become your best self.
          </p>

          <Link
            to="/register"
            className="mt-7 inline-flex items-center justify-center rounded-xl px-9 py-[17px] text-[17px] font-medium tracking-[-0.008em] text-white shadow-[0_1px_2px_rgba(43,127,245,0.18),0_14px_26px_-10px_rgba(43,127,245,0.45)] transition hover:-translate-y-px hover:bg-[#1c6ae0] sm:mt-10"
            style={{ backgroundColor: BLUE }}
          >
            Get free demo
          </Link>
        </div>

        {/* ------------------------------------------------------ cards */}
        <div className="mt-14 grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:mt-0 lg:block lg:w-auto">

          {/* --------------------------------------- top-left: sticky note */}
          <div className="flex justify-center lg:absolute lg:left-[3%] lg:top-[7%] lg:z-20 lg:block lg:w-[210px] xl:left-[4%]">
            <div className="relative">
              <div
                className="absolute left-3.5 top-6 hidden h-[176px] w-[190px] -rotate-[7deg] rounded-xl border bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_6px_14px_-8px_rgba(16,24,40,0.10)] lg:block"
                style={{ borderColor: HAIRLINE_SOFT }}
                aria-hidden="true"
              />

              <div className="relative max-w-[220px] -rotate-[3.5deg] rounded bg-gradient-to-br from-[#fbdd79] to-[#f8d264] px-[22px] pb-[26px] pt-[34px] shadow-[0_2px_4px_rgba(16,24,40,0.06),0_18px_30px_-14px_rgba(120,88,10,0.38)] lg:max-w-none">
                <span className="absolute -top-[9px] left-1/2 h-[15px] w-[15px] -translate-x-1/2" aria-hidden="true">
                  <span className="block h-[15px] w-[15px] rounded-full bg-[radial-gradient(circle_at_32%_30%,#ff7a7e_0%,#e5484d_55%,#b3373b_100%)] shadow-[0_3px_6px_rgba(180,40,45,0.4)]" />
                  <span className="absolute left-1/2 top-3 -ml-px h-[9px] w-0.5 rounded-b-sm bg-gradient-to-b from-[#c9ccd2] to-[#9aa0a8]" />
                </span>

                <p className="font-[cursive] text-[21px] leading-[1.34] text-[#3d3418]">
                  Small habits today, better you tomorrow.
                </p>
              </div>

              <div
                className={`absolute -bottom-11.5 left-6.5 hidden h-23 w-23 -rotate-2 place-items-center rounded-[18px] border bg-white lg:grid ${SH_LG}`}
                style={{ borderColor: HAIRLINE_SOFT }}
                aria-hidden="true"
              >
                <span
                  className="grid h-11.5 w-11.5 place-items-center rounded-[11px] shadow-[0_6px_14px_-6px_rgba(43,127,245,0.6)]"
                  style={{ backgroundColor: BLUE }}
                >
                  <Check className="h-6 w-6 text-white" strokeWidth={3} />
                </span>
              </div>
            </div>
          </div>

          {/* --------------------------------------- top-right: streak */}
          <div className="flex justify-center lg:absolute lg:right-[3%] lg:top-[9%] lg:z-20 lg:block lg:w-59 xl:right-[4%]">
            <div
              className={`relative w-full max-w-65 rounded-2xl border bg-white px-6 pb-6 pt-5.5 lg:max-w-none lg:rotate-[4.5deg] ${SH_LG}`}
              style={{ borderColor: HAIRLINE_SOFT }}
            >
              <div
                className={`absolute -left-19 top-8.5 hidden h-19 w-19 -rotate-3 place-items-center rounded-[18px] border bg-white text-[34px] leading-none lg:grid ${SH_LG}`}
                style={{ borderColor: HAIRLINE_SOFT }}
                aria-hidden="true"
              >
                🔥
              </div>

              <div className="flex items-baseline justify-between gap-2.5">
                <h3 className="text-[17px] font-semibold tracking-[-0.018em]" style={{ color: INK }}>
                  Daily Streak
                </h3>
                <span className="text-[13px] text-[#a8adb5]">Streak</span>
              </div>

              <p className="mt-3 flex items-baseline gap-1.75">
                <strong
                  className="text-[46px] font-semibold leading-none tracking-[-0.045em] tabular-nums"
                  style={{ color: BLUE }}
                >
                  12
                </strong>
                <span className="text-[15px] text-[#6b7280]">days</span>
              </p>
              <p className="mt-1.75 text-[13.5px] text-[#6b7280]">Keep going! 🔥</p>

              <div
                className="mt-4.5 grid grid-cols-7 gap-1.5"
                role="img"
                aria-label="Five of the last seven days logged"
              >
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                  <span key={i} className={newLocal}>
                    <span
                      className="block h-2.75 w-2.75 rounded-full"
                      style={{ backgroundColor: i < 5 ? BLUE : '#e3e6ea' }}
                    />
                    {d}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ------------------------------ bottom-left: today's habits */}
          <div className="flex justify-center lg:absolute lg:bottom-[6%] lg:left-[3%] lg:z-20 lg:block lg:w-82.5 xl:left-[4%]">
            <div className="w-full max-w-90 lg:max-w-none">
              <TodayCard />
            </div>
          </div>

          {/* ---------------------------- bottom-right: track together */}
          <div className="flex justify-center lg:absolute lg:bottom-[8%] lg:right-[3%] lg:z-20 lg:block lg:w-75 xl:right-[4%]">
            <div
              className={`w-full max-w-85 rounded-2xl border bg-white px-6 pb-6.5 pt-6 text-center lg:max-w-none ${SH_LG}`}
              style={{ borderColor: HAIRLINE_SOFT }}
            >
              <h3 className="mb-5 text-[16.5px] font-semibold tracking-[-0.018em]" style={{ color: INK }}>
                Track together
              </h3>

              <div className="flex items-center justify-center">
                {[
                  { i: 'M', bg: 'linear-gradient(140deg,#6aa6f7,#2b7ff5)' },
                  { i: 'T', bg: 'linear-gradient(140deg,#4fcbbd,#2fb8a8)' },
                  { i: 'P', bg: 'linear-gradient(140deg,#f7a95a,#f5871f)' },
                  { i: 'J', bg: 'linear-gradient(140deg,#52c06f,#2ba84a)' },
                ].map((a, n) => (
                  <span
                    key={a.i}
                    className="grid h-11 w-11 place-items-center rounded-full border-[2.5px] border-white text-[15px] font-semibold tracking-[-0.01em] text-white"
                    style={{ background: a.bg, marginLeft: n === 0 ? 0 : -9 }}
                  >
                    {a.i}
                  </span>
                ))}
                <span
                  className="ml-2 grid h-11 w-11 place-items-center rounded-full border-[2.5px] border-white shadow-[0_6px_14px_-6px_rgba(43,127,245,0.6)]"
                  style={{ backgroundColor: BLUE }}
                  aria-hidden="true"
                >
                  <Plus className="h-4.5 w-4.5 text-white" strokeWidth={2.4} />
                </span>
              </div>

              <p className="mt-5 text-balance text-[14.5px] leading-normal text-[#6b7280]">
                Share your goals with friends and stay accountable.
              </p>
            </div>
          </div>

        </div>
      </section>
    </div>
  </div>
)

/* ===========================================================================
   Why HeatTrack  +  Features
   Blue-accented sections that sit directly under the hero and share its
   token set (BLUE / HAIRLINE / INK / SH_LG defined above).
   =========================================================================== */

const SECTION_BG = '#f8f9fb'
const CARD_BORDER = '#edeef1'
const INK_MUTED = '#6b7280'

const blueCell = (level: number) =>
  level === 0
    ? { backgroundColor: '#e7ebf0' }
    : {
        backgroundColor: BLUE,
        opacity: level === 1 ? 0.28 : level === 2 ? 0.52 : level === 3 ? 0.76 : 1,
      }

/** Columns-of-7 activity grid in the hero's blue, sized by `cell`. */
const BlueGrid = ({
  weeks,
  offset = 0,
  cell = 7,
  gap = 2,
}: {
  weeks: number
  offset?: number
  cell?: number
  gap?: number
}) => {
  const levels = useMemo(() => demoLevels(weeks * 7, offset, 0.7), [weeks, offset])
  return (
    <div className="flex" style={{ gap }}>
      {Array.from({ length: weeks }, (_, w) => (
        <div key={w} className="flex flex-col" style={{ gap }}>
          {Array.from({ length: 7 }, (_, d) => (
            <span
              key={d}
              className="block rounded-xs"
              style={{ width: cell, height: cell, ...blueCell(levels[w * 7 + d]) }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

const Pill = ({ children }: { children: React.ReactNode }) => (
  <span
    className="inline-flex items-center rounded-full border bg-white px-4 py-1.5 text-[12.5px] font-medium shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
    style={{ borderColor: CARD_BORDER, color: INK_MUTED }}
  >
    {children}
  </span>
)

const SectionShell = ({ id, children }: { id?: string; children: React.ReactNode }) => (
  <div className="px-3 pt-5 sm:px-5">
    <section
      id={id}
      className="mx-auto w-full max-w-340 rounded-[28px] border px-5 py-14 sm:px-10 sm:py-20"
      style={{ backgroundColor: SECTION_BG, borderColor: '#eef0f2' }}
    >
      {children}
    </section>
  </div>
)

const SectionHeading = ({ children }: { children: React.ReactNode }) => (
  <h2
    className="mt-6 text-balance text-center text-[30px] font-bold leading-[1.15] tracking-[-0.03em] sm:text-[40px]"
    style={{ color: INK }}
  >
    {children}
  </h2>
)

/* ------------------------------------------------------------ why heattrack */

const VALUES = [
  {
    Icon: BarChart3,
    title: 'See your consistency',
    body: 'A year-long heatmap makes your habits visible at a glance.',
  },
  {
    Icon: LayoutGrid,
    title: 'Track how much you did',
    body: 'Four effort levels show the difference between showing up and going all in.',
  },
  {
    Icon: Users,
    title: 'Track together',
    body: 'Share goals with friends and keep each other accountable.',
  },
]

const SIDEBAR = [
  { Icon: LayoutDashboard, label: 'Dashboard', active: true },
  { Icon: Users, label: 'Friends' },
  { Icon: GitCompare, label: 'Comparison' },
  { Icon: Calendar, label: 'Calendar' },
  { Icon: LineChart, label: 'Analytics' },
  { Icon: Settings, label: 'Settings' },
]

const LEGEND = [
  { label: 'No data', level: 0 },
  { label: '1 Light', level: 1 },
  { label: '2 Moderate', level: 2 },
  { label: '3 Hard', level: 3 },
  { label: '4 Intense', level: 4 },
]

const DASH_HABITS = [
  { Icon: Code2, name: 'Coding', core: true, cur: 23, best: 67, tone: BLUE, curTone: BLUE },
  { Icon: BookOpen, name: 'Read', core: false, cur: 12, best: 35, tone: '#2ba84a', curTone: '#2ba84a' },
  { Icon: Dumbbell, name: 'Workout', core: false, cur: 8, best: 28, tone: '#f5871f', curTone: '#f5871f' },
]

const DashboardMock = () => (
  <div className="flex overflow-hidden rounded-[14px] border bg-white shadow-[0_18px_40px_-18px_rgba(16,24,40,0.28)]" style={{ borderColor: CARD_BORDER }}>

    {/* sidebar */}
    <aside className="hidden w-41 shrink-0 flex-col justify-between border-r px-3 py-4 lg:flex" style={{ borderColor: '#f1f2f4' }}>
      <div>
        <div className="mb-5 flex items-center gap-2 px-2">
          <Activity className="h-3.75 w-3.75" style={{ color: BLUE }} />
          <span className="text-[13.5px] font-semibold tracking-[-0.02em]" style={{ color: INK }}>HeatTrack</span>
        </div>
        <div className="flex flex-col gap-0.5">
          {SIDEBAR.map(({ Icon, label, active }) => (
            <div
              key={label}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.75 text-[12px]"
              style={
                active
                  ? { backgroundColor: '#eaf2fe', color: BLUE, fontWeight: 500 }
                  : { color: '#8a9099' }
              }
            >
              <Icon className="h-3.25 w-3.25" />
              {label}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 px-2 pt-4">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-linear-to-br from-[#6aa6f7] to-[#2b7ff5] text-[10px] font-semibold text-white">N</span>
        <span className="text-[12px]" style={{ color: '#6b7280' }}>Nisha</span>
      </div>
    </aside>

    {/* main */}
    <div className="min-w-0 flex-1">
      {/* top bar */}
      <div className="flex items-center justify-between gap-3 border-b px-3 py-2.5 sm:px-4" style={{ borderColor: '#f1f2f4' }}>
        <div className="flex items-center gap-1.5">
          <ChevronLeft className="h-3.5 w-3.5" style={{ color: '#a8adb5' }} />
          <span className="rounded-md border px-2.5 py-1 text-[11.5px] font-medium tabular-nums" style={{ borderColor: CARD_BORDER, color: INK }}>2024</span>
          <ChevronRight className="h-3.5 w-3.5" style={{ color: '#a8adb5' }} />
        </div>
        <div className="flex items-center gap-2.5">
          <span className="flex items-center gap-1.5 rounded-lg border bg-white px-2.5 py-1.5 text-[11.5px] font-medium" style={{ borderColor: CARD_BORDER, color: INK }}>
            <GitBranch className="h-3 w-3" style={{ color: BLUE }} />
            Sync GitHub
          </span>
          <Bell className="h-3.5 w-3.5" style={{ color: '#a8adb5' }} />
        </div>
      </div>

      <div className="flex flex-col gap-3 p-3 sm:p-4">
        {/* overall progress */}
        <div className="rounded-xl border p-3.5" style={{ borderColor: '#f1f2f4' }}>
          <p className="mb-3 text-[13px] font-semibold tracking-[-0.015em]" style={{ color: INK }}>Overall Progress</p>

          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="min-w-0 flex-1 overflow-x-auto">
              <div className="min-w-107.5">
                <div className="mb-1.5 flex justify-between pl-6.5 text-[8.5px]" style={{ color: '#a8adb5' }}>
                  {MONTHS.map((m) => <span key={m}>{m}</span>)}
                </div>
                <div className="flex gap-1.5">
                  <div className="flex flex-col justify-between py-px text-[8.5px]" style={{ color: '#a8adb5' }}>
                    <span>Mon</span><span>Wed</span><span>Fri</span>
                  </div>
                  <BlueGrid weeks={44} offset={11} cell={7} gap={2} />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-3.5 gap-y-1.5">
                  {LEGEND.map((l) => (
                    <span key={l.label} className="flex items-center gap-1.5 text-[8.5px]" style={{ color: '#8a9099' }}>
                      <span className="block h-1.75 w-1.75 rounded-xs" style={blueCell(l.level)} />
                      {l.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex shrink-0 gap-6 border-t pt-3 lg:w-31 lg:flex-col lg:gap-3 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0" style={{ borderColor: '#f1f2f4' }}>
              <div>
                <p className="text-[9.5px]" style={{ color: '#a8adb5' }}>Current streak</p>
                <p className="flex items-baseline gap-1">
                  <span className="text-[22px] font-semibold leading-none tabular-nums" style={{ color: BLUE }}>23</span>
                  <span className="text-[10px]" style={{ color: '#8a9099' }}>days</span>
                </p>
              </div>
              <div>
                <p className="text-[9.5px]" style={{ color: '#a8adb5' }}>Longest streak</p>
                <p className="flex items-baseline gap-1">
                  <span className="text-[22px] font-semibold leading-none tabular-nums" style={{ color: BLUE }}>67</span>
                  <span className="text-[10px]" style={{ color: '#8a9099' }}>days</span>
                </p>
              </div>
              <span className="hidden rounded-lg border px-2.5 py-1.5 text-center text-[10.5px] font-medium lg:block" style={{ borderColor: CARD_BORDER, color: BLUE }}>
                View analytics
              </span>
            </div>
          </div>
        </div>

        {/* my habits */}
        <div className="rounded-xl border p-3.5" style={{ borderColor: '#f1f2f4' }}>
          <p className="mb-2.5 text-[13px] font-semibold tracking-[-0.015em]" style={{ color: INK }}>My Habits</p>

          <div className="flex flex-col">
            {DASH_HABITS.map((h, i) => (
              <div
                key={h.name}
                className={`flex items-center gap-3 py-2.5 ${i > 0 ? 'border-t' : ''}`}
                style={i > 0 ? { borderColor: '#f4f5f6' } : undefined}
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg" style={{ backgroundColor: h.tone }}>
                  <h.Icon className="h-3.5 w-3.5 text-white" />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-[12px] font-medium" style={{ color: INK }}>
                    {h.name}
                    {h.core && (
                      <span className="rounded-full px-1.5 py-px text-[8.5px] font-semibold" style={{ backgroundColor: '#eaf2fe', color: BLUE }}>Core</span>
                    )}
                  </p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="hidden text-[8.5px] sm:block" style={{ color: '#a8adb5' }}>Last 7 days</span>
                    <span className="flex gap-0.5">
                      {[0, 1, 2, 3, 3, 4, 2].map((lv, k) => (
                        <span key={k} className="block h-1.75 w-1.75 rounded-xs" style={blueCell(lv)} />
                      ))}
                    </span>
                  </div>
                </div>

                <div className="hidden shrink-0 gap-5 sm:flex">
                  <div className="w-13">
                    <p className="text-[8.5px]" style={{ color: '#a8adb5' }}>Current streak</p>
                    <p className="text-[13px] font-semibold tabular-nums" style={{ color: h.curTone }}>{h.cur}<span className="ml-0.5 text-[9px] font-normal" style={{ color: '#a8adb5' }}>days</span></p>
                  </div>
                  <div className="w-13">
                    <p className="text-[8.5px]" style={{ color: '#a8adb5' }}>Longest streak</p>
                    <p className="text-[13px] font-semibold tabular-nums" style={{ color: INK }}>{h.best}<span className="ml-0.5 text-[9px] font-normal" style={{ color: '#a8adb5' }}>days</span></p>
                  </div>
                </div>

                <MoreHorizontal className="h-3.5 w-3.5 shrink-0" style={{ color: '#c4c8ce' }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
)

const WhyHeatTrack = () => (
  <SectionShell id="why-heattrack">
    <div className="flex flex-col items-center">
      <Pill>Why HeatTrack</Pill>
      <SectionHeading>
        Turn daily effort into
        <br className="hidden sm:block" /> lasting change
      </SectionHeading>
    </div>

    <div className="mx-auto mt-12 grid max-w-5xl gap-8 sm:mt-16 sm:grid-cols-3 sm:gap-10">
      {VALUES.map(({ Icon, title, body }) => (
        <div key={title}>
          <span className="grid h-11 w-11 place-items-center rounded-xl" style={{ backgroundColor: '#eaf2fe' }}>
            <Icon className="h-5 w-5" style={{ color: BLUE }} />
          </span>
          <h3 className="mt-4 text-[15.5px] font-semibold tracking-[-0.015em]" style={{ color: INK }}>{title}</h3>
          <p className="mt-2 text-[14px] leading-[1.6]" style={{ color: INK_MUTED }}>{body}</p>
        </div>
      ))}
    </div>

    {/* dashboard showcase */}
    <div className="relative mt-14 sm:mt-20">
      <div className="rounded-[24px] bg-linear-to-br from-[#2b8fef] via-[#63b8f8] to-[#dcefff] p-2.5 sm:p-8 sm:pb-0 sm:pl-10">
        <DashboardMock />
      </div>

      {/* floating cards */}
      <div
        className={`absolute -left-1 top-[38%] hidden h-18.5 w-18.5 flex-col items-center justify-center gap-0.5 rounded-[18px] border bg-white sm:-left-5 lg:flex ${SH_LG}`}
        style={{ borderColor: HAIRLINE_SOFT }}
        aria-hidden="true"
      >
        <span className="text-[22px] leading-none">🔥</span>
        <span className="text-[17px] font-bold leading-none tabular-nums" style={{ color: BLUE }}>23</span>
      </div>

      <div
        className={`absolute -right-1 top-[22%] hidden h-16.5 w-16.5 place-items-center rounded-[18px] border bg-white sm:-right-5 lg:grid ${SH_LG}`}
        style={{ borderColor: HAIRLINE_SOFT }}
        aria-hidden="true"
      >
        <span className="grid h-9 w-9 place-items-center rounded-[10px]" style={{ backgroundColor: BLUE }}>
          <Check className="h-5 w-5 text-white" strokeWidth={3} />
        </span>
      </div>
    </div>
  </SectionShell>
)

/* ----------------------------------------------------------------- features */

const EFFORTS = [
  { n: 1, label: 'Light' },
  { n: 2, label: 'Moderate' },
  { n: 3, label: 'Hard' },
  { n: 4, label: 'Intense' },
]

const MILESTONE_DAYS = [7, 30, 60, 100, 365]

const FeatureCard = ({
  visual,
  title,
  body,
  className = '',
}: {
  visual: React.ReactNode
  title: string
  body: string
  className?: string
}) => (
  <div
    className={`flex flex-col rounded-2xl border bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.03),0_10px_24px_-14px_rgba(16,24,40,0.12)] sm:p-6 ${className}`}
    style={{ borderColor: CARD_BORDER }}
  >
    {visual}
    <h3 className="mt-6 text-[16px] font-semibold tracking-[-0.018em]" style={{ color: INK }}>{title}</h3>
    <p className="mt-2 text-[14px] leading-[1.6]" style={{ color: INK_MUTED }}>{body}</p>
  </div>
)

const FeatureHighlights = () => (
  <SectionShell id="feature-highlights">
    <div className="flex flex-col items-center">
      <Pill>Features</Pill>
      <SectionHeading>
        Everything you need to
        <br className="hidden sm:block" /> build better habits
      </SectionHeading>
      <p className="mt-4 max-w-md text-balance text-center text-[15px] leading-[1.6]" style={{ color: INK_MUTED }}>
        Powerful features to help you stay consistent, track progress, and grow together.
      </p>
    </div>

    {/* row 1 */}
    <div className="mt-12 grid gap-5 sm:mt-16 lg:grid-cols-3">

      <FeatureCard
        title="Year-long Heatmap"
        body="A GitHub-style view of your entire year. Every square tells a story."
        visual={
          <div className="relative flex min-h-32 items-center rounded-xl px-4 py-4" style={{ backgroundColor: '#fafbfc' }}>
            <div className="flex gap-1.5">
              <div className="flex flex-col justify-between py-px text-[8px]" style={{ color: '#a8adb5' }}>
                <span>M</span><span>W</span><span>F</span>
              </div>
              <BlueGrid weeks={9} offset={61} cell={10} gap={3} />
            </div>
            <div
              className="absolute right-3 top-1/2 w-37.5 -translate-y-1/2 rounded-lg border bg-white p-2.5 shadow-[0_8px_20px_-8px_rgba(16,24,40,0.22)]"
              style={{ borderColor: CARD_BORDER }}
            >
              <p className="text-[11px] font-semibold" style={{ color: INK }}>Aug 12, 2024</p>
              <p className="mt-0.5 text-[10px] font-medium" style={{ color: BLUE }}>Hard (3/4)</p>
              <p className="mt-1 text-[9.5px] leading-[1.45]" style={{ color: '#8a9099' }}>
                Deep work session. Completed all tasks.
              </p>
            </div>
          </div>
        }
      />

      <FeatureCard
        title="Log Effort, Not Just Done"
        body="Choose your effort level from 1–4 and add a quick note."
        visual={
          <div className="flex min-h-32 flex-col justify-center rounded-xl px-4 py-4" style={{ backgroundColor: '#fafbfc' }}>
            <p className="mb-3 text-center text-[11.5px]" style={{ color: '#8a9099' }}>How was your day?</p>
            <div className="grid grid-cols-4 gap-2">
              {EFFORTS.map((e) => {
                const on = e.n === 3
                return (
                  <div
                    key={e.n}
                    className="rounded-lg border py-2 text-center"
                    style={
                      on
                        ? { backgroundColor: BLUE, borderColor: BLUE, color: '#fff' }
                        : { backgroundColor: '#fff', borderColor: CARD_BORDER, color: INK }
                    }
                  >
                    <p className="text-[15px] font-semibold leading-none tabular-nums">{e.n}</p>
                    <p className="mt-1 text-[9px]" style={{ color: on ? 'rgba(255,255,255,.85)' : '#8a9099' }}>{e.label}</p>
                  </div>
                )
              })}
            </div>
          </div>
        }
      />

      <FeatureCard
        title="Share Goals with Friends"
        body="Pick a goal, invite a friend, and track your progress together."
        visual={
          <div className="flex min-h-32 items-center justify-center rounded-xl px-4 py-4" style={{ backgroundColor: '#fafbfc' }}>
            <div className="flex items-center">
              {[
                { i: 'A', bg: 'linear-gradient(140deg,#6aa6f7,#2b7ff5)' },
                { i: 'M', bg: 'linear-gradient(140deg,#4fcbbd,#2fb8a8)' },
                { i: 'D', bg: 'linear-gradient(140deg,#f7a95a,#f5871f)' },
              ].map((a, n) => (
                <span
                  key={a.i}
                  className="grid h-12 w-12 place-items-center rounded-full border-[3px] border-white text-[15px] font-semibold text-white shadow-[0_2px_6px_rgba(16,24,40,0.10)]"
                  style={{ background: a.bg, marginLeft: n === 0 ? 0 : -12 }}
                >
                  {a.i}
                </span>
              ))}
              <span
                className="ml-3 grid h-12 w-12 place-items-center rounded-full border shadow-[0_2px_6px_rgba(16,24,40,0.08)]"
                style={{ borderColor: CARD_BORDER, backgroundColor: '#fff' }}
              >
                <Plus className="h-5 w-5" style={{ color: BLUE }} strokeWidth={2.4} />
              </span>
            </div>
          </div>
        }
      />
    </div>

    {/* row 2 */}
    <div className="mt-5 grid gap-5 lg:grid-cols-2">

      {/* github sync */}
      <div
        className="rounded-2xl border bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.03),0_10px_24px_-14px_rgba(16,24,40,0.12)] sm:p-6"
        style={{ borderColor: CARD_BORDER }}
      >
        <div className="flex flex-col items-center gap-5 sm:flex-row">
          <div className="flex flex-1 items-center gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full" style={{ backgroundColor: '#1b1f24' }}>
              <GitBranch className="h-6 w-6 text-white" />
            </span>
            <ArrowRight className="h-4 w-4 shrink-0" style={{ color: '#c4c8ce' }} />
            <div className="min-w-0 flex-1 rounded-xl border p-2.5" style={{ borderColor: CARD_BORDER, backgroundColor: '#fafbfc' }}>
              <div className="flex items-center gap-2">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md" style={{ backgroundColor: BLUE }}>
                  <Code2 className="h-3 w-3 text-white" />
                </span>
                <span className="text-[12px] font-medium" style={{ color: INK }}>Coding</span>
                <span className="ml-auto flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-semibold" style={{ backgroundColor: '#e8f7ed', color: '#2ba84a' }}>
                  <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  Synced
                </span>
              </div>
              <p className="mt-2 text-[10.5px]" style={{ color: '#8a9099' }}>124 commits this week</p>
              <div className="mt-2 overflow-hidden">
                <BlueGrid weeks={22} offset={205} cell={5} gap={2} />
              </div>
            </div>
          </div>

          <div className="sm:w-[46%]">
            <h3 className="text-[16px] font-semibold tracking-[-0.018em]" style={{ color: INK }}>GitHub Sync</h3>
            <p className="mt-2 text-[14px] leading-[1.6]" style={{ color: INK_MUTED }}>
              Automatically track your coding progress from commits. We never overwrite your notes.
            </p>
          </div>
        </div>
      </div>

      {/* milestones */}
      <div
        className="rounded-2xl border bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.03),0_10px_24px_-14px_rgba(16,24,40,0.12)] sm:p-6"
        style={{ borderColor: CARD_BORDER }}
      >
        <div className="flex flex-wrap items-center gap-2.5">
          {MILESTONE_DAYS.map((d) => {
            const on = d === 365
            return (
              <div key={d} className="relative">
                {on && <Sparkles className="absolute -right-1.5 -top-2 h-3.5 w-3.5" style={{ color: '#7cc4fb' }} />}
                <div
                  className="rounded-xl px-4 py-2.5 text-center"
                  style={
                    on
                      ? { backgroundColor: BLUE, color: '#fff' }
                      : { backgroundColor: '#f4f5f7', color: INK }
                  }
                >
                  <p className="text-[17px] font-semibold leading-none tabular-nums">{d}</p>
                  <p className="mt-1 text-[10px]" style={{ color: on ? 'rgba(255,255,255,.85)' : '#8a9099' }}>days</p>
                </div>
              </div>
            )
          })}
        </div>

        <h3 className="mt-6 text-[16px] font-semibold tracking-[-0.018em]" style={{ color: INK }}>Milestones &amp; Streaks</h3>
        <p className="mt-2 text-[14px] leading-[1.6]" style={{ color: INK_MUTED }}>
          Celebrate every step forward and keep your streaks alive.
        </p>
      </div>
    </div>
  </SectionShell>
)

/* ---------------------------------------------------------------------- page */

const LandingPage = () => (
  <div className="min-h-screen bg-[#fbfbfc] font-sans text-slate-900 antialiased">
    <main>
      {/* Nav lives inside the hero shell, matching the reference composition */}
      <Hero />
      <WhyHeatTrack />
      <FeatureHighlights />
      {/* neutral band so the blue sections do not butt straight into the cyan ones */}
      <div className="h-16 bg-linear-to-b from-[#fbfbfc] to-[#f7fafc] sm:h-24" />
      
    </main>

  </div>
)

export default LandingPage
