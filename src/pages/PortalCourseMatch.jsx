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

export function PortalCourseMatch({ user }) {
  const [started, setStarted] = useState(false)
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
    setStarted(true)
  }

  function handleBack() {
    localStorage.removeItem(CONTEXT_KEY)
    setStarted(false)
  }

  if (started) {
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

  return (
    <div style={{ maxWidth: 620, margin: '0 auto', padding: '40px 24px' }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, fontFamily: "'Noto Serif SC', serif" }}>
        🎯 课程匹配
      </h2>
      <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 28 }}>
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
