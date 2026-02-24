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
import { recordActions } from './store/recordStore';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { KeyboardHints } from './components/keyboard-hints';
import { QuickAdd } from './components/quick-add';
import type { Record, FilterState, RecordStatus } from './types';
import './App.css';

function AppContent() {
  const records = useRelaxValue(recordsState);
  const tags = useRelaxValue(tagsState);
  const filter = useRelaxValue(filterState);
  const loading = useRelaxValue(loadingState);

  const [showForm, setShowForm] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [showTagManagement, setShowTagManagement] = useState(false);
  const [showHabits, setShowHabits] = useState(false);
  const [dashboardExpanded, setDashboardExpanded] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    recordActions.loadRecords();
  }, []);

  // 键盘快捷键
  const shortcuts = [
    { key: 'n', handler: () => setShowQuickAdd(true), description: '新建记录' },
    { key: '/', handler: () => document.getElementById('search-input')?.focus(), description: '搜索' },
    { key: 'j', handler: () => setSelectedIndex((i) => Math.min(i + 1, records.length - 1)), description: '下一条' },
    { key: 'k', handler: () => setSelectedIndex((i) => Math.max(i - 1, 0)), description: '上一条' },
    { key: 'Enter', handler: () => records[selectedIndex] && handleEdit(records[selectedIndex].id), description: '编辑' },
    { key: 'Escape', handler: () => { setShowForm(false); setShowReview(false); setShowTagManagement(false); setShowHabits(false); }, description: '关闭' },
  ];

  useKeyboardShortcuts(shortcuts, !showForm && !showReview && !showTagManagement && !showHabits);

  const handleFilterChange = (newFilter: FilterState) => {
    recordActions.setFilter(newFilter);
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
      // 新建记录保存后关闭表单
      handleCloseForm();
    }
  };

  const editingRecord = editingId ? records.find((r: Record) => r.id === editingId) : undefined;

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

  if (showHabits) {
    return (
      <HabitsPage
        onBack={() => setShowHabits(false)}
      />
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>记录</h1>
        <div className="header-actions">
          <button onClick={() => setShowHabits(true)}>习惯</button>
          <button onClick={() => setShowTagManagement(true)}>标签</button>
          <button onClick={() => setShowReview(true)}>复盘</button>
        </div>
      </header>

      <main className="app-main">
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
      </main>

      {/* Dashboard 展开时的半透明遮罩 */}
      {dashboardExpanded && (
        <div className="dashboard-expanded-overlay" onClick={() => setDashboardExpanded(false)} />
      )}

      {/* Dashboard Drawer - 从底部弹出 */}
      {!loading && (
        <div className={`dashboard-drawer ${dashboardExpanded ? 'open' : ''}`}>
          <Dashboard
            records={records}
            isExpanded={dashboardExpanded}
            onExpandChange={setDashboardExpanded}
          />
          {dashboardExpanded && <DashboardDetail records={records} />}
        </div>
      )}

      {/* 移动端 FAB 按钮 */}
      <button className="fab-button" onClick={() => setShowForm(true)}>
        +
      </button>

      {showForm && (
        <RecordForm
          record={editingRecord}
          existingTags={tags}
          records={records}
          onClose={handleCloseForm}
          onSave={handleSave}
        />
      )}

      {/* 快速记录面板 */}
      <QuickAdd
        visible={showQuickAdd}
        existingTags={tags}
        onClose={() => setShowQuickAdd(false)}
        onSave={async (data) => {
          await recordActions.addRecord({
            ...data,
            images: [],
            plannedStartTime: data.status !== 'pending' ? new Date() : undefined,
          });
        }}
      />

      {/* 键盘快捷键提示栏 */}
      <KeyboardHints />
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
