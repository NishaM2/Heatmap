import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { SOCKET_URL } from '@/lib/config'

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

    socket.on('connect', () => {
      socket.emit('join', user.id)
      console.log('Socket connected, joined room:', user.id)
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