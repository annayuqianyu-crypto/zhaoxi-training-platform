import { useState, useEffect } from 'react'
import { Dashboard }         from '../pages/Dashboard'
import { Contracts }         from '../pages/Contracts'
import { KPI }               from '../pages/KPI'
import { Qualification }     from '../pages/Qualification'
import { Channels }          from '../pages/Channels'
import { ProductLearning }   from '../pages/ProductLearning'
import { InternalLedger }    from '../pages/InternalLedger'
import { TrainingMaterials } from '../pages/TrainingMaterials'

const NAV = [
  { type: 'group', label: '总览' },
  { type: 'item', id: 'dashboard', label: '仪表盘', num: '—', icon: '◈' },

  { type: 'group', label: '外部培训管理' },
  { type: 'item', id: 'contracts',  label: '合同 & 台账',  num: '03', icon: '◻', tag: 'M3/9' },
  { type: 'item', id: 'kpi',        label: 'KPI 汇总',     num: '—',  icon: '◉', tag: 'KPI' },
  { type: 'item', id: 'qualification', label: '通关 & 素材库', num: '05', icon: '◆', tag: 'M5/6' },
  { type: 'item', id: 'channels',   label: '渠道分析',     num: '10', icon: '◑', tag: 'M10' },

  { type: 'group', label: '知识工坊' },
  { type: 'item', id: 'productlearning', label: '产品学习', num: '11', icon: '◈', tag: 'M11' },

  { type: 'group', label: '内部培训' },
  { type: 'item', id: 'internalledger',    label: '内训台账', num: '—', icon: '◉' },
  { type: 'item', id: 'trainingmaterials', label: '培训资料', num: '—', icon: '◆' },
]

export function Shell({ user, onLogout }) {
  const [page, setPage]           = useState('dashboard')
  // 合同数据在 Shell 层统一托管，Contracts 和 KPI 共享同一份数据
  // 初始化时从 localStorage 读取，变更时自动持久化
  const [contracts, setContracts] = useState(() => {
    try {
      const saved = localStorage.getItem('zx_contracts')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })

  useEffect(() => {
    localStorage.setItem('zx_contracts', JSON.stringify(contracts))
  }, [contracts])

  function renderPage() {
    switch (page) {
      case 'dashboard':        return <Dashboard user={user} navigate={setPage} />
      case 'contracts':        return <Contracts data={contracts} setData={setContracts} />
      case 'kpi':              return <KPI contracts={contracts} />
      case 'qualification':    return <Qualification user={user} navigate={setPage} />
      case 'channels':         return <Channels />
      case 'productlearning':  return <ProductLearning />
      case 'internalledger':   return <InternalLedger />
      case 'trainingmaterials':return <TrainingMaterials />
      default:                 return <Dashboard user={user} navigate={setPage} />
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">曦</div>
          <h2>朝曦内部管理中台</h2>
          <p>Internal Platform · v1.0</p>
        </div>

        <div className="nav-section">
          {NAV.map((n, i) => {
            if (n.type === 'group') {
              return (
                <div key={i} style={{
                  padding: i === 0 ? '6px 14px 4px' : '14px 14px 4px',
                  fontSize: 10, fontWeight: 800, letterSpacing: '.12em',
                  color: '#52525B', textTransform: 'uppercase', userSelect: 'none',
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
          <div style={{
            padding: '8px 14px', fontSize: 10, color: '#3F3F46',
            background: '#111113', borderRadius: 6, margin: '0 10px 10px',
            textAlign: 'center', letterSpacing: '.04em',
          }}>
            🔒 仅限内部使用 · 请勿外传
          </div>
          <div className="user-chip" onClick={onLogout} title="点击退出">
            <div className="user-avatar">{user.name.charAt(0)}</div>
            <div>
              <div className="user-name">{user.name}</div>
              <div className="user-role">管理员</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="main">
        {renderPage()}
      </div>
    </div>
  )
}
