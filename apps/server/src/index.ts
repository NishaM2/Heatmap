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

//loading environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Better auth handler
app.all('/api/auth/*splat', toNodeHandler(auth))

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

app.use('/api/categories', categoryRouter)
app.use('/api/logs', logRouter)
app.use('/api/stats', statsRouter)

//error handler
app.use((err: Error, req: express.Request, res: express.Response, next: NextFunction) => {
    console.error(err.stack)
    res.status(500).json({
        status: 'error',
        message: process.env.NODE_ENV === 'producton'
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