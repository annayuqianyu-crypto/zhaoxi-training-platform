import { useState } from 'react'
import { PortalLogin } from './PortalLogin'
import { PortalShell } from '../components/PortalShell'

export function PortalApp() {
  const [user, setUser] = useState(() => {
    try {
      const stored = sessionStorage.getItem('zx_portal_user')
      return stored ? JSON.parse(stored) : null
    } catch { return null }
  })

  function handleLogin(u) {
    sessionStorage.setItem('zx_portal_user', JSON.stringify(u))
    setUser(u)
  }

  function handleLogout() {
    sessionStorage.removeItem('zx_portal_user')
    setUser(null)
  }

  if (!user) return <PortalLogin onLogin={handleLogin} />
  return <PortalShell user={user} onLogout={handleLogout} />
}
