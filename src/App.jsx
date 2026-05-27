import { PortalApp } from './pages/PortalApp'
import { AdminApp } from './pages/AdminApp'
import './index.css'

// 默认进入客户门户（主分发链接对应的入口）；
// 管理后台通过 #admin 访问；保留 #portal 作为门户的显式别名。
const hash = window.location.hash
const isAdmin  = hash.startsWith('#admin')

export default function App() {
  if (isAdmin)  return <AdminApp />
  return <PortalApp />
}
