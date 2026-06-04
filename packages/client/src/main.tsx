import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/AuthContext'
import NavBar from './components/NavBar'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import SearchPage from './pages/SearchPage'
import ArtistPage from './pages/ArtistPage'
import AlbumPage from './pages/AlbumPage'
import ProfilePage from './pages/ProfilePage'
import SetupUsernamePage from './pages/SetupUsernamePage'
import UserSearchPage from './pages/UserSearchPage'

function Layout() {
  return (
    <>
      <NavBar />
      <Outlet />
    </>
  )
}

function RequiresUsername() {
  const { isLoading, isAuthenticated, user } = useAuth()
  if (isLoading) return null
  if (isAuthenticated && user?.username === null) return <Navigate to='/setup' replace />
  return <Outlet />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path='/' element={<HomePage />} />
            <Route path='/setup' element={<SetupUsernamePage />} />
            <Route element={<RequiresUsername />}>
              <Route path='/user/:username' element={<ProfilePage />} />
              <Route element={<ProtectedRoute />}>
                <Route path='/search' element={<SearchPage />} />
                <Route path='/users/search' element={<UserSearchPage />} />
                <Route path='/artist/:artistId' element={<ArtistPage />} />
                <Route path='/album/:itunesId' element={<AlbumPage />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
)
