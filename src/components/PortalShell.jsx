import { useState } from 'react'
import { ProductLearning } from '../pages/ProductLearning'
import { PortalCourseMatch } from '../pages/PortalCourseMatch'

const TABS = [
  { key: 'coursematch', label: '🎯 课程匹配' },
  { key: 'learning',    label: '📚 产品学习' },
]

export function PortalShell({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('coursematch')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Top header */}
      <header style={{
        height: 56, minHeight: 56,
        background: 'var(--bg-sidebar)',
        display: 'flex', alignItems: 'center',
        padding: '0 24px', gap: 20, flexShrink: 0,
        boxShadow: '0 1px 4px rgba(0,0,0,.15)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 8 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 7,
            background: 'var(--accent)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 15, fontWeight: 700, color: '#fff',
            fontFamily: "'Noto Serif SC', serif", flexShrink: 0,
          }}>朝</div>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>朝曦知识中心</span>
        </div>

        {/* Tabs */}
        <nav style={{ display: 'flex', gap: 4 }}>
          {TABS.map(t => (
            <button key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                padding: '7px 18px', borderRadius: 8,
                cursor: 'pointer', fontSize: 13, fontWeight: 600,
                border: 'none', transition: 'all .15s',
                background: activeTab === t.key ? 'var(--bg-sidebar-active)' : 'transparent',
                color: activeTab === t.key ? '#fff' : '#A1A1AA',
              }}
            >{t.label}</button>
          ))}
        </nav>

        {/* Right: user info + logout */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#D4D4D8' }}>{user.name}</div>
            <div style={{ fontSize: 11, color: '#71717A' }}>{user.role}</div>
          </div>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'var(--accent)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: '#fff',
          }}>{user.name[0]}</div>
          <button
            onClick={onLogout}
            style={{
              background: 'none', border: '1px solid #3F3F46',
              borderRadius: 7, padding: '5px 12px',
              cursor: 'pointer', fontSize: 12, color: '#A1A1AA',
              transition: 'all .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-sidebar-hover)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#A1A1AA' }}
          >退出</button>
        </div>
      </header>

      {/* Content area */}
      <main style={{ flex: 1, overflow: 'auto', background: 'var(--bg)' }}>
        {activeTab === 'coursematch' && <PortalCourseMatch user={user} />}
        {activeTab === 'learning'    && <ProductLearning />}
      </main>
    </div>
  )
}
