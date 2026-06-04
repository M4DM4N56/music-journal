import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { prisma } from './prisma'

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL } = process.env

if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && GOOGLE_CALLBACK_URL) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const googleId = profile.id
          const email = profile.emails?.[0]?.value ?? ''
          const displayName = profile.displayName
          const avatarUrl = profile.photos?.[0]?.value ?? null

          let user = await prisma.user.findUnique({ where: { googleId } })

          if (user) {
            user = await prisma.user.update({
              where: { googleId },
              data: { displayName, avatarUrl },
            })
          } else {
            user = await prisma.user.create({
              data: { googleId, email, displayName, avatarUrl },
            })
          }

          done(null, user)
        } catch (err) {
          done(err as Error)
        }
      }
    )
  )
} else {
  console.warn('Google OAuth not configured — set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL to enable')
}

passport.serializeUser((user, done) => {
  done(null, (user as { id: string }).id)
})

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } })
    done(null, user)
  } catch (err) {
    done(err as Error)
  }
})

export default passport
