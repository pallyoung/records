import { useState, useEffect, useMemo } from 'react';
import { RelaxProvider, useRelaxValue, store, recordsState, tagsState, filterState, loadingState } from './store/recordStore';
import { Timeline } from './components/timeline';
import { Dashboard } from './components/dashboard';
import { DashboardDetail } from './components/dashboard-detail';
import { RecordForm } from './components/record-form';
import { ReviewPage } from './pages/review-page';
import { TagManagementPage } from './pages/tag-management-page';
import { HabitsPage } from './pages/habits-page';
import { SettingsPage } from './pages/settings-page';
import { ProfileCenterPage } from './pages/profile-center-page';
import { TabBar, TabType } from './components/tab-bar';
import { recordActions } from './store/recordStore';
import { checkAndResetRecurringRecords } from './db/recordRepository';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
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
  const [showSettings, setShowSettings] = useState(false);
  const [showDashboardDetail, setShowDashboardDetail] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('records');
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    recordActions.loadRecords();
    checkAndResetRecurringRecords();
  }, []);

  const handleEdit = (id: string) => {
    setEditingId(id);
    setShowForm(true);
    setActiveTab('records');
  };

  // 键盘快捷键
  const shortcuts = useMemo(() => [
    { key: 'n', handler: () => setShowQuickAdd(true), description: '新建记录' },
    { key: '/', handler: () => document.getElementById('search-input')?.focus(), description: '搜索' },
    { key: 'j', handler: () => setSelectedIndex((i) => records.length > 0 ? Math.min(i + 1, records.length - 1) : 0), description: '下一条' },
    { key: 'k', handler: () => setSelectedIndex((i) => records.length > 0 ? Math.max(i - 1, 0) : 0), description: '上一条' },
    { key: '1', handler: () => setActiveTab('habits'), description: '切换到习惯' },
    { key: '2', handler: () => setActiveTab('records'), description: '切换到事务' },
    { key: '3', handler: () => setActiveTab('profile'), description: '切换到个人中心' },
    { key: 'Enter', handler: () => records[selectedIndex] && handleEdit(records[selectedIndex].id), description: '编辑' },
    { key: 'Escape', handler: () => { setShowForm(false); setShowReview(false); setShowTagManagement(false); setShowSettings(false); setShowDashboardDetail(false); }, description: '关闭' },
  ], [handleEdit, records.length]);

  useKeyboardShortcuts(shortcuts, !showForm && !showReview && !showTagManagement && !showSettings && !showDashboardDetail);

  const handleFilterChange = (newFilter: FilterState) => {
    recordActions.setFilter(newFilter);
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
      handleCloseForm();
    } else {
      await recordActions.addRecord(data);
      // 新建记录保存后关闭表单
      handleCloseForm();
    }
  };

  const handleProfileNavigate = (page: string) => {
    if (page === 'review') {
      setShowReview(true);
    } else if (page === 'settings') {
      setShowSettings(true);
    } else if (page === 'tags') {
      setShowTagManagement(true);
    }
  };

  const editingRecord = editingId ? records.find((r: Record) => r.id === editingId) : undefined;

  // Sub-pages take over full screen
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

  if (showDashboardDetail) {
    return (
      <div className="app-full-page">
        <DashboardDetail
          records={records}
          onBack={() => setShowDashboardDetail(false)}
        />
      </div>
    );
  }

  return (
    <div className="app">
      {/* Dashboard at top */}
      <Dashboard
        records={records}
        onClick={() => setShowDashboardDetail(true)}
      />

      {/* Tab content */}
      {activeTab === 'habits' && (
        <main className="app-main habits-main">
          <HabitsPage onBack={() => {}} />
        </main>
      )}

      {activeTab === 'records' && (
        <main className="app-main records-main">
          <Timeline
            records={records}
            selectedIndex={selectedIndex}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
          />

          {/* 移动端 FAB 按钮 - only visible on records tab */}
          <button className="fab-button" aria-label="新建记录" onClick={() => setShowForm(true)}>
            +
          </button>
        </main>
      )}

      {activeTab === 'profile' && (
        <main className="app-main profile-main">
          <ProfileCenterPage onNavigate={handleProfileNavigate} />
        </main>
      )}

      {/* TabBar at bottom */}
      <TabBar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSelectedIndex(0);
        }}
      />

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
          setActiveTab('records');
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
