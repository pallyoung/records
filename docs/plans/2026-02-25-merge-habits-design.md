# 事务与习惯合并及样式优化设计方案

**日期**: 2026-02-25
**主题**: 合并习惯功能到事务、优化样式、移除筛选功能

## 需求背景

1. **个人中心样式优化** - 采用卡片网格布局
2. **习惯与事务合并** - 统一入口，便捷使用
3. **样式优化** - 缩小卡片和Dashboard尺寸
4. **移除筛选功能** - 后续重新规划
5. **UI风格对齐** - 参考现代深色主题App设计

---

## UI风格参考

### App整体UI风格
参考：现代深色主题任务管理App

**特点**：
- 深色主题背景 (#121212 炭黑色)
- 现代简洁设计，大量留白
- 大量圆角 (卡片、按钮、进度条)
- 鲜艳accent色突出重要元素
- 卡片式布局组织信息
- 简洁线条图标
- 陶土色作为现有App的accent色保持不变

### 个人中心样式
参考：粉色系个人中心设计

**布局**：4x2 功能图标网格（两行四列）
**样式**：
- 大图标 + 简洁文字
- 圆角卡片设计
- 柔和阴影
- 保持陶土色调accent

---

## 设计方案

### 1. 个人中心样式优化

**布局**：4x2 图标网格（2行4列）
**样式**：
- 大图标 (32-40px) + 简洁文字
- 圆角卡片设计
- 柔和阴影效果
- 陶土色accent保持
- 整体深色主题背景

---

### 2. 事务与习惯合并

#### 2.1 创建流程

在新建事务表单中添加「事务类型」切换开关：
- **普通事务**：现有功能不变
- **循环事务**：显示周期配置选项

#### 2.2 循环周期配置

| 周期类型 | 配置项 | 说明 |
|---------|--------|------|
| 每天 | 无 | 每日重置 |
| 每周 | 选择周一到周日 | 每周指定日期重置 |
| 每月 | 选择日期(1-28) | 每月指定日期重置 |
| 每几天 | 天数(2-30) | 每N天重置 |
| 每几小时 | 小时数(2-48) | 每N小时重置 |

#### 2.3 循环事务数据模型

```typescript
interface Record {
  // ... 现有字段
  type: 'normal' | 'recurring';  // 事务类型
  recurringConfig?: {             // 循环配置（仅循环事务）
    frequency: 'daily' | 'weekly' | 'monthly' | 'interval_days' | 'interval_hours';
    daysOfWeek?: number[];        // 每周几 (0-6)
    dayOfMonth?: number;          // 每月几号 (1-28)
    intervalValue?: number;        // 自定义间隔值
    totalCompletions: number;      // 累计完成次数
    lastResetDate?: string;       // 上次重置日期
  };
}
```

#### 2.4 循环逻辑

**自动重置触发条件：**
- 每天：当前日期 ≠ lastResetDate
- 每周：当前周几在 daysOfWeek 中 且 ≠ lastResetDate
- 每月：当前日期 = dayOfMonth 且 ≠ lastResetDate
- 每几天：距离上次重置天数 ≥ intervalValue
- 每几小时：距离上次重置小时数 ≥ intervalValue

**重置时：**
1. 将事务状态重置为 pending
2. 更新 lastResetDate 为当前时间

**完成时：**
1. 标记事务为 completed
2. totalCompletions += 1

#### 2.5 循环事务显示

在事务列表中：
- 图标：🔄 标识循环事务
- 文字标签：「每日」「每周」「每月」等
- 显示累计完成次数：「累计15次」

---

### 3. 样式优化

#### 3.1 事务卡片

**修改前：**
- padding: 20px
- margin-bottom: 16px

**修改后：**
- padding: 12px
- margin-bottom: 8px

#### 3.2 Dashboard

**修改前：**
- padding: 16px 20px

**修改后：**
- padding: 8px 12px
- 更紧凑的数字显示

---

### 4. 移除筛选功能

- 从事务页面移除 FilterBar 组件
- 搜索功能暂时保留（可通过快捷键 / 触发）
- 后续重新规划筛选功能

---

## 页面结构

```
App
├── TabBar (底部)
│   ├── 习惯 → 已移除，独立页面功能合并到事务
│   ├── 事务 → RecordsPage
│   │   ├── Dashboard (精简版)
│   │   ├── Timeline (紧凑卡片)
│   │   └── 无 FilterBar
│   └── 个人中心 → ProfileCenterPage (卡片网格)
└── 子页面
    ├── RecordForm (新增循环事务配置)
    ├── SettingsPage
    ├── TagManagementPage
    ├── ReviewPage
    └── DashboardDetail
```

---

## 涉及文件

| 模块 | 文件 | 变更 |
|------|------|------|
| 个人中心 | src/pages/profile-center-page/ | 样式改为卡片网格 |
| 表单 | src/components/record-form/ | 添加事务类型切换 |
| 类型 | src/types/index.ts | 添加循环事务类型 |
| 事务卡片 | src/components/record-card/ | 减小尺寸 |
| Dashboard | src/components/dashboard/ | 减小尺寸 |
| App | src/App.tsx | 移除FilterBar |
| 存储 | src/db/recordRepository.ts | 循环逻辑处理 |

---

## 实现顺序

1. 个人中心样式优化
2. 事务卡片和Dashboard样式缩小
3. 移除FilterBar
4. 添加循环事务类型定义
5. 修改RecordForm添加循环配置
6. 实现循环重置逻辑
7. 循环事务显示标记
