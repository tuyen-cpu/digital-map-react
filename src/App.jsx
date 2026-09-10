import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import AnalyticsTracker from './components/AnalyticsTracker'
import Header from './components/Header'
import ReminderWatcher from './components/ReminderWatcher'
import ScrollToTop from './components/ScrollToTop'
import { useAppState } from './context/AppStateContext'
import AdminPage from './pages/AdminPage'
import ChangePasswordPage from './pages/ChangePasswordPage'
import ExplorePage from './pages/ExplorePage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import MapPage from './pages/MapPage'
import NotFoundPage from './pages/NotFoundPage'
import PlacePage from './pages/PlacePage'
import ProfilePage from './pages/ProfilePage'
import RegisterPage from './pages/RegisterPage'

function AppRoutes() {
  const { session } = useAppState()
  const location = useLocation()
  const forcePassword = session?.mustChangePassword && location.pathname !== '/doi-mat-khau'

  if (forcePassword) return <Navigate to="/doi-mat-khau" replace />

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/trang-chu" element={<Navigate to="/" replace />} />
      <Route path="/ban-do-du-lich" element={<MapPage />} />
      <Route path="/kham-pha-dia-diem" element={<ExplorePage />} />
      <Route path="/place.html" element={<PlacePage />} />
      <Route path="/dang-nhap" element={<LoginPage />} />
      <Route path="/dang-ky" element={<RegisterPage />} />
      <Route path="/doi-mat-khau" element={<ChangePasswordPage />} />
      <Route path="/tai-khoan" element={<ProfilePage />} />
      <Route path="/admin" element={<AdminPage mode="admin" />} />
      <Route path="/quan-ly" element={<AdminPage mode="manager" />} />
      <Route path="/admin/bao-cao" element={<Navigate to="/admin" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-blue-950">
      <AnalyticsTracker />
      <ReminderWatcher />
      <ScrollToTop />
      <Header />
      <AppRoutes />
    </div>
  )
}
