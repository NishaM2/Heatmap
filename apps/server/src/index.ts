import express, { NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import './db'
import { auth } from './auth'
import { toNodeHandler } from 'better-auth/node'
import categoryRouter from './api/category.routes'
import logRouter from './api/log.routes'
import statsRouter from './api/stats.routes'
import { startGitHubSyncJob } from './jobs/githubSync.job'
import githubRouter from './api/github.routes'
import friendRouter from './api/friend.routes'
import sharedGoalRouter from './api/sharedGoal.routes'

//loading environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// It secures HTTP headers automatically and prevents from attacks
app.use(helmet())

app.use(cors ({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}))

// This logs every request in terminal
app.use(morgan('dev'))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

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
app.use('/api/friends', friendRouter)
app.use('/api/shared-goals', sharedGoalRouter)

//error handler
app.use((err: any, req: express.Request, res: express.Response, next: NextFunction) => {
    console.error(err.stack)
    res.status(500).json({
        status: 'error',
        message: process.env.NODE_ENV === 'production'
            ? 'internal server error'
            : err.message
    })
})

app.listen(PORT, () => {
    console.log(`server Running on http://localhost:${PORT}`)
    console.log(`Environment: ${process.env.NODE_ENV}`)
    console.log(`Health check: http://localhost:${PORT}/api/health`)
})
startGitHubSyncJob()

export default app