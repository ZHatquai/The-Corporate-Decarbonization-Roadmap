import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import Protected from './components/Protected'
import AppShell from './components/AppShell'
import HomeRedirect from './components/HomeRedirect'
import Login from './pages/Login'
import AccessNotProvisioned from './pages/AccessNotProvisioned'
import RoadmapPage from './pages/admin/RoadmapPage'
import EmissionsPage from './pages/admin/EmissionsPage'
import InventoryPage from './pages/admin/InventoryPage'
import QueuePage from './pages/admin/QueuePage'
import UsersPage from './pages/admin/UsersPage'
import StatusPage from './pages/manager/StatusPage'
import SubmitPage from './pages/manager/SubmitPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/access" element={<AccessNotProvisioned />} />

          {/* ESG lead (admin) area */}
          <Route element={<Protected allow={['esg_admin']} />}>
            <Route element={<AppShell />}>
              <Route path="/app/roadmap" element={<RoadmapPage />} />
              <Route path="/app/emissions" element={<EmissionsPage />} />
              <Route path="/app/inventory" element={<InventoryPage />} />
              <Route path="/app/queue" element={<QueuePage />} />
              <Route path="/app/settings/users" element={<UsersPage />} />
            </Route>
          </Route>

          {/* Plant / sourcing manager area */}
          <Route element={<Protected allow={['plant_manager', 'sourcing_manager']} />}>
            <Route element={<AppShell />}>
              <Route path="/work/status" element={<StatusPage />} />
              <Route path="/work/submit" element={<SubmitPage />} />
            </Route>
          </Route>

          <Route path="/" element={<HomeRedirect />} />
          <Route path="*" element={<HomeRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
