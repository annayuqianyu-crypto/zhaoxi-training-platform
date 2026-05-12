import { useState, useEffect, useRef } from 'react'

const STORAGE_KEY = 'zx_training_materials'

function loadMaterials() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}
function saveMaterials(list) { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)) }

const TYPE_ICONS = { excel:'📊', word:'📝', pdf:'📄', link:'🔗', pptx:'📊' }
const TYPE_COLORS = {
  excel: { bg:'#F0FDF4', border:'#86EFAC', color:'#15803D' },
  word:  { bg:'#EFF6FF', border:'#93C5FD', color:'#1D4ED8' },
  pdf:   { bg:'#FEF2F2', border:'#FCA5A5', color:'#DC2626' },
  link:  { bg:'#FDF4FF', border:'#D8B4FE', color:'#7C3AED' },
  pptx:  { bg:'#FFF7ED', border:'#FDBA74', color:'#C2410C' },
}
const TYPE_LABELS = { excel:'Excel', word:'Word', pdf:'PDF', link:'网页链接', pptx:'PPTX链接' }
const ACCEPT_MAP  = { excel:'.xlsx,.xls', word:'.docx,.doc', pdf:'.pdf' }

const EMPTY_FORM = { title: '', type: 'link', url: '', desc: '', file: null, fileName: '' }

export function TrainingMaterials({ user }) {
  const [materials, setMaterials] = useState([])
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [filter, setFilter]       = useState('全部')
  const [search, setSearch]       = useState('')
  const [errors, setErrors]       = useState({})
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()

  useEffect(() => { setMaterials(loadMaterials()) }, [])

  const isAdmin = user?.role === 'admin'

  const filtered = materials.filter(m => {
    const matchType   = filter === '全部' || m.type === filter
    const matchSearch = !search || m.title.includes(search) || (m.desc || '').includes(search)
    return matchType && matchSearch
  })

  function openAdd() {
    setForm(EMPTY_FORM); setErrors({})
    setShowForm(true)
  }

  function validate() {
    const e = {}
    if (!form.title.trim()) e.title = '请填写资料名称'
    if ((form.type === 'link' || form.type === 'pptx') && !form.url.trim()) e.url = '请填写链接地址'
    if (form.type !== 'link' && form.type !== 'pptx' && !form.file && !form.fileName) e.file = '请选择文件'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const maxMB = 10
    if (file.size > maxMB * 1024 * 1024) {
      alert(`文件不能超过 ${maxMB}MB，PPTX 请使用"PPTX链接"方式上传`)
      e.target.value = ''; return
    }
    setUploading(true)
    const reader = new FileReader()
    reader.onload = ev => {
      setForm(p => ({ ...p, file: ev.target.result, fileName: file.name, title: p.title || file.name.replace(/\.[^.]+$/, '') }))
      setUploading(false)
    }
    reader.readAsDataURL(file)
  }

  function handleSubmit() {
    if (!validate()) return
    const item = {
      id: `TM-${Date.now()}`,
      title: form.title.trim(),
      type: form.type,
      desc: form.desc.trim(),
      uploadedAt: new Date().toISOString(),
      uploadedBy: user?.name || '产品中心',
      ...(form.type === 'link' || form.type === 'pptx'
        ? { url: form.url.trim() }
        : { file: form.file, fileName: form.fileName }
      )
    }
    const next = [item, ...materials]
    setMaterials(next); saveMaterials(next)
    setShowForm(false)
  }

  function handleDelete(id) {
    if (!window.confirm('确认删除该资料？')) return
    const next = materials.filter(m => m.id !== id)
    setMaterials(next); saveMaterials(next)
  }

  function handleOpen(m) {
    if (m.url) { window.open(m.url, '_blank'); return }
    if (m.file) {
      const a = document.createElement('a')
      a.href = m.file; a.download = m.fileName || m.title
      a.click()
    }
  }

  const typeCounts = materials.reduce((acc, m) => { acc[m.type] = (acc[m.type] || 0) + 1; return acc }, {})

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">培训资料库</h1>
          <p className="page-sub">内部培训文件与参考资料 · 共 {materials.length} 份</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openAdd}>＋ 上传资料</button>
        )}
      </div>

      {/* Type filter chips */}
      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
        <input
          className="form-input"
          style={{ width:200, margin:0 }}
          placeholder="搜索资料名称…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {['全部', 'excel', 'word', 'pdf', 'link', 'pptx'].map(t => {
          const count = t === '全部' ? materials.length : (typeCounts[t] || 0)
          const c = TYPE_COLORS[t] || {}
          return (
            <button key={t} onClick={() => setFilter(t)} style={{
              padding:'5px 12px', borderRadius:8, fontSize:12, fontWeight:600,
              cursor:'pointer', border: filter === t ? 'none' : `1px solid ${c.border || 'var(--border)'}`,
              background: filter === t ? (t === '全部' ? 'var(--accent)' : c.bg) : 'var(--surface)',
              color: filter === t ? (t === '全部' ? '#fff' : c.color) : 'var(--text-2)',
            }}>
              {t !== '全部' && TYPE_ICONS[t]} {t === '全部' ? '全部' : TYPE_LABELS[t]} {count > 0 && `(${count})`}
            </button>
          )
        })}
      </div>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:'var(--text-3)' }}>
          <div style={{ fontSize:32, marginBottom:12 }}>📁</div>
          <div>{materials.length === 0 ? '暂无资料，点击右上角上传' : '没有匹配的资料'}</div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
          {filtered.map(m => {
            const c = TYPE_COLORS[m.type] || TYPE_COLORS.link
            return (
              <div key={m.id} style={{
                background:'var(--surface)', border:`1px solid var(--border)`,
                borderRadius:12, padding:16, cursor:'pointer',
                transition:'box-shadow .15s, transform .15s',
                position:'relative',
              }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow='0 4px 20px rgba(0,0,0,.12)'; e.currentTarget.style.transform='translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow=''; e.currentTarget.style.transform='' }}
                onClick={() => handleOpen(m)}
              >
                {/* Type badge */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                  <span style={{
                    background: c.bg, border:`1px solid ${c.border}`,
                    color: c.color, borderRadius:6, padding:'3px 10px',
                    fontSize:11, fontWeight:700
                  }}>
                    {TYPE_ICONS[m.type]} {TYPE_LABELS[m.type]}
                  </span>
                  {isAdmin && (
                    <button
                      style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-3)', fontSize:14, padding:'0 4px' }}
                      onClick={e => { e.stopPropagation(); handleDelete(m.id) }}
                      title="删除">✕</button>
                  )}
                </div>

                <div style={{ fontWeight:700, fontSize:14, color:'var(--text-1)', marginBottom:6, lineHeight:1.4 }}>
                  {m.title}
                </div>
                {m.desc && (
                  <div style={{ fontSize:12, color:'var(--text-3)', marginBottom:8, lineHeight:1.5 }}>
                    {m.desc}
                  </div>
                )}
                {m.url && (
                  <div style={{ fontSize:11, color:'var(--text-3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:8 }}>
                    🔗 {m.url}
                  </div>
                )}
                {m.fileName && (
                  <div style={{ fontSize:11, color:'var(--text-3)', marginBottom:8 }}>
                    📎 {m.fileName}
                  </div>
                )}
                <div style={{ fontSize:11, color:'var(--text-3)', marginTop:'auto', paddingTop:8, borderTop:'1px solid var(--border)' }}>
                  {m.uploadedBy} · {new Date(m.uploadedAt).toLocaleDateString('zh-CN')}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">上传培训资料</h2>

            <div className="form-group">
              <label className="form-label">资料类型</label>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {Object.keys(TYPE_LABELS).map(t => {
                  const c = TYPE_COLORS[t]
                  const active = form.type === t
                  return (
                    <button key={t} onClick={() => setForm(p => ({ ...p, type: t, file: null, fileName: '', url: '' }))}
                      style={{
                        padding:'6px 14px', borderRadius:8, fontSize:12, fontWeight:600,
                        cursor:'pointer', border: active ? 'none' : `1px solid ${c.border}`,
                        background: active ? c.bg : 'var(--surface)',
                        color: active ? c.color : 'var(--text-2)',
                        outline: active ? `2px solid ${c.border}` : 'none',
                      }}>
                      {TYPE_ICONS[t]} {TYPE_LABELS[t]}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">资料名称 *</label>
              <input className="form-input" value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="例：2026年新人培训手册" />
              {errors.title && <div style={{ color:'#EF4444', fontSize:12, marginTop:4 }}>{errors.title}</div>}
            </div>

            {/* File or URL input */}
            {form.type === 'link' || form.type === 'pptx' ? (
              <div className="form-group">
                <label className="form-label">
                  {form.type === 'pptx' ? 'PPTX 网页链接 *（OneDrive / Google Slides / 飞书等）' : '网页链接 *'}
                </label>
                <input className="form-input" value={form.url}
                  onChange={e => setForm(p => ({ ...p, url: e.target.value }))}
                  placeholder="https://..." />
                {errors.url && <div style={{ color:'#EF4444', fontSize:12, marginTop:4 }}>{errors.url}</div>}
                {form.type === 'pptx' && (
                  <div style={{ fontSize:11, color:'var(--text-3)', marginTop:6, lineHeight:1.6 }}>
                    💡 PPTX 文件请上传至 OneDrive / 飞书云文档 / Google Drive 后粘贴分享链接
                  </div>
                )}
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">上传文件 * <span style={{ color:'var(--text-3)', fontWeight:400 }}>（最大 10MB）</span></label>
                <input ref={fileRef} type="file"
                  accept={ACCEPT_MAP[form.type] || ''}
                  onChange={handleFileChange}
                  style={{ display:'none' }} />
                <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                  <button className="btn btn-secondary"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}>
                    {uploading ? '读取中…' : '选择文件'}
                  </button>
                  {form.fileName && (
                    <span style={{ fontSize:12, color:'var(--text-2)' }}>📎 {form.fileName}</span>
                  )}
                </div>
                {errors.file && <div style={{ color:'#EF4444', fontSize:12, marginTop:4 }}>{errors.file}</div>}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">描述说明</label>
              <textarea className="form-input" rows={2} value={form.desc}
                onChange={e => setForm(p => ({ ...p, desc: e.target.value }))}
                placeholder="可选：简要说明资料用途" style={{ resize:'vertical' }} />
            </div>

            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 }}>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={uploading}>
                确认上传
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
