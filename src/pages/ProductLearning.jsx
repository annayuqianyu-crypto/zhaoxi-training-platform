import { useState, useMemo } from 'react'
import { SKU_LIST } from '../data/mock'

const DEPT_ALL = '全部'
const DEPTS = [DEPT_ALL, ...Array.from(new Set(SKU_LIST.map(s => s.dept)))]

const MATCH_LABEL = { exact: '精确匹配', fuzzy: '模糊匹配', overview: '概览资料' }
const MATCH_COLOR = { exact: { bg:'#D1FAE5', color:'#065F46' }, fuzzy: { bg:'#FEF3C7', color:'#92400E' }, overview: { bg:'#EFF6FF', color:'#1D4ED8' } }

export function ProductLearning() {
  const [search, setSearch] = useState('')
  const [dept, setDept] = useState(DEPT_ALL)
  const [expanded, setExpanded] = useState(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return SKU_LIST.filter(sku => {
      const matchDept = dept === DEPT_ALL || sku.dept === dept
      const matchQ = !q ||
        sku.name.toLowerCase().includes(q) ||
        sku.id.toLowerCase().includes(q) ||
        (sku.cat1 && sku.cat1.toLowerCase().includes(q)) ||
        (sku.cat2 && sku.cat2.toLowerCase().includes(q))
      return matchDept && matchQ
    })
  }, [search, dept])

  const BASE = `${location.origin}${location.pathname.replace(/\/[^/]*$/, '')}/courses`

  function downloadPPT(sku) {
    const url = `${BASE}/${sku.id}.pptx`
    const a = document.createElement('a')
    a.href = url
    a.download = `${sku.id}_${sku.name}.pptx`
    a.target = '_blank'
    a.click()
  }

  return (
    <>
      <div className="topbar">
        <span className="topbar-title">产品学习</span>
        <span className="topbar-sub">· 架构师产品研学中心</span>
      </div>

      <div className="content">
        <div className="page-hero">
          <h1>产品研学中心</h1>
          <p>输入产品名称或编号，调取对应 SKU 课件进行下载与学习</p>
        </div>

        {/* Search + filter bar */}
        <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
          <input
            className="form-input"
            style={{ flex:'1 1 280px', minWidth:200 }}
            placeholder="搜索产品名称、编号（如 Tax-2471、CRS…）"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div style={{ display:'flex', gap:6 }}>
            {DEPTS.map(d => (
              <button key={d}
                className={`chip-tab${dept === d ? ' active' : ''}`}
                style={{ cursor:'pointer' }}
                onClick={() => setDept(d)}>
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <div style={{ fontSize:12, color:'var(--text-3)', marginBottom:12 }}>
          共找到 <strong>{filtered.length}</strong> 条产品 · 点击卡片展开详情
        </div>

        {/* SKU cards */}
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {filtered.length === 0 && (
            <div style={{ textAlign:'center', padding:'48px', color:'var(--text-3)', fontSize:14 }}>
              未找到匹配产品，请尝试其他关键词
            </div>
          )}

          {filtered.map(sku => {
            const isOpen = expanded === sku.id
            const mc = sku.match ? MATCH_COLOR[sku.match] : { bg:'#F4F4F5', color:'#71717A' }
            const ml = sku.match ? (MATCH_LABEL[sku.match] || sku.match) : '暂无评级'
            const hasFile = sku.slides > 0

            return (
              <div key={sku.id} className="card"
                style={{ cursor:'pointer', transition:'box-shadow .15s', padding:'0' }}
                onClick={() => setExpanded(isOpen ? null : sku.id)}>

                {/* Card header */}
                <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 18px' }}>
                  <div style={{ fontFamily:'monospace', fontSize:13, fontWeight:700, color:'var(--accent)', minWidth:90, flexShrink:0 }}>
                    {sku.id}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:14, color:'var(--text-1)' }}>{sku.name}</div>
                    <div style={{ fontSize:11, color:'var(--text-3)', marginTop:2 }}>
                      {sku.dept} · {sku.cat1}{sku.cat2 ? ` / ${sku.cat2}` : ''}
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    {hasFile && (
                      <span style={{ fontSize:11, color:'var(--text-3)' }}>{sku.slides}页 / {(sku.words / 1000).toFixed(1)}K字</span>
                    )}
                    <span style={{ fontSize:11, padding:'2px 8px', borderRadius:6, background: mc.bg, color: mc.color, fontWeight:600 }}>
                      {ml}
                    </span>
                    {!hasFile && (
                      <span style={{ fontSize:11, padding:'2px 8px', borderRadius:6, background:'#F4F4F5', color:'#A1A1AA' }}>
                        待上传
                      </span>
                    )}
                    <span style={{ fontSize:12, color:'var(--text-3)' }}>{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Expanded detail */}
                {isOpen && (
                  <div style={{ borderTop:'1px solid var(--border)', padding:'16px 18px', background:'var(--bg)' }}
                    onClick={e => e.stopPropagation()}>

                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
                      {[
                        ['产品编号', sku.id],
                        ['产品名称', sku.name],
                        ['所属部门', sku.dept],
                        ['一级分类', sku.cat1],
                        ['二级分类', sku.cat2 || '—'],
                        ['课件页数', hasFile ? `${sku.slides} 页` : '待上传'],
                        ['字数估算', hasFile ? `${sku.words.toLocaleString()} 字` : '待上传'],
                        ['匹配等级', ml],
                      ].map(([label, value]) => (
                        <div key={label} style={{ fontSize:12 }}>
                          <div style={{ color:'var(--text-3)', marginBottom:2 }}>{label}</div>
                          <div style={{ color:'var(--text-1)', fontWeight:500 }}>{value}</div>
                        </div>
                      ))}
                    </div>

                    {sku.relatedCourseIds && sku.relatedCourseIds.length > 0 && (
                      <div style={{ marginBottom:14 }}>
                        <div style={{ fontSize:11, color:'var(--text-3)', marginBottom:6 }}>关联课程模块</div>
                        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                          {sku.relatedCourseIds.map(cid => (
                            <span key={cid} style={{ fontSize:11, padding:'2px 8px', borderRadius:6, background:'#EFF6FF', border:'1px solid #BFDBFE', color:'#1D4ED8' }}>
                              {cid}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                      {hasFile ? (
                        <>
                          <a href={`${BASE}/${sku.id}.pptx`} target="_blank" rel="noreferrer"
                            className="btn btn-secondary btn-sm"
                            onClick={e => e.stopPropagation()}>
                            👁 在线查看
                          </a>
                          <button className="btn btn-primary btn-sm" onClick={() => downloadPPT(sku)}>
                            ⬇️ 下载 PPT
                          </button>
                        </>
                      ) : (
                        <span style={{ fontSize:12, color:'var(--text-3)', fontStyle:'italic' }}>
                          该 SKU 课件暂未上传，请联系产品中心
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div style={{ marginTop:32, fontSize:11, color:'var(--text-3)', textAlign:'center', lineHeight:1.8 }}>
          PPT 文件存放于 <code style={{ background:'var(--bg)', padding:'2px 6px', borderRadius:4 }}>/courses/&#123;SKU编号&#125;.pptx</code><br/>
          如需上传新课件，请联系管理员或产品中心
        </div>
      </div>
    </>
  )
}
