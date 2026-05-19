/**
 * 培训 KPI / 分润规则引擎  (基于《培训KPI 20260128.xlsx》v3.0)
 *
 * 输入 4 个参数 → 返回分润比例（%）+ KPI 计入比例（%）
 *
 * 研发方若涉及多部门，由调用方在 dev% 基础上均分：
 *   每部门分润 = price × rule.dev% / 部门数
 */

/**
 * @param {{ channelSource, devType, speakerType, channelNew }} params
 * channelSource : '慧管家' | '自主渠道' | '常顾咨询'
 * devType       : 'BU' | '产品中心' | '联合'
 * speakerType   : 'BU主讲' | '产品中心主讲' | '架构师' | '外部特定' | '外部非特定'
 * channelNew    : '存量渠道' | '新开拓渠道'
 *
 * @returns {{ level, note, dev, speaker, sales, center, pool,
 *             kpiDev, kpiSpeaker, kpiSales, kpiCenter }} | null
 *   所有 % 字段含义：占合同单价的百分比
 *   kpi* 字段：该角色是否计入 KPI（100 = 全额计入, 0 = 不计入, 其他为部分）
 */
export function lookupSplitRule({ channelSource, devType, speakerType, channelNew }) {
  if (!channelSource || !speakerType) return null

  // ─── 慧管家渠道 ───────────────────────────────────────────
  if (channelSource === '慧管家') {
    return {
      level: 'C',
      note: '慧管家渠道，有分润但不计任何方 KPI',
      dev: 0, speaker: 30, sales: 0, center: 0, pool: 70,
      kpiDev: 0, kpiSpeaker: 0, kpiSales: 0, kpiCenter: 0,
    }
  }

  // ─── 常顾咨询 ─────────────────────────────────────────────
  if (channelSource === '常顾咨询') {
    return {
      level: '—',
      note: '常顾咨询（非慧管家），主讲与销售各 45%',
      dev: 0, speaker: 45, sales: 45, center: 0, pool: 10,
      kpiDev: 0, kpiSpeaker: 100, kpiSales: 100, kpiCenter: 0,
    }
  }

  // ─── 自主渠道 ─────────────────────────────────────────────

  // 外部讲师：特定
  if (speakerType === '外部特定') {
    return {
      level: '—',
      note: '外部特定讲师，销售方全额计 KPI',
      dev: 0, speaker: 0, sales: 100, center: 0, pool: 0,
      kpiDev: 0, kpiSpeaker: 0, kpiSales: 100, kpiCenter: 0,
    }
  }

  // 外部讲师：非特定
  if (speakerType === '外部非特定') {
    return {
      level: '—',
      note: '外部非特定讲师，无内部分润 / KPI',
      dev: 0, speaker: 0, sales: 0, center: 0, pool: 100,
      kpiDev: 0, kpiSpeaker: 0, kpiSales: 0, kpiCenter: 0,
    }
  }

  // 架构师主讲 → A 级（无论研发方 / 渠道新旧）
  if (speakerType === '架构师') {
    return {
      level: 'A',
      note: '架构师主讲，A 级最高激励，各方全额计 KPI',
      dev: 15, speaker: 30, sales: 30, center: 15, pool: 10,
      kpiDev: 100, kpiSpeaker: 100, kpiSales: 100, kpiCenter: 100,
    }
  }

  // 产品中心主讲（无论研发方是谁）
  if (speakerType === '产品中心主讲') {
    if (channelNew === '新开拓渠道') {
      return {
        level: 'A',
        note: '产品中心自研自讲，新渠道，A 级',
        dev: 0, speaker: 30, sales: 30, center: 0, pool: 40,
        kpiDev: 0, kpiSpeaker: 100, kpiSales: 100, kpiCenter: 100,
      }
    }
    return {
      level: 'A',
      note: '产品中心自研自讲，存量渠道，A 级',
      dev: 0, speaker: 30, sales: 30, center: 15, pool: 25,
      kpiDev: 0, kpiSpeaker: 100, kpiSales: 100, kpiCenter: 100,
    }
  }

  // BU 主讲 ─────────────────────────────────────────────────
  if (speakerType === 'BU主讲') {
    if (channelNew === '新开拓渠道') {
      return {
        level: 'B',
        note: 'BU 主讲，新渠道，B 级',
        dev: 0, speaker: 30, sales: 20, center: 15, pool: 35,
        kpiDev: 100, kpiSpeaker: 100, kpiSales: 100, kpiCenter: 100,
      }
    }
    return {
      level: 'C',
      note: 'BU 主讲，存量渠道，C 级',
      dev: 0, speaker: 30, sales: 0, center: 0, pool: 70,
      kpiDev: 0, kpiSpeaker: 100, kpiSales: 25, kpiCenter: 25,
    }
  }

  return null
}

/**
 * 根据规则 + 单场金额 + 研发参与方列表，计算各角色实际分润金额
 * 分润基数 = 单场合同金额 × 20%
 * devParticipants: { name: string }[]  — 研发参与方，可为部门或个人，均分 dev%
 */
export function calcSplitAmounts(rule, price, devParticipants) {
  if (!rule) return null
  const base         = price * 0.20            // 分润基数：合同金额的 20%
  const validDevs    = (devParticipants || []).filter(p => p?.name?.trim())
  const devTotal     = base * rule.dev / 100
  const devPerPerson = validDevs.length > 0 ? devTotal / validDevs.length : 0
  return {
    base,
    devTotal,
    devPerPerson,
    speaker: base * rule.speaker / 100,
    sales:   base * rule.sales   / 100,
    center:  base * rule.center  / 100,
    pool:    base * rule.pool    / 100,
  }
}

/**
 * 从所有合同 + 场次数据，聚合出每个人/部门的分润 & KPI 汇总
 */
export function buildKPISummary(contracts) {
  const map = {}

  // splitAmt: 分润金额（合同金额×20%基数）
  // kpiAmt:   KPI金额（合同全额基数）
  function add(name, role, splitAmt, kpiAmt) {
    if (!name || !name.trim()) return
    const key = `${name}__${role}`
    if (!map[key]) map[key] = { name, role, sessions: 0, splitTotal: 0, kpiSessions: 0, kpiTotal: 0 }
    map[key].sessions++
    if (splitAmt > 0) map[key].splitTotal += splitAmt
    if (kpiAmt > 0) {
      map[key].kpiSessions++
      map[key].kpiTotal += kpiAmt
    }
  }

  for (const c of contracts) {
    for (const it of c.items) {
      const rule = lookupSplitRule({
        channelSource: it.channelSource,
        devType:       it.devType,
        speakerType:   it.speakerType,
        channelNew:    it.channelNew,
      })
      if (!rule) continue

      const price    = it.price || 0
      const devParts = (it.devParticipants || []).filter(p => p?.name?.trim())
      const amts     = calcSplitAmounts(rule, price, devParts)

      // 研发（多参与方均分；KPI比例 = kpiDev ÷ 人数，KPI额 = 全额 × 均分比例）
      const kpiDevPctEach = devParts.length > 0 ? rule.kpiDev / devParts.length : 0
      if (devParts.length > 0) {
        devParts.forEach(dp => {
          add(dp.name, '研发', amts.devPerPerson, price * kpiDevPctEach / 100)
        })
      }
      // 主讲（KPI额 = 全额 × kpiSpeaker%）
      add(it.instructor || '（主讲未填）', '主讲', amts.speaker, price * rule.kpiSpeaker / 100)
      // 销售（KPI额 = 全额 × kpiSales%）
      add(c.sales || '（销售未填）', '销售', amts.sales, price * rule.kpiSales / 100)
      // 产品中心（KPI额 = 全额 × kpiCenter%）
      add('产品中心', '产品中心', amts.center, price * rule.kpiCenter / 100)
    }
  }

  return Object.values(map).sort((a, b) => b.kpiTotal - a.kpiTotal)
}
