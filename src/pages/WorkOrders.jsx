import { useState, useEffect, useCallback } from 'react'
import mammoth from 'mammoth'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType } from 'docx'
import { WORK_ORDERS, STATUS_COLOR, COURSE_CATALOG, SKU_LIST, INSTRUCTORS } from '../data/mock'
import { COURSE_UNITS } from '../data/courseUnits'

const FILTERS     = ['全部','待处理','前期沟通','渠道已确认','合同签署','讲师排期','通关进行中','已归档']
const STORAGE_KEY = 'zx_pending_orders'
const OVERRIDE_KEY = 'zx_order_overrides'
const TOKEN_KEY   = 'zx_github_token'
const GITHUB_REPO = 'annayuqianyu-crypto/zhaoxi-training-platform'

/* ─── DeepSeek API 配置（公司后台） ─── */
const DS_API_URL   = 'https://api.deepseek.com/v1/chat/completions'
const DS_API_KEY   = 'sk-603a729e51d54a82bf8b8de3e06530b4'
const DS_MODEL     = 'deepseek-chat'

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

/* ─── Course / SKU helpers ─── */
function buildOutline(courseIds) {
  const lines = []
  const units = COURSE_UNITS.filter(u => courseIds.includes(u.id))
  for (const u of units) {
    lines.push(`【${u.series}】`)
    lines.push(`▌ ${u.unit}：${u.course}`)
    if (u.outline) {
      u.outline.split('\n').filter(l => l.trim()).forEach(l => lines.push(`  ${l}`))
    }
    lines.push('')
  }
  return lines.join('\n').trim()
}

function getMatchedSKUs(courseIds) {
  if (!courseIds.length) return []
  return SKU_LIST.filter(s => s.relatedCourseIds?.some(id => courseIds.includes(id)))
}

function generateConfirmLink(order, editForm, courseIds, outline) {
  const selectedCourses = COURSE_UNITS
    .filter(u => courseIds.includes(u.id))
    .map(u => ({ id: u.id, name: u.course, series: u.series }))
  const proposal = {
    id: order.id, channel: editForm.channel || order.channel,
    contact: editForm.contact || order.contact, salesName: editForm.salesName || order.salesName,
    people: editForm.people || order.people, duration: editForm.duration || order.duration,
    date: editForm.date || order.date, audience: editForm.audience || order.audience,
    courses: selectedCourses, outline, proposedAt: new Date().toISOString(),
  }
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(proposal))))
  const base = `${location.origin}${location.pathname.replace(/\/[^/]*$/, '')}/confirm.html`
  return `${base}?proposal=${encoded}`
}

function generateInstructorLink(order, editForm, courseIds, outline, supplementText, selectedInstructors) {
  const selectedCourses = COURSE_UNITS
    .filter(u => courseIds.includes(u.id))
    .map(u => ({ id: u.id, name: u.course, series: u.series }))
  const matchedSKUs = getMatchedSKUs(courseIds).map(s => ({ id: s.id, name: s.name, match: s.match, pageUrl: s.pageUrl }))
  const instructorNames = INSTRUCTORS.filter(i => selectedInstructors.includes(i.id)).map(i => i.name)
  const ref = {
    id: order.id, channel: editForm.channel || order.channel,
    contact: editForm.contact || order.contact, salesName: editForm.salesName || order.salesName,
    audience: editForm.audience || order.audience, jobLevel: editForm.jobLevel || order.jobLevel,
    people: editForm.people || order.people, duration: editForm.duration || order.duration,
    date: editForm.date || order.date,
    painpoints: order.painpoints,
    note: editForm.note || order.note,
    supplementText,
    courses: selectedCourses, outline, skus: matchedSKUs,
    instructors: instructorNames, generatedAt: new Date().toISOString(),
  }
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(ref))))
  const base = `${location.origin}${location.pathname.replace(/\/[^/]*$/, '')}/instructor.html`
  return `${base}?ref=${encoded}`
}

/* ─── AI analysis ─── */
function buildAIPrompt(order, editForm, supplementText) {
  const catalogText = COURSE_CATALOG.map(s =>
    s.courses.map(c => `${c.id} · ${c.name} · 痛点：${c.painpoint} · 受众：${c.audience}`).join('\n')
  ).join('\n')
  const painpoints = order.painpoints?.selected?.join('、') || ''
  return `你是朝曦家族办公室的专业培训顾问。请根据以下渠道培训需求，从课程库中匹配最合适的Top 3课程，给出针对性建议。

## 渠道需求
渠道：${editForm.channel || order.channel} | 参与人员：${editForm.audience || order.audience || '—'} | 职级：${editForm.jobLevel || order.jobLevel || '—'}
人数：${editForm.people || order.people || '—'}人 | 时长：${editForm.duration || order.duration || '—'} | 日期：${editForm.date || order.date || '—'}
痛点：${painpoints || '—'}
补充信息：${supplementText || '（无）'}

## 课程库（44门 · 6大系列）
${catalogText}

严格返回JSON，不含任何其他文字：
{"top3":[{"id":"C1-01","name":"课程名","seriesName":"所属系列全名","score":92,"reason":"2-3句匹配理由"}],"suggestions":"整体改进建议100字以内"}`
}

async function callDeepSeekAPI(prompt) {
  const res = await fetch(DS_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DS_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: DS_MODEL,
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) { const e = await res.json(); throw new Error(e.error?.message || `API Error ${res.status}`) }
  const data = await res.json()
  const text = data.choices?.[0]?.message?.content || ''
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('AI返回格式异常')
  return JSON.parse(match[0])
}

/* ─── Word doc download ─── */
async function downloadWordDoc(order, editForm, courseIds, outline) {
  const matchedSKUs = getMatchedSKUs(courseIds)
  const borderStyle = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' }
  const borders = { top: borderStyle, bottom: borderStyle, left: borderStyle, right: borderStyle }
  const cellPad = { top: 80, bottom: 80, left: 120, right: 120 }

  const doc = new Document({
    sections: [{
      properties: { page: { size:{ width:12240, height:15840 }, margin:{ top:1440, right:1440, bottom:1440, left:1440 } } },
      children: [
        new Paragraph({ heading: HeadingLevel.HEADING_1, spacing:{ after:200 },
          children:[new TextRun({ text:'朝曦培训方案资料包', font:'Arial', size:36, bold:true, color:'2D6A4F' })] }),
        new Paragraph({ spacing:{ after:100 },
          children:[new TextRun({ text:`工单：${order.id}　渠道：${editForm.channel || order.channel}　联系人：${editForm.contact || order.contact}`, font:'Arial', size:22, color:'444444' })] }),
        new Paragraph({ spacing:{ after:80 },
          children:[new TextRun({ text:`人数：${editForm.people || order.people || '—'}人　时长：${editForm.duration || '—'}　日期：${editForm.date || '—'}`, font:'Arial', size:22, color:'444444' })] }),
        new Paragraph({ spacing:{ after:400 },
          children:[new TextRun({ text:`生成时间：${new Date().toLocaleString('zh-CN')}`, font:'Arial', size:20, color:'888888' })] }),
        new Paragraph({ heading: HeadingLevel.HEADING_2, spacing:{ before:240, after:160 },
          children:[new TextRun({ text:'一、课程方案课纲目录', font:'Arial', size:28, bold:true })] }),
        ...(outline ? outline.split('\n').map(line =>
          new Paragraph({ spacing:{ after:60 },
            children:[new TextRun({ text: line, font:'Courier New', size:20,
              color: line.startsWith('【') ? '2D6A4F' : line.startsWith('▌') ? '18181B' : '71717A' })] })
        ) : [new Paragraph({ children:[new TextRun({ text:'（暂无课纲）', font:'Arial', size:20, color:'A1A1AA' })] })]),
        new Paragraph({ heading: HeadingLevel.HEADING_2, spacing:{ before:400, after:200 },
          children:[new TextRun({ text:`二、推荐参考 SKU 产品列表（共 ${matchedSKUs.length} 条）`, font:'Arial', size:28, bold:true })] }),
        ...(matchedSKUs.length === 0
          ? [new Paragraph({ children:[new TextRun({ text:'请先选择课程以匹配SKU', font:'Arial', size:20, color:'A1A1AA' })] })]
          : [new Table({
              width:{ size:9200, type:WidthType.DXA }, columnWidths:[1800,3000,1400,800,1200],
              rows:[
                new TableRow({ tableHeader:true, children:
                  ['产品编号','产品名称','所属部门','页数','匹配程度'].map((h,i) =>
                    new TableCell({ borders, width:{ size:[1800,3000,1400,800,1200][i], type:WidthType.DXA },
                      margins: cellPad, shading:{ fill:'2D6A4F', type:ShadingType.CLEAR },
                      children:[new Paragraph({ children:[new TextRun({ text:h, font:'Arial', size:22, bold:true, color:'FFFFFF' })] })] })
                  )
                }),
                ...matchedSKUs.map(s => new TableRow({ children: [
                  new TableCell({ borders, width:{ size:1800, type:WidthType.DXA }, margins:cellPad, children:[new Paragraph({ children:[new TextRun({ text:s.id, font:'Arial', size:20 })] })] }),
                  new TableCell({ borders, width:{ size:3000, type:WidthType.DXA }, margins:cellPad, children:[new Paragraph({ children:[new TextRun({ text:s.name, font:'Arial', size:20, bold:true })] })] }),
                  new TableCell({ borders, width:{ size:1400, type:WidthType.DXA }, margins:cellPad, children:[new Paragraph({ children:[new TextRun({ text:s.dept, font:'Arial', size:20 })] })] }),
                  new TableCell({ borders, width:{ size:800,  type:WidthType.DXA }, margins:cellPad, children:[new Paragraph({ children:[new TextRun({ text:s.slides ? `${s.slides}页` : '待更新', font:'Arial', size:20 })] })] }),
                  new TableCell({ borders, width:{ size:1200, type:WidthType.DXA }, margins:cellPad, children:[new Paragraph({ children:[new TextRun({ text: s.match==='exact'?'精确匹配':s.match==='fuzzy'?'模糊匹配':'参考资料', font:'Arial', size:20 })] })] }),
                ]}))
              ]
            })]
        ),
        new Paragraph({ spacing:{ before:400 },
          children:[new TextRun({ text:'本文档由朝曦培训管理中台自动生成，如有疑问请联系产品中心。', font:'Arial', size:18, color:'A1A1AA', italics:true })] }),
      ]
    }]
  })
  const blob = await Packer.toBlob(doc)
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url
  a.download = `朝曦培训方案_${order.id}_${new Date().toLocaleDateString('zh-CN').replace(/\//g,'')}.docx`
  a.click()
  URL.revokeObjectURL(url)
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
  // List state
  const [filter, setFilter]             = useState('全部')
  const [external, setExternal]         = useState([])
  const [loading, setLoading]           = useState(true)

  // Token setup
  const [showTokenSetup, setShowTokenSetup] = useState(false)
  const [tokenInput, setTokenInput]         = useState('')
  const [tokenError, setTokenError]         = useState('')


  // Internal create form
  const [showForm, setShowForm]     = useState(false)
  const [form, setForm]             = useState({ channel:'', contact:'', people:'', duration:'2.5小时', note:'' })
  const [submitted, setSubmitted]   = useState(null)

  // Detail modal
  const [selectedOrder, setSelectedOrder] = useState(null)

  // Edit modal
  const [editOrder, setEditOrder]               = useState(null)
  const [editTab, setEditTab]                   = useState('analysis')
  const [editForm, setEditForm]                 = useState({})
  const [editCourseIds, setEditCourseIds]       = useState([])
  const [editOutline, setEditOutline]           = useState('')
  const [supplementText, setSupplementText]     = useState('')
  const [aiLoading, setAiLoading]               = useState(false)
  const [aiResult, setAiResult]                 = useState(null)
  const [aiError, setAiError]                   = useState('')
  const [selectedInstructors, setSelectedInstructors] = useState([])
  const [confirmLink, setConfirmLink]           = useState('')
  const [confirmLinkCopied, setConfirmLinkCopied] = useState(false)
  const [instructorLink, setInstructorLink]     = useState('')
  const [instructorLinkCopied, setInstructorLinkCopied] = useState(false)
  const [wordGenerating, setWordGenerating]     = useState(false)
  const [expandedCourses, setExpandedCourses]   = useState(new Set())

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

  /* ─── Open edit modal ─── */
  function openEdit(order) {
    const ov = loadOverrides()[order.id] || {}
    setEditOrder(order)
    setEditTab('analysis')
    setEditForm({
      channel:   order.channel   || '',
      contact:   order.contact   || '',
      salesName: order.salesName || '',
      audience:  order.audience  || '',
      jobLevel:  order.jobLevel  || '',
      people:    order.people    || '',
      duration:  order.duration  || '2.5小时',
      date:      order.date      || '',
      note:      order.note      || '',
    })
    const ids = ov.editCourseIds || []
    setEditCourseIds(ids)
    setEditOutline(ov.editOutline || (ids.length ? buildOutline(ids) : ''))
    setSupplementText(ov.supplementText || '')
    setAiResult(ov.aiResult || null)
    setAiError('')
    setSelectedInstructors(ov.selectedInstructors || [])
    setConfirmLink(''); setConfirmLinkCopied(false)
    setInstructorLink(''); setInstructorLinkCopied(false)
    setSelectedOrder(null)
  }

  /* ─── Course toggle ─── */
  function toggleCourse(id) {
    setEditCourseIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      setEditOutline(buildOutline(next))
      return next
    })
  }

  /* ─── Save draft ─── */
  function saveEdit() {
    const updates = { ...editForm, editCourseIds, editOutline, supplementText, aiResult, selectedInstructors, status: editOrder.status }
    saveOverride(editOrder.id, updates)
    setExternal(prev => prev.map(o => o.id === editOrder.id ? { ...o, ...updates } : o))
    alert('✅ 已保存')
  }

  /* ─── File upload (.docx) ─── */
  async function handleFileUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.extractRawText({ arrayBuffer })
      setSupplementText(prev => (prev ? prev + '\n\n' : '') + result.value.trim())
    } catch {
      alert('文件读取失败，请确保是有效的 .docx 文件')
    }
    e.target.value = ''
  }

  /* ─── AI analysis ─── */
  async function analyzeWithAI() {
    setAiLoading(true); setAiError('')
    try {
      const prompt = buildAIPrompt(editOrder, editForm, supplementText)
      const result = await callDeepSeekAPI(prompt)
      setAiResult(result)
      saveOverride(editOrder.id, { aiResult: result, supplementText })
      // 分析完成后自动跳转到课程方案 Tab
      setEditTab('courses')
    } catch (e) {
      setAiError(e.message || 'AI 分析失败，请稍后重试')
    } finally {
      setAiLoading(false)
    }
  }

  /* ─── Links ─── */
  function genConfirmLink() {
    const link = generateConfirmLink(editOrder, editForm, editCourseIds, editOutline)
    setConfirmLink(link)
    navigator.clipboard.writeText(link).then(() => {
      setConfirmLinkCopied(true); setTimeout(() => setConfirmLinkCopied(false), 3000)
    })
  }

  function genInstructorLink() {
    const link = generateInstructorLink(editOrder, editForm, editCourseIds, editOutline, supplementText, selectedInstructors)
    setInstructorLink(link)
    navigator.clipboard.writeText(link).then(() => {
      setInstructorLinkCopied(true); setTimeout(() => setInstructorLinkCopied(false), 3000)
    })
  }

  /* ─── Instructor toggle ─── */
  function toggleInstructor(id) {
    setSelectedInstructors(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  /* ─── Misc ─── */
  const allOrders  = [...external, ...WORK_ORDERS]
  const list       = filter === '全部' ? allOrders : allOrders.filter(w => w.status === filter)
  const pendingCount = external.filter(w => w.status === '待处理').length
  const H5_URL     = `${location.origin}${location.pathname.replace(/\/[^/]*$/, '')}/apply.html`

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

  /* ════════════════ SKU list sub-component ════════════════ */
  function MatchedSKUs({ courseIds }) {
    const skus = getMatchedSKUs(courseIds)
    if (!courseIds.length) return null
    return (
      <div style={{ background:'var(--bg)', borderRadius:12, padding:'16px', marginBottom:16 }}>
        <div style={{ fontSize:11, fontWeight:700, color:'var(--text-3)', letterSpacing:'.08em', marginBottom:8 }}>
          推荐参考 SKU 产品列表 <span style={{ fontWeight:400 }}>共 {skus.length} 条匹配</span>
        </div>
        {skus.length === 0
          ? <div style={{ color:'var(--text-3)', fontSize:12 }}>当前课程暂无匹配 SKU</div>
          : skus.map(sku => (
            <div key={sku.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px',
              background:'var(--card)', border:'1px solid var(--border)', borderRadius:8, fontSize:12, marginBottom:6 }}>
              <span style={{ fontFamily:'monospace', fontSize:11, color:'var(--accent)', minWidth:90, flexShrink:0 }}>{sku.id}</span>
              {sku.pageUrl
                ? <a href={sku.pageUrl} target="_blank" rel="noreferrer"
                    style={{ fontWeight:600, flex:1, color:'var(--blue)', textDecoration:'none' }}>{sku.name}</a>
                : <span style={{ fontWeight:600, flex:1, color:'var(--text-1)' }}>{sku.name}</span>}
              <span style={{ fontSize:11, color:'var(--text-3)', minWidth:40 }}>{sku.dept}</span>
              {sku.slides > 0 && <span style={{ fontSize:11, color:'var(--text-3)' }}>{sku.slides}页</span>}
              <span style={{ fontSize:11, padding:'2px 6px', borderRadius:4, flexShrink:0,
                background: sku.match==='exact'?'#D1FAE5':sku.match==='fuzzy'?'#FEF3C7':'#EFF6FF',
                color: sku.match==='exact'?'#065F46':sku.match==='fuzzy'?'#92400E':'#1D4ED8' }}>
                {sku.match==='exact'?'精确匹配':sku.match==='fuzzy'?'模糊匹配':'参考资料'}
              </span>
            </div>
          ))
        }
      </div>
    )
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
          Order detail modal
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
                <button className="btn btn-primary" onClick={() => openEdit(selectedOrder)}>✏️ 编辑课程方案</button>
              )}
              {selectedOrder.status === '渠道已确认' && (
                <button className="btn btn-primary" onClick={() => advanceOrder(selectedOrder, '合同签署')}>进入合同签署 →</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          Edit modal — 3 Tabs
      ══════════════════════════════════════ */}
      {editOrder && (
        <div className="modal-overlay" onClick={() => setEditOrder(null)}>
          <div className="modal" style={{ maxWidth:760, maxHeight:'94vh', overflowY:'auto', padding:0 }} onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px 0' }}>
              <div>
                <h2 className="modal-title" style={{ margin:0 }}>编辑课程方案</h2>
                <div style={{ fontFamily:'monospace', fontSize:12, color:'var(--accent)', marginTop:4 }}>{editOrder.id}</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditOrder(null)}>✕</button>
            </div>

            {/* Tab nav */}
            <div style={{ display:'flex', gap:0, borderBottom:'1px solid var(--border)', padding:'0 24px', marginTop:16 }}>
              {[['analysis','📋 需求分析'],['courses','📚 课程方案'],['send','📨 发送方案']].map(([id, label]) => (
                <button key={id} onClick={() => setEditTab(id)} style={{
                  padding:'10px 18px', fontSize:13, fontWeight: editTab===id ? 700 : 400,
                  border:'none', background:'none', cursor:'pointer', fontFamily:'inherit',
                  color: editTab===id ? 'var(--accent)' : 'var(--text-3)',
                  borderBottom: editTab===id ? '2px solid var(--accent)' : '2px solid transparent',
                  marginBottom:-1,
                }}>{label}</button>
              ))}
            </div>

            <div style={{ padding:'20px 24px 24px' }}>

              {/* ─────────────────── TAB 1: 需求分析 ─────────────────── */}
              {editTab === 'analysis' && (
                <>
                  {/* Basic info (read-only summary) */}
                  <details style={{ marginBottom:16 }}>
                    <summary style={{ fontSize:11, fontWeight:700, color:'var(--text-3)', letterSpacing:'.08em', cursor:'pointer', padding:'10px 14px', background:'var(--bg)', borderRadius:8 }}>
                      原始问卷信息（点击展开）
                    </summary>
                    <div style={{ padding:'12px 14px', background:'var(--bg)', borderRadius:'0 0 8px 8px', borderTop:'1px solid var(--border)' }}>
                      {[['渠道/机构', editOrder.channel],['联系人', editOrder.contact],
                        ['对接销售', editOrder.salesName||'—'],['参与人员类型', editOrder.audience||'—'],
                        ['目标受众职级', editOrder.jobLevel||'—'],['预计人数', editOrder.people ? `${editOrder.people}人` : '—'],
                        ['培训时长', editOrder.duration||'—'],['期望日期', editOrder.date||'—'],
                        ['特殊说明', editOrder.note||'—'],
                      ].map(([label, value]) => (
                        <div key={label} style={{ display:'flex', gap:8, padding:'5px 0', fontSize:12 }}>
                          <span style={{ color:'var(--text-3)', minWidth:90, flexShrink:0 }}>{label}</span>
                          <span style={{ color:'var(--text-1)' }}>{value}</span>
                        </div>
                      ))}
                      {editOrder.painpoints?.selected?.length > 0 && (
                        <div style={{ marginTop:8, fontSize:12 }}>
                          <span style={{ color:'var(--text-3)' }}>痛点：</span>
                          {editOrder.painpoints.selected.map(p => (
                            <span key={p} style={{ display:'inline-block', background:'#FEF3C7', color:'#92400E', borderRadius:4, padding:'1px 6px', fontSize:11, margin:'2px 3px' }}>{p}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </details>

                  {/* Supplement text */}
                  <div style={{ background:'var(--bg)', borderRadius:12, padding:'16px', marginBottom:16 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:'var(--text-3)', letterSpacing:'.08em', marginBottom:8 }}>
                      补充信息 / 会议纪要
                    </div>
                    <textarea value={supplementText} onChange={e => setSupplementText(e.target.value)}
                      style={{ width:'100%', height:120, padding:'10px 12px', border:'1.5px solid var(--border)',
                        borderRadius:10, fontFamily:'inherit', fontSize:13, lineHeight:1.7,
                        background:'#fff', color:'var(--text-1)', resize:'vertical', outline:'none' }}
                      placeholder="粘贴会议纪要或补充说明…" />
                    <div style={{ marginTop:8 }}>
                      <label style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:12,
                        color:'var(--text-2)', cursor:'pointer', padding:'6px 12px',
                        border:'1px solid var(--border)', borderRadius:8, background:'var(--card)' }}>
                        📎 上传 Word 文件（.docx）
                        <input type="file" accept=".docx" style={{ display:'none' }} onChange={handleFileUpload} />
                      </label>
                    </div>
                  </div>

                  {/* AI analysis button */}
                  <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center', marginBottom:16 }}
                    onClick={analyzeWithAI} disabled={aiLoading}>
                    {aiLoading ? '⏳ AI 分析中，请稍候…' : '🤖 AI 分析需求 · 匹配 Top 3 课程'}
                  </button>

                  {aiError && (
                    <div style={{ background:'#FEF2F2', border:'1px solid #FCA5A5', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#DC2626', marginBottom:16 }}>
                      ⚠️ {aiError}
                    </div>
                  )}

                  {/* AI result cards */}
                  {aiResult && (
                    <div>
                      <div style={{ fontSize:11, fontWeight:700, color:'var(--text-3)', letterSpacing:'.08em', marginBottom:12 }}>
                        AI 推荐结果 · 仅供参考，请在「课程方案」Tab 手动勾选
                      </div>
                      {aiResult.top3?.map((item, idx) => {
                        const courseData = COURSE_CATALOG.flatMap(s => s.courses).find(c => c.id === item.id)
                        const seriesData = COURSE_CATALOG.find(s => s.courses.some(c => c.id === item.id))
                        const relatedSkus = SKU_LIST.filter(s => s.relatedCourseIds?.includes(item.id))
                        return (
                          <div key={item.id} style={{ border:'1.5px solid var(--border)', borderRadius:12,
                            padding:'16px', marginBottom:12, background:'var(--card)' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                              <span style={{ background:'#2D6A4F', color:'#fff', borderRadius:6,
                                padding:'2px 10px', fontSize:12, fontWeight:700 }}>推荐 #{idx+1}</span>
                              <span style={{ background:'#F0F9F4', color:'#065F46', borderRadius:6,
                                padding:'2px 10px', fontSize:12, fontWeight:700 }}>匹配度 {item.score}%</span>
                            </div>

                            <div style={{ fontSize:11, color:'var(--text-3)', marginBottom:2 }}>课程系列</div>
                            <div style={{ fontSize:13, fontWeight:600, color:'#2D6A4F', marginBottom:8 }}>
                              {seriesData ? `${seriesData.series}：${seriesData.seriesName}` : item.seriesName}
                            </div>

                            <div style={{ fontSize:11, color:'var(--text-3)', marginBottom:2 }}>课程单元</div>
                            <div style={{ fontSize:13, fontWeight:600, marginBottom:4 }}>{item.name}</div>
                            {courseData?.subtitle && (
                              <div style={{ fontSize:12, color:'var(--text-2)', marginBottom:8 }}>{courseData.subtitle}</div>
                            )}

                            {courseData && (
                              <div style={{ background:'var(--bg)', borderRadius:8, padding:'10px 12px', marginBottom:10, fontSize:12 }}>
                                <div style={{ fontWeight:600, marginBottom:6, color:'var(--text-2)' }}>课纲目录</div>
                                <div style={{ fontFamily:'monospace', fontSize:11, lineHeight:1.7, color:'var(--text-1)', whiteSpace:'pre-wrap' }}>
                                  {`▌ ${courseData.name}${courseData.subtitle ? ' — ' + courseData.subtitle : ''}\n  解决核心痛点：${courseData.painpoint}\n  核心受众：${courseData.audience}`}
                                </div>
                              </div>
                            )}

                            {relatedSkus.length > 0 && (
                              <div style={{ marginBottom:10 }}>
                                <div style={{ fontSize:11, color:'var(--text-3)', marginBottom:6 }}>参考 SKU</div>
                                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                                  {relatedSkus.map(s => (
                                    <span key={s.id} style={{ display:'inline-flex', alignItems:'center', gap:4,
                                      padding:'3px 8px', borderRadius:6, fontSize:11,
                                      background: s.match==='exact'?'#D1FAE5':s.match==='fuzzy'?'#FEF3C7':'#EFF6FF',
                                      color: s.match==='exact'?'#065F46':s.match==='fuzzy'?'#92400E':'#1D4ED8',
                                      border:'1px solid currentColor' }}>
                                      {s.pageUrl
                                        ? <a href={s.pageUrl} target="_blank" rel="noreferrer"
                                            style={{ color:'inherit', textDecoration:'none', fontWeight:600 }}>{s.id}</a>
                                        : <span style={{ fontWeight:600 }}>{s.id}</span>}
                                      <span style={{ opacity:.7 }}>· {s.match==='exact'?'精确':s.match==='fuzzy'?'模糊':'参考'}</span>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div style={{ background:'#F0F9F4', borderRadius:8, padding:'10px 12px', fontSize:12, color:'#065F46' }}>
                              <span style={{ fontWeight:600 }}>AI 推荐理由：</span>{item.reason}
                            </div>
                          </div>
                        )
                      })}

                      {aiResult.suggestions && (
                        <div style={{ background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:10,
                          padding:'12px 14px', fontSize:12, color:'#92400E', marginTop:4 }}>
                          💡 <strong>改进建议：</strong>{aiResult.suggestions}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* ─────────────────── TAB 2: 课程方案 ─────────────────── */}
              {editTab === 'courses' && (() => {
                const aiTopIds = aiResult?.top3?.map(t => t.id) || []
                const matchedSKUs = getMatchedSKUs(editCourseIds)
                return (
                  <>
                    {/* AI推荐提示横幅 */}
                    {aiTopIds.length > 0 && (
                      <div style={{ background:'#F0F9F4', border:'1px solid #6EE7B7', borderRadius:10,
                        padding:'10px 14px', marginBottom:16, fontSize:12, color:'#065F46',
                        display:'flex', alignItems:'center', gap:8 }}>
                        🤖 <strong>AI 已推荐 {aiTopIds.length} 门课程</strong>，已在下方用绿色标出，可继续多选其他课程
                        <button className="btn btn-ghost btn-sm" style={{ marginLeft:'auto', fontSize:11 }}
                          onClick={() => setEditTab('analysis')}>← 查看 AI 分析详情</button>
                      </div>
                    )}

                    {/* Basic info editable */}
                    <div style={{ background:'var(--bg)', borderRadius:12, padding:'16px', marginBottom:16 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:'var(--text-3)', letterSpacing:'.08em', marginBottom:12 }}>基本信息</div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                        {[['渠道/机构','channel','text'],['联系人','contact','text'],
                          ['对接销售','salesName','text'],['参与类型','audience','text'],
                          ['预计人数','people','number'],['培训时长','duration','text'],
                          ['期望日期','date','text'],['目标受众职级','jobLevel','text'],
                        ].map(([label, key, type]) => (
                          <div key={key}>
                            <div style={{ fontSize:11, color:'var(--text-3)', marginBottom:4 }}>{label}</div>
                            <input className="form-input" type={type} value={editForm[key]||''}
                              onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                              style={{ fontSize:13, padding:'8px 10px' }} />
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop:10 }}>
                        <div style={{ fontSize:11, color:'var(--text-3)', marginBottom:4 }}>特殊说明</div>
                        <textarea className="form-textarea" value={editForm.note||''}
                          onChange={e => setEditForm(f => ({ ...f, note: e.target.value }))}
                          style={{ fontSize:13, height:60 }} />
                      </div>
                    </div>

                    {/* Course selector — rich cards */}
                    {(() => {
                      // Group COURSE_UNITS by series
                      const groups = []
                      for (const u of COURSE_UNITS) {
                        let g = groups.find(g => g.series === u.series)
                        if (!g) { g = { series: u.series, units: [] }; groups.push(g) }
                        g.units.push(u)
                      }
                      function toggleExpand(id) {
                        setExpandedCourses(prev => {
                          const next = new Set(prev)
                          next.has(id) ? next.delete(id) : next.add(id)
                          return next
                        })
                      }
                      return (
                        <div style={{ marginBottom:16 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                            <div style={{ fontSize:11, fontWeight:700, color:'var(--text-3)', letterSpacing:'.08em' }}>
                              课程选择
                            </div>
                            <span style={{ fontSize:12, color:'#2D6A4F', fontWeight:600 }}>已选 {editCourseIds.length} / 44 门</span>
                            {aiTopIds.length > 0 && <span style={{ fontSize:10, color:'#2D6A4F', background:'#D1FAE5', padding:'2px 8px', borderRadius:4 }}>🤖 绿框 = AI 推荐</span>}
                            <span style={{ fontSize:11, color:'var(--text-3)', marginLeft:'auto' }}>点击「展开」查看课纲 · SKU逻辑 · 关联产品</span>
                          </div>

                          {groups.map(group => (
                            <div key={group.series} style={{ marginBottom:16 }}>
                              {/* Series header */}
                              <div style={{
                                fontSize:11, fontWeight:800, color:'#2D6A4F',
                                padding:'6px 10px', background:'#F0FDF4',
                                border:'1px solid #6EE7B7', borderRadius:8,
                                marginBottom:6, letterSpacing:'.04em'
                              }}>
                                {group.series}
                              </div>

                              {/* Course unit cards */}
                              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                                {group.units.map(u => {
                                  const checked  = editCourseIds.includes(u.id)
                                  const aiPick   = aiTopIds.includes(u.id)
                                  const aiRank   = aiResult?.top3?.findIndex(t => t.id === u.id)
                                  const expanded = expandedCourses.has(u.id)

                                  return (
                                    <div key={u.id} style={{
                                      border: aiPick
                                        ? `2px solid ${checked ? '#2D6A4F' : '#6EE7B7'}`
                                        : `1.5px solid ${checked ? '#2D6A4F' : 'var(--border)'}`,
                                      borderRadius:10,
                                      background: checked ? '#F0FDF4' : 'var(--surface)',
                                      overflow:'hidden',
                                      transition:'border-color .15s',
                                    }}>
                                      {/* Card header row */}
                                      <div style={{
                                        display:'flex', alignItems:'center', gap:10,
                                        padding:'10px 14px', cursor:'pointer',
                                      }} onClick={() => toggleCourse(u.id)}>
                                        <input type="checkbox" checked={checked}
                                          onChange={() => toggleCourse(u.id)}
                                          onClick={e => e.stopPropagation()}
                                          style={{ accentColor:'#2D6A4F', flexShrink:0, width:15, height:15 }} />
                                        <span style={{
                                          fontSize:10, fontWeight:700, color:'var(--text-3)',
                                          background:'var(--bg)', padding:'2px 6px',
                                          borderRadius:4, flexShrink:0, minWidth:40, textAlign:'center'
                                        }}>{u.unit.replace('单元 ','U')}</span>
                                        <span style={{
                                          flex:1, fontSize:13, fontWeight: checked ? 700 : 600,
                                          color: checked ? '#065F46' : 'var(--text-1)', lineHeight:1.4
                                        }}>{u.course}</span>
                                        {aiPick && (
                                          <span style={{
                                            fontSize:10, fontWeight:700, background:'#2D6A4F',
                                            color:'#fff', padding:'2px 8px', borderRadius:6, flexShrink:0
                                          }}>🤖 推荐#{aiRank + 1}</span>
                                        )}
                                        <span style={{ fontSize:11, color:'var(--text-3)', flexShrink:0 }}>
                                          {u.skus.length} SKU
                                        </span>
                                        <button
                                          onClick={e => { e.stopPropagation(); toggleExpand(u.id) }}
                                          style={{
                                            background:'none', border:'1px solid var(--border)',
                                            borderRadius:6, padding:'3px 8px', fontSize:11,
                                            color:'var(--text-2)', cursor:'pointer', flexShrink:0
                                          }}>
                                          {expanded ? '收起 ▲' : '展开 ▾'}
                                        </button>
                                      </div>

                                      {/* Expanded detail */}
                                      {expanded && (
                                        <div style={{
                                          borderTop:'1px solid var(--border)',
                                          padding:'14px 16px',
                                          background: checked ? '#F0FDF4' : 'var(--bg)',
                                          fontSize:12,
                                        }}>
                                          {/* Outline */}
                                          {u.outline && (
                                            <div style={{ marginBottom:14 }}>
                                              <div style={{ fontWeight:700, color:'#2D6A4F', marginBottom:8, fontSize:11 }}>
                                                📋 课纲目录（四部分）
                                              </div>
                                              {u.outline.split('\n').filter(l => l.trim()).map((line, li) => (
                                                <div key={li} style={{
                                                  padding:'5px 10px', marginBottom:4,
                                                  background:'var(--surface)', borderRadius:6,
                                                  color:'var(--text-1)', lineHeight:1.5,
                                                  borderLeft: line.startsWith('第') ? '3px solid #2D6A4F' : 'none',
                                                  paddingLeft: line.startsWith('第') ? 10 : 10,
                                                }}>{line}</div>
                                              ))}
                                            </div>
                                          )}

                                          {/* SKU Logic */}
                                          {u.skuLogic && (
                                            <div style={{ marginBottom:14 }}>
                                              <div style={{ fontWeight:700, color:'#1D4ED8', marginBottom:8, fontSize:11 }}>
                                                💡 SKU 推荐逻辑
                                              </div>
                                              <div style={{
                                                background:'#EFF6FF', border:'1px solid #BFDBFE',
                                                borderRadius:8, padding:'10px 12px',
                                                color:'#1E3A5F', lineHeight:1.7
                                              }}>{u.skuLogic}</div>
                                            </div>
                                          )}

                                          {/* SKU list */}
                                          {u.skus.length > 0 && (
                                            <div>
                                              <div style={{ fontWeight:700, color:'#92400E', marginBottom:8, fontSize:11 }}>
                                                🔖 关联 SKU（{u.skus.length} 个）
                                              </div>
                                              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4 }}>
                                                {u.skus.map(s => (
                                                  <div key={s.id} style={{
                                                    display:'flex', gap:8, alignItems:'flex-start',
                                                    background:'var(--surface)', border:'1px solid var(--border)',
                                                    borderRadius:6, padding:'6px 10px',
                                                  }}>
                                                    <span style={{
                                                      fontFamily:'monospace', fontSize:10, fontWeight:700,
                                                      color: s.id.startsWith('Tax') ? '#7C3AED' : s.id.startsWith('Legal') ? '#1D4ED8' : '#C2410C',
                                                      flexShrink:0, paddingTop:1
                                                    }}>{s.id}</span>
                                                    <span style={{ fontSize:11, color:'var(--text-1)', lineHeight:1.4 }}>{s.name}</span>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    })()}

                    {/* Full SKU matching table */}
                    {editCourseIds.length > 0 && (
                      <div style={{ marginBottom:16 }}>
                        <div style={{ fontSize:11, fontWeight:700, color:'var(--text-3)', letterSpacing:'.08em', marginBottom:10 }}>
                          课程 SKU 匹配表 <span style={{ fontWeight:400 }}>共 {matchedSKUs.length} 条</span>
                        </div>
                        {matchedSKUs.length === 0
                          ? <div style={{ background:'var(--bg)', borderRadius:10, padding:'16px', color:'var(--text-3)', fontSize:12, textAlign:'center' }}>
                              当前所选课程暂无匹配 SKU
                            </div>
                          : (
                            <div style={{ border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
                              {/* Table header */}
                              <div style={{ display:'grid', gridTemplateColumns:'100px 1fr 70px 70px 70px 80px 80px', gap:0,
                                background:'#2D6A4F', padding:'8px 12px', fontSize:11, fontWeight:700, color:'#fff' }}>
                                {['产品编号','产品名称','所属部门','一级分类','二级分类','页数 / 字数','匹配等级'].map(h => (
                                  <div key={h} style={{ padding:'0 4px' }}>{h}</div>
                                ))}
                              </div>
                              {/* Rows */}
                              {matchedSKUs.map((s, i) => (
                                <div key={s.id} style={{
                                  display:'grid', gridTemplateColumns:'100px 1fr 70px 70px 70px 80px 80px',
                                  gap:0, padding:'10px 12px', fontSize:12,
                                  background: i % 2 === 0 ? '#fff' : '#FAFAF9',
                                  borderTop:'1px solid var(--border)', alignItems:'center'
                                }}>
                                  <div style={{ padding:'0 4px', fontFamily:'monospace', fontSize:11, color:'var(--accent)', fontWeight:700 }}>
                                    {s.pageUrl
                                      ? <a href={s.pageUrl} target="_blank" rel="noreferrer"
                                          style={{ color:'var(--blue)', textDecoration:'none' }}>{s.id} ↗</a>
                                      : s.id}
                                  </div>
                                  <div style={{ padding:'0 4px', fontWeight:600, color:'var(--text-1)' }}>{s.name}</div>
                                  <div style={{ padding:'0 4px', color:'var(--text-2)', fontSize:11 }}>{s.dept}</div>
                                  <div style={{ padding:'0 4px', color:'var(--text-2)', fontSize:11 }}>{s.cat1}</div>
                                  <div style={{ padding:'0 4px', color:'var(--text-2)', fontSize:11 }}>{s.cat2 || '—'}</div>
                                  <div style={{ padding:'0 4px', color:'var(--text-2)', fontSize:11 }}>
                                    {s.slides > 0 ? <>{s.slides}页<br/>{(s.words/1000).toFixed(1)}K字</> : <span style={{ color:'#A1A1AA' }}>待更新</span>}
                                  </div>
                                  <div style={{ padding:'0 4px' }}>
                                    <span style={{ fontSize:11, padding:'2px 6px', borderRadius:4, fontWeight:600,
                                      background: s.match==='exact'?'#D1FAE5':s.match==='fuzzy'?'#FEF3C7':s.match?'#EFF6FF':'#F4F4F5',
                                      color: s.match==='exact'?'#065F46':s.match==='fuzzy'?'#92400E':s.match?'#1D4ED8':'#A1A1AA' }}>
                                      {s.match==='exact'?'精确匹配':s.match==='fuzzy'?'模糊匹配':s.match==='overview'?'参考资料':'未评级'}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )
                        }
                      </div>
                    )}

                    <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                      <button className="btn btn-secondary" disabled={wordGenerating}
                        onClick={async () => {
                          setWordGenerating(true)
                          try { await downloadWordDoc(editOrder, editForm, editCourseIds, editOutline) }
                          finally { setWordGenerating(false) }
                        }}>
                        {wordGenerating ? '⏳ 生成中…' : '⬇️ 下载方案 Word'}
                      </button>
                      <button className="btn btn-primary" onClick={saveEdit}>💾 保存草稿</button>
                    </div>
                  </>
                )
              })()}

              {/* ─────────────────── TAB 3: 发送方案 ─────────────────── */}
              {editTab === 'send' && (
                <>
                  {/* Instructor selector */}
                  <div style={{ background:'var(--bg)', borderRadius:12, padding:'16px', marginBottom:16 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:'var(--text-3)', letterSpacing:'.08em', marginBottom:12 }}>
                      👨‍🏫 讲师匹配（可多选）
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10 }}>
                      {INSTRUCTORS.map(ins => {
                        const selected = selectedInstructors.includes(ins.id)
                        return (
                          <div key={ins.id} onClick={() => toggleInstructor(ins.id)} style={{
                            position:'relative', padding:'14px', borderRadius:12, cursor:'pointer',
                            border:`2px solid ${selected ? '#2D6A4F' : 'var(--border)'}`,
                            background: selected ? '#F0F9F4' : 'var(--card)',
                            transition:'all .15s'
                          }}>
                            {selected && (
                              <div style={{ position:'absolute', top:8, right:8, background:'#2D6A4F',
                                color:'#fff', borderRadius:'50%', width:18, height:18,
                                display:'flex', alignItems:'center', justifyContent:'center', fontSize:11 }}>✓</div>
                            )}
                            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                              <div style={{ width:36, height:36, borderRadius:'50%', background:'#2D6A4F',
                                color:'#fff', display:'flex', alignItems:'center', justifyContent:'center',
                                fontSize:14, fontWeight:700, flexShrink:0 }}>{ins.avatar}</div>
                              <div>
                                <div style={{ fontWeight:700, fontSize:14 }}>{ins.name}</div>
                                <div style={{ fontSize:11, color:'var(--text-3)' }}>{ins.title}</div>
                              </div>
                            </div>
                            <div style={{ fontSize:11, color:'var(--text-2)', marginBottom:6 }}>{ins.edu}</div>
                            <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                              {ins.specialties.map(s => (
                                <span key={s} style={{ fontSize:10, padding:'1px 6px', borderRadius:4,
                                  background:'#EFF6FF', color:'#1D4ED8', border:'1px solid #BFDBFE' }}>{s}</span>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Channel confirm link */}
                  <div style={{ background:'var(--bg)', borderRadius:12, padding:'16px', marginBottom:16 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:'var(--text-3)', letterSpacing:'.08em', marginBottom:6 }}>
                      🔗 渠道确认链接
                    </div>
                    <div style={{ fontSize:12, color:'var(--text-2)', marginBottom:10 }}>
                      发给渠道联系人，对方确认后工单自动进入「渠道已确认」
                    </div>
                    {confirmLink && (
                      <div style={{ background:'#F0F9F4', border:'1px solid #6EE7B7', borderRadius:8,
                        padding:'10px 12px', marginBottom:10, fontSize:11,
                        fontFamily:'monospace', wordBreak:'break-all', color:'#047857', lineHeight:1.5 }}>
                        {confirmLink}
                      </div>
                    )}
                    <div style={{ display:'flex', gap:8 }}>
                      <button className="btn btn-primary" onClick={genConfirmLink}>
                        {confirmLinkCopied ? '✅ 已复制！' : '生成并复制渠道确认链接'}
                      </button>
                      {confirmLink && (
                        <button className="btn btn-secondary btn-sm"
                          onClick={() => { navigator.clipboard.writeText(confirmLink); setConfirmLinkCopied(true) }}>
                          再次复制
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Instructor reference link */}
                  <div style={{ background:'var(--bg)', borderRadius:12, padding:'16px', marginBottom:20 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:'var(--text-3)', letterSpacing:'.08em', marginBottom:6 }}>
                      📨 讲师参考方案链接
                    </div>
                    <div style={{ fontSize:12, color:'var(--text-2)', marginBottom:10 }}>
                      包含完整渠道需求、补充信息、已选课程与课纲、参考 SKU 列表。讲师打开后只读查看，按需备课。
                    </div>
                    {instructorLink && (
                      <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:8,
                        padding:'10px 12px', marginBottom:10, fontSize:11,
                        fontFamily:'monospace', wordBreak:'break-all', color:'#1D4ED8', lineHeight:1.5 }}>
                        {instructorLink}
                      </div>
                    )}
                    <div style={{ display:'flex', gap:8 }}>
                      <button className="btn btn-primary" onClick={genInstructorLink}>
                        {instructorLinkCopied ? '✅ 已复制！' : '生成并复制讲师参考方案链接'}
                      </button>
                      {instructorLink && (
                        <button className="btn btn-secondary btn-sm"
                          onClick={() => { navigator.clipboard.writeText(instructorLink); setInstructorLinkCopied(true) }}>
                          再次复制
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                    <button className="btn btn-primary" onClick={saveEdit}>💾 保存草稿</button>
                  </div>
                </>
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
