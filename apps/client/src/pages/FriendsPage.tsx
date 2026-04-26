import { useState } from 'react'
import Navbar from '@/components/Navbar'
import FriendCard from '@/components/FriendCard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDebounce } from '@/hooks/useDebounce'
import {
  useFriends,
  useFriendRequests,
  useSearchUsers,
  useSendFriendRequest,
  useAcceptFriendRequest,
  useDeclineFriendRequest,
  useUnfriend,
} from '@/hooks/useFriends'
import { Search, UserPlus, Check, X } from 'lucide-react'
import type { Friend, FriendRequest, SearchUser, SharedGoal } from '@/types'
import { useNavigate } from 'react-router-dom'
import { useSharedGoals, useAcceptSharedGoal, useDeclineSharedGoal } from '@/hooks/useFriends'
import { useAuth } from '@/hooks/useAuth'
import AcceptGoalModal from '@/components/AcceptGoalModal'

// Search results component
const SearchResults = ({ username }: { username: string }) => {
  const { data: results = [], isLoading } = useSearchUsers(username)
  const sendRequest = useSendFriendRequest()

  if (username.length <= 2) return null

  if (isLoading) {
    return (
      <div className="space-y-2 mt-2">
        {[1, 2].map(i => (
          <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No users found for "{username}"
      </p>
    )
  }

  return (
    <div className="space-y-2 mt-2">
      {results.map((user: SearchUser) => (
        <div
          key={user.id}
          className="flex items-center justify-between p-3 rounded-lg border bg-card"
        >
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.image || ''} />
              <AvatarFallback>{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => sendRequest.mutate(user.id)}
            disabled={sendRequest.isPending}
          >
            <UserPlus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      ))}
    </div>
  )
}

// Friend requests component
const FriendRequests = () => {
  const { data: requests = [], isLoading } = useFriendRequests()
  const acceptRequest = useAcceptFriendRequest()
  const declineRequest = useDeclineFriendRequest()

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2].map(i => (
          <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-3">📭</div>
        <p className="text-muted-foreground text-sm">No pending requests</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {requests.map((request: FriendRequest) => (
        <div
          key={request.id}
          className="flex items-center justify-between p-4 rounded-lg border bg-card"
        >
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback>?</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">Friend Request</p>
              <p className="text-xs text-muted-foreground">
                From: {request.requesterId.slice(0, 8)}...
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => acceptRequest.mutate(request.id)}
              disabled={acceptRequest.isPending}
            >
              <Check className="h-4 w-4 mr-1" />
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => declineRequest.mutate(request.id)}
              disabled={declineRequest.isPending}
            >
              <X className="h-4 w-4 mr-1" />
              Decline
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}

// Friends list component
const FriendsList = () => {
  const { data: friends = [], isLoading } = useFriends()
  const unfriend = useUnfriend()

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (friends.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-3">👋</div>
        <p className="text-lg font-medium mb-1">No friends yet</p>
        <p className="text-muted-foreground text-sm">
          Search for users above to add friends
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {friends.map((friend: Friend) => (
        <FriendCard
          key={friend.friendshipId}
          friend={friend}
          onUnfriend={(id) => unfriend.mutate(id)}
        />
      ))}
    </div>
  )
}

// Shared goals
const SharedGoalsList = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [acceptingGoalId, setAcceptingGoalId] = useState<string | null>(null)

  const { data: goals = [], isLoading } = useSharedGoals()
  const acceptGoal = useAcceptSharedGoal()
  const declineGoal = useDeclineSharedGoal()

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2].map(i => (
          <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (goals.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-3">🎯</div>
        <p className="text-lg font-medium mb-1">No shared goals yet</p>
        <p className="text-muted-foreground text-sm">
          Click "Track Together" on a friend to start one
        </p>
      </div>
    )
  }

    return (
    <>
      <div className="space-y-2">
        {goals.map((goal: SharedGoal) => {
          const isReceiver = goal.receiverId === user?.id

          return (
            <div
              key={goal.id}
              className="flex items-center justify-between p-4 rounded-lg border bg-card"
            >
              <div>
                <p className="text-sm font-medium">
                  {goal.status === 'pending' ? '⏳ Pending invite' : '✅ Active goal'}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  Status: {goal.status}
                </p>
              </div>

              <div className="flex gap-2">
                {goal.status === 'pending' && isReceiver && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => setAcceptingGoalId(goal.id)} 
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => declineGoal.mutate(goal.id)}
                      disabled={declineGoal.isPending}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Decline
                    </Button>
                  </>
                )}
                {goal.status === 'accepted' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/comparison/${goal.id}`)}
                  >
                    View Comparison
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Accept modal */}
      <AcceptGoalModal
        open={!!acceptingGoalId}
        onClose={() => setAcceptingGoalId(null)}
        isPending={acceptGoal.isPending}
        onAccept={(categoryId) => {
          if (!acceptingGoalId) return
          acceptGoal.mutate(
            { id: acceptingGoalId, receiverCategoryId: categoryId },
            { onSuccess: () => setAcceptingGoalId(null) }
          )
        }}
      />
    </>
  )
}
  

// Main Friends Page
const FriendsPage = () => {
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 300)
  const { data: requests = [] } = useFriendRequests()

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Friends</h1>
          <p className="text-muted-foreground text-sm">
            Track goals together and stay accountable
          </p>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>

        {searchInput.length > 2 && (
          <div className="mb-6">
            <SearchResults username={debouncedSearch} />
          </div>
        )}

        <Tabs defaultValue="friends">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="friends" className="flex-1">Friends</TabsTrigger>
            <TabsTrigger value="requests" className="flex-1">
              Requests
              {requests.length > 0 && (
                <span className="ml-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {requests.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="goals" className="flex-1">Goals</TabsTrigger>
          </TabsList>

          <TabsContent value="friends"><FriendsList /></TabsContent>
          <TabsContent value="requests"><FriendRequests /></TabsContent>
          <TabsContent value="goals"><SharedGoalsList /></TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

export default FriendsPage