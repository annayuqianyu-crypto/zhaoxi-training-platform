import { useState } from 'react'
import { MobileContext }     from '../MobileContext'
import { TrainingSystem }    from '../pages/TrainingSystem'
import { PortalCourseMatch } from '../pages/PortalCourseMatch'
import { Schedule }          from '../pages/Schedule'
import { PortalWorkOrder }   from '../pages/PortalWorkOrder'

const TABS = [
  { key: 'trainingsystem', label: '课程体系' },
  { key: 'coursematch',    label: '课程匹配' },
  { key: 'schedule',       label: '讲师排期' },
  { key: 'workorder',      label: '提交需求' },
]

export function MobilePortalShell({ user, onLogout, onSwitchMode }) {
  const [activeTab, setActiveTab] = useState('trainingsystem')

  return (
    <MobileContext.Provider value={true}>
      <div style={{
        display: 'flex', flexDirection: 'column',
        height: '100vh', overflow: 'hidden',
        background: 'var(--bg)',
      }}>
        {/* ── 顶部标题栏 ── */}
        <header style={{
          height: 48, minHeight: 48, flexShrink: 0,
          background: 'var(--bg-sidebar)',
          display: 'flex', alignItems: 'center',
          padding: '0 16px',
          boxShadow: '0 1px 4px rgba(0,0,0,.2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
            <div style={{
              width: 26, height: 26, borderRadius: 6,
              background: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Noto Serif SC', serif",
              fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>朝</div>
            <span style={{
              fontSize: 13, fontWeight: 600, color: '#fff',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>朝曦知识中心</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <span style={{ fontSize: 12, color: '#A1A1AA' }}>{user.name}</span>
            {onSwitchMode && (
              <button
                onClick={onSwitchMode}
                title="切换到电脑版"
                style={{
                  background: 'none', border: '1px solid #3F3F46',
                  borderRadius: 6, padding: '4px 8px',
                  cursor: 'pointer', fontSize: 11, color: '#A1A1AA',
                  minHeight: 'unset',
                }}
              >电脑版</button>
            )}
            <button
              onClick={onLogout}
              style={{
                background: 'none', border: '1px solid #3F3F46',
                borderRadius: 6, padding: '4px 8px',
                cursor: 'pointer', fontSize: 11, color: '#A1A1AA',
                minHeight: 'unset',
              }}
            >退出</button>
          </div>
        </header>

        {/* ── 页面内容区 ── */}
        <main style={{
          flex: 1, overflow: 'auto',
          paddingBottom: 'calc(56px + env(safe-area-inset-bottom))',
        }}>
          {activeTab === 'trainingsystem' && <TrainingSystem user={user} navigate={() => {}} />}
          {activeTab === 'coursematch'    && <PortalCourseMatch user={user} />}
          {activeTab === 'schedule'       && <Schedule />}
          {activeTab === 'workorder'      && <PortalWorkOrder user={user} />}
        </main>

        {/* ── 底部 Tab 栏 ── */}
        <nav style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          height: 'calc(56px + env(safe-area-inset-bottom))',
          paddingBottom: 'env(safe-area-inset-bottom)',
          background: 'var(--bg-sidebar)',
          borderTop: '1px solid #27272A',
          display: 'flex',
          zIndex: 200,
        }}>
          {TABS.map(t => {
            const active = activeTab === t.key
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                style={{
                  flex: 1,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  background: 'none', border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  color: active ? 'var(--accent-mid)' : '#71717A',
                  transition: 'color .15s',
                  minHeight: 'unset',
                  padding: '0 4px',
                }}
              >
                <span style={{
                  fontSize: 11, fontWeight: active ? 700 : 500,
                  letterSpacing: '.01em', lineHeight: 1.3,
                  textAlign: 'center',
                }}>{t.label}</span>
                {active && (
                  <span style={{
                    position: 'absolute', top: 0, left: '15%', right: '15%',
                    height: 2, background: 'var(--accent-mid)', borderRadius: 99,
                  }} />
                )}
              </button>
            )
          })}
        </nav>
      </div>
    </MobileContext.Provider>
  )
}
