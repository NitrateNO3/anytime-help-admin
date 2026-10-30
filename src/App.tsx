import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useParams, useSearchParams } from 'react-router-dom'
import { AdminLayout, RwaLayout } from './components/layout'
import { PageSkeleton } from './components/ui'
import { useStore } from './lib/store'

const Overview = lazy(() => import('./pages/admin/Overview'))
const RwaList = lazy(() => import('./pages/admin/RwaList'))
const RwaForm = lazy(() => import('./pages/admin/RwaForm'))
const RwaDetail = lazy(() => import('./pages/admin/RwaDetail'))
const Banners = lazy(() => import('./pages/admin/Banners'))
const Permissions = lazy(() => import('./pages/admin/Permissions'))
const Plans = lazy(() => import('./pages/admin/Plans'))
const Notifications = lazy(() => import('./pages/modules/Notifications'))
const Analytics = lazy(() => import('./pages/admin/Analytics'))
const ActivityLogs = lazy(() => import('./pages/admin/ActivityLogs'))
const Settings = lazy(() => import('./pages/admin/Settings'))
const Members = lazy(() => import('./pages/modules/Members'))
const Staff = lazy(() => import('./pages/modules/Staff'))
const Complaints = lazy(() => import('./pages/modules/Complaints'))
const Announcements = lazy(() => import('./pages/modules/Announcements'))
const RwaOverview = lazy(() => import('./pages/rwa/RwaOverview'))
const RwaAnalytics = lazy(() => import('./pages/rwa/RwaAnalytics'))
const RwaSettings = lazy(() => import('./pages/rwa/RwaSettings'))
const JoinLayout = lazy(() => import('./pages/join/JoinLayout'))
const JoinLanding = lazy(() => import('./pages/join/JoinLanding'))
const JoinPlans = lazy(() => import('./pages/join/JoinPlans'))
const JoinRegister = lazy(() => import('./pages/join/JoinRegister'))
const JoinCheckout = lazy(() => import('./pages/join/JoinCheckout'))
const JoinDone = lazy(() => import('./pages/join/JoinDone'))

/** Admin module pages accept an optional ?rwa= filter (e.g. from "Manage Members"). */
function AdminModule({ Page }: { Page: typeof Members }) {
  const [params] = useSearchParams()
  return <Page initialRwaFilter={params.get('rwa') ?? undefined} />
}

function RwaModule({ Page }: { Page: typeof Members }) {
  const { rwaId = '' } = useParams()
  return <Page key={rwaId} scopeRwaId={rwaId} />
}

function Home() {
  const { session } = useStore()
  return <Navigate to={session.role === 'super_admin' ? '/admin' : `/rwa/${session.rwaId}`} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route
        path="/join"
        element={
          <Suspense fallback={<div className="p-8"><PageSkeleton /></div>}>
            <JoinLayout />
          </Suspense>
        }
      >
        <Route index element={<JoinLanding />} />
        <Route path="plans" element={<JoinPlans />} />
        <Route path="register" element={<JoinRegister />} />
        <Route path="checkout" element={<JoinCheckout />} />
        <Route path="done" element={<JoinDone />} />
      </Route>

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Overview />} />
        <Route path="rwas" element={<RwaList />} />
        <Route path="rwas/new" element={<RwaForm />} />
        <Route path="rwas/:rwaId" element={<RwaDetail />} />
        <Route path="rwas/:rwaId/edit" element={<RwaForm />} />
        <Route path="members" element={<AdminModule Page={Members} />} />
        <Route path="staff" element={<AdminModule Page={Staff} />} />
        <Route path="complaints" element={<AdminModule Page={Complaints} />} />
        <Route path="announcements" element={<AdminModule Page={Announcements} />} />
        <Route path="banners" element={<Banners />} />
        <Route path="permissions" element={<Permissions />} />
        <Route path="plans" element={<Plans />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="activity" element={<ActivityLogs />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="/rwa/:rwaId" element={<RwaLayout />}>
        <Route index element={<RwaOverview />} />
        <Route path="members" element={<RwaModule Page={Members} />} />
        <Route path="staff" element={<RwaModule Page={Staff} />} />
        <Route path="complaints" element={<RwaModule Page={Complaints} />} />
        <Route path="announcements" element={<RwaModule Page={Announcements} />} />
        <Route path="notifications" element={<RwaModule Page={Notifications} />} />
        <Route path="analytics" element={<RwaAnalytics />} />
        <Route path="settings" element={<RwaSettings />} />
      </Route>

      <Route path="*" element={<Home />} />
    </Routes>
  )
}
