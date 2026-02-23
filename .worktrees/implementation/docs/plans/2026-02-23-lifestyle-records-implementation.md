# 日常生活记录工具 - 实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标：** 构建一个支持文字/图片记录、Tag管理、状态追踪、时间线展示、复盘功能的 Web 应用

**架构：** PWA 架构，React + TypeScript 前端，Dexie.js 操作 IndexedDB 本地存储，@relax-state/react 状态管理

**技术栈：** React, TypeScript, Vite, @relax-state/react, Dexie.js

---

## 响应式设计策略

### 断点定义

| 断点 | 宽度 | 布局 |
|------|------|------|
| Mobile | < 640px | 单列布局，底部 FAB，弹窗表单 |
| Tablet | 640px - 1024px | 单列布局，更宽内容区 |
| Desktop | > 1024px | 双栏布局（侧边月历 + 右侧时间线） |

### 响应式 CSS 策略

```css
/* 移动端优先 */
:root {
  --container-width: 100%;
  --sidebar-width: 0;
}

/* 平板 */
@media (min-width: 641px) {
  :root {
    --container-width: 720px;
  }
}

/* 桌面 */
@media (min-width: 1025px) {
  :root {
    --container-width: 1200px;
    --sidebar-width: 280px;
  }
}
```

### 移动端特性

- 底部固定的新建按钮 (FAB)
- 表单全屏弹窗
- 筛选栏可折叠/展开
- 更大的触摸区域 (44px+)
- 手势支持（滑动删除）

### 桌面端特性

- 左侧固定侧边栏（月份快速导航）
- 右侧时间线区域
- 更大的内容展示空间
- 鼠标悬停效果

---

## 阶段 1：项目初始化

### Task 1: 初始化 Vite + React + TypeScript 项目

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `index.html`

**Step 1: 创建项目结构**

```bash
npm create vite@latest . -- --template react-ts
```

**Step 2: 安装依赖**

```bash
npm install @relax-state/react dexie uuid
npm install -D @types/uuid
```

**Step 3: 验证项目可运行**

```bash
npm run dev
```
Expected: Vite dev server starts successfully

**Step 4: Commit**

```bash
git add .
git commit -m "chore: initialize Vite + React + TypeScript project"
```

---

### Task 2: 配置项目基础结构

**Files:**
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/vite-env.d.ts`

**Step 1: 创建入口文件**

```typescript
// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

**Step 2: 创建 App 根组件**

```typescript
// src/App.tsx
import { StateProvider } from '@relax-state/react'

function App() {
  return (
    <StateProvider>
      <div>Hello Records</div>
    </StateProvider>
  )
}

export default App
```

**Step 3: 创建基础样式**

```css
/* src/index.css */
:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}
```

**Step 4: 验证构建**

```bash
npm run build
```
Expected: Build successful with no errors

**Step 5: Commit**

```bash
git add .
git commit -m "chore: add project entry files and basic structure"
```

---

## 阶段 2：数据层

### Task 3: 定义 TypeScript 类型和数据结构

**Files:**
- Create: `src/types/index.ts`

**Step 1: 定义 Record 类型**

```typescript
// src/types/index.ts

export type RecordStatus = 'pending' | 'in_progress' | 'completed';

export type Achievement = 'below' | 'met' | 'exceeded';

export interface Review {
  achievement: Achievement;
  details: string;
}

export interface Record {
  id: string;
  content: string;
  images: string[];
  tags: string[];
  status: RecordStatus;
  plannedStartTime?: Date;
  plannedEndTime?: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
  review?: Review;
  createdAt: Date;
  updatedAt: Date;
}

export type TimelineGranularity = 'day' | 'week' | 'month';

export interface FilterState {
  tags: string[];
  status: RecordStatus | null;
}
```

**Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "types: define Record and related types"
```

---

### Task 4: 实现 IndexedDB 数据层 (Dexie.js)

**Files:**
- Create: `src/db/index.ts`
- Create: `src/db/recordRepository.ts`

**Step 1: 创建数据库实例**

```typescript
// src/db/index.ts
import Dexie, { Table } from 'dexie';
import { Record } from '../types';

export class RecordsDatabase extends Dexie {
  records!: Table<Record>;

  constructor() {
    super('RecordsDB');
    this.version(1).stores({
      records: 'id, status, createdAt, *tags'
    });
  }
}

export const db = new RecordsDatabase();
```

**Step 2: 创建 Repository**

```typescript
// src/db/recordRepository.ts
import { db } from './index';
import { Record, RecordStatus, FilterState } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const recordRepository = {
  async create(data: Omit<Record, 'id' | 'createdAt' | 'updatedAt'>): Promise<Record> {
    const now = new Date();
    const record: Record = {
      ...data,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    await db.records.add(record);
    return record;
  },

  async update(id: string, data: Partial<Record>): Promise<void> {
    await db.records.update(id, { ...data, updatedAt: new Date() });
  },

  async delete(id: string): Promise<void> {
    await db.records.delete(id);
  },

  async getById(id: string): Promise<Record | undefined> {
    return await db.records.get(id);
  },

  async getAll(): Promise<Record[]> {
    return await db.records.orderBy('createdAt').reverse().toArray();
  },

  async getByFilter(filter: FilterState): Promise<Record[]> {
    let collection = db.records.orderBy('createdAt').reverse();

    if (filter.status) {
      collection = collection.filter(r => r.status === filter.status);
    }

    if (filter.tags.length > 0) {
      collection = collection.filter(r =>
        filter.tags.every(tag => r.tags.includes(tag))
      );
    }

    return await collection.toArray();
  },

  async getAllTags(): Promise<string[]> {
    const records = await db.records.toArray();
    const tagSet = new Set<string>();
    records.forEach(r => r.tags.forEach(t => tagSet.add(t)));
    return Array.from(tagSet).sort();
  },

  async getByDateRange(startDate: Date, endDate: Date): Promise<Record[]> {
    return await db.records
      .where('createdAt')
      .between(startDate, endDate)
      .toArray();
  }
};
```

**Step 3: Commit**

```bash
git add src/db/
git commit -m "feat: implement IndexedDB data layer with Dexie"
```

---

## 阶段 3：状态管理

### Task 5: 创建全局状态

**Files:**
- Create: `src/store/recordStore.ts`

**Step 1: 创建记录状态**

```typescript
// src/store/recordStore.ts
import { createStore } from '@relax-state/react';
import { Record, FilterState, TimelineGranularity } from '../types';
import { recordRepository } from '../db/recordRepository';

interface RecordState {
  records: Record[];
  tags: string[];
  filter: FilterState;
  granularity: TimelineGranularity;
  loading: boolean;
}

const initialState: RecordState = {
  records: [],
  tags: [],
  filter: { tags: [], status: null },
  granularity: 'day',
  loading: false,
};

export const recordStore = createStore<RecordState>('records', initialState);

export const recordActions = {
  async loadRecords() {
    recordStore.setState({ loading: true });
    try {
      const records = await recordRepository.getByFilter(recordStore.getState().filter);
      const tags = await recordRepository.getAllTags();
      recordStore.setState({ records, tags, loading: false });
    } catch (error) {
      console.error('Failed to load records:', error);
      recordStore.setState({ loading: false });
    }
  },

  async addRecord(data: Omit<Record, 'id' | 'createdAt' | 'updatedAt'>) {
    await recordRepository.create(data);
    await recordActions.loadRecords();
  },

  async updateRecord(id: string, data: Partial<Record>) {
    await recordRepository.update(id, data);
    await recordActions.loadRecords();
  },

  async deleteRecord(id: string) {
    await recordRepository.delete(id);
    await recordActions.loadRecords();
  },

  setFilter(filter: FilterState) {
    recordStore.setState({ filter });
    recordActions.loadRecords();
  },

  setGranularity(granularity: TimelineGranularity) {
    recordStore.setState({ granularity });
  },
};
```

**Step 2: Commit**

```bash
git add src/store/recordStore.ts
git commit -m "feat: implement global state with @relax-state/react"
```

---

## 阶段 4：组件实现

### Task 6: 创建基础 UI 组件

**Files:**
- Create: `src/components/RecordCard.tsx`
- Create: `src/components/RecordForm.tsx`
- Create: `src/components/FilterBar.tsx`
- Create: `src/components/Timeline.tsx`

**Step 1: 创建 RecordCard 组件**

```tsx
// src/components/RecordCard.tsx
import { Record } from '../types';
import './RecordCard.css';

interface RecordCardProps {
  record: Record;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

function getDaysUntil(date?: Date): number | null {
  if (!date) return null;
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getStatusText(record: Record): string {
  const daysUntilStart = getDaysUntil(record.plannedStartTime);
  const daysUntilEnd = getDaysUntil(record.plannedEndTime);

  if (record.status === 'pending') {
    if (daysUntilStart !== null && daysUntilStart < 0) {
      return '已超期';
    }
    return daysUntilStart !== null ? `${daysUntilStart}天后开始` : '未开始';
  }

  if (record.status === 'in_progress') {
    if (daysUntilEnd !== null && daysUntilEnd < 0) {
      return '已超期';
    }
    return daysUntilEnd !== null ? `${daysUntilEnd}天后结束` : '进行中';
  }

  return '已完成';
}

function isOverdue(record: Record): boolean {
  if (record.status === 'pending' && record.plannedStartTime) {
    return new Date() > record.plannedStartTime;
  }
  if (record.status === 'in_progress' && record.plannedEndTime) {
    return new Date() > record.plannedEndTime;
  }
  return false;
}

export function RecordCard({ record, onEdit, onDelete }: RecordCardProps) {
  const statusText = getStatusText(record);
  const overdue = isOverdue(record);

  return (
    <div className={`record-card ${overdue ? 'overdue' : ''}`}>
      <div className="record-header">
        <span className={`status-badge ${record.status}`}>{statusText}</span>
        <div className="actions">
          <button onClick={() => onEdit(record.id)}>编辑</button>
          <button onClick={() => onDelete(record.id)}>删除</button>
        </div>
      </div>
      <div className="record-content">{record.content}</div>
      {record.images.length > 0 && (
        <div className="record-images">
          {record.images.map((img, i) => (
            <img key={i} src={img} alt="" />
          ))}
        </div>
      )}
      <div className="record-tags">
        {record.tags.map(tag => (
          <span key={tag} className="tag">{tag}</span>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: 创建 RecordCard 样式**

```css
/* src/components/RecordCard.css */
.record-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.record-card.overdue {
  border-left: 4px solid #e74c3c;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.pending { background: #e0e0e0; }
.status-badge.in_progress { background: #fff3cd; }
.status-badge.completed { background: #d4edda; }

.actions button {
  margin-left: 8px;
  padding: 4px 8px;
  border: none;
  background: transparent;
  cursor: pointer;
}

.record-content {
  margin-bottom: 8px;
}

.record-images {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.record-images img {
  max-width: 100px;
  max-height: 100px;
  object-fit: cover;
  border-radius: 4px;
}

.record-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.tag {
  background: #e3f2fd;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}
```

**Step 3: Commit**

```bash
git add src/components/
git commit -m "feat: add RecordCard component"
```

---

### Task 7: 创建记录表单组件

**Files:**
- Modify: `src/components/RecordForm.tsx`
- Create: `src/components/RecordForm.css`

**Step 1: 创建表单组件**

```tsx
// src/components/RecordForm.tsx
import { useState, useEffect } from 'react';
import { Record, RecordStatus, Achievement } from '../types';
import { recordActions } from '../store/recordStore';
import './RecordForm.css';

interface RecordFormProps {
  record?: Record;
  existingTags: string[];
  onClose: () => void;
}

export function RecordForm({ record, existingTags, onClose }: RecordFormProps) {
  const [content, setContent] = useState(record?.content || '');
  const [tags, setTags] = useState<string[]>(record?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [images, setImages] = useState<string[]>(record?.images || []);
  const [status, setStatus] = useState<RecordStatus>(record?.status || 'pending');
  const [plannedStartTime, setPlannedStartTime] = useState(
    record?.plannedStartTime?.toISOString().slice(0, 16) || ''
  );
  const [plannedEndTime, setPlannedEndTime] = useState(
    record?.plannedEndTime?.toISOString().slice(0, 16) || ''
  );
  const [reviewAchievement, setReviewAchievement] = useState<Achievement | ''>(
    record?.review?.achievement || ''
  );
  const [reviewDetails, setReviewDetails] = useState(record?.review?.details || '');

  const handleAddTag = () => {
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleStatusChange = (newStatus: RecordStatus) => {
    const now = new Date();
    if (newStatus === 'in_progress' && !record?.actualStartTime) {
      setPlannedStartTime(now.toISOString().slice(0, 16));
    }
    if (newStatus === 'completed' && !record?.actualEndTime) {
      setPlannedEndTime(now.toISOString().slice(0, 16));
    }
    setStatus(newStatus);
  };

  const handleSubmit = async () => {
    const data = {
      content,
      tags,
      images,
      status,
      plannedStartTime: plannedStartTime ? new Date(plannedStartTime) : undefined,
      plannedEndTime: plannedEndTime ? new Date(plannedEndTime) : undefined,
      actualStartTime: record?.actualStartTime,
      actualEndTime: record?.actualEndTime,
      review: reviewAchievement ? {
        achievement: reviewAchievement as Achievement,
        details: reviewDetails,
      } : undefined,
    };

    if (record) {
      await recordActions.updateRecord(record.id, data);
    } else {
      await recordActions.addRecord(data);
    }
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="record-form">
        <h2>{record ? '编辑记录' : '新建记录'}</h2>

        <div className="form-group">
          <label>内容</label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="记录内容..."
          />
        </div>

        <div className="form-group">
          <label>图片</label>
          <input type="file" accept="image/*" multiple onChange={handleImageUpload} />
          {images.length > 0 && (
            <div className="image-preview">
              {images.map((img, i) => (
                <div key={i} className="preview-item">
                  <img src={img} alt="" />
                  <button onClick={() => setImages(images.filter((_, idx) => idx !== i))}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Tag</label>
          <div className="tag-input">
            <input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddTag()}
              placeholder="输入 Tag 后按回车"
            />
            <button onClick={handleAddTag}>添加</button>
          </div>
          <div className="tag-list">
            {tags.map(tag => (
              <span key={tag} className="tag" onClick={() => handleRemoveTag(tag)}>
                {tag} ×
              </span>
            ))}
          </div>
          {existingTags.length > 0 && (
            <div className="existing-tags">
              <span>已有 Tag:</span>
              {existingTags.filter(t => !tags.includes(t)).map(tag => (
                <button key={tag} onClick={() => setTags([...tags, tag])}>{tag}</button>
              ))}
            </div>
          )}
        </div>

        <div className="form-group">
          <label>状态</label>
          <select value={status} onChange={e => handleStatusChange(e.target.value as RecordStatus)}>
            <option value="pending">未开始</option>
            <option value="in_progress">进行中</option>
            <option value="completed">已完成</option>
          </select>
        </div>

        <div className="form-group">
          <label>计划开始时间</label>
          <input
            type="datetime-local"
            value={plannedStartTime}
            onChange={e => setPlannedStartTime(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>计划结束时间</label>
          <input
            type="datetime-local"
            value={plannedEndTime}
            onChange={e => setPlannedEndTime(e.target.value)}
          />
        </div>

        {status === 'completed' && (
          <div className="form-group">
            <label>复盘信息</label>
            <div className="review-section">
              <label>计划达成</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="achievement"
                    value="below"
                    checked={reviewAchievement === 'below'}
                    onChange={e => setReviewAchievement(e.target.value as Achievement)}
                  />
                  未达预期
                </label>
                <label>
                  <input
                    type="radio"
                    name="achievement"
                    value="met"
                    checked={reviewAchievement === 'met'}
                    onChange={e => setReviewAchievement(e.target.value as Achievement)}
                  />
                  达成预期
                </label>
                <label>
                  <input
                    type="radio"
                    name="achievement"
                    value="exceeded"
                    checked={reviewAchievement === 'exceeded'}
                    onChange={e => setReviewAchievement(e.target.value as Achievement)}
                  />
                  超出预期
                </label>
              </div>
              <label>详细总结</label>
              <textarea
                value={reviewDetails}
                onChange={e => setReviewDetails(e.target.value)}
                placeholder="总结原因..."
              />
            </div>
          </div>
        )}

        <div className="form-actions">
          <button onClick={onClose}>取消</button>
          <button className="primary" onClick={handleSubmit}>保存</button>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: 创建表单样式**

```css
/* src/components/RecordForm.css */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.record-form {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-group textarea {
  min-height: 100px;
}

.tag-input {
  display: flex;
  gap: 8px;
}

.tag-input input {
  flex: 1;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
}

.tag-list .tag {
  background: #e3f2fd;
  padding: 2px 8px;
  border-radius: 4px;
  cursor: pointer;
}

.existing-tags {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.existing-tags button {
  background: #f5f5f5;
  border: none;
  padding: 2px 8px;
  border-radius: 4px;
  cursor: pointer;
}

.image-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.preview-item {
  position: relative;
}

.preview-item img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
}

.preview-item button {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: none;
  background: #e74c3c;
  color: #fff;
  cursor: pointer;
}

.radio-group {
  display: flex;
  gap: 16px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 24px;
}

.form-actions button {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.form-actions button.primary {
  background: #2196f3;
  color: #fff;
  border: none;
}

/* 响应式表单样式 */

/* 移动端：全屏弹窗 */
@media (max-width: 640px) {
  .modal-overlay {
    align-items: flex-end;
  }

  .record-form {
    width: 100%;
    max-width: 100%;
    max-height: 95vh;
    border-radius: 20px 20px 0 0;
    padding: 20px;
    animation: slideUp 0.3s ease;
  }

  @keyframes slideUp {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }

  .form-group input,
  .form-group textarea,
  .form-group select {
    padding: 12px;
    font-size: 16px; /* 防止 iOS 缩放 */
  }

  .radio-group {
    flex-direction: column;
    gap: 8px;
  }

  .form-actions {
    position: sticky;
    bottom: 0;
    background: #fff;
    padding-top: 16px;
    margin: 0 -20px -20px -20px;
    padding: 16px 20px;
  }
}

/* 桌面端：居中弹窗 */
@media (min-width: 641px) {
  .record-form {
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
}
```

**Step 3: Commit**

```bash
git add src/components/RecordForm.tsx src/components/RecordForm.css
git commit -m "feat: add RecordForm component"
```

---

### Task 8: 创建筛选和时间线组件

**Files:**
- Modify: `src/components/FilterBar.tsx`
- Modify: `src/components/Timeline.tsx`

**Step 1: 创建筛选栏**

```tsx
// src/components/FilterBar.tsx
import { FilterState, RecordStatus, TimelineGranularity } from '../types';
import './FilterBar.css';

interface FilterBarProps {
  filter: FilterState;
  tags: string[];
  granularity: TimelineGranularity;
  onFilterChange: (filter: FilterState) => void;
  onGranularityChange: (granularity: TimelineGranularity) => void;
}

export function FilterBar({
  filter,
  tags,
  granularity,
  onFilterChange,
  onGranularityChange,
}: FilterBarProps) {
  const handleTagToggle = (tag: string) => {
    const newTags = filter.tags.includes(tag)
      ? filter.tags.filter(t => t !== tag)
      : [...filter.tags, tag];
    onFilterChange({ ...filter, tags: newTags });
  };

  const handleStatusChange = (status: RecordStatus | null) => {
    onFilterChange({ ...filter, status });
  };

  return (
    <div className="filter-bar">
      <div className="filter-section">
        <label>状态</label>
        <div className="filter-buttons">
          <button
            className={filter.status === null ? 'active' : ''}
            onClick={() => handleStatusChange(null)}
          >
            全部
          </button>
          <button
            className={filter.status === 'pending' ? 'active' : ''}
            onClick={() => handleStatusChange('pending')}
          >
            未开始
          </button>
          <button
            className={filter.status === 'in_progress' ? 'active' : ''}
            onClick={() => handleStatusChange('in_progress')}
          >
            进行中
          </button>
          <button
            className={filter.status === 'completed' ? 'active' : ''}
            onClick={() => handleStatusChange('completed')}
          >
            已完成
          </button>
        </div>
      </div>

      <div className="filter-section">
        <label>Tag</label>
        <div className="filter-tags">
          {tags.map(tag => (
            <button
              key={tag}
              className={filter.tags.includes(tag) ? 'active' : ''}
              onClick={() => handleTagToggle(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <label>时间粒度</label>
        <div className="filter-buttons">
          <button
            className={granularity === 'day' ? 'active' : ''}
            onClick={() => onGranularityChange('day')}
          >
            按天
          </button>
          <button
            className={granularity === 'week' ? 'active' : ''}
            onClick={() => onGranularityChange('week')}
          >
            按周
          </button>
          <button
            className={granularity === 'month' ? 'active' : ''}
            onClick={() => onGranularityChange('month')}
          >
            按月
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: 创建时间线组件**

```tsx
// src/components/Timeline.tsx
import { Record, TimelineGranularity } from '../types';
import { RecordCard } from './RecordCard';
import './Timeline.css';

interface TimelineProps {
  records: Record[];
  granularity: TimelineGranularity;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

function getGroupKey(date: Date, granularity: TimelineGranularity): string {
  const d = new Date(date);
  if (granularity === 'day') {
    return d.toISOString().slice(0, 10);
  }
  if (granularity === 'week') {
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    return weekStart.toISOString().slice(0, 10);
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatGroupKey(key: string, granularity: TimelineGranularity): string {
  if (granularity === 'day') {
    const date = new Date(key);
    return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
  }
  if (granularity === 'week') {
    const date = new Date(key);
    return `${date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })} 周`;
  }
  const [year, month] = key.split('-');
  return `${year}年${parseInt(month)}月`;
}

export function Timeline({ records, granularity, onEdit, onDelete }: TimelineProps) {
  const groups = records.reduce((acc, record) => {
    const key = getGroupKey(new Date(record.createdAt), granularity);
    if (!acc[key]) acc[key] = [];
    acc[key].push(record);
    return acc;
  }, {} as Record<string, Record[]>);

  const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  return (
    <div className="timeline">
      {sortedKeys.map(key => (
        <div key={key} className="timeline-group">
          <div className="timeline-header">{formatGroupKey(key, granularity)}</div>
          <div className="timeline-content">
            {groups[key].map(record => (
              <RecordCard
                key={record.id}
                record={record}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      ))}
      {records.length === 0 && (
        <div className="empty-state">暂无记录</div>
      )}
    </div>
  );
}
```

**Step 3: 创建样式文件**

```css
/* src/components/FilterBar.css */
.filter-bar {
  background: #fff;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.filter-section {
  margin-bottom: 12px;
}

.filter-section:last-child {
  margin-bottom: 0;
}

.filter-section label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.filter-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-buttons button,
.filter-tags button {
  padding: 4px 12px;
  border: 1px solid #ddd;
  border-radius: 16px;
  background: #fff;
  cursor: pointer;
  font-size: 12px;
}

.filter-buttons button.active,
.filter-tags button.active {
  background: #2196f3;
  color: #fff;
  border-color: #2196f3;
}

.filter-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* 响应式筛选栏 */

/* 移动端 */
@media (max-width: 640px) {
  .filter-bar {
    padding: 12px;
    border-radius: 0;
    margin: 0 -16px 16px -16px;
    border-bottom: 1px solid #eee;
  }

  .filter-buttons button,
  .filter-tags button {
    padding: 8px 14px;
    font-size: 13px;
    min-height: 36px;
  }
}

/* 桌面端 */
@media (min-width: 1025px) {
  .filter-bar {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }

  .filter-section {
    margin-bottom: 0;
  }
}
```

/* src/components/Timeline.css */
.timeline {
  padding: 8px;
}

.timeline-group {
  margin-bottom: 24px;
}

.timeline-header {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
  margin-bottom: 12px;
}

.timeline-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.empty-state {
  text-align: center;
  padding: 48px;
  color: #999;
}

/* 响应式时间线 */

/* 移动端 */
@media (max-width: 640px) {
  .timeline {
    padding: 0;
  }

  .timeline-header {
    font-size: 13px;
    padding: 12px 16px;
    background: #f9f9f9;
    margin: 0 -16px 12px -16px;
  }
}

/* 桌面端 */
@media (min-width: 1025px) {
  .timeline-group {
    display: grid;
    grid-template-columns: 80px 1fr;
    gap: 16px;
  }

  .timeline-header {
    text-align: right;
    border: none;
    padding: 12px 0;
  }
}
```

**Step 4: Commit**

```bash
git add src/components/FilterBar.tsx src/components/Timeline.tsx
git add src/components/FilterBar.css src/components/Timeline.css
git commit -m "feat: add FilterBar and Timeline components"
```

---

## 阶段 5：复盘页面

### Task 9: 创建复盘页面

**Files:**
- Create: `src/pages/ReviewPage.tsx`
- Create: `src/pages/ReviewPage.css`

**Step 1: 创建复盘页面组件**

```tsx
// src/pages/ReviewPage.tsx
import { useState, useMemo } from 'react';
import { Record } from '../types';
import './ReviewPage.css';

interface ReviewPageProps {
  records: Record[];
  allTags: string[];
  onBack: () => void;
}

type DelayStatus = 'delayed' | 'on_time' | 'early';

function calculateDelayStatus(record: Record): DelayStatus | null {
  if (!record.plannedEndTime || !record.actualEndTime) return null;
  const planned = record.plannedEndTime.getTime();
  const actual = record.actualEndTime.getTime();
  const diff = actual - planned;
  const oneDay = 24 * 60 * 60 * 1000;

  if (diff > oneDay) return 'delayed';
  if (diff < -oneDay) return 'early';
  return 'on_time';
}

export function ReviewPage({ records, allTags, onBack }: ReviewPageProps) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const [startMonth, setStartMonth] = useState(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`);
  const [endMonth, setEndMonth] = useState(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const filteredRecords = useMemo(() => {
    const [startYear, startM] = startMonth.split('-').map(Number);
    const [endYear, endM] = endMonth.split('-').map(Number);

    return records.filter(record => {
      const recordDate = new Date(record.createdAt);
      const monthKey = `${recordDate.getFullYear()}-${String(recordDate.getMonth() + 1).padStart(2, '0')}`;

      if (monthKey < startMonth || monthKey > endMonth) return false;

      if (selectedTags.length > 0) {
        return selectedTags.every(tag => record.tags.includes(tag));
      }

      return true;
    });
  }, [records, startMonth, endMonth, selectedTags]);

  const stats = useMemo(() => {
    const completed = filteredRecords.filter(r => r.status === 'completed');
    const delayed = completed.filter(r => calculateDelayStatus(r) === 'delayed').length;
    const onTime = completed.filter(r => calculateDelayStatus(r) === 'on_time').length;
    const early = completed.filter(r => calculateDelayStatus(r) === 'early').length;
    const below = completed.filter(r => r.review?.achievement === 'below').length;
    const met = completed.filter(r => r.review?.achievement === 'met').length;
    const exceeded = completed.filter(r => r.review?.achievement === 'exceeded').length;

    return { completed, delayed, onTime, early, below, met, exceeded, total: filteredRecords.length };
  }, [filteredRecords]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="review-page">
      <div className="review-header">
        <button onClick={onBack}>← 返回</button>
        <h1>复盘</h1>
      </div>

      <div className="review-filters">
        <div className="filter-row">
          <label>时间范围</label>
          <div className="month-picker">
            <input
              type="month"
              value={startMonth}
              onChange={e => setStartMonth(e.target.value)}
            />
            <span>至</span>
            <input
              type="month"
              value={endMonth}
              onChange={e => setEndMonth(e.target.value)}
            />
          </div>
        </div>

        <div className="filter-row">
          <label>Tag</label>
          <div className="tag-filters">
            <button
              className={selectedTags.length === 0 ? 'active' : ''}
              onClick={() => setSelectedTags([])}
            >
              全部
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                className={selectedTags.includes(tag) ? 'active' : ''}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="review-stats">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">总记录数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.completed.length}</div>
          <div className="stat-label">已完成</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.delayed}</div>
          <div className="stat-label">延期</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.onTime}</div>
          <div className="stat-label">按期</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.early}</div>
          <div className="stat-label">提前</div>
        </div>
      </div>

      <div className="review-achievement">
        <h3>计划达成</h3>
        <div className="achievement-bars">
          <div className="achievement-item">
            <span>未达预期</span>
            <div className="bar">
              <div
                className="bar-fill below"
                style={{ width: `${(stats.below / stats.completed.length) * 100 || 0}%` }}
              />
            </div>
            <span>{stats.below}</span>
          </div>
          <div className="achievement-item">
            <span>达成预期</span>
            <div className="bar">
              <div
                className="bar-fill met"
                style={{ width: `${(stats.met / stats.completed.length) * 100 || 0}%` }}
              />
            </div>
            <span>{stats.met}</span>
          </div>
          <div className="achievement-item">
            <span>超出预期</span>
            <div className="bar">
              <div
                className="bar-fill exceeded"
                style={{ width: `${(stats.exceeded / stats.completed.length) * 100 || 0}%` }}
              />
            </div>
            <span>{stats.exceeded}</span>
          </div>
        </div>
      </div>

      <div className="review-details">
        <h3>详细记录</h3>
        {stats.completed.map(record => {
          const delayStatus = calculateDelayStatus(record);
          return (
            <div key={record.id} className="review-item">
              <div className="review-item-header">
                <span className="review-tags">
                  {record.tags.map(t => <span key={t} className="tag">{t}</span>)}
                </span>
                <span className={`delay-status ${delayStatus}`}>
                  {delayStatus === 'delayed' && '延期'}
                  {delayStatus === 'on_time' && '按期'}
                  {delayStatus === 'early' && '提前'}
                </span>
              </div>
              <div className="review-item-content">{record.content}</div>
              {record.review && (
                <div className="review-item-review">
                  <span className={`achievement ${record.review.achievement}`}>
                    {record.review.achievement === 'below' && '未达预期'}
                    {record.review.achievement === 'met' && '达成预期'}
                    {record.review.achievement === 'exceeded' && '超出预期'}
                  </span>
                  {record.review.details && (
                    <p>{record.review.details}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

**Step 2: 创建复盘页面样式**

```css
/* src/pages/ReviewPage.css */
.review-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 16px;
}

.review-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.review-header button {
  padding: 8px 16px;
  border: none;
  background: #f5f5f5;
  border-radius: 4px;
  cursor: pointer;
}

.review-filters {
  background: #fff;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;
}

.filter-row {
  margin-bottom: 16px;
}

.filter-row:last-child {
  margin-bottom: 0;
}

.filter-row label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.month-picker {
  display: flex;
  align-items: center;
  gap: 8px;
}

.month-picker input {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.tag-filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag-filters button {
  padding: 4px 12px;
  border: 1px solid #ddd;
  border-radius: 16px;
  background: #fff;
  cursor: pointer;
}

.tag-filters button.active {
  background: #2196f3;
  color: #fff;
  border-color: #2196f3;
}

.review-stats {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.stat-card {
  background: #fff;
  padding: 16px;
  border-radius: 8px;
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

.review-achievement {
  background: #fff;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;
}

.review-achievement h3 {
  margin: 0 0 16px 0;
}

.achievement-bars {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.achievement-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.achievement-item span:first-child {
  width: 80px;
}

.achievement-item span:last-child {
  width: 30px;
  text-align: right;
}

.bar {
  flex: 1;
  height: 24px;
  background: #f5f5f5;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  transition: width 0.3s;
}

.bar-fill.below { background: #e74c3c; }
.bar-fill.met { background: #f39c12; }
.bar-fill.exceeded { background: #27ae60; }

.review-details h3 {
  margin-bottom: 16px;
}

.review-item {
  background: #fff;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 12px;
}

.review-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.review-tags {
  display: flex;
  gap: 4px;
}

.review-tags .tag {
  background: #e3f2fd;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.delay-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}

.delay-status.delayed { background: #fadbd8; color: #e74c3c; }
.delay-status.on_time { background: #fdebd0; color: #f39c12; }
.delay-status.early { background: #d5f5e3; color: #27ae60; }

.review-item-content {
  margin-bottom: 8px;
}

.review-item-review {
  padding-top: 8px;
  border-top: 1px solid #eee;
}

.review-item-review .achievement {
  display: inline-block;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  margin-bottom: 4px;
}

.review-item-review .achievement.below { background: #fadbd8; color: #e74c3c; }
.review-item-review .achievement.met { background: #fdebd0; color: #f39c12; }
.review-item-review .achievement.exceeded { background: #d5f5e3; color: #27ae60; }

.review-item-review p {
  margin: 8px 0 0 0;
  font-size: 14px;
  color: #666;
}
```

**Step 3: Commit**

```bash
git add src/pages/ReviewPage.tsx src/pages/ReviewPage.css
git commit -m "feat: add ReviewPage component"
```

---

## 阶段 6：集成主页面

### Task 10: 集成主页面

**Files:**
- Modify: `src/App.tsx`

**Step 1: 更新 App 组件**

```tsx
// src/App.tsx
import { useState, useEffect } from 'react';
import { StateProvider } from '@relax-state/react';
import { FilterBar } from './components/FilterBar';
import { Timeline } from './components/Timeline';
import { RecordForm } from './components/RecordForm';
import { ReviewPage } from './pages/ReviewPage';
import { recordStore, recordActions } from './store/recordStore';
import { FilterState } from './types';
import './App.css';

function App() {
  const state = recordStore.useState();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    recordActions.loadRecords();
  }, []);

  const handleFilterChange = (filter: FilterState) => {
    recordActions.setFilter(filter);
  };

  const handleGranularityChange = (granularity: 'day' | 'week' | 'month') => {
    recordActions.setGranularity(granularity);
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定删除这条记录吗？')) {
      await recordActions.deleteRecord(id);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const editingRecord = editingId ? state.records.find(r => r.id === editingId) : undefined;

  if (showReview) {
    return (
      <StateProvider>
        <ReviewPage
          records={state.records}
          allTags={state.tags}
          onBack={() => setShowReview(false)}
        />
      </StateProvider>
    );
  }

  return (
    <StateProvider>
      <div className="app">
        <header className="app-header">
          <h1>记录</h1>
          <div className="header-actions">
            <button onClick={() => setShowReview(true)}>复盘</button>
            <button className="primary" onClick={() => setShowForm(true)}>新建</button>
          </div>
        </header>

        <main className="app-main">
          <FilterBar
            filter={state.filter}
            tags={state.tags}
            granularity={state.granularity}
            onFilterChange={handleFilterChange}
            onGranularityChange={handleGranularityChange}
          />

          <Timeline
            records={state.records}
            granularity={state.granularity}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </main>

        {showForm && (
          <RecordForm
            record={editingRecord}
            existingTags={state.tags}
            onClose={handleCloseForm}
          />
        )}
      </div>
    </StateProvider>
  );
}

export default App;
```

**Step 2: 创建 App 样式**

```css
/* src/App.css */

/* 响应式变量 - 移动端优先 */
:root {
  --app-max-width: 100%;
  --app-padding: 16px;
  --fab-size: 56px;
  --fab-bottom: 24px;
  --fab-right: 24px;
}

/* 平板 */
@media (min-width: 641px) {
  :root {
    --app-max-width: 720px;
  }
}

/* 桌面 */
@media (min-width: 1025px) {
  :root {
    --app-max-width: 1200px;
    --app-padding: 32px;
  }
}

.app {
  max-width: var(--app-max-width);
  margin: 0 auto;
  padding: var(--app-padding);
  min-height: 100vh;
  background: #f5f5f5;
}

/* 桌面双栏布局 */
@media (min-width: 1025px) {
  .app {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 32px;
  }

  .app-header {
    grid-column: 1 / -1;
  }

  .sidebar {
    /* 侧边栏：月份导航 */
  }

  .app-main {
    /* 时间线区域 */
  }
}

/* 移动端单栏 */
@media (max-width: 1024px) {
  .app {
    padding-bottom: 100px; /* 给 FAB 留空间 */
  }
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.app-header h1 {
  margin: 0;
  font-size: 24px;
}

/* 移动端 header 更紧凑 */
@media (max-width: 640px) {
  .app-header {
    margin-bottom: 16px;
  }

  .app-header h1 {
    font-size: 20px;
  }
}

.header-actions {
  display: flex;
  gap: 8px;
}

.header-actions button {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
}

.header-actions button.primary {
  background: #2196f3;
  color: #fff;
  border-color: #2196f3;
}

/* 桌面端隐藏 FAB，使用 header 按钮 */
@media (min-width: 1025px) {
  .fab-button {
    display: none;
  }
}

/* 移动端 FAB 按钮 */
.fab-button {
  position: fixed;
  bottom: var(--fab-bottom);
  right: var(--fab-right);
  width: var(--fab-size);
  height: var(--fab-size);
  border-radius: 50%;
  background: #2196f3;
  color: #fff;
  border: none;
  box-shadow: 0 4px 16px rgba(33, 150, 243, 0.4);
  cursor: pointer;
  font-size: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s, box-shadow 0.2s;
  z-index: 100;
}

.fab-button:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 24px rgba(33, 150, 243, 0.5);
}

.app-main {
  min-height: calc(100vh - 100px);
}
```

**Step 3: Commit**

```bash
git add src/App.tsx src/App.css
git commit -m "feat: integrate main App with all components"
```

---

## 阶段 7：PWA 配置

### Task 11: 配置 PWA

**Files:**
- Create: `public/manifest.json`
- Create: `public/icons/icon-192.png`
- Create: `public/icons/icon-512.png`

**Step 1: 创建 manifest.json**

```json
{
  "name": "生活记录",
  "short_name": "记录",
  "description": "日常生活记录工具",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2196f3",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**Step 2: 更新 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#2196f3" />
    <meta name="description" content="日常生活记录工具" />
    <link rel="manifest" href="/manifest.json" />
    <link rel="apple-touch-icon" href="/icons/icon-192.png" />
    <title>生活记录</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Step 3: Commit**

```bash
git add public/manifest.json index.html
git commit -feat: add PWA configuration"
```

---

## 阶段 8：测试与验证

### Task 12: 验证应用功能

**Step 1: 运行开发服务器**

```bash
npm run dev
```

**Step 2: 验证构建**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add .
git commit - "feat: complete all features"
```

---

## 执行选项

**Plan complete and saved to `docs/plans/2026-02-23-lifestyle-records-design.md`. Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
