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

    // 今日待完成：所有未完成记录
    const incompleteRecords = records.filter(r => r.status !== 'completed');
    const pending = incompleteRecords.filter(r => r.status === 'pending').length;
    const inProgress = incompleteRecords.filter(r => r.status === 'in_progress').length;
    const completed = records.filter(r => r.status === 'completed').length;

    // 今日延期计算
    const delayed = incompleteRecords.filter(r => {
      const plannedStart = r.plannedStartTime || r.createdAt;
      const plannedEnd = r.plannedEndTime ? new Date(r.plannedEndTime) : new Date(r.createdAt);
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

  return (
    <div className="dashboard">
      {/* 吸底栏 - 始终显示 */}
      <div className="dashboard-bar" onClick={() => handleExpand(!isExpanded)}>
        {/* 今日待完成 */}
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

        {/* 今日延期 */}
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
}
