import { useState } from 'react'
import { SKU_LIST } from '../data/mock'

const MILESTONES = ['资质审核','自学测验','课前演练','评委评审','通关确认']
const STATES = [
  [['done','done','done','done','done'], '胡顺亥', '已通关'],
  [['done','done','current','pending','pending'], '刘怀宇', '进行中'],
  [['done','pending','pending','pending','pending'], '李红岩', '进行中'],
]
const DEPTS = ['全部','税务','资本市场','法律']

export function Qualification({ user }) {
  const [tab, setTab] = useState('qualification')
  const [deptFilter, setDeptFilter] = useState('全部')
  const [search, setSearch] = useState('')
  const [preview, setPreview] = useState(null)

  const filteredSku = SKU_LIST.filter(s => {
    const deptOk = deptFilter === '全部' || s.dept === deptFilter
    const searchOk = !search || s.name.includes(search) || s.id.toLowerCase().includes(search.toLowerCase())
    return deptOk && searchOk
  })

  const canDownload = user?.role === 'admin' || user?.role === 'teacher' || user?.role === 'bu'

  return (
    <>
      <div className="topbar">
        <span className="topbar-title">通关 & 素材库</span>
        <span className="topbar-sub">· M5 / M6</span>
        <div className="topbar-actions">
          <div className="chip-tabs" style={{marginBottom:0}}>
            <div className={`chip-tab${tab==='qualification'?' active':''}`} onClick={()=>setTab('qualification')}>通关管理</div>
            <div className={`chip-tab${tab==='sku'?' active':''}`} onClick={()=>setTab('sku')}>SKU素材库</div>
          </div>
        </div>
      </div>
      <div className="content">
        {tab === 'qualification' ? (
          <>
            <div className="page-hero">
              <h1>通关管理</h1>
              <p>讲师执行培训前须完成通关认定；里程碑节点按 T0→Td 天数比例压缩，通关必须在培训日前完成</p>
            </div>
            <div className="alert alert-warn">
              <span>⚠</span><span><strong>硬性规则：</strong>所有通关节点必须在培训日期前完成，系统不允许将任意里程碑排期至培训日期当天或之后。</span>
            </div>
            {STATES.map(([states, name, status], idx) => (
              <div key={idx} className="card" style={{marginBottom:16}}>
                <div className="card-header">
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <div style={{width:36,height:36,borderRadius:'50%',background:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700}}>{name[0]}</div>
                    <div>
                      <div style={{fontWeight:600}}>{name}</div>
                      <div style={{fontSize:11,color:'var(--text-3)'}}>工单 ZX-2026-003 · C5全球化资产配置</div>
                    </div>
                  </div>
                  <span className={`badge ${status==='已通关'?'badge-green':'badge-amber'}`}>{status}</span>
                </div>
                <div className="card-body">
                  <div style={{display:'flex',gap:0,position:'relative',marginTop:8}}>
                    {MILESTONES.map((m, i) => {
                      const s = states[i]
                      const isLast = i === MILESTONES.length-1
                      return (
                        <div key={m} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',position:'relative'}}>
                          {!isLast && <div style={{position:'absolute',top:13,left:'50%',width:'100%',height:2,background: s==='done'?'var(--accent)':'var(--border)',zIndex:0}} />}
                          <div className={`step-dot ${s}`} style={{zIndex:1,position:'relative'}}>{s==='done'?'✓':i+1}</div>
                          <div style={{fontSize:10,color:'var(--text-2)',marginTop:6,textAlign:'center',lineHeight:1.3}}>{m}</div>
                          <div style={{fontSize:10,color:'var(--text-3)',marginTop:2}}>
                            {s==='done'?'已完成':s==='current'?'进行中':'待开始'}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {idx === 1 && (
                    <div style={{marginTop:16}}>
                      <div style={{fontSize:12,color:'var(--text-2)',marginBottom:8}}>当前节点：课前演练 · 截止日期 <strong style={{color:'var(--amber)'}}>2026-05-12</strong></div>
                      <div className="progress-bar"><div className="progress-fill" style={{width:'40%',background:'var(--amber)'}} /></div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            <div className="page-hero">
              <h1>SKU素材库</h1>
              <p>基于 index.xlsx 索引检索PPT素材（369条），支持文字稿预览与原始PPT下载</p>
            </div>
            <div style={{display:'flex',gap:12,marginBottom:20,alignItems:'center'}}>
              <input className="form-input" style={{maxWidth:280}} placeholder="搜索SKU编号或名称..." value={search} onChange={e=>setSearch(e.target.value)} />
              <div className="chip-tabs" style={{marginBottom:0}}>
                {DEPTS.map(d=><div key={d} className={`chip-tab${deptFilter===d?' active':''}`} onClick={()=>setDeptFilter(d)}>{d}</div>)}
              </div>
              <span style={{fontSize:12,color:'var(--text-3)',marginLeft:'auto'}}>{filteredSku.length} 个SKU</span>
            </div>
            <div className="sku-grid">
              {filteredSku.map(sku => {
                const hasFile = sku.match !== null
                const matchClass = sku.match==='exact'?'tag-exact':sku.match==='fuzzy'?'tag-fuzzy':sku.match==='overview'?'tag-overview':'tag-none'
                const matchLabel = sku.match==='exact'?'精确匹配':sku.match==='fuzzy'?'模糊匹配':sku.match==='overview'?'概览':'暂无素材'
                return (
                  <div key={sku.id} className={`sku-card${!hasFile?' sku-disabled':''}`}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span className={`tag ${matchClass}`}>{matchLabel}</span>
                      <span style={{fontSize:10,color:'var(--text-3)',fontFamily:'monospace'}}>{sku.id}</span>
                    </div>
                    <div className="sku-name">{sku.name}</div>
                    <div className="sku-meta">
                      {sku.dept} · {hasFile ? `${sku.slides}张幻灯片 · ${(sku.words/1000).toFixed(1)}k字` : '无对应PPT文件'}
                    </div>
                    <div className="sku-actions">
                      <button className="btn btn-secondary btn-sm" disabled={!hasFile} onClick={()=>setPreview(sku)}>预览文字稿</button>
                      {canDownload
                        ? <button className="btn btn-primary btn-sm" disabled={!hasFile}>下载PPT</button>
                        : <span style={{fontSize:11,color:'var(--text-3)',alignSelf:'center'}}>无下载权限</span>
                      }
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {preview && (
        <div className="modal-overlay" onClick={()=>setPreview(null)}>
          <div className="modal" style={{width:560,maxHeight:'80vh',overflow:'auto'}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
              <h2 className="modal-title">{preview.name}</h2>
              <span className={`tag ${preview.match==='exact'?'tag-exact':'tag-fuzzy'}`}>{preview.match==='exact'?'精确匹配':'模糊匹配'}</span>
            </div>
            <p className="modal-sub">{preview.id} · {preview.dept} · {preview.slides}张幻灯片</p>
            <div style={{background:'var(--bg)',borderRadius:10,padding:16,fontSize:12,lineHeight:2,color:'var(--text-1)',maxHeight:320,overflowY:'auto'}}>
              <p><strong>第1页：封面</strong></p>
              <p>{preview.name} — 专业培训材料</p>
              <p><strong>第2页：目录</strong></p>
              <p>1. 背景与监管框架概述 · 2. 核心概念解析 · 3. 实务操作要点 · 4. 案例分析 · 5. 风险防范建议</p>
              <p><strong>第3页：背景概述</strong></p>
              <p>本模块聚焦{preview.name}的核心要点，结合最新监管动态，为学员提供系统性的知识框架...</p>
              <p><strong>第4页：核心要点</strong></p>
              <p>申报主体认定、信息交换范围、豁免规则、合规时间节点...</p>
              <p style={{color:'var(--text-3)',fontStyle:'italic',marginTop:8}}>（完整文字稿共{preview.slides}张，约{preview.words.toLocaleString()}字）</p>
            </div>
            <div style={{display:'flex',gap:10,marginTop:16,justifyContent:'flex-end'}}>
              <button className="btn btn-secondary" onClick={()=>setPreview(null)}>关闭</button>
              {canDownload && <button className="btn btn-primary">下载原始PPT</button>}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
