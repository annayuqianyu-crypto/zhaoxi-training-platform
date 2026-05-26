# 手机端门户适配设计文档

**日期：** 2026-05-26  
**范围：** 朝曦家办-知识工坊 Portal 端（`/#portal`）手机版适配  
**方式：** 响应式改造 + 复杂模块局部重建（方案 C）

---

## 1. 目标

让销售同事能在手机端流畅使用门户的全部四个功能模块，体验与 PC 端设计语言保持一致（同一套 CSS 变量、字体、色系），无 emoji 图标，风格典雅。

## 2. 架构

### 双端入口选择

`PortalApp.jsx` 启动后，登录前先展示**入口选择页**：

```
朝曦知识中心

┌────────────┐  ┌────────────┐
│            │  │            │
│   手机版   │  │   电脑版   │
│  随时随地  │  │  完整功能  │
│            │  │            │
└────────────┘  └────────────┘
```

- 选择结果存入 `sessionStorage`：`zx_portal_mode = 'mobile' | 'desktop'`
- 之后进入统一的 `PortalLogin` 完成登录
- 登录成功后按 mode 渲染不同 Shell：
  - `desktop` → 现有 `PortalShell`（完全不变）
  - `mobile` → 新建 `MobilePortalShell`

### 断点

`index.css` 中统一定义 `@media (max-width: 768px)` 为手机模式，PC 端不受影响。

---

## 3. 新增文件

| 文件 | 说明 |
|------|------|
| `src/components/MobilePortalShell.jsx` | 手机版 Shell，含底部 Tab 栏 |
| `src/pages/PortalModeSelect.jsx` | 入口选择页（手机版 / 电脑版） |

---

## 4. 修改文件

| 文件 | 改动说明 |
|------|---------|
| `index.html` | 确认有 `viewport` meta 标签 |
| `index.css` | 新增全局移动端基础样式 |
| `src/pages/PortalApp.jsx` | 增加 mode 状态，登录前渲染 ModeSelect |
| `src/pages/PortalCourseMatch.jsx` | AI 结果区域单列重排，底部操作栏 |
| `src/pages/ProductLearning.jsx` | SKU 卡片头部两行布局，Tab 横向滚动 |
| `src/pages/PortalWorkOrder.jsx` | 标签组换行，提交按钮全宽 |
| `src/pages/PortalHistory.jsx` | 元数据行允许换行 |

---

## 5. MobilePortalShell 设计

```
┌─────────────────────────────┐
│  朝曦知识中心        anna.yu │  ← 顶部标题栏（40px）
├─────────────────────────────┤
│                             │
│         页面内容区           │
│    （padding-bottom 72px）  │
│                             │
├─────────────────────────────┤
│  课程匹配  提交需求  产品学习  历史记录  │  ← 底部 Tab（56px + safe-area）
└─────────────────────────────┘
```

**底部 Tab 规格：**
- 高度：`56px + env(safe-area-inset-bottom)`（兼容 iPhone 刘海/灵动岛）
- 文字：12px，当前 Tab 用 `var(--accent)` 高亮，非当前用 `var(--text-3)`
- 触控目标：整个 Tab 区域可点击，最小 44px 高度
- 无图标，纯文字，与 PC 端 Tab 风格一致

---

## 6. 各页面适配细节

### 6.1 课程匹配（PortalCourseMatch）
- 需求输入框 → 全宽，`min-height: 120px`
- AI 分析结果 → 单列卡片，垂直滚动
- SKU 卡片展开内容 → 字号 13px，标签宽度压缩
- 操作按钮区域 → 固定在内容底部，避免被 Tab 栏遮挡

### 6.2 提交需求（PortalWorkOrder）
- 表单字段天然单列，改动最少
- 多选标签组 → `flex-wrap: wrap`
- 提交按钮 → `width: 100%`，高度 `48px`

### 6.3 产品学习（ProductLearning）
- 法律 / 税务 / 资本市场 Tab → `overflow-x: auto`，横向可滑动，不折行
- 搜索框 → 全宽
- SKU 卡片头部重排为两行：
  - 第一行：编号 badge + 名称
  - 第二行：「知识卡片」按钮 + 「产品资料」按钮
- 展开详情：字号 12px，标签列宽 `80px`

### 6.4 历史记录（PortalHistory）
- 卡片列表天然垂直，几乎无需改动
- 元数据行（时间/SKU数）→ `flex-wrap: wrap`，允许换行
- 「继续编辑」按钮 → `width: 100%`

---

## 7. 全局移动端 CSS（index.css 新增）

```css
@media (max-width: 768px) {
  /* 触控目标最小高度 */
  button { min-height: 44px; }

  /* 输入框全宽 */
  .form-input { width: 100% !important; box-sizing: border-box; }

  /* 内容区底部留出 Tab 栏空间 */
  .mobile-page-content { padding-bottom: 72px; }

  /* 卡片内边距收窄 */
  .card, [class*="card"] { padding: 12px !important; }
}
```

---

## 8. 不在本次范围内

- Admin 端（`/`）不做手机适配
- 不新增后端接口，全部本地/GitHub Issues 逻辑不变
- 不改变登录逻辑和权限控制

---

## 9. 实现顺序

1. `index.html` viewport 确认
2. `PortalModeSelect.jsx` 入口选择页
3. `PortalApp.jsx` 接入 mode 逻辑
4. `MobilePortalShell.jsx` 底部 Tab 壳
5. `index.css` 全局移动端基础样式
6. `ProductLearning.jsx` 手机适配
7. `PortalCourseMatch.jsx` 手机适配
8. `PortalWorkOrder.jsx` 手机适配
9. `PortalHistory.jsx` 手机适配
10. 提交并部署
