import { useState } from 'react'
import { CourseMatch, CONTEXT_KEY } from './CourseMatch'

const CHANNELS = [
  '不确定', '直销', '券商/投行渠道', '家办/联办',
  '律所/税务所', '资产管理机构', '企业内训', '其他',
]
const AUDIENCES = [
  '不确定', '高净值客户家庭', '家族办公室从业者', '券商/投行从业者',
  '律所/税务所从业者', '企业高管', '资产管理从业者', '综合受众',
]
const DURATIONS = ['半天（3-4h）', '一天（6-8h）', '两天', '一个模块（1-2h）', '待定']

function makePortalCtx(form) {
  const ts = Date.now()
  const orderId = `PORTAL-${ts}`
  return {
    orderId,
    order: {
      id: orderId,
      company: form.company || '（直接咨询）',
      contact: form.contact || '',
      channel: form.channel,
      status: '课程匹配',
      source: 'portal',
      createdAt: new Date().toISOString(),
    },
    editForm: {
      channel: form.channel,
      contact: form.contact || '',
      company: form.company || '',
      audience: form.audience,
      scale: '',
      duration: form.duration,
      budget: '',
      background: form.background || '',
      goals: '',
      notes: '',
    },
    supplementText: form.supplement || '',
    aiResult: null,
    editCourseIds: [],
    editOutline: '',
    selectedInstructors: [],
  }
}

function loadHistory(userName) {
  try { return JSON.parse(localStorage.getItem(`zx_history_${userName}`) || '[]') } catch { return [] }
}

function deleteHistoryRecord(userName, id) {
  const hist = loadHistory(userName).filter(h => h.id !== id)
  localStorage.setItem(`zx_history_${userName}`, JSON.stringify(hist))
}

function fmt(isoStr) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

/* ── 历史记录列表页 ── */
function HistoryView({ user, onBack, onLoad }) {
  const [list, setList] = useState(() => loadHistory(user.name))

  function handleDelete(id) {
    deleteHistoryRecord(user.name, id)
    setList(loadHistory(user.name))
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:28 }}>
        <button
          onClick={onBack}
          style={{
            background:'none', border:'1px solid var(--border)', borderRadius:8,
            padding:'6px 14px', fontSize:13, color:'var(--text-2)', cursor:'pointer',
          }}
        >← 返回</button>
        <h2 style={{ fontSize:20, fontWeight:700, fontFamily:"'Noto Serif SC', serif", margin:0 }}>
          📂 历史记录
        </h2>
        <span style={{ fontSize:12, color:'var(--text-3)', marginLeft:4 }}>
          {user.name} · 共 {list.length} 条
        </span>
      </div>

      {list.length === 0 ? (
        <div style={{
          textAlign:'center', padding:'60px 0',
          color:'var(--text-3)', fontSize:14,
        }}>
          <div style={{ fontSize:36, marginBottom:12 }}>📭</div>
          暂无历史记录，点击「保存草稿」后自动生成
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {list.map(rec => {
            const title = rec.company || rec.channel || '未命名'
            const courseNames = (rec.editCourseIds || []).length
            const hasAI = !!rec.aiResult
            const hasSKU = !!(rec.skuMatches?.length)
            return (
              <div key={rec.id} style={{
                background:'var(--bg-card)', border:'1px solid var(--border)',
                borderRadius:14, padding:'18px 20px',
              }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    {/* 标题行 */}
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, flexWrap:'wrap' }}>
                      <span style={{ fontSize:15, fontWeight:700, color:'var(--text-1)' }}>{title}</span>
                      {rec.contact && (
                        <span style={{ fontSize:12, color:'var(--text-3)' }}>· {rec.contact}</span>
                      )}
                      {hasAI && (
                        <span style={{ fontSize:10, fontWeight:700, background:'#D1FAE5', color:'#065F46',
                          padding:'2px 8px', borderRadius:99 }}>🤖 AI已分析</span>
                      )}
                      {hasSKU && (
                        <span style={{ fontSize:10, fontWeight:700, background:'#EFF6FF', color:'#1D4ED8',
                          padding:'2px 8px', borderRadius:99 }}>SKU {rec.skuMatches.length}条</span>
                      )}
                    </div>
                    {/* 详情行 */}
                    <div style={{ display:'flex', gap:16, fontSize:12, color:'var(--text-3)', flexWrap:'wrap' }}>
                      <span>🕐 {fmt(rec.savedAt)}</span>
                      {rec.channel && rec.channel !== title && <span>渠道：{rec.channel}</span>}
                      <span>已选课程：{courseNames} 门</span>
                      {rec.supplementText && (
                        <span style={{ maxWidth:220, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          📝 {rec.supplementText.slice(0,40)}{rec.supplementText.length>40?'…':''}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* 操作按钮 */}
                  <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => onLoad(rec)}
                    >继续编辑</button>
                    <button
                      onClick={() => handleDelete(rec.id)}
                      style={{
                        background:'none', border:'1px solid #FCA5A5', borderRadius:8,
                        padding:'5px 10px', fontSize:12, color:'#DC2626', cursor:'pointer',
                      }}
                      title="删除此记录"
                    >删除</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ── 主组件 ── */
export function PortalCourseMatch({ user }) {
  // view: 'form' | 'match' | 'history'
  const [view, setView] = useState('form')
  const [form, setForm] = useState({
    channel: CHANNELS[0],
    audience: AUDIENCES[0],
    duration: DURATIONS[4],
    company: '',
    contact: '',
    background: '',
    supplement: '',
  })

  function handleStart(e) {
    e.preventDefault()
    const ctx = makePortalCtx(form)
    localStorage.setItem(CONTEXT_KEY, JSON.stringify(ctx))
    setView('match')
  }

  function handleBack() {
    localStorage.removeItem(CONTEXT_KEY)
    setView('form')
  }

  function handleLoadHistory(rec) {
    // 从历史记录恢复 context
    const ctx = {
      orderId: rec.id,
      order: rec.order || { id: rec.id, company: rec.company, channel: rec.channel, contact: rec.contact },
      editForm: rec.editForm || {},
      supplementText: rec.supplementText || '',
      aiResult: rec.aiResult || null,
      skuMatches: rec.skuMatches || null,
      editCourseIds: rec.editCourseIds || [],
      editOutline: rec.editOutline || '',
      selectedInstructors: rec.selectedInstructors || [],
    }
    localStorage.setItem(CONTEXT_KEY, JSON.stringify(ctx))
    setView('match')
  }

  if (view === 'history') {
    return (
      <HistoryView
        user={user}
        onBack={() => setView('form')}
        onLoad={handleLoadHistory}
      />
    )
  }

  if (view === 'match') {
    return (
      <CourseMatch
        user={user}
        navigate={dest => {
          if (dest === 'workorders' || dest === 'back') handleBack()
        }}
        portalMode
      />
    )
  }

  // ── 表单页 ──
  const histCount = loadHistory(user.name).length

  return (
    <div style={{ maxWidth: 620, margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
        <h2 style={{ fontSize:22, fontWeight:700, fontFamily:"'Noto Serif SC', serif", margin:0 }}>
          🎯 课程匹配
        </h2>
        <button
          onClick={() => setView('history')}
          style={{
            display:'flex', alignItems:'center', gap:6,
            background:'var(--bg-card)', border:'1px solid var(--border)',
            borderRadius:10, padding:'7px 14px', cursor:'pointer',
            fontSize:13, fontWeight:600, color:'var(--text-2)',
            transition:'all .15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.color='var(--accent)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text-2)' }}
        >
          📂 历史记录
          {histCount > 0 && (
            <span style={{
              background:'var(--accent)', color:'#fff',
              borderRadius:99, fontSize:11, fontWeight:700,
              padding:'1px 7px', marginLeft:2,
            }}>{histCount}</span>
          )}
        </button>
      </div>
      <p style={{ fontSize:13, color:'var(--text-3)', marginBottom:28 }}>
        填写客户基本信息，AI 将为您推荐最匹配的朝曦课程。
      </p>

      <form onSubmit={handleStart}>
        <div className="two-col" style={{ marginBottom: 0 }}>
          <div className="form-group">
            <label className="form-label">渠道类型</label>
            <select className="form-select" value={form.channel}
              onChange={e => setForm(p => ({ ...p, channel: e.target.value }))}>
              {CHANNELS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">目标受众</label>
            <select className="form-select" value={form.audience}
              onChange={e => setForm(p => ({ ...p, audience: e.target.value }))}>
              {AUDIENCES.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
        </div>

        <div className="two-col" style={{ marginBottom: 0 }}>
          <div className="form-group">
            <label className="form-label">客户/机构名称（选填）</label>
            <input className="form-input" placeholder="如：XX 家族办公室"
              value={form.company}
              onChange={e => setForm(p => ({ ...p, company: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">联系人（选填）</label>
            <input className="form-input" placeholder="联系人姓名"
              value={form.contact}
              onChange={e => setForm(p => ({ ...p, contact: e.target.value }))} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">培训时长</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {DURATIONS.map(d => (
              <button key={d} type="button"
                onClick={() => setForm(p => ({ ...p, duration: d }))}
                style={{
                  padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', border: '1px solid var(--border)',
                  background: form.duration === d ? 'var(--accent)' : 'var(--bg-card)',
                  color: form.duration === d ? '#fff' : 'var(--text-2)',
                  transition: 'all .15s',
                }}>{d}</button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">客户背景 / 痛点描述（选填，越详细 AI 匹配越准确）</label>
          <textarea className="form-textarea" rows={3}
            placeholder="例如：客户是大型家族办公室，主要管理人在关注境外资产配置与家族传承问题，希望系统了解法律架构…"
            value={form.background}
            onChange={e => setForm(p => ({ ...p, background: e.target.value }))} />
        </div>

        <div className="form-group">
          <label className="form-label">补充材料（选填）</label>
          <textarea className="form-textarea" rows={2}
            placeholder="可粘贴会议纪要、邮件摘录、需求描述等…"
            value={form.supplement}
            onChange={e => setForm(p => ({ ...p, supplement: e.target.value }))} />
        </div>

        <button type="submit" className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', padding: '11px 0', fontSize: 14 }}>
          开始课程匹配 →
        </button>
      </form>
    </div>
  )
}
