import { WORK_ORDERS, LEDGER_DATA, STATUS_COLOR } from '../data/mock'

export function Dashboard({ user, navigate }) {
  const total = WORK_ORDERS.length
  const active = WORK_ORDERS.filter(w => w.status !== '已归档').length
  const totalRevenue = LEDGER_DATA.reduce((s,r) => s+r.contract, 0)
  const received = LEDGER_DATA.reduce((s,r) => s+r.received, 0)
  const recent = WORK_ORDERS.slice(0,5)

  return (
    <>
      <div className="topbar">
        <span className="topbar-title">仪表盘</span>
        <span className="topbar-sub">· 概览</span>
        <div className="topbar-actions">
          <button className="btn btn-primary btn-sm" onClick={() => navigate('workorders')}>+ 新建工单</button>
        </div>
      </div>
      <div className="content">
        {/* Hero */}
        <div style={{background:'var(--bg-sidebar)',borderRadius:16,padding:'28px 32px',marginBottom:24,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <p style={{fontSize:12,color:'#71717A',marginBottom:8,letterSpacing:'.06em',textTransform:'uppercase'}}>朝曦培训管理中台 · 2026体系化元年</p>
            <h1 style={{fontFamily:"'Noto Serif SC',serif",fontSize:26,color:'#fff',fontWeight:700,marginBottom:6}}>朝曦家办培训管理平台</h1>
            <p style={{fontSize:13,color:'#A1A1AA',maxWidth:480}}>系统覆盖培训全链路：需求收集 → 课程匹配 → 合同 → 排期 → 通关 → 素材 → 质量分析 → 台账归档</p>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:48,fontFamily:"'Noto Serif SC',serif",color:'var(--accent-mid)',fontWeight:700}}>{active}</div>
            <div style={{fontSize:12,color:'#71717A'}}>进行中工单</div>
          </div>
        </div>

        {/* Stats */}
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-label">本年工单总数</div>
            <div className="stat-value">{total}</div>
            <div className="stat-sub">含 {WORK_ORDERS.filter(w=>w.status==='已归档').length} 个已归档</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">合同总金额</div>
            <div className="stat-value">¥{(totalRevenue/10000).toFixed(1)}万</div>
            <div className="stat-sub">已收 ¥{(received/10000).toFixed(1)}万</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">平均质量评分</div>
            <div className="stat-value">90</div>
            <div className="stat-sub">基于 2 场已评分培训</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">SKU素材覆盖</div>
            <div className="stat-value">87%</div>
            <div className="stat-sub">141 / 162 课程SKU</div>
          </div>
        </div>

        <div className="two-col" style={{gap:20}}>
          {/* Recent orders */}
          <div className="card">
            <div className="card-header">
              <h3>最近工单</h3>
              <button className="btn btn-ghost btn-sm" onClick={()=>navigate('workorders')}>全部 →</button>
            </div>
            <div className="card-body" style={{padding:'12px 0 0'}}>
              <table className="data-table">
                <thead><tr>
                  <th>工单号</th><th>渠道</th><th>状态</th><th>评分</th>
                </tr></thead>
                <tbody>
                  {recent.map(w => (
                    <tr key={w.id}>
                      <td><span style={{fontFamily:'monospace',fontSize:12,color:'var(--text-2)'}}>{w.id}</span></td>
                      <td style={{fontSize:12}}>{w.channel}</td>
                      <td><span className={`badge ${STATUS_COLOR[w.status]||'badge-gray'}`}>{w.status}</span></td>
                      <td style={{fontSize:12,color:'var(--text-3)'}}>{w.score || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Module status */}
          <div className="card">
            <div className="card-header"><h3>模块状态</h3></div>
            <div className="card-body">
              {[
                { label:'M1 需求收集', pct:100, note:'固定H5链接已就绪', color:'var(--accent)' },
                { label:'M2 课程匹配', pct:100, note:'AI推荐引擎运行中', color:'var(--accent)' },
                { label:'M3 合同管理', pct:80,  note:'3份合同待签署', color:'var(--amber)' },
                { label:'M4 讲师排期', pct:60,  note:'2个工单待确认', color:'var(--amber)' },
                { label:'M5/6 通关&素材', pct:40, note:'1位讲师通关进行中', color:'#F97316' },
                { label:'M9 台账管理', pct:100, note:'仅管理员可见', color:'var(--accent)' },
              ].map(m => (
                <div key={m.label} style={{marginBottom:14}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                    <span style={{fontSize:12,fontWeight:600,color:'var(--text-1)'}}>{m.label}</span>
                    <span style={{fontSize:11,color:'var(--text-3)'}}>{m.note}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width:`${m.pct}%`,background:m.color}} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
