import { useState, useRef, useCallback, useEffect } from 'react'
import { useMobile } from '../MobileContext'

const SERIES = [
  {
    id: 1,
    phase: '企业初创与成长期',
    title: '股权架构顶层设计与激励落地',
    color: '#B45309',
    bg: '#FFFBEB',
    border: '#FDE68A',
    tag: 'Series 01',
    units: [
      { name: '企业全生命周期股权设计', pain: '早期架构不合理，为融资、上市埋下隐患', client: '早期创业者、新兴企业家、家族接班人', case: '某传统行业实控人股权接班及传承方案' },
      { name: '创始人控制权保护', pain: '多轮融资股权稀释，控制权旁落风险', client: '正在或计划进行多轮融资的企业实控人', case: '某多轮融资初创企业持股结构调整' },
      { name: '员工股权激励设计', pain: '骨干认知不足、激励失效、分配不公', client: '初创期、转型期或上市进程中的企业', case: '某世界级原创技术高科技企业股权激励计划' },
      { name: '非货币性资产出资', pain: '技术入股过程复杂，估值与税务埋下隐患', client: '拥有技术/专利的创始人', case: '某江苏省温控行业新三板公司非货币性投资方案' },
      { name: '拟上市公司架构安排', pain: '历史融资架构复杂，面临高税务成本', client: '计划在境内外上市的企业家', case: '某高新材料制造业科创板上市公司持股平台减持税务合规' },
      { name: '国际税视野下的持股架构', pain: '美籍股东跨境税制应对复杂', client: '持有美籍/绿卡的创始人或大股东', case: '某龙头行业拟上市公司大股东中美联合申报及FGT结构' },
      { name: '红筹架构海外上市', pain: '境外上市路径模糊，架构搭建不清晰', client: '计划境外上市的创始人', case: '某互联网算力头部企业境外上市架构' },
      { name: '股权动态调整与退出设计', pain: '婚变、离职等变动引发股权纠纷', client: '关注股权健康度的企业家', case: '某主板上市公司股权传承计划' },
      { name: '股权架构税务体检', pain: '当前架构在减持、分红时税负过高', client: '所有企业家（尤其关注税务成本者）', case: '某轮胎行业深主板上市公司持股平台减持税务合规' },
    ],
  },
  {
    id: 2,
    phase: '业务扩张期',
    title: '跨境业务架构与税务全景',
    color: '#1D4ED8',
    bg: '#EFF6FF',
    border: '#BFDBFE',
    tag: 'Series 02',
    units: [
      { name: '跨境电商全链条税务合规', pain: '跨境业务"关税汇"风险与利润侵蚀', client: '跨境电商卖家、制造业出海企业主', case: '某长三角头部跨境电商企业行业优惠及临港政策落地' },
      { name: '境外投资架构设计', pain: '架构不合理致退出税负高、资金回流难', client: '计划海外投资/并购的企业家', case: '某知名投资人百亿规模投资项目结构搭建' },
      { name: '转让定价与BEPS合规', pain: '关联交易定价面临各国税局调查与双重征税', client: '在海外有关联公司的企业主', case: '某新能源汽车配件企业转让定价咨询' },
      { name: '中美贸易战税务应对', pain: '关税增加冲击利润，供应链重塑迫在眉睫', client: '受中美贸易战影响的进出口企业', case: '某医药类上市公司的跨境架构及实施' },
      { name: '境内外信托架构与风险隔离', pain: '企业债务、婚姻风险传导至个人财富', client: '关注债务/婚姻风险隔离的企业家', case: '某珠三角知名跨境电商实控人股权信托架构搭建' },
      { name: '跨境并购税务合规', pain: '交易结构复杂，隐含巨额税务负担', client: '进行海外收购分拆的企业家', case: '某自动化系统集成商跨境架构及实施' },
      { name: 'CRS与受控外国企业规则', pain: '离岸架构在"透明时代"面临穿透风险', client: '在免税地设有公司的企业主', case: '某深主板制造业上市公司受控外国企业及外派员工CRS涉税合规建议' },
    ],
  },
  {
    id: 3,
    phase: '资本成熟期',
    title: '股东减持与税务合规',
    color: '#065F46',
    bg: '#ECFDF5',
    border: '#A7F3D0',
    tag: 'Series 03',
    units: [
      { name: '有限合伙平台减持', pain: '合伙架构减持税务复杂，追税风险高', client: '通过合伙平台持股的上市公司股东', case: '某文化行业创业板上市公司有限合伙持股平台减持' },
      { name: '有限公司平台减持', pain: '公司制持股面临"双重征税"困境', client: '通过公司平台持股的上市公司股东', case: '结合多个公司制平台减持案例讲解' },
      { name: '减持税务合规与稽查风险预防', pain: '减持后担忧税务机关稽查补税罚款', client: '即将或已完成减持的上市公司股东', case: '某创业板公司股东减持后成功应对税务稽查案例' },
      { name: '上市公司减持及再投资', pain: '减持后资金闲置，缺乏再投资规划', client: 'A股上市公司实控人、大股东、董秘', case: '某文化行业上市公司持股平台减持税务合规' },
      { name: '减持方式选择与实操', pain: '多种减持工具面前难以选择最优路径', client: '对减持效率和市场影响有要求的股东', case: '综合所有减持案例的操作细节进行讲解' },
      { name: '外籍股东跨境减持', pain: '外籍股东减持面临复杂外汇、税务与法律问题', client: '外籍股东或通过境外平台持股者', case: '结合多个涉及美籍、加拿大籍等外籍实控人/股东的服务案例' },
    ],
  },
  {
    id: 4,
    phase: '财富资本化',
    title: '境外上市与跨境资本路径创新',
    color: '#6D28D9',
    bg: '#F5F3FF',
    border: '#DDD6FE',
    tag: 'Series 04',
    units: [
      { name: '境外上市架构设计', pain: '境外上市顶层架构模糊，员工激励平台难选择', client: '计划赴港/赴美上市的企业家', case: '某互联网算力头部企业境外上市架构及实控人Pre-IPO信托、员工福利信托' },
      { name: '境内外投融资架构', pain: '架构僵化，无法灵活应对多投资场景', client: '计划进行跨境投资的企业家', case: '某知名投资人百亿规模投资项目结构搭建' },
      { name: '中美投融资架构', pain: '中美监管与税制差异让投融资束手束脚', client: '进行跨境融资的创业者、投资者', case: '某赴美上市SAAS行业中资企业投融资架构方案' },
      { name: '新加坡/香港地区投资架构', pain: '对新港法律税务环境不熟，架构搭建盲目', client: '计划投资东南亚的企业家', case: '某头部家具生产企业东南亚业务架构搭建' },
      { name: '新加坡/香港地区家族办公室', pain: '家族财富缺乏专业化管理，资产分散低效', client: '超高净值家族、大额资产变现的股东', case: '某矿业家族境外家办及NRT结构安排' },
      { name: '多司法辖区税务合规', pain: '资产遍布多国，管理混乱、成本不清晰', client: '资产遍布多国的超高净值家族', case: '某跨境支付独角兽企业实控人多国收入税务合规' },
    ],
  },
  {
    id: 5,
    phase: '家族永续期',
    title: '跨境/境内家族信托、税务与治理',
    color: '#0E7490',
    bg: '#ECFEFF',
    border: '#A5F3FC',
    tag: 'Series 05',
    units: [
      { name: '涉税数据，内外兼修', pain: '金税四期严监管下，税务处理风险极高', client: '希望提高税务合规质量的企业家', case: '综合多个服务案例中金税四期下的合规实践' },
      { name: '穿越CRS"暴风眼"', pain: '海外账户面临CRS信息交换后的补税风险', client: '在海外拥有金融账户的高净值客户', case: '某境外永居中国公民转让境外上市公司股票，CRS信息交换后个人所得税合规' },
      { name: '中加、中美财富人士规划', pain: '家庭成员持多国身份，合规风险高', client: '美籍公民、绿卡持有者、加拿大税务居民', case: '某中国籍制造企业家（持美国绿卡）中美个税联合申报' },
      { name: '跨境家族信托', pain: '不知如何设立信托、注入资产并发挥隔离作用', client: '关注资产保护与世代传承的企业家', case: '某创业板制造业公司实控人一致行动家族信托' },
      { name: '家庭内部风险管理', pain: '婚变、债务、继承纠纷导致财富严重缩水', client: '女性企业家、全职太太、高净值家庭子女', case: '结合各类家族信托和资产规划案例' },
      { name: '身份规划税务考量', pain: '单一身份在全球化生活中带来不便与额外税负', client: '家庭成员涉多国身份的企业家', case: '综合多个服务案例中企业家及家庭成员境外身份涉税合规' },
      { name: '弃籍税规划', pain: '放弃美国身份前，弃籍税计算与规划复杂', client: '计划放弃美籍/绿卡的高净值人士', case: '某中国籍服装企业家放弃美国绿卡的资产规划与税务合规' },
      { name: '企业经营财税合规', pain: '日常经营中隐藏的财税风险点不自知', client: '所有企业主', case: '结合所有企业服务案例中的合规要点进行讲解' },
      { name: '国际税务争议与家族治理', pain: '多国税局调查无力应对，家族治理机制缺失', client: '面临税务稽查的家族、大家族', case: '某大型制造业公司"走出去"过程中跨境交易的国际税务争议咨询' },
      { name: '二代接班技能提升', pain: '二代缺乏系统训练，两代人理念冲突', client: '面对交班压力的二代及希望培养二代的一代', case: '某地产二代从离家出走到全面接班' },
      { name: '高净值人士涉税误区', pain: '经营与财富管理中存在涉税认知误区', client: '所有企业主及高净值人群', case: '综合多个高净值客户服务案例中的典型误区与规划升级实践' },
      { name: '智慧税务，有法可依', pain: '2026增值税法对公司的影响与应对', client: '所有企业主', case: '结合2026年增值税法规的税务咨询实践' },
    ],
  },
  {
    id: 6,
    phase: '企业家投资思维',
    title: '从产业经营到资产配置的范式转换',
    color: '#B91C1C',
    bg: '#FFF1F2',
    border: '#FECDD3',
    tag: 'Series 06',
    units: [
      { name: '认知重塑：企业家为何需要投资思维', pain: '过度依赖主业，忽视配置，周期波动下财富缩水', client: '主业稳定但缺乏投资系统认知的企业家', case: '为某企业实控人家族搭建独立家族办公室' },
      { name: '理论学习：资产价格的运行逻辑与风格周期', pain: '忽视市场周期与风格轮动，努力却亏钱', client: '有投资经验但回报不理想的企业家', case: '某化工行业上市公司从股票与期货投资转向组合投资' },
      { name: '框架搭建：家族财富"进攻—防守"配置体系', pain: '资产过度集中于股权，流动性不足，风险暴露高', client: '资产规模较大但配置单一的企业家', case: '某消费制造业上市公司从集中持有股权转向多元化资产配置' },
      { name: '心法修炼：投资行为偏差与预防', pain: '过度自信、追涨杀跌等行为偏差导致盲目亏损', client: '希望建立投资系统与理念传承的企业家', case: '某外贸企业二代进入投资研究领域，为家族建立流动资金管理和二级市场投资体系' },
    ],
  },
]

/* ─── Share URL ─── */
const SHARE_PATH = 'course-system.html'

function getShareUrl() {
  const base = window.location.href.split('#')[0].replace(/\/[^/]*$/, '/')
  return base + SHARE_PATH
}

/* ════ Poster generation (Canvas) ════ */
const POSTER_TAGS = ['股权架构顶层设计', '跨境业务与税务', '股东减持合规', '境外上市路径', '家族信托治理', '企业家投资思维']
const P_ACCENT    = '#2D6A4F'
const P_ACCENT_LT = '#D8F3DC'

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function loadQRLib() {
  return new Promise(resolve => {
    if (window.QRCode) { resolve(); return }
    const s = document.createElement('script')
    s.src = 'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js'
    s.onload = resolve; s.onerror = resolve
    document.head.appendChild(s)
  })
}

function drawPosterBase(ctx, W, H) {
  const grad = ctx.createLinearGradient(0, 0, 0, H)
  grad.addColorStop(0, '#FFFFFF'); grad.addColorStop(0.45, '#F2FBF5'); grad.addColorStop(1, '#EAF6EF')
  ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H)

  ctx.beginPath(); ctx.arc(W + 60, -60, 240, 0, Math.PI * 2); ctx.fillStyle = 'rgba(45,106,79,0.07)'; ctx.fill()
  ctx.beginPath(); ctx.arc(-60, H + 40, 200, 0, Math.PI * 2); ctx.fillStyle = 'rgba(45,106,79,0.05)'; ctx.fill()

  ctx.fillStyle = P_ACCENT; rr(ctx, 0, 0, W, 8, 0); ctx.fill()

  rr(ctx, 44, 38, 56, 56, 12); ctx.fillStyle = P_ACCENT; ctx.fill()
  ctx.fillStyle = '#fff'; ctx.font = 'bold 28px "PingFang SC","Microsoft YaHei",sans-serif'; ctx.textAlign = 'center'; ctx.fillText('曦', 72, 76)

  ctx.textAlign = 'left'; ctx.fillStyle = '#1A1A2E'
  ctx.font = 'bold 22px "PingFang SC","Microsoft YaHei",sans-serif'; ctx.fillText('朝曦家办', 116, 62)
  ctx.fillStyle = '#A1A1AA'; ctx.font = '15px "PingFang SC","Microsoft YaHei",sans-serif'; ctx.fillText('知识工坊 · 企业家专属培训', 116, 84)

  ctx.fillStyle = '#1A1A2E'; ctx.font = 'bold 46px "PingFang SC","Microsoft YaHei",sans-serif'; ctx.textAlign = 'center'; ctx.fillText('六大系列课程体系', W / 2, 196)
  ctx.fillStyle = P_ACCENT; ctx.font = '20px "PingFang SC","Microsoft YaHei",sans-serif'; ctx.fillText('懂企业的成长，更懂企业家的心事', W / 2, 234)

  ;[['6', '核心系列'], ['44', '课程单元'], ['3', '专业领域']].forEach(([num, label], i) => {
    const x = 128 + i * 248
    rr(ctx, x - 80, 262, 160, 64, 12); ctx.fillStyle = P_ACCENT_LT; ctx.fill()
    ctx.fillStyle = P_ACCENT; ctx.font = 'bold 30px "PingFang SC","Microsoft YaHei",sans-serif'; ctx.textAlign = 'center'; ctx.fillText(num, x, 297)
    ctx.font = '14px "PingFang SC","Microsoft YaHei",sans-serif'; ctx.fillStyle = '#52525B'; ctx.fillText(label, x, 318)
  })

  ctx.strokeStyle = '#E4DDD3'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(44, 352); ctx.lineTo(W - 44, 352); ctx.stroke()

  const sColors = ['#B45309','#1D4ED8','#065F46','#6D28D9','#0E7490','#B91C1C']
  const sBgs    = ['#FFFBEB','#EFF6FF','#ECFDF5','#F5F3FF','#ECFEFF','#FFF1F2']
  ctx.textAlign = 'left'
  POSTER_TAGS.forEach((tag, i) => {
    const col = i % 2, row = Math.floor(i / 2)
    const x = 44 + col * 335, y = 374 + row * 72
    rr(ctx, x, y, 310, 56, 10); ctx.fillStyle = sBgs[i]; ctx.fill()
    ctx.strokeStyle = sColors[i] + '55'; ctx.lineWidth = 1; ctx.stroke()
    rr(ctx, x + 10, y + 14, 44, 26, 6); ctx.fillStyle = sColors[i]; ctx.fill()
    ctx.fillStyle = '#fff'; ctx.font = 'bold 12px "PingFang SC","Microsoft YaHei",sans-serif'; ctx.textAlign = 'center'; ctx.fillText(`S0${i + 1}`, x + 32, y + 31)
    ctx.fillStyle = '#1A1A2E'; ctx.font = 'bold 15px "PingFang SC","Microsoft YaHei",sans-serif'; ctx.textAlign = 'left'; ctx.fillText(tag, x + 62, y + 33)
  })

  const qrTop = 612
  ctx.strokeStyle = '#E4DDD3'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(44, qrTop - 14); ctx.lineTo(W - 44, qrTop - 14); ctx.stroke()
  ctx.fillStyle = '#52525B'; ctx.font = '17px "PingFang SC","Microsoft YaHei",sans-serif'; ctx.textAlign = 'center'; ctx.fillText('扫描下方二维码，查看完整课程体系', W / 2, qrTop + 12)
  return { qrTop }
}

function finishPoster(ctx, W, H, qrY, qrSize) {
  const lx = W / 2, ly = qrY + qrSize / 2
  rr(ctx, lx - 22, ly - 22, 44, 44, 10); ctx.fillStyle = P_ACCENT; ctx.fill()
  ctx.fillStyle = '#fff'; ctx.font = 'bold 20px "PingFang SC","Microsoft YaHei",sans-serif'; ctx.textAlign = 'center'; ctx.fillText('曦', lx, ly + 7)
  ctx.fillStyle = P_ACCENT; ctx.fillRect(0, H - 80, W, 80)
  ctx.fillStyle = '#fff'; ctx.font = 'bold 18px "PingFang SC","Microsoft YaHei",sans-serif'; ctx.textAlign = 'center'; ctx.fillText('朝曦家办 · 知识工坊', W / 2, H - 44)
  ctx.fillStyle = 'rgba(255,255,255,0.65)'; ctx.font = '13px "PingFang SC","Microsoft YaHei",sans-serif'; ctx.fillText('课程定制 · 量身组合 · 支持单次沙龙与系列培训', W / 2, H - 22)
}

async function buildPoster(canvas, shareUrl) {
  const W = 750, H = 1120
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')
  const { qrTop } = drawPosterBase(ctx, W, H)
  const qrSize = 240, qrX = (W - qrSize) / 2, qrY = qrTop + 36
  rr(ctx, qrX - 8, qrY - 8, qrSize + 16, qrSize + 16, 16); ctx.fillStyle = '#fff'; ctx.fill()
  ctx.strokeStyle = '#E4DDD3'; ctx.lineWidth = 1; ctx.stroke()

  await loadQRLib()

  return new Promise(resolve => {
    if (!window.QRCode) {
      ctx.fillStyle = '#A1A1AA'; ctx.font = '12px monospace'; ctx.textAlign = 'center'; ctx.fillText(shareUrl, W / 2, qrY + qrSize / 2)
      finishPoster(ctx, W, H, qrY, qrSize); resolve(); return
    }
    const tmp = document.createElement('div'); document.body.appendChild(tmp)
    new window.QRCode(tmp, { text: shareUrl, width: qrSize, height: qrSize, colorDark: '#1A1A2E', colorLight: '#FFFFFF', correctLevel: window.QRCode.CorrectLevel.M })
    setTimeout(() => {
      const el = tmp.querySelector('img') || tmp.querySelector('canvas')
      const draw = (src) => { ctx.drawImage(src, qrX, qrY, qrSize, qrSize); finishPoster(ctx, W, H, qrY, qrSize); document.body.removeChild(tmp); resolve() }
      if (!el) { document.body.removeChild(tmp); finishPoster(ctx, W, H, qrY, qrSize); resolve() }
      else if (el.tagName === 'IMG') { const img = new Image(); img.onload = () => draw(img); img.src = el.src }
      else draw(el)
    }, 300)
  })
}

export function TrainingSystem() {
  const isMobile = useMobile()
  const [current, setCurrent] = useState(0)
  const sliderRef = useRef(null)
  const [shareOpen, setShareOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [posterReady, setPosterReady] = useState(false)
  const canvasRef = useRef(null)

  /* Generate poster when modal opens */
  useEffect(() => {
    if (!shareOpen) { setPosterReady(false); return }
    setPosterReady(false)
    const timer = setTimeout(() => {
      if (canvasRef.current) {
        buildPoster(canvasRef.current, getShareUrl()).then(() => setPosterReady(true))
      }
    }, 80)
    return () => clearTimeout(timer)
  }, [shareOpen])

  const handleCopy = useCallback(() => {
    const url = getShareUrl()
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    }).catch(() => {
      const el = document.createElement('input'); el.value = url
      document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el)
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    })
  }, [])

  const handleDownload = useCallback(() => {
    if (!canvasRef.current) return
    const a = document.createElement('a')
    a.download = '朝曦家办-课程体系.png'
    a.href = canvasRef.current.toDataURL('image/png')
    a.click()
  }, [])

  const totalUnits = SERIES.reduce((s, c) => s + c.units.length, 0)

  function goTo(idx) {
    const clamped = Math.max(0, Math.min(SERIES.length - 1, idx))
    setCurrent(clamped)
    const container = sliderRef.current
    if (container) {
      container.scrollTo({ left: clamped * container.offsetWidth, behavior: 'smooth' })
    }
  }

  function handleScroll() {
    const container = sliderRef.current
    if (!container) return
    const idx = Math.round(container.scrollLeft / container.offsetWidth)
    setCurrent(idx)
  }

  return (
    <>
    <div style={{ padding: isMobile ? '16px 14px' : '32px 36px', maxWidth: 1100, margin: '0 auto' }}>

      {/* ── Hero ── */}
      <div style={{
        background: 'linear-gradient(135deg, #18181B 0%, #27272A 60%, #2D6A4F22 100%)',
        borderRadius: 16,
        padding: isMobile ? '24px 20px' : '48px 52px',
        marginBottom: isMobile ? 20 : 36,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -40, right: -40,
          width: 220, height: 220,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #2D6A4F33 0%, transparent 70%)',
        }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              background: 'linear-gradient(135deg, #2D6A4F, #40916C)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 800, color: '#fff',
              fontFamily: 'Noto Serif SC, serif',
            }}>曦</div>
            <div>
              <div style={{ fontSize: 11, color: '#71717A', letterSpacing: '.15em', textTransform: 'uppercase' }}>
                朝曦家办 · 系列课程体系
              </div>
            </div>
          </div>
          <h1 style={{
            fontSize: isMobile ? 22 : 32, fontWeight: 700, color: '#F4F4F5',
            margin: '0 0 10px',
            fontFamily: 'Noto Serif SC, serif',
            lineHeight: 1.35,
          }}>
            懂企业的成长<br />
            <span style={{ color: '#4ADE80' }}>更懂企业家的心事</span>
          </h1>
          <p style={{ fontSize: isMobile ? 13 : 14, color: '#A1A1AA', margin: '12px 0 0', lineHeight: 1.8, maxWidth: 560 }}>
            六大系列课程，覆盖企业从初创到传承的完整生命周期。不讲大道理，只聊真问题。
            每个主题均源自真实服务案例，陪伴企业家在关键节点找到答案。
          </p>
          <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginTop: isMobile ? 18 : 28, flexDirection: isMobile ? 'column' : 'row' }}>
            <div style={{ display: 'flex', gap: isMobile ? 20 : 28 }}>
              {[
                { num: '6', label: '核心系列' },
                { num: totalUnits, label: '课程单元' },
                { num: '3', label: '专业领域' },
              ].map(({ num, label }) => (
                <div key={label}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#4ADE80', lineHeight: 1 }}>{num}</div>
                  <div style={{ fontSize: 11, color: '#71717A', marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShareOpen(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: isMobile ? '11px 0' : '10px 20px',
                width: isMobile ? '100%' : 'auto',
                justifyContent: 'center',
                borderRadius: 10, cursor: 'pointer',
                background: 'linear-gradient(135deg, #2D6A4F, #40916C)',
                border: 'none', color: '#fff',
                fontSize: 13, fontWeight: 700,
                boxShadow: '0 4px 16px #2D6A4F55',
                transition: 'opacity .15s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '.88'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              生成海报 · 分享给客户
            </button>
          </div>
        </div>
      </div>

      {/* ── Slider Navigation Bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        {/* Dot indicators */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {SERIES.map((s, i) => (
            <button key={i} onClick={() => goTo(i)} style={{
              width: current === i ? 28 : 8,
              height: 8, borderRadius: 4, border: 'none', cursor: 'pointer',
              background: current === i ? SERIES[current].color : '#D4D4D8',
              transition: 'all .25s',
              padding: 0,
            }} />
          ))}
        </div>
        {/* Arrow buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => goTo(current - 1)} disabled={current === 0} style={{
            width: 36, height: 36, borderRadius: '50%', border: '1.5px solid #E4E4E7',
            background: current === 0 ? '#F4F4F5' : '#fff',
            cursor: current === 0 ? 'default' : 'pointer',
            fontSize: 16, color: current === 0 ? '#D4D4D8' : '#18181B',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>‹</button>
          <button onClick={() => goTo(current + 1)} disabled={current === SERIES.length - 1} style={{
            width: 36, height: 36, borderRadius: '50%', border: '1.5px solid #E4E4E7',
            background: current === SERIES.length - 1 ? '#F4F4F5' : '#fff',
            cursor: current === SERIES.length - 1 ? 'default' : 'pointer',
            fontSize: 16, color: current === SERIES.length - 1 ? '#D4D4D8' : '#18181B',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>›</button>
        </div>
      </div>

      {/* ── Slider Container ── */}
      <div
        ref={sliderRef}
        onScroll={handleScroll}
        style={{
          display: 'flex',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          scrollBehavior: 'smooth',
          gap: 0,
          borderRadius: 16,
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
        }}
      >
        {SERIES.map((s, si) => (
          <div key={s.id} style={{
            minWidth: '100%',
            scrollSnapAlign: 'start',
            background: '#fff',
            border: `2px solid ${s.border}`,
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: `0 4px 32px ${s.color}18`,
          }}>
            {/* Card Header */}
            <div style={{
              background: `linear-gradient(135deg, ${s.color}10 0%, ${s.bg} 100%)`,
              borderBottom: `1.5px solid ${s.border}`,
              padding: isMobile ? '16px 16px 14px' : '28px 32px 24px',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 800, letterSpacing: '.12em',
                      color: s.color, background: '#fff',
                      border: `1.5px solid ${s.border}`,
                      padding: '3px 12px', borderRadius: 20,
                    }}>{s.tag}</span>
                    <span style={{ fontSize: 12, color: '#A1A1AA' }}>{s.units.length} 个课程单元</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#71717A', marginBottom: 6 }}>{s.phase}</div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: '#18181B', margin: 0, lineHeight: 1.4 }}>
                    {s.title}
                  </h2>
                </div>
                <div style={{
                  fontSize: 11, color: '#A1A1AA',
                  background: '#fff', border: `1px solid ${s.border}`,
                  borderRadius: 8, padding: '4px 10px',
                  flexShrink: 0, marginLeft: 16, marginTop: 4,
                }}>
                  {si + 1} / {SERIES.length}
                </div>
              </div>
            </div>

            {/* Units List — scrollable */}
            <div style={{ overflowY: 'auto', maxHeight: isMobile ? 380 : 480 }}>
              {s.units.map((u, i) => (
                <div key={i} style={{
                  padding: isMobile ? '12px 14px' : '16px 32px',
                  borderBottom: i < s.units.length - 1 ? `1px solid ${s.border}66` : 'none',
                  background: i % 2 === 0 ? '#fff' : s.bg + '55',
                  display: 'flex', gap: 14, alignItems: 'flex-start',
                }}>
                  <span style={{
                    fontSize: 11, fontWeight: 800, color: '#fff',
                    background: s.color, borderRadius: 6,
                    padding: '2px 8px', flexShrink: 0, marginTop: 2,
                    minWidth: 28, textAlign: 'center',
                  }}>{String(i + 1).padStart(2, '0')}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#18181B', marginBottom: 6, lineHeight: 1.4 }}>
                      {u.name}
                    </div>
                    <div style={{ fontSize: 13, color: '#71717A', lineHeight: 1.8 }}>
                      <span style={{ color: '#A1A1AA', marginRight: 4 }}>核心痛点</span>{u.pain}
                    </div>
                    <div style={{ fontSize: 13, color: '#71717A', marginTop: 4, lineHeight: 1.8 }}>
                      <span style={{ color: '#A1A1AA', marginRight: 4 }}>核心客群</span>{u.client}
                    </div>
                    {u.case && (
                      <div style={{ fontSize: 13, marginTop: 6, lineHeight: 1.8 }}>
                        <span style={{ color: '#A1A1AA', marginRight: 4 }}>关联案例</span>
                        <span style={{
                          color: s.color,
                          background: s.bg,
                          border: `1px solid ${s.border}`,
                          borderRadius: 5,
                          padding: '2px 9px',
                          fontSize: 12.5,
                        }}>{u.case}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Card Footer */}
            <div style={{
              padding: isMobile ? '10px 14px' : '14px 32px',
              background: s.bg + '88',
              borderTop: `1px solid ${s.border}`,
              fontSize: 11, color: '#A1A1AA',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span>💡 课程可定制组合，支持单次或系列授课</span>
              <div style={{ display: 'flex', gap: 6 }}>
                {si > 0 && (
                  <button onClick={() => goTo(si - 1)} style={{
                    fontSize: 11, color: s.color, background: '#fff',
                    border: `1px solid ${s.border}`, borderRadius: 6,
                    padding: '4px 12px', cursor: 'pointer',
                  }}>← 上一系列</button>
                )}
                {si < SERIES.length - 1 && (
                  <button onClick={() => goTo(si + 1)} style={{
                    fontSize: 11, color: '#fff', background: s.color,
                    border: 'none', borderRadius: 6,
                    padding: '4px 12px', cursor: 'pointer', fontWeight: 600,
                  }}>下一系列 →</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

      {/* ════════ Share Modal ════════ */}
      {shareOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: '#00000066', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
          onClick={() => setShareOpen(false)}
        >
          <div
            style={{ background: 'var(--bg-card)', borderRadius: 20, padding: '22px 22px 18px', width: '100%', maxWidth: 360, boxShadow: '0 24px 64px #00000040' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>分享给客户</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>保存海报 → 微信发送 → 客户长按扫码进入</div>
              </div>
              <button
                onClick={() => setShareOpen(false)}
                style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'var(--border)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)', flexShrink: 0 }}
              >×</button>
            </div>

            {/* Canvas poster preview */}
            <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', marginBottom: 14, boxShadow: '0 4px 20px rgba(0,0,0,.13)', background: '#F2FBF5' }}>
              <canvas ref={canvasRef} style={{ width: '100%', display: 'block' }} />
              {!posterReady && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F7F4EF', gap: 8 }}>
                  <div style={{ width: 28, height: 28, border: '3px solid #D8F3DC', borderTopColor: '#2D6A4F', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>海报生成中…</span>
                  <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                </div>
              )}
            </div>

            {/* Download */}
            <button
              onClick={handleDownload}
              disabled={!posterReady}
              style={{
                width: '100%', padding: '12px', borderRadius: 11, border: 'none',
                background: posterReady ? 'linear-gradient(135deg, #2D6A4F, #40916C)' : '#D4D4D8',
                color: '#fff', fontSize: 14, fontWeight: 700,
                cursor: posterReady ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                marginBottom: 9, boxShadow: posterReady ? '0 4px 16px #2D6A4F44' : 'none',
                transition: 'all .2s',
              }}
            >
              ⬇ 下载海报图片
            </button>

            {/* Copy link */}
            <button
              onClick={handleCopy}
              style={{
                width: '100%', padding: '9px', borderRadius: 9,
                border: '1px solid var(--border)', background: 'var(--bg)',
                color: copied ? 'var(--accent)' : 'var(--text-3)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              }}
            >
              {copied ? '✓ 链接已复制' : '🔗 仅复制页面链接'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
