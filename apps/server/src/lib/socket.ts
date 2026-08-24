import { Server } from 'socket.io'
import { Server as HttpServer } from 'http'
import { auth } from '../auth/index'

declare module 'socket.io' {
    interface SocketData {
        userId: string
        sessionId: string
    }
}

let io: Server

export const initSocket = (httpServer: HttpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:5173',
            credentials: true
        }
    })

    io.use(async (socket, next) => {
        try {
            const cookie = socket.handshake.headers.cookie
            if (!cookie) return next(new Error('unauthorized'))

            const session = await auth.api.getSession({
                headers: new Headers({ cookie })
            })

            if (!session?.user) return next(new Error('unauthorized'))

            socket.data.userId = session.user.id
            socket.data.sessionId = session.session.id
            return next()
        } catch {
            return next(new Error('unauthorized'))
        }
    })

    io.on('connection', (socket) => {
        socket.join(socket.data.userId)

        socket.on('disconnect', () => {
            
        })
    })

    return io
}

export const getIO = (): Server => {
    if (!io) {
        throw new Error('Socket.io not initialized')
    }
    return io
}

export const sendNotification = (userId: string, type: string, message: string, data?: any) => {
    const io = getIO()
    io.to(userId).emit('notification', {
        type,
        message,
        data,
        createdAt: new Date().toISOString()
    })
}