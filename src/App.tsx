import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout, PublicOnly, RequireAuth, RequireTeacher, ScrollToTop } from './components/Layouts'
import { useAuth } from './context/AuthContext'
import AudioPage from './pages/AudioPage'
import AssignmentReview from './pages/AssignmentReview'
import BookDetail from './pages/BookDetail'
import CourseDetail from './pages/CourseDetail'
import Courses from './pages/Courses'
import Downloads from './pages/Downloads'
import Explore from './pages/Explore'
import Favorites from './pages/Favorites'
import ForgotPassword from './pages/ForgotPassword'
import Home from './pages/Home'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import PaesHub from './pages/PaesHub'
import PaesRun from './pages/PaesRun'
import PracticeHub from './pages/PracticeHub'
import PracticeRun from './pages/PracticeRun'
import Premium from './pages/Premium'
import PremiumThanks from './pages/PremiumThanks'
import Profile from './pages/Profile'
import ProfileEdit from './pages/ProfileEdit'
import Reader from './pages/Reader'
import Register from './pages/Register'
import ResetPassword from './pages/ResetPassword'
import Tasks from './pages/Tasks'
import Landing from './pages/Landing'
import Welcome from './pages/Welcome'

export default function App() {
  const { isAuthenticated } = useAuth()
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to="/home" replace /> : <Landing />} />

        <Route element={<PublicOnly />}>
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>

        {/* Reached from the reset email link, which signs the user in. */}
        <Route path="/reset-password" element={<ResetPassword />} />

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
            <Route path="/premium/gracias" element={<PremiumThanks />} />
            <Route path="/practice/:bookId" element={<PracticeHub />} />
            <Route path="/practice/:bookId/:setId" element={<PracticeRun />} />
            <Route path="/paes" element={<PaesHub />} />
            <Route path="/paes/:mode/:target?" element={<PaesRun />} />
            <Route element={<RequireTeacher />}>
              <Route path="/aula" element={<Courses />} />
              <Route path="/aula/:courseId" element={<CourseDetail />} />
              <Route path="/aula/:courseId/tarea/:assignmentId" element={<AssignmentReview />} />
            </Route>
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
