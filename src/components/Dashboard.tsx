import { useMemo } from 'react';
import type { Record } from '../types';
import './Dashboard.css';

interface DashboardProps {
  records: Record[];
  isExpanded: boolean;
  onExpandChange: (expanded: boolean) => void;
}

export function Dashboard({ records, isExpanded, onExpandChange }: DashboardProps) {
  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // 今日记录
    const todayRecords = records.filter(r => {
      const created = new Date(r.createdAt);
      return created >= today;
    });
    const todayCompleted = todayRecords.filter(r => r.status === 'completed').length;

    // 本周记录
    const weekRecords = records.filter(r => {
      const created = new Date(r.createdAt);
      return created >= weekStart;
    });
    const weekCompleted = weekRecords.filter(r => r.status === 'completed').length;

    // 本月记录
    const monthRecords = records.filter(r => {
      const created = new Date(r.createdAt);
      return created >= monthStart;
    });
    const monthTotal = monthRecords.length;
    const monthCompleted = monthRecords.filter(r => r.status === 'completed').length;

    // 超期记录
    const overdueRecords = records.filter(r => {
      if (r.status === 'completed') return false;
      if (r.status === 'pending' && r.plannedStartTime) {
        return now > r.plannedStartTime;
      }
      if (r.status === 'in_progress' && r.plannedEndTime) {
        return now > r.plannedEndTime;
      }
      return false;
    });

    // 标签统计
    const tagCounts = new Map<string, number>();
    records.forEach(r => {
      r.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });
    const topTags = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      todayCompleted,
      todayTotal: todayRecords.length,
      weekCompleted,
      weekTotal: weekRecords.length,
      monthTotal,
      monthCompleted,
      overdueCount: overdueRecords.length,
      overdueRecords,
      topTags,
    };
  }, [records]);

  const handleExpand = (expanded: boolean) => {
    onExpandChange(expanded);
  };

  // 计算今日待办和完成率
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
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // 延期统计（今日创建且已延期的）
    const delayed = todayRecords.filter(r => {
      if (r.status === 'completed') return false;
      if (r.status === 'pending' && r.plannedStartTime && now > r.plannedStartTime) return true;
      if (r.status === 'in_progress' && r.plannedEndTime && now > r.plannedEndTime) return true;
      return false;
    }).length;

    const delayedRate = total > 0 ? Math.round((delayed / total) * 100) : 0;

    return { pending, inProgress, completed, total, completionRate, delayed, delayedRate };
  }, [records]);

  return (
    <div className="dashboard">
      {/* 吸底栏 - 始终显示 */}
      <div className="dashboard-bar" onClick={() => handleExpand(!isExpanded)}>
        <div className="dashboard-summary">
          <div className="stat-item">
            <span className="stat-icon">📅</span>
            <span className="stat-text">今日 {todayStats.completed}/{todayStats.total}</span>
            <span className="stat-rate">{todayStats.completionRate}%</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">📆</span>
            <span className="stat-text">本周 {stats.weekCompleted}</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">📊</span>
            <span className="stat-text">本月 {stats.monthCompleted}/{stats.monthTotal}</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">⏳</span>
            <span className="stat-text">待办 {todayStats.pending + todayStats.inProgress}</span>
          </div>
          {todayStats.delayed > 0 && (
            <div className="stat-item delayed">
              <span className="stat-icon">⚠️</span>
              <span className="stat-text">延期 {todayStats.delayed}</span>
              <span className="stat-rate">{todayStats.delayedRate}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
