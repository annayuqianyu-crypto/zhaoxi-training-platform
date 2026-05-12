import { useState } from 'react'
import { LoginPage } from './pages/Login'
import { Shell } from './components/Shell'
import './index.css'

export default function App() {
  const [user, setUser] = useState(null)
  if (!user) return <LoginPage onLogin={setUser} />
  return <Shell user={user} onLogout={() => setUser(null)} />
}
