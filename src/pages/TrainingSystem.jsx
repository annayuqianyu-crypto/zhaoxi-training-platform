import { useState } from 'react'

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
      { name: '企业全生命周期股权设计', pain: '早期架构不合理，为融资、上市埋下隐患', client: '早期创业者、新兴企业家、家族接班人' },
      { name: '创始人控制权保护', pain: '多轮融资股权稀释，控制权旁落风险', client: '正在或计划进行多轮融资的企业实控人' },
      { name: '员工股权激励设计', pain: '骨干认知不足、激励失效、分配不公', client: '初创期、转型期或上市进程中的企业' },
      { name: '非货币性资产出资', pain: '技术入股过程复杂，估值与税务埋下隐患', client: '拥有技术/专利的创始人' },
      { name: '拟上市公司架构安排', pain: '历史融资架构复杂，面临高税务成本', client: '计划在境内外上市的企业家' },
      { name: '国际税视野下的持股架构', pain: '美籍股东跨境税制应对复杂', client: '持有美籍/绿卡的创始人或大股东' },
      { name: '红筹架构海外上市', pain: '境外上市路径模糊，架构搭建不清晰', client: '计划境外上市的创始人' },
      { name: '股权动态调整与退出设计', pain: '婚变、离职等变动引发股权纠纷', client: '关注股权健康度的企业家' },
      { name: '股权架构税务体检', pain: '当前架构在减持、分红时税负过高', client: '所有企业家（尤其关注税务成本者）' },
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
      { name: '跨境电商全链条税务合规', pain: '跨境业务"关税汇"风险与利润侵蚀', client: '跨境电商卖家、制造业出海企业主' },
      { name: '境外投资架构设计', pain: '架构不合理致退出税负高、资金回流难', client: '计划海外投资/并购的企业家' },
      { name: '转让定价与BEPS合规', pain: '关联交易定价面临各国税局调查与双重征税', client: '在海外有关联公司的企业主' },
      { name: '中美贸易战税务应对', pain: '关税增加冲击利润，供应链重塑迫在眉睫', client: '受中美贸易战影响的进出口企业' },
      { name: '境内外信托架构与风险隔离', pain: '企业债务、婚姻风险传导至个人财富', client: '关注债务/婚姻风险隔离的企业家' },
      { name: '跨境并购税务合规', pain: '交易结构复杂，隐含巨额税务负担', client: '进行海外收购分拆的企业家' },
      { name: 'CRS与受控外国企业规则', pain: '离岸架构在"透明时代"面临穿透风险', client: '在免税地设有公司的企业主' },
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
      { name: '有限合伙平台减持', pain: '合伙架构减持税务复杂，追税风险高', client: '通过合伙平台持股的上市公司股东' },
      { name: '有限公司平台减持', pain: '公司制持股面临"双重征税"困境', client: '通过公司平台持股的上市公司股东' },
      { name: '减持税务合规与稽查风险预防', pain: '减持后担忧税务机关稽查补税罚款', client: '即将或已完成减持的上市公司股东' },
      { name: '上市公司减持及再投资', pain: '减持后资金闲置，缺乏再投资规划', client: 'A股上市公司实控人、大股东、董秘' },
      { name: '减持方式选择与实操', pain: '多种减持工具面前难以选择最优路径', client: '对减持效率和市场影响有要求的股东' },
      { name: '外籍股东跨境减持', pain: '外籍股东减持面临复杂外汇、税务与法律问题', client: '外籍股东或通过境外平台持股者' },
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
      { name: '境外上市架构设计', pain: '境外上市顶层架构模糊，员工激励平台难选择', client: '计划赴港/赴美上市的企业家' },
      { name: '境内外投融资架构', pain: '架构僵化，无法灵活应对多投资场景', client: '计划进行跨境投资的企业家' },
      { name: '中美投融资架构', pain: '中美监管与税制差异让投融资束手束脚', client: '进行跨境融资的创业者、投资者' },
      { name: '新加坡/香港地区投资架构', pain: '对新港法律税务环境不熟，架构搭建盲目', client: '计划投资东南亚的企业家' },
      { name: '新加坡/香港地区家族办公室', pain: '家族财富缺乏专业化管理，资产分散低效', client: '超高净值家族、大额资产变现的股东' },
      { name: '多司法辖区税务合规', pain: '资产遍布多国，管理混乱、成本不清晰', client: '资产遍布多国的超高净值家族' },
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
      { name: '涉税数据，内外兼修', pain: '金税四期严监管下，税务处理风险极高', client: '希望提高税务合规质量的企业家' },
      { name: '穿越CRS"暴风眼"', pain: '海外账户面临CRS信息交换后的补税风险', client: '在海外拥有金融账户的高净值客户' },
      { name: '中加、中美财富人士规划', pain: '家庭成员持多国身份，合规风险高', client: '美籍公民、绿卡持有者、加拿大税务居民' },
      { name: '跨境家族信托', pain: '不知如何设立信托、注入资产并发挥隔离作用', client: '关注资产保护与世代传承的企业家' },
      { name: '家庭内部风险管理', pain: '婚变、债务、继承纠纷导致财富严重缩水', client: '女性企业家、全职太太、高净值家庭子女' },
      { name: '身份规划税务考量', pain: '单一身份在全球化生活中带来不便与额外税负', client: '家庭成员涉多国身份的企业家' },
      { name: '弃籍税规划', pain: '放弃美国身份前，弃籍税计算与规划复杂', client: '计划放弃美籍/绿卡的高净值人士' },
      { name: '企业经营财税合规', pain: '日常经营中隐藏的财税风险点不自知', client: '所有企业主' },
      { name: '国际税务争议与家族治理', pain: '多国税局调查无力应对，家族治理机制缺失', client: '面临税务稽查的家族、大家族' },
      { name: '二代接班技能提升', pain: '二代缺乏系统训练，两代人理念冲突', client: '面对交班压力的二代及希望培养二代的一代' },
      { name: '高净值人士涉税误区', pain: '经营与财富管理中存在涉税认知误区', client: '所有企业主及高净值人群' },
      { name: '智慧税务，有法可依', pain: '2026增值税法对公司的影响与应对', client: '所有企业主' },
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
      { name: '认知重塑：企业家为何需要投资思维', pain: '过度依赖主业，忽视配置，周期波动下财富缩水', client: '主业稳定但缺乏投资系统认知的企业家' },
      { name: '理论学习：资产价格的运行逻辑与风格周期', pain: '忽视市场周期与风格轮动，努力却亏钱', client: '有投资经验但回报不理想的企业家' },
      { name: '框架搭建：家族财富"进攻—防守"配置体系', pain: '资产过度集中于股权，流动性不足，风险暴露高', client: '资产规模较大但配置单一的企业家' },
      { name: '心法修炼：投资行为偏差与预防', pain: '过度自信、追涨杀跌等行为偏差导致盲目亏损', client: '希望建立投资系统与理念传承的企业家' },
    ],
  },
]

export function TrainingSystem() {
  const [expanded, setExpanded] = useState(null)

  const toggle = (id) => setExpanded(prev => prev === id ? null : id)

  const totalUnits = SERIES.reduce((s, c) => s + c.units.length, 0)

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1100, margin: '0 auto' }}>

      {/* ── Hero ── */}
      <div style={{
        background: 'linear-gradient(135deg, #18181B 0%, #27272A 60%, #2D6A4F22 100%)',
        borderRadius: 16,
        padding: '48px 52px',
        marginBottom: 36,
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
            fontSize: 32, fontWeight: 700, color: '#F4F4F5',
            margin: '0 0 10px',
            fontFamily: 'Noto Serif SC, serif',
            lineHeight: 1.35,
          }}>
            懂企业的成长<br />
            <span style={{ color: '#4ADE80' }}>更懂企业家的心事</span>
          </h1>
          <p style={{ fontSize: 14, color: '#A1A1AA', margin: '16px 0 0', lineHeight: 1.8, maxWidth: 560 }}>
            六大系列课程，覆盖企业从初创到传承的完整生命周期。不讲大道理，只聊真问题。
            每个主题均源自真实服务案例，陪伴企业家在关键节点找到答案。
          </p>
          <div style={{ display: 'flex', gap: 28, marginTop: 28 }}>
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
        </div>
      </div>

      {/* ── Series Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        {SERIES.map((s) => {
          const isOpen = expanded === s.id
          return (
            <div key={s.id} style={{
              background: '#fff',
              border: `1.5px solid ${isOpen ? s.color : '#E4E4E7'}`,
              borderRadius: 14,
              overflow: 'hidden',
              transition: 'border-color .2s, box-shadow .2s',
              boxShadow: isOpen ? `0 4px 24px ${s.color}22` : '0 1px 4px #0000000a',
            }}>
              {/* Card Header */}
              <div
                onClick={() => toggle(s.id)}
                style={{
                  padding: '22px 24px',
                  cursor: 'pointer',
                  background: isOpen ? s.bg : '#fff',
                  transition: 'background .2s',
                  userSelect: 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: '.1em',
                        color: s.color, background: s.bg,
                        border: `1px solid ${s.border}`,
                        padding: '2px 8px', borderRadius: 20,
                      }}>{s.tag}</span>
                      <span style={{ fontSize: 11, color: '#A1A1AA' }}>
                        {s.units.length} 个单元
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: '#52525B', marginBottom: 4 }}>{s.phase}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#18181B', lineHeight: 1.4 }}>
                      {s.title}
                    </div>
                  </div>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: isOpen ? s.color : '#F4F4F5',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, marginLeft: 12,
                    transition: 'background .2s',
                  }}>
                    <span style={{
                      fontSize: 14, color: isOpen ? '#fff' : '#71717A',
                      transform: isOpen ? 'rotate(180deg)' : 'none',
                      display: 'inline-block', transition: 'transform .2s',
                    }}>▾</span>
                  </div>
                </div>
              </div>

              {/* Units List */}
              {isOpen && (
                <div style={{ borderTop: `1px solid ${s.border}` }}>
                  {s.units.map((u, i) => (
                    <div key={i} style={{
                      padding: '14px 24px',
                      borderBottom: i < s.units.length - 1 ? `1px solid ${s.border}55` : 'none',
                      background: i % 2 === 0 ? '#fff' : s.bg + '66',
                    }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, color: s.color,
                          background: s.bg, border: `1px solid ${s.border}`,
                          borderRadius: 4, padding: '1px 6px',
                          flexShrink: 0, marginTop: 1,
                        }}>{String(i + 1).padStart(2, '0')}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#18181B', marginBottom: 4 }}>
                            {u.name}
                          </div>
                          <div style={{ fontSize: 11, color: '#71717A', lineHeight: 1.6 }}>
                            <span style={{ color: '#A1A1AA' }}>核心痛点：</span>{u.pain}
                          </div>
                          <div style={{ fontSize: 11, color: '#71717A', marginTop: 2, lineHeight: 1.6 }}>
                            <span style={{ color: '#A1A1AA' }}>核心客群：</span>{u.client}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Footer Note ── */}
      <div style={{
        marginTop: 28, padding: '16px 24px',
        background: '#F7F4EF', borderRadius: 10,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 16 }}>💡</span>
        <p style={{ fontSize: 12, color: '#71717A', margin: 0, lineHeight: 1.7 }}>
          以上课程均可根据客户需求定制组合，单次或系列授课灵活安排。
          如需了解具体课程大纲、讲师背景或安排试听，欢迎联系朝曦课程顾问。
        </p>
      </div>
    </div>
  )
}
