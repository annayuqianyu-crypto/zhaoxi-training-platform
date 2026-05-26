import { useState, useMemo } from 'react'
import { SKU_FULL } from '../data/skuFull'
import { useMobile } from '../MobileContext'

const DEPTS = ['法律', '税务', '资本市场']

export function ProductLearning() {
  const isMobile = useMobile()
  const [activeDept, setActiveDept] = useState('法律')
  const [search, setSearch]         = useState('')
  const [openL1, setOpenL1]         = useState({})
  const [openL2, setOpenL2]         = useState({})
  const [openSku, setOpenSku]       = useState({})

  const deptCounts = useMemo(() =>
    DEPTS.map(d => ({ dept: d, count: SKU_FULL.filter(s => s.dept === d).length })), [])

  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase()
    const items = SKU_FULL.filter(s =>
      s.dept === activeDept &&
      (!q ||
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        (s.level1 || '').toLowerCase().includes(q) ||
        (s.level2 || '').toLowerCase().includes(q) ||
        (s.definition || '').toLowerCase().includes(q) ||
        (s.painpoints || '').toLowerCase().includes(q)
      )
    )
    const map = new Map()
    for (const s of items) {
      if (!map.has(s.level1)) map.set(s.level1, new Map())
      const l2 = map.get(s.level1)
      if (!l2.has(s.level2)) l2.set(s.level2, [])
      l2.get(s.level2).push(s)
    }
    return map
  }, [activeDept, search])

  const totalFiltered = useMemo(() => {
    let n = 0; grouped.forEach(l2 => l2.forEach(a => n += a.length)); return n
  }, [grouped])

  const searching = search.trim().length > 0

  function toggleL1(k)  { setOpenL1(p => ({ ...p, [k]: p[k] === false })) }
  function toggleL2(k)  { setOpenL2(p => ({ ...p, [k]: p[k] === false })) }
  function toggleSku(k) { setOpenSku(p => ({ ...p, [k]: !p[k] })) }
  function l1Open(k)    { return searching || openL1[k] !== false }
  function l2Open(k)    { return searching || openL2[k] !== false }

  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')

  return (
    <div style={{ padding: isMobile ? '16px' : '28px', minHeight: '100%', boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:10 }}>
        <div>
          <h1 style={{ fontSize: isMobile ? 18 : 22, fontWeight:700, color:'var(--text-1)', marginBottom:4 }}>产品学习</h1>
          <p style={{ fontSize:13, color:'var(--text-3)' }}>全量 SKU 知识卡片 · 共 {SKU_FULL.length} 个产品</p>
        </div>
        <input
          className="form-input"
          style={{ width: isMobile ? '100%' : 280, margin:0 }}
          placeholder="搜索编号 / 名称 / 分类 / 关键词…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* BU tabs */}
      <div style={{
        display:'flex', gap:8, marginBottom:20,
        borderBottom:'1px solid var(--border)', paddingBottom:0,
        overflowX: isMobile ? 'auto' : 'visible',
        WebkitOverflowScrolling: 'touch',
        flexWrap: isMobile ? 'nowrap' : 'wrap',
      }}>
        {deptCounts.map(({ dept, count }) => {
          const active = dept === activeDept
          return (
            <button key={dept}
              onClick={() => { setActiveDept(dept); setSearch('') }}
              style={{
                padding:'9px 20px', borderRadius:'8px 8px 0 0', cursor:'pointer',
                border:'1px solid var(--border)',
                borderBottom: active ? '1px solid var(--bg-card)' : '1px solid var(--border)',
                marginBottom: active ? -1 : 0,
                background: active ? 'var(--bg-card)' : 'transparent',
                color: active ? 'var(--text-1)' : 'var(--text-3)',
                fontWeight: active ? 700 : 500,
                fontSize: 13,
                transition:'all .15s',
              }}>
              {dept}
              <span style={{
                marginLeft:8, fontSize:11, fontWeight:600,
                color: active ? 'var(--accent)' : 'var(--text-3)',
              }}>({count})</span>
            </button>
          )
        })}
      </div>

      {searching && (
        <div style={{ fontSize:12, color:'var(--text-3)', marginBottom:12 }}>
          共找到 <strong>{totalFiltered}</strong> 个结果
        </div>
      )}

      {/* Content */}
      {grouped.size === 0
        ? <div style={{ textAlign:'center', padding:'60px 0', color:'var(--text-3)' }}>没有匹配的产品</div>
        : Array.from(grouped.entries()).map(([l1, l2map]) => {
            const l1Count = Array.from(l2map.values()).reduce((n, a) => n + a.length, 0)
            const isL1Open = l1Open(l1)
            return (
              <div key={l1} style={{ marginBottom:12 }}>
                {/* 一级分类 header */}
                <button onClick={() => toggleL1(l1)} style={{
                  width:'100%', display:'flex', alignItems:'center', gap:10,
                  padding:'10px 16px', borderRadius:8, cursor:'pointer', textAlign:'left',
                  background:'var(--bg-card)', border:'1px solid var(--border)',
                  marginBottom: isL1Open ? 8 : 0,
                }}>
                  <span style={{ fontSize:12, color:'var(--text-3)', width:12 }}>{isL1Open ? '▾' : '▸'}</span>
                  <span style={{ flex:1, fontWeight:700, fontSize:14, color:'var(--text-1)' }}>{l1}</span>
                  <span style={{
                    fontSize:11, fontWeight:700, background:'var(--bg)',
                    border:'1px solid var(--border)', color:'var(--text-2)',
                    padding:'1px 10px', borderRadius:20,
                  }}>{l1Count}</span>
                </button>

                {isL1Open && (
                  <div style={{ paddingLeft:16 }}>
                    {Array.from(l2map.entries()).map(([l2, skus]) => {
                      const l2Key = `${l1}||${l2}`
                      const isL2Open = l2Open(l2Key)
                      return (
                        <div key={l2} style={{ marginBottom:8 }}>
                          {/* 二级分类 header */}
                          <button onClick={() => toggleL2(l2Key)} style={{
                            width:'100%', display:'flex', alignItems:'center', gap:8,
                            padding:'7px 12px', borderRadius:6, cursor:'pointer', textAlign:'left',
                            background:'var(--bg)', border:'1px solid var(--border)',
                            marginBottom: isL2Open ? 6 : 0,
                          }}>
                            <span style={{ fontSize:11, color:'var(--text-3)', width:12 }}>{isL2Open ? '▾' : '▸'}</span>
                            <span style={{ flex:1, fontWeight:600, fontSize:13, color:'var(--text-2)' }}>{l2}</span>
                            <span style={{
                              fontSize:10, fontWeight:600, color:'var(--text-3)',
                              padding:'1px 8px', borderRadius:10,
                            }}>{skus.length}</span>
                          </button>

                          {isL2Open && (
                            <div style={{ display:'flex', flexDirection:'column', gap:6, paddingLeft:8 }}>
                              {skus.map(sku => (
                                <SkuCard
                                  key={sku.id}
                                  sku={sku}
                                  expanded={!!openSku[sku.id]}
                                  onToggle={() => toggleSku(sku.id)}
                                  base={base}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })
      }
    </div>
  )
}

const FIELD_LABELS = [
  { key: 'definition',  label: '定义' },
  { key: 'structure',   label: '业务架构说明' },
  { key: 'features',    label: '主要特点和功能' },
  { key: 'vendors',     label: '涉及供应商类别' },
  { key: 'prereqs',     label: '必备前置条件' },
  { key: 'painpoints',  label: '客户痛点 / 场景关键词' },
  { key: 'related',     label: '关联 SKU' },
  { key: 'risks',       label: '不适用场景 / 风险提示' },
]

function SkuCard({ sku, expanded, onToggle, base }) {
  const isMobile = useMobile()
  const href = sku.pageUrl ? base + sku.pageUrl : null

  const btnKnowledge = (
    <button onClick={onToggle} style={{
      flexShrink:0, display:'inline-flex', alignItems:'center', gap:4,
      padding:'5px 12px', borderRadius:6, cursor:'pointer',
      border:'1px solid var(--border)',
      background: expanded ? 'var(--bg)' : 'var(--bg-card)',
      color: expanded ? 'var(--text-1)' : 'var(--text-2)',
      fontSize:12, fontWeight:600,
    }}>
      {expanded ? '▾ 知识卡片' : '▸ 知识卡片'}
    </button>
  )

  const btnMaterial = href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{
      flexShrink:0, display:'inline-flex', alignItems:'center', gap:4,
      padding:'5px 12px', borderRadius:6,
      background:'var(--accent)', color:'#fff',
      fontSize:12, fontWeight:600, textDecoration:'none',
      border:'1px solid transparent',
    }}
      onMouseEnter={e => e.currentTarget.style.opacity='.85'}
      onMouseLeave={e => e.currentTarget.style.opacity='1'}
    >产品资料 ↗</a>
  ) : (
    <span style={{
      flexShrink:0, padding:'5px 12px', borderRadius:6,
      border:'1px solid var(--border)', color:'var(--text-3)',
      fontSize:12, fontWeight:600, cursor:'not-allowed',
    }}>产品资料</span>
  )

  return (
    <div style={{
      background:'var(--bg-card)',
      border:'1px solid var(--border)',
      borderRadius:8,
      overflow:'hidden',
    }}>
      {/* Card header */}
      <div style={{
        padding:'9px 12px',
        borderBottom: expanded ? '1px solid var(--border)' : 'none',
      }}>
        {/* Row 1: ID + Name + (desktop: English + buttons) */}
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{
            fontFamily:'monospace', fontSize:10, fontWeight:700,
            color:'var(--text-2)', background:'var(--bg)',
            border:'1px solid var(--border)',
            padding:'2px 6px', borderRadius:4, flexShrink:0,
          }}>{sku.id}</span>

          <span style={{ flex:1, fontSize:13, fontWeight:600, color:'var(--text-1)', lineHeight:1.4 }}>
            {sku.name}
          </span>

          {!isMobile && sku.engName && (
            <span style={{
              fontSize:11, color:'var(--text-3)', flexShrink:0,
              maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
            }}>{sku.engName}</span>
          )}

          {!isMobile && btnKnowledge}
          {!isMobile && btnMaterial}
        </div>

        {/* Row 2 (mobile only): buttons full width */}
        {isMobile && (
          <div style={{ display:'flex', gap:8, marginTop:8 }}>
            <div style={{ flex:1 }}>{btnKnowledge}</div>
            <div style={{ flex:1 }}>{btnMaterial}</div>
          </div>
        )}
      </div>

      {/* Expanded detail panel */}
      {expanded && (
        <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:10 }}>
          {FIELD_LABELS.map(({ key, label }) => {
            const val = sku[key]
            if (!val || val === '无' || val === 'nan') return null
            return (
              <div key={key} style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                <span style={{
                  flexShrink:0, width:148, fontSize:11, fontWeight:700,
                  color:'var(--text-3)', paddingTop:1, lineHeight:1.5,
                }}>
                  {label}
                </span>
                <span style={{ fontSize:12, color:'var(--text-1)', lineHeight:1.7, flex:1 }}>
                  {val}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
