import { useState, useRef } from 'react'
import { LEDGER_DATA } from '../data/mock'

export function Ledger({ user }) {
  const [gateState, setGateState] = useState('locked') // locked | verifying | open
  const [otp, setOtp] = useState(['','','','','',''])
  const [otpErr, setOtpErr] = useState('')
  const [editRow, setEditRow] = useState(null)
  const [data, setData] = useState(LEDGER_DATA)
  const [exportOtp, setExportOtp] = useState(false)
  const [exportCode, setExportCode] = useState(['','','','','',''])
  const inputs = useRef([])
  const exportInputs = useRef([])

  if (user?.role !== 'admin') {
    return (
      <>
        <div className="topbar"><span className="topbar-title">台账管理</span></div>
        <div className="content" style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh'}}>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:48,marginBottom:16}}>🔒</div>
            <h2 style={{marginBottom:8}}>无访问权限</h2>
            <p style={{color:'var(--text-3)'}}>台账模块仅管理员可见</p>
          </div>
        </div>
      </>
    )
  }

  function handleOtp(i, val) {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]; next[i] = val; setOtp(next)
    if (val && i < 5) inputs.current[i+1]?.focus()
  }

  function verifyOtp() {
    const code = otp.join('')
    if (code === '888888' || code.length === 6) {
      setGateState('open')
    } else {
      setOtpErr('验证码错误，请重试（演示：任意6位数字）')
    }
  }

  function saveEdit(row) {
    setData(data.map(r => r.id === row.id ? row : r))
    setEditRow(null)
  }

  function handleExportOtp(i, val) {
    if (!/^\d?$/.test(val)) return
    const next=[...exportCode]; next[i]=val; setExportCode(next)
    if (val && i<5) exportInputs.current[i+1]?.focus()
  }

  const total = data.reduce((s,r)=>s+r.contract,0)
  const recv  = data.reduce((s,r)=>s+r.received,0)
  const unrec = total - recv
  const warnCount = data.filter(r=>r.contract<15000).length

  if (gateState === 'locked') return (
    <div style={{minHeight:'100vh',background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:400,background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:20,padding:40,boxShadow:'var(--shadow-md)',textAlign:'center'}}>
        <div style={{width:64,height:64,borderRadius:16,background:'var(--bg-sidebar)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,margin:'0 auto 20px'}}>🔐</div>
        <h2 style={{marginBottom:6}}>台账模块</h2>
        <p style={{fontSize:13,color:'var(--text-2)',marginBottom:24}}>高度机密模块 · 进入需要短信验证</p>
        <div className="alert alert-warn" style={{textAlign:'left',marginBottom:20}}>
          <span>📱</span><span>验证码将发送至 <strong>177****6601</strong></span>
        </div>
        <button className="btn btn-primary" style={{width:'100%',justifyContent:'center'}} onClick={()=>setGateState('verifying')}>
          发送验证码
        </button>
      </div>
    </div>
  )

  if (gateState === 'verifying') return (
    <div style={{minHeight:'100vh',background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:400,background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:20,padding:40,boxShadow:'var(--shadow-md)',textAlign:'center'}}>
        <div style={{width:64,height:64,borderRadius:16,background:'var(--accent-lt)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,margin:'0 auto 20px'}}>📱</div>
        <h2 style={{marginBottom:6}}>输入验证码</h2>
        <p style={{fontSize:13,color:'var(--text-2)',marginBottom:4}}>已发送至 177****6601 · 3分钟内有效</p>
        <p style={{fontSize:11,color:'var(--text-3)',marginBottom:20}}>演示模式：输入任意6位数字即可通过</p>
        {otpErr && <div className="alert alert-danger" style={{marginBottom:12,textAlign:'left'}}><span>⚠</span>{otpErr}</div>}
        <div className="otp-row">
          {otp.map((v,i)=>(
            <input key={i} className="otp-box" maxLength={1} value={v}
              ref={el=>inputs.current[i]=el}
              onChange={e=>handleOtp(i,e.target.value)}
              onKeyDown={e=>{ if(e.key==='Backspace'&&!v&&i>0) inputs.current[i-1]?.focus() }}
            />
          ))}
        </div>
        <button className="btn btn-primary" style={{width:'100%',justifyContent:'center'}} onClick={verifyOtp}>验证并进入</button>
        <button className="btn btn-ghost btn-sm" style={{marginTop:12}} onClick={()=>{setGateState('locked');setOtp(['','','','','','']);setOtpErr('')}}>返回</button>
      </div>
    </div>
  )

  return (
    <>
      <div className="topbar">
        <span className="topbar-title">台账管理</span>
        <span className="topbar-sub">· M9 · 仅管理员</span>
        <div className="topbar-actions">
          <span className="badge badge-green">已验证 · 30min有效</span>
          <button className="btn btn-primary btn-sm" onClick={()=>setExportOtp(true)}>导出 Excel</button>
        </div>
      </div>
      <div className="content">
        <div className="page-hero">
          <h1>培训台账</h1>
          <p>财务收支 · 对价记录 · 发票管理 · 标准报价 ¥15,000/场</p>
        </div>

        {warnCount > 0 && (
          <div className="alert alert-warn">
            <span>⚠</span><span><strong>{warnCount} 条合同低于标准报价（¥15,000/场）</strong>，已标橙色高亮，请填写对价备注。</span>
          </div>
        )}

        <div className="stat-grid" style={{gridTemplateColumns:'repeat(3,1fr)',marginBottom:20}}>
          <div className="stat-card">
            <div className="stat-label">合同总金额</div>
            <div className="stat-value">¥{(total/10000).toFixed(1)}万</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">已收金额</div>
            <div className="stat-value" style={{color:'var(--accent)'}}>¥{(recv/10000).toFixed(1)}万</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">未收金额</div>
            <div className="stat-value" style={{color: unrec>0?'var(--amber)':'var(--text-3)'}}>¥{(unrec/10000).toFixed(1)}万</div>
          </div>
        </div>

        <div className="card" style={{overflowX:'auto'}}>
          <table className="data-table" style={{minWidth:1000}}>
            <thead><tr>
              <th>工单编号</th><th>渠道</th><th>培训日期</th><th>讲师</th>
              <th>合同金额</th><th>已收金额</th><th>未收</th>
              <th>发票</th><th>评分</th><th>对价备注</th><th>对价实现</th><th>其他备注</th><th>操作</th>
            </tr></thead>
            <tbody>
              {data.map(r => (
                <tr key={r.id} className={r.contract<15000?'warn-row':''}>
                  <td><span style={{fontFamily:'monospace',fontSize:11,color:'var(--accent)',fontWeight:600}}>{r.id}</span></td>
                  <td style={{fontSize:12,fontWeight:500,maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.channel}</td>
                  <td style={{fontSize:11,color:'var(--text-2)'}}>{r.date}</td>
                  <td style={{fontSize:12}}>{r.instructor}</td>
                  <td>
                    <span style={{fontWeight:600,color:r.contract<15000?'var(--amber)':'var(--text-1)'}}>¥{r.contract.toLocaleString()}</span>
                    {r.contract<15000 && <span className="badge badge-amber" style={{marginLeft:4,fontSize:10}}>↓</span>}
                  </td>
                  <td><span style={{color:'var(--accent)',fontWeight:600}}>¥{r.received.toLocaleString()}</span></td>
                  <td><span style={{color:r.contract-r.received>0?'var(--amber)':'var(--text-3)'}}>¥{(r.contract-r.received).toLocaleString()}</span></td>
                  <td><span className={`badge ${r.invoice==='已开'?'badge-green':r.invoice==='部分'?'badge-amber':'badge-gray'}`}>{r.invoice}</span></td>
                  <td style={{textAlign:'center',color:'var(--accent)',fontWeight:700}}>{r.score||'—'}</td>
                  <td style={{fontSize:11,color: !r.daiJia&&r.contract<15000?'var(--amber)':'var(--text-2)',maxWidth:120}}>
                    {!r.daiJia && r.contract<15000
                      ? <span style={{fontStyle:'italic',opacity:.7}}>请填写对价说明</span>
                      : r.daiJia || '—'}
                  </td>
                  <td style={{fontSize:11,color:'var(--text-2)',maxWidth:100}}>{r.daiJiaStatus||'—'}</td>
                  <td style={{fontSize:11,color:'var(--text-2)',maxWidth:100}}>{r.remark||'—'}</td>
                  <td><button className="btn btn-ghost btn-sm" onClick={()=>setEditRow({...r})}>编辑</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit modal */}
      {editRow && (
        <div className="modal-overlay" onClick={()=>setEditRow(null)}>
          <div className="modal" style={{width:500}} onClick={e=>e.stopPropagation()}>
            <h2 className="modal-title">编辑台账</h2>
            <p className="modal-sub">{editRow.id} · {editRow.channel}</p>
            <div className="two-col">
              <div className="form-group">
                <label className="form-label">已收金额（元）</label>
                <input className="form-input" type="number" value={editRow.received} onChange={e=>setEditRow({...editRow,received:+e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">发票状态</label>
                <select className="form-select" value={editRow.invoice} onChange={e=>setEditRow({...editRow,invoice:e.target.value})}>
                  <option>未开</option><option>已开</option><option>部分</option>
                </select>
              </div>
            </div>
            {editRow.contract < 15000 && (
              <div className="alert alert-warn" style={{marginBottom:12}}>
                <span>⚠</span><span>合同金额低于标准报价（¥15,000），请填写对价备注</span>
              </div>
            )}
            <div className="form-group">
              <label className="form-label">对价备注{editRow.contract<15000&&<span style={{color:'var(--red)'}}> *</span>}</label>
              <textarea className="form-textarea" value={editRow.daiJia} onChange={e=>setEditRow({...editRow,daiJia:e.target.value})} placeholder="记录其他对价内容（如转介绍、资源互换等），不体现在合同中" />
            </div>
            <div className="form-group">
              <label className="form-label">对价实现情况</label>
              <textarea className="form-textarea" style={{minHeight:60}} value={editRow.daiJiaStatus} onChange={e=>setEditRow({...editRow,daiJiaStatus:e.target.value})} placeholder="对价是否已兑现、兑现方式、时间等" />
            </div>
            <div className="form-group">
              <label className="form-label">其他备注</label>
              <textarea className="form-textarea" style={{minHeight:60}} value={editRow.remark} onChange={e=>setEditRow({...editRow,remark:e.target.value})} placeholder="未尽事宜自由记录" />
            </div>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
              <button className="btn btn-secondary" onClick={()=>setEditRow(null)}>取消</button>
              <button className="btn btn-primary" onClick={()=>saveEdit(editRow)}>保存</button>
            </div>
          </div>
        </div>
      )}

      {/* Export 2FA */}
      {exportOtp && (
        <div className="modal-overlay" onClick={()=>setExportOtp(false)}>
          <div className="modal" style={{textAlign:'center'}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:36,marginBottom:12}}>📊</div>
            <h2 className="modal-title">导出前需二次验证</h2>
            <p className="modal-sub">验证码已发送至 177****6601 · 演示：任意6位</p>
            <div className="otp-row">
              {exportCode.map((v,i)=>(
                <input key={i} className="otp-box" maxLength={1} value={v}
                  ref={el=>exportInputs.current[i]=el}
                  onChange={e=>handleExportOtp(i,e.target.value)}
                  onKeyDown={e=>{ if(e.key==='Backspace'&&!v&&i>0) exportInputs.current[i-1]?.focus() }}
                />
              ))}
            </div>
            <button className="btn btn-primary" style={{width:'100%',justifyContent:'center'}}
              onClick={()=>{ setExportOtp(false); setExportCode(['','','','','','']); alert('台账导出成功：台账导出_20260511_143022.xlsx') }}>
              确认导出
            </button>
          </div>
        </div>
      )}
    </>
  )
}
