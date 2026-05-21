import { useState, useEffect, useMemo } from 'react'
import { INSTRUCTORS } from '../data/mock'
import { fetchSchedule, saveSchedule, loadCache, getToken, setToken, verifyWriteToken } from '../data/scheduleStore'

/* ─── Event type colours (individual view) ─── */
const EVENT_TYPES = [
  { label: '外部培训', color: '#2D6A4F', bg: '#D1FAE5' },
  { label: '内部培训', color: '#1D4ED8', bg: '#DBEAFE' },
  { label: '讲师沟通', color: '#B45309', bg: '#FEF3C7' },
  { label: '其他',     color: '#6D28D9', bg: '#EDE9FE' },
]

/* ─── Per-instructor colours (combined view) ─── */
const INST_COLORS = [
  { color: '#0369A1', bg: '#E0F2FE' },  // 刘怀宇 – sky
  { color: '#0F766E', bg: '#CCFBF1' },  // 李红岩 – teal
  { color: '#C2410C', bg: '#FFEDD5' },  // 熊能   – orange
  { color: '#7C3AED', bg: '#EDE9FE' },  // 胡顺亥 – violet
]

function instColorOf(instructorId) {
  const i = INSTRUCTORS.findIndex(x => x.id === instructorId)
  return INST_COLORS[i] ?? INST_COLORS[0]
}
function typeColorOf(type) {
  return EVENT_TYPES.find(t => t.label === type) ?? EVENT_TYPES[0]
}

/* ─── 兼容旧格式（instructor 曾是自由文本，无 type 字段） ─── */
function normalize(raw) {
  return (raw || []).map(ev => {
    let instructorId = ev.instructorId || ''
    if (!instructorId && ev.instructor) {
      instructorId = INSTRUCTORS.find(i => i.name === ev.instructor)?.id || ''
    }
    return { ...ev, instructorId, type: ev.type || '外部培训' }
  })
}

/* ─── Date utils ─── */
const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']
function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate() }
function firstDOW(y, m)    { return new Date(y, m, 1).getDay() }
function dateFmt(y, m, d)  { return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` }
function todayStr()        { const t = new Date(); return dateFmt(t.getFullYear(), t.getMonth(), t.getDate()) }

/* ─── Tabs config ─── */
const TABS = [
  { key: 'all', label: '整合视图' },
  ...INSTRUCTORS.map((inst, i) => ({ key: inst.id, label: inst.name, ...INST_COLORS[i] })),
]

/* ════════════════════════════════════════════
   Component
════════════════════════════════════════════ */
export function Schedule() {
  const now = new Date()
  const [year,  setYear]  = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [events, setEvents] = useState(() => normalize(loadCache()))  // 先用本地缓存渲染
  const [tab,    setTab]   = useState('all')
  const [modal,  setModal] = useState(null)
  const [form,   setForm]  = useState({})

  /* ── 共享同步状态 ── */
  const [syncState, setSyncState]   = useState('loading')   // loading | synced | offline | needToken | saving
  const [tokenModal, setTokenModal] = useState(false)
  const [tokenInput, setTokenInput] = useState('')
  const [tokenError, setTokenError] = useState('')
  const [tokenSaving, setTokenSaving] = useState(false)

  /* ── 从云端加载（首次自动迁移本地数据） ── */
  async function reload() {
    setSyncState('loading')
    const localBefore = normalize(loadCache())
    const { events: remote, offline } = await fetchSchedule()
    if (offline) {
      setEvents(localBefore)
      setSyncState('offline')
      return
    }
    const remoteN = normalize(remote)
    // 云端为空但本地有数据 → 尝试迁移上传
    if (remoteN.length === 0 && localBefore.length > 0) {
      if (getToken()) {
        const r = await saveSchedule(localBefore)
        setEvents(localBefore)
        setSyncState(r.ok ? 'synced' : (r.needToken ? 'needToken' : 'offline'))
      } else {
        setEvents(localBefore)        // 先展示本地，提示配置 token 同步
        setSyncState('needToken')
      }
      return
    }
    setEvents(remoteN)
    setSyncState('synced')
  }

  useEffect(() => { reload() }, [])

  /* ── 持久化到云端 ── */
  async function persist(updated) {
    setEvents(updated)
    setSyncState('saving')
    const r = await saveSchedule(updated)
    if (r.ok)            setSyncState('synced')
    else if (r.needToken) { setSyncState('needToken'); setTokenModal(true) }
    else                 setSyncState('offline')
  }

  /* ── Token 配置 ── */
  async function handleSaveToken() {
    const t = tokenInput.trim()
    if (!t) { setTokenError('请输入 token'); return }
    setTokenSaving(true); setTokenError('')
    const ok = await verifyWriteToken(t)
    if (!ok) { setTokenError('验证失败：token 无效或无本仓库写权限'); setTokenSaving(false); return }
    setToken(t)
    setTokenModal(false); setTokenInput(''); setTokenSaving(false)
    // 配置成功后：把当前本地排期同步上去，再重新拉取
    const r = await saveSchedule(events)
    setSyncState(r.ok ? 'synced' : 'offline')
  }

  /* ── Month nav ── */
  function prev() { if (month === 0) { setYear(y => y - 1); setMonth(11) } else setMonth(m => m - 1) }
  function next() { if (month === 11) { setYear(y => y + 1); setMonth(0) } else setMonth(m => m + 1) }

  /* ── Calendar cells ── */
  const totalDays = daysInMonth(year, month)
  const startDOW  = firstDOW(year, month)
  const cells = [...Array(startDOW).fill(null), ...Array.from({ length: totalDays }, (_, i) => i + 1)]

  /* ── Filtered events for current tab ── */
  const visible = useMemo(() =>
    tab === 'all' ? events : events.filter(e => e.instructorId === tab),
  [events, tab])

  function dayEvents(d) { return visible.filter(e => e.date === dateFmt(year, month, d)) }

  const today = todayStr()

  /* ── Monthly count for instructor bio card ── */
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`
  function monthCount(instId) { return events.filter(e => e.instructorId === instId && e.date.startsWith(monthPrefix)).length }

  /* ── Upcoming (next 30 days) for individual tabs ── */
  const upcoming = useMemo(() => {
    if (tab === 'all') return []
    const limit = new Date(Date.now() + 30 * 86400000)
    const limitStr = dateFmt(limit.getFullYear(), limit.getMonth(), limit.getDate())
    return events
      .filter(e => e.instructorId === tab && e.date >= today && e.date <= limitStr)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 12)
  }, [events, tab, today])

  /* ── Modal helpers ── */
  function openAdd(day) {
    const date = dateFmt(year, month, day)
    setForm({ date, title: '', instructorId: tab === 'all' ? '' : tab, type: '外部培训', location: '', note: '' })
    setModal({ mode: 'add' })
  }
  function openEdit(ev, e) {
    e.stopPropagation()
    setForm({ ...ev })
    setModal({ mode: 'edit', id: ev.id })
  }
  function handleSave() {
    if (!form.title?.trim() || !form.instructorId) return
    const ev = {
      id: modal.mode === 'edit' ? modal.id : String(Date.now()),
      date: form.date,
      title: form.title.trim(),
      instructorId: form.instructorId,
      type: form.type || '外部培训',
      location: form.location?.trim() || '',
      note: form.note?.trim() || '',
    }
    const updated = modal.mode === 'edit'
      ? events.map(e => e.id === ev.id ? ev : e)
      : [...events, ev]
    setModal(null); persist(updated)
  }
  function handleDelete() {
    const updated = events.filter(e => e.id !== modal.id)
    setModal(null); persist(updated)
  }

  const currentInst = tab !== 'all' ? INSTRUCTORS.find(i => i.id === tab) : null
  const currentInstIdx = tab !== 'all' ? INSTRUCTORS.findIndex(i => i.id === tab) : -1

  return (
    <>
      {/* ── Topbar ── */}
      <div className="topbar">
        <span className="topbar-title">讲师排期</span>
        <span className="topbar-sub">· M4</span>
        <div className="topbar-actions" style={{ display:'flex', alignItems:'center', gap:10 }}>
          {/* 同步状态 */}
          <span style={{ fontSize:12, fontWeight:600, display:'flex', alignItems:'center', gap:5,
            color: syncState === 'synced' ? '#059669'
              : syncState === 'saving' || syncState === 'loading' ? '#6B7280'
              : syncState === 'needToken' ? '#B45309' : '#DC2626' }}>
            {syncState === 'synced'    && '☁ 已同步'}
            {syncState === 'saving'    && '⏳ 保存中…'}
            {syncState === 'loading'   && '⏳ 加载中…'}
            {syncState === 'offline'   && '⚠ 未连接云端'}
            {syncState === 'needToken' && '🔒 待配置 Token'}
          </span>
          <button className="btn btn-secondary btn-sm" onClick={reload} title="重新拉取云端最新排期">⟳ 刷新</button>
          <button className="btn btn-secondary btn-sm" onClick={() => setTokenModal(true)} title="配置写入权限 Token">⚙ Token</button>
          <button className="btn btn-primary btn-sm" onClick={() => {
            const date = dateFmt(year, month, now.getDate())
            setForm({ date, title: '', instructorId: tab === 'all' ? '' : tab, type: '外部培训', location: '', note: '' })
            setModal({ mode: 'add' })
          }}>＋ 添加排期</button>
        </div>
      </div>

      <div className="content">

        {/* ── Tab bar ── */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)' }}>
          {TABS.map(t => {
            const active = tab === t.key
            const inst = t.key !== 'all' ? INSTRUCTORS.find(i => i.id === t.key) : null
            return (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                padding: '9px 18px', borderRadius: '8px 8px 0 0', cursor: 'pointer',
                fontSize: 13, fontWeight: active ? 700 : 500,
                border: '1px solid var(--border)',
                borderBottom: active ? '1px solid var(--bg-card)' : '1px solid var(--border)',
                marginBottom: active ? -1 : 0,
                background: active ? 'var(--bg-card)' : 'transparent',
                color: active ? (t.color || 'var(--text-1)') : 'var(--text-3)',
                display: 'flex', alignItems: 'center', gap: 7,
                transition: 'all .15s',
              }}>
                {t.key === 'all'
                  ? <span style={{ fontSize: 14 }}>📅</span>
                  : (
                    <span style={{
                      width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                      background: active ? t.color : '#D4D4D8',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 700, color: '#fff',
                    }}>{inst?.avatar}</span>
                  )
                }
                {t.label}
                {t.key !== 'all' && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, minWidth: 18, textAlign: 'center',
                    padding: '1px 6px', borderRadius: 99,
                    background: active ? t.color : 'var(--border)',
                    color: active ? '#fff' : 'var(--text-3)',
                  }}>{monthCount(t.key)}</span>
                )}
              </button>
            )
          })}
        </div>

        {/* ── Instructor bio card ── */}
        {currentInst && (
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 12, marginBottom: 16, overflow: 'hidden',
          }}>
            {/* Top row: avatar + info + month count */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px' }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
                background: INST_COLORS[currentInstIdx].color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, fontWeight: 700, color: '#fff',
              }}>{currentInst.avatar}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{currentInst.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>
                  {currentInst.title}
                  {currentInst.city && ` · ${currentInst.city}`}
                  {currentInst.specialties?.length > 0 && ` · ${currentInst.specialties.slice(0, 3).join('、')}`}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 2 }}>{year}年{month + 1}月排期数</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: INST_COLORS[currentInstIdx].color, lineHeight: 1 }}>
                  {monthCount(tab)}
                </div>
              </div>
            </div>
            {/* Bottom row: view + download buttons */}
            <div style={{
              display: 'flex', gap: 8, padding: '10px 20px 14px',
              borderTop: '1px solid var(--border)',
            }}>
              <a
                href={`instructors/${currentInst.id}.html`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  background: INST_COLORS[currentInstIdx].bg,
                  color: INST_COLORS[currentInstIdx].color,
                  border: `1px solid ${INST_COLORS[currentInstIdx].color}33`,
                  textDecoration: 'none', transition: 'opacity .15s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '.8'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                👤 查看讲师介绍
              </a>
              <a
                href={`instructors/${currentInst.id}.docx`}
                download={`朝曦家办讲师-${currentInst.name}.docx`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  background: 'var(--bg-page)',
                  color: 'var(--text-2)',
                  border: '1px solid var(--border)',
                  textDecoration: 'none', transition: 'opacity .15s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '.8'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                ⬇ 下载介绍文档
              </a>
            </div>
          </div>
        )}

        {/* ── Calendar nav + legend ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={prev} style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid var(--border)', background: 'var(--bg-card)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, minWidth: 110, textAlign: 'center' }}>
              {year} 年 {month + 1} 月
            </h2>
            <button onClick={next} style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid var(--border)', background: 'var(--bg-card)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
            <button onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()) }}
              style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: '1px solid var(--accent)', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontWeight: 600 }}>今天</button>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {tab === 'all'
              ? INSTRUCTORS.map((inst, i) => (
                  <div key={inst.id} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-2)' }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: INST_COLORS[i].color, display: 'inline-block', flexShrink: 0 }} />
                    {inst.name}
                  </div>
                ))
              : EVENT_TYPES.map(t => (
                  <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-2)' }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: t.color, display: 'inline-block', flexShrink: 0 }} />
                    {t.label}
                  </div>
                ))
            }
          </div>
        </div>

        {/* ── Calendar grid ── */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px #0000000a' }}>
          {/* Weekday header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border)' }}>
            {WEEKDAYS.map((d, i) => (
              <div key={d} style={{
                padding: '10px 0', textAlign: 'center', fontSize: 12, fontWeight: 700,
                color: i === 0 || i === 6 ? '#EF4444' : 'var(--text-3)',
              }}>{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {cells.map((day, idx) => {
              if (!day) return (
                <div key={`e${idx}`} style={{
                  minHeight: 110, background: '#FAFAF9',
                  borderRight: (idx + 1) % 7 === 0 ? 'none' : '1px solid var(--border)',
                  borderBottom: '1px solid var(--border)',
                }} />
              )
              const dateStr  = dateFmt(year, month, day)
              const evs      = dayEvents(day)
              const isToday  = dateStr === today
              const weekPos  = (startDOW + day - 1) % 7
              const isWeekend = weekPos === 0 || weekPos === 6
              const isLastCol = weekPos === 6

              return (
                <div key={day} onClick={() => openAdd(day)} style={{
                  minHeight: 110, padding: '8px 8px 6px',
                  background: isToday ? '#F0FDF4' : 'var(--bg-card)',
                  borderRight: isLastCol ? 'none' : '1px solid var(--border)',
                  borderBottom: '1px solid var(--border)',
                  cursor: 'pointer', transition: 'background .12s',
                }}
                  onMouseEnter={e => { if (!isToday) e.currentTarget.style.background = '#F7F7F7' }}
                  onMouseLeave={e => { e.currentTarget.style.background = isToday ? '#F0FDF4' : 'var(--bg-card)' }}
                >
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%', marginBottom: 5,
                    background: isToday ? 'var(--accent)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: isToday ? 700 : 400,
                    color: isToday ? '#fff' : isWeekend ? '#EF4444' : 'var(--text-1)',
                  }}>{day}</div>

                  {evs.slice(0, 3).map(ev => {
                    const c = tab === 'all' ? instColorOf(ev.instructorId) : typeColorOf(ev.type)
                    const instName = INSTRUCTORS.find(i => i.id === ev.instructorId)
                    return (
                      <div key={ev.id} onClick={e => openEdit(ev, e)}
                        title={`${ev.title}${instName ? ' · ' + instName.name : ''}${ev.location ? ' · ' + ev.location : ''}`}
                        style={{
                          fontSize: 11, padding: '2px 6px', borderRadius: 4,
                          background: c.bg, color: c.color, fontWeight: 600,
                          marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden',
                          textOverflow: 'ellipsis', cursor: 'pointer',
                          border: `1px solid ${c.color}33`,
                          display: 'flex', alignItems: 'center', gap: 3,
                        }}>
                        {tab === 'all' && instName && (
                          <span style={{ flexShrink: 0, fontSize: 9, opacity: .85 }}>{instName.avatar}</span>
                        )}
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.title}</span>
                      </div>
                    )
                  })}
                  {evs.length > 3 && (
                    <div style={{ fontSize: 10, color: 'var(--text-3)', paddingLeft: 4 }}>+{evs.length - 3} 项</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Upcoming list (individual tabs only) ── */}
        {tab !== 'all' && upcoming.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.07em' }}>
              近 30 天排期
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {upcoming.map(ev => {
                const c = typeColorOf(ev.type)
                return (
                  <div key={ev.id} onClick={() => { setForm({ ...ev }); setModal({ mode: 'edit', id: ev.id }) }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '10px 16px', background: 'var(--bg-card)',
                      border: '1px solid var(--border)', borderRadius: 10, cursor: 'pointer',
                      transition: 'box-shadow .15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 10px #0000000e'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                  >
                    {/* Date badge */}
                    <div style={{
                      width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                      background: c.bg, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: c.color, lineHeight: 1 }}>{ev.date.slice(8)}</div>
                      <div style={{ fontSize: 9, color: c.color, opacity: .75 }}>{ev.date.slice(5, 7)}月</div>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-1)', marginBottom: 3 }}>{ev.title}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{
                          padding: '1px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700,
                          background: c.bg, color: c.color,
                        }}>{ev.type}</span>
                        {ev.location && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>📍 {ev.location}</span>}
                        {ev.note && <span style={{ fontSize: 11, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{ev.note}</span>}
                      </div>
                    </div>

                    <div style={{ fontSize: 11, color: 'var(--text-3)', flexShrink: 0 }}>
                      {ev.date === today ? <span style={{ color: 'var(--accent)', fontWeight: 700 }}>今天</span>
                        : ev.date === dateFmt(year, month, now.getDate() + 1) ? '明天'
                        : ev.date}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Empty upcoming hint ── */}
        {tab !== 'all' && upcoming.length === 0 && (
          <div style={{ marginTop: 20, padding: '20px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
            近 30 天暂无排期 · 点击日期格子添加
          </div>
        )}

        <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 14, textAlign: 'center' }}>
          点击日期格子添加排期 · 点击排期条目编辑或删除 · 排期数据云端共享，所有账号可见
        </p>
      </div>

      {/* ════════ Modal ════════ */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: '#00000055', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setModal(null)}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 28, width: 460, maxWidth: '95vw', boxShadow: '0 20px 60px #00000030' }}
            onClick={e => e.stopPropagation()}>

            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px' }}>
              {modal.mode === 'add' ? '添加排期' : '编辑排期'}
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '0 0 20px' }}>{form.date}</p>

            {/* Instructor buttons */}
            <div className="form-group">
              <label className="form-label">讲师 <span style={{ color: 'var(--red)' }}>*</span></label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {INSTRUCTORS.map((inst, i) => {
                  const sel = form.instructorId === inst.id
                  const ic  = INST_COLORS[i]
                  return (
                    <button key={inst.id} onClick={() => setForm(f => ({ ...f, instructorId: inst.id }))} style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      border: sel ? `2px solid ${ic.color}` : '2px solid var(--border)',
                      background: sel ? ic.bg : 'transparent',
                      color: sel ? ic.color : 'var(--text-2)',
                      transition: 'all .12s',
                    }}>
                      <span style={{
                        width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                        background: sel ? ic.color : '#D4D4D8',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, fontWeight: 700, color: '#fff',
                      }}>{inst.avatar}</span>
                      {inst.name}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Title */}
            <div className="form-group">
              <label className="form-label">标题 <span style={{ color: 'var(--red)' }}>*</span></label>
              <input className="form-input" value={form.title || ''} autoFocus
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="如：跨境税务规划培训 · 招行私行" />
            </div>

            {/* Type */}
            <div className="form-group">
              <label className="form-label">类型</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {EVENT_TYPES.map(t => (
                  <button key={t.label} onClick={() => setForm(f => ({ ...f, type: t.label }))} style={{
                    padding: '5px 13px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    border: form.type === t.label ? `2px solid ${t.color}` : '2px solid transparent',
                    background: t.bg, color: t.color,
                    transition: 'border .12s',
                  }}>{t.label}</button>
                ))}
              </div>
            </div>

            {/* Location + Note side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">地点</label>
                <input className="form-input" value={form.location || ''}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="城市 / 具体地址" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">备注</label>
                <input className="form-input" value={form.note || ''}
                  onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                  placeholder="补充说明（可选）" />
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              {modal.mode === 'edit' && (
                <button className="btn" onClick={handleDelete}
                  style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>删除</button>
              )}
              <button className="btn btn-secondary" onClick={() => setModal(null)}
                style={{ marginLeft: modal.mode === 'edit' ? 0 : 'auto' }}>取消</button>
              <button className="btn btn-primary" onClick={handleSave}
                style={{ marginLeft: modal.mode === 'edit' ? 'auto' : 0 }}
                disabled={!form.title?.trim() || !form.instructorId}>
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════ Token 配置 Modal ════════ */}
      {tokenModal && (
        <div style={{ position: 'fixed', inset: 0, background: '#00000055', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}
          onClick={() => setTokenModal(false)}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 28, width: 480, maxWidth: '95vw', boxShadow: '0 20px 60px #00000030' }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px' }}>配置 GitHub Token</h3>
            <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '0 0 18px', lineHeight: 1.6 }}>
              用于把排期写入云端，让所有账号共享。仅存储在本浏览器。<br/>
              <strong>查看排期无需 token</strong>，仅添加/编辑/删除需要。
            </p>
            <div className="form-group">
              <label className="form-label">GitHub Personal Access Token</label>
              <input className="form-input" type="password" value={tokenInput}
                onChange={e => { setTokenInput(e.target.value); setTokenError('') }}
                placeholder="github_pat_..." style={{ fontFamily: 'monospace' }} autoFocus />
              {tokenError && <div style={{ color: '#EF4444', fontSize: 12, marginTop: 6 }}>{tokenError}</div>}
            </div>
            <div style={{ background: 'var(--bg-page)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--text-3)', lineHeight: 1.8 }}>
              Token 需要 <strong>Contents：读和写</strong> 权限<br/>
              创建地址：github.com/settings/tokens?type=beta
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setTokenModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleSaveToken} disabled={tokenSaving}>
                {tokenSaving ? '验证中…' : '验证并保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
