import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Search, UserPlus, Users, X } from 'lucide-react'
import { useDebounce } from '@/hooks/useDebounce'
import { useAuth } from '@/hooks/useAuth'
import {
  useFriends,
  useFriendRequests,
  useSearchUsers,
  useSendFriendRequest,
  useAcceptFriendRequest,
  useDeclineFriendRequest,
  useUnfriend,
  useSharedGoals,
  useAcceptSharedGoal,
  useDeclineSharedGoal,
} from '@/hooks/useFriends'
import type { Friend, FriendRequest, SearchUser, SharedGoal } from '@/types'
import PageBackdrop from '@/components/PageBackdrop'
import AppNavbar from '@/components/AppNavbar'
import AcceptGoalModal from '@/components/AcceptGoalModal'
import SharedGoalModal from '@/components/SharedGoalModal'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { useConfirm } from '@/hooks/useConfirm'


const SectionHead = ({
  title,
  action,
}: {
  title: string
  action?: React.ReactNode
}) => (
  <div className="mt-10 flex items-end justify-between gap-4 border-b border-neutral-900 pb-3">
    <h2 className="font-Hero text-[24px] leading-none tracking-tight">{title}</h2>
    {action}
  </div>
)

// Visualises a friend's current streak. 
const StreakBar = ({ streak }: { streak: number }) => {
  const cells = 24
  const filled = Math.min(streak, cells)
  return (
    <div className="flex gap-0.75" title={`${streak} day streak`}>
      {Array.from({ length: cells }, (_, i) => (
        <span
          key={i}
          className="h-2.5 w-2.5 rounded-xs"
          style={{
            backgroundColor:
              i < filled ? (i > cells - 6 ? '#0f172a' : i > cells - 12 ? '#475569' : '#94a3b8') : '#e2e8f0',
          }}
        />
      ))}
    </div>
  )
}

const RowShell = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-neutral-200 py-4 last:border-b-0">
    {children}
  </div>
)

// Page 

const FriendsPage = () => {
  const [input, setInput] = useState('')
  const [forced, setForced] = useState<string | null>(null)
  const [showAllRequests, setShowAllRequests] = useState(false)
  const [goalFor, setGoalFor] = useState<{ id: string; name: string } | null>(null)
  const [acceptingGoalId, setAcceptingGoalId] = useState<string | null>(null)
  // Which users we've sent a request to in this session, so the row can confirm it.
  const [sentTo, setSentTo] = useState<Set<string>>(new Set())

  const navigate = useNavigate()
  const { user } = useAuth()
  const debounced = useDebounce(input, 300)
  // The Search button skips the debounce rather than waiting it out.
  const query = forced ?? debounced

  const { data: resultsData = [], isLoading: searching } = useSearchUsers(query)
  const results = resultsData as SearchUser[]
  const { data: requestsData = [] } = useFriendRequests()
  const requests = requestsData as FriendRequest[]
  const { data: friendsData = [], isLoading: loadingFriends } = useFriends()
  const friends = friendsData as Friend[]
  const { data: goalsData = [] } = useSharedGoals()
  const goals = goalsData as SharedGoal[]

  const sendRequest = useSendFriendRequest()
  const acceptRequest = useAcceptFriendRequest()
  const declineRequest = useDeclineFriendRequest()
  const unfriend = useUnfriend()
  const acceptGoal = useAcceptSharedGoal()
  const declineGoal = useDeclineSharedGoal()
  const { confirm, dialog } = useConfirm()

  const visibleRequests = showAllRequests ? requests : requests.slice(0, 3)

  return (
    <div className="relative min-h-screen bg-white p-3 font-sans text-neutral-900 antialiased">
      <PageBackdrop />

      <div className="relative z-10 mx-auto w-full max-w-4xl px-3 pb-16 sm:px-5">
        <AppNavbar active="friends" />

        <h1 className="font-Hero text-[34px] leading-none tracking-tight sm:text-[40px]">Friends</h1>

        {/* search */}
        <form
          onSubmit={(e) => { e.preventDefault(); setForced(input) }}
          className="mt-6 flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="search"
              value={input}
              onChange={(e) => { setInput(e.target.value); setForced(null) }}
              placeholder="Search people by name"
              aria-label="Search people by name"
              className="h-10 w-full rounded-md border border-neutral-200 bg-white pl-9 pr-3 text-sm shadow-sm outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
            />
          </div>
          <button
            type="submit"
            className="h-10 shrink-0 rounded-md bg-neutral-900 px-5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-neutral-800"
          >
            Search
          </button>
        </form>

        {query.length > 2 && (
          <div className="mt-3 rounded-xl border border-neutral-200 bg-white p-2 shadow-sm">
            {searching ? (
              <p className="px-3 py-4 text-sm text-neutral-500">Searching…</p>
            ) : results.length === 0 ? (
              <p className="px-3 py-4 text-sm text-neutral-500">No one found for “{query}”.</p>
            ) : (
              results.map((u) => (
                <div key={u.id} className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-neutral-50">
                  <Avatar className="size-8">
                    <AvatarImage src={u.image || ''} alt={u.name} />
                    <AvatarFallback className="text-xs">{u.name?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <p className="min-w-0 flex-1 truncate text-sm font-medium">{u.name}</p>
                  {sentTo.has(u.id) ? (
                    <span className="inline-flex h-8 items-center gap-1.5 rounded-md bg-neutral-100 px-3 text-xs font-medium text-neutral-600">
                      <Check className="size-3.5" />
                      Request sent
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        sendRequest.mutate(u.id, {
                          onSuccess: () => {
                            setSentTo((prev) => new Set(prev).add(u.id))
                            toast.success(`Friend request sent to ${u.name}`)
                          },
                          onError: (err: unknown) =>
                            toast.error(
                              err instanceof Error ? err.message : 'Could not send that request'
                            ),
                        })
                      }
                      disabled={sendRequest.isPending}
                      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-neutral-200 px-3 text-xs font-medium transition-colors hover:bg-neutral-100 disabled:opacity-60"
                    >
                      <UserPlus className="size-3.5" />
                      Add
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* friend requests */}
        <SectionHead
          title="Friend requests"
          action={
            requests.length > 3 ? (
              <button
                type="button"
                onClick={() => setShowAllRequests((v) => !v)}
                className="text-xs uppercase tracking-wider text-neutral-500 underline underline-offset-4 transition-colors hover:text-neutral-900"
              >
                {showAllRequests ? 'Show less' : `View all (${requests.length})`}
              </button>
            ) : undefined
          }
        />

        {requests.length === 0 ? (
          <p className="py-6 text-sm text-neutral-500">No pending requests.</p>
        ) : (
          visibleRequests.map((r) => (
            <RowShell key={r.id}>
              <Avatar className="size-9">
                <AvatarImage src={r.requester?.image || ''} alt={r.requester?.name} />
                <AvatarFallback className="text-xs">
                  {r.requester?.name?.charAt(0).toUpperCase() ?? '?'}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium">{r.requester?.name ?? 'Someone'}</p>
                <p className="text-xs text-neutral-500">wants to be your friend</p>
              </div>

              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => acceptRequest.mutate(r.id)}
                  disabled={acceptRequest.isPending}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md bg-neutral-900 px-3 text-xs font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-60"
                >
                  <Check className="size-3.5" />
                  Accept
                </button>
                <button
                  type="button"
                  onClick={() => declineRequest.mutate(r.id)}
                  disabled={declineRequest.isPending}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md border border-neutral-200 px-3 text-xs font-medium transition-colors hover:bg-neutral-100 disabled:opacity-60"
                >
                  <X className="size-3.5" />
                  Decline
                </button>
              </div>
            </RowShell>
          ))
        )}

        {/* my friends */}
        <SectionHead title="My friends" />

        {loadingFriends ? (
          <div className="flex flex-col gap-3 py-4">
            {[0, 1].map((i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-neutral-100" />)}
          </div>
        ) : friends.length === 0 ? (
          <p className="py-6 text-sm text-neutral-500">
            No friends yet — search above to send your first request.
          </p>
        ) : (
          friends.map((f) => (
            <RowShell key={f.friendshipId}>
              <Avatar className="size-9">
                <AvatarImage src={f.user?.image || ''} alt={f.user?.name} />
                <AvatarFallback className="text-xs">
                  {f.user?.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <p className="w-28 shrink-0 truncate text-[15px] font-medium">{f.user?.name}</p>

              <div className="hidden flex-1 sm:block">
                <StreakBar streak={f.currentStreak} />
              </div>

              <p className="shrink-0 font-Hero text-[20px] leading-none tabular-nums">
                {f.currentStreak}
                <span className="ml-1 font-sans text-[11px] text-neutral-500">days</span>
              </p>

              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => setGoalFor({ id: f.user.id, name: f.user.name })}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md border border-neutral-200 px-3 text-xs font-medium transition-colors hover:bg-neutral-100"
                >
                  <Users className="size-3.5" />
                  Track together
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await confirm({
                      title: `Remove ${f.user?.name}?`,
                      description: 'You will both stop seeing each other’s streaks. Any shared goals go with it.',
                      confirmLabel: 'Remove friend',
                      destructive: true,
                    })
                    if (ok) unfriend.mutate(f.friendshipId)
                  }}
                  disabled={unfriend.isPending}
                  aria-label={`Unfriend ${f.user?.name}`}
                  className="inline-flex size-8 items-center justify-center rounded-md border border-neutral-200 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-60"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </RowShell>
          ))
        )}

        {/* shared goals */}
        {goals.length > 0 && (
          <>
            <SectionHead title="Shared goals" />
            {goals.map((g) => {
              const isReceiver = g.receiverId === user?.id
              return (
                <RowShell key={g.id}>
                  <Avatar className="size-9">
                    <AvatarImage src={g.partner?.image || ''} alt={g.partner?.name} />
                    <AvatarFallback className="text-xs">
                      {g.partner?.name?.charAt(0).toUpperCase() ?? '?'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium">
                      {g.myCategory?.name ?? g.partnerCategory?.name ?? 'Shared goal'}
                      {g.partner && (
                        <span className="font-normal text-neutral-500"> with {g.partner.name}</span>
                      )}
                    </p>
                    <p className="truncate text-xs text-neutral-500">
                      {g.status === 'accepted' && g.myCategory && g.partnerCategory
                        ? `You: ${g.myCategory.name} · ${g.partner?.name ?? 'They'}: ${g.partnerCategory.name}`
                        : g.status === 'pending'
                          ? (g.isInitiator ? 'Waiting for them to accept' : 'Invited you — pick a habit to join')
                          : 'Declined'}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    {g.status === 'pending' && isReceiver && (
                      <>
                        <button
                          type="button"
                          onClick={() => setAcceptingGoalId(g.id)}
                          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-neutral-900 px-3 text-xs font-medium text-white transition-colors hover:bg-neutral-800"
                        >
                          <Check className="size-3.5" />
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => declineGoal.mutate(g.id)}
                          disabled={declineGoal.isPending}
                          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-neutral-200 px-3 text-xs font-medium transition-colors hover:bg-neutral-100 disabled:opacity-60"
                        >
                          <X className="size-3.5" />
                          Decline
                        </button>
                      </>
                    )}
                    {g.status === 'accepted' && (
                      <button
                        type="button"
                        onClick={() => navigate(`/comparison/${g.id}`)}
                        className="inline-flex h-8 items-center rounded-md border border-neutral-200 px-3 text-xs font-medium transition-colors hover:bg-neutral-100"
                      >
                        View comparison
                      </button>
                    )}
                  </div>
                </RowShell>
              )
            })}
          </>
        )}
      </div>

      {goalFor && (
        <SharedGoalModal
          open
          onClose={() => setGoalFor(null)}
          receiverId={goalFor.id}
          receiverName={goalFor.name}
        />
      )}

      {dialog}

      <AcceptGoalModal
        open={!!acceptingGoalId}
        onClose={() => setAcceptingGoalId(null)}
        isPending={acceptGoal.isPending}
        partnerName={goals.find((g) => g.id === acceptingGoalId)?.partner?.name}
        partnerCategoryName={goals.find((g) => g.id === acceptingGoalId)?.partnerCategory?.name}
        onAccept={(categoryId) => {
          if (!acceptingGoalId) return
          acceptGoal.mutate(
            { id: acceptingGoalId, receiverCategoryId: categoryId },
            { onSuccess: () => setAcceptingGoalId(null) }
          )
        }}
      />
    </div>
  )
}

export default FriendsPage
