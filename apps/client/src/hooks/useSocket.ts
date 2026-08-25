import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { SOCKET_URL } from '@/lib/config'

// Navbar remounts on every route change, so this keeps the warning to once per
// page session instead of once per navigation.
let warnedUnauthorized = false

type NotificationData = {
  type: string
  message: string
  data: unknown
  createdAt: string
}

export const useSocket = (onNotification: (data: NotificationData ) => void) => {
  const { user } = useAuth()
  const socketRef = useRef<Socket | null>(null)
  const onNotificationRef = useRef(onNotification)

  useEffect(() => {
    onNotificationRef.current = onNotification
  })

  useEffect(() => {
    if (!user) return

    const socket = io(SOCKET_URL, {
      withCredentials: true,
    })

    socketRef.current = socket

    // The server authenticates the handshake from the session cookie and joins the
    // user's room itself, so there is nothing to emit on connect.
    socket.on('connect_error', (err) => {
      // A rejected handshake will never succeed on retry — socket.io would
      // otherwise reconnect forever, silently and invisibly.
      if (err.message === 'unauthorized') {
        socket.disconnect()
        if (!warnedUnauthorized) {
          warnedUnauthorized = true
          toast('Live notifications unavailable', {
            description: 'Try signing in again to reconnect.',
          })
        }
      }
    })

    socket.on('notification', (data) => {
      onNotificationRef.current(data)
      toast(data.message, {
        description: new Date(data.createdAt).toLocaleTimeString()
      })
    })

    return () => {
      socket.disconnect()
    }
  }, [user])

  return socketRef 
}