# Navigation Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor app navigation to use bottom tab bar with Habits, Records (renamed to 事务), and Profile Center pages

**Architecture:** Replace header navigation with bottom tab bar, move Dashboard from drawer to top of Records page, create Profile Center page for auxiliary features

**Tech Stack:** React, TypeScript, SCSS modules, Relax state management

---

## Task 1: Create TabBar component

**Files:**
- Create: `src/components/tab-bar/index.tsx`
- Create: `src/components/tab-bar/index.module.scss`

**Step 1: Create TabBar component file**

```tsx
// src/components/tab-bar/index.tsx
import styles from './index.module.scss';

export type TabType = 'habits' | 'records' | 'profile';

interface TabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

interface TabItem {
  id: TabType;
  label: string;
}

const TABS: TabItem[] = [
  { id: 'habits', label: '习惯' },
  { id: 'records', label: '事务' },
  { id: 'profile', label: '个人中心' },
];

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <div className={styles.tabBar}>
      {TABS.map(tab => (
        <button
          key={tab.id}
          className={`${styles.tabItem} ${activeTab === tab.id ? styles.active : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
```

**Step 2: Create TabBar SCSS file**

```scss
// src/components/tab-bar/index.module.scss
.tabBar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 12px 16px;
  background: var(--bg-card);
  border-top: 1px solid var(--accent-tertiary);
  z-index: 100;
}

.tabItem {
  flex: 1;
  padding: 12px 0;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}

.tabItem:hover {
  background: var(--bg-secondary);
}

.tabItem.active {
  color: var(--accent-primary);
  font-weight: 600;
}

@media (min-width: 1025px) {
  .tabBar {
    max-width: 1200px;
    left: 50%;
    transform: translateX(-50%);
  }
}
```

**Step 3: Commit**

```bash
git add src/components/tab-bar/
git commit -m "feat: create TabBar component"
```

---

## Task 2: Create ProfileCenterPage component

**Files:**
- Create: `src/pages/profile-center-page/index.tsx`
- Create: `src/pages/profile-center-page/index.module.scss`

**Step 1: Create ProfileCenterPage component file**

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

      <div className={styles.menuList}>
        {MENU_ITEMS.map(item => (
          <button
            key={item.id}
            className={styles.menuItem}
            onClick={() => onNavigate(item.id)}
          >
            <span className={styles.menuIcon}>{item.icon}</span>
            <span className={styles.menuLabel}>{item.label}</span>
            <span className={styles.menuArrow}>›</span>
          </button>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Create ProfileCenterPage SCSS file**

```scss
// src/pages/profile-center-page/index.module.scss
.profileCenter {
  padding: 24px;
  padding-bottom: 100px; // Space for TabBar
  min-height: 100vh;
  background: var(--bg-primary);
}

.title {
  font-family: var(--font-heading);
  font-size: 28px;
  color: var(--text-primary);
  letter-spacing: 2px;
  margin-bottom: 32px;
}

.menuList {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.menuItem {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  background: var(--bg-card);
  border: 1px solid var(--accent-tertiary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
}

.menuItem:hover {
  background: var(--bg-secondary);
  transform: translateX(2px);
  border-color: var(--accent-secondary);
}

.menuIcon {
  font-size: 20px;
  margin-right: 16px;
}

.menuLabel {
  flex: 1;
  font-size: var(--text-base);
  color: var(--text-primary);
  text-align: left;
}

.menuArrow {
  font-size: 20px;
  color: var(--text-muted);
}

@media (min-width: 1025px) {
  .profileCenter {
    padding: 32px;
  }
}
```

**Step 3: Commit**

```bash
git add src/pages/profile-center-page/
git commit -m "feat: create ProfileCenterPage component"
```

---

## Task 3: Update Dashboard component for top placement

**Files:**
- Modify: `src/components/dashboard/index.tsx`
- Modify: `src/components/dashboard/index.module.scss`

**Step 1: Update Dashboard component to remove expand logic**

```tsx
// src/components/dashboard/index.tsx
import { useMemo } from 'react';
import type { Record } from '../../types';
import styles from './index.module.scss';

interface DashboardProps {
  records: Record[];
  onClick?: () => void;
}

export function Dashboard({ records, onClick }: DashboardProps) {
  // Today stats (existing logic unchanged)
  const todayStats = useMemo(() => {
    const now = new Date();

    const incompleteRecords = records.filter(r => r.status !== 'completed');
    const pending = incompleteRecords.filter(r => r.status === 'pending').length;
    const inProgress = incompleteRecords.filter(r => r.status === 'in_progress').length;
    const completed = records.filter(r => r.status === 'completed').length;

    const delayed = incompleteRecords.filter(r => {
      const plannedStart = r.plannedStartTime || r.createdAt;
      const plannedEnd = r.plannedEndTime ? new Date(r.plannedEndTime) : new Date(r.createdAt);
      plannedEnd.setHours(23, 59, 59, 999);

      if (r.status === 'pending' && now > plannedStart) return true;
      if (r.status === 'in_progress' && now > plannedEnd) return true;
      return false;
    });

    const delayedStart = delayed.filter(r => r.status === 'pending').length;
    const delayedEnd = delayed.filter(r => r.status === 'in_progress').length;

    return { pending, inProgress, completed, incomplete: pending + inProgress, delayedStart, delayedEnd };
  }, [records]);

  return (
    <div className={styles.dashboardBar} onClick={onClick}>
      {/* 今日待完成 */}
      <div className={styles.dashboardSection}>
        <span className={styles.sectionLabel}>今日待完成</span>
        <span className={styles.statNumbers}>
          <span className={styles.num}>{todayStats.incomplete}</span>
          <span className={styles.sep}>/</span>
          <span className={`${styles.num} ${styles.completed}`}>{todayStats.completed}</span>
        </span>
      </div>

      {/* 今日延期 */}
      <div className={styles.dashboardSection}>
        <span className={styles.sectionLabel}>今日延期</span>
        <span className={styles.statNumbers}>
          <span className={`${styles.num} ${styles.delayed}`}>{todayStats.delayedStart}</span>
          <span className={styles.sep}>/</span>
          <span className={`${styles.num} ${styles.delayed}`}>{todayStats.delayedEnd}</span>
        </span>
      </div>
    </div>
  );
}
```

**Step 2: Update Dashboard SCSS for top placement**

```scss
// src/components/dashboard/index.module.scss
// Remove existing styles, replace with:

.dashboardBar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--accent-tertiary);
  margin-bottom: 16px;
  cursor: pointer;
  transition: background 0.2s ease;
  border-radius: var(--radius-md);
}

.dashboardBar:hover {
  background: var(--bg-secondary);
}

.dashboardSection {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 120px;
}

.sectionLabel {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.statNumbers {
  display: flex;
  align-items: center;
  gap: 4px;
}

.num {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
}

.num.completed {
  color: var(--accent-success, #10b981);
}

.num.delayed {
  color: var(--accent-warning, #f59e0b);
}

.sep {
  color: var(--text-muted);
  font-size: 16px;
}

@media (min-width: 1025px) {
  .dashboardBar {
    padding: 20px 24px;
  }

  .num {
    font-size: 24px;
  }
}
```

**Step 3: Commit**

```bash
git add src/components/dashboard/
git commit -m "refactor: update Dashboard for top placement with simplified styles"
```

---

## Task 4: Update App.tsx - Refactor navigation

**Files:**
- Modify: `src/App.tsx`

**Step 1: Update App.tsx with new navigation structure**

```tsx
import { useState, useEffect } from 'react';
import { RelaxProvider, useRelaxValue, store, recordsState, tagsState, filterState, loadingState } from './store/recordStore';
import { FilterBar } from './components/filter-bar';
import { Timeline } from './components/timeline';
import { Dashboard } from './components/dashboard';
import { DashboardDetail } from './components/dashboard-detail';
import { RecordForm } from './components/record-form';
import { ReviewPage } from './pages/review-page';
import { TagManagementPage } from './pages/tag-management-page';
import { HabitsPage } from './pages/habits-page';
import { SettingsPage } from './pages/settings-page';
import { ProfileCenterPage } from './pages/profile-center-page';
import { TabBar, type TabType } from './components/tab-bar';
import { recordActions } from './store/recordStore';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { QuickAdd } from './components/quick-add';
import type { Record, FilterState, RecordStatus } from './types';
';
import './App.css';

function AppContent() {
  const records = useRelaxValue(recordsState);
  const tags = useRelaxValue(tagsState);
  const filter = useRelaxValue(filterState);
  const loading = useRelaxValue(loadingState);

  const [showForm, setShowForm] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Tab navigation
  const [activeTab, setActiveTab] = useState<TabType>('records');

  // Sub-page navigation
  const [showDashboardDetail, setShowDashboardDetail] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showTagManagement, setShowTagManagement] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    recordActions.loadRecords();
  }, []);

  const shortcuts = [
    { key: 'n', handler: () => setShowQuickAdd(true), description: '新建记录' },
    { key: '/', handler: () => document.getElementById('search-input')?.focus(), description: '搜索' },
    { key: 'j', handler: () => setSelectedIndex((i) => Math.min(i + 1, records.length - 1)), description: '下一条' },
    { key: 'k', handler: () => setSelectedIndex((i) => Math.max(i - 1, 0)), description: '上一条' },
    { key: 'Enter', handler: () => records[selectedIndex] && handleEdit(records[selectedIndex].id), description: '编辑' },
    { key: 'Escape', handler: () => { setShowForm(false); setShowDashboardDetail(false); setShowReview(false); setShowTagManagement(false); setShowSettings(false); }, description: '关闭' },
  { key: '1', handler: () => setActiveTab('habits'), description: '切换到习惯' },
  { key: '2', handler: () => setActiveTab('records'), description: '切换到事务' },
  { key: '3', handler: () => setActiveTab('profile'), description: '切换到个人中心' },
  ];

  const shouldEnableShortcuts = !showForm && !showDashboardDetail && !showReview && !showTagManagement && !showSettings;
  useKeyboardShortcuts(shortcuts, shouldEnableShortcuts);

  const handleFilterChange = (newFilter: FilterState) => {
    recordActions.setFilter(newFilter);
  };

  const handleEdit = (id: string) => {
    setActive Tab('records');
    setEditingId(id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定删除这条记录吗？')) {
      await recordActions.deleteRecord(id);
    }
  };

  const handleStatusChange = async (id: string, status: RecordStatus) => {
    await recordActions.updateRecord(id, { status });
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const handleSave = async (data: Omit<Record, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingId) {
      await recordActions.updateRecord(editingId, data);
    } else {
      await recordActions.addRecord(data);
      handleCloseForm();
    }
  };

  const editingRecord = editingId ? records.find((r: Record) => r.id === editingId) : undefined;

  const handleProfileNavigate = (page: string) => {
    switch (page) {
      case 'review':
        setShowReview(true);
        break;
      case 'settings':
        setShowSettings(true);
        break;
      case 'tags':
        setShowTagManagement(true);
        break;
    }
  };

  // Sub-page rendering (full screen overlay)
  if (showDashboardDetail) {
    return (
      <div className="app-full-page">
        <DashboardDetail records={records} />
        <button className="back-button" onClick={() => setShowDashboardDetail(false)}>返回</button>
      </div>
    );
  }

  if (showReview) {
    return (
      <ReviewPage
        records={records}
        allTags={tags}
        onBack={() => setShowReview(false)}
      />
    );
  }

  if (showTagManagement) {
    return (
      <TagManagementPage
        onBack={() => setShowTagManagement(false)}
      />
    );
  }

  if (showSettings) {
    return (
      <SettingsPage
        onBack={() => setShowSettings(false)}
      />
    );
  }

  return (
    <div className="app">
      {/* Tab content */}
      {activeTab === 'habits' && (
        <div className="app-content-with-tabbar">
          <HabitsPage onBack={() => {}} />
        </div>
      )}

      {activeTab === 'records' && (
        <div className="app-content-with-tabbar">
          {!loading && (
            <Dashboard
              records={records}
              onClick={() => setShowDashboardDetail(true)}
            />
          )}
          <FilterBar
            filter={filter}
            tags={tags}
            onFilterChange={handleFilterChange}
          />
          <Timeline
            records={records}
            selectedIndex={selectedIndex}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
          />
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="app-content-with-tabbar">
          <ProfileCenterPage onNavigate={handleProfileNavigate} />
        </div>
      )}

      {/* TabBar - fixed at bottom */}
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* FAB button - only show on records tab */}
      {activeTab === 'records' && (
        <button className="fab-button" onClick={() => setShowForm(true)}>
          +
        </button>
      )}

      {/* Modals */}
      {showForm && (
        <RecordForm
          record={editingRecord}
          existingTags={tags}
          records={records}
          onClose={handleCloseForm}
          onSave={handleSave}
        />
      )}

      <QuickAdd
        visible={showQuickAdd}
        existingTags={tags}
        onClose={() => setShowQuickAdd(false)}
        onSave={async (data) => {
          setActiveTab('records');
          await recordActions.addRecord({
            ...data,
            images: [],
            plannedStartTime: data.status !== 'pending' ? new Date() : undefined,
          });
        }}
      />
    </div>
  );
}

function App() {
  return (
    <RelaxProvider store={store}>
      <AppContent />
    </RelaxProvider>
  );
}

export default App;
```

**Step 2: Commit**

```bash
git add src/App.tsx
git commit -m "refactor: restructure navigation with bottom TabBar"
```

---

## Task 5: Update App.css - Remove old styles, add new

**Files:**
- Modify: `src/App.css`

**Step 1: Update App.css**

```css
/* Application Layout */

.app {
  max-width: var(--app-max-width, 100%);
  margin: 0 auto;
  min-height: 100vh;
  background: var(--bg-primary);
}

.app-content-with-tabbar {
  padding: var(--app-padding, 16px);
  padding-bottom: 80px; /* Space for TabBar */
  min-height: 100vh;
}

/* Desktop layout */
@media (min-width: 1025px) {
  .app {
    max-width: 1200px;
  }

  .app-content-with-tabbar {
    padding: 32px;
    padding-bottom: 100px;
  }
}

/* Full page overlay for DashboardDetail */
.app-full-page {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-primary);
  padding: 24px;
  padding-bottom: 80px;
  overflow-y: auto;
  z-index: 200;
}

.back-button {
  position: fixed;
  top: 24px;
  left: 24px;
  padding: 12.5px 24px;
  background: var(--bg-card);
  color: var(--text-primary);
  border: 1px solid var(--accent-tertiary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 201;
}

.back-button:hover {
  background: var(--bg-secondary);
}

@media (min-width: 1025px) {
  .app-full-page {
    padding: 32px;
  }

  .back-button {
    padding: 16px 32px;
  }
}

/* FAB button - only visible on mobile */
.fab-button {
  position: fixed;
  bottom: 80px;
  right: 24px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--accent-primary);
  color: #fff;
  border: none;
  box-shadow: 0 4px 16px rgba(196, 164, 132, 0.4);
  font-size: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  z-index: 150;
  cursor: pointer;
}

.fab-button:hover {
  transform: scale(1.1) translateY(-2px);
  box-shadow: 0 6px 24px rgba(196, 164, 132, 0.5);
}

.fab-button:active {
  transform: scale(1.05);
}

@media (min-width: 1025px) {
  .fab-button {
    display: none;
  }
}

/* Loading state */
.loading {
  text-align: center;
  padding: 48px;
  color: var(--text-muted);
  font-size: var(--text-base);
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: 64px 24px;
  color: var(--text-muted);
}

.empty-state h3 {
  font-family: var(--font-heading);
  margin-bottom: 8px;
  color: var(--text-secondary);
}
```

**Step 2: Commit**

```bash
git add src/App.css
git commit -m "style: update App.css for new navigation layout"
```

---

## Task 6: Update DashboardDetail page styling for full page view

**Files:**
- Modify: `src/components/dashboard-detail/index.module.scss`

**Step 1: Update DashboardDetail SCSS for full page**

```scss
// Update the .dashboardDetail style to work without drawer context
.dashboardDetail {
  padding-top: 80px; /* Space for back button */
}

// Keep existing styles unchanged...
// (All other styles remain the same)
```

**Step 2: Commit**

```bash
git add src/components/dashboard-detail/index.module.scss
git commit -m "style: adjust DashboardDetail for full page view"
```

---

## Task 7: Update HabitsPage to remove header (since it's now in tab)

**Files:**
- Check: `src/pages/habits-page/index.tsx`

**Step 1: Review HabitsPage and ensure it doesn't have its own header that conflicts**

```bash
# Check if HabitsPage has internal header that needs adjustment
cat src/pages/habits-page/index.tsx
```

**Step 2: If HabitsPage has header, update it to be simpler (remove if redundant)**

```bash
# Based on what's found, adjust as needed
# If no changes needed, skip this step
```

**Step 3: Commit (if changes made)**

```bash
git add src/pages/habits-page/
git commit -m "refactor: adjust HabitsPage for tab navigation context"
```

---

## Task 8: Final verification and testing

**Step 1: Build the application**

```bash
npm run build
```

**Step 2: Run development server**

```bash
npm run dev
```

**Step 3: Manual test checklist**

- [ ] Bottom TabBar visible with 3 tabs: 习惯, 事务, 个人中心
- [ ] Clicking tabs switches views correctly
- [ ] Records tab shows Dashboard at top with stats
- [ ] Clicking Dashboard opens DashboardDetail page
- [ ] Back button returns to Records tab
- [ ] Profile Center shows 3 menu items: 复盘, 设置, 标签管理
- [ ] Each Profile Center menu item navigates to correct page
- [ ] FAB button visible only on Records tab (mobile)
- [ ] Keyboard shortcuts 1, 2, 3 switch tabs
- [ ] Escape closes all modals/sub-pages
- [ ] "n" shortcut for quick add works

**Step 4: Commit final cleanup**

```bash
git add .
git commit -m "chore: final cleanup after navigation refactor"
```

---

## Summary of Changes

| Component | Change |
|-----------|--------|
| TabBar | New component for bottom navigation |
| ProfileCenterPage | New page for auxiliary features |
| Dashboard | Simplified for top placement, removed drawer logic |
| App.tsx | Complete navigation restructure |
| App.css | Removed header styles, added tab-related styles |
| DashboardDetail | Adjusted for full page view |

---

## Migration Notes

- Keyboard shortcuts added: `1`, `2`, `3` for tab switching
- FAB button now only appears on Records tab
- Dashboard click now opens full page instead of drawer
- All existing data models remain unchanged
