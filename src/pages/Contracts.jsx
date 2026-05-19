import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { lookupSplitRule, calcSplitAmounts } from '../data/kpiRules'

// ─── 常量 ────────────────────────────────────────────────────────────────────

const BLANK_ITEM = {
  course:'', instructor:'', date:'', price:15000, score:null,
  // 分润 & KPI 配置
  channelSource:'', devType:'', devParticipants:[{name:''}], speakerType:'', channelNew:'',
}

const BLANK_CONTRACT = {
  id:'', channel:'', sales:'', contractStatus:'草稿', signedDate:'',
  received:0, invoice:'未开',
  daiJia:'', daiJiaStatus:'', remark:'',
  pdfName:'', pdfData:'',
  items:[ { ...BLANK_ITEM } ],
}

const STATUS_BADGE = { '已签署':'badge-green', '待签署':'badge-amber', '草稿':'badge-blue', '已归档':'badge-gray' }
const INSTRUCTORS  = ['刘怀宇','熊能','胡顺亥','李红岩']
const LEVEL_COLOR  = { A:'var(--accent)', B:'var(--amber)', C:'var(--text-3)', '—':'var(--text-3)' }

// ─── 辅助函数 ─────────────────────────────────────────────────────────────────

function nextId(data) {
  const year = new Date().getFullYear()
  const nums = data.map(r => { const m = r.id.match(/ZX-C-\d{4}-(\d+)/); return m ? +m[1] : 0 })
  return `ZX-C-${year}-${String(Math.max(0, ...nums) + 1).padStart(3, '0')}`
}

function calcTotal(items) { return items.reduce((s, i) => s + (i.price || 0), 0) }
function calcAvg(items)   { return items.length ? calcTotal(items) / items.length : 0 }

// ─── 组件 ─────────────────────────────────────────────────────────────────────

export function Contracts({ data, setData }) {
  const [editRow, setEditRow]         = useState(null)
  const [isNew, setIsNew]             = useState(false)
  const [expanded, setExpanded]       = useState(null)       // 主表展开子项
  const [splitExpanded, setSplitExpanded] = useState(new Set()) // 弹窗内分润展开
  const fileRef = useRef(null)

  function openNew() {
    setIsNew(true)
    setSplitExpanded(new Set())
    setEditRow({ ...BLANK_CONTRACT, id: nextId(data), items:[{ ...BLANK_ITEM }] })
  }
  function openEdit(r) {
    setIsNew(false)
    setSplitExpanded(new Set())
    setEditRow({ ...r, items: r.items.map(i => ({ ...i })) })
  }
  function closeModal() { setEditRow(null); setSplitExpanded(new Set()) }

  function save() {
    if (isNew) setData(prev => [...prev, editRow])
    else       setData(prev => prev.map(r => r.id === editRow.id ? editRow : r))
    closeModal()
  }

  function del(id) {
    if (window.confirm('确定删除此合同及所有子项目？')) {
      setData(prev => prev.filter(r => r.id !== id))
      if (expanded === id) setExpanded(null)
    }
  }

  // 研发参与方操作
  function setParticipant(itemIdx, pIdx, val) {
    setEditRow(prev => ({
      ...prev,
      items: prev.items.map((it, i) => i !== itemIdx ? it : {
        ...it,
        devParticipants: it.devParticipants.map((p, j) => j === pIdx ? { name: val } : p),
      }),
    }))
  }
  function addParticipant(itemIdx) {
    setEditRow(prev => ({
      ...prev,
      items: prev.items.map((it, i) => i !== itemIdx ? it : {
        ...it,
        devParticipants: [...it.devParticipants, { name: '' }],
      }),
    }))
  }
  function removeParticipant(itemIdx, pIdx) {
    setEditRow(prev => ({
      ...prev,
      items: prev.items.map((it, i) => i !== itemIdx ? it : {
        ...it,
        devParticipants: it.devParticipants.filter((_, j) => j !== pIdx),
      }),
    }))
  }

  // 场次操作
  function setItem(idx, field, val) {
    setEditRow(prev => ({
      ...prev,
      items: prev.items.map((it, i) => i === idx ? { ...it, [field]: val } : it),
    }))
  }
  function addItem() { setEditRow(prev => ({ ...prev, items: [...prev.items, { ...BLANK_ITEM }] })) }
  function removeItem(idx) {
    if (editRow.items.length === 1) return
    setEditRow(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }))
    setSplitExpanded(prev => { const s = new Set(prev); s.delete(idx); return s })
  }
  function toggleSplit(idx) {
    setSplitExpanded(prev => {
      const s = new Set(prev)
      s.has(idx) ? s.delete(idx) : s.add(idx)
      return s
    })
  }

  // PDF
  function handlePdfUpload(e) {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setEditRow(prev => ({ ...prev, pdfName: file.name, pdfData: ev.target.result }))
    reader.readAsDataURL(file)
    e.target.value = ''
  }
  function downloadPdf(row) {
    const a = document.createElement('a'); a.href = row.pdfData; a.download = row.pdfName; a.click()
  }

  // Excel 导出
  async function exportExcel() {
    const wb = XLSX.utils.book_new()

    const summaryRows = data.map(r => ({
      '合同编号': r.id, '渠道机构': r.channel, '销售姓名': r.sales || '',
      '合同签署日期': r.signedDate || '', '合同状态': r.contractStatus,
      '培训场次数': r.items.length,
      '合同总金额': calcTotal(r.items),
      '平均单价/场': r.items.length ? Math.round(calcAvg(r.items)) : '',
      '已收金额': r.received, '未收金额': calcTotal(r.items) - r.received,
      '发票状态': r.invoice, '对价备注': r.daiJia,
      '对价实现情况': r.daiJiaStatus, '其他备注': r.remark,
    }))
    const ws1 = XLSX.utils.json_to_sheet(summaryRows)
    ws1['!cols'] = [12,18,10,14,10,10,14,14,12,12,10,20,20,20].map(w => ({ wch:w }))
    XLSX.utils.book_append_sheet(wb, ws1, '合同汇总')

    // 分润明细：每个研发参与方一行，主讲 / 销售作为独立列，基数 = 单价 × 20%
    const splitRows = data.flatMap(r =>
      r.items.flatMap((it, idx) => {
        const rule = lookupSplitRule({ channelSource:it.channelSource, devType:it.devType, speakerType:it.speakerType, channelNew:it.channelNew })
        if (!rule) return []
        const devParts = (it.devParticipants||[]).filter(p => p?.name?.trim())
        const price0   = it.price || 0
        const amts = calcSplitAmounts(rule, price0, devParts)
        const devPctEach    = devParts.length > 0 ? rule.dev    / devParts.length : 0
        const kpiDevPctEach = devParts.length > 0 ? rule.kpiDev / devParts.length : 0

        // 所有行共享的列（主讲 / 销售在每行都展示）
        const shared = {
          '合同编号': r.id, '渠道机构': r.channel,
          '场次序号': idx+1, '课程主题': it.course||'',
          '培训日期': it.date||'', '单价（元）': price0,
          '分润基数（元）': Math.round(amts.base),
          '激励等级': rule.level, '渠道来源': it.channelSource||'', '渠道新旧': it.channelNew||'',
          // 主讲（KPI基数=全额）
          '主讲类型': it.speakerType||'',
          '主讲人姓名': it.instructor||'',
          '主讲分润%': rule.speaker,
          '主讲分润额¥': amts.speaker > 0 ? Math.round(amts.speaker) : 0,
          '主讲KPI%': rule.kpiSpeaker,
          '主讲KPI额¥': Math.round(price0 * rule.kpiSpeaker / 100),
          // 销售（KPI基数=全额）
          '销售姓名': r.sales||'',
          '销售分润%': rule.sales,
          '销售分润额¥': amts.sales > 0 ? Math.round(amts.sales) : 0,
          '销售KPI%': rule.kpiSales,
          '销售KPI额¥': Math.round(price0 * rule.kpiSales / 100),
        }

        // 每个研发参与方一行（KPI比例=kpiDev均分，KPI额=全额×均分比例）
        if (devParts.length > 0) {
          return devParts.map(p => ({
            ...shared,
            '研发参与方': p.name,
            '研发分润%': devPctEach,
            '研发分润额¥': Math.round(amts.devPerPerson),
            '研发KPI%': kpiDevPctEach,
            '研发KPI额¥': Math.round(price0 * kpiDevPctEach / 100),
          }))
        }
        // 无研发参与方时保留一行（研发列留空）
        return [{ ...shared, '研发参与方':'', '研发分润%': rule.dev, '研发分润额¥':0, '研发KPI%': rule.kpiDev, '研发KPI额¥':0 }]
      })
    )
    const ws2 = XLSX.utils.json_to_sheet(splitRows.length ? splitRows : [{}])
    ws2['!cols'] = [12,18,6,24,12,10,12,6,8,8,8,6,10,8,10,8,10,8,10,8,10,10,8,10,8,10].map(w => ({ wch:w }))
    XLSX.utils.book_append_sheet(wb, ws2, '分润明细')

    const buf  = XLSX.write(wb, { bookType:'xlsx', type:'array' })
    const blob = new Blob([buf], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const date = new Date().toISOString().slice(0,10).replace(/-/g,'')
    const filename = `朝曦合同台账_${date}.xlsx`

    if (window.showSaveFilePicker) {
      try {
        const fh = await window.showSaveFilePicker({
          suggestedName: filename, startIn: 'desktop',
          types: [{ description:'Excel 文件', accept:{ 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':['.xlsx'] } }],
        })
        const w = await fh.createWritable()
        await w.write(blob); await w.close(); return
      } catch (e) { if (e.name === 'AbortError') return }
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
  }

  // 汇总数值
  const allItems  = data.flatMap(r => r.items)
  const grandTotal = allItems.reduce((s, i) => s + (i.price||0), 0)
  const grandRecv  = data.reduce((s, r) => s + r.received, 0)
  const warnList   = data.filter(r => r.items.length > 0 && calcAvg(r.items) < 15000)

  return (
    <>
      <div className="topbar">
        <span className="topbar-title">合同 &amp; 台账</span>
        <span className="topbar-sub">· M3 / M9</span>
        <div className="topbar-actions">
          <button className="btn btn-secondary btn-sm" onClick={exportExcel} disabled={data.length === 0}>
            ↓ 导出 Excel
          </button>
          <button className="btn btn-primary btn-sm" onClick={openNew}>+ 新增合同</button>
        </div>
      </div>

      <div className="content">
        <div className="page-hero">
          <h1>合同 &amp; 台账管理</h1>
          <p>支持一份合同多个培训场次 · 按场次配置分润规则 · 研发多部门自动均分</p>
        </div>

        {warnList.length > 0 && (
          <div className="alert alert-warn">
            <span>⚠</span>
            <span><strong>{warnList.length} 份合同平均单价低于 ¥15,000/场</strong>（{warnList.map(r=>r.id).join('、')}），请填写对价备注。</span>
          </div>
        )}

        <div className="stat-grid" style={{ gridTemplateColumns:'repeat(4,1fr)', marginBottom:20 }}>
          <div className="stat-card">
            <div className="stat-label">合同总金额</div>
            <div className="stat-value">{grandTotal>0?`¥${(grandTotal/10000).toFixed(1)}万`:'—'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">已收金额</div>
            <div className="stat-value" style={{color:'var(--accent)'}}>
              {grandRecv>0?`¥${(grandRecv/10000).toFixed(1)}万`:'—'}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">未收金额</div>
            <div className="stat-value" style={{color:(grandTotal-grandRecv)>0?'var(--amber)':'var(--text-3)'}}>
              {grandTotal>0?`¥${((grandTotal-grandRecv)/10000).toFixed(1)}万`:'—'}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">总培训场次</div>
            <div className="stat-value">{allItems.length}</div>
          </div>
        </div>

        {/* 主表格 */}
        <div className="card" style={{overflowX:'auto'}}>
          <table className="data-table" style={{minWidth:1200}}>
            <thead>
              <tr>
                <th style={{width:32}}></th>
                <th>合同编号</th><th>渠道机构</th><th>销售</th><th>签署日期</th>
                <th>场次</th><th>合同总金额</th><th>平均单价/场</th>
                <th>已收</th><th>未收</th><th>发票</th><th>合同状态</th>
                <th>合同PDF</th><th>对价备注</th><th>操作</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && (
                <tr><td colSpan={15} style={{textAlign:'center',color:'var(--text-3)',padding:'32px 0',fontSize:13}}>
                  暂无数据，点击「+ 新增合同」开始录入
                </td></tr>
              )}
              {data.map(r => {
                const total  = calcTotal(r.items)
                const avg    = calcAvg(r.items)
                const isWarn = r.items.length > 0 && avg < 15000
                const isOpen = expanded === r.id
                return (
                  <>
                    <tr key={r.id} className={isWarn?'warn-row':''}>
                      <td style={{textAlign:'center',cursor:'pointer',fontSize:12,color:'var(--text-3)',userSelect:'none'}}
                        onClick={()=>setExpanded(isOpen?null:r.id)}>{isOpen?'▾':'▸'}</td>
                      <td><span style={{fontFamily:'monospace',fontSize:11,color:'var(--accent)',fontWeight:600}}>{r.id||'—'}</span></td>
                      <td style={{fontSize:12,fontWeight:500,maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.channel}</td>
                      <td style={{fontSize:12,color:'var(--text-2)',whiteSpace:'nowrap'}}>{r.sales||'—'}</td>
                      <td style={{fontSize:11,color:'var(--text-2)',whiteSpace:'nowrap'}}>{r.signedDate||'—'}</td>
                      <td style={{textAlign:'center',fontWeight:600}}>{r.items.length}</td>
                      <td>
                        <span style={{fontWeight:600,color:isWarn?'var(--amber)':'var(--text-1)'}}>
                          {total>0?`¥${total.toLocaleString()}`:'—'}
                        </span>
                      </td>
                      <td>
                        {r.items.length>0
                          ?<span style={{fontWeight:600,color:isWarn?'var(--amber)':'var(--text-1)'}}>
                              ¥{Math.round(avg).toLocaleString()}
                              {isWarn&&<span className="badge badge-amber" style={{marginLeft:6,fontSize:10}}>↓低于标准</span>}
                            </span>
                          :'—'}
                      </td>
                      <td><span style={{color:'var(--accent)',fontWeight:600}}>¥{r.received.toLocaleString()}</span></td>
                      <td><span style={{color:(total-r.received)>0?'var(--amber)':'var(--text-3)'}}>¥{(total-r.received).toLocaleString()}</span></td>
                      <td><span className={`badge ${r.invoice==='已开'?'badge-green':r.invoice==='部分'?'badge-amber':'badge-gray'}`}>{r.invoice}</span></td>
                      <td><span className={`badge ${STATUS_BADGE[r.contractStatus]||'badge-gray'}`}>{r.contractStatus}</span></td>
                      <td>
                        {r.pdfData
                          ?<button className="btn btn-ghost btn-sm" style={{color:'var(--accent)'}} onClick={()=>downloadPdf(r)} title={r.pdfName}>↓ 下载</button>
                          :<span style={{fontSize:11,color:'var(--text-3)'}}>未上传</span>}
                      </td>
                      <td style={{fontSize:11,color:!r.daiJia&&isWarn?'var(--amber)':'var(--text-2)',maxWidth:110}}>
                        {!r.daiJia&&isWarn?<span style={{fontStyle:'italic',opacity:.7}}>请填写</span>:r.daiJia||'—'}
                      </td>
                      <td style={{whiteSpace:'nowrap'}}>
                        <button className="btn btn-ghost btn-sm" onClick={()=>openEdit(r)}>编辑</button>
                        <button className="btn btn-ghost btn-sm" style={{marginLeft:4,color:'var(--red,#ef4444)'}} onClick={()=>del(r.id)}>删除</button>
                      </td>
                    </tr>

                    {/* 展开子项 */}
                    {isOpen && (
                      <tr key={`${r.id}-sub`}>
                        <td></td>
                        <td colSpan={14} style={{padding:'0 0 16px 8px',background:'var(--bg)'}}>

                          {/* ── 分润明细 ── */}
                          <div style={{fontSize:11,fontWeight:700,color:'var(--text-2)',letterSpacing:'.06em',
                            padding:'8px 10px 4px',display:'flex',alignItems:'center',gap:8}}>
                            ◻ 分润明细
                            <span style={{fontWeight:400,color:'var(--text-3)'}}>基数：合同单价 × 20%</span>
                          </div>
                          <div style={{overflowX:'auto'}}>
                          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,minWidth:1100}}>
                            <thead>
                              <tr style={{color:'var(--text-3)',fontSize:11,background:'var(--bg-card)'}}>
                                {['课程主题','培训日期','单价','分润基数(×20%)','评分','等级',
                                  '研发参与方','研发分润%','研发分润额',
                                  '主讲人姓名','主讲分润%','主讲分润额',
                                  '销售姓名','销售分润%','销售分润额',
                                  '产品中心','产品中心分润%','产品中心分润额'].map((h,i)=>(
                                  <th key={h} style={{padding:'6px 10px',fontWeight:600,whiteSpace:'nowrap',
                                    textAlign: [2,7,8,10,11,13,14,16,17].includes(i) ? 'right' : 'left'}}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {r.items.flatMap((it, idx) => {
                                const rule = lookupSplitRule({channelSource:it.channelSource,devType:it.devType,speakerType:it.speakerType,channelNew:it.channelNew})
                                const devParts = (it.devParticipants||[]).filter(p=>p?.name?.trim())
                                const amts = rule ? calcSplitAmounts(rule, it.price||0, devParts) : null
                                const devPctEach = rule && devParts.length>0 ? rule.dev/devParts.length : (rule?.dev ?? 0)
                                const na = <span style={{color:'var(--text-3)'}}>—</span>
                                return (devParts.length > 0 ? devParts : [null]).map((p, pi) => {
                                  const f = pi === 0
                                  return (
                                    <tr key={`s${idx}-${pi}`} style={{borderTop: f ? '2px solid var(--border)' : '1px dashed var(--border)'}}>
                                      <td style={{padding:'6px 10px',maxWidth:150,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f?(it.course||'—'):''}</td>
                                      <td style={{padding:'6px 10px',color:'var(--text-2)',whiteSpace:'nowrap'}}>{f?(it.date||'—'):''}</td>
                                      <td style={{padding:'6px 10px',textAlign:'right',fontWeight:600}}>{f?`¥${(it.price||0).toLocaleString()}`:''}</td>
                                      <td style={{padding:'6px 10px',textAlign:'right',color:'var(--text-2)'}}>{f?(amts?`¥${Math.round(amts.base).toLocaleString()}`:na):''}</td>
                                      <td style={{padding:'6px 10px',textAlign:'center',color:'var(--accent)',fontWeight:700}}>{f?(it.score??'—'):''}</td>
                                      <td style={{padding:'6px 10px',textAlign:'center'}}>{f?(rule?<span style={{fontWeight:700,color:LEVEL_COLOR[rule.level]||'var(--text-3)'}}>{rule.level}</span>:na):''}</td>
                                      <td style={{padding:'6px 10px',fontWeight:500}}>{p?p.name:na}</td>
                                      <td style={{padding:'6px 10px',textAlign:'right',color:'var(--text-2)'}}>{rule&&p?`${devPctEach.toFixed(1)}%`:na}</td>
                                      <td style={{padding:'6px 10px',textAlign:'right',fontWeight:600}}>{amts&&p&&amts.devPerPerson>0?`¥${Math.round(amts.devPerPerson).toLocaleString()}`:na}</td>
                                      <td style={{padding:'6px 10px',fontWeight:500}}>{f?(it.instructor||na):''}</td>
                                      <td style={{padding:'6px 10px',textAlign:'right',color:'var(--text-2)'}}>{f?(rule?`${rule.speaker}%`:na):''}</td>
                                      <td style={{padding:'6px 10px',textAlign:'right',color:'var(--accent)',fontWeight:600}}>{f?(amts&&amts.speaker>0?`¥${Math.round(amts.speaker).toLocaleString()}`:na):''}</td>
                                      <td style={{padding:'6px 10px',fontWeight:500}}>{f?(r.sales||na):''}</td>
                                      <td style={{padding:'6px 10px',textAlign:'right',color:'var(--text-2)'}}>{f?(rule?`${rule.sales}%`:na):''}</td>
                                      <td style={{padding:'6px 10px',textAlign:'right',color:'var(--amber)',fontWeight:600}}>{f?(amts&&amts.sales>0?`¥${Math.round(amts.sales).toLocaleString()}`:na):''}</td>
                                      {/* 产品中心：仅第一行 */}
                                      <td style={{padding:'6px 10px',color:'var(--text-2)',fontSize:11}}>{f?(rule&&rule.center>0?'产品中心':<span style={{color:'var(--text-3)'}}>—</span>):''}</td>
                                      <td style={{padding:'6px 10px',textAlign:'right',color:'var(--text-2)'}}>{f?(rule?`${rule.center}%`:na):''}</td>
                                      <td style={{padding:'6px 10px',textAlign:'right',fontWeight:600}}>{f?(amts&&amts.center>0?`¥${Math.round(amts.center).toLocaleString()}`:na):''}</td>
                                    </tr>
                                  )
                                })
                              })}
                            </tbody>
                          </table>
                          </div>

                          {/* ── KPI 明细 ── */}
                          <div style={{fontSize:11,fontWeight:700,color:'var(--text-2)',letterSpacing:'.06em',
                            padding:'14px 10px 4px',display:'flex',alignItems:'center',gap:8}}>
                            ◉ KPI 明细
                            <span style={{fontWeight:400,color:'var(--text-3)'}}>基数：合同单价（全额）</span>
                          </div>
                          <div style={{overflowX:'auto'}}>
                          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,minWidth:1100}}>
                            <thead>
                              <tr style={{color:'var(--text-3)',fontSize:11,background:'var(--bg-card)'}}>
                                <th style={{padding:'6px 10px',fontWeight:600,whiteSpace:'nowrap'}}>课程主题</th>
                                <th style={{padding:'6px 10px',fontWeight:600,whiteSpace:'nowrap'}}>培训日期</th>
                                <th style={{padding:'6px 10px',fontWeight:600,whiteSpace:'nowrap',textAlign:'right'}}>KPI基数</th>
                                <th style={{padding:'6px 10px',fontWeight:600,whiteSpace:'nowrap',textAlign:'center'}}>等级</th>
                                <th style={{padding:'6px 10px',fontWeight:600,whiteSpace:'nowrap'}}>研发参与方</th>
                                <th style={{padding:'6px 10px',fontWeight:600,whiteSpace:'nowrap',textAlign:'right'}}>研发KPI比例</th>
                                <th style={{padding:'6px 10px',fontWeight:600,whiteSpace:'nowrap',textAlign:'right'}}>研发KPI额</th>
                                <th style={{padding:'6px 10px',fontWeight:600,whiteSpace:'nowrap'}}>主讲人姓名</th>
                                <th style={{padding:'6px 10px',fontWeight:600,whiteSpace:'nowrap',textAlign:'right'}}>主讲KPI比例</th>
                                <th style={{padding:'6px 10px',fontWeight:600,whiteSpace:'nowrap',textAlign:'right'}}>主讲KPI额</th>
                                <th style={{padding:'6px 10px',fontWeight:600,whiteSpace:'nowrap'}}>销售姓名</th>
                                <th style={{padding:'6px 10px',fontWeight:600,whiteSpace:'nowrap',textAlign:'right'}}>销售KPI比例</th>
                                <th style={{padding:'6px 10px',fontWeight:600,whiteSpace:'nowrap',textAlign:'right'}}>销售KPI额</th>
                                <th style={{padding:'6px 10px',fontWeight:600,whiteSpace:'nowrap'}}>产品中心</th>
                                <th style={{padding:'6px 10px',fontWeight:600,whiteSpace:'nowrap',textAlign:'right'}}>产品中心KPI比例</th>
                                <th style={{padding:'6px 10px',fontWeight:600,whiteSpace:'nowrap',textAlign:'right'}}>产品中心KPI额</th>
                              </tr>
                            </thead>
                            <tbody>
                              {r.items.flatMap((it, idx) => {
                                const rule = lookupSplitRule({channelSource:it.channelSource,devType:it.devType,speakerType:it.speakerType,channelNew:it.channelNew})
                                const devParts = (it.devParticipants||[]).filter(p=>p?.name?.trim())
                                const price = it.price || 0
                                const kpiDevPctEach = rule && devParts.length>0 ? rule.kpiDev/devParts.length : 0
                                const kpi = rule ? {
                                  dev:     price * kpiDevPctEach / 100,
                                  speaker: price * rule.kpiSpeaker / 100,
                                  sales:   price * rule.kpiSales   / 100,
                                  center:  price * rule.kpiCenter  / 100,
                                } : null
                                const na = <span style={{color:'var(--text-3)'}}>—</span>
                                const nc = <span style={{color:'var(--text-3)',fontSize:11}}>不计</span>
                                const pct = v => v > 0 ? `${v}%` : nc
                                const amt = v => v > 0 ? `¥${Math.round(v).toLocaleString()}` : nc
                                return (devParts.length > 0 ? devParts : [null]).map((p, pi) => {
                                  const f = pi === 0
                                  return (
                                    <tr key={`k${idx}-${pi}`} style={{borderTop: f ? '2px solid var(--border)' : '1px dashed var(--border)'}}>
                                      <td style={{padding:'6px 10px',maxWidth:150,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f?(it.course||'—'):''}</td>
                                      <td style={{padding:'6px 10px',color:'var(--text-2)',whiteSpace:'nowrap'}}>{f?(it.date||'—'):''}</td>
                                      <td style={{padding:'6px 10px',textAlign:'right',fontWeight:600}}>{f?`¥${price.toLocaleString()}`:''}</td>
                                      <td style={{padding:'6px 10px',textAlign:'center'}}>{f?(rule?<span style={{fontWeight:700,color:LEVEL_COLOR[rule.level]||'var(--text-3)'}}>{rule.level}</span>:na):''}</td>
                                      {/* 研发：每行独立 */}
                                      <td style={{padding:'6px 10px',fontWeight:500}}>{p?p.name:na}</td>
                                      <td style={{padding:'6px 10px',textAlign:'right',color:'var(--text-2)'}}>
                                        {rule&&p ? pct(kpiDevPctEach) : na}
                                      </td>
                                      <td style={{padding:'6px 10px',textAlign:'right',fontWeight:600,color:'var(--accent)'}}>
                                        {kpi&&p ? amt(kpi.dev) : na}
                                      </td>
                                      {/* 主讲：仅第一行 */}
                                      <td style={{padding:'6px 10px',fontWeight:500}}>{f?(it.instructor||na):''}</td>
                                      <td style={{padding:'6px 10px',textAlign:'right',color:'var(--text-2)'}}>
                                        {f?(rule?pct(rule.kpiSpeaker):na):''}
                                      </td>
                                      <td style={{padding:'6px 10px',textAlign:'right',fontWeight:600,color:'var(--accent)'}}>
                                        {f?(kpi?amt(kpi.speaker):na):''}
                                      </td>
                                      {/* 销售：仅第一行 */}
                                      <td style={{padding:'6px 10px',fontWeight:500}}>{f?(r.sales||na):''}</td>
                                      <td style={{padding:'6px 10px',textAlign:'right',color:'var(--text-2)'}}>
                                        {f?(rule?pct(rule.kpiSales):na):''}
                                      </td>
                                      <td style={{padding:'6px 10px',textAlign:'right',fontWeight:600,color:'var(--amber)'}}>
                                        {f?(kpi?amt(kpi.sales):na):''}
                                      </td>
                                      {/* 产品中心：仅第一行 */}
                                      <td style={{padding:'6px 10px',color:'var(--text-2)',fontSize:11}}>
                                        {f?(rule&&rule.center>0?'产品中心':nc):''}
                                      </td>
                                      <td style={{padding:'6px 10px',textAlign:'right',color:'var(--text-2)'}}>
                                        {f?(rule?pct(rule.kpiCenter):na):''}
                                      </td>
                                      <td style={{padding:'6px 10px',textAlign:'right',fontWeight:600,color:'var(--accent)'}}>
                                        {f?(kpi?amt(kpi.center):na):''}
                                      </td>
                                    </tr>
                                  )
                                })
                              })}
                            </tbody>
                          </table>
                          </div>

                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <input ref={fileRef} type="file" accept=".pdf" style={{display:'none'}} onChange={handlePdfUpload} />

      {/* ── 编辑/新增弹窗 ── */}
      {editRow && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{width:700,maxHeight:'92vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
            <h2 className="modal-title">{isNew?'新增合同':'编辑合同'}</h2>
            {!isNew&&<p className="modal-sub">{editRow.id} · {editRow.channel}</p>}

            {/* 合同基本信息 */}
            <div style={{fontSize:11,fontWeight:700,color:'var(--text-3)',letterSpacing:'.1em',textTransform:'uppercase',marginBottom:10}}>合同信息</div>
            <div className="two-col">
              <div className="form-group">
                <label className="form-label">合同编号（自动生成，可修改）</label>
                <input className="form-input" value={editRow.id} onChange={e=>setEditRow({...editRow,id:e.target.value})} placeholder="ZX-C-2026-XXX"/>
              </div>
              <div className="form-group">
                <label className="form-label">渠道机构</label>
                <input className="form-input" value={editRow.channel} onChange={e=>setEditRow({...editRow,channel:e.target.value})}/>
              </div>
            </div>
            <div className="two-col">
              <div className="form-group">
                <label className="form-label">销售姓名</label>
                <input className="form-input" value={editRow.sales||''} onChange={e=>setEditRow({...editRow,sales:e.target.value})} placeholder="负责跟进的销售"/>
              </div>
              <div className="form-group">
                <label className="form-label">合同签署日期</label>
                <input className="form-input" type="date" value={editRow.signedDate} onChange={e=>setEditRow({...editRow,signedDate:e.target.value})}/>
              </div>
            </div>
            <div className="two-col">
              <div className="form-group">
                <label className="form-label">合同状态</label>
                <select className="form-select" value={editRow.contractStatus} onChange={e=>setEditRow({...editRow,contractStatus:e.target.value})}>
                  <option>草稿</option><option>待签署</option><option>已签署</option><option>已归档</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">已收金额（元）</label>
                <input className="form-input" type="number" value={editRow.received} onChange={e=>setEditRow({...editRow,received:+e.target.value})}/>
              </div>
            </div>
            <div className="two-col">
              <div className="form-group">
                <label className="form-label">发票状态</label>
                <select className="form-select" value={editRow.invoice} onChange={e=>setEditRow({...editRow,invoice:e.target.value})}>
                  <option>未开</option><option>已开</option><option>部分</option>
                </select>
              </div>
            </div>

            {/* 培训场次 */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:20,marginBottom:10}}>
              <div style={{fontSize:11,fontWeight:700,color:'var(--text-3)',letterSpacing:'.1em',textTransform:'uppercase'}}>培训场次明细</div>
              <div style={{fontSize:12,color:'var(--text-2)'}}>
                共 {editRow.items.length} 场 · 合计
                <span style={{fontWeight:700,color:'var(--text-1)',marginLeft:4}}>¥{calcTotal(editRow.items).toLocaleString()}</span>
                {editRow.items.length>0&&(
                  <span style={{marginLeft:8,color:calcAvg(editRow.items)<15000?'var(--amber)':'var(--text-3)'}}>
                    均 ¥{Math.round(calcAvg(editRow.items)).toLocaleString()}/场
                    {calcAvg(editRow.items)<15000&&' ⚠'}
                  </span>
                )}
              </div>
            </div>

            {editRow.items.map((it, idx) => {
              const isExpanded = splitExpanded.has(idx)
              const rule = lookupSplitRule({channelSource:it.channelSource,devType:it.devType,speakerType:it.speakerType,channelNew:it.channelNew})
              const depts = (it.devParticipants||[]).filter(p => p?.name?.trim())
              const amts  = rule ? calcSplitAmounts(rule, it.price||0, depts) : null

              return (
                <div key={idx} style={{border:'1px solid var(--border)',borderRadius:10,overflow:'hidden',marginBottom:8}}>
                  {/* 基本字段行 */}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 104px 124px 110px 64px auto 32px',gap:4,padding:'8px 12px',alignItems:'center',background:'var(--bg-card)'}}>
                    <input className="form-input" style={{margin:0,fontSize:12,padding:'5px 8px'}}
                      value={it.course} placeholder="课程主题" onChange={e=>setItem(idx,'course',e.target.value)}/>
                    <select className="form-select" style={{margin:'0 2px',fontSize:12,padding:'5px 6px'}}
                      value={it.instructor} onChange={e=>setItem(idx,'instructor',e.target.value)}>
                      <option value="">讲师</option>
                      {INSTRUCTORS.map(n=><option key={n}>{n}</option>)}
                    </select>
                    <input className="form-input" type="date" style={{margin:'0 2px',fontSize:11,padding:'5px 6px'}}
                      value={it.date} onChange={e=>setItem(idx,'date',e.target.value)}/>
                    <input className="form-input" type="number" style={{margin:'0 2px',fontSize:12,padding:'5px 8px',color:it.price<15000?'var(--amber)':undefined}}
                      value={it.price} onChange={e=>setItem(idx,'price',+e.target.value)}/>
                    <input className="form-input" type="number" min="0" max="100"
                      style={{margin:'0 2px',fontSize:12,padding:'5px 6px',textAlign:'center'}}
                      value={it.score??''} placeholder="分" onChange={e=>setItem(idx,'score',e.target.value?+e.target.value:null)}/>
                    <button
                      onClick={()=>toggleSplit(idx)}
                      style={{fontSize:11,padding:'4px 8px',borderRadius:6,border:'1px solid var(--border)',background:isExpanded?'var(--accent-lt)':'var(--bg)',color:isExpanded?'var(--accent)':'var(--text-2)',cursor:'pointer',whiteSpace:'nowrap'}}>
                      分润 {rule?<span style={{color:LEVEL_COLOR[rule.level],fontWeight:700}}>{rule.level}</span>:'?'} {isExpanded?'▾':'▸'}
                    </button>
                    <button style={{background:'none',border:'none',cursor:'pointer',color:editRow.items.length===1?'var(--border)':'var(--red,#ef4444)',fontSize:16,lineHeight:1}}
                      disabled={editRow.items.length===1} onClick={()=>removeItem(idx)}>×</button>
                  </div>

                  {/* 分润配置展开区 */}
                  {isExpanded && (
                    <div style={{padding:'12px 14px',borderTop:'1px solid var(--border)',background:'var(--bg)'}}>

                      {/* 3 个基础参数选择器（已移除研发方类型） */}
                      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:12}}>
                        <div>
                          <div style={{fontSize:10,color:'var(--text-3)',marginBottom:4,fontWeight:600}}>渠道来源</div>
                          <select className="form-select" style={{fontSize:12,padding:'4px 6px'}}
                            value={it.channelSource} onChange={e=>setItem(idx,'channelSource',e.target.value)}>
                            <option value="">请选择</option>
                            <option>慧管家</option><option>自主渠道</option><option>常顾咨询</option>
                          </select>
                        </div>
                        <div>
                          <div style={{fontSize:10,color:'var(--text-3)',marginBottom:4,fontWeight:600}}>主讲类型</div>
                          <select className="form-select" style={{fontSize:12,padding:'4px 6px'}}
                            value={it.speakerType} onChange={e=>setItem(idx,'speakerType',e.target.value)}>
                            <option value="">请选择</option>
                            <option>BU主讲</option><option>产品中心主讲</option><option>架构师</option>
                            <option>外部特定</option><option>外部非特定</option>
                          </select>
                        </div>
                        <div>
                          <div style={{fontSize:10,color:'var(--text-3)',marginBottom:4,fontWeight:600}}>渠道新旧</div>
                          <select className="form-select" style={{fontSize:12,padding:'4px 6px'}}
                            value={it.channelNew} onChange={e=>setItem(idx,'channelNew',e.target.value)}>
                            <option value="">请选择</option>
                            <option>存量渠道</option><option>新开拓渠道</option>
                          </select>
                        </div>
                      </div>

                      {/* 研发参与方逐条录入 */}
                      <div style={{marginBottom:12}}>
                        <div style={{fontSize:10,color:'var(--text-3)',fontWeight:600,marginBottom:6}}>
                          研发参与方
                          <span style={{fontWeight:400,marginLeft:6}}>（可填部门名称或个人姓名，多个自动均分研发分润）</span>
                        </div>
                        {it.devParticipants.map((p, pIdx) => (
                          <div key={pIdx} style={{display:'flex',gap:6,marginBottom:4,alignItems:'center'}}>
                            <input className="form-input" style={{flex:1,fontSize:12,padding:'5px 8px'}}
                              value={p.name} placeholder="部门名称 或 个人姓名"
                              onChange={e=>setParticipant(idx,pIdx,e.target.value)}/>
                            <button
                              style={{background:'none',border:'none',cursor:'pointer',padding:'2px 6px',fontSize:15,
                                color:it.devParticipants.length===1?'var(--border)':'var(--red,#ef4444)',lineHeight:1}}
                              disabled={it.devParticipants.length===1}
                              onClick={()=>removeParticipant(idx,pIdx)}>×</button>
                          </div>
                        ))}
                        <button className="btn btn-ghost btn-sm" style={{fontSize:11,marginTop:2}}
                          onClick={()=>addParticipant(idx)}>＋ 添加研发参与方</button>
                      </div>

                      {/* 规则说明 + 分润明细表：始终渲染，rule 未就绪时显示占位 */}
                      {(() => {
                        const validDevs = it.devParticipants.filter(p=>p.name.trim())
                        const devPctEach = rule && validDevs.length>0 ? rule.dev/validDevs.length : 0
                        const devAmtEach = amts ? amts.devPerPerson : 0

                        return (
                          <div>
                            {/* 规则说明条 */}
                            <div style={{fontSize:11,color:'var(--text-2)',marginBottom:8,padding:'6px 10px',
                              background:'var(--bg-card)',borderRadius:6,
                              borderLeft:`3px solid ${rule ? (LEVEL_COLOR[rule.level]||'var(--accent)') : 'var(--border)'}`,
                              display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                              <span>
                                {rule
                                  ? <><span style={{fontWeight:700,color:LEVEL_COLOR[rule.level]||'var(--text-3)',marginRight:8}}>激励等级 {rule.level}</span>{rule.note}</>
                                  : <span style={{color:'var(--text-3)'}}>请先选择渠道来源、主讲类型、渠道新旧，自动匹配激励等级</span>
                                }
                              </span>
                              <span style={{fontWeight:600,color:'var(--text-1)',whiteSpace:'nowrap',marginLeft:12}}>
                                分润基数 ¥{Math.round((it.price||0)*0.2).toLocaleString()}
                                <span style={{fontWeight:400,color:'var(--text-3)',marginLeft:4}}>（单价 × 20%）</span>
                              </span>
                            </div>

                            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                              <thead>
                                <tr style={{background:'var(--bg)',fontSize:11,color:'var(--text-3)'}}>
                                  <th style={{padding:'6px 10px',textAlign:'left',fontWeight:600}}>角色</th>
                                  <th style={{padding:'6px 10px',textAlign:'left',fontWeight:600}}>姓名 / 部门</th>
                                  <th style={{padding:'6px 10px',textAlign:'right',fontWeight:600}}>分润%</th>
                                  <th style={{padding:'6px 10px',textAlign:'right',fontWeight:600}}>分润金额</th>
                                  <th style={{padding:'6px 10px',textAlign:'center',fontWeight:600}}>KPI 计入</th>
                                </tr>
                              </thead>
                              <tbody>
                                {/* 研发参与方：逐人一行 */}
                                {validDevs.length>0 ? validDevs.map((p,pi)=>(
                                  <tr key={`dev${pi}`} style={{borderTop:'1px solid var(--border)'}}>
                                    <td style={{padding:'6px 10px',color:'var(--text-2)',fontSize:11}}>
                                      {pi===0 ? `研发${rule ? ` (${rule.dev}%${validDevs.length>1?' 均分':''})` : ''}` : ''}
                                    </td>
                                    <td style={{padding:'6px 10px',fontWeight:500}}>{p.name}</td>
                                    <td style={{padding:'6px 10px',textAlign:'right',color:'var(--text-2)'}}>
                                      {devPctEach>0 ? devPctEach.toFixed(1)+'%' : '—'}
                                    </td>
                                    <td style={{padding:'6px 10px',textAlign:'right',color:devAmtEach>0?'var(--text-1)':'var(--text-3)'}}>
                                      {devAmtEach>0 ? `¥${Math.round(devAmtEach).toLocaleString()}` : '—'}
                                    </td>
                                    <td style={{padding:'6px 10px',textAlign:'center'}}>
                                      {rule
                                        ? rule.kpiDev>0 ? <span style={{color:'var(--accent)',fontSize:11}}>✓ {rule.kpiDev}%</span> : <span style={{color:'var(--text-3)',fontSize:11}}>不计</span>
                                        : <span style={{color:'var(--text-3)',fontSize:11}}>—</span>}
                                    </td>
                                  </tr>
                                )) : (
                                  <tr style={{borderTop:'1px solid var(--border)'}}>
                                    <td style={{padding:'6px 10px',color:'var(--text-2)',fontSize:11}}>
                                      研发{rule ? ` (${rule.dev}%)` : ''}
                                    </td>
                                    <td style={{padding:'6px 10px',color:'var(--text-3)',fontStyle:'italic'}}>请填写研发参与方</td>
                                    <td colSpan={3}></td>
                                  </tr>
                                )}

                                {/* 主讲人：始终显示 */}
                                <tr style={{borderTop:'1px solid var(--border)'}}>
                                  <td style={{padding:'6px 10px',color:'var(--text-2)',fontSize:11}}>
                                    主讲{rule ? ` (${rule.speaker}%)` : ''}
                                  </td>
                                  <td style={{padding:'6px 10px',fontWeight:500}}>
                                    {it.instructor || <span style={{color:'var(--text-3)',fontStyle:'italic'}}>（场次讲师未填）</span>}
                                  </td>
                                  <td style={{padding:'6px 10px',textAlign:'right',color:'var(--text-2)'}}>
                                    {rule ? `${rule.speaker}%` : '—'}
                                  </td>
                                  <td style={{padding:'6px 10px',textAlign:'right',color:'var(--accent)',fontWeight:600}}>
                                    {amts && amts.speaker>0 ? `¥${Math.round(amts.speaker).toLocaleString()}` : '—'}
                                  </td>
                                  <td style={{padding:'6px 10px',textAlign:'center'}}>
                                    {rule
                                      ? rule.kpiSpeaker>0 ? <span style={{color:'var(--accent)',fontSize:11}}>✓ {rule.kpiSpeaker}%</span> : <span style={{color:'var(--text-3)',fontSize:11}}>不计</span>
                                      : <span style={{color:'var(--text-3)',fontSize:11}}>—</span>}
                                  </td>
                                </tr>

                                {/* 销售方：始终显示 */}
                                <tr style={{borderTop:'1px solid var(--border)'}}>
                                  <td style={{padding:'6px 10px',color:'var(--text-2)',fontSize:11}}>
                                    销售{rule ? ` (${rule.sales}%)` : ''}
                                  </td>
                                  <td style={{padding:'6px 10px',fontWeight:500}}>
                                    {editRow.sales || <span style={{color:'var(--text-3)',fontStyle:'italic'}}>（合同销售未填）</span>}
                                  </td>
                                  <td style={{padding:'6px 10px',textAlign:'right',color:'var(--text-2)'}}>
                                    {rule ? `${rule.sales}%` : '—'}
                                  </td>
                                  <td style={{padding:'6px 10px',textAlign:'right',color:'var(--amber)',fontWeight:600}}>
                                    {amts && amts.sales>0 ? `¥${Math.round(amts.sales).toLocaleString()}` : '—'}
                                  </td>
                                  <td style={{padding:'6px 10px',textAlign:'center'}}>
                                    {rule
                                      ? rule.kpiSales>0 ? <span style={{color:'var(--accent)',fontSize:11}}>✓ {rule.kpiSales}%</span> : <span style={{color:'var(--text-3)',fontSize:11}}>不计</span>
                                      : <span style={{color:'var(--text-3)',fontSize:11}}>—</span>}
                                  </td>
                                </tr>

                                {/* 产品中心：有分润时显示 */}
                                {rule && rule.center>0 && (
                                  <tr style={{borderTop:'1px solid var(--border)'}}>
                                    <td style={{padding:'6px 10px',color:'var(--text-2)',fontSize:11}}>产品中心 ({rule.center}%)</td>
                                    <td style={{padding:'6px 10px',fontWeight:500}}>产品中心</td>
                                    <td style={{padding:'6px 10px',textAlign:'right',color:'var(--text-2)'}}>{rule.center}%</td>
                                    <td style={{padding:'6px 10px',textAlign:'right',fontWeight:600}}>
                                      {amts && `¥${Math.round(amts.center).toLocaleString()}`}
                                    </td>
                                    <td style={{padding:'6px 10px',textAlign:'center'}}>
                                      {rule.kpiCenter>0
                                        ? <span style={{color:'var(--accent)',fontSize:11}}>✓ {rule.kpiCenter}%</span>
                                        : <span style={{color:'var(--text-3)',fontSize:11}}>不计</span>}
                                    </td>
                                  </tr>
                                )}

                                {/* 激励池：规则就绪后显示 */}
                                {rule && (
                                  <tr style={{borderTop:'1px solid var(--border)',opacity:.65}}>
                                    <td style={{padding:'6px 10px',color:'var(--text-3)',fontSize:11}}>激励池 ({rule.pool}%)</td>
                                    <td style={{padding:'6px 10px',color:'var(--text-3)'}}>公司留存</td>
                                    <td style={{padding:'6px 10px',textAlign:'right',color:'var(--text-3)'}}>{rule.pool}%</td>
                                    <td style={{padding:'6px 10px',textAlign:'right',color:'var(--text-3)'}}>
                                      {amts && `¥${Math.round(amts.pool).toLocaleString()}`}
                                    </td>
                                    <td style={{padding:'6px 10px',textAlign:'center',color:'var(--text-3)'}}>—</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        )
                      })()}
                    </div>
                  )}
                </div>
              )
            })}

            <div style={{padding:'6px 0 4px'}}>
              <button className="btn btn-ghost btn-sm" onClick={addItem}>＋ 添加培训场次</button>
            </div>

            {/* 低于标准警告 */}
            {calcAvg(editRow.items) < 15000 && editRow.items.length > 0 && (
              <div className="alert alert-warn" style={{margin:'12px 0 0'}}>
                <span>⚠</span>
                <span>平均单价 ¥{Math.round(calcAvg(editRow.items)).toLocaleString()}/场，低于标准报价，请填写对价备注</span>
              </div>
            )}

            {/* PDF */}
            <div style={{fontSize:11,fontWeight:700,color:'var(--text-3)',letterSpacing:'.1em',textTransform:'uppercase',margin:'20px 0 10px'}}>合同 PDF</div>
            <div className="form-group">
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={()=>fileRef.current?.click()}>
                  {editRow.pdfName?'重新上传':'上传 PDF'}
                </button>
                {editRow.pdfName&&(
                  <>
                    <span style={{fontSize:12,color:'var(--text-2)',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{editRow.pdfName}</span>
                    <button type="button" className="btn btn-ghost btn-sm" style={{color:'var(--accent)'}} onClick={()=>downloadPdf(editRow)}>↓ 下载</button>
                    <button type="button" className="btn btn-ghost btn-sm" style={{color:'var(--red,#ef4444)'}} onClick={()=>setEditRow({...editRow,pdfName:'',pdfData:''})}>移除</button>
                  </>
                )}
              </div>
            </div>

            {/* 对价 & 备注 */}
            <div className="form-group" style={{marginTop:12}}>
              <label className="form-label">对价备注</label>
              <textarea className="form-textarea" value={editRow.daiJia} onChange={e=>setEditRow({...editRow,daiJia:e.target.value})} placeholder="记录其他对价内容（如转介绍、资源互换等）"/>
            </div>
            <div className="form-group">
              <label className="form-label">对价实现情况</label>
              <textarea className="form-textarea" style={{minHeight:56}} value={editRow.daiJiaStatus} onChange={e=>setEditRow({...editRow,daiJiaStatus:e.target.value})} placeholder="对价是否已兑现、兑现方式、时间等"/>
            </div>
            <div className="form-group">
              <label className="form-label">其他备注</label>
              <textarea className="form-textarea" style={{minHeight:56}} value={editRow.remark} onChange={e=>setEditRow({...editRow,remark:e.target.value})} placeholder="未尽事宜自由记录"/>
            </div>

            <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:4}}>
              <button className="btn btn-secondary" onClick={closeModal}>取消</button>
              <button className="btn btn-primary" onClick={save}>保存</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
