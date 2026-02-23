import { useState, useEffect } from 'react';
import { RelaxProvider, useRelaxValue, store, recordsState, tagsState, filterState, granularityState, loadingState } from './store/recordStore';
import { FilterBar } from './components/FilterBar';
import { Timeline } from './components/Timeline';
import { RecordForm } from './components/RecordForm';
import { ReviewPage } from './pages/ReviewPage';
import { recordActions } from './store/recordStore';
import type { Record, FilterState, TimelineGranularity } from './types';
import './App.css';

function AppContent() {
  const records = useRelaxValue(recordsState);
  const tags = useRelaxValue(tagsState);
  const filter = useRelaxValue(filterState);
  const granularity = useRelaxValue(granularityState);
  const loading = useRelaxValue(loadingState);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    recordActions.loadRecords();
  }, []);

  const handleFilterChange = (newFilter: FilterState) => {
    recordActions.setFilter(newFilter);
  };

  const handleGranularityChange = (newGranularity: TimelineGranularity) => {
    recordActions.setGranularity(newGranularity);
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

  const handleSave = async (data: Omit<Record, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingId) {
      await recordActions.updateRecord(editingId, data);
    } else {
      await recordActions.addRecord(data);
    }
  };

  const editingRecord = editingId ? records.find(r => r.id === editingId) : undefined;

  if (showReview) {
    return (
      <ReviewPage
        records={records}
        allTags={tags}
        onBack={() => setShowReview(false)}
      />
    );
  }

  return (
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
          filter={filter}
          tags={tags}
          granularity={granularity}
          onFilterChange={handleFilterChange}
          onGranularityChange={handleGranularityChange}
        />

        {loading ? (
          <div className="loading">加载中...</div>
        ) : (
          <Timeline
            records={records}
            granularity={granularity}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </main>

      {/* 移动端 FAB 按钮 */}
      <button className="fab-button" onClick={() => setShowForm(true)}>
        +
      </button>

      {showForm && (
        <RecordForm
          record={editingRecord}
          existingTags={tags}
          onClose={handleCloseForm}
          onSave={handleSave}
        />
      )}
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
