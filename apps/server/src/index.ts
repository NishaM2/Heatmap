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

//loading environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Better auth handler


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

app.get('/api/ping', (req, res) => {
    res.send('pong')
})

app.all('/api/auth/*splat', toNodeHandler(auth))

app.get('/success', (req, res) => {
    res.json({ message: 'GitHub OAuth successful' })
})

app.get('/test-auth', async (req, res) => {
    try {
        const result = await auth.api.signInSocial({
            body: {
                provider: 'github' as const,
                callbackURL: 'http://localhost:3000/success'
            },
            asResponse: true
        })
        result.headers.forEach((value: string, key: string) => {
            res.setHeader(key, value)
        })
        const data = await result.json() as { url?: string, redirect?: boolean }
        if (data.url) {
            return res.redirect(data.url)
        }
        res.json(data)
    } catch(e: any) {
        res.json({ error: e.message, stack: e.stack })
    }
})

app.get('/api/test-sync', async (req: any, res) => {
  try {
    const session = await auth.api.getSession({
      headers: req.headers as Record<string, string>
    })
    if (!session) return res.json({ error: 'not logged in' })
    
    const { db } = await import('./db')
    const { betterAuthAccounts, categories } = await import('./db/schema')
    const { eq, and } = await import('drizzle-orm')
    const { syncUserGitHub } = await import('./services/github.service')

    const githubAccount = await db.select()
      .from(betterAuthAccounts)
      .where(and(
        eq(betterAuthAccounts.userId, session.user.id),
        eq(betterAuthAccounts.providerId, 'github')
      ))

    if (githubAccount.length === 0) {
      return res.json({ error: 'GitHub not connected', userId: session.user.id })
    }

    const userCategories = await db.select()
      .from(categories)
      .where(eq(categories.userId, session.user.id))

    const codingCategory = userCategories.find(cat =>
      cat.name.toLowerCase() === 'coding'
    )

    if (!codingCategory) {
      return res.json({ error: 'No coding category found' })
    }

    const result = await syncUserGitHub(
      session.user.id,
      githubAccount[0].accountId,
      githubAccount[0].accessToken!,
      codingCategory.id
    )

    res.json({ success: true, syncedDays: result.syncedDays })
  } catch(e: any) {
    res.json({ error: e.message })
  }
})

app.get('/api/test-create-category', async (req: any, res) => {
  try {
    const session = await auth.api.getSession({
      headers: req.headers as Record<string, string>
    })
    if (!session) return res.json({ error: 'not logged in' })

    const { db } = await import('./db')
    const { categories } = await import('./db/schema')

    const newCategory = await db.insert(categories)
      .values({
        name: 'Coding',
        color: '#22c55e',
        isCore: true,
        userId: session.user.id
      })
      .returning()

    res.json({ success: true, category: newCategory[0] })
  } catch(e: any) {
    res.json({ error: e.message })
  }
})



app.use('/api/categories', categoryRouter)
app.use('/api/logs', logRouter)
app.use('/api/stats', statsRouter)
app.use('/api/github', githubRouter)

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