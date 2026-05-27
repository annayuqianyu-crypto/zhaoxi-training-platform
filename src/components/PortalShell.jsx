import { useState } from 'react'
import { TrainingSystem }   from '../pages/TrainingSystem'
import { PortalCourseMatch } from '../pages/PortalCourseMatch'
import { Schedule }          from '../pages/Schedule'
import { PortalWorkOrder }   from '../pages/PortalWorkOrder'

const TABS = [
  { key: 'trainingsystem', label: '课程体系', icon: '📚' },
  { key: 'coursematch',    label: '课程匹配', icon: '🎯' },
  { key: 'schedule',       label: '讲师排期', icon: '📅' },
  { key: 'workorder',      label: '提交需求', icon: '📝' },
]

export function PortalShell({ user, onLogout, onSwitchMode }) {
  const [activeTab, setActiveTab] = useState('trainingsystem')

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* ── 左侧边栏 ── */}
      <aside style={{
        width: 200, minWidth: 200, flexShrink: 0,
        background: 'var(--bg-sidebar)',
        display: 'flex', flexDirection: 'column',
        boxShadow: '2px 0 8px rgba(0,0,0,.18)',
        zIndex: 10,
      }}>

        {/* Logo */}
        <div style={{
          padding: '24px 20px 20px',
          borderBottom: '1px solid rgba(255,255,255,.07)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              background: 'var(--accent)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 17, fontWeight: 700, color: '#fff',
              fontFamily: "'Noto Serif SC', serif", flexShrink: 0,
            }}>朝</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>朝曦知识中心</div>
              <div style={{ fontSize: 10, color: '#71717A', lineHeight: 1.3 }}>电脑版</div>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {TABS.map(t => {
            const active = activeTab === t.key
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 8,
                  border: 'none', cursor: 'pointer',
                  background: active ? 'var(--bg-sidebar-active)' : 'transparent',
                  color: active ? '#fff' : '#A1A1AA',
                  fontSize: 13, fontWeight: active ? 700 : 500,
                  textAlign: 'left', width: '100%',
                  transition: 'all .15s',
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,.06)'; e.currentTarget.style.color = '#D4D4D8' } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#A1A1AA' } }}
              >
                <span style={{ fontSize: 15, lineHeight: 1 }}>{t.icon}</span>
                <span>{t.label}</span>
                {active && (
                  <span style={{
                    marginLeft: 'auto', width: 4, height: 4,
                    borderRadius: '50%', background: 'var(--accent)',
                    flexShrink: 0,
                  }} />
                )}
              </button>
            )
          })}
        </nav>

        {/* User info + actions */}
        <div style={{
          padding: '14px 14px 20px',
          borderTop: '1px solid rgba(255,255,255,.07)',
        }}>
          {/* Avatar + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'var(--accent)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>{user.name[0]?.toUpperCase()}</div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{
                fontSize: 12, fontWeight: 600, color: '#D4D4D8',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{user.name}</div>
              <div style={{ fontSize: 10, color: '#71717A' }}>{user.role}</div>
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {onSwitchMode && (
              <button
                onClick={onSwitchMode}
                style={{
                  background: 'none', border: '1px solid #3F3F46',
                  borderRadius: 6, padding: '6px 10px',
                  cursor: 'pointer', fontSize: 11, color: '#A1A1AA',
                  width: '100%', textAlign: 'center', transition: 'all .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.06)'; e.currentTarget.style.color = '#fff' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#A1A1AA' }}
              >切换到手机版</button>
            )}
            <button
              onClick={onLogout}
              style={{
                background: 'none', border: '1px solid #3F3F46',
                borderRadius: 6, padding: '6px 10px',
                cursor: 'pointer', fontSize: 11, color: '#A1A1AA',
                width: '100%', textAlign: 'center', transition: 'all .15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.06)'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#A1A1AA' }}
            >退出登录</button>
          </div>
        </div>
      </aside>

      {/* ── 右侧内容区 ── */}
      <main style={{ flex: 1, overflow: 'auto', background: 'var(--bg)' }}>
        {activeTab === 'trainingsystem' && <TrainingSystem user={user} navigate={() => {}} />}
        {activeTab === 'coursematch'    && <PortalCourseMatch user={user} />}
        {activeTab === 'schedule'       && <Schedule />}
        {activeTab === 'workorder'      && <PortalWorkOrder user={user} />}
      </main>

    </div>
  )
}
