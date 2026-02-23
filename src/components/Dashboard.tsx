import { useMemo, useState } from 'react';
import type { Record } from '../types';
import './Dashboard.css';

interface DashboardProps {
  records: Record[];
}

export function Dashboard({ records }: DashboardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

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

  // 计算完成率
  const getCompletionRate = (completed: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  return (
    <div className={`dashboard ${isExpanded ? 'expanded' : ''}`}>
      {/* 折叠时的显示 */}
      <div className="dashboard-collapsed" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="dashboard-summary">
          <div className="stat-item" onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }}>
            <span className="stat-icon">📅</span>
            <span className="stat-text">今日 {stats.todayCompleted}</span>
          </div>
          <div className="stat-item" onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }}>
            <span className="stat-icon">📆</span>
            <span className="stat-text">本周 {stats.weekCompleted}</span>
          </div>
          <div className="stat-item" onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }}>
            <span className="stat-icon">📊</span>
            <span className="stat-text">本月 {stats.monthCompleted}/{stats.monthTotal}</span>
          </div>
          {stats.overdueCount > 0 && (
            <div className="stat-item overdue" onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }}>
              <span className="stat-icon">⚠️</span>
              <span className="stat-text">超期 {stats.overdueCount}</span>
            </div>
          )}
        </div>
        <button className="dashboard-toggle">
          {isExpanded ? '▼' : '▲'}
        </button>
      </div>

      {/* 展开时的显示 */}
      {isExpanded && (
        <div className="dashboard-expanded">
          {/* 统计卡片 */}
          <div className="dashboard-stats">
            <div className="dashboard-stat-card">
              <div className="stat-title">今日进度</div>
              <div className="stat-progress">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${getCompletionRate(stats.todayCompleted, stats.todayTotal)}%` }}
                  />
                </div>
                <span className="progress-text">
                  {stats.todayCompleted}/{stats.todayTotal} ({getCompletionRate(stats.todayCompleted, stats.todayTotal)}%)
                </span>
              </div>
            </div>

            <div className="dashboard-stat-card">
              <div className="stat-title">本周进度</div>
              <div className="stat-progress">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${getCompletionRate(stats.weekCompleted, stats.weekTotal)}%` }}
                  />
                </div>
                <span className="progress-text">
                  {stats.weekCompleted}/{stats.weekTotal} ({getCompletionRate(stats.weekCompleted, stats.weekTotal)}%)
                </span>
              </div>
            </div>

            <div className="dashboard-stat-card">
              <div className="stat-title">本月进度</div>
              <div className="stat-progress">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${getCompletionRate(stats.monthCompleted, stats.monthTotal)}%` }}
                  />
                </div>
                <span className="progress-text">
                  {stats.monthCompleted}/{stats.monthTotal} ({getCompletionRate(stats.monthCompleted, stats.monthTotal)}%)
                </span>
              </div>
            </div>
          </div>

          {/* 底部信息行 */}
          <div className="dashboard-footer">
            {/* 超期提醒 */}
            {stats.overdueCount > 0 && (
              <div className="overdue-warning">
                <span className="warning-icon">⚠️</span>
                <span>有 {stats.overdueCount} 项超期</span>
              </div>
            )}

            {/* 热门标签 */}
            {stats.topTags.length > 0 && (
              <div className="top-tags">
                <span className="tags-label">热门:</span>
                {stats.topTags.map(([tag, count]) => (
                  <span key={tag} className="tag-count">{tag} {count}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
