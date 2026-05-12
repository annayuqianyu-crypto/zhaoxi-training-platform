import { useState, useEffect, useCallback } from 'react'
import { WORK_ORDERS, STATUS_COLOR, COURSE_CATALOG } from '../data/mock'
import { CONTEXT_KEY } from './CourseMatch'

const FILTERS     = ['全部','待处理','前期沟通','渠道已确认','合同签署','讲师排期','通关进行中','已归档']
const STORAGE_KEY = 'zx_pending_orders'
const OVERRIDE_KEY = 'zx_order_overrides'
const TOKEN_KEY   = 'zx_github_token'
const GITHUB_REPO = 'annayuqianyu-crypto/zhaoxi-training-platform'

/* ─── localStorage helpers ─── */
function loadLocal()  { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] } }
function saveLocal(l) { localStorage.setItem(STORAGE_KEY, JSON.stringify(l)) }
function getToken()   { return localStorage.getItem(TOKEN_KEY) || '' }
function loadOverrides() { try { return JSON.parse(localStorage.getItem(OVERRIDE_KEY) || '{}') } catch { return {} } }
function saveOverride(id, updates) {
  const ov = loadOverrides()
  ov[id] = { ...(ov[id] || {}), ...updates, updatedAt: new Date().toISOString() }
  localStorage.setItem(OVERRIDE_KEY, JSON.stringify(ov))
}
function applyOverrides(orders) {
  const ov = loadOverrides()
  return orders.map(o => ov[o.id] ? { ...o, ...ov[o.id] } : o)
}

/* ─── GitHub fetch ─── */
async function fetchGitHubOrders() {
  const token = getToken()
  if (!token) return { orders: [], needToken: true }
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/issues?labels=work-order&state=open&per_page=100`,
      { headers: { 'Accept':'application/vnd.github.v3+json', 'Authorization':`Bearer ${token}` } }
    )
    if (res.status === 401 || res.status === 403) return { orders: [], needToken: true }
    if (!res.ok) return { orders: [], needToken: false }
    const issues = await res.json()
    if (!Array.isArray(issues)) return { orders: [], needToken: false }
    const orders = issues.map(issue => {
      const m = issue.body?.match(/<!-- ZX_ORDER_JSON:(.*?) -->/)
      if (m) { try { const o = JSON.parse(m[1]); o._issueNumber = issue.number; return o } catch { return null } }
      return null
    }).filter(Boolean)
    return { orders, needToken: false }
  } catch { return { orders: [], needToken: false } }
}

/* ════════════════════════════════════════════════════════════
   Main component
════════════════════════════════════════════════════════════ */
export function WorkOrders({ navigate }) {
  const [filter, setFilter]             = useState('全部')
  const [external, setExternal]         = useState([])
  const [loading, setLoading]           = useState(true)

  const [showTokenSetup, setShowTokenSetup] = useState(false)
  const [tokenInput, setTokenInput]         = useState('')
  const [tokenError, setTokenError]         = useState('')

  const [showForm, setShowForm]     = useState(false)
  const [form, setForm]             = useState({ channel:'', contact:'', people:'', duration:'2.5小时', note:'' })
  const [submitted, setSubmitted]   = useState(null)

  const [selectedOrder, setSelectedOrder] = useState(null)

  /* ─── Load orders ─── */
  const loadAll = useCallback(async () => {
    setLoading(true)
    const [{ orders: ghOrders, needToken }, localOrders] = await Promise.all([
      fetchGitHubOrders(), Promise.resolve(loadLocal())
    ])
    if (needToken) { setShowTokenSetup(true); setLoading(false); return }
    const ghIds = new Set(ghOrders.map(o => o.id))
    setExternal(applyOverrides([...ghOrders, ...localOrders.filter(o => !ghIds.has(o.id))]))
    setLoading(false)
  }, [])

  useEffect(() => {
    loadAll()
    window.addEventListener('focus', loadAll)
    return () => window.removeEventListener('focus', loadAll)
  }, [loadAll])

  /* ─── Token ─── */
  async function saveToken() {
    const t = tokenInput.trim()
    if (!t) { setTokenError('请输入 token'); return }
    const test = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/issues?per_page=1`,
      { headers: { 'Authorization':`Bearer ${t}`, 'Accept':'application/vnd.github.v3+json' } })
    if (!test.ok) { setTokenError(`验证失败 (${test.status})`); return }
    localStorage.setItem(TOKEN_KEY, t)
    setShowTokenSetup(false); setTokenInput(''); setTokenError('')
    loadAll()
  }

  /* ─── Status advance ─── */
  function advanceOrder(order, newStatus) {
    saveOverride(order.id, { status: newStatus })
    setExternal(prev => prev.map(o => o.id === order.id ? { ...o, status: newStatus } : o))
    setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null)
  }

  /* ─── Navigate to CourseMatch with full context ─── */
  function goToCourseMatch(order) {
    const ov = loadOverrides()[order.id] || {}
    const baseEditForm = {
      channel:   order.channel   || '',
      contact:   order.contact   || '',
      salesName: order.salesName || '',
      audience:  order.audience  || '',
      jobLevel:  order.jobLevel  || '',
      people:    order.people    || '',
      duration:  order.duration  || '2.5小时',
      date:      order.date      || '',
      note:      order.note      || '',
    }
    const ctx = {
      orderId: order.id,
      order,
      editForm:            ov.editForm            || baseEditForm,
      supplementText:      ov.supplementText      || '',
      aiResult:            ov.aiResult            || null,
      editCourseIds:       ov.editCourseIds       || [],
      editOutline:         ov.editOutline         || '',
      selectedInstructors: ov.selectedInstructors || [],
    }
    localStorage.setItem(CONTEXT_KEY, JSON.stringify(ctx))
    setSelectedOrder(null)
    navigate('coursematch')
  }

  /* ─── Misc ─── */
  const allOrders    = [...external, ...WORK_ORDERS]
  const list         = filter === '全部' ? allOrders : allOrders.filter(w => w.status === filter)
  const pendingCount = external.filter(w => w.status === '待处理').length
  const H5_URL       = `${location.origin}${location.pathname.replace(/\/[^/]*$/, '')}/apply.html`

  function copyLink() { navigator.clipboard.writeText(H5_URL).then(() => alert('H5链接已复制')) }

  function submitOrder(e) {
    e.preventDefault()
    const id = 'ZX-2026-' + Date.now().toString().slice(-6)
    const order = { id, channel: form.channel, contact: form.contact,
      people: parseInt(form.people) || 0, duration: form.duration,
      date: '待定', audience: '', note: form.note, status: '待处理',
      score: null, submittedAt: new Date().toISOString(), source: 'internal' }
    saveLocal([...loadLocal(), order])
    setExternal(prev => [order, ...prev])
    setSubmitted(id)
  }

  /* ════════════════════════════════════════════════════════════
     Render
  ════════════════════════════════════════════════════════════ */
  return (
    <>
      {/* ─── Topbar ─── */}
      <div className="topbar">
        <span className="topbar-title">需求收集</span>
        <span className="topbar-sub">· M1 工单管理</span>
        <div className="topbar-actions">
          <button className="btn btn-secondary btn-sm" onClick={loadAll}>↻ 刷新</button>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowTokenSetup(true)}>⚙ Token</button>
          <button className="btn btn-secondary btn-sm" onClick={copyLink}>📋 复制H5链接</button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>+ 内部新建工单</button>
        </div>
      </div>

      <div className="content">
        <div className="page-hero">
          <h1>需求工单</h1>
          <p>渠道联系人通过H5链接提交培训需求，系统自动生成工单并编号</p>
        </div>

        <div className="alert alert-info" style={{ marginBottom:20 }}>
          <span>🔗</span>
          <div style={{ flex:1 }}>
            <strong>渠道问卷H5链接：</strong>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:4, flexWrap:'wrap' }}>
              <a href={H5_URL} target="_blank" rel="noreferrer"
                style={{ fontFamily:'monospace', fontSize:12, color:'var(--blue)', wordBreak:'break-all' }}>{H5_URL}</a>
              <button className="btn btn-ghost btn-sm" onClick={copyLink}>复制</button>
            </div>
          </div>
        </div>

        {loading && <div style={{ textAlign:'center', padding:16, color:'var(--text-3)', fontSize:13 }}>正在加载最新工单…</div>}

        {!loading && pendingCount > 0 && (
          <div className="alert" style={{ background:'#FFF7ED', border:'1px solid #FED7AA', marginBottom:20, color:'#92400E' }}>
            <span>🔔</span>
            <span>有 <strong>{pendingCount}</strong> 条新的渠道问卷待处理</span>
            <button className="btn btn-ghost btn-sm" style={{ marginLeft:'auto' }} onClick={() => setFilter('待处理')}>查看</button>
          </div>
        )}

        <div className="chip-tabs">
          {FILTERS.map(f => (
            <div key={f} className={`chip-tab${filter===f?' active':''}`} onClick={() => setFilter(f)}>
              {f}{f==='待处理' && pendingCount > 0 ? ` (${pendingCount})` : ''}
            </div>
          ))}
        </div>

        <div className="card">
          <table className="data-table">
            <thead><tr>
              <th>工单编号</th><th>渠道机构</th><th>联系人</th><th>对接销售</th>
              <th>参与类型</th><th>培训日期</th><th>人数</th><th>来源</th><th>状态</th><th>评分</th>
            </tr></thead>
            <tbody>
              {list.length === 0 && !loading && (
                <tr><td colSpan={10} style={{ textAlign:'center', color:'var(--text-3)', padding:32 }}>暂无工单</td></tr>
              )}
              {list.map(w => (
                <tr key={w.id} style={{ cursor:'pointer' }} onClick={() => setSelectedOrder(w)}>
                  <td><span style={{ fontFamily:'monospace', fontSize:12, fontWeight:600, color:'var(--accent)' }}>{w.id}</span></td>
                  <td style={{ fontWeight:500 }}>{w.channel}</td>
                  <td style={{ color:'var(--text-2)' }}>{w.contact}</td>
                  <td style={{ color:'var(--text-2)', fontSize:12 }}>{w.salesName || '—'}</td>
                  <td style={{ fontSize:12, color:'var(--text-2)' }}>{w.audience || '—'}</td>
                  <td style={{ color:'var(--text-2)', fontSize:12 }}>{w.date}</td>
                  <td style={{ textAlign:'center' }}>{w.people}人</td>
                  <td>
                    {w.source==='h5' ? <span className="badge badge-blue">H5问卷</span>
                      : w.source==='internal' ? <span className="badge badge-gray">内部</span>
                      : <span className="badge badge-gray">系统</span>}
                  </td>
                  <td><span className={`badge ${STATUS_COLOR[w.status]||'badge-gray'}`}>{w.status}</span></td>
                  <td style={{ textAlign:'center', color:w.score?'var(--accent)':'var(--text-3)', fontWeight:w.score?700:400 }}>{w.score||'—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══════════════════════════════════════
          GitHub Token setup modal
      ══════════════════════════════════════ */}
      {showTokenSetup && (
        <div className="modal-overlay" onClick={() => setShowTokenSetup(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">配置 GitHub Token</h2>
            <p className="modal-sub">用于读取渠道问卷提交，仅存储在本浏览器</p>
            <div className="form-group" style={{ marginTop:16 }}>
              <label className="form-label">GitHub Personal Access Token</label>
              <input className="form-input" type="password" value={tokenInput}
                onChange={e => { setTokenInput(e.target.value); setTokenError('') }}
                placeholder="github_pat_..." style={{ fontFamily:'monospace' }} />
              {tokenError && <div style={{ color:'#EF4444', fontSize:12, marginTop:6 }}>{tokenError}</div>}
            </div>
            <div style={{ background:'var(--bg)', borderRadius:10, padding:'12px 16px', fontSize:12, color:'var(--text-3)', lineHeight:1.7, marginBottom:16 }}>
              Token 需要 <strong>Issues: Read</strong> 权限<br/>
              创建地址：github.com/settings/tokens?type=beta
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowTokenSetup(false)}>取消</button>
              <button className="btn btn-primary" onClick={saveToken}>验证并保存</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          Order detail modal (read-only)
      ══════════════════════════════════════ */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal" style={{ maxWidth:560, maxHeight:'85vh', overflowY:'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
              <h2 className="modal-title" style={{ margin:0 }}>工单详情</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedOrder(null)}>✕</button>
            </div>
            <div style={{ fontFamily:'monospace', fontSize:13, color:'var(--accent)', fontWeight:700, marginBottom:12 }}>{selectedOrder.id}</div>
            <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
              <span className={`badge ${STATUS_COLOR[selectedOrder.status]||'badge-gray'}`}>{selectedOrder.status}</span>
              {selectedOrder.source==='h5' && <span className="badge badge-blue">H5问卷</span>}
              {selectedOrder.source==='internal' && <span className="badge badge-gray">内部录入</span>}
              {selectedOrder.score && <span className="badge badge-green">质量评分 {selectedOrder.score}</span>}
            </div>

            {[['渠道 / 机构', selectedOrder.channel],['联系人', selectedOrder.contact],
              ['对接销售', selectedOrder.salesName||'—'],['参与人员类型', selectedOrder.audience||'—'],
              ['目标受众职级', selectedOrder.jobLevel||'—'],['预计人数', selectedOrder.people ? `${selectedOrder.people} 人` : '—'],
              ['培训时长', selectedOrder.duration||'—'],['期望日期', selectedOrder.date||'—'],
              ['特殊说明', selectedOrder.note||'—'],
            ].map(([label, value]) => (
              <div key={label} style={{ display:'flex', gap:8, padding:'7px 0', borderBottom:'1px solid var(--border)', fontSize:13 }}>
                <span style={{ color:'var(--text-3)', minWidth:100, flexShrink:0 }}>{label}</span>
                <span style={{ color:'var(--text-1)', wordBreak:'break-all' }}>{value}</span>
              </div>
            ))}

            {selectedOrder.courses && selectedOrder.courses.length > 0 && (
              <div style={{ padding:'8px 0', borderBottom:'1px solid var(--border)', fontSize:13 }}>
                <div style={{ color:'var(--text-3)', marginBottom:6 }}>感兴趣的课程方向</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                  {selectedOrder.courses.map(c => (
                    <span key={c} style={{ background:'var(--bg)', border:'1px solid var(--border)', borderRadius:6, padding:'2px 8px', fontSize:12 }}>{c}</span>
                  ))}
                </div>
              </div>
            )}

            {selectedOrder.editCourseIds && selectedOrder.editCourseIds.length > 0 && (
              <div style={{ padding:'8px 0', borderBottom:'1px solid var(--border)', fontSize:13 }}>
                <div style={{ color:'var(--text-3)', marginBottom:6 }}>已匹配课程方案</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                  {COURSE_CATALOG.flatMap(s => s.courses).filter(c => selectedOrder.editCourseIds.includes(c.id)).map(c => (
                    <span key={c.id} style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:6, padding:'2px 8px', fontSize:12, color:'#1D4ED8' }}>{c.name}</span>
                  ))}
                </div>
              </div>
            )}

            {selectedOrder.painpoints && (selectedOrder.painpoints.selected?.length > 0 || selectedOrder.painpoints.other) && (
              <div style={{ padding:'8px 0', borderBottom:'1px solid var(--border)', fontSize:13 }}>
                <div style={{ color:'var(--text-3)', marginBottom:6 }}>希望解决的痛点</div>
                {selectedOrder.painpoints.selected?.map(p => (
                  <div key={p} style={{ display:'flex', gap:6, marginBottom:4 }}>
                    <span style={{ color:'var(--accent)' }}>✓</span>
                    <span style={{ color:'var(--text-1)' }}>{p}</span>
                  </div>
                ))}
                {selectedOrder.painpoints.other && <div style={{ color:'var(--text-2)', fontSize:12, marginTop:4 }}>其他：{selectedOrder.painpoints.other}</div>}
              </div>
            )}

            {selectedOrder.submittedAt && (
              <div style={{ fontSize:11, color:'var(--text-3)', marginTop:10, textAlign:'right' }}>
                提交于 {new Date(selectedOrder.submittedAt).toLocaleString('zh-CN')}
              </div>
            )}

            <div style={{ display:'flex', gap:10, marginTop:16, justifyContent:'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>关闭</button>
              {selectedOrder.status === '待处理' && (
                <button className="btn btn-primary" onClick={() => advanceOrder(selectedOrder, '前期沟通')}>推进沟通 →</button>
              )}
              {selectedOrder.status === '前期沟通' && (
                <button className="btn btn-primary" onClick={() => goToCourseMatch(selectedOrder)}>前往课程匹配 →</button>
              )}
              {selectedOrder.status === '渠道已确认' && (
                <button className="btn btn-primary" onClick={() => advanceOrder(selectedOrder, '合同签署')}>进入合同签署 →</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          Internal create modal
      ══════════════════════════════════════ */}
      {showForm && !submitted && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">内部新建工单</h2>
            <p className="modal-sub">由管理员代为录入，来源标记为「内部」</p>
            <form onSubmit={submitOrder}>
              <div className="form-group">
                <label className="form-label">渠道/机构名称 *</label>
                <input className="form-input" value={form.channel} onChange={e => setForm({ ...form, channel:e.target.value })} placeholder="如：招商银行上海分行" required />
              </div>
              <div className="two-col">
                <div className="form-group">
                  <label className="form-label">联系人姓名 *</label>
                  <input className="form-input" value={form.contact} onChange={e => setForm({ ...form, contact:e.target.value })} placeholder="姓名" required />
                </div>
                <div className="form-group">
                  <label className="form-label">预计人数 *</label>
                  <input className="form-input" type="number" value={form.people} onChange={e => setForm({ ...form, people:e.target.value })} placeholder="人数" required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">培训时长</label>
                <select className="form-select" value={form.duration} onChange={e => setForm({ ...form, duration:e.target.value })}>
                  <option>2.5小时（默认）</option><option>半天（4小时）</option><option>全天</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">特殊场景说明（选填）</label>
                <textarea className="form-textarea" value={form.note} onChange={e => setForm({ ...form, note:e.target.value })} placeholder="如：高净值客户专场、内部分享会…" />
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>取消</button>
                <button type="submit" className="btn btn-primary">创建工单</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {submitted && (
        <div className="modal-overlay" onClick={() => { setShowForm(false); setSubmitted(null) }}>
          <div className="modal" style={{ textAlign:'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize:48, marginBottom:16 }}>✅</div>
            <h2 className="modal-title">工单已创建</h2>
            <p className="modal-sub">已进入「待处理」列表</p>
            <div style={{ background:'var(--bg)', borderRadius:10, padding:'16px 24px', margin:'16px 0' }}>
              <div style={{ fontSize:11, color:'var(--text-3)', marginBottom:4 }}>工单编号</div>
              <div style={{ fontFamily:'monospace', fontSize:20, fontWeight:700, color:'var(--accent)' }}>{submitted}</div>
            </div>
            <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center' }}
              onClick={() => { setShowForm(false); setSubmitted(null) }}>关闭</button>
          </div>
        </div>
      )}
    </>
  )
}
