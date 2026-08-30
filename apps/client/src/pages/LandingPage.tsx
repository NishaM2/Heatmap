import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  ChevronDown,
  Flame,
  GitBranch,
  LayoutGrid,
  Menu,
  NotebookPen,
  Palette,
  Trophy,
  Users,
  X,
} from 'lucide-react'

// BG
const GRID_BG: React.CSSProperties = {
  backgroundImage: `
    linear-gradient(to right, #e2e8f0 1px, transparent 1px),
    linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)
  `,
  backgroundSize: '20px 30px',
  WebkitMaskImage:
    'radial-gradient(ellipse 70% 60% at 50% 0%, #000 60%, transparent 100%)',
  maskImage:
    'radial-gradient(ellipse 70% 60% at 50% 0%, #000 60%, transparent 100%)',
}

const PageBackdrop = () => (
  <div
    aria-hidden
    className="pointer-events-none fixed inset-3 z-0 overflow-hidden rounded-2xl bg-[#f8fafc]"
  >
    <div className="absolute inset-0" style={GRID_BG} />
  </div>
)

const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'How', href: '#how-it-works' },
  { label: 'Features', href: '#features' },
  { label: 'FAQ', href: '#faq' },
]

// how it works 

const STEPS = [
  {
    Icon: Palette,
    title: 'Create a habit',
    body: 'Add up to five things you want to be consistent at. Give each one a colour and mark the ones that count toward your day.',
  },
  {
    Icon: NotebookPen,
    title: 'Log your effort',
    body: 'Tap a day and pick Light, Moderate, Hard or Intense — then add a short note if the day is worth remembering.',
  },
  {
    Icon: Flame,
    title: 'Build your streak',
    body: 'Current and longest streaks update instantly, and milestones land at 7, 30, 60, 100 and 365 days.',
  },
  {
    Icon: Users,
    title: 'Track together',
    body: 'Add friends, pair up on a shared goal, and put your grids side by side to stay accountable every day.',
  },
]

const useReveal = <T extends HTMLElement>() => {
  const ref = useRef<T | null>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    let io: IntersectionObserver | null = null
    let done = false

    const reveal = () => {
      if (done) return
      done = true
      setShown(true)
      io?.disconnect()
      window.removeEventListener('scroll', onScroll)
    }

    const onScroll = () => {
      const r = node.getBoundingClientRect()
      if (r.top < window.innerHeight * 0.85 && r.bottom > 0) reveal()
    }

    if (typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) reveal()
        },
        { threshold: 0.2 }
      )
      io.observe(node)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    const raf = requestAnimationFrame(onScroll)

    return () => {
      io?.disconnect()
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  return { ref, shown }
}


const Connector = ({
  shown,
  delay,
  placeholder = false,
}: {
  shown: boolean
  delay: number
  placeholder?: boolean
}) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 72 40"
    className={`hidden h-10 w-[72px] shrink-0 self-start md:block ${placeholder ? 'invisible' : ''}`}
    style={{ marginTop: 46 }}
  >
    <path
      d="M2 26 C 14 26, 16 8, 28 12 C 38 15, 34 30, 46 26 C 56 23, 58 14, 68 16"
      fill="none"
      stroke="#0f172a"
      strokeWidth="2"
      strokeLinecap="round"
      pathLength={1}
      style={{
        strokeDasharray: 1,
        strokeDashoffset: shown ? 0 : 1,
        transition: 'stroke-dashoffset 1000ms ease',
        transitionDelay: `${delay}ms`,
      }}
      className="motion-reduce:transition-none"
    />
    <path
      d="M62 11 L69 16 L62 21"
      fill="none"
      stroke="#0f172a"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        opacity: shown ? 1 : 0,
        transition: 'opacity 300ms ease',
        transitionDelay: `${delay + 600}ms`,
      }}
      className="motion-reduce:transition-none"
    />
  </svg>
)

const HowItWorks = () => {
  const { ref, shown } = useReveal<HTMLElement>()

  return (
    <section
      id="how-it-works"
      ref={ref}
      className="relative mt-3 px-6 py-20 sm:px-10 sm:py-28"
    >
      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <h2
          className="text-center font-Hero text-[38px] leading-[1.1] tracking-[-0.01em] text-black sm:text-[52px]"
          style={{
            opacity: shown ? 1 : 0,
            transform: shown ? 'none' : 'translateY(16px)',
            transition: 'opacity 600ms ease, transform 600ms ease',
          }}
        >
          How it works
        </h2>

        <p
          className="mx-auto mt-4 max-w-xl text-center text-[16px] leading-relaxed text-black/60 sm:text-[17px]"
          style={{
            opacity: shown ? 1 : 0,
            transform: shown ? 'none' : 'translateY(16px)',
            transition: 'opacity 600ms ease 100ms, transform 600ms ease 100ms',
          }}
        >
          Four steps between a blank grid and a year you can look back on.
        </p>

        <div className="mt-14 flex flex-col items-stretch gap-6 sm:mt-16 md:flex-row md:items-start md:gap-0">
          {STEPS.map(({ Icon, title, body }, i) => (
            <div key={title} className="contents md:flex md:flex-1 md:items-start">
              <div
                className="group h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-16px_rgba(15,23,42,0.16)] transition-transform duration-300 hover:-translate-y-1.5 motion-reduce:transition-none md:flex-1"
                style={{
                  opacity: shown ? 1 : 0,
                  transform: shown ? 'none' : 'translateY(24px)',
                  transition: `opacity 600ms ease ${200 + i * 130}ms, transform 600ms ease ${200 + i * 130}ms`,
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-neutral-100 text-black transition-colors duration-300 group-hover:bg-black group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="font-Hero text-[26px] leading-none text-slate-400">
                    {i + 1}
                  </span>
                </div>

                <h3 className="mt-5 text-[17px] font-semibold tracking-[-0.01em] text-black">
                  {title}
                </h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-black/60">{body}</p>
              </div>

              <Connector
                shown={shown}
                delay={420 + i * 130}
                placeholder={i === STEPS.length - 1}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// features 

const FEATURES = [
  {
    title: 'Year-long heatmap',
    Icon: LayoutGrid,
    description: 'Every square is a day. A whole year of effort, readable at a glance.',
  },
  {
    title: 'Effort, not a checkbox',
    Icon: BarChart3,
    description: 'Log how hard the day actually was, from Light through to Intense.',
  },
  {
    title: 'Streaks & milestones',
    Icon: Trophy,
    description: 'Current and longest streaks, with markers at 7, 30, 60, 100 and 365 days.',
  },
  {
    title: 'GitHub sync',
    Icon: GitBranch,
    description: 'Your commits fill in the coding grid nightly, without overwriting your notes.',
  },
  {
    title: 'Shared goals',
    Icon: Users,
    description: 'Pair up with a friend and put your two grids side by side all year.',
  },
  {
    title: 'Share your grid',
    Icon: Flame,
    description: 'Export any year as a clean image and post the proof, not the promise.',
  },
]

const FeatureCard = ({
  feature,
}: {
  feature: { title: string; Icon: typeof Flame; description: string }
}) => {
  const { title, Icon, description } = feature
  return (
    <div className="group relative overflow-hidden p-6 md:p-8">
      {/* faint grid that lights up under the cursor */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 motion-reduce:transition-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          WebkitMaskImage: 'radial-gradient(ellipse 60% 60% at 50% 0%, #000 60%, transparent 100%)',
          maskImage: 'radial-gradient(ellipse 60% 60% at 50% 0%, #000 60%, transparent 100%)',
        }}
      />

      <div className="relative">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-neutral-100 text-black transition-colors duration-300 group-hover:bg-black group-hover:text-white motion-reduce:transition-none">
          <Icon className="h-[18px] w-[18px]" />
        </span>

        <h3 className="mt-5 text-[16.5px] font-semibold tracking-[-0.01em] text-black">{title}</h3>
        <p className="mt-2 text-[14.5px] leading-relaxed text-black/55">{description}</p>
      </div>
    </div>
  )
}

const AnimatedContainer = ({
  className = '',
  delay = 0.1,
  shown,
  children,
}: {
  className?: string
  delay?: number
  shown: boolean
  children: React.ReactNode
}) => (
  <div
    className={`motion-reduce:!translate-y-0 motion-reduce:!opacity-100 motion-reduce:!blur-none motion-reduce:transition-none ${className}`}
    style={{
      filter: shown ? 'blur(0px)' : 'blur(4px)',
      transform: shown ? 'translateY(0)' : 'translateY(-8px)',
      opacity: shown ? 1 : 0,
      transition: `filter 800ms ease ${delay}s, transform 800ms ease ${delay}s, opacity 800ms ease ${delay}s`,
    }}
  >
    {children}
  </div>
)

const Features = () => {
  const { ref, shown } = useReveal<HTMLElement>()

  return (
    <section id="features" ref={ref} className="relative py-16 md:py-32">
      <div className="mx-auto w-full max-w-5xl space-y-8 px-4">
        <AnimatedContainer shown={shown} className="mx-auto max-w-3xl text-center">
          <h2 className="text-balance text-3xl font-Hero text-black md:text-4xl lg:text-5xl ">
            Track. Streak. Share.
          </h2>
          <p className="mt-4 text-balance text-sm tracking-wide text-black/55 md:text-base">
            Everything you need to stay consistent — and nothing you don't.
          </p>
        </AnimatedContainer>

        <AnimatedContainer
          shown={shown}
          delay={0.4}
          className="grid grid-cols-1 divide-x divide-y divide-dashed divide-neutral-300 border border-dashed border-neutral-300 sm:grid-cols-2 md:grid-cols-3"
        >
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </AnimatedContainer>
      </div>
    </section>
  )
}

// faq

const FAQS = [
  {
    q: 'What does one square actually mean?',
    a: 'One square is one day of one habit. Rather than ticking a box, you pick how hard the day was — Light, Moderate, Hard or Intense — and the square darkens to match. A year of squares ends up showing not just whether you showed up, but how much you put in.',
  },
  {
    q: 'How many habits can I track?',
    a: 'Up to five. That cap is deliberate: five is enough to cover the things you actually care about and few enough that the grid stays readable. You can also mark habits as “core”, and only those count toward whether a day is complete.',
  },
  {
    q: 'How does the GitHub sync work?',
    a: 'Connect GitHub from Settings and your commit history fills in a habit named “coding”, once a night. More commits on a day means a darker square. It only ever writes to that one habit, so nothing you have logged by hand elsewhere is touched.',
  },
  {
    q: 'Do I need a GitHub account to use HeatTrack?',
    a: 'No. An email address and password is all you need, and everything except the commit sync works exactly the same. GitHub is there for people who want their coding days filled in automatically instead of logged by hand.',
  },
  {
    q: 'What keeps a streak alive?',
    a: 'Logging any effort on a day keeps it going, and skipping a day ends it. Both your current streak and your longest streak are tracked separately, so a bad week costs you the current run but never erases your best one. Milestones land at 7, 30, 60, 100 and 365 days.',
  },
  {
    q: 'What are shared goals?',
    a: 'Pick a habit, pair it with a friend, and you both work the same goal for the year. The comparison view puts your two grids side by side so you can see how the other person is doing without either of you having to ask.',
  },
  {
    q: 'Who can see my grid?',
    a: 'Nothing is public. Friends you have accepted can see your habits and streaks, which is the point of comparing — so only accept people you actually want watching. The share image is a file you export yourself and post wherever you choose.',
  },
]

const FaqRow = ({
  item,
  index,
  open,
  onToggle,
}: {
  item: { q: string; a: string }
  index: number
  open: boolean
  onToggle: () => void
}) => (
  <div className="border-b border-slate-200 last:border-b-0">
    <h3>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`faq-answer-${index}`}
        id={`faq-question-${index}`}
        className="flex w-full items-center justify-between gap-5 px-6 py-5 text-left transition-colors hover:bg-neutral-50 sm:px-7"
      >
        <span className="text-[16px] font-semibold tracking-[-0.01em] text-black sm:text-[17px]">
          {item.q}
        </span>
        <ChevronDown
          aria-hidden
          className={`h-4.5 w-4.5 shrink-0 text-black/40 transition-transform duration-300 motion-reduce:transition-none ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
    </h3>

    {/* 0fr -> 1fr animates to the answer's natural height without measuring it */}
    <div
      id={`faq-answer-${index}`}
      role="region"
      aria-labelledby={`faq-question-${index}`}
      className="grid transition-all duration-300 ease-out motion-reduce:transition-none"
      style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
    >
      <div className="overflow-hidden">
        <p className="px-6 pb-5 pr-12 text-[14.5px] leading-relaxed text-black/60 sm:px-7 sm:pr-16">
          {item.a}
        </p>
      </div>
    </div>
  </div>
)

const Faq = () => {
  const { ref, shown } = useReveal<HTMLElement>()
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section id="faq" ref={ref} className="relative px-4 py-16 sm:px-6 md:py-28">
      <div className="mx-auto w-full max-w-3xl">
        <h2
          className="text-center font-Hero text-[38px] leading-[1.1] tracking-[-0.01em] text-black sm:text-[52px]"
          style={{
            opacity: shown ? 1 : 0,
            transform: shown ? 'none' : 'translateY(16px)',
            transition: 'opacity 600ms ease, transform 600ms ease',
          }}
        >
          Questions, answered
        </h2>

        <p
          className="mx-auto mt-4 max-w-xl text-center text-[16px] leading-relaxed text-black/60 sm:text-[17px]"
          style={{
            opacity: shown ? 1 : 0,
            transform: shown ? 'none' : 'translateY(16px)',
            transition: 'opacity 600ms ease 100ms, transform 600ms ease 100ms',
          }}
        >
          The things people ask before they start tracking.
        </p>

        <div
          className="mt-12 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-16px_rgba(15,23,42,0.16)] sm:mt-14"
          style={{
            opacity: shown ? 1 : 0,
            transform: shown ? 'none' : 'translateY(24px)',
            transition: 'opacity 600ms ease 200ms, transform 600ms ease 200ms',
          }}
        >
          {FAQS.map((item, i) => (
            <FaqRow
              key={item.q}
              item={item}
              index={i}
              open={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>

        <p
          className="mt-8 text-center text-[14.5px] text-black/50"
          style={{
            opacity: shown ? 1 : 0,
            transition: 'opacity 600ms ease 400ms',
          }}
        >
          Still curious?{' '}
          <Link
            to="/register"
            className="font-medium text-black/75 underline underline-offset-4 transition-colors hover:text-black"
          >
            Make an account
          </Link>{' '}
          — the grid explains itself pretty quickly.
        </p>
      </div>
    </section>
  )
}

// footer

const FOOTER_COLUMNS = [
  {
    heading: 'Product',
    links: [
      { label: 'How it works', to: '#how-it-works', internal: false },
      { label: 'Features', to: '#features', internal: false },
      { label: 'FAQ', to: '#faq', internal: false },
    ],
  },
  {
    heading: 'App',
    links: [
      { label: 'Dashboard', to: '/dashboard', internal: true },
      { label: 'Friends', to: '/friends', internal: true },
      { label: 'Settings', to: '/settings', internal: true },
    ],
  },
  {
    heading: 'Account',
    links: [
      { label: 'Create account', to: '/register', internal: true },
      { label: 'Sign in', to: '/login', internal: true },
    ],
  },
]

const Footer = () => {
  const { ref, shown } = useReveal<HTMLElement>()

  return (
    <footer ref={ref} className="relative mt-3 px-4 pt-16 sm:px-6 sm:pt-20">

      {/* white card */}
      <div
        className="relative mx-auto w-full max-w-6xl rounded-[28px] bg-white px-7 py-12 shadow-[0_2px_8px_rgba(15,23,42,0.05),0_30px_60px_-30px_rgba(15,23,42,0.35)] sm:px-12 sm:py-14"
        style={{
          opacity: shown ? 1 : 0,
          transform: shown ? 'none' : 'translateY(24px)',
          transition: 'opacity 600ms ease, transform 600ms ease',
        }}
      >
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.1fr_repeat(3,1fr)] lg:gap-8">

          <div>
            <Link to="/" className="inline-flex items-center gap-2.5">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-black">
                <Flame className="h-4 w-4 text-white" />
              </span>
              <span className="text-[20px] font-semibold tracking-[-0.02em] text-black">
                HeatTrack
              </span>
            </Link>
            <p className="mt-4 max-w-[15rem] text-[14px] leading-relaxed text-black/50">
              A year-long heatmap for the habits you care about.
            </p>
          </div>

          {FOOTER_COLUMNS.map((col, i) => (
            <div
              key={col.heading}
              style={{
                opacity: shown ? 1 : 0,
                transform: shown ? 'none' : 'translateY(16px)',
                transition: `opacity 500ms ease ${150 + i * 90}ms, transform 500ms ease ${150 + i * 90}ms`,
              }}
            >
              <p className="text-[15.5px] font-semibold tracking-[-0.01em] text-black">
                {col.heading}
              </p>
              <ul className="mt-3.5 flex flex-col gap-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.internal ? (
                      <Link
                        to={l.to}
                        className="text-[15px] text-black/45 transition-colors hover:text-black"
                      >
                        {l.label}
                      </Link>
                    ) : (
                      <a
                        href={l.to}
                        className="text-[15px] text-black/45 transition-colors hover:text-black"
                      >
                        {l.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/*giant wordmark */}
      <div className="relative mx-auto w-full max-w-6xl pt-20">
        <h2
          aria-hidden="true"
          className="select-none bg-gradient-to-b from-slate-900 via-slate-700 to-slate-400 bg-clip-text text-center font-bold leading-[0.78] tracking-[-0.05em] text-transparent"
          style={{
            fontSize: 'clamp(3.5rem, 19vw, 16rem)',
            opacity: shown ? 0.55 : 0,
            transform: shown ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity 900ms ease 200ms, transform 900ms ease 200ms',
            // the fog: the wordmark dissolves toward its own baseline
            WebkitMaskImage:
              'linear-gradient(to bottom, #000 0%, #000 42%, rgba(0,0,0,0.35) 82%, transparent 100%)',
            maskImage:
              'linear-gradient(to bottom, #000 0%, #000 42%, rgba(0,0,0,0.35) 82%, transparent 100%)',
          }}
        >
          HeatTrack
        </h2>
      </div>

      {/* bottom bar */}
      <div className="relative flex flex-wrap items-center justify-center gap-x-2 gap-y-1 pb-8 text-center">
        <p className="text-[13.5px] text-black/45">
          © {new Date().getFullYear()} HeatTrack
        </p>
        <span aria-hidden className="text-black/25">·</span>
        <p className="text-[13.5px] text-black/45">
          Built by {' '}
          <a
            href="https://x.com/NishaM2522"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-black/70 hover:text-black hover:underline"
          >
            Nisha M
          </a>
        </p>
      </div>
    </footer>
  )
}


export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="relative min-h-screen bg-white p-3">
      <PageBackdrop />

      <div className="relative z-10 flex min-h-[calc(100vh-1.5rem)] flex-col">
  
        {/* ------------------------------------------------------- nav */}
        <header className="relative z-20 px-6 pt-6 sm:px-10 sm:pt-8">
          <nav className="flex items-center justify-between gap-6">
            <Link to="/" className="text-xl font-semibold tracking-tight text-black sm:text-[22px]">
              HeatTrack
            </Link>

            <div className="hidden items-center gap-3 md:flex bg-white px-3 py-2 rounded-3xl">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="text-[15px] text-black/85 font-semibold hover:bg-neutral-100 px-2 py-1 rounded-2xl"
                >
                  {l.label}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="hidden rounded-lg border border-black/60 px-5 py-2 text-[14.5px] font-medium bg-black text-white transition hover:-translate-y-0.5 sm:block"
              >
                Sign in
              </Link>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={menuOpen}
                className="rounded-lg p-2 text-white transition-colors hover:bg-white/15 md:hidden"
              >
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </nav>

          {menuOpen && (
            <div className="mt-4 flex flex-col gap-1 rounded-xl bg-white/15 p-3 backdrop-blur-sm md:hidden">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-2 text-[15px] text-white transition-colors hover:bg-white/15"
                >
                  {l.label}
                </a>
              ))}
              <Link
                to="/login"
                className="rounded-lg px-3 py-2 text-[15px] font-medium text-white transition-colors hover:bg-white/15 sm:hidden"
              >
                Sign in
              </Link>
            </div>
          )}
        </header>

        {/* hero */}
        <main className="relative z-10 flex flex-1 items-center px-6 py-14 sm:px-10 sm:py-16 text-black">
          <div className="grid w-full items-center gap-12 lg:grid-cols-2 lg:gap-16">

            {/* left — headline + CTA */}
            <div>
              <h1
                className="text-[42px] font-semibold leading-[1.06] tracking-[-0.01em] font-Hero sm:text-[56px] lg:text-[64px] xl:text-6xl"
              >
                Turn daily effort
                <br />
                into lasting
                <br />
                change.
              </h1>

              <p className="mt-7 max-w-md text-[16px] leading-relaxed text-black/85 sm:text-[17px]">
                Track your habits, keep the streak alive, and watch a blank grid
                become a record of the work you actually did.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Link
                  to="/register"
                  className="group inline-flex items-center gap-2 rounded-lg bg-black px-6 py-3 text-[15.5px] font-semibold text-white shadow-[0_10px_30px_-10px_rgba(15,23,42,0.55)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_34px_-10px_rgba(15,23,42,0.6)]"
                >
                  Get started
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  to="/login"
                  className="text-[15px] font-medium text-black/90 underline underline-offset-4 transition-colors hover:text-white"
                >
                  I already have an account
                </Link>
              </div>
            </div>

            {/* right */}
            <div className="relative">
              <div className="flex min-h-[340px] flex-col justify-between rounded-2xl border border-white/50 bg-/95 p-5 shadow-[0_30px_70px_-30px_rgba(15,23,42,0.55)] backdrop-blur-sm sm:min-h-[400px] sm:p-7">
                
              </div>
            </div>
          </div>
        </main>
      </div>

      <div className="relative z-10">
        <HowItWorks />
        <Features />
        <Faq />
        <Footer />
      </div>
    </div>
  )
}
