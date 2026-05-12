import { useState } from 'react'
import { WORK_ORDERS } from '../data/mock'

const RECS = [
  { courses:['C5U3 CRS涉税风险管理','C5U7 FATCA申报合规'], reason:'工单主题"跨境税务"与C5全球化配置系列高度匹配，历史同类渠道选课率82%', score:96 },
  { courses:['C1U2 个人税务规划基础','C5U1 全球税务框架概述'], reason:'适合初次了解跨境税务的受众，课程难度递进合理，适合综合私行客群', score:88 },
  { courses:['C6U2 跨境继承税务协调','C5U12 离岸架构实务'], reason:'结合法律与税务双维度，适合已有一定基础的高净值客户群体', score:81 },
]

export function CourseMatch() {
  const [selected, setSelected] = useState(null)
  const [confirmed, setConfirmed] = useState(false)
  const [order, setOrder] = useState(WORK_ORDERS[0])

  return (
    <>
      <div className="topbar">
        <span className="topbar-title">课程匹配</span>
        <span className="topbar-sub">· M2 AI推荐引擎</span>
      </div>
      <div className="content">
        <div className="page-hero">
          <h1>课程匹配</h1>
          <p>基于工单需求，AI引擎自动推荐课程组合（60%关键词语义 + 40%历史行为）</p>
        </div>

        <div className="two-col" style={{alignItems:'start'}}>
          {/* left: order info */}
          <div>
            <div className="card" style={{marginBottom:16}}>
              <div className="card-header"><h3>当前工单</h3></div>
              <div className="card-body">
                <select className="form-select" style={{marginBottom:16}} onChange={e=>setOrder(WORK_ORDERS[e.target.selectedIndex])}>
                  {WORK_ORDERS.filter(w=>w.status!=='已归档').map(w => <option key={w.id}>{w.id} · {w.channel}</option>)}
                </select>
                <div style={{display:'grid',gap:8}}>
                  {[['工单编号', order.id],['渠道机构', order.channel],['培训主题', order.theme],['预计人数', order.people+'人'],['期望日期', order.date]].map(([k,v])=>(
                    <div key={k} style={{display:'flex',justifyContent:'space-between',fontSize:13}}>
                      <span style={{color:'var(--text-3)'}}>{k}</span>
                      <span style={{fontWeight:500}}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {confirmed && (
              <div className="alert alert-success">
                <span>✅</span>
                <div><strong>培训方案已确认</strong><br/><span style={{fontSize:12}}>已流转至合同管理模块</span></div>
              </div>
            )}
          </div>

          {/* right: recommendations */}
          <div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
              <span style={{fontSize:13,fontWeight:600,color:'var(--text-2)'}}>AI推荐课程组合（前3个）</span>
              <span className="badge badge-blue">引擎运行中</span>
            </div>
            {RECS.map((r, i) => (
              <div key={i}
                className="card"
                style={{marginBottom:12,cursor:'pointer',borderColor: selected===i ? 'var(--accent)' : 'var(--border)', boxShadow: selected===i ? '0 0 0 2px var(--accent-lt)' : 'var(--shadow)'}}
                onClick={() => setSelected(i)}>
                <div className="card-body">
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                    <span style={{fontSize:12,fontWeight:700,color:'var(--text-3)'}}>方案 {String.fromCharCode(65+i)}</span>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <span style={{fontSize:11,color:'var(--text-3)'}}>匹配度</span>
                      <span style={{fontSize:16,fontWeight:700,color:'var(--accent)',fontFamily:"'Noto Serif SC',serif"}}>{r.score}</span>
                    </div>
                  </div>
                  {r.courses.map((c,j) => (
                    <div key={j} style={{fontSize:13,fontWeight:500,marginBottom:4,display:'flex',alignItems:'center',gap:8}}>
                      <span style={{width:6,height:6,borderRadius:'50%',background:'var(--accent-mid)',flexShrink:0,display:'inline-block'}} />
                      {c}
                      <span style={{fontSize:11,color:'var(--text-3)',marginLeft:'auto'}}>2.5h</span>
                    </div>
                  ))}
                  <div style={{marginTop:10,padding:'8px 12px',background:'var(--bg)',borderRadius:8,fontSize:12,color:'var(--text-2)'}}>
                    💡 {r.reason}
                  </div>
                </div>
              </div>
            ))}
            <button
              className="btn btn-primary"
              style={{width:'100%',justifyContent:'center',marginTop:4}}
              disabled={selected===null}
              onClick={() => setConfirmed(true)}>
              确认方案 {selected!==null ? String.fromCharCode(65+selected) : ''} → 生成培训方案草稿
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
