import { useState } from 'react'

const PORTAL_ORDER_KEY = 'zx_portal_submitted_orders'
function loadPortalOrders() { try { return JSON.parse(localStorage.getItem(PORTAL_ORDER_KEY) || '[]') } catch { return [] } }
function savePortalOrder(order) {
  const list = loadPortalOrders()
  list.unshift(order)
  localStorage.setItem(PORTAL_ORDER_KEY, JSON.stringify(list))
}

const EMPTY_FORM = {
  channel: '',
  contact: '',
  contactRole: '',
  phone: '',
  salesName: '',
  date: '',
  audience: '',
  people: '',
  duration: '',
  topic: '',
  note: '',
}

export function PortalWorkOrder({ user }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitted, setSubmitted] = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const order = {
      id: `PORTAL-${Date.now()}`,
      source: 'portal',
      status: '待处理',
      submittedAt: new Date().toISOString(),
      channel: form.channel,
      contact: form.contact,
      contactRole: form.contactRole,
      phone: form.phone,
      salesName: form.salesName,
      date: form.date || '待定',
      audience: form.audience,
      people: parseInt(form.people) || 0,
      duration: form.duration,
      topic: form.topic,
      note: form.note,
    }
    savePortalOrder(order)
    setSubmitted(true)
  }

  function handleReset() {
    setForm(EMPTY_FORM)
    setSubmitted(false)
  }

  const css = {
    '--bg': '#F7F4EF',
    '--bg-card': '#FFFFFF',
    '--accent': '#2D6A4F',
    '--border': '#E4DDD3',
    '--text-1': '#18181B',
    '--text-2': '#52525B',
    '--text-3': '#A1A1AA',
  }

  return (
    <div style={{ ...css, minHeight: '100%', background: 'var(--bg)', padding: '32px 16px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>

        {submitted ? (
          /* ── Success screen ── */
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: '56px 40px',
            textAlign: 'center',
            boxShadow: '0 2px 16px rgba(0,0,0,.06)',
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'linear-gradient(135deg, #2D6A4F, #40916C)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
              fontSize: 36,
            }}>✓</div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-1)', marginBottom: 12 }}>需求已提交</h2>
            <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 32 }}>
              我们将在 1–2 个工作日内与您联系确认方案
            </p>
            <button
              onClick={handleReset}
              style={{
                padding: '12px 32px',
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--bg-card)',
                color: 'var(--text-2)',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >再次提交</button>
          </div>
        ) : (
          /* ── Form ── */
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: '36px 40px',
            boxShadow: '0 2px 16px rgba(0,0,0,.06)',
          }}>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)', marginBottom: 6 }}>提交培训需求</h1>
              <p style={{ fontSize: 13, color: 'var(--text-3)' }}>填写以下信息，我们将在 1–2 个工作日内与您联系</p>
            </div>

            <form onSubmit={handleSubmit}>

              {/* 机构名称 */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>
                  机构名称 <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  name="channel"
                  value={form.channel}
                  onChange={handleChange}
                  required
                  placeholder="如：招商银行私行部"
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 8,
                    border: '1px solid var(--border)', fontSize: 14,
                    color: 'var(--text-1)', background: 'var(--bg)',
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* 联系人姓名 */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>
                  联系人姓名 <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  name="contact"
                  value={form.contact}
                  onChange={handleChange}
                  required
                  placeholder="姓名"
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 8,
                    border: '1px solid var(--border)', fontSize: 14,
                    color: 'var(--text-1)', background: 'var(--bg)',
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* 联系人职务 */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>
                  联系人职务 <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 400 }}>选填</span>
                </label>
                <input
                  name="contactRole"
                  value={form.contactRole}
                  onChange={handleChange}
                  placeholder="如：私行部总监"
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 8,
                    border: '1px solid var(--border)', fontSize: 14,
                    color: 'var(--text-1)', background: 'var(--bg)',
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* 联系方式 */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>
                  联系方式 <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  placeholder="手机/微信"
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 8,
                    border: '1px solid var(--border)', fontSize: 14,
                    color: 'var(--text-1)', background: 'var(--bg)',
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* 对接销售 */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>
                  对接销售 <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 400 }}>选填</span>
                </label>
                <input
                  name="salesName"
                  value={form.salesName}
                  onChange={handleChange}
                  placeholder="销售姓名"
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 8,
                    border: '1px solid var(--border)', fontSize: 14,
                    color: 'var(--text-1)', background: 'var(--bg)',
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* 预计培训日期 */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>
                  预计培训日期 <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 400 }}>选填</span>
                </label>
                <input
                  name="date"
                  type="date"
                  value={form.date}
                  onChange={handleChange}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 8,
                    border: '1px solid var(--border)', fontSize: 14,
                    color: 'var(--text-1)', background: 'var(--bg)',
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* 参与人员类型 */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>
                  参与人员类型 <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <select
                  name="audience"
                  value={form.audience}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 8,
                    border: '1px solid var(--border)', fontSize: 14,
                    color: form.audience ? 'var(--text-1)' : 'var(--text-3)',
                    background: 'var(--bg)', outline: 'none', boxSizing: 'border-box',
                    appearance: 'none',
                  }}
                >
                  <option value="" disabled>请选择</option>
                  <option value="私行/财富管理客户经理">私行/财富管理客户经理</option>
                  <option value="投顾/理财师">投顾/理财师</option>
                  <option value="机构高管/管理层">机构高管/管理层</option>
                  <option value="其他">其他</option>
                </select>
              </div>

              {/* 预计人数 */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>
                  预计人数 <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 400 }}>选填</span>
                </label>
                <input
                  name="people"
                  type="number"
                  min="1"
                  value={form.people}
                  onChange={handleChange}
                  placeholder="人数"
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 8,
                    border: '1px solid var(--border)', fontSize: 14,
                    color: 'var(--text-1)', background: 'var(--bg)',
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* 培训时长偏好 */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>
                  培训时长偏好 <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 400 }}>选填</span>
                </label>
                <select
                  name="duration"
                  value={form.duration}
                  onChange={handleChange}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 8,
                    border: '1px solid var(--border)', fontSize: 14,
                    color: form.duration ? 'var(--text-1)' : 'var(--text-3)',
                    background: 'var(--bg)', outline: 'none', boxSizing: 'border-box',
                    appearance: 'none',
                  }}
                >
                  <option value="">请选择（可选）</option>
                  <option value="1小时">1小时</option>
                  <option value="1.5小时">1.5小时</option>
                  <option value="2小时">2小时</option>
                  <option value="2.5小时">2.5小时</option>
                  <option value="半天">半天</option>
                  <option value="全天">全天</option>
                </select>
              </div>

              {/* 培训主题方向 */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>
                  培训主题方向 <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <textarea
                  name="topic"
                  value={form.topic}
                  onChange={handleChange}
                  required
                  rows={4}
                  placeholder="请描述主要需求方向，例如：跨境税务规划、股权架构、家族信托等"
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 8,
                    border: '1px solid var(--border)', fontSize: 14,
                    color: 'var(--text-1)', background: 'var(--bg)',
                    outline: 'none', boxSizing: 'border-box',
                    resize: 'vertical', lineHeight: 1.6,
                  }}
                />
              </div>

              {/* 特殊要求 */}
              <div style={{ marginBottom: 28 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>
                  特殊要求 <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 400 }}>选填</span>
                </label>
                <textarea
                  name="note"
                  value={form.note}
                  onChange={handleChange}
                  rows={3}
                  placeholder="如有特殊场地、语言、时间要求请在此说明"
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 8,
                    border: '1px solid var(--border)', fontSize: 14,
                    color: 'var(--text-1)', background: 'var(--bg)',
                    outline: 'none', boxSizing: 'border-box',
                    resize: 'vertical', lineHeight: 1.6,
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: 10,
                  border: 'none',
                  background: 'linear-gradient(135deg, #2D6A4F, #40916C)',
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                  letterSpacing: 0.5,
                }}
              >提交需求工单</button>

            </form>
          </div>
        )}
      </div>
    </div>
  )
}
