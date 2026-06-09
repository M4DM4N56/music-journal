import { Router, Request, Response } from 'express'
import passport from '../lib/passport'
import { requireAuth } from '../middleware/requireAuth'

const router = Router()

router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }))

router.get(
  '/auth/google/callback',
  (req, res, next) => {
    passport.authenticate('google', (err: Error | null, user: Express.User | false) => {
      if (err) {
        console.error('[auth/callback] Strategy error:', err)
        return res.status(401).json({ error: 'Authentication error', detail: err.message })
      }
      if (!user) {
        console.error('[auth/callback] No user returned from strategy')
        return res.status(401).json({ error: 'No user returned' })
      }
      req.logIn(user, (loginErr) => {
        if (loginErr) {
          console.error('[auth/callback] req.logIn error:', loginErr)
          return res.status(500).json({ error: 'Login failed', detail: loginErr.message })
        }
        console.log('[auth/callback] session ID:', req.sessionID)
        console.log('[auth/callback] session:', JSON.stringify(req.session))
        console.log('[auth/callback] user:', req.user?.id)
        console.log('[auth/callback] redirecting to:', process.env.CLIENT_ORIGIN)
        return res.redirect(process.env.CLIENT_ORIGIN ?? 'http://localhost:5173')
      })
    })(req, res, next)
  }
)

router.get('/auth/failure', (_req: Request, res: Response) => {
  res.status(401).json({ error: 'Authentication failed' })
})

router.post('/auth/logout', (req: Request, res: Response) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' })
    }
    req.session.destroy(() => {
      res.json({ success: true })
    })
  })
})

router.get('/auth/me', requireAuth, (req: Request, res: Response) => {
  console.log('[auth/me] session ID:', req.sessionID)
  console.log('[auth/me] isAuthenticated:', req.isAuthenticated())
  console.log('[auth/me] cookies:', req.headers.cookie)
  const { id, displayName, email, avatarUrl, username } = req.user!
  res.json({ id, displayName, email, avatarUrl, username })
})

export default router
