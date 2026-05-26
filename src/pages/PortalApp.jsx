import { useState } from 'react'
import { PortalLogin }      from './PortalLogin'
import { PortalModeSelect } from './PortalModeSelect'
import { PortalShell }      from '../components/PortalShell'
import { MobilePortalShell } from '../components/MobilePortalShell'

const MODE_KEY = 'zx_portal_mode'

export function PortalApp() {
  const [mode, setMode] = useState(() => sessionStorage.getItem(MODE_KEY) || null)

  const [user, setUser] = useState(() => {
    try {
      const stored = sessionStorage.getItem('zx_portal_user')
      return stored ? JSON.parse(stored) : null
    } catch { return null }
  })

  function handleSelectMode(m) {
    sessionStorage.setItem(MODE_KEY, m)
    setMode(m)
  }

  function handleLogin(u) {
    sessionStorage.setItem('zx_portal_user', JSON.stringify(u))
    setUser(u)
  }

  function handleLogout() {
    sessionStorage.removeItem('zx_portal_user')
    sessionStorage.removeItem(MODE_KEY)
    setUser(null)
    setMode(null)
  }

  // 1. 未选模式 → 入口选择
  if (!mode) return <PortalModeSelect onSelect={handleSelectMode} />

  // 2. 已选模式但未登录 → 登录
  if (!user) return <PortalLogin onLogin={handleLogin} />

  // 3. 已登录 → 按模式渲染 Shell
  if (mode === 'mobile') {
    return <MobilePortalShell user={user} onLogout={handleLogout} />
  }
  return <PortalShell user={user} onLogout={handleLogout} />
}
