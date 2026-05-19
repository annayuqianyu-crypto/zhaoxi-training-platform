import { useState } from 'react'

const CONTRACTS = [
  { id:'ZX-C-2026-001', order:'ZX-2026-001', channel:'招商银行私行部', amount:22000, signed:'2026-04-08', status:'已签署' },
  { id:'ZX-C-2026-002', order:'ZX-2026-002', channel:'平安信托财富中心', amount:15000, signed:null, status:'待签署' },
  { id:'ZX-C-2026-003', order:'ZX-2026-003', channel:'中信银行北京分行', amount:18000, signed:null, status:'草稿' },
  { id:'ZX-C-2026-006', order:'ZX-2026-006', channel:'建设银行贵宾中心', amount:15000, signed:'2026-04-20', status:'已归档' },
]

const VARS = ['{{渠道名称}}','{{联系人}}','{{培训主题}}','{{培训日期}}','{{培训地点}}','{{人数}}','{{合同金额}}','{{付款方式}}','{{签约日期}}']

export function Contracts() {
  const [preview, setPreview] = useState(null)

  const sColor = { '已签署':'badge-green', '待签署':'badge-amber', '草稿':'badge-blue', '已归档':'badge-gray' }

  return (
    <>
      <div className="topbar">
        <span className="topbar-title">合同管理</span>
        <span className="topbar-sub">· M3</span>
        <div className="topbar-actions">
          <button className="btn btn-secondary btn-sm">下载合同模板</button>
        </div>
      </div>
      <div className="content">
        <div className="page-hero">
          <h1>合同管理</h1>
          <p>系统自动提取变量填充模板，合同编号格式 ZX-C-YYYY-NNN，与工单编号对应</p>
        </div>

        {/* Variable table */}
        <div className="card" style={{marginBottom:20}}>
          <div className="card-header"><h3>合同变量占位符</h3></div>
          <div className="card-body">
            <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
              {VARS.map(v => (
                <code key={v} style={{background:'var(--bg)',border:'1px solid var(--border)',borderRadius:6,padding:'4px 10px',fontSize:12,color:'var(--accent)',fontWeight:600}}>{v}</code>
              ))}
            </div>
            <p style={{fontSize:12,color:'var(--text-3)',marginTop:10}}>系统自动从工单、课程匹配、讲师排期等模块读取数据填充上述变量，销售仅需核对后下载签署</p>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>合同列表</h3>
            <button className="btn btn-primary btn-sm">+ 生成新合同</button>
          </div>
          <table className="data-table">
            <thead><tr>
              <th>合同编号</th><th>关联工单</th><th>渠道机构</th><th>合同金额</th><th>签署日期</th><th>状态</th><th>操作</th>
            </tr></thead>
            <tbody>
              {CONTRACTS.map(c => (
                <tr key={c.id} className={c.amount < 15000 ? 'warn-row' : ''}>
                  <td><span style={{fontFamily:'monospace',fontSize:12,fontWeight:600}}>{c.id}</span></td>
                  <td><span style={{fontFamily:'monospace',fontSize:12,color:'var(--text-2)'}}>{c.order}</span></td>
                  <td style={{fontWeight:500}}>{c.channel}</td>
                  <td>
                    <span style={{fontWeight:600,color: c.amount<15000 ? 'var(--amber)':'var(--text-1)'}}>¥{c.amount.toLocaleString()}</span>
                    {c.amount < 15000 && <span className="badge badge-amber" style={{marginLeft:6}}>低于标准报价</span>}
                  </td>
                  <td style={{color:'var(--text-2)',fontSize:12}}>{c.signed || '—'}</td>
                  <td><span className={`badge ${sColor[c.status]}`}>{c.status}</span></td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={()=>setPreview(c)}>预览</button>
                    {c.status === '待签署' && <button className="btn btn-secondary btn-sm" style={{marginLeft:6}}>下载</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {preview && (
        <div className="modal-overlay" onClick={()=>setPreview(null)}>
          <div className="modal" style={{width:520}} onClick={e=>e.stopPropagation()}>
            <h2 className="modal-title">合同预览</h2>
            <p className="modal-sub">{preview.id} · {preview.channel}</p>
            <div style={{background:'var(--bg)',borderRadius:10,padding:20,fontSize:13,lineHeight:2,color:'var(--text-1)'}}>
              <p style={{textAlign:'center',fontWeight:700,marginBottom:12}}>朝曦家办培训服务合同</p>
              <p><strong>甲方（培训方）：</strong>朝曦家族办公室管理有限公司</p>
              <p><strong>乙方（委托方）：</strong><span style={{color:'var(--accent)'}}>{preview.channel}</span></p>
              <p><strong>培训主题：</strong><span style={{color:'var(--accent)'}}>CRS涉税风险管理</span></p>
              <p><strong>合同金额：</strong><span style={{color:'var(--accent)',fontWeight:700}}>人民币 ¥{preview.amount.toLocaleString()} 元</span></p>
              <p><strong>付款方式：</strong>全款</p>
              <p><strong>签约日期：</strong>{preview.signed || '待确认'}</p>
            </div>
            <div style={{display:'flex',gap:10,marginTop:20,justifyContent:'flex-end'}}>
              <button className="btn btn-secondary" onClick={()=>setPreview(null)}>关闭</button>
              <button className="btn btn-primary">下载 Word</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
