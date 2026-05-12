import { useState } from 'react'
import { Dashboard } from '../pages/Dashboard'
import { WorkOrders } from '../pages/WorkOrders'
import { CourseMatch } from '../pages/CourseMatch'
import { Contracts } from '../pages/Contracts'
import { Schedule } from '../pages/Schedule'
import { Qualification } from '../pages/Qualification'
import { Ledger } from '../pages/Ledger'
import { Channels } from '../pages/Channels'
import { ProductLearning } from '../pages/ProductLearning'
import { InternalLedger } from '../pages/InternalLedger'
import { TrainingMaterials } from '../pages/TrainingMaterials'

/* ─── Navigation structure ───
   type: 'group'  → module section header (not clickable)
   type: 'item'   → normal nav item
   type: 'sub'    → indented sub-item (under a group)
─────────────────────────────── */
const NAV = [
  // ── 外部培训 ──────────────────────────────
  { type: 'group', label: '外部培训' },
  { type: 'item', id: 'dashboard',     label: '仪表盘',       num: '—',  icon: '◈' },
  { type: 'item', id: 'workorders',    label: '需求收集',     num: '01', icon: '◎', tag: 'M1' },
  { type: 'item', id: 'coursematch',   label: '课程匹配',     num: '02', icon: '◈', tag: 'M2' },
  { type: 'item', id: 'contracts',     label: '合同管理',     num: '03', icon: '◻', tag: 'M3' },
  { type: 'item', id: 'schedule',      label: '讲师排期',     num: '04', icon: '◷', tag: 'M4' },
  { type: 'item', id: 'qualification', label: '通关 & 素材库', num: '05', icon: '◆', tag: 'M5/6' },
  { type: 'item', id: 'ledger',        label: '台账管理',     num: '09', icon: '◉', tag: 'M9', adminOnly: true },
  { type: 'item', id: 'channels',      label: '渠道分析',     num: '10', icon: '◑', tag: 'M10' },

  // ── 知识工坊 ──────────────────────────────
  { type: 'group', label: '知识工坊' },
  { type: 'item', id: 'productlearning', label: '产品学习', num: '11', icon: '◈', tag: 'M11' },

  // ── 内部培训 ──────────────────────────────
  { type: 'group', label: '内部培训' },
  { type: 'item', id: 'internalledger',    label: '内训台账', num: '—', icon: '◉' },
  { type: 'item', id: 'trainingmaterials', label: '培训资料', num: '—', icon: '◆' },
]

const PAGE_MAP = {
  dashboard:          Dashboard,
  workorders:         WorkOrders,
  coursematch:        CourseMatch,
  contracts:          Contracts,
  schedule:           Schedule,
  qualification:      Qualification,
  ledger:             Ledger,
  channels:           Channels,
  productlearning:    ProductLearning,
  internalledger:     InternalLedger,
  trainingmaterials:  TrainingMaterials,
}

export function Shell({ user, onLogout }) {
  const [page, setPage] = useState('dashboard')
  const Page = PAGE_MAP[page] || Dashboard

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">曦</div>
          <h2>朝曦培训管理中台</h2>
          <p>Training Platform · v1.3</p>
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

            // Skip adminOnly items for non-admins
            if (n.adminOnly && user.role !== 'admin') return null

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
