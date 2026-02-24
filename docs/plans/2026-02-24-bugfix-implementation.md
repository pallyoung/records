# Bugfix Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 修复两个 UI 问题：1) 移除常驻快捷键提示栏，改为在设置页面查看；2) 修复习惯图标选择器溢出

**Architecture:** 移除 KeyboardHints 组件引用，创建 SettingsPage 页面，修复习惯图标样式

**Tech Stack:** React, TypeScript, SCSS Modules

---

## Task 1: 移除 KeyboardHints 组件引用

**Files:**
- Modify: `src/App.tsx` (移除 import 和组件使用)

**Step 1: 移除 import**

在 App.tsx 中删除:
```typescript
import { KeyboardHints } from './components/keyboard-hints';
```

**Step 2: 移除组件使用**

删除:
```tsx
<KeyboardHints />
```

**Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "refactor: remove keyboard hints from main view"
```

---

## Task 2: 创建设置页面

**Files:**
- Create: `src/pages/settings-page/index.tsx`
- Create: `src/pages/settings-page/index.module.scss`

**Step 1: 创建 settings-page 目录和组件**

```typescript
// src/pages/settings-page/index.tsx
import styles from './index.module.scss';

interface SettingsPageProps {
  onBack: () => void;
}

const shortcuts = [
  { key: 'n', desc: '新建记录', category: '记录' },
  { key: '/', desc: '搜索', category: '搜索' },
  { key: 'j', desc: '下一条', category: '导航' },
  { key: 'k', desc: '上一条', category: '导航' },
  { key: 'Enter', desc: '编辑选中记录', category: '导航' },
  { key: 'Escape', desc: '关闭弹窗', category: '操作' },
];

export function SettingsPage({ onBack }: SettingsPageProps) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>← 返回</button>
        <h2>设置</h2>
        <div style={{ width: 60 }} />
      </header>

      <section className={styles.section}>
        <h3>快捷键</h3>
        <div className={styles.shortcutList}>
          {shortcuts.map((s) => (
            <div key={s.key} className={styles.shortcutItem}>
              <kbd className={styles.key}>{s.key}</kbd>
              <span className={styles.desc}>{s.desc}</span>
              <span className={styles.category}>{s.category}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
```

**Step 2: 创建样式**

```scss
// src/pages/settings-page/index.module.scss
.page {
  padding: 16px;
  min-height: 100vh;
  background: #F9FAFB;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  h2 { margin: 0; }
}

.backBtn {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 8px;
}

.section {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;

  h3 {
    margin: 0 0 16px;
    font-size: 16px;
    font-weight: 600;
  }
}

.shortcutList {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.shortcutItem {
  display: flex;
  align-items: center;
  gap: 12px;
}

.key {
  background: #F3F4F6;
  border: 1px solid #D1D5DB;
  border-radius: 4px;
  padding: 4px 8px;
  font-family: monospace;
  font-size: 14px;
  min-width: 32px;
  text-align: center;
}

.desc {
  flex: 1;
  font-size: 14px;
}

.category {
  font-size: 12px;
  color: #6B7280;
  background: #F3F4F6;
  padding: 2px 8px;
  border-radius: 12px;
}
```

**Step 3: Commit**

```bash
git add src/pages/settings-page/
git commit -m "feat: add settings page with keyboard shortcuts"
```

---

## Task 3: 集成设置页面到 App

**Files:**
- Modify: `src/App.tsx`

**Step 1: 添加 import**

```typescript
import { SettingsPage } from './pages/settings-page';
```

**Step 2: 添加状态**

```typescript
const [showSettings, setShowSettings] = useState(false);
```

**Step 3: 添加条件渲染**

在 showTagManagement 判断后添加:
```typescript
if (showSettings) {
  return (
    <SettingsPage
      onBack={() => setShowSettings(false)}
    />
  );
}
```

**Step 4: 添加导航按钮**

在 header-actions 中添加:
```tsx
<button onClick={() => setShowSettings(true)}>设置</button>
```

**Step 5: 更新快捷键**

在 useKeyboardShortcuts 条件中添加 !showSettings:
```typescript
useKeyboardShortcuts(shortcuts, !showForm && !showReview && !showTagManagement && !showHabits && !showSettings);
```

在 Escape handler 中添加:
```typescript
{ key: 'Escape', handler: () => { setShowForm(false); setShowReview(false); setShowTagManagement(false); setShowHabits(false); setShowSettings(false); }, description: '关闭' },
```

**Step 6: Commit**

```bash
git add src/App.tsx
git commit -m "feat: integrate settings page"
```

---

## Task 4: 修复习惯图标选择器溢出

**Files:**
- Modify: `src/pages/habits-page/index.module.scss`

**Step 1: 添加 flex-wrap**

在 `.icons` 样式中添加:
```scss
.icons {
  display: flex;
  flex-wrap: wrap;  // 添加这行
  gap: 8px;
  margin-bottom: 16px;
}
```

**Step 2: Commit**

```bash
git add src/pages/habits-page/index.module.scss
git commit -m "fix: wrap habit icons on small screens"
```

---

## Task 5: 验证构建

**Step 1: 运行构建**

```bash
pnpm build
```

确保无错误。

**Step 2: Commit**

```bash
git add -A && git commit -m "fix: keyboard hints and habit icon issues"
```
