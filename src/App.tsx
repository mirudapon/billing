import { HashRouter, Routes, Route } from 'react-router-dom'
import TripListPage from './pages/TripListPage'
import TripDetailPage from './pages/TripDetailPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<TripListPage />} />
        <Route path="/trips/:tripId" element={<TripDetailPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </HashRouter>
  )
}
