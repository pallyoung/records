# UI重构实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** UI风格重构、移除习惯Tab、调整表单顺序，对标现代深色主题任务App

**Architecture:** 更新全局颜色变量、调整TabBar为2个标签、调整各组件样式、调整表单顺序

**Tech Stack:** React, TypeScript, SCSS modules

**UI风格说明：**
- 深紫色背景 (#1a1a2e)
- 柔和粉彩色调accent (淡紫色/珊瑚色/青绿色)
- 大圆角卡片 (16-20px)
- 2个底部标签：事务、个人中心

---

## Task 1: 更新全局颜色变量

**Files:**
- Modify: `src/index.css`

**Step 1: Update CSS variables**

```css
/* 颜色系统 - 深紫色主题 */
:root {
  /* 背景色 */
  --bg-primary: #1a1a2e;      /* 深紫色主背景 */
  --bg-secondary: #252540;    /* 卡片背景 */
  --bg-card: #252540;         /* 卡片背景 */

  /* 文字颜色 */
  --text-primary: #ffffff;
  --text-secondary: #a0a0a0;
  --text-muted: #6b6b6b;

  /* 强调色 - 粉彩色系 */
  --accent-primary: #a78bfa;   /* 淡紫色 */
  --accent-secondary: #22d3d3; /* 青绿色 */
  --accent-tertiary: #3d3d5c; /* 灰色边框 */

  /* 功能色 */
  --accent-success: #22d3d3;  /* 青绿色 - 完成 */
  --accent-warning: #fb923c;  /* 橙色 - 进行中 */
  --accent-danger: #fb7185;   /* 珊瑚色 - 危险/删除 */

  /* 状态背景色 */
  --accent-primary-bg: rgba(167, 139, 250, 0.2);
  --accent-success-bg: rgba(34, 211, 211, 0.2);
  --accent-warning-bg: rgba(251, 146, 60, 0.2);
  --accent-danger-bg: rgba(251, 113, 133, 0.2);

  /* 圆角 */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;

  /* 阴影 */
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.2);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.3);
}

body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
}
```

**Step 2: Commit**

```bash
git add src/index.css
git commit -m "style: update color variables to dark purple theme"
```

---

## Task 2: TabBar改为2个标签

**Files:**
- Modify: `src/components/tab-bar/index.tsx`

**Step 1: Update TabBar to have only 2 tabs**

```tsx
// src/components/tab-bar/index.tsx

// TABS数组改为2个
const TABS: TabItem[] = [
  { id: 'records', label: '事务' },
  { id: 'profile', label: '个人中心' },
];

// 默认值改为 'records'
const [activeTab, setActiveTab] = useState<TabType>('records');
```

**Step 2: Update TabType**

```typescript
// 移除 'habits'，只保留 2 个
export type TabType = 'records' | 'profile';
```

**Step 3: Commit**

```bash
git add src/components/tab-bar/
git commit -m "refactor: reduce TabBar to 2 tabs (records, profile)"
```

---

## Task 3: 调整事务页面样式（深紫色主题）

**Files:**
- Modify: `src/components/record-card/index.module.scss`
- Modify: `src/components/dashboard/index.module.scss`

**Step 1: Update record-card styles**

```scss
// src/components/record-card/index.module.scss

.recordCard {
  background: var(--bg-card);  /* #252540 */
  border-radius: 16px;  /* 大圆角 */
  padding: 12px;
  border: 1px solid var(--accent-tertiary);
}

.recordCardWrapper {
  margin-bottom: 8px;
}

/* 状态标签颜色调整 */
.statusBadge.pending {
  background: var(--accent-primary-bg);
  color: var(--accent-primary);
}

.statusBadge.in_progress {
  background: var(--accent-warning-bg);
  color: var(--accent-warning);
}

.statusBadge.completed {
  background: var(--accent-success-bg);
  color: var(--accent-success);
}
```

**Step 2: Update dashboard styles**

```scss
// src/components/dashboard/index.module.scss

.dashboardBar {
  background: var(--bg-card);
  border-radius: 16px;
  border: 1px solid var(--accent-tertiary);
}

.num.completed {
  color: var(--accent-success);
}

.num.delayed {
  color: var(--accent-warning);
}
```

**Step 3: Commit**

```bash
git add src/components/record-card/ src/components/dashboard/
git commit -m "style: update component styles for dark purple theme"
```

---

## Task 4: 调整个人中心样式

**Files:**
- Modify: `src/pages/profile-center-page/index.module.scss`

**Step 1: Update profile center styles**

```scss
// src/pages/profile-center-page/index.module.scss

.profileCenter {
  background: var(--bg-primary);
}

.title {
  color: var(--text-primary);
}

.grid {
  grid-template-columns: repeat(2, 1fr);  /* 2列布局 */
  gap: 12px;
}

.card {
  background: var(--bg-card);
  border-radius: 16px;
  border: 1px solid var(--accent-tertiary);
}

.card:hover {
  border-color: var(--accent-primary);
  background: var(--bg-secondary);
}

.cardIcon {
  font-size: 24px;
}

.cardLabel {
  color: var(--text-primary);
}
```

**Step 2: Commit**

```bash
git add src/pages/profile-center-page/
git commit -m "style: update profile center for dark purple theme"
```

---

## Task 5: 调整表单顺序（事务类型移到最上方）

**Files:**
- Modify: `src/components/record-form/index.tsx`

**Step 1: Move transaction type toggle to top**

在表单中，将事务类型切换从原来的位置移到最上方（内容输入框之前）：

```tsx
// src/components/record-form/index.tsx

// 表单结构调整后：
return (
  <div className={styles.form}>
    {/* 1. 事务类型（最上方） */}
    <div className={styles.formGroup}>
      <label className={styles.label}>事务类型</label>
      <div className={styles.typeToggle}>
        <button
          type="button"
          className={`${styles.typeBtn} ${recordType === 'normal' ? styles.active : ''}`}
          onClick={() => setRecordType('normal')}
        >
          普通事务
        </button>
        <button
          type="button"
          className={`${styles.typeBtn} ${recordType === 'recurring' ? styles.active : ''}`}
          onClick={() => setRecordType('recurring')}
        >
          循环事务
        </button>
      </div>
    </div>

    {/* 2. 循环事务配置（仅当选择循环事务时显示） */}
    {recordType === 'recurring' && (
      // ... 循环配置 UI
    )}

    {/* 3. 内容输入框 */}
    <div className={styles.formGroup}>
      <label className={styles.label}>内容</label>
      <textarea
        className={styles.textarea}
        // ...
      />
    </div>

    {/* 4. 状态选择 */}
    <div className={styles.formGroup}>
      <label className={styles.label}>状态</label>
      // ...
    </div>

    {/* 5. 其他配置... */}
  </div>
);
```

**Step 2: Commit**

```bash
git add src/components/record-form/
git commit -m "refactor: move transaction type toggle to top of form"
```

---

## Task 6: 最终验证

**Step 1: Build**

```bash
npm run build
```

**Step 2: 测试清单**

- [ ] 全局颜色变为深紫色主题
- [ ] 底部TabBar只有2个标签
- [ ] 事务卡片为大圆角
- [ ] 个人中心为2列表格
- [ ] 新建表单事务类型在最上方

**Step 3: Commit**

```bash
git add .
git commit -m "chore: complete UI refactor"
```

---

## 总结

| 任务 | 变更文件 |
|------|----------|
| Task 1 | src/index.css - 颜色变量 |
| Task 2 | src/components/tab-bar/ - 2个标签 |
| Task 3 | record-card, dashboard - 样式调整 |
| Task 4 | profile-center-page - 样式调整 |
| Task 5 | record-form - 表单顺序 |
| Task 6 | 最终验证 |
