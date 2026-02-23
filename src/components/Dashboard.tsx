import { useMemo } from 'react';
import type { Record } from '../types';
import './Dashboard.css';

interface DashboardProps {
  records: Record[];
  isExpanded: boolean;
  onExpandChange: (expanded: boolean) => void;
}

export function Dashboard({ records, isExpanded, onExpandChange }: DashboardProps) {
  const handleExpand = (expanded: boolean) => {
    onExpandChange(expanded);
  };

  // 今日统计
  const todayStats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayRecords = records.filter(r => {
      const created = new Date(r.createdAt);
      return created >= today;
    });

    const pending = todayRecords.filter(r => r.status === 'pending').length;
    const inProgress = todayRecords.filter(r => r.status === 'in_progress').length;
    const completed = todayRecords.filter(r => r.status === 'completed').length;
    const total = todayRecords.length;
    const incomplete = pending + inProgress;

    // 延期统计
    const delayed = todayRecords.filter(r => {
      if (r.status === 'completed') return false;
      if (r.status === 'pending' && r.plannedStartTime && now > r.plannedStartTime) return true;
      if (r.status === 'in_progress' && r.plannedEndTime && now > r.plannedEndTime) return true;
      return false;
    }).length;

    const delayedRate = incomplete > 0 ? Math.round((delayed / incomplete) * 100) : 0;

    return { pending, inProgress, completed, total, incomplete, delayed, delayedRate };
  }, [records]);

  return (
    <div className="dashboard">
      {/* 吸底栏 - 始终显示 */}
      <div className="dashboard-bar" onClick={() => handleExpand(!isExpanded)}>
        <div className="dashboard-summary">
          <div className="stat-item">
            <span className="stat-icon">📋</span>
            <span className="stat-text">待办 {todayStats.incomplete}</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">✅</span>
            <span className="stat-text">已完成 {todayStats.completed}</span>
          </div>
          {todayStats.delayed > 0 && (
            <div className="stat-item delayed">
              <span className="stat-icon">⚠️</span>
              <span className="stat-text">延期率 {todayStats.delayedRate}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
