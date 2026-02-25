# 事务与习惯合并及样式优化实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 合并习惯功能到事务、优化样式、移除筛选功能，对齐现代深色主题App设计

**Architecture:** 在Record类型中添加循环事务配置，修改表单和列表显示，简化样式尺寸，采用深色主题和4x2卡片网格

**Tech Stack:** React, TypeScript, SCSS modules, IndexedDB (Dexie)

**UI风格说明：**
- App整体采用深色主题 (#121212 炭黑色背景)
- 个人中心采用4x2图标网格布局（参考粉色系个人中心设计）
- 保持现有App的陶土色调作为accent色
- 大量圆角、简洁现代风格

---

## Task 1: 个人中心样式改为4x2卡片网格布局

**Files:**
- Modify: `src/pages/profile-center-page/index.tsx`
- Modify: `src/pages/profile-center-page/index.module.scss`

**UI参考：**
- 4x2网格布局（2行4列）
- 大图标 + 简洁文字
- 圆角卡片
- 陶土色accent

**Step 1: Update ProfileCenterPage component**

```tsx
// src/pages/profile-center-page/index.tsx
import styles from './index.module.scss';

interface MenuItem {
  id: string;
  icon: string;
  label: string;
}

const MENU_ITEMS: MenuItem[] = [
  { id: 'review', icon: '📊', label: '复盘' },
  { id: 'settings', icon: '⚙️', label: '设置' },
  { id: 'tags', icon: '🏷️', label: '标签管理' },
];

interface ProfileCenterPageProps {
  onNavigate: (page: MenuItem['id']) => void;
}

export function ProfileCenterPage({ onNavigate }: ProfileCenterPageProps) {
  return (
    <div className={styles.profileCenter}>
      <h1 className={styles.title}>个人中心</h1>

      <div className={styles.grid}>
        {MENU_ITEMS.map(item => (
          <button
            key={item.id}
            className={styles.card}
            aria-label={item.label}
            onClick={() => onNavigate(item.id)}
          >
            <span className={styles.cardIcon}>{item.icon}</span>
            <span className={styles.cardLabel}>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Update SCSS - 4x2 grid with modern dark theme style**

```scss
// src/pages/profile-center-page/index.module.scss
.profileCenter {
  padding: 24px;
  padding-bottom: 100px;
  min-height: 100vh;
  background: var(--bg-primary);
}

.title {
  font-family: var(--font-heading);
  font-size: 28px;
  color: var(--text-primary);
  letter-spacing: 2px;
  margin-bottom: 24px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);  // 4列
  gap: 12px;
}

.card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px 12px;
  background: var(--bg-card);
  border: 1px solid var(--accent-tertiary);
  border-radius: 16px;  // 大圆角
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);  // 柔和阴影
}

.card:hover {
  background: var(--bg-secondary);
  transform: translateY(-2px);
  border-color: var(--accent-primary);  // 陶土色accent
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.card:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

.cardIcon {
  font-size: 28px;
  margin-bottom: 8px;
}

.cardLabel {
  font-size: var(--text-xs);
  color: var(--text-primary);
  font-weight: 500;
}

@media (min-width: 1025px) {
  .profileCenter {
    padding: 32px;
  }

  .grid {
    gap: 16px;
  }

  .card {
    padding: 24px 16px;
  }

  .cardIcon {
    font-size: 32px;
  }
}
```

**Step 3: Commit**

```bash
git add src/pages/profile-center-page/
git commit -m "style: update ProfileCenterPage to card grid layout"
```

---

## Task 2: 缩小事务卡片尺寸

**Files:**
- Modify: `src/components/record-card/index.module.scss`

**Step 1: Update SCSS**

```scss
// src/components/record-card/index.module.scss
// 只修改以下部分，其他保持不变

// 记录卡片
.recordCard {
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: 12px;  // 从 20px 改为 12px
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border: 1px solid transparent;
  cursor: pointer;
  position: relative;
  z-index: 2;
  background-color: var(--bg-card);
}

// 卡片容器
.recordCardWrapper {
  position: relative;
  margin-bottom: 8px;  // 从 16px 改为 8px
}
```

**Step 2: Commit**

```bash
git add src/components/record-card/
git commit -m "style: reduce record card padding and margin"
```

---

## Task 3: 缩小Dashboard尺寸

**Files:**
- Modify: `src/components/dashboard/index.module.scss`

**Step 1: Update SCSS**

```scss
// src/components/dashboard/index.module.scss
.dashboardBar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;  // 从 16px 20px 改为 8px 12px
  background: var(--bg-card);
  border-bottom: 1px solid var(--accent-tertiary);
  margin-bottom: 12px;  // 从 16px 改为 12px
  cursor: pointer;
  transition: background 0.2s ease;
  border-radius: var(--radius-md);
}

.dashboardSection {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;  // 从 4px 改为 2px
  min-width: 80px;  // 从 120px 改为 80px
}

.sectionLabel {
  font-size: var(--text-xs);  // 从 var(--text-sm) 改为 var(--text-xs)
  color: var(--text-secondary);
}

.num {
  font-size: 16px;  // 从 20px 改为 16px
  font-weight: 600;
  color: var(--text-primary);
}

.sep {
  color: var(--text-muted);
  font-size: 12px;  // 从 16px 改为 12px
}
```

**Step 2: Commit**

```bash
git add src/components/dashboard/
git commit -m "style: reduce dashboard padding and sizes"
```

---

## Task 4: 移除FilterBar

**Files:**
- Modify: `src/App.tsx`

**Step 1: Remove FilterBar import and usage**

```tsx
// src/App.tsx

// 1. 移除 import { FilterBar } from './components/filter-bar';

// 2. 移除 FilterBar 组件使用 (大约在第158行)
```

**Step 2: Commit**

```bash
git add src/App.tsx
git commit -m "feat: remove FilterBar from records page"
```

---

## Task 5: 添加循环事务类型定义

**Files:**
- Modify: `src/types/index.ts`

**Step 1: Add recurring types**

```typescript
// src/types/index.ts

// 循环事务频率类型
export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'interval_days' | 'interval_hours';

// 循环事务配置
export interface RecurringConfig {
  frequency: RecurringFrequency;
  daysOfWeek?: number[];      // 每周几 (0-6, 0为周日)
  dayOfMonth?: number;       // 每月几号 (1-28)
  intervalValue?: number;     // 自定义间隔值
  totalCompletions: number;   // 累计完成次数
  lastResetDate?: string;    // 上次重置日期 (YYYY-MM-DD)
  lastResetTime?: string;    // 上次重置时间 (HH:mm，用于小时级别)
}

// 事务类型
export type RecordType = 'normal' | 'recurring';

// 更新 Record 接口
export interface Record {
  id: string;
  content: string;
  images: string[];
  tags: string[];
  status: RecordStatus;
  type?: RecordType;              // 事务类型
  recurringConfig?: RecurringConfig; // 循环配置
  plannedStartTime?: Date;
  plannedEndTime?: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
  review?: Review;
  createdAt: Date;
  updatedAt: Date;
}
```

**Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add recurring transaction types"
```

---

## Task 6: 修改RecordForm添加循环事务配置

**Files:**
- Modify: `src/components/record-form/index.tsx`
- Modify: `src/components/record-form/index.module.scss`

**Step 1: Update RecordForm component**

```tsx
// src/components/record-form/index.tsx
// 在表单中添加事务类型切换和循环配置

// 添加状态
const [recordType, setRecordType] = useState<'normal' | 'recurring'>('normal');
const [recurringConfig, setRecurringConfig] = useState<RecurringConfig>({
  frequency: 'daily',
  daysOfWeek: [],
  dayOfMonth: 1,
  intervalValue: 2,
  totalCompletions: 0,
});

// 在表单中添加类型切换 UI
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

// 如果是循环事务，显示配置选项
{recordType === 'recurring' && (
  <div className={styles.formGroup}>
    <label className={styles.label}>循环周期</label>
    <select
      className={styles.select}
      value={recurringConfig.frequency}
      onChange={(e) => setRecurringConfig({ ...recurringConfig, frequency: e.target.value as RecurringFrequency })}
    >
      <option value="daily">每天</option>
      <option value="weekly">每周</option>
      <option value="monthly">每月</option>
      <option value="interval_days">每几天</option>
      <option value="interval_hours">每几小时</option>
    </select>
  </div>
)}

// 根据选择的频率显示相应配置
{recordType === 'recurring' && recurringConfig.frequency === 'weekly' && (
  <div className={styles.formGroup}>
    <label className={styles.label}>选择星期</label>
    <div className={styles.weekDays}>
      {['日', '一', '二', '三', '四', '五', '六'].map((day, idx) => (
        <button
          key={idx}
          type="button"
          className={`${styles.dayBtn} ${recurringConfig.daysOfWeek?.includes(idx) ? styles.selected : ''}`}
          onClick={() => {
            const days = recurringConfig.daysOfWeek || [];
            const newDays = days.includes(idx) ? days.filter(d => d !== idx) : [...days, idx];
            setRecurringConfig({ ...recurringConfig, daysOfWeek: newDays });
          }}
        >
          {day}
        </button>
      ))}
    </div>
  </div>
)}

{recordType === 'recurring' && recurringConfig.frequency === 'monthly' && (
  <div className={styles.formGroup}>
    <label className={styles.label}>每月几号</label>
    <select
      className={styles.select}
      value={recurringConfig.dayOfMonth}
      onChange={(e) => setRecurringConfig({ ...recurringConfig, dayOfMonth: parseInt(e.target.value) })}
    >
      {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
        <option key={day} value={day}>{day}日</option>
      ))}
    </select>
  </div>
)}

{recordType === 'recurring' && recurringConfig.frequency === 'interval_days' && (
  <div className={styles.formGroup}>
    <label className={styles.label}>每几天</label>
    <input
      type="number"
      className={styles.input}
      min={2}
      max={30}
      value={recurringConfig.intervalValue}
      onChange={(e) => setRecurringConfig({ ...recurringConfig, intervalValue: parseInt(e.target.value) })}
    />
  </div>
)}

{recordType === 'recurring' && recurringConfig.frequency === 'interval_hours' && (
  <div className={styles.formGroup}>
    <label className={styles.label}>每几小时</label>
    <input
      type="number"
      className={styles.input}
      min={2}
      max={48}
      value={recurringConfig.intervalValue}
      onChange={(e) => setRecurringConfig({ ...recurringConfig, intervalValue: parseInt(e.target.value) })}
    />
  </div>
)}
```

**Step 2: Update onSave to include type**

```tsx
const handleSave = async (data: Omit<Record, 'id' | 'createdAt' | 'updatedAt'>) => {
  const recordData = {
    ...data,
    type: recordType,
    ...(recordType === 'recurring' ? { recurringConfig } : {}),
  };
  // ... save logic
};
```

**Step 3: Update SCSS**

```scss
// src/components/record-form/index.module.scss

.typeToggle {
  display: flex;
  gap: 8px;
}

.typeBtn {
  flex: 1;
  padding: 10px 16px;
  border: 1px solid var(--accent-tertiary);
  border-radius: var(--radius-md);
  background: var(--bg-card);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.typeBtn.active {
  background: var(--accent-primary);
  color: #fff;
  border-color: var(--accent-primary);
}

.weekDays {
  display: flex;
  gap: 8px;
}

.dayBtn {
  width: 36px;
  height: 36px;
  border: 1px solid var(--accent-tertiary);
  border-radius: 50%;
  background: var(--bg-card);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.dayBtn.selected {
  background: var(--accent-primary);
  color: #fff;
  border-color: var(--accent-primary);
}
```

**Step 4: Commit**

```bash
git add src/components/record-form/
git commit -m "feat: add recurring transaction config to RecordForm"
```

---

## Task 7: 实现循环重置逻辑

**Files:**
- Modify: `src/db/recordRepository.ts`

**Step 1: Add recurring reset logic**

```typescript
// src/db/recordRepository.ts

// 检查并处理循环事务重置
export async function checkAndResetRecurringRecords() {
  const records = await db.records.where('type').equals('recurring').toArray();
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const currentHour = today.getHours();
  const currentDay = today.getDay();

  for (const record of records) {
    if (!record.recurringConfig) continue;

    const config = record.recurringConfig;
    let shouldReset = false;

    switch (config.frequency) {
      case 'daily':
        shouldReset = config.lastResetDate !== todayStr;
        break;

      case 'weekly':
        if (config.daysOfWeek?.includes(currentDay) && config.lastResetDate !== todayStr) {
          shouldReset = true;
        }
        break;

      case 'monthly':
        const currentDayOfMonth = today.getDate();
        if (config.dayOfMonth === currentDayOfMonth && config.lastResetDate !== todayStr) {
          shouldReset = true;
        }
        break;

      case 'interval_days':
        if (config.lastResetDate) {
          const lastReset = new Date(config.lastResetDate);
          const diffDays = Math.floor((today.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24));
          shouldReset = diffDays >= (config.intervalValue || 2);
        } else {
          shouldReset = true;
        }
        break;

      case 'interval_hours':
        if (config.lastResetTime) {
          const [lastHour, lastMin] = config.lastResetTime.split(':').map(Number);
          const lastTime = new Date(today);
          lastTime.setHours(lastHour, lastMin, 0, 0);
          const diffHours = (today.getTime() - lastTime.getTime()) / (1000 * 60 * 60);
          shouldReset = diffHours >= (config.intervalValue || 2);
        } else {
          shouldReset = true;
        }
        break;
    }

    if (shouldReset && record.status === 'completed') {
      await db.records.update(record.id, {
        status: 'pending',
        recurringConfig: {
          ...config,
          lastResetDate: todayStr,
          lastResetTime: `${currentHour}:${today.getMinutes().toString().padStart(2, '0')}`,
        },
      });
    }
  }
}

// 在事务完成时更新累计次数
export async function completeRecurringRecord(id: string) {
  const record = await db.records.get(id);
  if (record?.recurringConfig) {
    await db.records.update(id, {
      recurringConfig: {
        ...record.recurringConfig,
        totalCompletions: (record.recurringConfig.totalCompletions || 0) + 1,
      },
    });
  }
}
```

**Step 2: Call checkAndResetRecurringRecords on app load**

在 App.tsx 的 useEffect 中调用：

```tsx
useEffect(() => {
  recordActions.loadRecords();
  checkAndResetRecurringRecords(); // 添加这行
}, []);
```

**Step 3: Commit**

```bash
git add src/db/recordRepository.ts src/App.tsx
git commit -m "feat: implement recurring record reset logic"
```

---

## Task 8: 循环事务在列表中显示标记

**Files:**
- Modify: `src/components/record-card/index.tsx`
- Modify: `src/components/record-card/index.module.scss`

**Step 1: Update RecordCard to show recurring badge**

```tsx
// src/components/record-card/index.tsx

// 在 RecordCardProps 中添加 recurringConfig
interface RecordCardProps {
  record: Record;
  isSelected?: boolean;
  onClick?: () => void;
  onComplete?: () => void;
}

// 获取循环标签文字
const getRecurringLabel = (config: RecurringConfig) => {
  switch (config.frequency) {
    case 'daily': return '每日';
    case 'weekly': return '每周';
    case 'monthly': return '每月';
    case 'interval_days': return `每${config.intervalValue}天`;
    case 'interval_hours': return `每${config.intervalValue}小时`;
    default: return '循环';
  }
};

// 在卡片中显示
{record.type === 'recurring' && record.recurringConfig && (
  <div className={styles.recurringBadge}>
    <span className={styles.recurringIcon}>🔄</span>
    <span>{getRecurringLabel(record.recurringConfig)}</span>
    {record.recurringConfig.totalCompletions > 0 && (
      <span className={styles.completionCount}>
        累计{record.recurringConfig.totalCompletions}次
      </span>
    )}
  </div>
)}
```

**Step 2: Add SCSS styles**

```scss
// src/components/record-card/index.module.scss

.recurringBadge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: var(--accent-primary-bg);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  color: var(--accent-primary);
  margin-bottom: 8px;
}

.recurringIcon {
  font-size: 12px;
}

.completionCount {
  color: var(--text-muted);
  margin-left: 4px;
}
```

**Step 3: Commit**

```bash
git add src/components/record-card/
git commit -m "feat: display recurring badge in record card"
```

---

## Task 9: 最终验证和测试

**Step 1: Build**

```bash
npm run build
```

**Step 2: 测试清单**

- [ ] 个人中心显示为2列卡片网格
- [ ] 事务卡片更紧凑
- [ ] Dashboard更精简
- [ ] FilterBar已移除
- [ ] 新建事务可以选择普通/循环类型
- [ ] 循环事务可配置周期
- [ ] 循环事务在列表中显示 🔄 标记和累计次数

**Step 3: Commit**

```bash
git add .
git commit -m "chore: complete merge habits and style optimization"
```

---

## 总结

| 任务 | 变更文件 |
|------|----------|
| Task 1 | ProfileCenterPage 卡片网格 |
| Task 2 | RecordCard 尺寸缩小 |
| Task 3 | Dashboard 尺寸缩小 |
| Task 4 | 移除 FilterBar |
| Task 5 | 添加循环事务类型 |
| Task 6 | RecordForm 循环配置 |
| Task 7 | 循环重置逻辑 |
| Task 8 | 循环标记显示 |
| Task 9 | 最终验证 |
