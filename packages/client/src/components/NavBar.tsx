import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function NavBar() {
  const { user, isLoading, isAuthenticated, logout } = useAuth()

  if (isLoading) return null

  return (
    <nav style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '8px 16px', borderBottom: '1px solid #ddd' }}>
      <Link to='/' style={{ fontWeight: 'bold', textDecoration: 'none', color: 'inherit' }}>Music Logger</Link>
      {isAuthenticated ? (
        <>
          <Link to='/search' style={{ textDecoration: 'none', color: 'inherit' }}>Search</Link>
          <Link to='/users/search' style={{ textDecoration: 'none', color: 'inherit' }}>Find users</Link>
          <Link
            to={`/user/${user!.username ?? ''}`}
            style={{ marginLeft: 'auto', textDecoration: 'none', color: 'inherit' }}
          >
            {user!.displayName}
          </Link>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <a href='/auth/google'>Sign in with Google</a>
      )}
    </nav>
  )
}
