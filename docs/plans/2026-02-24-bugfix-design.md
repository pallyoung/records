# Bug 修复设计文档

## 概述

修复两个 UI 问题：
1. 快捷键提示栏默认隐藏，改为在设置页面查看
2. 习惯图标选择器溢出问题

---

## 一、快捷键提示栏修改

### 1.1 移除 KeyboardHints 组件

从 `App.tsx` 中移除 `<KeyboardHints />` 组件的引用。

### 1.2 创建设置页面

新建 `src/pages/settings-page/index.tsx`：

```tsx
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
```

### 1.3 路由集成

在 `App.tsx` 中添加：
- `showSettings` 状态
- "设置" 入口按钮
- 条件渲染 `<SettingsPage />`

---

## 二、习惯图标选择器修复

### 2.1 修改样式

在 `src/pages/habits-page/index.module.scss` 中添加 `.icons` 容器换行：

```scss
.icons {
  display: flex;
  flex-wrap: wrap;  // 添加换行
  gap: 8px;
  margin-bottom: 16px;
}
```

---

## 三、UI 预览

### 设置页面布局
```
┌─────────────────────┐
│ ← 设置              │
├─────────────────────┤
│ 快捷键              │
│ ▼ 记录              │
│   n - 新建记录      │
│ ▼ 搜索              │
│   / - 搜索          │
│ ▼ 导航              │
│   j - 下一条        │
│   k - 上一条        │
│   Enter - 编辑      │
│ ▼ 操作              │
│   Esc - 关闭弹窗    │
└─────────────────────┘
```

### 习惯图标选择器
```
┌─────────────────────┐
│ 选择图标            │
│                     │
│ [📝] [📚] [🏃]    │
│ [💪] [🧘] [💤]    │
│ [🍎]                │
└─────────────────────┘
```
