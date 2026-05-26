import { useState } from 'react'
import { MobileContext }   from '../MobileContext'
import { ProductLearning } from '../pages/ProductLearning'
import { PortalCourseMatch } from '../pages/PortalCourseMatch'
import { PortalWorkOrder }   from '../pages/PortalWorkOrder'
import { PortalHistory, loadHistory } from '../pages/PortalHistory'

const WORKORDER_WHITELIST = ['anna.yu@zxpro.com.cn']

const ALL_TABS = [
  { key: 'coursematch', label: '课程匹配' },
  { key: 'workorder',   label: '提交需求', restricted: true },
  { key: 'learning',    label: '产品学习' },
  { key: 'history',     label: '历史记录' },
]

export function MobilePortalShell({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('coursematch')
  const canSeeWorkorder = WORKORDER_WHITELIST.includes(user.name)
  const TABS = ALL_TABS.filter(t => !t.restricted || canSeeWorkorder)

  const histCount = loadHistory(user.name).length

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
          {/* Logo + 名称 */}
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

          {/* 用户名 + 退出 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <span style={{ fontSize: 12, color: '#A1A1AA' }}>{user.name}</span>
            <button
              onClick={onLogout}
              style={{
                background: 'none', border: '1px solid #3F3F46',
                borderRadius: 6, padding: '4px 10px',
                cursor: 'pointer', fontSize: 11, color: '#A1A1AA',
              }}
            >退出</button>
          </div>
        </header>

        {/* ── 页面内容区 ── */}
        <main style={{
          flex: 1, overflow: 'auto',
          paddingBottom: 'calc(56px + env(safe-area-inset-bottom))',
        }}>
          {activeTab === 'coursematch' && <PortalCourseMatch user={user} />}
          {activeTab === 'workorder'   && canSeeWorkorder && <PortalWorkOrder user={user} />}
          {activeTab === 'learning'    && <ProductLearning />}
          {activeTab === 'history'     && (
            <PortalHistory user={user} onLoad={() => setActiveTab('coursematch')} />
          )}
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
                  gap: 2,
                  background: 'none', border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  color: active ? 'var(--accent-mid)' : '#71717A',
                  transition: 'color .15s',
                }}
              >
                {/* 历史记录徽章 */}
                {t.key === 'history' && histCount > 0 && (
                  <span style={{
                    position: 'absolute', top: 8, right: 'calc(50% - 18px)',
                    background: 'var(--accent)', color: '#fff',
                    borderRadius: 99, fontSize: 9, fontWeight: 700,
                    padding: '1px 5px', lineHeight: 1.4, minWidth: 16,
                    textAlign: 'center',
                  }}>{histCount}</span>
                )}
                <span style={{
                  fontSize: 12, fontWeight: active ? 700 : 500,
                  letterSpacing: '.01em',
                }}>{t.label}</span>
                {/* 激活指示线 */}
                {active && (
                  <span style={{
                    position: 'absolute', top: 0, left: '20%', right: '20%',
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
