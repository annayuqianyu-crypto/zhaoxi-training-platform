import { useState } from 'react'
import { LoginPage } from './Login'
import { Shell } from '../components/Shell'

export function AdminApp() {
  const [user, setUser] = useState(null)
  if (!user) return <LoginPage onLogin={setUser} />
  return <Shell user={user} onLogout={() => setUser(null)} />
}
