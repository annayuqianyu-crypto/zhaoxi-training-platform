export const WORK_ORDERS = [
  { id:'ZX-2026-001', channel:'招商银行私行部', contact:'王经理', theme:'跨境税务规划专场', date:'2026-04-12', status:'合同签署', people:28, score:88 },
  { id:'ZX-2026-002', channel:'平安信托财富中心', contact:'李总', theme:'境内家族信托搭建', date:'2026-04-18', status:'讲师排期', people:15, score:null },
  { id:'ZX-2026-003', channel:'中信银行北京分行', contact:'张行长', theme:'全球化资产配置入门', date:'2026-05-03', status:'通关进行中', people:40, score:null },
  { id:'ZX-2026-004', channel:'国泰君安财富部', contact:'陈总监', theme:'移民后税务架构', date:'2026-05-10', status:'待处理', people:20, score:null },
  { id:'ZX-2026-005', channel:'兴业银行私行', contact:'刘经理', theme:'香港离岸架构实务', date:'2026-05-15', status:'课程匹配', people:12, score:null },
  { id:'ZX-2026-006', channel:'建设银行贵宾中心', contact:'周总', theme:'家族宪章与治理', date:'2026-04-28', status:'已归档', people:18, score:92 },
]

export const INSTRUCTORS = [
  {
    id: 'LHY', name: '刘怀宇', avatar: '刘',
    title: '朝曦合伙人', edu: '上海财经大学硕士',
    specialties: ['家族传承架构', '资本市场', '跨境事务', '税务规划'],
    city: '上海',
    series: ['课程一','课程二','课程四','课程五','课程六'],
    available: ['2026-05-14','2026-05-15','2026-05-21'], busy: ['2026-05-16','2026-05-17'],
  },
  {
    id: 'LHY2', name: '李红岩', avatar: '李',
    title: '朝曦南区负责人', edu: '南开大学金融硕士',
    specialties: ['资产架构', '资本市场', '跨境事务', '税务合规'],
    city: '深圳',
    series: ['课程二','课程三','课程四','课程五'],
    available: ['2026-05-15','2026-05-16','2026-05-20'], busy: [],
  },
  {
    id: 'XN', name: '熊能', avatar: '熊',
    title: '朝曦西区负责人', edu: '英国伯明翰大学经济学硕士',
    specialties: ['资产架构', '资本市场', '跨境事务', '税务合规'],
    city: '成都',
    series: ['课程二','课程三','课程四','课程五'],
    available: ['2026-05-12','2026-05-13','2026-05-20'], busy: ['2026-05-15'],
  },
  {
    id: 'HSH', name: '胡顺亥', avatar: '胡',
    title: '资深财富架构师', edu: '复旦大学法律硕士',
    specialties: ['财富架构与传承', '法律与税务合规', '资产评估', '跨境'],
    city: '上海',
    series: ['课程一','课程三','课程五'],
    available: ['2026-05-15','2026-05-16','2026-05-20','2026-05-22'], busy: ['2026-05-18','2026-05-19'],
  },
]

export const SKU_LIST = [
  { id:'Tax-2471', name:'CRS涉税风险复核', dept:'税务', cat1:'个人境外', cat2:'CRS合规', match:'exact', slides:42, words:12800, relatedCourseIds:['C5-02','C2-07','C5-01'], pageUrl:'' },
  { id:'Tax-2608', name:'FATCA申报实务', dept:'税务', cat1:'个人境外', cat2:'FATCA', match:'exact', slides:38, words:11200, relatedCourseIds:['C5-02','C5-03','C2-07'], pageUrl:'' },
  { id:'Tax-1023', name:'香港薪酬规划与税务优化', dept:'税务', cat1:'香港', cat2:'薪酬税务', match:'exact', slides:29, words:8400, relatedCourseIds:['C4-04','C5-06','C1-09'], pageUrl:'' },
  { id:'CM2343', name:'境内家族信托-FGT', dept:'资本市场', cat1:'信托类', cat2:'境内FGT', match:'exact', slides:55, words:18600, relatedCourseIds:['C5-04','C2-05'], pageUrl:'' },
  { id:'CM2346', name:'境外家族信托架构', dept:'资本市场', cat1:'信托类', cat2:'境外架构', match:'fuzzy', slides:48, words:15200, relatedCourseIds:['C5-04','C4-05','C2-05'], pageUrl:'' },
  { id:'CM-2359', name:'QFLP基金架构解析', dept:'资本市场', cat1:'基金类', cat2:'QFLP', match:'overview', slides:33, words:9800, relatedCourseIds:['C4-02','C4-03','C4-04'], pageUrl:'' },
  { id:'Law-001', name:'跨境继承法律框架', dept:'法律', cat1:'继承', cat2:'跨境', match:'exact', slides:41, words:13500, relatedCourseIds:['C5-05','C5-09','C5-04'], pageUrl:'' },
  { id:'Law-045', name:'香港遗嘱撰写规范', dept:'法律', cat1:'遗嘱', cat2:'香港', match:'exact', slides:26, words:7600, relatedCourseIds:['C5-05','C5-09'], pageUrl:'' },
  { id:'Law-088', name:'香港遗产承办实务', dept:'法律', cat1:'继承', cat2:'承办', match:null, slides:0, words:0, relatedCourseIds:['C5-05','C5-09'], pageUrl:'' },
  { id:'Tax-101', name:'个税申报实务（新规版）', dept:'税务', cat1:'个税', cat2:'申报', match:null, slides:0, words:0, relatedCourseIds:['C5-01','C5-11','C5-12'], pageUrl:'' },
  { id:'CM-201', name:'家族信托境外设立比较', dept:'资本市场', cat1:'信托类', cat2:'境外', match:null, slides:0, words:0, relatedCourseIds:['C5-04','C4-05'], pageUrl:'' },
  { id:'Tax-3301', name:'新加坡税务居民认定', dept:'税务', cat1:'东南亚', cat2:'新加坡', match:'exact', slides:31, words:9200, relatedCourseIds:['C4-04','C5-06','C5-03'], pageUrl:'' },
]

export const LEDGER_DATA = [
  { id:'ZX-2026-001', channel:'招商银行私行部', date:'2026-04-12', instructor:'胡顺亥', course:'跨境税务规划', contract:22000, received:22000, invoice:'已开', score:88, daiJia:'', daiJiaStatus:'', remark:'' },
  { id:'ZX-2026-002', channel:'平安信托财富中心', date:'2026-04-18', instructor:'刘怀宇', course:'境内家族信托', contract:15000, received:0, invoice:'未开', score:null, daiJia:'', daiJiaStatus:'', remark:'' },
  { id:'ZX-2026-003', channel:'中信银行北京分行', date:'2026-05-03', instructor:'胡顺亥', course:'全球化资产配置', contract:18000, received:9000, invoice:'部分', score:null, daiJia:'', daiJiaStatus:'', remark:'' },
  { id:'ZX-2026-004', channel:'国泰君安财富部', date:'2026-05-10', instructor:'李红岩', course:'移民后税务架构', contract:12000, received:0, invoice:'未开', score:null, daiJia:'对方提供2场私行客户转介绍资源', daiJiaStatus:'待兑现', remark:'合同金额低于标准，对价为转介绍' },
  { id:'ZX-2026-006', channel:'建设银行贵宾中心', date:'2026-04-28', instructor:'熊能', course:'家族宪章与治理', contract:15000, received:15000, invoice:'已开', score:92, daiJia:'', daiJiaStatus:'', remark:'' },
]

export const CHANNEL_DATA = [
  { name:'招商银行私行部', type:'银行', city:'上海', count:3, totalAmt:66000, avgScore:88, tags:['高价值渠道','高频培训'] },
  { name:'平安信托财富中心', type:'信托', city:'深圳', count:1, totalAmt:15000, avgScore:null, tags:[] },
  { name:'中信银行北京分行', type:'银行', city:'北京', count:2, totalAmt:36000, avgScore:85, tags:['跨境偏好'] },
  { name:'国泰君安财富部', type:'券商', city:'上海', count:1, totalAmt:12000, avgScore:null, tags:[] },
  { name:'兴业银行私行', type:'银行', city:'福州', count:1, totalAmt:15000, avgScore:null, tags:[] },
  { name:'建设银行贵宾中心', type:'银行', city:'成都', count:2, totalAmt:30000, avgScore:92, tags:['法律需求型'] },
]

export const STATUS_COLOR = {
  '待处理':    'badge-gray',
  '课程匹配':  'badge-blue',
  '渠道已确认':'badge-blue',
  '合同签署':  'badge-blue',
  '讲师排期':  'badge-amber',
  '通关进行中':'badge-amber',
  '已归档':    'badge-green',
}

export const COURSE_CATALOG = [
  {
    series: '课程一',
    seriesName: '企业初创与成长期——股权架构顶层设计与激励落地',
    courses: [
      { id:'C1-01', name:'企业全生命周期股权设计', subtitle:'别让股权架构的缺陷，成为企业发展的"绊脚石"', painpoint:'您是否担心因早期架构不够合理，为后续的融资、股权激励、上市合规埋下隐患？', audience:'早期创业者、新兴企业家、家族企业接班人' },
      { id:'C1-02', name:'创始人控制权保护', subtitle:'股权可以稀释，但控制权不能，如何守住企业的"方向盘"', painpoint:'随着一轮轮融资，您的股权在不断稀释，是否担心控制权旁落或既定战略无法推行？', audience:'正在或计划进行多轮融资的企业实控人/创始人' },
      { id:'C1-03', name:'员工股权激励设计', subtitle:'如何让核心人才"留下来一起干"', painpoint:'您是否面临骨干对股权价值认知不足导致激励不足？又是否担心陷入分配不公、员工躺平困境？', audience:'处于初创期、转型期或上市进程中的各类企业' },
      { id:'C1-04', name:'非货币性资产出资', subtitle:'技术入股，如何"入股"不"入坑"', painpoint:'您拥有技术或专利，却因出资过程复杂、估值和税务处理不当，而在股权架构中埋下隐患？', audience:'拥有技术/专利的创始人' },
      { id:'C1-05', name:'拟上市公司架构安排', subtitle:'上市前，给股权架构来一次"深度清理"', painpoint:'上市在即，却因历史融资等原因导致持股架构复杂，未来面临高昂的税务成本和管理难度？', audience:'计划在境内外上市的企业家' },
      { id:'C1-06', name:'国际税视野下的持股架构', subtitle:'美籍股东的股权安排"跨国考卷"', painpoint:'如果您或您的核心股东拥有美国身份，是否能够应对复杂的跨境税制？', audience:'企业创始人/大股东计划或已经持有美籍/绿卡' },
      { id:'C1-07', name:'红筹架构海外上市', subtitle:'架构怎么搭才能安全通行', painpoint:'对境外上市跃跃欲试，却因路径模糊、架构搭建不清而踌躇不前？', audience:'计划境外上市的创始人、有外籍股东的企业' },
      { id:'C1-08', name:'股权动态调整与退出设计', subtitle:'股权的进入和退出都从从容容', painpoint:'股东或激励对象婚变、离职等预期外变动是否让您的公司陷入股权纠纷，影响经营稳定？', audience:'关注股权结构健康度的企业家' },
      { id:'C1-09', name:'股权架构税务体检', subtitle:'减持、分红之前，给股权做一次"税务CT"', painpoint:'是否担心当前的股权架构会在未来减持、分红时带来高昂税负，甚至引发税务稽查？', audience:'所有企业家（尤其是关注税务成本的企业主）' },
    ]
  },
  {
    series: '课程二',
    seriesName: '业务扩张期——跨境业务架构与税务全景',
    courses: [
      { id:'C2-01', name:'跨境电商全链条税务合规', subtitle:'"关税汇"问题如何破局', painpoint:'您的跨境业务是否因模式复杂而面临"关、税、汇"的风险与利润侵蚀？', audience:'跨境电商卖家、制造业出海企业主' },
      { id:'C2-02', name:'境外投资架构设计', subtitle:'境外税海沉浮，何以安家', painpoint:'海外投资布局是否因架构不合理，导致退出税负高、资金回流难、运营效率低下？', audience:'计划进行海外投资/并购的企业家、高净值投资人' },
      { id:'C2-03', name:'转让定价与BEPS合规', subtitle:'关联交易定价，如何让各国税局都"点头"', painpoint:'集团内关联交易定价是否让您担忧各国税务机关的调查调整与双重征税风险？', audience:'在海外有关联公司的企业主、跨国企业高管' },
      { id:'C2-04', name:'中美贸易战税务应对', subtitle:'贸易战下，如何守住利润的护城河', painpoint:'中美关税增加是否直接冲击您的利润，迫使您思考供应链重塑及新的税务风险？', audience:'受中美贸易战影响的进出口企业' },
      { id:'C2-05', name:'境内外信托架构与风险隔离', subtitle:'给家业建一道"防火墙"，让经营风险"过不来"', painpoint:'是否担心企业经营的债务、婚姻等风险会传导至您的个人与家庭财富？', audience:'关注债务/婚姻风险隔离的企业家、企业家太太' },
      { id:'C2-06', name:'跨境并购税务合规', subtitle:'跨境并购，盘算清楚税再购', painpoint:'筹划跨境并购时，是否担忧交易结构复杂隐含巨额税务负担或税务效率低下？', audience:'进行海外收购分拆的企业家' },
      { id:'C2-07', name:'CRS与受控外国企业规则', subtitle:'离岸公司架构是否经得起"透明时代"的考验', painpoint:'您在低税地设立的离岸公司，是否面临被认定"受控外国企业"而被动征税，且无法满足经济实质要求？', audience:'美加澳英等高税负国际人士、在免税地设有公司的企业主' },
    ]
  },
  {
    series: '课程三',
    seriesName: '资本成熟期——股东减持与税务合规',
    courses: [
      { id:'C3-01', name:'有限合伙平台减持', subtitle:'合伙架构下，减持的规则理解与税务考量', painpoint:'通过合伙平台持股，是否因减持税务处理复杂、地方政策不稳定而面临追税风险和高额税负？', audience:'通过合伙平台持股的上市公司股东' },
      { id:'C3-02', name:'有限公司平台减持', subtitle:'公司制持股的减持路径与资金效率', painpoint:'通过公司平台持股，是否在减持时面临"双重征税"状况？', audience:'通过公司平台持股的上市公司股东' },
      { id:'C3-03', name:'减持税务合规与稽查风险预防', subtitle:'减持后的安全落地法则', painpoint:'减持完成后，是否担忧税务机关对收入确认、成本核定、优惠适用性进行稽查问询，导致补税、罚款？', audience:'所有即将或已完成减持的上市公司股东' },
      { id:'C3-04', name:'上市公司减持及再投资', subtitle:'减持的钱拿到手，下一步怎么投更有效', painpoint:'对各类减持政策差异不了解，减持后资金闲置缺乏规划？', audience:'A股上市公司实控人、大股东、董秘、财务总监' },
      { id:'C3-05', name:'减持方式选择与实操', subtitle:'减持"工具箱"里，哪把钥匙开哪把锁', painpoint:'面对大宗交易、协议转让等多种减持工具，是否因不了解其适用场景和操作细节而难以选择最优路径？', audience:'对减持效率和市场影响有要求的股东' },
      { id:'C3-06', name:'外籍股东跨境减持', subtitle:'跨境税制理解及遵从', painpoint:'作为外籍股东或通过境外平台持股，是否在减持时面临复杂的外汇、税务与法律问题？', audience:'身为外籍人士的上市公司股东、有红筹/VIE等架构的股东' },
    ]
  },
  {
    series: '课程四',
    seriesName: '财富资本化——境外上市与跨境资本路径创新',
    courses: [
      { id:'C4-01', name:'境外上市架构设计', subtitle:'境外上市第一问：我的架构搭对了吗', painpoint:'对境外上市的顶层架构设计、外翻及员工激励平台选择较为模糊，难以抉择？', audience:'计划赴港/赴美上市的企业家' },
      { id:'C4-02', name:'境内外投融资架构', subtitle:'跨境投资的"导航地图"', painpoint:'投资架构僵化，是否让您无法灵活应对不同投资场景，也难以有效利用税收优惠？', audience:'计划进行跨境投资的企业家、高净值人士' },
      { id:'C4-03', name:'中美投融资架构', subtitle:'中美之间如何架起一座投融畅通之桥', painpoint:'中美两地的监管与税制差异，是否让您的投融资活动束手束脚、架构效率低下？', audience:'进行跨境融资的创业者、跨境投资者' },
      { id:'C4-04', name:'新加坡/香港地区投资架构', subtitle:'东南亚投资的"最佳拍档"', painpoint:'对新/港的法律税务环境不熟悉，是否让您的投资架构搭建盲目且风险高？', audience:'计划投资东南亚的企业家、高净值人士' },
      { id:'C4-05', name:'新加坡/香港家族办公室', subtitle:'给财富安个"新家"：新港家办的设立与运营', painpoint:'家族财富缺乏专业化管理，是否导致资产分散、效率低下？', audience:'超高净值家族、大额资产变现的上市公司股东' },
      { id:'C4-06', name:'多司法辖区税务合规', subtitle:'全球资产多国税务申报的合规实践', painpoint:'资产遍布多国、架构复杂，是否让您感到管理混乱、成本不清晰、整体效能低下？', audience:'资产遍布多国的超高净值家族、跨国企业主' },
    ]
  },
  {
    series: '课程五',
    seriesName: '家族永续期——跨境/境内家族信托、税务与治理',
    courses: [
      { id:'C5-01', name:'涉税数据，内外兼修', subtitle:'国内外税收监管新趋势下的"绕坑避雷"', painpoint:'在税务机关以数治税、从严治税的监管环境下，您是否对企业当前的税务处理方式感到风险极高？', audience:'希望提高企业税务合规质量的企业家' },
      { id:'C5-02', name:'穿越CRS"暴风眼"', subtitle:'全球资产税务合规的"系统工程"与"长期主义"', painpoint:'您在海外拥有金融账户，是否对全球收入申报义务不了解或担忧CRS信息交换后的补税与罚款风险？', audience:'在海外拥有金融账户的所有高净值客户' },
      { id:'C5-03', name:'中加、中美财富人士规划', subtitle:'如何面对跨洋身份的双重考验', painpoint:'家庭成员拥有美加身份，财产规划涉及多国法律，是否让您深感制度复杂、合规风险高？', audience:'美籍公民、绿卡持有者；加拿大税务居民' },
      { id:'C5-04', name:'跨境家族信托', subtitle:'给财富找个"靠谱管家"：信托怎么设、装什么、传给谁', painpoint:'意识到家族财富安排非常重要，但不知如何设立家族信托、注入资产并发挥其真实隔离作用？', audience:'关注资产保护与世代传承的所有企业家、企业家太太' },
      { id:'C5-05', name:'家庭内部风险管理', subtitle:'婚姻、债务、继承：高净值家庭的"三道防线"', painpoint:'是否担忧婚变、债务、继承纠纷等家庭内部风险导致财富严重缩水或家族内斗？', audience:'女性企业家、全职太太、高净值家庭子女' },
      { id:'C5-06', name:'身份规划税务考量', subtitle:'一张新身份，对"税"的影响有多大', painpoint:'单一身份是否在全球化生活中带来不便与额外税负？', audience:'家庭成员涉多国身份的企业家、企业家太太' },
      { id:'C5-07', name:'弃籍税规划', subtitle:'告别美国身份之前，那些"必须做的事"', painpoint:'计划放弃美国等高税籍身份，是否被复杂的"弃籍税"计算与规划空间所困扰？', audience:'计划放弃美籍/绿卡等身份的高净值人士' },
      { id:'C5-08', name:'企业经营财税合规', subtitle:'不让税务盲区成为隐性管理成本', painpoint:'企业日常经营中隐藏的众多财税风险点，您是否感到不自知且担忧？', audience:'所有企业主' },
      { id:'C5-09', name:'国际税务争议与家族治理', subtitle:'跨境经营中，如何从容面对不同法域的税务关切', painpoint:'是否面临多国税务局的调查争议无力应对，或因家族关系复杂缺乏有效治理机制？', audience:'面临税务稽查的家族、需要建立家族宪章的大家族' },
      { id:'C5-10', name:'二代接班技能提升', subtitle:'从"富二代"到"创二代"：接班路上的"必修课"', painpoint:'二代是否因缺乏系统训练而对复杂家业感到迷茫，两代人之间又因理念、沟通冲突导致接班不顺？', audience:'面对交班压力的二代；希望培养二代接班能力的一代' },
      { id:'C5-11', name:'高净值人士涉税误区', subtitle:'那些值得我们一起重新理解的税务认知', painpoint:'是否在企业经营、投融资、财富管理中存在涉税认知误区，从而带来潜在的税务压力？', audience:'所有企业主及高净值人群' },
      { id:'C5-12', name:'智慧税务，有法可依', subtitle:'2026增值税法的"仪式感"及其影响', painpoint:'增值税立法以及配套政策对公司的影响有哪些？如何应对？', audience:'所有企业主' },
    ]
  },
  {
    series: '课程六',
    seriesName: '企业家投资思维——从产业经营到资产配置的范式转换',
    courses: [
      { id:'C6-01', name:'认知重塑：企业家为何需要投资思维', subtitle:'', painpoint:'是否过度依赖主业回报，忽视资产配置，在经济周期波动中面临财富缩水风险？', audience:'主业稳定但缺乏投资系统认知的企业家' },
      { id:'C6-02', name:'理论学习：资产价格的运行逻辑与风格周期', subtitle:'', painpoint:'是否在投资中忽视市场周期与风格轮动，导致"努力却亏钱"的困境？', audience:'有投资经验但收益波动较大的企业家' },
      { id:'C6-03', name:'框架搭建：家族财富的"进攻—防守"配置体系', subtitle:'', painpoint:'您的资产是否过度集中于股权和企业所有权，缺乏流动性缓冲和多元化配置，风险暴露过高？', audience:'资产规模较大但配置单一的企业家' },
      { id:'C6-04', name:'心法修炼：投资行为偏差与预防', subtitle:'', painpoint:'如何规避因"过度自信"、"追涨杀跌"等行为偏差导致辛苦经营攒钱、盲目跟风投资亏钱？', audience:'希望建立投资系统与投资理念传承的企业家' },
    ]
  },
]
