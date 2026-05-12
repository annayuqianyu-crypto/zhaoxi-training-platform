import { useState, useEffect } from 'react'

const STORAGE_KEY = 'zx_internal_ledger'

function loadRecords() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}
function saveRecords(list) { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)) }

const DEPT_OPTIONS = ['产品中心','销售团队','市场部','运营部','技术部','财务部','人力资源','合规法务','高管层','其他']

const EMPTY_FORM = { dept: '', name: '', content: '', date: '', note: '' }

export function InternalLedger({ user }) {
  const [records, setRecords] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)
  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState('全部')
  const [errors, setErrors] = useState({})

  useEffect(() => { setRecords(loadRecords()) }, [])

  const isAdmin = user?.role === 'admin'

  const filtered = records.filter(r => {
    const matchDept = filterDept === '全部' || r.dept === filterDept
    const matchSearch = !search || r.name.includes(search) || r.content.includes(search) || r.dept.includes(search)
    return matchDept && matchSearch
  })

  function openCreate() {
    setForm(EMPTY_FORM); setEditId(null); setErrors({})
    setShowForm(true)
  }

  function openEdit(r) {
    setForm({ dept: r.dept, name: r.name, content: r.content, date: r.date, note: r.note || '' })
    setEditId(r.id); setErrors({})
    setShowForm(true)
  }

  function validate() {
    const e = {}
    if (!form.dept) e.dept = '请选择部门'
    if (!form.name.trim()) e.name = '请填写姓名'
    if (!form.content.trim()) e.content = '请填写参训内容'
    if (!form.date) e.date = '请选择参训时间'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!validate()) return
    let next
    if (editId) {
      next = records.map(r => r.id === editId
        ? { ...r, ...form, updatedAt: new Date().toISOString() }
        : r
      )
    } else {
      const newRec = {
        id: `IL-${Date.now()}`,
        ...form,
        createdAt: new Date().toISOString(),
        createdBy: user?.name || '产品中心',
      }
      next = [newRec, ...records]
    }
    setRecords(next); saveRecords(next)
    setShowForm(false)
  }

  function handleDelete(id) {
    if (!window.confirm('确认删除该参训记录？')) return
    const next = records.filter(r => r.id !== id)
    setRecords(next); saveRecords(next)
  }

  const depts = ['全部', ...new Set(records.map(r => r.dept).filter(Boolean))]

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">内训台账</h1>
          <p className="page-sub">产品中心维护内部参训记录 · 共 {records.length} 条</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openCreate}>＋ 新建参训工单</button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:20, flexWrap:'wrap' }}>
        <input
          className="form-input"
          style={{ width:220, margin:0 }}
          placeholder="搜索姓名 / 内容 / 部门…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {depts.map(d => (
            <button key={d}
              onClick={() => setFilterDept(d)}
              style={{
                padding:'4px 12px', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer', border:'none',
                background: filterDept === d ? 'var(--accent)' : 'var(--surface)',
                color: filterDept === d ? '#fff' : 'var(--text-2)',
              }}>
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:'var(--text-3)' }}>
          <div style={{ fontSize:32, marginBottom:12 }}>📋</div>
          <div>{records.length === 0 ? '暂无参训记录，点击右上角新建' : '没有匹配的记录'}</div>
        </div>
      ) : (
        <div style={{ background:'var(--surface)', borderRadius:12, overflow:'hidden', border:'1px solid var(--border)' }}>
          {/* Table header */}
          <div style={{
            display:'grid', gridTemplateColumns:'1fr 100px 2fr 120px 120px',
            padding:'10px 16px', background:'var(--bg)',
            fontSize:11, fontWeight:700, color:'var(--text-3)', letterSpacing:'.08em', textTransform:'uppercase',
            borderBottom:'1px solid var(--border)'
          }}>
            <span>参训内容</span>
            <span>姓名</span>
            <span>部门</span>
            <span>参训时间</span>
            <span style={{ textAlign:'right' }}>操作</span>
          </div>

          {filtered.map((r, i) => (
            <div key={r.id} style={{
              display:'grid', gridTemplateColumns:'1fr 100px 2fr 120px 120px',
              padding:'14px 16px', alignItems:'center',
              borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
              transition:'background .15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background='var(--bg)'}
              onMouseLeave={e => e.currentTarget.style.background=''}
            >
              <div>
                <div style={{ fontWeight:600, fontSize:13, color:'var(--text-1)', marginBottom:2 }}>{r.content}</div>
                {r.note && <div style={{ fontSize:11, color:'var(--text-3)' }}>{r.note}</div>}
              </div>
              <div style={{ fontSize:13, color:'var(--text-1)' }}>{r.name}</div>
              <div>
                <span style={{
                  display:'inline-block', background:'var(--bg)', border:'1px solid var(--border)',
                  borderRadius:6, padding:'2px 8px', fontSize:11, color:'var(--text-2)'
                }}>{r.dept}</span>
              </div>
              <div style={{ fontSize:12, color:'var(--text-2)' }}>{r.date}</div>
              <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
                {isAdmin && (
                  <>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(r)}>编辑</button>
                    <button className="btn btn-ghost btn-sm"
                      style={{ color:'#EF4444' }}
                      onClick={() => handleDelete(r.id)}>删除</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      {records.length > 0 && (
        <div style={{ display:'flex', gap:12, marginTop:20, flexWrap:'wrap' }}>
          {DEPT_OPTIONS.filter(d => records.some(r => r.dept === d)).map(d => {
            const count = records.filter(r => r.dept === d).length
            return (
              <div key={d} style={{
                background:'var(--surface)', border:'1px solid var(--border)',
                borderRadius:10, padding:'10px 16px', fontSize:12, minWidth:100, textAlign:'center'
              }}>
                <div style={{ fontWeight:700, fontSize:18, color:'var(--accent)', marginBottom:2 }}>{count}</div>
                <div style={{ color:'var(--text-3)' }}>{d}</div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">{editId ? '编辑参训记录' : '新建参训工单'}</h2>

            <div className="form-group">
              <label className="form-label">部门 *</label>
              <select className="form-input" value={form.dept}
                onChange={e => setForm(p => ({ ...p, dept: e.target.value }))}>
                <option value="">请选择部门</option>
                {DEPT_OPTIONS.map(d => <option key={d}>{d}</option>)}
              </select>
              {errors.dept && <div style={{ color:'#EF4444', fontSize:12, marginTop:4 }}>{errors.dept}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">姓名 *</label>
              <input className="form-input" value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="参训人员姓名" />
              {errors.name && <div style={{ color:'#EF4444', fontSize:12, marginTop:4 }}>{errors.name}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">参训内容 *</label>
              <input className="form-input" value={form.content}
                onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                placeholder="例：朝曦家族办公室服务体系介绍" />
              {errors.content && <div style={{ color:'#EF4444', fontSize:12, marginTop:4 }}>{errors.content}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">参训时间 *</label>
              <input className="form-input" type="date" value={form.date}
                onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
              {errors.date && <div style={{ color:'#EF4444', fontSize:12, marginTop:4 }}>{errors.date}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">备注</label>
              <textarea className="form-input" rows={2} value={form.note}
                onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
                placeholder="可选：补充说明" style={{ resize:'vertical' }} />
            </div>

            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 }}>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleSubmit}>
                {editId ? '保存修改' : '创建工单'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
