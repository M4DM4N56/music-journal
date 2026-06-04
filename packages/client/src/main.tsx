import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import NavBar from './components/NavBar'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import SearchPage from './pages/SearchPage'
import ArtistPage from './pages/ArtistPage'
import AlbumPage from './pages/AlbumPage'
import ProfilePage from './pages/ProfilePage'

function Layout() {
  return (
    <>
      <NavBar />
      <Outlet />
    </>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path='/' element={<HomePage />} />
            <Route path='/user/:username' element={<ProfilePage />} />
            <Route element={<ProtectedRoute />}>
              <Route path='/search' element={<SearchPage />} />
              <Route path='/artist/:artistId' element={<ArtistPage />} />
              <Route path='/album/:itunesId' element={<AlbumPage />} />

            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
)
