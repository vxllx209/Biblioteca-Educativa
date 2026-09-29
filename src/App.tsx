import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout, PublicOnly, RequireAuth, ScrollToTop } from './components/Layouts'
import { useAuth } from './context/AuthContext'
import AudioPage from './pages/AudioPage'
import BookDetail from './pages/BookDetail'
import Downloads from './pages/Downloads'
import Explore from './pages/Explore'
import Favorites from './pages/Favorites'
import ForgotPassword from './pages/ForgotPassword'
import Home from './pages/Home'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import PracticeHub from './pages/PracticeHub'
import PracticeRun from './pages/PracticeRun'
import Premium from './pages/Premium'
import Profile from './pages/Profile'
import ProfileEdit from './pages/ProfileEdit'
import Reader from './pages/Reader'
import Register from './pages/Register'
import Tasks from './pages/Tasks'
import Welcome from './pages/Welcome'

export default function App() {
  const { isAuthenticated } = useAuth()
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Navigate to={isAuthenticated ? '/home' : '/welcome'} replace />} />

        <Route element={<PublicOnly />}>
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route path="/home" element={<Home />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/book/:id" element={<BookDetail />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/downloads" element={<Downloads />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/edit" element={<ProfileEdit />} />
            <Route path="/premium" element={<Premium />} />
            <Route path="/practice/:bookId" element={<PracticeHub />} />
            <Route path="/practice/:bookId/:setId" element={<PracticeRun />} />
          </Route>
          {/* Full-screen experiences */}
          <Route path="/reader/:id" element={<Reader />} />
          <Route path="/audio/:id" element={<AudioPage />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}
