import { Server } from 'socket.io'
import { Server as HttpServer } from 'http'

let io: Server

export const initSocket = (httpServer: HttpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:5173',
            credentials: true
        }
    })

    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id)

        socket.on('join', (userId: string) => {
            socket.join(userId)
            console.log(`User ${userId} joined their room`)
        })

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id)
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