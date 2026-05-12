import { useState } from 'react'
import { INSTRUCTORS } from '../data/mock'

export function Schedule() {
  const [selected, setSelected] = useState(null)
  const [confirmed, setConfirmed] = useState(false)

  return (
    <>
      <div className="topbar">
        <span className="topbar-title">讲师排期</span>
        <span className="topbar-sub">· M4</span>
      </div>
      <div className="content">
        <div className="page-hero">
          <h1>讲师排期</h1>
          <p>地区 × 课程 × 档期三维推荐，生成H5确认链接发渠道联系人</p>
        </div>

        <div className="two-col" style={{alignItems:'start'}}>
          <div>
            <div className="card" style={{marginBottom:16}}>
              <div className="card-header"><h3>推荐讲师</h3><span className="badge badge-blue">工单 ZX-2026-003</span></div>
              <div className="card-body">
                <div className="alert alert-info" style={{marginBottom:12}}>
                  <span>📍</span><span>培训城市：北京 · 课程系列：C5全球化资产配置</span>
                </div>
                {INSTRUCTORS.map((ins, i) => {
                  const matchScore = ins.series.includes('C5') ? 96 - i*8 : 72 - i*5
                  return (
                    <div key={ins.id}
                      className="card"
                      style={{marginBottom:10,cursor:'pointer',padding:16,border: selected?.id===ins.id ? '2px solid var(--accent)':'1px solid var(--border)',background: selected?.id===ins.id ? 'var(--accent-lt)':'var(--bg-card)'}}
                      onClick={()=>setSelected(ins)}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                        <div style={{display:'flex',alignItems:'center',gap:10}}>
                          <div style={{width:36,height:36,borderRadius:'50%',background:i===0?'var(--accent)':i===1?'#6366F1':i===2?'var(--amber)':'#EC4899',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:14}}>{ins.name[0]}</div>
                          <div>
                            <div style={{fontWeight:600,fontSize:14}}>{ins.name}</div>
                            <div style={{fontSize:11,color:'var(--text-3)'}}>{ins.city} · {ins.series.join('/')}</div>
                          </div>
                        </div>
                        <div style={{textAlign:'right'}}>
                          <div style={{fontSize:18,fontWeight:700,color:'var(--accent)',fontFamily:"'Noto Serif SC',serif"}}>{matchScore}</div>
                          <div style={{fontSize:10,color:'var(--text-3)'}}>匹配分</div>
                        </div>
                      </div>
                      <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                        {ins.available.slice(0,3).map(d => <span key={d} className="badge badge-green" style={{fontSize:10}}>✓ {d}</span>)}
                        {ins.busy.slice(0,2).map(d => <span key={d} className="badge badge-red" style={{fontSize:10}}>✗ {d}</span>)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div>
            {selected ? (
              <div className="card">
                <div className="card-header"><h3>确认排期</h3></div>
                <div className="card-body">
                  <div style={{display:'grid',gap:10,marginBottom:16}}>
                    {[['讲师',selected.name],['所在城市',selected.city],['擅长系列',selected.series.join(' / ')]].map(([k,v])=>(
                      <div key={k} style={{display:'flex',justifyContent:'space-between',fontSize:13}}>
                        <span style={{color:'var(--text-3)'}}>{k}</span><span style={{fontWeight:500}}>{v}</span>
                      </div>
                    ))}
                  </div>
                  <div className="form-group">
                    <label className="form-label">选择培训日期</label>
                    <select className="form-select">
                      {selected.available.map(d=><option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">培训地点</label>
                    <input className="form-input" placeholder="具体地址" />
                  </div>
                  {!confirmed ? (
                    <button className="btn btn-primary" style={{width:'100%',justifyContent:'center'}} onClick={()=>setConfirmed(true)}>
                      生成H5确认链接 →
                    </button>
                  ) : (
                    <div className="alert alert-success">
                      <div>
                        <strong>H5确认链接已生成</strong>
                        <div style={{fontFamily:'monospace',fontSize:11,marginTop:4,color:'var(--accent)'}}>https://train.zxpro.com.cn/confirm/ZX-2026-003</div>
                        <div style={{fontSize:11,color:'var(--text-2)',marginTop:4}}>已发送给渠道联系人，等待确认中</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="card" style={{padding:48,textAlign:'center'}}>
                <div style={{fontSize:32,marginBottom:12,opacity:.3}}>👈</div>
                <p style={{color:'var(--text-3)',fontSize:13}}>从左侧选择推荐讲师以确认排期</p>
              </div>
            )}

            {/* Instructor calendar */}
            <div className="card" style={{marginTop:16}}>
              <div className="card-header"><h3>讲师档期概览 · 5月</h3></div>
              <div className="card-body">
                {INSTRUCTORS.map(ins => (
                  <div key={ins.id} style={{marginBottom:12}}>
                    <div style={{fontSize:12,fontWeight:600,marginBottom:6}}>{ins.name} <span style={{color:'var(--text-3)',fontWeight:400}}>· {ins.city}</span></div>
                    <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                      {Array.from({length:31},(_,i)=>`2026-05-${String(i+1).padStart(2,'0')}`).filter(d=>d<='2026-05-31').slice(10,22).map(d=>{
                        const avail = ins.available.includes(d)
                        const busy  = ins.busy.includes(d)
                        return <div key={d} style={{width:28,height:28,borderRadius:6,background:busy?'var(--red-lt)':avail?'var(--accent-lt)':'#F4F4F5',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:600,color:busy?'var(--red)':avail?'var(--accent)':'var(--text-3)'}}>{d.slice(-2)}</div>
                      })}
                    </div>
                  </div>
                ))}
                <div style={{display:'flex',gap:12,marginTop:8,fontSize:11,color:'var(--text-3)'}}>
                  <span><span style={{background:'var(--accent-lt)',padding:'1px 6px',borderRadius:4,color:'var(--accent)'}}>■</span> 可用</span>
                  <span><span style={{background:'var(--red-lt)',padding:'1px 6px',borderRadius:4,color:'var(--red)'}}>■</span> 已约</span>
                  <span><span style={{background:'#F4F4F5',padding:'1px 6px',borderRadius:4}}>■</span> 未标注</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
