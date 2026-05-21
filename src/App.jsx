import { LoginPage } from './pages/Login'
import { Shell } from './components/Shell'
import { PortalApp } from './pages/PortalApp'
import { AdminApp } from './pages/AdminApp'
import './index.css'

// 默认进入 Portal；管理端需手动加 #admin
const isAdmin = window.location.hash.startsWith('#admin')

export default function App() {
  if (isAdmin) return <AdminApp />
  return <PortalApp />
}
