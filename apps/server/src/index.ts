import 'dotenv/config'
import express, { NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import './db'
import { auth, enabledSocialProviders } from './auth'
import { toNodeHandler } from 'better-auth/node'
import categoryRouter from './api/category.routes'
import logRouter from './api/log.routes'
import statsRouter from './api/stats.routes'
import { startGitHubSyncJob } from './jobs/githubSync.job'
import githubRouter from './api/github.routes'
import friendRouter from './api/friend.routes'
import sharedGoalRouter from './api/sharedGoal.routes'
import { createServer } from 'http'
import { initSocket } from './lib/socket'
import rateLimit from 'express-rate-limit'
import shareRouter from './api/share.routes'
import accountRouter from './api/account.routes'
import { CLIENT_URL, SERVER_URL } from './lib/config'

const app = express()
const PORT = process.env.PORT || 3000

if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1)
}

const wsOrigin = SERVER_URL.replace(/^http/, 'ws')
// It secures HTTP headers automatically and prevents from attacks
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            connectSrc: ["'self'", SERVER_URL, wsOrigin]
        }
    }
}))

app.use(cors ({
    origin: CLIENT_URL,
    credentials: true
}))

// This logs every request in terminal
app.use(morgan('dev'))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// Global rate limit — 100 requests per minute per IP
const globalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    message: {
        status: 'error',
        message: 'Too many requests, please try again later'
    }
})

// Auth rate limit — 5 attempts per 15 minutes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        status: 'error',
        message: 'Too many login attempts, please try again later'
    }
})

// Share images are rendered with resvg, which is synchronous CPU work on the event
// loop — a burst of requests would stall every other request. Keep it infrequent.
const shareLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: {
        status: 'error',
        message: 'Too many image requests, please slow down'
    }
})

app.use(globalLimiter)

app.use('/api/auth/sign-in/email', authLimiter)
app.use('/api/auth/sign-up/email', authLimiter)
app.use('/api/account/set-password', authLimiter)

app.get('/api/auth-providers', (req, res) => {
    res.json({ providers: enabledSocialProviders })
})

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: ' Heatmap tracker API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    })
})

// Better auth handler
app.all('/api/auth/*splat', toNodeHandler(auth))

app.use('/api/categories', categoryRouter)
app.use('/api/logs', logRouter)
app.use('/api/stats', statsRouter)
app.use('/api/github', githubRouter)
app.use('/api/account', accountRouter)
app.use('/api/friends', friendRouter)
app.use('/api/shared-goals', sharedGoalRouter)
app.use('/api/share', shareLimiter, shareRouter)

//error handler
app.use((req: express.Request, res: express.Response) => {
    res.status(404).json({
        status: 'error',
        message: `Route ${req.method} ${req.url} not found`
    })
})

app.use((err: any, req: express.Request, res: express.Response, next: NextFunction) => {
    console.error(err.stack)
    const status = err.status || 500
    res.status(status).json({
        status: 'error',
        message: process.env.NODE_ENV === 'production'
            ? 'internal server error'
            : err.message
    })
})

const httpServer = createServer(app)
initSocket(httpServer)

httpServer.listen(PORT, () => {
    console.log(`server Running on http://localhost:${PORT}`)
    console.log(`Environment: ${process.env.NODE_ENV}`)
    console.log(`Health check: http://localhost:${PORT}/api/health`)
})
startGitHubSyncJob()

export default app