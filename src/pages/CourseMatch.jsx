import { useState, useEffect } from 'react'
import mammoth from 'mammoth'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType } from 'docx'
import { COURSE_CATALOG, SKU_LIST, INSTRUCTORS } from '../data/mock'
import { COURSE_UNITS } from '../data/courseUnits'
import { SKU_FULL } from '../data/skuFull'

export const CONTEXT_KEY  = 'zx_coursematch_context'
const OVERRIDE_KEY = 'zx_order_overrides'

/* ─── DeepSeek API ─── */
const DS_API_URL = 'https://api.deepseek.com/v1/chat/completions'
const DS_API_KEY = 'sk-603a729e51d54a82bf8b8de3e06530b4'
const DS_MODEL   = 'deepseek-chat'

const SKU_PAGE_MAP = Object.fromEntries(
  SKU_FULL.filter(s => s.pageUrl).map(s => [s.id, s.pageUrl])
)

/* ─── helpers ─── */
function loadOverrides() { try { return JSON.parse(localStorage.getItem(OVERRIDE_KEY) || '{}') } catch { return {} } }
function saveOverride(id, updates) {
  const ov = loadOverrides()
  ov[id] = { ...(ov[id] || {}), ...updates, updatedAt: new Date().toISOString() }
  localStorage.setItem(OVERRIDE_KEY, JSON.stringify(ov))
}

function buildOutline(courseIds) {
  const lines = []
  for (const u of COURSE_UNITS.filter(u => courseIds.includes(u.id))) {
    lines.push(`【${u.series}】`)
    lines.push(`▌ ${u.unit}：${u.course}`)
    if (u.outline) u.outline.split('\n').filter(l => l.trim()).forEach(l => lines.push(`  ${l}`))
    lines.push('')
  }
  return lines.join('\n').trim()
}

function getMatchedSKUs(courseIds) {
  if (!courseIds.length) return []
  return SKU_LIST.filter(s => s.relatedCourseIds?.some(id => courseIds.includes(id)))
}

function generateConfirmLink(order, editForm, courseIds, outline) {
  const selectedCourses = COURSE_UNITS.filter(u => courseIds.includes(u.id))
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
  const selectedCourses = COURSE_UNITS.filter(u => courseIds.includes(u.id))
    .map(u => ({ id: u.id, name: u.course, series: u.series }))
  const matchedSKUs = getMatchedSKUs(courseIds).map(s => ({ id: s.id, name: s.name, match: s.match, pageUrl: s.pageUrl }))
  const instructorNames = INSTRUCTORS.filter(i => selectedInstructors.includes(i.id)).map(i => i.name)
  const ref = {
    id: order.id, channel: editForm.channel || order.channel,
    contact: editForm.contact || order.contact, salesName: editForm.salesName || order.salesName,
    audience: editForm.audience || order.audience, jobLevel: editForm.jobLevel || order.jobLevel,
    people: editForm.people || order.people, duration: editForm.duration || order.duration,
    date: editForm.date || order.date, painpoints: order.painpoints, note: editForm.note || order.note,
    supplementText, courses: selectedCourses, outline, skus: matchedSKUs,
    instructors: instructorNames, generatedAt: new Date().toISOString(),
  }
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(ref))))
  const base = `${location.origin}${location.pathname.replace(/\/[^/]*$/, '')}/instructor.html`
  return `${base}?ref=${encoded}`
}

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
          children:[new TextRun({ text:`工单：${order.id}　渠道：${editForm.channel||order.channel}　联系人：${editForm.contact||order.contact}`, font:'Arial', size:22, color:'444444' })] }),
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
              width:{ size:9200, type:WidthType.DXA }, columnWidths:[1800,3800,1200,1200,1200],
              rows:[
                new TableRow({ tableHeader:true, children:
                  ['产品编号','产品名称','所属部门','一级分类','匹配程度'].map((h,i) =>
                    new TableCell({ borders, width:{ size:[1800,3800,1200,1200,1200][i], type:WidthType.DXA },
                      margins:cellPad, shading:{ fill:'2D6A4F', type:ShadingType.CLEAR },
                      children:[new Paragraph({ children:[new TextRun({ text:h, font:'Arial', size:22, bold:true, color:'FFFFFF' })] })] })
                  )
                }),
                ...matchedSKUs.map(s => new TableRow({ children: [
                  new TableCell({ borders, width:{ size:1800, type:WidthType.DXA }, margins:cellPad, children:[new Paragraph({ children:[new TextRun({ text:s.id, font:'Arial', size:20 })] })] }),
                  new TableCell({ borders, width:{ size:3800, type:WidthType.DXA }, margins:cellPad, children:[new Paragraph({ children:[new TextRun({ text:s.name, font:'Arial', size:20, bold:true })] })] }),
                  new TableCell({ borders, width:{ size:1200, type:WidthType.DXA }, margins:cellPad, children:[new Paragraph({ children:[new TextRun({ text:s.dept||'', font:'Arial', size:20 })] })] }),
                  new TableCell({ borders, width:{ size:1200, type:WidthType.DXA }, margins:cellPad, children:[new Paragraph({ children:[new TextRun({ text:s.cat1||'', font:'Arial', size:20 })] })] }),
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

/* ─── AI helpers ─── */
function buildAIPrompt(order, editForm, supplementText) {
  const info = [
    `渠道/机构：${editForm.channel || order.channel || '未知'}`,
    `参与人员类型：${editForm.audience || order.audience || '未知'}`,
    `目标受众职级：${editForm.jobLevel || order.jobLevel || '未知'}`,
    `预计人数：${editForm.people || order.people || '未知'}`,
    `培训时长：${editForm.duration || order.duration || '未知'}`,
    order.painpoints?.selected?.length ? `客户核心痛点：${order.painpoints.selected.join('、')}` : null,
    order.painpoints?.other ? `其他痛点说明：${order.painpoints.other}` : null,
    (editForm.note || order.note) ? `特殊说明：${editForm.note || order.note}` : null,
    supplementText ? `\n补充信息/会议纪要：\n${supplementText}` : null,
  ].filter(Boolean).join('\n')

  const courseList = COURSE_CATALOG.map(s =>
    `【${s.series} ${s.seriesName}】\n` +
    s.courses.map(c =>
      `  ID:${c.id} | ${c.name}${c.subtitle ? ' (' + c.subtitle + ')' : ''}` +
      (c.painpoint ? ` | 解决痛点:${c.painpoint}` : '') +
      (c.audience  ? ` | 目标受众:${c.audience}` : '')
    ).join('\n')
  ).join('\n\n')

  return `你是朝曦家族办公室培训咨询专家。根据以下客户需求，从课程库中精准匹配最适合的 Top 3 课程单元。

## 客户需求
${info}

## 课程库（请仅从以下课程中选择，ID 必须完全一致）
${courseList}

## 输出要求
只返回合法 JSON，不要加 markdown 代码块，不要有任何注释或额外文字。
score 字段必须是纯整数（60-99），不能附加任何汉字或标点。

## 返回格式示例
{"top3":[{"id":"COURSE_ID","name":"课程名称","seriesName":"系列名称","score":85,"reason":"推荐理由不超过50字"},{"id":"COURSE_ID2","name":"课程名称2","seriesName":"系列名称2","score":78,"reason":"推荐理由"},{"id":"COURSE_ID3","name":"课程名称3","seriesName":"系列名称3","score":72,"reason":"推荐理由"}],"suggestions":"补充建议不超过100字"}`
}

async function callDeepSeekAPI(prompt) {
  const res = await fetch(DS_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DS_API_KEY}`,
    },
    body: JSON.stringify({
      model: DS_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 1200,
    }),
  })
  if (!res.ok) throw new Error(`API 请求失败 (${res.status})`)
  const data = await res.json()
  let text = (data.choices?.[0]?.message?.content || '').trim()
  // Strip markdown code fences if present
  text = text.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '').trim()
  try {
    return JSON.parse(text)
  } catch {
    // Extract the outermost {...} block as a fallback
    const match = text.match(/\{[\s\S]*\}/)
    if (match) {
      try { return JSON.parse(match[0]) } catch { /* fall through */ }
    }
    throw new Error('AI 返回格式异常，请重试')
  }
}

/* ════════════════════════════════════════════════════════════
   Main component
════════════════════════════════════════════════════════════ */
export function CourseMatch({ navigate }) {
  const [ctx, setCtx]                                   = useState(null)
  const [tab, setTab]                                   = useState('courses')
  const [editForm, setEditForm]                         = useState({})
  const [editCourseIds, setEditCourseIds]               = useState([])
  const [editOutline, setEditOutline]                   = useState('')
  const [expandedCourses, setExpandedCourses]           = useState(new Set())
  const [selectedInstructors, setSelectedInstructors]   = useState([])
  const [confirmLink, setConfirmLink]                   = useState('')
  const [confirmLinkCopied, setConfirmLinkCopied]       = useState(false)
  const [instructorLink, setInstructorLink]             = useState('')
  const [instructorLinkCopied, setInstructorLinkCopied] = useState(false)
  const [wordGenerating, setWordGenerating]             = useState(false)
  const [saved, setSaved]                               = useState(false)

  /* ─── AI state ─── */
  const [supplementText, setSupplementText] = useState('')
  const [aiLoading, setAiLoading]           = useState(false)
  const [aiResult, setAiResult]             = useState(null)
  const [aiError, setAiError]               = useState('')

  useEffect(() => {
    const raw = localStorage.getItem(CONTEXT_KEY)
    if (!raw) return
    const c = JSON.parse(raw)
    setCtx(c)
    setEditForm(c.editForm || {})
    const ids = c.editCourseIds || []
    setEditCourseIds(ids)
    setEditOutline(c.editOutline || (ids.length ? buildOutline(ids) : ''))
    setSelectedInstructors(c.selectedInstructors || [])
    setSupplementText(c.supplementText || '')
    setAiResult(c.aiResult || null)
  }, [])

  /* ─── No context ─── */
  if (!ctx) {
    return (
      <>
        <div className="topbar">
          <span className="topbar-title">课程匹配</span>
          <span className="topbar-sub">· M2</span>
        </div>
        <div className="content" style={{ textAlign:'center', paddingTop:80 }}>
          <div style={{ fontSize:32, marginBottom:16 }}>📋</div>
          <div style={{ fontSize:15, color:'var(--text-2)', marginBottom:20 }}>请先从「需求工单」中选择一条前期沟通工单，点击「前往课程匹配」进入本页</div>
          <button className="btn btn-primary" onClick={() => navigate('workorders')}>← 返回需求工单</button>
        </div>
      </>
    )
  }

  const order    = ctx.order || {}
  const aiTopIds = aiResult?.top3?.map(t => t.id) || []
  const matchedSKUs = getMatchedSKUs(editCourseIds)
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')

  /* ─── Course toggle ─── */
  function toggleCourse(id) {
    setEditCourseIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      setEditOutline(buildOutline(next))
      return next
    })
    setSaved(false)
  }

  function toggleExpand(id) {
    setExpandedCourses(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  /* ─── Save ─── */
  function handleSave() {
    saveOverride(order.id, {
      editForm, editCourseIds, editOutline, selectedInstructors,
      supplementText, aiResult,
      status: order.status, updatedAt: new Date().toISOString(),
    })
    const updated = { ...ctx, editForm, editCourseIds, editOutline, selectedInstructors, supplementText, aiResult }
    localStorage.setItem(CONTEXT_KEY, JSON.stringify(updated))
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  /* ─── AI analysis ─── */
  async function analyzeWithAI() {
    setAiLoading(true); setAiError('')
    try {
      const prompt = buildAIPrompt(order, editForm, supplementText)
      const result = await callDeepSeekAPI(prompt)
      setAiResult(result)
      saveOverride(order.id, { aiResult: result, supplementText })
    } catch (e) {
      setAiError(e.message || 'AI 分析失败，请稍后重试')
    } finally {
      setAiLoading(false)
    }
  }

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

  /* ─── Links ─── */
  function genConfirmLink() {
    const link = generateConfirmLink(order, editForm, editCourseIds, editOutline)
    setConfirmLink(link)
    navigator.clipboard.writeText(link).then(() => {
      setConfirmLinkCopied(true); setTimeout(() => setConfirmLinkCopied(false), 3000)
    })
  }
  function genInstructorLink() {
    const link = generateInstructorLink(order, editForm, editCourseIds, editOutline, supplementText, selectedInstructors)
    setInstructorLink(link)
    navigator.clipboard.writeText(link).then(() => {
      setInstructorLinkCopied(true); setTimeout(() => setInstructorLinkCopied(false), 3000)
    })
  }

  /* ─── Group COURSE_UNITS by series ─── */
  const courseGroups = []
  for (const u of COURSE_UNITS) {
    let g = courseGroups.find(g => g.series === u.series)
    if (!g) { g = { series: u.series, units: [] }; courseGroups.push(g) }
    g.units.push(u)
  }

  return (
    <>
      {/* ─── Topbar ─── */}
      <div className="topbar">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('workorders')} style={{ marginRight:4 }}>
          ← 返回需求工单
        </button>
        <span className="topbar-title" style={{ marginLeft:8 }}>课程匹配</span>
        <span className="topbar-sub">· {order.id} &nbsp;·&nbsp; {order.channel}</span>
        <div className="topbar-actions">
          {saved && <span style={{ fontSize:12, color:'var(--accent)', fontWeight:600 }}>✅ 已保存</span>}
          <button className="btn btn-secondary btn-sm" onClick={handleSave}>💾 保存草稿</button>
        </div>
      </div>

      <div className="content">

        {/* ─── Work order summary strip ─── */}
        <div style={{
          display:'flex', gap:24, flexWrap:'wrap', alignItems:'center',
          padding:'12px 18px', background:'var(--bg-card)', border:'1px solid var(--border)',
          borderRadius:12, marginBottom:20, fontSize:12,
        }}>
          {[
            ['渠道', editForm.channel || order.channel],
            ['联系人', editForm.contact || order.contact],
            ['参与类型', editForm.audience || order.audience || '—'],
            ['人数', (editForm.people || order.people) ? `${editForm.people || order.people}人` : '—'],
            ['时长', editForm.duration || order.duration || '—'],
            ['日期', editForm.date || order.date || '—'],
          ].map(([k, v]) => (
            <div key={k} style={{ display:'flex', gap:6 }}>
              <span style={{ color:'var(--text-3)' }}>{k}</span>
              <span style={{ fontWeight:600, color:'var(--text-1)' }}>{v}</span>
            </div>
          ))}
          {aiResult && (
            <span style={{ marginLeft:'auto', fontSize:11, background:'#D1FAE5', color:'#065F46',
              padding:'3px 10px', borderRadius:6, fontWeight:600 }}>
              🤖 AI已分析
            </span>
          )}
        </div>

        {/* ─── Tabs ─── */}
        <div style={{ display:'flex', borderBottom:'1px solid var(--border)', marginBottom:20 }}>
          {[['courses','📚 课程方案'],['send','📨 发送方案']].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              padding:'10px 20px', fontSize:13, fontWeight: tab===id ? 700 : 400,
              border:'none', background:'none', cursor:'pointer', fontFamily:'inherit',
              color: tab===id ? 'var(--accent)' : 'var(--text-3)',
              borderBottom: tab===id ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom:-1,
            }}>{label}</button>
          ))}
        </div>

        {/* ══════════════ TAB 1: 课程方案 ══════════════ */}
        {tab === 'courses' && (
          <>
            {/* ─── AI 需求分析区 ─── */}
            <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, padding:20, marginBottom:20 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--text-3)', letterSpacing:'.08em', marginBottom:12 }}>
                📋 补充信息 / 会议纪要
              </div>
              <textarea
                value={supplementText}
                onChange={e => setSupplementText(e.target.value)}
                style={{
                  width:'100%', height:110, padding:'10px 12px',
                  border:'1.5px solid var(--border)', borderRadius:10,
                  fontFamily:'inherit', fontSize:13, lineHeight:1.7,
                  background:'var(--bg)', color:'var(--text-1)',
                  resize:'vertical', outline:'none',
                }}
                placeholder="粘贴会议纪要或补充说明…"
              />
              <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:10, flexWrap:'wrap' }}>
                <label style={{
                  display:'inline-flex', alignItems:'center', gap:6, fontSize:12,
                  color:'var(--text-2)', cursor:'pointer', padding:'6px 12px',
                  border:'1px solid var(--border)', borderRadius:8, background:'var(--bg)',
                }}>
                  📎 上传 Word 文件（.docx）
                  <input type="file" accept=".docx" style={{ display:'none' }} onChange={handleFileUpload} />
                </label>
                <button
                  className="btn btn-primary"
                  onClick={analyzeWithAI}
                  disabled={aiLoading}
                  style={{ flex:1, justifyContent:'center', minWidth:200 }}
                >
                  {aiLoading ? '⏳ AI 分析中，请稍候…' : '🤖 AI 分析需求 · 匹配 Top 3 课程'}
                </button>
              </div>
              {aiError && (
                <div style={{ background:'#FEF2F2', border:'1px solid #FCA5A5', borderRadius:8,
                  padding:'10px 14px', fontSize:12, color:'#DC2626', marginTop:12 }}>
                  ⚠️ {aiError}
                </div>
              )}
            </div>

            {/* ─── AI result cards ─── */}
            {aiResult && (
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--text-3)', letterSpacing:'.08em', marginBottom:12 }}>
                  AI 推荐结果 · 仅供参考，请在下方课程选择中确认
                </div>
                {aiResult.top3?.map((item, idx) => {
                  const courseData = COURSE_CATALOG.flatMap(s => s.courses).find(c => c.id === item.id)
                  const seriesData = COURSE_CATALOG.find(s => s.courses.some(c => c.id === item.id))
                  return (
                    <div key={item.id} style={{
                      border:'1.5px solid var(--border)', borderRadius:12,
                      padding:'16px', marginBottom:10, background:'var(--bg-card)',
                    }}>
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

                      {courseData && (courseData.painpoint || courseData.audience) && (
                        <div style={{ background:'var(--bg)', borderRadius:8, padding:'10px 12px', marginBottom:10 }}>
                          <div style={{ display:'flex', flexDirection:'column', gap:4, fontSize:12 }}>
                            {courseData.painpoint && (
                              <div style={{ display:'flex', gap:8 }}>
                                <span style={{ flexShrink:0, color:'var(--text-3)', fontWeight:600, minWidth:72 }}>解决核心痛点</span>
                                <span style={{ color:'var(--text-1)', lineHeight:1.6 }}>{courseData.painpoint}</span>
                              </div>
                            )}
                            {courseData.audience && (
                              <div style={{ display:'flex', gap:8 }}>
                                <span style={{ flexShrink:0, color:'var(--text-3)', fontWeight:600, minWidth:72 }}>核心受众</span>
                                <span style={{ color:'var(--text-1)', lineHeight:1.6 }}>{courseData.audience}</span>
                              </div>
                            )}
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

            {/* AI推荐 banner */}
            {aiTopIds.length > 0 && (
              <div style={{ background:'#F0F9F4', border:'1px solid #6EE7B7', borderRadius:10,
                padding:'10px 16px', marginBottom:20, fontSize:12, color:'#065F46',
                display:'flex', alignItems:'center', gap:8 }}>
                🤖 <strong>AI 推荐了 {aiTopIds.length} 门课程</strong>，已在下方用绿色标出，可继续多选其他课程
              </div>
            )}

            {/* Basic info editable */}
            <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, padding:20, marginBottom:20 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--text-3)', letterSpacing:'.08em', marginBottom:14 }}>基本信息</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
                {[['渠道/机构','channel','text'],['联系人','contact','text'],
                  ['对接销售','salesName','text'],['参与类型','audience','text'],
                  ['预计人数','people','number'],['培训时长','duration','text'],
                  ['期望日期','date','text'],['目标受众职级','jobLevel','text'],
                ].map(([label, key, type]) => (
                  <div key={key}>
                    <div style={{ fontSize:11, color:'var(--text-3)', marginBottom:4 }}>{label}</div>
                    <input className="form-input" type={type} value={editForm[key]||''}
                      onChange={e => { setEditForm(f => ({ ...f, [key]: e.target.value })); setSaved(false) }}
                      style={{ fontSize:13, padding:'7px 10px' }} />
                  </div>
                ))}
              </div>
              <div style={{ marginTop:12 }}>
                <div style={{ fontSize:11, color:'var(--text-3)', marginBottom:4 }}>特殊说明</div>
                <textarea className="form-textarea" value={editForm.note||''}
                  onChange={e => { setEditForm(f => ({ ...f, note: e.target.value })); setSaved(false) }}
                  style={{ fontSize:13, height:56 }} />
              </div>
            </div>

            {/* Course selector */}
            <div style={{ marginBottom:20 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--text-1)' }}>课程选择</div>
                <span style={{ fontSize:12, color:'var(--accent)', fontWeight:600 }}>已选 {editCourseIds.length} / {COURSE_UNITS.length} 门</span>
                {aiTopIds.length > 0 && (
                  <span style={{ fontSize:11, color:'#065F46', background:'#D1FAE5', padding:'2px 8px', borderRadius:4 }}>
                    🤖 绿框 = AI 推荐
                  </span>
                )}
                <span style={{ fontSize:11, color:'var(--text-3)', marginLeft:'auto' }}>点击「展开」查看课纲 · SKU逻辑 · 关联产品</span>
              </div>

              {courseGroups.map(group => (
                <div key={group.series} style={{ marginBottom:18 }}>
                  <div style={{
                    fontSize:11, fontWeight:800, color:'#2D6A4F',
                    padding:'6px 12px', background:'#F0FDF4',
                    border:'1px solid #6EE7B7', borderRadius:8,
                    marginBottom:8, letterSpacing:'.04em'
                  }}>
                    {group.series}
                  </div>
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
                          background: checked ? '#F0FDF4' : 'var(--bg-card)',
                          overflow:'hidden',
                        }}>
                          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', cursor:'pointer' }}
                            onClick={() => toggleCourse(u.id)}>
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
                              <span style={{ fontSize:10, fontWeight:700, background:'#2D6A4F',
                                color:'#fff', padding:'2px 8px', borderRadius:6, flexShrink:0 }}>
                                🤖 推荐#{aiRank + 1}
                              </span>
                            )}
                            <span style={{ fontSize:11, color:'var(--text-3)', flexShrink:0 }}>{u.skus.length} SKU</span>
                            <button
                              onClick={e => { e.stopPropagation(); toggleExpand(u.id) }}
                              style={{ background:'none', border:'1px solid var(--border)',
                                borderRadius:6, padding:'3px 8px', fontSize:11,
                                color:'var(--text-2)', cursor:'pointer', flexShrink:0 }}>
                              {expanded ? '收起 ▲' : '展开 ▾'}
                            </button>
                          </div>

                          {expanded && (
                            <div style={{ borderTop:'1px solid var(--border)', padding:'14px 16px',
                              background: checked ? '#F0FDF4' : 'var(--bg)', fontSize:12 }}>
                              {u.outline && (
                                <div style={{ marginBottom:14 }}>
                                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                                    <div style={{ fontWeight:700, color:'#2D6A4F', fontSize:11 }}>📋 课纲目录</div>
                                    <a
                                      href={`${base}/outlines/${u.id}.html`}
                                      target="_blank"
                                      rel="noreferrer"
                                      style={{
                                        fontSize:11, fontWeight:600, color:'var(--blue)',
                                        textDecoration:'none', display:'inline-flex', alignItems:'center', gap:4,
                                        padding:'3px 10px', borderRadius:6,
                                        border:'1px solid #BFDBFE', background:'#EFF6FF',
                                      }}
                                    >
                                      📄 查看完整课纲 ↗
                                    </a>
                                  </div>
                                  {u.outline.split('\n').filter(l => l.trim()).map((line, li) => (
                                    <div key={li} style={{
                                      padding:'5px 10px', marginBottom:4,
                                      background:'var(--bg-card)', borderRadius:6,
                                      color:'var(--text-1)', lineHeight:1.5,
                                      borderLeft: line.startsWith('第') ? '3px solid #2D6A4F' : 'none',
                                    }}>{line}</div>
                                  ))}
                                </div>
                              )}
                              {u.skuLogic && (
                                <div style={{ marginBottom:14 }}>
                                  <div style={{ fontWeight:700, color:'#1D4ED8', marginBottom:8, fontSize:11 }}>💡 SKU 推荐逻辑</div>
                                  <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE',
                                    borderRadius:8, padding:'10px 12px', color:'#1E3A5F', lineHeight:1.7 }}>
                                    {u.skuLogic}
                                  </div>
                                </div>
                              )}
                              {u.skus.length > 0 && (
                                <div>
                                  <div style={{ fontWeight:700, color:'#92400E', marginBottom:8, fontSize:11 }}>
                                    🔖 关联 SKU（{u.skus.length} 个）
                                  </div>
                                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4 }}>
                                    {u.skus.map(s => {
                                      const pageUrl = SKU_PAGE_MAP[s.id]
                                      const href = pageUrl ? base + pageUrl : null
                                      const idColor = s.id.startsWith('Tax') || s.id.startsWith('TAX') ? '#7C3AED'
                                        : s.id.startsWith('Legal') ? '#1D4ED8' : '#C2410C'
                                      return (
                                        <div key={s.id} style={{
                                          display:'flex', gap:8, alignItems:'flex-start',
                                          background:'var(--bg-card)', border:'1px solid var(--border)',
                                          borderRadius:6, padding:'6px 10px',
                                        }}>
                                          {href
                                            ? <a href={href} target="_blank" rel="noreferrer"
                                                style={{ fontFamily:'monospace', fontSize:10, fontWeight:700,
                                                  color: idColor, textDecoration:'none', flexShrink:0, paddingTop:1 }}>
                                                {s.id} ↗
                                              </a>
                                            : <span style={{ fontFamily:'monospace', fontSize:10, fontWeight:700,
                                                color: idColor, flexShrink:0, paddingTop:1 }}>{s.id}</span>
                                          }
                                          <span style={{ fontSize:11, color:'var(--text-1)', lineHeight:1.4 }}>{s.name}</span>
                                        </div>
                                      )
                                    })}
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

            {/* SKU matching table */}
            {editCourseIds.length > 0 && (
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--text-1)', marginBottom:10 }}>
                  课程 SKU 匹配表
                  <span style={{ fontWeight:400, fontSize:12, color:'var(--text-3)', marginLeft:8 }}>共 {matchedSKUs.length} 条</span>
                </div>
                {matchedSKUs.length === 0
                  ? <div style={{ background:'var(--bg)', borderRadius:10, padding:20, color:'var(--text-3)', fontSize:12, textAlign:'center' }}>
                      当前所选课程暂无匹配 SKU
                    </div>
                  : (
                    <div style={{ border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
                      <div style={{ display:'grid', gridTemplateColumns:'110px 1fr 80px 80px 90px 90px 90px', gap:0,
                        background:'#2D6A4F', padding:'8px 14px', fontSize:11, fontWeight:700, color:'#fff' }}>
                        {['产品编号','产品名称','所属部门','一级分类','二级分类','页数/字数','匹配等级'].map(h => (
                          <div key={h} style={{ padding:'0 4px' }}>{h}</div>
                        ))}
                      </div>
                      {matchedSKUs.map((s, i) => (
                        <div key={s.id} style={{
                          display:'grid', gridTemplateColumns:'110px 1fr 80px 80px 90px 90px 90px',
                          gap:0, padding:'10px 14px', fontSize:12,
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
                          <div style={{ padding:'0 4px', color:'var(--text-2)', fontSize:11 }}>{s.cat2||'—'}</div>
                          <div style={{ padding:'0 4px', color:'var(--text-2)', fontSize:11 }}>
                            {s.slides > 0 ? <>{s.slides}页 / {(s.words/1000).toFixed(1)}K字</> : <span style={{ color:'#A1A1AA' }}>待更新</span>}
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
                  try { await downloadWordDoc(order, editForm, editCourseIds, editOutline) }
                  finally { setWordGenerating(false) }
                }}>
                {wordGenerating ? '⏳ 生成中…' : '⬇️ 下载方案 Word'}
              </button>
              <button className="btn btn-primary" onClick={handleSave}>💾 保存草稿</button>
            </div>
          </>
        )}

        {/* ══════════════ TAB 2: 发送方案 ══════════════ */}
        {tab === 'send' && (
          <>
            {/* Instructor selector */}
            <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, padding:20, marginBottom:20 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--text-1)', marginBottom:14 }}>👨‍🏫 讲师匹配（可多选）</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
                {INSTRUCTORS.map(ins => {
                  const sel = selectedInstructors.includes(ins.id)
                  return (
                    <div key={ins.id} onClick={() => { setSelectedInstructors(prev => sel ? prev.filter(x=>x!==ins.id) : [...prev, ins.id]); setSaved(false) }}
                      style={{
                        position:'relative', padding:'16px', borderRadius:12, cursor:'pointer',
                        border:`2px solid ${sel ? '#2D6A4F' : 'var(--border)'}`,
                        background: sel ? '#F0F9F4' : 'var(--bg-card)',
                        transition:'all .15s'
                      }}>
                      {sel && (
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

            {/* Confirm link */}
            <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, padding:20, marginBottom:16 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--text-1)', marginBottom:6 }}>🔗 渠道确认链接</div>
              <div style={{ fontSize:12, color:'var(--text-2)', marginBottom:12 }}>
                发给渠道联系人，对方确认后工单自动进入「渠道已确认」
              </div>
              {confirmLink && (
                <div style={{ background:'#F0F9F4', border:'1px solid #6EE7B7', borderRadius:8,
                  padding:'10px 12px', marginBottom:12, fontSize:11, fontFamily:'monospace',
                  wordBreak:'break-all', color:'#047857', lineHeight:1.5 }}>
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

            {/* Instructor link */}
            <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, padding:20, marginBottom:20 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--text-1)', marginBottom:6 }}>📨 讲师参考方案链接</div>
              <div style={{ fontSize:12, color:'var(--text-2)', marginBottom:12 }}>
                包含完整渠道需求、补充信息、已选课程与课纲、参考 SKU 列表。讲师打开后只读查看。
              </div>
              {instructorLink && (
                <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:8,
                  padding:'10px 12px', marginBottom:12, fontSize:11, fontFamily:'monospace',
                  wordBreak:'break-all', color:'#1D4ED8', lineHeight:1.5 }}>
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
              <button className="btn btn-primary" onClick={handleSave}>💾 保存草稿</button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
