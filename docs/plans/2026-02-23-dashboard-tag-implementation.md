# Dashboard 改造与 Tag 系统实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 改造 Dashboard 显示今日待完成和延期数据，增强 DashboardDetail 为三个 Tab，添加 Tag 默认标签和自定义标签管理功能。

**Architecture:**
- Dashboard：左右两栏布局，显示待完成/延期统计
- DashboardDetail：Tab 切换，三个视图（延期分析/效率统计/Tag分析）
- Tag 系统：默认标签 + 自定义标签，localStorage 存储

**Tech Stack:** React + TypeScript + ECharts + localStorage

---

## 阶段一：Dashboard 改造

### Task 1: 更新 Dashboard 布局和数据计算

**Files:**
- Modify: `src/components/Dashboard.tsx`
- Modify: `src/components/Dashboard.css`

**Step 1: 修改 Dashboard.tsx**

```tsx
// 修改统计计算逻辑
const todayStats = useMemo(() => {
  const now = new Date();

  // 今日待完成：所有未完成记录
  const incompleteRecords = records.filter(r => r.status !== 'completed');
  const pending = incompleteRecords.filter(r => r.status === 'pending').length;
  const inProgress = incompleteRecords.filter(r => r.status === 'in_progress').length;
  const completed = records.filter(r => r.status === 'completed').length;

  // 今日延期计算
  const delayed = incompleteRecords.filter(r => {
    const plannedStart = r.plannedStartTime || r.createdAt;
    const plannedEnd = r.plannedEndTime || new Date(r.createdAt);
    plannedEnd.setHours(23, 59, 59, 999);

    // 计划开始未开始
    if (r.status === 'pending' && now > plannedStart) return true;
    // 计划完成未完成
    if (r.status === 'in_progress' && now > plannedEnd) return true;
    return false;
  });

  const delayedStart = delayed.filter(r => r.status === 'pending').length;
  const delayedEnd = delayed.filter(r => r.status === 'in_progress').length;

  return { pending, inProgress, completed, incomplete: pending + inProgress, delayedStart, delayedEnd };
}, [records]);
```

**Step 2: 修改 JSX 布局为左右两栏**

```tsx
return (
  <div className="dashboard">
    <div className="dashboard-bar" onClick={() => handleExpand(!isExpanded)}>
      <div className="dashboard-section">
        <div className="section-title">今日待完成</div>
        <div className="stat-cards">
          <div className="stat-card">
            <span className="stat-value">{todayStats.incomplete}</span>
            <span className="stat-label">待办</span>
          </div>
          <div className="stat-card completed">
            <span className="stat-value">{todayStats.completed}</span>
            <span className="stat-label">已完成</span>
          </div>
        </div>
      </div>
      <div className="dashboard-section">
        <div className="section-title">今日延期</div>
        <div className="stat-cards">
          <div className="stat-card delayed">
            <span className="stat-value">{todayStats.delayedStart}</span>
            <span className="stat-label">未开始</span>
          </div>
          <div className="stat-card delayed">
            <span className="stat-value">{todayStats.delayedEnd}</span>
            <span className="stat-label">未完成</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);
```

**Step 3: 添加 CSS 样式**

```css
.dashboard-bar {
  display: flex;
  gap: 16px;
  padding: 16px 20px;
}

.dashboard-section {
  flex: 1;
}

.dashboard-section .section-title {
  font-size: var(--text-xs);
  color: var(--text-muted);
  margin-bottom: 8px;
}

.stat-cards {
  display: flex;
  gap: 8px;
}

.stat-card {
  flex: 1;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  padding: 12px;
  text-align: center;
  display: flex;
  flex-direction: column;
}

.stat-card.delayed {
  background: var(--danger-bg);
}

.stat-card.completed {
  background: var(--status-completed-bg);
}

.stat-value {
  font-size: var(--text-xl);
  font-weight: 700;
  font-family: var(--font-heading);
  color: var(--text-primary);
}

.stat-card.delayed .stat-value {
  color: var(--danger);
}

.stat-label {
  font-size: var(--text-xs);
  color: var(--text-muted);
  margin-top: 4px;
}
```

**Step 4: 构建验证**

Run: `npm run build`
Expected: PASS

**Step 5: 提交**

```bash
git add src/components/Dashboard.tsx src/components/Dashboard.css
git commit -m "feat: update dashboard with left-right layout and delayed stats"
```

---

## 阶段二：DashboardDetail 改造

### Task 2: 实现 DashboardDetail Tab 切换

**Files:**
- Modify: `src/components/DashboardDetail.tsx`
- Modify: `src/components/DashboardDetail.css`

**Step 1: 添加 Tab 状态和基础布局**

```tsx
const [activeTab, setActiveTab] = useState<'delay' | 'efficiency' | 'tag'>('delay');

return (
  <div className="dashboard-detail">
    <div className="view-toggle">
      <button
        className={`toggle-btn ${activeTab === 'delay' ? 'active' : ''}`}
        onClick={() => setActiveTab('delay')}
      >
        延期分析
      </button>
      <button
        className={`toggle-btn ${activeTab === 'efficiency' ? 'active' : ''}`}
        onClick={() => setActiveTab('efficiency')}
      >
        效率统计
      </button>
      <button
        className={`toggle-btn ${activeTab === 'tag' ? 'active' : ''}`}
        onClick={() => setActiveTab('tag')}
      >
        Tag分析
      </button>
    </div>

    {activeTab === 'delay' && <DelayAnalysisTab records={records} />}
    {activeTab === 'efficiency' && <EfficiencyTab records={records} />}
    {activeTab === 'tag' && <TagAnalysisTab records={records} />}
  </div>
);
```

**Step 2: 实现 DelayAnalysisTab**

```tsx
function DelayAnalysisTab({ records }: { records: Record[] }) {
  const stats = useMemo(() => {
    const now = new Date();
    const incomplete = records.filter(r => r.status !== 'completed');

    const delayedStart = incomplete.filter(r => {
      const plannedStart = r.plannedStartTime || r.createdAt;
      return r.status === 'pending' && now > plannedStart;
    });

    const delayedEnd = incomplete.filter(r => {
      const plannedEnd = r.plannedEndTime || new Date(r.createdAt);
      plannedEnd.setHours(23, 59, 59, 999);
      return r.status === 'in_progress' && now > plannedEnd;
    });

    return { delayedStart: delayedStart.length, delayedEnd: delayedEnd.length };
  }, [records]);

  return (
    <div className="tab-content">
      <div className="overview-grid">
        <div className="overview-card delayed">
          <div className="overview-value">{stats.delayedStart}</div>
          <div className="overview-label">计划开始未开始</div>
        </div>
        <div className="overview-card delayed">
          <div className="overview-value">{stats.delayedEnd}</div>
          <div className="overview-label">计划完成未完成</div>
        </div>
      </div>
    </div>
  );
}
```

**Step 3: 实现 EfficiencyTab**

```tsx
function EfficiencyTab({ records }: { records: Record[] }) {
  // 复用现有的 ECharts 逻辑
  // 添加按时完成率、延期完成率计算
}
```

**Step 4: 实现 TagAnalysisTab**

```tsx
function TagAnalysisTab({ records }: { records: Record[] }) {
  // 计算每个 Tag 的延期率
  // 展示排名
}
```

**Step 4: 构建验证**

Run: `npm run build`
Expected: PASS

**Step 5: 提交**

```bash
git add src/components/DashboardDetail.tsx src/components/DashboardDetail.css
git commit -m "feat: add three tabs to DashboardDetail"
```

---

## 阶段三：Tag 系统

### Task 3: 创建 Tag 工具函数和 Hook

**Files:**
- Create: `src/hooks/useTags.ts`
- Modify: `src/types/index.ts` (添加默认标签常量)

**Step 1: 创建默认标签常量**

```ts
// src/constants/tags.ts
export const DEFAULT_TAGS = [
  // 生活
  '吃饭', '睡觉', '运动', '购物', '娱乐', '通勤',
  // 工作
  '会议', '文档', '代码', '邮件', '沟通', '汇报',
  // 学习
  '阅读', '课程', '笔记', '复习',
  // 状态
  '重要', '紧急', '琐事',
  // 项目
  '项目', '个人', '家庭',
] as const;
```

**Step 2: 创建 useTags hook**

```ts
// src/hooks/useTags.ts
import { useState, useEffect } from 'react';
import { DEFAULT_TAGS } from '../constants/tags';

const STORAGE_KEY = 'custom_tags';

export function useTags() {
  const [customTags, setCustomTags] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setCustomTags(JSON.parse(stored));
    }
  }, []);

  const allTags = [...DEFAULT_TAGS, ...customTags];

  const addCustomTag = (tag: string) => {
    if (!allTags.includes(tag)) {
      const newTags = [...customTags, tag];
      setCustomTags(newTags);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newTags));
    }
  };

  const removeCustomTag = (tag: string) => {
    if (!DEFAULT_TAGS.includes(tag as typeof DEFAULT_TAGS[number])) {
      const newTags = customTags.filter(t => t !== tag);
      setCustomTags(newTags);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newTags));
    }
  };

  const isDefaultTag = (tag: string) => DEFAULT_TAGS.includes(tag as typeof DEFAULT_TAGS[number]);

  return { allTags, customTags, addCustomTag, removeCustomTag, isDefaultTag };
}
```

**Step 3: 构建验证**

Run: `npm run build`
Expected: PASS

**Step 4: 提交**

```bash
git add src/constants/tags.ts src/hooks/useTags.ts
git commit -m "feat: add default tags and useTags hook"
```

---

### Task 4: 改造 RecordForm 标签组件

**Files:**
- Modify: `src/components/RecordForm.tsx`
- Modify: `src/components/RecordForm.css`

**Step 1: 集成 useTags**

```tsx
import { useTags } from '../hooks/useTags';

export function RecordForm({ record, existingTags, onClose, onSave }: RecordFormProps) {
  const { allTags, customTags, addCustomTag, isDefaultTag } = useTags();
  const [selectedTags, setSelectedTags] = useState<string[]>(record?.tags || []);
  const [showAllTags, setShowAllTags] = useState(false);

  // 获取高频标签（使用频率最高的8个）
  const frequentTags = allTags.slice(0, 8);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const value = e.currentTarget.value.trim();
      if (value) {
        addCustomTag(value);
        setSelectedTags([...selectedTags, value]);
        e.currentTarget.value = '';
      }
    }
  };
}
```

**Step 2: 更新 JSX**

```tsx
<div className="form-group">
  <label>Tag</label>
  {/* 常用标签 */}
  <div className="tag-list">
    {frequentTags.map(tag => (
      <span
        key={tag}
        className={`tag ${selectedTags.includes(tag) ? 'selected' : ''}`}
        onClick={() => toggleTag(tag)}
      >
        {tag}
      </span>
    ))}
  </div>
  {/* 更多标签按钮 */}
  {allTags.length > 8 && (
    <button
      type="button"
      className="more-tags-btn"
      onClick={() => setShowAllTags(!showAllTags)}
    >
      {showAllTags ? '收起' : '更多标签'}
    </button>
  )}
  {/* 全部标签列表 */}
  {showAllTags && (
    <div className="all-tags-list">
      {allTags.slice(8).map(tag => (
        <span
          key={tag}
          className={`tag ${selectedTags.includes(tag) ? 'selected' : ''}`}
          onClick={() => toggleTag(tag)}
        >
          {tag}
        </span>
      ))}
    </div>
  )}
  {/* 输入新标签 */}
  <div className="tag-input">
    <input
      onKeyDown={handleTagInput}
      placeholder="输入新标签后按回车"
    />
  </div>
</div>
```

**Step 3: 添加 CSS**

```css
.tag.selected {
  background: var(--accent-primary);
  color: #fff;
}

.more-tags-btn {
  background: none;
  border: none;
  color: var(--accent-primary);
  font-size: var(--text-sm);
  cursor: pointer;
  margin-top: 8px;
}

.all-tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
}
```

**Step 4: 构建验证**

Run: `npm run build`
Expected: PASS

**Step 5: 提交**

```bash
git add src/components/RecordForm.tsx src/components/RecordForm.css
git commit -m "feat: update RecordForm tag selection with default tags"
```

---

### Task 5: 创建管理标签页面

**Files:**
- Create: `src/pages/TagManagementPage.tsx`
- Modify: `src/App.tsx` (添加路由)

**Step 1: 创建 TagManagementPage**

```tsx
import { useTags } from '../hooks/useTags';

interface TagManagementPageProps {
  onBack: () => void;
}

export function TagManagementPage({ onBack }: TagManagementPageProps) {
  const { allTags, customTags, removeCustomTag, isDefaultTag } = useTags();

  return (
    <div className="tag-management-page">
      <header className="page-header">
        <button onClick={onBack}>← 返回</button>
        <h1>管理标签</h1>
      </header>

      <section className="tag-section">
        <h3>默认标签（不可删除）</h3>
        <div className="tag-grid default">
          {allTags.filter(isDefaultTag).map(tag => (
            <span key={tag} className="tag default">{tag}</span>
          ))}
        </div>
      </section>

      <section className="tag-section">
        <h3>自定义标签</h3>
        <div className="tag-grid custom">
          {customTags.map(tag => (
            <span
              key={tag}
              className="tag custom"
              onClick={() => removeCustomTag(tag)}
            >
              {tag} ×
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
```

**Step 2: 添加路由和状态**

```tsx
const [showTagManagement, setShowTagManagement] = useState(false);

// 在 AppContent 中
{showTagManagement && (
  <TagManagementPage onBack={() => setShowTagManagement(false)} />
)}
```

**Step 3: 添加 CSS**

```css
.tag-management-page {
  padding: 20px;
}

.tag.default {
  background: var(--bg-secondary);
  color: var(--text-muted);
  cursor: not-allowed;
}

.tag.custom {
  background: var(--accent-tertiary);
  cursor: pointer;
}

.tag.custom:hover {
  background: var(--danger);
  color: #fff;
}
```

**Step 4: 构建验证**

Run: `npm run build`
Expected: PASS

**Step 5: 提交**

```bash
git add src/pages/TagManagementPage.tsx src/App.tsx src/App.css
git commit -m "feat: add tag management page"
```

---

## 阶段四：集成和测试

### Task 6: 端到端测试

**Step 1: 启动开发服务器**

```bash
npm run dev
```

**Step 2: 测试场景**

1. Dashboard 显示正确
   - 今日待完成：待办数量、已完成数量
   - 今日延期：未开始数量、未完成数量

2. DashboardDetail Tab 切换
   - 延期分析：显示延期细分数据
   - 效率统计：显示完成率图表
   - Tag分析：显示Tag延期率排名

3. Tag 功能
   - RecordForm 显示默认标签
   - 点击标签切换选中状态
   - 输入新标签回车添加
   - 管理页面删除自定义标签

**Step 3: 构建验证**

Run: `npm run build`
Expected: PASS

**Step 4: 提交**

```bash
git add -A
git commit -m "feat: complete dashboard and tag system features"
```

---

## 计划完成

**Plan complete and saved to `docs/plans/2026-02-23-dashboard-tag-implementation.md`.**

**Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
