import type { SocialProvider } from '@/lib/authProviders'

export const GitHubMark = ({ className = 'size-3.5' }: { className?: string }) => (
  <svg viewBox="0 0 16 16" className={className} fill="currentColor" aria-hidden="true">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
  </svg>
)

export const GoogleMark = ({ className = 'size-3.5' }: { className?: string }) => (
  <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.05 6.05 29.27 4 24 4 12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20c0-1.34-.14-2.65-.4-3.5Z" />
    <path fill="#FF3D00" d="m6.31 14.69 6.57 4.82C14.66 15.1 18.96 12 24 12c3.06 0 5.84 1.15 7.96 3.04l5.66-5.66C34.05 6.05 29.27 4 24 4 16.32 4 9.66 8.34 6.31 14.69Z" />
    <path fill="#4CAF50" d="M24 44c5.17 0 9.86-1.98 13.41-5.19l-6.19-5.24A11.9 11.9 0 0 1 24 36c-5.18 0-9.66-3.28-11.29-7.92l-6.52 5.02C9.5 39.56 16.23 44 24 44Z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3a12.1 12.1 0 0 1-4.09 5.57l6.19 5.24C36.97 40.2 44 35 44 24c0-1.34-.14-2.65-.4-3.5Z" />
  </svg>
)

const META: Record<SocialProvider, { label: string; Mark: typeof GitHubMark }> = {
  google: { label: 'Continue with Google', Mark: GoogleMark },
  github: { label: 'Continue with GitHub', Mark: GitHubMark },
}

const SocialAuthButtons = ({
  providers,
  onSelect,
  disabled,
}: {
  providers: SocialProvider[] | null
  onSelect: (p: SocialProvider) => void
  disabled?: boolean
}) => {
  if (providers === null) return <div className="h-9" aria-hidden />
  if (providers.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      {providers.map((p) => {
        const { label, Mark } = META[p]
        return (
          <button
            key={p}
            type="button"
            onClick={() => onSelect(p)}
            disabled={disabled}
            className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-neutral-200 bg-white text-sm font-medium text-neutral-900 shadow-sm transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Mark />
            {label}
          </button>
        )
      })}
    </div>
  )
}

export default SocialAuthButtons
