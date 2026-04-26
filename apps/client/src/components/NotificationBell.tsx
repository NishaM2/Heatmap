import { useState, useCallback } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useSocket } from '@/hooks/useSocket'

interface Notification {
  type: string
  message: string
  data: unknown
  createdAt: string
}

const NotificationBell = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const handleNotification = useCallback((notification: Notification) => {
    setNotifications(prev => [notification, ...prev].slice(0, 10))
    setUnreadCount(prev => prev + 1)
  }, [])

  useSocket(handleNotification)

  const handleOpen = () => {
    setUnreadCount(0)
  }

  return (
    <DropdownMenu onOpenChange={(open) => open && handleOpen()}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <div className="px-2 py-1.5 font-medium text-sm">Notifications</div>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            No notifications yet
          </div>
        ) : (
          notifications.map((notif, i) => (
            <DropdownMenuItem key={i} className="flex flex-col items-start gap-0.5 py-2">
              <span className="text-sm">{notif.message}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(notif.createdAt).toLocaleTimeString()}
              </span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default NotificationBell