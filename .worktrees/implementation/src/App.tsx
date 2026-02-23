import { useState, useEffect } from 'react';
import { RelaxProvider, useRelaxState } from '@relax-state/react';
import { FilterBar } from './components/FilterBar';
import { Timeline } from './components/Timeline';
import { RecordForm } from './components/RecordForm';
import { ReviewPage } from './pages/ReviewPage';
import { recordStore, recordActions } from './store/recordStore';
import type { Record, FilterState, TimelineGranularity } from './types';
import './App.css';

function AppContent() {
  const state = useRelaxState(recordStore);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    recordActions.loadRecords();
  }, []);

  const handleFilterChange = (filter: FilterState) => {
    recordActions.setFilter(filter);
  };

  const handleGranularityChange = (granularity: TimelineGranularity) => {
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

  const handleSave = async (data: Omit<Record, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingId) {
      await recordActions.updateRecord(editingId, data);
    } else {
      await recordActions.addRecord(data);
    }
  };

  const editingRecord = editingId ? state.records.find(r => r.id === editingId) : undefined;

  if (showReview) {
    return (
      <ReviewPage
        records={state.records}
        allTags={state.tags}
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

      {/* 移动端 FAB 按钮 */}
      <button className="fab-button" onClick={() => setShowForm(true)}>
        +
      </button>

      {showForm && (
        <RecordForm
          record={editingRecord}
          existingTags={state.tags}
          onClose={handleCloseForm}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <RelaxProvider>
      <AppContent />
    </RelaxProvider>
  );
}

export default App;
