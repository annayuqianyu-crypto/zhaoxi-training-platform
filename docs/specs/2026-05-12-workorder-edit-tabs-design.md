# 前期沟通工单编辑弹窗 Tab 化设计文档

**日期：** 2026-05-12  
**状态：** 已批准，待实现  
**涉及文件：** WorkOrders.jsx · mock.js · public/instructor.html

---

## 背景

当工单进入「前期沟通」阶段，产品中心需要完成两项核心工作：
1. **需求分析**：补充会议纪要，调用 AI 匹配课程
2. **发送方案**：确定讲师人选，生成渠道确认链接和讲师参考方案链接

现有编辑弹窗是一个长页面，不区分角色和流程阶段。本次将其改造为三 Tab 结构，与实际工作流对齐。

---

## 整体结构

编辑弹窗顶部新增 Tab 导航：

```
[ 需求分析 ]  [ 课程方案 ]  [ 发送方案 ]
```

---

## Tab 1：需求分析

### 1.1 原始问卷信息（只读）

折叠展示工单原始数据：渠道、联系人、参与人员类型、职级、人数、时长、期望日期、痛点选项、特殊说明。默认折叠，点击展开。

### 1.2 补充信息 / 会议纪要

- **文字输入**：textarea，placeholder 为「粘贴会议纪要或补充说明…」
- **文件上传**：支持 `.docx` 格式，使用 `mammoth` 库提取纯文本后填入 textarea
- 内容存入 `zx_order_overrides[orderId].supplementText`，持久化

### 1.3 AI 需求分析

**触发：** 点击「🤖 AI 分析需求 · 匹配 Top 3 课程」按钮

**API Key 管理：** 首次点击时弹出输入框，填入 Anthropic API Key 后存入 `localStorage['zx_anthropic_key']`，后续自动复用。沿用 GitHub Token 同款 UI 模式。

**API 调用：**
```
POST https://api.anthropic.com/v1/messages
Headers:
  x-api-key: {key}
  anthropic-version: 2023-06-01
  anthropic-dangerous-direct-browser-access: true
  content-type: application/json
Model: claude-3-5-haiku-20241022
Max tokens: 1500
```

**Prompt 结构：**
```
你是朝曦家族办公室的专业培训顾问。根据以下渠道培训需求，从课程库中匹配最合适的Top 3课程，并给出针对性建议。

## 渠道需求
渠道：{channel} | 参与人员：{audience} | 职级：{jobLevel}
人数：{people}人 | 时长：{duration} | 日期：{date}
痛点：{painpoints}
补充信息：{supplementText}

## 课程库（44门 · 6大系列）
{COURSE_CATALOG 格式化为：课程ID · 课程名 · 痛点 · 受众}

严格返回JSON，不含其他文字：
{
  "top3": [
    {"id":"C1-01","name":"课程名","seriesName":"所属系列全名","score":92,"reason":"2-3句匹配理由"}
  ],
  "suggestions":"针对该渠道的整体改进建议，100字以内"
}
```

**结果持久化：** AI 结果存入 `zx_order_overrides[orderId].aiResult`，下次打开不重跑。

### 1.4 AI 推荐结果展示

每条推荐显示为卡片：

```
┌─ 推荐 #1 · 匹配度 92% ──────────────────┐
│ 课程二：跨境业务架构与税务全景            │
│ 课程单元：CRS与受控外国企业规则           │
│                                          │
│ 课纲目录：                               │
│   ▌ CRS与受控外国企业规则 — 全球税务…    │
│   解决核心痛点：…                        │
│                                          │
│ 参考SKU：Tax-2471（精确匹配）            │
│          Tax-2608（精确匹配）            │
│                                          │
│ AI 推荐理由：该渠道痛点高度聚焦 CRS 合规… │
└──────────────────────────────────────────┘
```

底部显示「💡 改进建议：…」

---

## Tab 2：课程方案

现有编辑弹窗内容原样搬入，调整如下：

- 课程选择器（按系列分组，勾选触发课纲自动重建 + SKU 匹配刷新）
- 推荐参考 SKU 列表（auto-generated，匹配等级标签）
- 课纲编辑器（可手动修改）
- 「💾 保存草稿」按钮（移除原来的确认链接按钮，那个移到 Tab 3）

---

## Tab 3：发送方案

### 3.1 讲师匹配

四位讲师多选卡片，产品中心选择后存入 overrides：

| ID | 姓名 | 职位 | 学历 | 专长方向 |
|----|------|------|------|----------|
| LHY | 刘怀宇 | 朝曦合伙人 | 上海财经大学硕士 | 家族传承架构、资本市场、跨境、税务规划 |
| LHY2 | 李红岩 | 朝曦南区负责人 | 南开大学金融硕士 | 资产架构、资本市场、跨境、税务合规 |
| XN | 熊能 | 朝曦西区负责人 | 英国伯明翰大学经济学硕士 | 资产架构、资本市场、跨境、税务合规 |
| HSH | 胡顺亥 | 资深财富架构师 | 复旦大学法律硕士 | 财富架构与传承、法律与税务合规、资产评估、跨境 |

选中态：绿色边框 + 勾选角标。选择结果存 `selectedInstructors: ['LHY', 'XN']`。

### 3.2 渠道确认链接

现有 `genLink()` 逻辑，生成 `confirm.html?proposal=BASE64` 链接并复制。

### 3.3 讲师参考方案链接

新增 `generateInstructorLink()` 函数，生成 `instructor.html?ref=BASE64` 链接。

BASE64 编码内容（`instructorRef` 对象）：
```js
{
  id, channel, contact, salesName, audience, jobLevel,
  people, duration, date,
  painpoints,          // 原始问卷痛点
  supplementText,      // 补充信息全文
  courses,             // 已选课程（id + name + series）
  outline,             // 课纲目录全文
  skus,                // 匹配SKU列表（id + name + match）
  instructors,         // 已选讲师姓名列表
  generatedAt
}
```

---

## 新页面：instructor.html

路径：`public/instructor.html`，仿 `confirm.html` 结构，纯只读。

**展示顺序：**
1. 渠道需求摘要（渠道、受众类型、职级、人数、时长、期望日期）
2. 原始问卷痛点
3. 补充信息 / 会议纪要（全文，`<pre>` 格式保留换行）
4. 已选课程与课纲目录
5. 参考 SKU 列表（表格：编号 · 名称 · 匹配等级）

页面底部注明「本方案由产品中心生成，仅供讲师备课参考，课程内容请根据渠道实际需求调整」。

---

## 数据结构变化

`zx_order_overrides[orderId]` 新增字段：

```js
{
  supplementText: '',              // 会议纪要/补充文字
  aiResult: {                      // AI分析结果（持久化）
    top3: [{id, name, seriesName, score, reason}],
    suggestions: ''
  },
  selectedInstructors: [],         // 讲师ID数组
}
```

---

## 依赖新增

- `mammoth`：npm 包，浏览器端 .docx 文本提取
- Anthropic API Key：存 `localStorage['zx_anthropic_key']`
- 新文件 `public/instructor.html`
- `mock.js` 新增 `INSTRUCTORS` 导出

---

## 不在本次范围内

- 讲师在 instructor.html 上填写/确认排期（后续迭代）
- AI 结果自动勾选课程（仅展示，产品中心手动操作）
- 多端实时同步（仍使用 localStorage 方案）
