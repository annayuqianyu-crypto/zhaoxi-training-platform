import { useState } from 'react'
import { CourseMatch, CONTEXT_KEY } from './CourseMatch'

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
    supplementText: '',
    aiResult: null,
    editCourseIds: [],
    editOutline: '',
    selectedInstructors: [],
  }
}

export function PortalCourseMatch({ user }) {
  // 同步初始化：跳过基础信息表单，直接进入课程匹配界面
  // 若已有上下文（如从历史记录「继续编辑」进入）则保留，否则创建空白上下文
  useState(() => {
    if (!localStorage.getItem(CONTEXT_KEY)) {
      localStorage.setItem(CONTEXT_KEY, JSON.stringify(makeEmptyCtx()))
    }
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
