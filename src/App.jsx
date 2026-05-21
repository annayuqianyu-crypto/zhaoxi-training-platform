import { LoginPage } from './pages/Login'
import { Shell } from './components/Shell'
import { PortalApp } from './pages/PortalApp'
import { AdminApp } from './pages/AdminApp'
import './index.css'

// 默认进入 Admin（主界面）；Portal 通过 #portal 访问
const isPortal = window.location.hash.startsWith('#portal')

export default function App() {
  if (isPortal) return <PortalApp />
  return <AdminApp />
}
