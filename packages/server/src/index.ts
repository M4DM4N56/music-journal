import 'dotenv/config'
import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import session from 'express-session'
import connectPgSimple from 'connect-pg-simple'
import pg from 'pg'
import { prisma } from './lib/prisma'
import passport from './lib/passport'
import authRouter from './routes/auth'
import albumsRouter from './routes/albums'
import ratingsRouter from './routes/ratings'
import diaryRouter from './routes/diary'
import usersRouter from './routes/users'
import statusRouter from './routes/status'

if (!process.env.SESSION_SECRET) {
  console.error('ERROR: SESSION_SECRET environment variable is not set. Refusing to start.')
  process.exit(1)
}

console.log('[startup] GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✓ set' : '✗ MISSING')
console.log('[startup] GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✓ set' : '✗ MISSING')
console.log('[startup] GOOGLE_CALLBACK_URL:', process.env.GOOGLE_CALLBACK_URL)
console.log('[startup] CLIENT_ORIGIN:', process.env.CLIENT_ORIGIN)
console.log('[startup] NODE_ENV:', process.env.NODE_ENV)

const app = express()
const port = process.env.PORT ?? 3000

const PgStore = connectPgSimple(session)
const pgPool = new pg.Pool({ connectionString: process.env.DATABASE_URL })

app.set('trust proxy', 1)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  })
)
app.use(cors({ origin: process.env.CLIENT_ORIGIN, credentials: true }))
app.use(express.json())

const sessionStore = new PgStore({ pool: pgPool, createTableIfMissing: true })
sessionStore.pruneSessions()

app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  })
)
app.use(passport.initialize())
app.use(passport.session())

app.use(authRouter)
app.use(albumsRouter)
app.use(ratingsRouter)
app.use(diaryRouter)
app.use(usersRouter)
app.use(statusRouter)

app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ status: 'ok', db: 'ok' })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Health check DB error:', err)
    res.json({ status: 'ok', db: 'error', message })
  }
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
