import { useState, useCallback, useRef, useEffect } from 'react'
import { toPng } from 'html-to-image'
import { useMobile } from '../MobileContext'

/* ── 静态二维码（指向客户门户 #portal） ── */
const PORTAL_URL = 'https://annayuqianyu-crypto.github.io/zhaoxi-training-platform/course-system.html'
const QR_DATA_URL = 'data:image/png;base64,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'

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


export function TrainingSystem() {
  const isMobile = useMobile()
  const [current, setCurrent] = useState(0)
  const sliderRef = useRef(null)
  const [shareOpen, setShareOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const posterSrcRef = useRef(null)
  const [posterImg, setPosterImg] = useState(null)
  const [posterErr, setPosterErr] = useState(false)

  /* 弹窗打开 → 将 HTML 海报转成 PNG（可长按保存） */
  useEffect(() => {
    if (!shareOpen) { setPosterImg(null); setPosterErr(false); return }
    setPosterImg(null); setPosterErr(false)
    const t = setTimeout(async () => {
      if (!posterSrcRef.current) return
      try {
        const dataUrl = await toPng(posterSrcRef.current, {
          pixelRatio: 2, cacheBust: true, backgroundColor: '#ffffff',
        })
        setPosterImg(dataUrl)
      } catch (e) {
        console.error('poster render failed', e)
        setPosterErr(true)
      }
    }, 80)
    return () => clearTimeout(t)
  }, [shareOpen])

  const handleDownload = useCallback(() => {
    if (!posterImg) return
    const a = document.createElement('a')
    a.href = posterImg
    a.download = '朝曦家办-课程体系海报.png'
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
  }, [posterImg])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(PORTAL_URL).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    }).catch(() => {
      const el = document.createElement('input'); el.value = PORTAL_URL
      document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el)
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    })
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
          style={{ position: 'fixed', inset: 0, background: '#000000AA', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16, overflowY: 'auto' }}
          onClick={() => setShareOpen(false)}
        >
          <div
            style={{ width: '100%', maxWidth: 340, position: 'relative' }}
            onClick={e => e.stopPropagation()}
          >
            {/* 关闭按钮 */}
            <button
              onClick={() => setShareOpen(false)}
              style={{
                position: 'absolute', top: -10, right: -10, zIndex: 2,
                width: 32, height: 32, borderRadius: '50%', border: 'none',
                background: '#fff', cursor: 'pointer', fontSize: 18,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#52525B', boxShadow: '0 2px 8px #00000040',
              }}
            >×</button>

            {/* ── 已生成的 PNG 海报（可长按保存）── */}
            {posterImg && (
              <img
                src={posterImg}
                alt="朝曦家办课程体系海报"
                style={{
                  width: '100%', display: 'block',
                  borderRadius: 16, boxShadow: '0 24px 64px #00000050',
                }}
              />
            )}

            {/* ── 海报源 DOM（PNG 生成前可见，生成后隐藏到屏幕外）── */}
            <div
              ref={posterSrcRef}
              style={{
                ...(posterImg
                  ? { position: 'absolute', left: -99999, top: 0, width: 340, pointerEvents: 'none' }
                  : { width: '100%' }),
                background: 'linear-gradient(180deg, #FFFFFF 0%, #F2FBF5 45%, #EAF6EF 100%)',
                borderRadius: 16, overflow: 'hidden',
                boxShadow: posterImg ? 'none' : '0 24px 64px #00000050',
                position: posterImg ? 'absolute' : 'relative',
              }}>
              {/* 顶部绿色装饰条 */}
              <div style={{ height: 6, background: '#2D6A4F' }} />

              {/* 顶部 Logo 区 */}
              <div style={{ padding: '20px 22px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: '#2D6A4F', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, fontWeight: 700, color: '#fff',
                  fontFamily: "'Noto Serif SC', serif", flexShrink: 0,
                }}>曦</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1A1A2E', fontFamily: "'Noto Serif SC', serif", lineHeight: 1.2 }}>朝曦家办</div>
                  <div style={{ fontSize: 11, color: '#71717A', marginTop: 2 }}>知识工坊 · 企业家专属培训</div>
                </div>
              </div>

              {/* 标题区 */}
              <div style={{ padding: '18px 22px 14px', textAlign: 'center' }}>
                <h2 style={{
                  fontSize: 22, fontWeight: 800, color: '#1A1A2E', margin: 0,
                  fontFamily: "'Noto Serif SC', serif", lineHeight: 1.3,
                }}>六大系列课程体系</h2>
                <p style={{ fontSize: 12, color: '#2D6A4F', margin: '6px 0 0', fontWeight: 600 }}>
                  懂企业的成长，更懂企业家的心事
                </p>
              </div>

              {/* 数据卡片 */}
              <div style={{ display: 'flex', gap: 8, padding: '0 22px 16px' }}>
                {[
                  { num: '6', label: '核心系列' },
                  { num: '44', label: '课程单元' },
                  { num: '3', label: '专业领域' },
                ].map(({ num, label }) => (
                  <div key={label} style={{
                    flex: 1, textAlign: 'center', padding: '10px 4px',
                    background: '#D8F3DC', borderRadius: 10,
                  }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#2D6A4F', lineHeight: 1 }}>{num}</div>
                    <div style={{ fontSize: 10, color: '#52525B', marginTop: 3 }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* 六大系列标签 */}
              <div style={{ padding: '0 22px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {[
                  { tag: 'S01', name: '股权架构顶层设计', color: '#B45309', bg: '#FFFBEB' },
                  { tag: 'S02', name: '跨境业务与税务', color: '#1D4ED8', bg: '#EFF6FF' },
                  { tag: 'S03', name: '股东减持合规', color: '#065F46', bg: '#ECFDF5' },
                  { tag: 'S04', name: '境外上市路径', color: '#6D28D9', bg: '#F5F3FF' },
                  { tag: 'S05', name: '家族信托治理', color: '#0E7490', bg: '#ECFEFF' },
                  { tag: 'S06', name: '企业家投资思维', color: '#B91C1C', bg: '#FFF1F2' },
                ].map(s => (
                  <div key={s.tag} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 8px', borderRadius: 7,
                    background: s.bg, border: `1px solid ${s.color}33`,
                  }}>
                    <span style={{
                      fontSize: 9, fontWeight: 800, color: '#fff',
                      background: s.color, padding: '2px 5px', borderRadius: 4,
                      flexShrink: 0, letterSpacing: '.02em',
                    }}>{s.tag}</span>
                    <span style={{ fontSize: 10.5, color: '#1A1A2E', fontWeight: 600, lineHeight: 1.2 }}>{s.name}</span>
                  </div>
                ))}
              </div>

              {/* 分隔线 */}
              <div style={{ margin: '0 22px', borderTop: '1px dashed #D4D4D8' }} />

              {/* 二维码区 */}
              <div style={{ padding: '16px 22px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: 11, color: '#52525B', marginBottom: 10, fontWeight: 600 }}>
                  扫码查看完整课程体系
                </div>
                <div style={{
                  padding: 8, background: '#fff', borderRadius: 10,
                  border: '1px solid #E4E4E7', boxShadow: '0 2px 8px #00000010',
                }}>
                  <img
                    src={QR_DATA_URL}
                    alt="朝曦家办课程体系二维码"
                    style={{ width: 140, height: 140, display: 'block' }}
                  />
                </div>
              </div>

              {/* 底部品牌条 */}
              <div style={{
                background: '#2D6A4F', padding: '12px 22px',
                color: '#fff', textAlign: 'center',
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.05em' }}>朝曦家办 · 知识工坊</div>
                <div style={{ fontSize: 10, opacity: .75, marginTop: 2 }}>
                  课程定制 · 量身组合 · 沙龙与系列培训
                </div>
              </div>
            </div>

            {/* 海报生成中的占位（仅 PNG 未生成且没出错时显示） */}
            {!posterImg && !posterErr && (
              <div style={{
                position: 'absolute', inset: 0,
                background: '#FFFFFFCC', borderRadius: 16,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 10,
                zIndex: 1,
              }}>
                <div style={{
                  width: 32, height: 32, border: '3px solid #D8F3DC',
                  borderTopColor: '#2D6A4F', borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }} />
                <span style={{ fontSize: 12, color: '#52525B' }}>海报生成中…</span>
                <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
              </div>
            )}

            {/* 操作提示 */}
            <div style={{
              marginTop: 12, padding: '10px 14px',
              background: '#FFFFFFEE', borderRadius: 10,
              fontSize: 11, color: '#52525B', textAlign: 'center', lineHeight: 1.7,
            }}>
              {isMobile
                ? '长按海报保存图片 → 微信发送给客户 → 客户扫码识别'
                : '点击下方按钮保存图片 → 微信发送给客户 → 客户扫码识别'}
            </div>

            {/* 操作按钮 */}
            <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
              {!isMobile && (
                <button
                  onClick={handleDownload}
                  disabled={!posterImg}
                  style={{
                    flex: 1, padding: '11px', borderRadius: 10, border: 'none',
                    background: posterImg ? 'linear-gradient(135deg, #2D6A4F, #40916C)' : '#D4D4D8',
                    color: '#fff', fontSize: 13, fontWeight: 700,
                    cursor: posterImg ? 'pointer' : 'default',
                    boxShadow: posterImg ? '0 4px 16px #2D6A4F44' : 'none',
                    transition: 'all .2s',
                  }}
                >
                  ⬇ 保存海报图片
                </button>
              )}
              <button
                onClick={handleCopy}
                style={{
                  flex: isMobile ? 1 : 'unset',
                  minWidth: isMobile ? undefined : 120,
                  padding: '11px', borderRadius: 10,
                  border: 'none', background: copied ? '#2D6A4F' : '#FFFFFF',
                  color: copied ? '#fff' : '#52525B',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  transition: 'all .15s',
                }}
              >
                {copied ? '链接已复制' : '复制链接'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
