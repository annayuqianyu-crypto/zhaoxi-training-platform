import { useState } from 'react'
import { PortalLogin }      from './PortalLogin'
import { PortalModeSelect } from './PortalModeSelect'
import { PortalShell }      from '../components/PortalShell'
import { MobilePortalShell } from '../components/MobilePortalShell'

const MODE_KEY = 'zx_portal_mode'
const USER_KEY = 'zx_portal_user'
// 登录有效期：30 天
const LOGIN_TTL = 30 * 24 * 60 * 60 * 1000

function loadUser() {
  try {
    const stored = localStorage.getItem(USER_KEY)
    if (!stored) return null
    const parsed = JSON.parse(stored)
    // 兼容旧格式（直接是 user 对象）
    if (!parsed.expireAt) return parsed
    // 已过期 → 清掉
    if (Date.now() > parsed.expireAt) {
      localStorage.removeItem(USER_KEY)
      return null
    }
    return parsed.user
  } catch { return null }
}

export function PortalApp() {
  const [mode, setMode] = useState(() => localStorage.getItem(MODE_KEY) || null)
  const [user, setUser] = useState(loadUser)

  function handleSelectMode(m) {
    localStorage.setItem(MODE_KEY, m)
    setMode(m)
  }

  function handleLogin(u) {
    localStorage.setItem(USER_KEY, JSON.stringify({
      user: u,
      expireAt: Date.now() + LOGIN_TTL,
    }))
    setUser(u)
  }

  function handleLogout() {
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(MODE_KEY)
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
