import { useState, useEffect } from 'react'

const STORAGE_KEY = 'zx_schedule_events'

const EVENT_COLORS = [
  { label: '外部培训', color: '#2D6A4F', bg: '#D1FAE5' },
  { label: '内部培训', color: '#1D4ED8', bg: '#DBEAFE' },
  { label: '讲师沟通', color: '#B45309', bg: '#FEF3C7' },
  { label: '其他', color: '#6D28D9', bg: '#EDE9FE' },
]

function loadEvents() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}
function saveEvents(evs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(evs))
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}
function getFirstDayOfWeek(year, month) {
  return new Date(year, month, 1).getDay() // 0=Sun
}
function fmt(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

export function Schedule() {
  const today = new Date()
  const [year,  setYear]  = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [events, setEvents] = useState([])

  // Modal state
  const [modal, setModal] = useState(null)   // { date, event? }
  const [form, setForm]   = useState({})

  useEffect(() => { setEvents(loadEvents()) }, [])

  /* ── Navigation ── */
  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  /* ── Calendar grid ── */
  const daysInMonth  = getDaysInMonth(year, month)
  const firstWeekday = getFirstDayOfWeek(year, month)
  const cells = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  /* ── Events helpers ── */
  function eventsOnDay(day) {
    return events.filter(e => e.date === fmt(year, month, day))
  }

  /* ── Open modal to add/edit ── */
  function openAdd(day) {
    const date = fmt(year, month, day)
    setForm({ date, title: '', instructor: '', location: '', note: '', colorIdx: 0 })
    setModal({ mode: 'add', date })
  }
  function openEdit(ev, e) {
    e.stopPropagation()
    setForm({ ...ev, colorIdx: EVENT_COLORS.findIndex(c => c.color === ev.color) ?? 0 })
    setModal({ mode: 'edit', id: ev.id })
  }

  /* ── Save / delete ── */
  function handleSave() {
    if (!form.title?.trim()) return
    const colorDef = EVENT_COLORS[form.colorIdx ?? 0]
    const ev = {
      id: modal.mode === 'edit' ? modal.id : Date.now().toString(),
      date: form.date,
      title: form.title.trim(),
      instructor: form.instructor?.trim() || '',
      location: form.location?.trim() || '',
      note: form.note?.trim() || '',
      color: colorDef.color,
      bg: colorDef.bg,
    }
    let updated
    if (modal.mode === 'edit') {
      updated = events.map(e => e.id === ev.id ? ev : e)
    } else {
      updated = [...events, ev]
    }
    saveEvents(updated)
    setEvents(updated)
    setModal(null)
  }
  function handleDelete() {
    const updated = events.filter(e => e.id !== modal.id)
    saveEvents(updated)
    setEvents(updated)
    setModal(null)
  }

  const todayStr = fmt(today.getFullYear(), today.getMonth(), today.getDate())

  return (
    <>
      <div className="topbar">
        <span className="topbar-title">讲师排期</span>
        <span className="topbar-sub">· M4</span>
      </div>

      <div className="content">
        {/* ── Calendar header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={prevMonth} style={{
              width: 34, height: 34, borderRadius: '50%', border: '1.5px solid var(--border)',
              background: '#fff', cursor: 'pointer', fontSize: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>‹</button>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, minWidth: 120, textAlign: 'center' }}>
              {year} 年 {month + 1} 月
            </h2>
            <button onClick={nextMonth} style={{
              width: 34, height: 34, borderRadius: '50%', border: '1.5px solid var(--border)',
              background: '#fff', cursor: 'pointer', fontSize: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>›</button>
            <button onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()) }}
              style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: '1px solid var(--accent)',
                borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontWeight: 600 }}>
              今天
            </button>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 12 }}>
            {EVENT_COLORS.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-3)' }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: c.color, display: 'inline-block' }} />
                {c.label}
              </div>
            ))}
          </div>
        </div>

        {/* ── Calendar grid ── */}
        <div style={{
          background: '#fff', border: '1px solid var(--border)',
          borderRadius: 14, overflow: 'hidden',
          boxShadow: '0 1px 4px #0000000a',
        }}>
          {/* Week day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border)' }}>
            {WEEKDAYS.map((d, i) => (
              <div key={d} style={{
                padding: '10px 0', textAlign: 'center', fontSize: 12,
                fontWeight: 700, color: i === 0 || i === 6 ? '#EF4444' : 'var(--text-3)',
              }}>{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {cells.map((day, idx) => {
              if (!day) return (
                <div key={`empty-${idx}`} style={{
                  minHeight: 110, background: '#FAFAFA',
                  borderRight: (idx + 1) % 7 === 0 ? 'none' : '1px solid var(--border)',
                  borderBottom: '1px solid var(--border)',
                }} />
              )
              const dateStr = fmt(year, month, day)
              const dayEvs = eventsOnDay(day)
              const isToday = dateStr === todayStr
              const isWeekend = (firstWeekday + day - 1) % 7 === 0 || (firstWeekday + day - 1) % 7 === 6

              return (
                <div key={day}
                  onClick={() => openAdd(day)}
                  style={{
                    minHeight: 110, padding: '8px 10px',
                    background: isToday ? '#F0FDF4' : '#fff',
                    borderRight: (firstWeekday + day - 1) % 7 === 6 ? 'none' : '1px solid var(--border)',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    transition: 'background .15s',
                  }}
                  onMouseEnter={e => { if (!isToday) e.currentTarget.style.background = '#F7F7F7' }}
                  onMouseLeave={e => { e.currentTarget.style.background = isToday ? '#F0FDF4' : '#fff' }}
                >
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%', marginBottom: 6,
                    background: isToday ? 'var(--accent)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: isToday ? 700 : 400,
                    color: isToday ? '#fff' : isWeekend ? '#EF4444' : 'var(--text-1)',
                  }}>{day}</div>

                  {dayEvs.map(ev => (
                    <div key={ev.id}
                      onClick={e => openEdit(ev, e)}
                      style={{
                        fontSize: 11, padding: '2px 7px', borderRadius: 5,
                        background: ev.bg, color: ev.color,
                        fontWeight: 600, marginBottom: 3,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        cursor: 'pointer',
                        border: `1px solid ${ev.color}33`,
                      }}
                      title={ev.title + (ev.instructor ? ` · ${ev.instructor}` : '')}
                    >
                      {ev.title}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>

        <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 12, textAlign: 'center' }}>
          点击日期格子添加排期 · 点击排期条目可编辑或删除
        </p>
      </div>

      {/* ── Modal ── */}
      {modal && (
        <div style={{
          position: 'fixed', inset: 0, background: '#00000055',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setModal(null)}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: 28, width: 420,
            boxShadow: '0 20px 60px #00000030',
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 20px' }}>
              {modal.mode === 'add' ? `添加排期 · ${form.date}` : '编辑排期'}
            </h3>

            <div className="form-group">
              <label className="form-label">标题 <span style={{ color: 'var(--red)' }}>*</span></label>
              <input className="form-input" value={form.title || ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="如：股权架构培训 · 张总团队" autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">讲师</label>
              <input className="form-input" value={form.instructor || ''} onChange={e => setForm(f => ({ ...f, instructor: e.target.value }))}
                placeholder="讲师姓名" />
            </div>
            <div className="form-group">
              <label className="form-label">地点</label>
              <input className="form-input" value={form.location || ''} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                placeholder="培训城市或具体地址" />
            </div>
            <div className="form-group">
              <label className="form-label">备注</label>
              <input className="form-input" value={form.note || ''} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                placeholder="补充说明（可选）" />
            </div>

            {/* Color picker */}
            <div className="form-group">
              <label className="form-label">类型</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {EVENT_COLORS.map((c, i) => (
                  <button key={i} onClick={() => setForm(f => ({ ...f, colorIdx: i }))} style={{
                    padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    border: form.colorIdx === i ? `2px solid ${c.color}` : '2px solid transparent',
                    background: c.bg, color: c.color,
                  }}>{c.label}</button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              {modal.mode === 'edit' && (
                <button className="btn" onClick={handleDelete} style={{
                  background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA',
                }}>删除</button>
              )}
              <button className="btn btn-secondary" onClick={() => setModal(null)} style={{ marginLeft: modal.mode === 'edit' ? 0 : 'auto' }}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleSave}
                style={{ marginLeft: modal.mode === 'edit' ? 'auto' : 0 }}
                disabled={!form.title?.trim()}>
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
