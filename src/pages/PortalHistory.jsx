import { useState } from 'react'
import { CONTEXT_KEY } from './CourseMatch'

export function loadHistory(userName) {
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

export function PortalHistory({ user, onLoad }) {
  const [list, setList] = useState(() => loadHistory(user.name))

  function handleDelete(id) {
    deleteHistoryRecord(user.name, id)
    setList(loadHistory(user.name))
  }

  function handleLoad(rec) {
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
    onLoad()
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:28 }}>
        <h2 style={{ fontSize:20, fontWeight:700, fontFamily:"'Noto Serif SC', serif", margin:0 }}>
          📂 历史记录
        </h2>
        <span style={{ fontSize:12, color:'var(--text-3)' }}>
          {user.name} · 共 {list.length} 条
        </span>
      </div>

      {list.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:'var(--text-3)', fontSize:14 }}>
          <div style={{ fontSize:36, marginBottom:12 }}>📭</div>
          暂无历史记录，在「课程匹配」页点击「保存草稿」后自动生成
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {list.map(rec => {
            const title = rec.company || rec.channel || '未命名'
            return (
              <div key={rec.id} style={{
                background:'var(--bg-card)', border:'1px solid var(--border)',
                borderRadius:14, padding:'18px 20px',
              }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, flexWrap:'wrap' }}>
                      <span style={{ fontSize:15, fontWeight:700, color:'var(--text-1)' }}>{title}</span>
                      {rec.contact && <span style={{ fontSize:12, color:'var(--text-3)' }}>· {rec.contact}</span>}
                      {rec.aiResult && (
                        <span style={{ fontSize:10, fontWeight:700, background:'#D1FAE5', color:'#065F46',
                          padding:'2px 8px', borderRadius:99 }}>🤖 AI已分析</span>
                      )}
                      {rec.skuMatches?.length > 0 && (
                        <span style={{ fontSize:10, fontWeight:700, background:'#EFF6FF', color:'#1D4ED8',
                          padding:'2px 8px', borderRadius:99 }}>SKU {rec.skuMatches.length}条</span>
                      )}
                    </div>
                    <div style={{ display:'flex', gap:16, fontSize:12, color:'var(--text-3)', flexWrap:'wrap' }}>
                      <span>🕐 {fmt(rec.savedAt)}</span>
                      {rec.channel && rec.channel !== title && <span>渠道：{rec.channel}</span>}
                      <span>已选课程：{(rec.editCourseIds||[]).length} 门</span>
                      {rec.supplementText && (
                        <span style={{ maxWidth:240, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          📝 {rec.supplementText.slice(0,40)}{rec.supplementText.length>40?'…':''}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                    <button className="btn btn-primary btn-sm" onClick={() => handleLoad(rec)}>
                      继续编辑
                    </button>
                    <button
                      onClick={() => handleDelete(rec.id)}
                      style={{
                        background:'none', border:'1px solid #FCA5A5', borderRadius:8,
                        padding:'5px 10px', fontSize:12, color:'#DC2626', cursor:'pointer',
                      }}
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
