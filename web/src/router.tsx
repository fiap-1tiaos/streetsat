import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router'

const LandingPage = lazy(() => import('./pages/landing/LandingPage'))
const LoginPage = lazy(() => import('./pages/admin/LoginPage'))
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'))
const MapPage = lazy(() => import('./pages/admin/MapPage'))
const OccurrencesPage = lazy(() => import('./pages/admin/OccurrencesPage'))
const AlertsPageAdmin = lazy(() => import('./pages/admin/AlertsPage'))
const ModelPage = lazy(() => import('./pages/admin/ModelPage'))
const PipelinePage = lazy(() => import('./pages/admin/PipelinePage'))

const MainDashboard = lazy(() => import('./pages/index'))
const RotaPage = lazy(() => import('./pages/rota'))
const MapaPage = lazy(() => import('./pages/mapa'))
const AlertsPage = lazy(() => import('./pages/alerts'))
const PresentationPage = lazy(() => import('./pages/apresentacao/PresentationPage'))

function Loader() {
  return (
    <div style={{ minHeight: '100dvh', background: '#020408', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', color: '#00d4ff', fontSize: '0.8rem', letterSpacing: '0.1em' }}>
        Carregando...
      </div>
    </div>
  )
}

function wrap(el: React.ReactNode) {
  return <Suspense fallback={<Loader />}>{el}</Suspense>
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: wrap(<LandingPage />),
  },
  {
    path: '/dashboard',
    element: wrap(<MainDashboard />),
  },
  {
    path: '/rota',
    element: wrap(<RotaPage />),
  },
  {
    path: '/mapa',
    element: wrap(<MapaPage />),
  },
  {
    path: '/alertas',
    element: wrap(<AlertsPage />),
  },
  {
    path: '/apresentacao',
    element: wrap(<PresentationPage />),
  },
  {
    path: '/admin/login',
    element: wrap(<LoginPage />),
  },
  {
    path: '/admin',
    element: wrap(<AdminLayout />),
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      { path: 'dashboard', element: wrap(<DashboardPage />) },
      { path: 'map', element: wrap(<MapPage />) },
      { path: 'occurrences', element: wrap(<OccurrencesPage />) },
      { path: 'alerts', element: wrap(<AlertsPageAdmin />) },
      { path: 'pipeline', element: wrap(<PipelinePage />) },
      { path: 'model', element: wrap(<ModelPage />) },
    ],
  },
])
