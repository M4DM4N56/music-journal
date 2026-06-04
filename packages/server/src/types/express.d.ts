import { User } from '@prisma/client'

declare global {
  namespace Express {
    interface User {
      id: string
      googleId: string
      email: string
      displayName: string
      avatarUrl: string | null
      username: string | null
      createdAt: Date
    }
  }
}
