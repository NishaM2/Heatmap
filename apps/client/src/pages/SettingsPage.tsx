import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { AlertCircle, Check, GitBranch, Lock, Pencil, Plus, Star, Trash2, X } from 'lucide-react'

import { useAuth } from '@/hooks/useAuth'
import { authClient } from '@/lib/authClient'
import { useCategories, useDeleteCategory, useUpdateCategory } from '@/hooks/useCategories'
import { accountApi, githubApi, logApi } from '@/services/api'
import type { Category } from '@/types'

import PageBackdrop from '@/components/PageBackdrop'
import AppNavbar from '@/components/AppNavbar'
import CreateCategoryModal from '@/components/CreateCategoryModal'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { useConfirm } from '@/hooks/useConfirm'


const MAX_CATEGORIES = 5

const Section = ({
  title,
  description,
  action,
  children,
}: {
  title: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
}) => (
  <section className="mt-8">
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-neutral-900 pb-3">
      <div>
        <h2 className="font-Hero text-[24px] leading-none tracking-tight">{title}</h2>
        {description && <p className="mt-2 text-sm text-neutral-500">{description}</p>}
      </div>
      {action}
    </div>
    {children}
  </section>
)

const Stat = ({ label, value }: { label: string; value: string | number }) => (
  <div>
    <p className="text-[11px] uppercase tracking-wider text-neutral-500">{label}</p>
    <p className="mt-1.5 font-Hero text-[24px] leading-none tabular-nums">{value}</p>
  </div>
)

// category 

const CategoryRow = ({ category }: { category: Category }) => {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(category.name)
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()
  const { confirm, dialog } = useConfirm()

  const save = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      toast.error('A habit needs a name')
      return
    }
    updateCategory.mutate({ id: category.id, data: { name: trimmed } })
    setEditing(false)
  }

  return (
    <div className="border-b border-neutral-200 py-4 last:border-b-0">
      <div className="flex flex-wrap items-center gap-3">
        <span
          className="size-3 shrink-0 rounded-full"
          style={{ backgroundColor: category.color }}
        />

        {editing ? (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') save()
              if (e.key === 'Escape') { setName(category.name); setEditing(false) }
            }}
            maxLength={30}
            autoFocus
            aria-label={`Rename ${category.name}`}
            className="h-8 min-w-0 flex-1 rounded-md border border-neutral-200 bg-white px-2.5 text-sm outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
          />
        ) : (
          <p className="min-w-0 flex-1 truncate text-[15px] font-medium">{category.name}</p>
        )}

        <button
          type="button"
          onClick={() => updateCategory.mutate({ id: category.id, data: { isCore: !category.isCore } })}
          title={category.isCore ? 'Counts toward your daily target' : 'Not counted toward your daily target'}
          className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors ${
            category.isCore
              ? 'border-neutral-900 bg-neutral-900 text-white'
              : 'border-neutral-200 text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          <Star className={`size-3.5 ${category.isCore ? 'fill-white' : ''}`} />
          Core
        </button>

        {editing ? (
          <div className="flex shrink-0 gap-1.5">
            <button
              type="button"
              onClick={save}
              aria-label="Save name"
              className="inline-flex size-8 items-center justify-center rounded-md bg-neutral-900 text-white transition-colors hover:bg-neutral-800"
            >
              <Check className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => { setName(category.name); setEditing(false) }}
              aria-label="Cancel"
              className="inline-flex size-8 items-center justify-center rounded-md border border-neutral-200 text-neutral-500 transition-colors hover:bg-neutral-100"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex shrink-0 gap-1.5">
            <button
              type="button"
              onClick={() => setEditing(true)}
              aria-label={`Rename ${category.name}`}
              className="inline-flex size-8 items-center justify-center rounded-md border border-neutral-200 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
            >
              <Pencil className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={async () => {
                const ok = await confirm({
                  title: `Delete “${category.name}”?`,
                  description: 'Every day you logged for this habit will be deleted too. This cannot be undone.',
                  confirmLabel: 'Delete habit',
                  destructive: true,
                })
                if (ok) deleteCategory.mutate(category.id)
              }}
              disabled={deleteCategory.isPending}
              aria-label={`Delete ${category.name}`}
              className="inline-flex size-8 items-center justify-center rounded-md border border-neutral-200 text-neutral-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        )}
      </div>

      {dialog}
    </div>
  )
}

// github 

const githubLinkError = (code: string, email?: string | null): string => {
  switch (code) {
    case 'email_does_not_match':
      return `That GitHub account's primary email is different from ${
        email ?? 'your account email'
      }. Either connect the GitHub account that uses ${
        email ?? 'that address'
      }, or add it as your primary email in GitHub → Settings → Emails and try again.`
    case 'account_already_linked_to_different_user':
      return 'That GitHub account is already connected to a different Loop In account. Disconnect it there first, or use another GitHub account.'
    case 'unable_to_link_account':
      return 'GitHub would not link to your account. Sign out, sign back in, and try once more.'
    default:
      return `GitHub could not be connected (${code}).`
  }
}

// password 

const MIN_PASSWORD = 8

const PROVIDER_LABELS: Record<string, string> = { github: 'GitHub', google: 'Google' }


// Signing up through GitHub never creates a password, which leaves those users
// unable to disconnect GitHub — it is their only way back in. This is where they add one.

const PasswordSection = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')

  const { data: status, isLoading } = useQuery({
    queryKey: ['account', 'status'],
    queryFn: accountApi.status,
  })

  const savePassword = useMutation({
    mutationFn: () => accountApi.setPassword(password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account', 'status'] })
      setPassword('')
      setConfirmation('')
      toast.success('Password set — you can now sign in with your email')
    },
    onError: (err: Error) => toast.error(err.message || 'Could not set your password'),
  })

  const providerLabel = status?.providers?.length
    ? status.providers.map((id) => PROVIDER_LABELS[id] ?? id).join(' and ')
    : 'a connected provider'

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (password.length < MIN_PASSWORD) {
      toast.error(`Password must be at least ${MIN_PASSWORD} characters`)
      return
    }
    if (password !== confirmation) {
      toast.error('Both passwords must match')
      return
    }
    savePassword.mutate()
  }

  return (
    <Section
      title="Password"
      description="A second way into your account, alongside any connected provider."
    >
      {isLoading ? (
        <div className="h-14 animate-pulse rounded-lg bg-neutral-100 my-5" />
      ) : status?.hasPassword ? (
        <div className="flex flex-wrap items-center gap-4 py-5">
          <span className="grid size-10 shrink-0 place-items-center rounded-md bg-neutral-900">
            <Lock className="size-5 text-white" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-medium">Password set</p>
            <p className="truncate text-sm text-neutral-500">
              You can sign in with {user?.email} and your password.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="py-5">
          <div className="flex flex-wrap items-center gap-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-md border border-neutral-200">
              <Lock className="size-5 text-neutral-500" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-medium">No password yet</p>
              <p className="text-sm text-neutral-500">
                You signed up with {providerLabel}. Add a password so it is not your
                only way in — you need one before you can disconnect it.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="new-password" className="text-[11px] uppercase tracking-wider text-neutral-500">
                New password
              </label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={MIN_PASSWORD}
                required
                className="mt-1.5 h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="text-[11px] uppercase tracking-wider text-neutral-500">
                Confirm password
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                minLength={MIN_PASSWORD}
                required
                className="mt-1.5 h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
              />
            </div>
          </div>

          <p className="mt-2 text-sm text-neutral-500">
            At least {MIN_PASSWORD} characters.
          </p>

          <button
            type="submit"
            disabled={savePassword.isPending}
            className="mt-4 inline-flex h-9 items-center rounded-md bg-neutral-900 px-4 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-60"
          >
            {savePassword.isPending ? 'Saving…' : 'Set password'}
          </button>
        </form>
      )}
    </Section>
  )
}

// page 

const SettingsPage = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)

  const { data: categoriesData = [], isLoading } = useCategories()
  const categories = categoriesData as Category[]

  const { data: githubStatus } = useQuery({
    queryKey: ['github', 'status'],
    queryFn: githubApi.status,
  })
  const isGithubConnected = githubStatus?.connected === true

  const disconnectGithub = useMutation({
    mutationFn: githubApi.disconnect,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['github', 'status'] })
      queryClient.invalidateQueries({ queryKey: ['account', 'status'] })
      toast.success('GitHub disconnected')
    },
    
    onError: (err: Error) => toast.error(err.message || 'Could not disconnect GitHub'),
  })

  const connectGithub = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.linkSocial({
        provider: 'github',
        callbackURL: `${window.location.origin}/settings?linked=github`,
        errorCallbackURL: `${window.location.origin}/settings`,
        scopes: ['read:user', 'user:email'],
      })
     
      if (error) throw new Error(error.message ?? 'Could not start GitHub linking')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const [searchParams, setSearchParams] = useSearchParams()
  const [linkError, setLinkError] = useState<string | null>(null)

  // Read the outcome Better Auth redirected back with, then strip it from the
  // URL so a refresh does not replay it.
  useEffect(() => {
    const failed = searchParams.get('error')
    const linked = searchParams.get('linked')
    if (!failed && !linked) return

    if (failed) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLinkError(githubLinkError(failed, user?.email))
    } else {
      setLinkError(null)
      queryClient.invalidateQueries({ queryKey: ['github', 'status'] })
      queryClient.invalidateQueries({ queryKey: ['account', 'status'] })
      toast.success('GitHub connected')
    }

    const next = new URLSearchParams(searchParams)
    next.delete('error')
    next.delete('error_description')
    next.delete('linked')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams, queryClient, user?.email])


  const deleteAllLogs = useMutation({
    mutationFn: () => logApi.deleteAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      toast.success('All logs deleted')
    },
    onError: () => toast.error('Could not delete your logs'),
  })

  const { confirm, dialog } = useConfirm()

  const coreCount = categories.filter((c) => c.isCore).length
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : '—'

  return (
    <div className="relative min-h-screen bg-white p-3 font-sans text-neutral-900 antialiased">
      <PageBackdrop />

      <div className="relative z-10 mx-auto w-full max-w-3xl px-3 pb-16 sm:px-5">
        <AppNavbar active="settings" />

        <h1 className="font-Hero text-[34px] leading-none tracking-tight sm:text-[40px]">
          Settings
        </h1>

        {/* account */}
        <Section title="Account">
          <div className="flex flex-wrap items-center gap-4 py-5">
            <Avatar className="size-14">
              <AvatarImage src={user?.image || ''} alt={user?.name} />
              <AvatarFallback className="text-lg">
                {user?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[17px] font-medium">{user?.name}</p>
              <p className="truncate text-sm text-neutral-500">{user?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 border-t border-neutral-200 py-5">
            <Stat label="Habits" value={`${categories.length}/${MAX_CATEGORIES}`} />
            <Stat label="Core habits" value={coreCount} />
            <Stat label="Member since" value={memberSince} />
          </div>
        </Section>

        <PasswordSection />

        {/* github */}
        <Section
          title="GitHub"
          description="Sync your commits into a habit named “coding”, every night."
        >
          {linkError && (
            <div className="mt-5 flex gap-3 rounded-lg border border-amber-200 bg-amber-50/60 p-4">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600" />
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium text-amber-900">
                  Couldn't connect GitHub
                </p>
                <p className="mt-1 text-sm text-amber-800/80">{linkError}</p>
              </div>
              <button
                type="button"
                onClick={() => setLinkError(null)}
                aria-label="Dismiss"
                className="shrink-0 text-amber-600 transition-colors hover:text-amber-900"
              >
                <X className="size-4" />
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4 py-5">
            <span className="grid size-10 shrink-0 place-items-center rounded-md bg-neutral-900">
              <GitBranch className="size-5 text-white" />
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-medium">
                {isGithubConnected ? 'Connected' : 'Not connected'}
              </p>
              <p className="truncate text-sm text-neutral-500">
                {isGithubConnected
                  ? `Account ${githubStatus?.accountId}`
                  : 'Connect to fill in your coding grid automatically'}
              </p>
            </div>

            {isGithubConnected ? (
              <button
                type="button"
                onClick={async () => {
                  const ok = await confirm({
                    title: 'Disconnect GitHub?',
                    description: 'Your commits will stop syncing. Logs already created stay put, and you can reconnect any time.',
                    confirmLabel: 'Disconnect',
                  })
                  if (ok) disconnectGithub.mutate()
                }}
                disabled={disconnectGithub.isPending}
                className="inline-flex h-9 shrink-0 items-center rounded-md border border-neutral-200 px-4 text-sm font-medium transition-colors hover:bg-neutral-100 disabled:opacity-60"
              >
                {disconnectGithub.isPending ? 'Disconnecting…' : 'Disconnect'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => connectGithub.mutate()}
                disabled={connectGithub.isPending}
                className="inline-flex h-9 shrink-0 items-center rounded-md bg-neutral-900 px-4 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-60"
              >
                {connectGithub.isPending ? 'Connecting…' : 'Connect GitHub'}
              </button>
            )}
          </div>
        </Section>

        {/* categories */}
        <Section
          title="Habits"
          description="Rename them, or mark which ones count toward your day."
          action={
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              disabled={categories.length >= MAX_CATEGORIES}
              title={categories.length >= MAX_CATEGORIES ? `You can track up to ${MAX_CATEGORIES} habits` : undefined}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-neutral-900 px-4 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
            >
              <Plus className="size-3.5" />
              Add habit
            </button>
          }
        >
          {isLoading ? (
            <div className="flex flex-col gap-3 py-5">
              {[0, 1].map((i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-neutral-100" />)}
            </div>
          ) : categories.length === 0 ? (
            <p className="py-6 text-sm text-neutral-500">
              No habits yet — add one to start filling in your grid.
            </p>
          ) : (
            categories.map((c) => <CategoryRow key={c.id} category={c} />)
          )}
        </Section>

        {/* danger zone */}
        <section className="mt-10 rounded-xl border border-red-200 bg-red-50/40 p-5 sm:p-6">
          <h2 className="font-Hero text-[22px] leading-none tracking-tight text-red-700">
            Danger zone
          </h2>
          <p className="mt-2 text-sm text-red-700/70">
            These actions are permanent and cannot be undone.
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-red-200 pt-5">
            <div className="min-w-0">
              <p className="text-[15px] font-medium text-red-800">Delete all logs</p>
              <p className="text-sm text-red-700/70">
                Clears every day you have logged. Your habits stay.
              </p>
            </div>
            <button
              type="button"
              onClick={async () => {
                const ok = await confirm({
                  title: 'Delete all logs?',
                  description: 'Every day you have ever recorded will be erased across all habits. Your habits stay. This cannot be undone.',
                  confirmLabel: 'Delete everything',
                  destructive: true,
                })
                if (ok) deleteAllLogs.mutate()
              }}
              disabled={deleteAllLogs.isPending}
              className="inline-flex h-9 shrink-0 items-center rounded-md bg-red-600 px-4 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60"
            >
              {deleteAllLogs.isPending ? 'Deleting…' : 'Delete all logs'}
            </button>
          </div>
        </section>
      </div>

      {dialog}
      <CreateCategoryModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}

export default SettingsPage
