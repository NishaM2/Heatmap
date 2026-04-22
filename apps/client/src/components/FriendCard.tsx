import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Flame } from 'lucide-react'
import type { Friend } from '@/types'

interface FriendCardProps {
  friend: Friend
  onUnfriend?: (friendshipId: string) => void
}

const FriendCard = ({ friend, onUnfriend }: FriendCardProps) => {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={friend.user?.image || ''} />
          <AvatarFallback>
            {friend.user?.name?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium text-sm">{friend.user?.name}</p>
          <p className="text-xs text-muted-foreground">{friend.user?.email}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <Flame className="h-3 w-3 text-orange-500" />
            <span className="text-xs text-muted-foreground">
              {friend.currentStreak} day streak
            </span>
          </div>
        </div>
      </div>
      {onUnfriend && (
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => onUnfriend(friend.friendshipId)}
        >
          Unfriend
        </Button>
      )}
    </div>
  )
}

export default FriendCard