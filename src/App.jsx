import { LoginPage } from './pages/Login'
import { Shell } from './components/Shell'
import { PortalApp } from './pages/PortalApp'
import { AdminApp } from './pages/AdminApp'
import './index.css'

const isPortal = window.location.hash.startsWith('#portal')

export default function App() {
  if (isPortal) return <PortalApp />
  return <AdminApp />
}
