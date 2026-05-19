import { buildKPISummary, lookupSplitRule, calcSplitAmounts } from '../data/kpiRules'

const ROLE_BADGE = {
  '研发':   'badge-blue',
  '主讲':   'badge-green',
  '销售':   'badge-amber',
  '产品中心': 'badge-gray',
}

const LEVEL_COLOR = { A: 'var(--accent)', B: 'var(--amber)', C: 'var(--text-3)', '—': 'var(--text-3)' }

export function KPI({ contracts }) {
  const rows    = buildKPISummary(contracts)
  const kpiSum  = rows.reduce((s, r) => s + r.kpiTotal, 0)
  const splitSum = rows.reduce((s, r) => s + r.splitTotal, 0)

  // 场次级明细（含分润信息的场次）
  const sessionRows = contracts.flatMap(c =>
    c.items
      .map(it => {
        const rule = lookupSplitRule({
          channelSource: it.channelSource, devType: it.devType,
          speakerType: it.speakerType,    channelNew: it.channelNew,
        })
        if (!rule) return null
        const devParts = (it.devParticipants || []).filter(p => p?.name?.trim())
        const amts  = calcSplitAmounts(rule, it.price || 0, devParts)
        return { contract: c, item: it, rule, devParts, amts }
      })
      .filter(Boolean)
  )

  return (
    <>
      <div className="topbar">
        <span className="topbar-title">KPI 汇总</span>
        <span className="topbar-sub">· 分润 & 考核</span>
      </div>

      <div className="content">
        <div className="page-hero">
          <h1>KPI &amp; 分润汇总</h1>
          <p>基于合同场次的分润规则，自动汇总各角色 KPI 金额 · 研发多部门时均分</p>
        </div>

        {/* 汇总 stat */}
        <div className="stat-grid" style={{ gridTemplateColumns:'repeat(4,1fr)', marginBottom:20 }}>
          <div className="stat-card">
            <div className="stat-label">已配置分润场次</div>
            <div className="stat-value">{sessionRows.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">分润总额</div>
            <div className="stat-value">{splitSum > 0 ? `¥${(splitSum/10000).toFixed(1)}万` : '—'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">KPI 计入总额</div>
            <div className="stat-value" style={{ color:'var(--accent)' }}>
              {kpiSum > 0 ? `¥${(kpiSum/10000).toFixed(1)}万` : '—'}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">涉及人员 / 部门</div>
            <div className="stat-value">{rows.length}</div>
          </div>
        </div>

        {/* 人员 KPI 汇总表 */}
        <div className="card" style={{ marginBottom:24 }}>
          <div className="card-header"><h3>各角色 KPI &amp; 分润汇总</h3></div>
          <table className="data-table">
            <thead>
              <tr>
                <th>姓名 / 部门</th>
                <th>角色</th>
                <th style={{ textAlign:'center' }}>参与场次</th>
                <th>分润总额</th>
                <th style={{ textAlign:'center' }}>KPI 计入场次</th>
                <th>KPI 计入金额</th>
                <th>KPI 占比</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign:'center', color:'var(--text-3)', padding:'28px 0', fontSize:13 }}>
                    暂无数据 — 请在合同场次中配置分润参数
                  </td>
                </tr>
              )}
              {rows.map((r, i) => (
                <tr key={i}>
                  <td style={{ fontWeight:600 }}>{r.name}</td>
                  <td><span className={`badge ${ROLE_BADGE[r.role] || 'badge-gray'}`}>{r.role}</span></td>
                  <td style={{ textAlign:'center' }}>{r.sessions}</td>
                  <td style={{ fontWeight:600 }}>¥{Math.round(r.splitTotal).toLocaleString()}</td>
                  <td style={{ textAlign:'center', color: r.kpiSessions > 0 ? 'var(--accent)' : 'var(--text-3)' }}>
                    {r.kpiSessions}
                  </td>
                  <td style={{ fontWeight:700, color: r.kpiTotal > 0 ? 'var(--accent)' : 'var(--text-3)' }}>
                    {r.kpiTotal > 0 ? `¥${Math.round(r.kpiTotal).toLocaleString()}` : '—'}
                  </td>
                  <td>
                    {r.splitTotal > 0 ? (
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div className="progress-bar" style={{ flex:1, maxWidth:80 }}>
                          <div className="progress-fill"
                            style={{ width:`${Math.min(100, r.kpiTotal/r.splitTotal*100)}%`, background:'var(--accent)' }} />
                        </div>
                        <span style={{ fontSize:11, color:'var(--text-2)' }}>
                          {Math.round(r.kpiTotal/r.splitTotal*100)}%
                        </span>
                      </div>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 场次明细 */}
        <div className="card">
          <div className="card-header"><h3>场次分润明细</h3></div>
          <div style={{ overflowX:'auto' }}>
            <table className="data-table" style={{ minWidth:1100 }}>
              <thead>
                <tr>
                  <th>合同</th>
                  <th>渠道</th>
                  <th>课程</th>
                  <th>主讲</th>
                  <th>日期</th>
                  <th>单价</th>
                  <th>分润基数(×20%)</th>
                  <th>等级</th>
                  <th>渠道来源</th>
                  <th>研发方（均分）</th>
                  <th>研发 ¥</th>
                  <th>主讲 ¥</th>
                  <th>销售 ¥</th>
                  <th>产品中心 ¥</th>
                  <th>留存池 ¥</th>
                </tr>
              </thead>
              <tbody>
                {sessionRows.length === 0 && (
                  <tr>
                    <td colSpan={15} style={{ textAlign:'center', color:'var(--text-3)', padding:'24px 0', fontSize:13 }}>
                      暂无已配置分润的场次
                    </td>
                  </tr>
                )}

                {sessionRows.map(({ contract: c, item: it, rule, devParts, amts }, i) => (
                  <tr key={i}>
                    <td style={{ fontFamily:'monospace', fontSize:11, color:'var(--accent)' }}>{c.id}</td>
                    <td style={{ fontSize:11, maxWidth:110, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.channel}</td>
                    <td style={{ fontSize:11, maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{it.course || '—'}</td>
                    <td style={{ fontSize:11 }}>{it.instructor || '—'}</td>
                    <td style={{ fontSize:11, color:'var(--text-2)', whiteSpace:'nowrap' }}>{it.date || '—'}</td>
                    <td style={{ fontWeight:600 }}>¥{(it.price||0).toLocaleString()}</td>
                    <td style={{ color:'var(--text-2)', fontSize:12 }}>¥{Math.round((it.price||0)*0.2).toLocaleString()}</td>
                    <td>
                      <span style={{ fontWeight:700, color: LEVEL_COLOR[rule.level] || 'var(--text-3)', fontSize:13 }}>
                        {rule.level}
                      </span>
                    </td>
                    <td style={{ fontSize:11 }}>{it.channelSource}</td>
                    <td style={{ fontSize:11, color:'var(--text-2)' }}>
                      {devParts.length > 0
                        ? devParts.map((d, j) => (
                            <span key={j} style={{ display:'inline-block', background:'var(--bg)', border:'1px solid var(--border)',
                              borderRadius:4, padding:'1px 6px', fontSize:10, marginRight:3 }}>{d.name}</span>
                          ))
                        : <span style={{ color:'var(--text-3)' }}>未填</span>
                      }
                      {devParts.length > 1 && (
                        <div style={{ fontSize:10, color:'var(--text-3)', marginTop:2 }}>
                          每人 ¥{Math.round(amts.devPerPerson).toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td style={{ color: amts.devTotal > 0 ? 'var(--text-1)' : 'var(--text-3)' }}>
                      {amts.devTotal > 0 ? `¥${Math.round(amts.devTotal).toLocaleString()}` : '—'}
                    </td>
                    <td style={{ color: amts.speaker > 0 ? 'var(--accent)' : 'var(--text-3)' }}>
                      {amts.speaker > 0 ? `¥${Math.round(amts.speaker).toLocaleString()}` : '—'}
                    </td>
                    <td style={{ color: amts.sales > 0 ? 'var(--amber)' : 'var(--text-3)' }}>
                      {amts.sales > 0 ? `¥${Math.round(amts.sales).toLocaleString()}` : '—'}
                    </td>
                    <td style={{ color: amts.center > 0 ? 'var(--text-1)' : 'var(--text-3)' }}>
                      {amts.center > 0 ? `¥${Math.round(amts.center).toLocaleString()}` : '—'}
                    </td>
                    <td style={{ color:'var(--text-3)', fontSize:11 }}>
                      ¥{Math.round(amts.pool).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
