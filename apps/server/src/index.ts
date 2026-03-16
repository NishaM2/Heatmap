import express, { NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import './db'
import { auth } from './auth'
import { toNodeHandler } from 'better-auth/node'
import authMiddleware from './middleware/auth.middleware'

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

app.get('/success', (req, res) => {
    res.json({ message: 'GitHub OAuth successful' })
})

app.get('/test', (req, res) => {
  res.send(`
    <html>
      <body>
        <h1>Auth Test</h1>
        <a href="/api/auth/sign-in/social?provider=github&callbackURL=http://localhost:3000/success">
          Sign in with GitHub
        </a>
      </body>
    </html>
  `)
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
    
    // Forward all headers from Better Auth response
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

app.get('/api/protected', authMiddleware, (req, res) => {
  res.json({
    message: "You are authenticated",
    user: req.user
  })
})

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

export default app