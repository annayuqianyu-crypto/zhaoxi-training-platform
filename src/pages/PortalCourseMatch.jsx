import { useState } from 'react'
import { CourseMatch, CONTEXT_KEY } from './CourseMatch'

const DEFAULT_SUPPLEMENT = `请描述本次培训需求（填写后点击「AI 分析」自动匹配课程）：

渠道 / 机构背景：（如：某银行私行部、某券商财富中心……）
参训人员：（如：理财经理、客户经理、销售团队……）
培训目的：（如：提升产品知识、辅助客户开发、应对客户问题……）
客户群体特点：（如：高净值、企业主、新移民……）
希望覆盖的话题：（如：境外架构、税务规划、资产传承……）
其他备注：（场次安排、时长要求、预算范围等）`

function makeEmptyCtx() {
  const ts = Date.now()
  const orderId = `PORTAL-${ts}`
  return {
    orderId,
    order: {
      id: orderId,
      company: '（直接咨询）',
      contact: '',
      channel: '不确定',
      status: '课程匹配',
      source: 'portal',
      createdAt: new Date().toISOString(),
    },
    editForm: {
      channel: '不确定',
      contact: '',
      company: '',
      audience: '不确定',
      scale: '',
      duration: '待定',
      budget: '',
      background: '',
      goals: '',
      notes: '',
    },
    supplementText: DEFAULT_SUPPLEMENT,
    aiResult: null,
    editCourseIds: [],
    editOutline: '',
    selectedInstructors: [],
  }
}

export function PortalCourseMatch({ user }) {
  // 同步初始化：每次进入门户都创建新的空白上下文
  // （历史会话可通过「历史记录」Tab 找回；从历史记录「继续编辑」进入时
  //  调用方会提前写入 CONTEXT_KEY，此时 source 不是 'portal-fresh'，跳过重置）
  useState(() => {
    const existing = localStorage.getItem(CONTEXT_KEY)
    if (existing) {
      try {
        const parsed = JSON.parse(existing)
        // 如果是从历史记录恢复进来的（source !== 'portal'），保留上下文
        if (parsed?.order?.source !== 'portal') return true
      } catch { /* ignore */ }
    }
    // 门户新建：始终重置为干净的新上下文
    localStorage.setItem(CONTEXT_KEY, JSON.stringify(makeEmptyCtx()))
    return true
  })

  return (
    <CourseMatch
      user={user}
      navigate={() => {}}
      portalMode
    />
  )
}
