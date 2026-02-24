# UI 优化实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在保持日记手账风的基础上，提升 UI 精致度和交互体验，包括圆角调整、阴影优化、动画效果

**Architecture:** 更新 CSS 变量系统，增强组件样式，添加过渡动画

**Tech Stack:** React, TypeScript, SCSS Modules

---

## Task 1: 更新基础样式变量

**Files:**
- Modify: `src/index.css`

**Step 1: 添加动画变量**

在 :root 中添加：
```scss
/* 动画 */
--transition-fast: 150ms ease;
--transition-normal: 250ms ease;
--transition-slow: 350ms ease;

/* 阴影增强 */
--shadow-sm: 0 2px 8px rgba(61, 51, 41, 0.06);
--shadow-md: 0 4px 16px rgba(61, 51, 41, 0.10);
--shadow-lg: 0 8px 32px rgba(61, 51, 41, 0.15);
```

**Step 2: Commit**

```bash
git add src/index.css
git commit -f "style: add animation and shadow CSS variables"
```

---

## Task 2: 更新全局过渡样式

**Files:**
- Modify: `src/index.css`

**Step 1: 添加全局过渡**

在全局样式部分添加：
```scss
/* 全局过渡 */
* {
  transition: background-color var(--transition-fast),
              border-color var(--transition-fast),
              box-shadow var(--transition-fast);
}

button, a, input, textarea {
  transition: all var(--transition-fast);
}
```

**Step 2: Commit**

```bash
git add src/index.css
git commit -f "style: add global transition styles"
```

---

## Task 3: 优化卡片组件样式

**Files:**
- Modify: `src/components/record-card/index.module.scss`

**Step 1: 更新卡片样式**

在 .recordCard 中添加：
```scss
.recordCard {
  // ... existing styles
  border: 1px solid rgba(61, 51, 41, 0.08);
  transition: transform var(--transition-normal),
              box-shadow var(--transition-normal),
              border-color var(--transition-fast);

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
  }
}
```

**Step 2: Commit**

```bash
git add src/components/record-card/index.module.scss
git commit -f "style: enhance card hover effects"
```

---

## Task 4: 优化按钮样式

**Files:**
- Modify: `src/components/button/index.module.scss`

**Step 1: 更新按钮样式**

添加悬浮和点击效果：
```scss
.button {
  transition: transform var(--transition-fast),
              background-color var(--transition-fast),
              box-shadow var(--transition-fast);

  &:hover {
    transform: scale(1.02);
  }

  &:active {
    transform: scale(0.98);
  }
}
```

**Step 2: Commit**

```bash
git add src/components/button/index.module.scss
git commit -f "style: add button interaction effects"
```

---

## Task 5: 优化输入框样式

**Files:**
- Modify: `src/components/record-form/index.module.scss`

**Step 1: 更新输入框样式**

在 input/textarea 样式中添加：
```scss
input, textarea {
  transition: border-color var(--transition-fast),
              box-shadow var(--transition-fast);

  &:focus {
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 3px rgba(196, 164, 132, 0.15);
    outline: none;
  }
}
```

**Step 2: Commit**

```bash
git add src/components/record-form/index.module.scss
git commit -f "style: enhance input focus effects"
```

---

## Task 6: 优化 FilterBar 样式

**Files:**
- Modify: `src/components/filter-bar/index.module.scss`

**Step 1: 更新搜索框和按钮样式**

添加过渡效果：
```scss
.searchInput {
  transition: border-color var(--transition-fast),
              box-shadow var(--transition-fast);

  &:focus {
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 3px rgba(196, 164, 132, 0.15);
  }
}

.expandBtn, .filterOptions button, .filterTags button {
  transition: all var(--transition-fast);

  &:hover {
    background: var(--bg-secondary);
  }
}
```

**Step 2: Commit**

```bash
git add src/components/filter-bar/index.module.scss
git commit -f "style: enhance filter bar interactions"
```

---

## Task 7: 优化 Timeline 样式

**Files:**
- Modify: `src/components/timeline/index.module.scss`

**Step 1: 更新 Timeline 样式**

```scss
.timelineGroup {
  animation: fadeIn var(--transition-normal) ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**Step 2: Commit**

```bash
git add src/components/timeline/index.module.scss
git commit -f "style: add timeline animation"
```

---

## Task 8: 优化 App 布局样式

**Files:**
- Modify: `src/App.css`

**Step 1: 添加页面过渡动画**

```scss
/* 页面淡入 */
.app-main {
  animation: pageIn var(--transition-normal) ease;
}

@keyframes pageIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Header 按钮增强 */
.header-actions button {
  transition: all var(--transition-fast);

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }
}
```

**Step 2: Commit**

```bash
git add src/App.css
git commit -f "style: enhance app layout and animations"
```

---

## Task 9: 优化 Modal 样式

**Files:**
- Modify: `src/components/modal/index.module.scss`

**Step 1: 添加弹窗动画**

```scss
.modalOverlay {
  animation: fadeIn var(--transition-fast) ease;
}

.modalContent {
  animation: slideUp var(--transition-normal) ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**Step 2: Commit**

```bash
git add src/components/modal/index.module.scss
git commit -f "style: add modal animations"
```

---

## Task 10: 优化 QuickAdd 面板

**Files:**
- Modify: `src/components/quick-add/index.module.scss`

**Step 1: 更新动画**

```scss
.overlay {
  animation: fadeIn var(--transition-fast) ease;
}

.panel {
  animation: slideUp var(--transition-normal) ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
```

**Step 2: Commit**

```bash
git add src/components/quick-add/index.module.scss
git commit -f "style: enhance quick-add animations"
```

---

## Task 11: 优化骨架屏动画

**Files:**
- Modify: `src/components/skeleton/index.module.scss`

**Step 1: 优化 shimmer 动画**

确保动画流畅：
```scss
.shimmer {
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
```

**Step 2: Commit**

```bash
git add src/components/skeleton/index.module.scss
git commit -f "style: optimize skeleton animation"
```

---

## Task 12: 优化 Dashboard 样式

**Files:**
- Modify: `src/components/dashboard/index.module.scss`

**Step 1: 添加动画**

```scss
.dashboard {
  transition: transform var(--transition-normal) ease;
}
```

**Step 2: Commit**

```bash
git add src/components/dashboard/index.module.scss
git commit -f "style: enhance dashboard transitions"
```

---

## Task 13: 优化页面组件样式

**Files:**
- Modify: `src/pages/habits-page/index.module.scss`
- Modify: `src/pages/settings-page/index.module.scss`
- Modify: `src/pages/review-page/index.module.scss`
- Modify: `src/pages/tag-management-page/index.module.scss`

**Step 1: 为所有页面添加过渡效果**

为每个页面的按钮和卡片添加：
```scss
.backBtn, .addBtn, .card {
  transition: all var(--transition-fast);

  &:hover {
    transform: translateY(-2px);
  }
}
```

**Step 2: Commit**

```bash
git add src/pages/*/index.module.scss
git commit -f "style: enhance page component interactions"
```

---

## Task 14: 验证构建

**Step 1: 运行构建**

```bash
pnpm build
```

确保无错误。

**Step 2: Commit**

```bash
git add -A && git commit -f "style: complete UI optimization"
```
