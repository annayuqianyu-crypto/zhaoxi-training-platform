import { useState } from 'react'
import { TrainingSystem } from '../pages/TrainingSystem'
import { CourseMatch }    from '../pages/CourseMatch'
import { Schedule }       from '../pages/Schedule'

/* ─── Navigation structure ───
   type: 'group'  → module section header (not clickable)
   type: 'item'   → normal nav item
─────────────────────────────── */
const NAV = [
  // ── 培训体系 ──────────────────────────────
  { type: 'group', label: '培训体系' },
  { type: 'item', id: 'trainingsystem', label: '课程体系', num: '—', icon: '◈' },

  // ── 外部培训 ──────────────────────────────
  { type: 'group', label: '外部培训' },
  { type: 'item', id: 'coursematch', label: '课程匹配', num: '02', icon: '◈', tag: 'M2' },
  { type: 'item', id: 'schedule',    label: '讲师排期', num: '04', icon: '◷', tag: 'M4' },
]

const PAGE_MAP = {
  trainingsystem: TrainingSystem,
  coursematch:    CourseMatch,
  schedule:       Schedule,
}

export function Shell({ user, onLogout }) {
  const [page, setPage] = useState('trainingsystem')
  const Page = PAGE_MAP[page] || TrainingSystem

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">曦</div>
          <h2>朝曦家办-知识工坊</h2>
          <p>Knowledge Hub · v1.3</p>
        </div>

        <div className="nav-section">
          {NAV.map((n, i) => {
            // Section group header
            if (n.type === 'group') {
              return (
                <div key={i} style={{
                  padding: i === 0 ? '6px 14px 4px' : '14px 14px 4px',
                  fontSize: 10, fontWeight: 800, letterSpacing: '.12em',
                  color: '#52525B', textTransform: 'uppercase',
                  userSelect: 'none',
                }}>
                  {n.label}
                </div>
              )
            }

            return (
              <div key={n.id}
                className={`nav-item${page === n.id ? ' active' : ''}`}
                onClick={() => setPage(n.id)}>
                <span className="nav-num">{n.num}</span>
                <span style={{ flex: 1 }}>{n.label}</span>
                {n.tag && (
                  <span style={{ fontSize: 10, color: '#52525B', background: '#27272A', padding: '1px 6px', borderRadius: 4 }}>
                    {n.tag}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        <div className="sidebar-bottom">
          <div className="user-chip" onClick={onLogout} title="点击退出">
            <div className="user-avatar">{user.name.charAt(0)}</div>
            <div>
              <div className="user-name">{user.name}</div>
              <div className="user-role">
                {user.role === 'admin' ? '管理员' : user.role === 'sales' ? '销售' : user.role === 'teacher' ? '讲师' : 'BU成员'}
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="main">
        <Page user={user} navigate={setPage} />
      </div>
    </div>
  )
}
