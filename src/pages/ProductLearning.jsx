import { useState, useMemo } from 'react'
import { SKU_FULL } from '../data/skuFull'

const DEPT_COLORS = {
  '法律':    { bg:'#EFF6FF', border:'#93C5FD', color:'#1D4ED8', dot:'#3B82F6' },
  '税务':    { bg:'#F5F3FF', border:'#C4B5FD', color:'#6D28D9', dot:'#8B5CF6' },
  '资本市场': { bg:'#F0FDF4', border:'#86EFAC', color:'#15803D', dot:'#22C55E' },
}

export function ProductLearning() {
  const [activeDept, setActiveDept] = useState('法律')
  const [search, setSearch]         = useState('')
  const [openL1, setOpenL1]         = useState({})
  const [openL2, setOpenL2]         = useState({})

  const deptCounts = useMemo(() =>
    ['法律','税务','资本市场'].map(d => ({
      dept: d, count: SKU_FULL.filter(s => s.dept === d).length,
    })), [])

  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase()
    const items = SKU_FULL.filter(s =>
      s.dept === activeDept &&
      (!q || s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q) ||
             s.level1.includes(q) || s.level2.includes(q))
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

  function toggleL1(k) { setOpenL1(p => ({ ...p, [k]: p[k] === false })) }
  function toggleL2(k) { setOpenL2(p => ({ ...p, [k]: p[k] === false })) }
  function l1Open(k)   { return searching || openL1[k] !== false }
  function l2Open(k)   { return searching || openL2[k] !== false }

  const dc = DEPT_COLORS[activeDept]

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">产品学习</h1>
          <p className="page-sub">全量 SKU 知识卡片 · 共 {SKU_FULL.length} 个产品</p>
        </div>
        <input className="form-input" style={{ width:260, margin:0 }}
          placeholder="搜索编号 / 名称 / 分类…"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* BU tabs */}
      <div style={{ display:'flex', gap:10, marginBottom:24 }}>
        {deptCounts.map(({ dept, count }) => {
          const c = DEPT_COLORS[dept]
          const active = dept === activeDept
          return (
            <button key={dept} onClick={() => { setActiveDept(dept); setSearch('') }}
              style={{
                flex:1, padding:'14px 10px', borderRadius:12, textAlign:'left', cursor:'pointer',
                border: active ? `2px solid ${c.border}` : '1.5px solid var(--border)',
                background: active ? c.bg : 'var(--surface)',
                boxShadow: active ? `0 0 0 1px ${c.border}` : 'none',
                transition:'all .15s',
              }}>
              <div style={{ fontSize:22, fontWeight:800, color: active ? c.color : 'var(--text-1)' }}>{count}</div>
              <div style={{ fontSize:13, fontWeight:700, color: active ? c.color : 'var(--text-2)', marginTop:2 }}>{dept}</div>
              <div style={{ fontSize:10, color:'var(--text-3)', marginTop:1 }}>个产品</div>
            </button>
          )
        })}
      </div>

      {searching && (
        <div style={{ fontSize:12, color:'var(--text-3)', marginBottom:12 }}>
          共找到 {totalFiltered} 个结果
        </div>
      )}

      {grouped.size === 0
        ? <div style={{ textAlign:'center', padding:'60px 0', color:'var(--text-3)' }}>没有匹配的产品</div>
        : Array.from(grouped.entries()).map(([l1, l2map]) => {
            const l1Count = Array.from(l2map.values()).reduce((n, a) => n + a.length, 0)
            const l1IsOpen = l1Open(l1)
            return (
              <div key={l1} style={{ marginBottom:14 }}>
                {/* 一级分类 */}
                <button onClick={() => toggleL1(l1)} style={{
                  width:'100%', display:'flex', alignItems:'center', gap:10,
                  padding:'11px 16px', borderRadius:10, cursor:'pointer', textAlign:'left',
                  background: dc.bg, border:`1.5px solid ${dc.border}`,
                  marginBottom: l1IsOpen ? 8 : 0,
                }}>
                  <span style={{ fontSize:14, color: dc.color }}>{l1IsOpen ? '▾' : '▸'}</span>
                  <span style={{ flex:1, fontWeight:800, fontSize:14, color: dc.color }}>{l1}</span>
                  <span style={{ fontSize:11, fontWeight:700, background: dc.color, color:'#fff', padding:'2px 10px', borderRadius:20 }}>
                    {l1Count}
                  </span>
                </button>

                {l1IsOpen && (
                  <div style={{ paddingLeft:14 }}>
                    {Array.from(l2map.entries()).map(([l2, skus]) => {
                      const l2Key = `${l1}||${l2}`
                      const l2IsOpen = l2Open(l2Key)
                      return (
                        <div key={l2} style={{ marginBottom:8 }}>
                          {/* 二级分类 */}
                          <button onClick={() => toggleL2(l2Key)} style={{
                            width:'100%', display:'flex', alignItems:'center', gap:8,
                            padding:'7px 12px', borderRadius:8, cursor:'pointer', textAlign:'left',
                            background:'var(--surface)', border:'1px solid var(--border)',
                            marginBottom: l2IsOpen ? 6 : 0,
                          }}>
                            <span style={{ fontSize:12, color:'var(--text-3)' }}>{l2IsOpen ? '▾' : '▸'}</span>
                            <span style={{ width:7, height:7, borderRadius:'50%', background: dc.dot, flexShrink:0 }} />
                            <span style={{ flex:1, fontWeight:700, fontSize:13, color:'var(--text-1)' }}>{l2}</span>
                            <span style={{
                              fontSize:10, fontWeight:700, color: dc.color,
                              background: dc.bg, border:`1px solid ${dc.border}`,
                              padding:'1px 8px', borderRadius:10,
                            }}>{skus.length}</span>
                          </button>

                          {l2IsOpen && (
                            <div style={{
                              display:'grid',
                              gridTemplateColumns:'repeat(auto-fill, minmax(320px,1fr))',
                              gap:8, paddingLeft:8,
                            }}>
                              {skus.map(sku => <SkuCard key={sku.id} sku={sku} dc={dc} />)}
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

function SkuCard({ sku, dc }) {
  const idColor = sku.id.startsWith('Legal') ? '#1D4ED8'
    : (sku.id.startsWith('Tax') || sku.id.startsWith('TAX')) ? '#6D28D9'
    : '#15803D'

  const base    = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
  const href    = sku.pageUrl ? base + sku.pageUrl : null

  return (
    <div style={{
      background:'var(--surface)', border:'1px solid var(--border)',
      borderRadius:10, padding:'11px 13px',
      display:'flex', flexDirection:'column', gap:7,
      transition:'box-shadow .15s',
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow='0 2px 12px rgba(0,0,0,.1)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow=''}
    >
      <div style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
        <span style={{
          fontFamily:'monospace', fontSize:10, fontWeight:700, whiteSpace:'nowrap',
          color: idColor, background: dc.bg, border:`1px solid ${dc.border}`,
          padding:'2px 6px', borderRadius:4, flexShrink:0, marginTop:1,
        }}>{sku.id}</span>
        <span style={{ fontSize:12, fontWeight:600, color:'var(--text-1)', lineHeight:1.4 }}>
          {sku.name}
        </span>
      </div>

      {href
        ? <a href={href} target="_blank" rel="noopener noreferrer"
            style={{
              display:'inline-flex', alignItems:'center', gap:5,
              padding:'5px 12px', borderRadius:6, alignSelf:'flex-start',
              background: dc.color, color:'#fff',
              fontSize:11, fontWeight:700, textDecoration:'none',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity='.8'}
            onMouseLeave={e => e.currentTarget.style.opacity='1'}
          >
            📖 查看知识卡片 ↗
          </a>
        : <span style={{ fontSize:11, color:'var(--text-3)' }}>暂无链接</span>
      }
    </div>
  )
}
