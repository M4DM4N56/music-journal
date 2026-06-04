import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function HomePage() {
  const { user, isLoading, isAuthenticated } = useAuth()

  if (isLoading) return null

  return (
    <main style={{ padding: '32px 16px', maxWidth: '480px' }}>
      {isAuthenticated ? (
        <>
          <h1>Welcome back, {user!.displayName}</h1>
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <Link to='/search' style={{ padding: '10px 20px', background: '#333', color: '#fff', borderRadius: '4px', textDecoration: 'none' }}>
              Search albums
            </Link>
          </div>
        </>
      ) : (
        <>
          <h1>Music Logger</h1>
          <p>Track the albums you've listened to.</p>
          <a href='/auth/google' style={{ display: 'inline-block', marginTop: '8px', padding: '10px 20px', background: '#333', color: '#fff', borderRadius: '4px', textDecoration: 'none' }}>
            Sign in with Google
          </a>
        </>
      )}
    </main>
  )
}
