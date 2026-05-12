import { CHANNEL_DATA } from '../data/mock'

const TAG_COLOR = {
  '高价值渠道': 'badge-green',
  '高频培训': 'badge-blue',
  '跨境偏好': 'badge-amber',
  '法律需求型': 'badge-gray',
}

export function Channels() {
  const totalAmt = CHANNEL_DATA.reduce((s,c)=>s+c.totalAmt,0)

  return (
    <>
      <div className="topbar">
        <span className="topbar-title">渠道分析</span>
        <span className="topbar-sub">· M10</span>
        <div className="topbar-actions">
          <button className="btn btn-secondary btn-sm">导出报表</button>
        </div>
      </div>
      <div className="content">
        <div className="page-hero">
          <h1>渠道分析</h1>
          <p>以渠道为维度，沉淀培训偏好、预算区间与业务特征，支持销售精准服务</p>
        </div>

        {/* Summary stats */}
        <div className="stat-grid" style={{marginBottom:20}}>
          <div className="stat-card">
            <div className="stat-label">合作渠道数</div>
            <div className="stat-value">{CHANNEL_DATA.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">渠道总收入</div>
            <div className="stat-value">¥{(totalAmt/10000).toFixed(1)}万</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">高价值渠道</div>
            <div className="stat-value">{CHANNEL_DATA.filter(c=>c.tags.includes('高价值渠道')).length}</div>
            <div className="stat-sub">合同金额累计前20%</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">高频培训渠道</div>
            <div className="stat-value">{CHANNEL_DATA.filter(c=>c.count>=2).length}</div>
            <div className="stat-sub">年培训次数 ≥ 2次</div>
          </div>
        </div>

        {/* Type distribution */}
        <div className="two-col" style={{marginBottom:20}}>
          <div className="card">
            <div className="card-header"><h3>渠道类型分布</h3></div>
            <div className="card-body">
              {['银行','信托','券商','其他'].map(type => {
                const channels = CHANNEL_DATA.filter(c=>c.type===type)
                const pct = Math.round(channels.length/CHANNEL_DATA.length*100)
                const amt = channels.reduce((s,c)=>s+c.totalAmt,0)
                return (
                  <div key={type} style={{marginBottom:14}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:5,fontSize:13}}>
                      <span style={{fontWeight:500}}>{type}</span>
                      <span style={{color:'var(--text-3)'}}>{channels.length}家 · ¥{(amt/10000).toFixed(1)}万</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{width:`${pct}%`}} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3>课程系列偏好</h3></div>
            <div className="card-body">
              {[['C5 全球化资产配置',68],['C2 境内资产管理',52],['C6 家族法律规划',38],['C4 境外移民',31],['C1 财富架构基础',25]].map(([s,pct])=>(
                <div key={s} style={{marginBottom:12}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:4,fontSize:12}}>
                    <span>{s}</span><span style={{color:'var(--text-3)'}}>{pct}%</span>
                  </div>
                  <div className="progress-bar"><div className="progress-fill" style={{width:`${pct}%`}} /></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Channel table */}
        <div className="card">
          <div className="card-header"><h3>渠道列表</h3></div>
          <table className="data-table">
            <thead><tr>
              <th>渠道名称</th><th>类型</th><th>城市</th><th>培训次数</th>
              <th>合同总额</th><th>均分</th><th>标签</th>
            </tr></thead>
            <tbody>
              {CHANNEL_DATA.map(c=>(
                <tr key={c.name}>
                  <td style={{fontWeight:500}}>{c.name}</td>
                  <td><span className="badge badge-gray">{c.type}</span></td>
                  <td style={{color:'var(--text-2)',fontSize:12}}>{c.city}</td>
                  <td style={{textAlign:'center',fontWeight:600}}>{c.count}</td>
                  <td style={{fontWeight:600}}>¥{c.totalAmt.toLocaleString()}</td>
                  <td style={{textAlign:'center',color:c.avgScore?'var(--accent)':'var(--text-3)',fontWeight:c.avgScore?700:400}}>
                    {c.avgScore||'—'}
                  </td>
                  <td>
                    <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                      {c.tags.map(t=><span key={t} className={`badge ${TAG_COLOR[t]||'badge-gray'}`}>{t}</span>)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
