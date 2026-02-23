import { useMemo } from 'react';
import type { Record } from '../types';
import './DashboardDetail.css';

interface DashboardDetailProps {
  records: Record[];
}

export function DashboardDetail({ records }: DashboardDetailProps) {
  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // 今日数据
    const todayRecords = records.filter(r => {
      const created = new Date(r.createdAt);
      return created >= today;
    });
    const todayCompleted = todayRecords.filter(r => r.status === 'completed').length;
    const todayPending = todayRecords.filter(r => r.status === 'pending').length;
    const todayInProgress = todayRecords.filter(r => r.status === 'in_progress').length;

    // 本周数据
    const weekRecords = records.filter(r => {
      const created = new Date(r.createdAt);
      return created >= weekStart;
    });
    const weekCompleted = weekRecords.filter(r => r.status === 'completed').length;
    const weekTotal = weekRecords.length;

    // 本月数据
    const monthRecords = records.filter(r => {
      const created = new Date(r.createdAt);
      return created >= monthStart;
    });
    const monthCompleted = monthRecords.filter(r => r.status === 'completed').length;
    const monthTotal = monthRecords.length;

    // 超期数据
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

    // 延期数据（已完成且超期的）
    const delayedRecords = records.filter(r => {
      if (r.status !== 'completed') return false;
      if (!r.plannedEndTime || !r.actualEndTime) return false;
      return r.actualEndTime > r.plannedEndTime;
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
      .slice(0, 6);

    // 状态分布
    const statusDistribution = [
      { status: 'pending', count: records.filter(r => r.status === 'pending').length, label: '未开始' },
      { status: 'in_progress', count: records.filter(r => r.status === 'in_progress').length, label: '进行中' },
      { status: 'completed', count: records.filter(r => r.status === 'completed').length, label: '已完成' },
    ];

    return {
      todayTotal: todayRecords.length,
      todayCompleted,
      todayPending,
      todayInProgress,
      weekCompleted,
      weekTotal,
      weekRate: weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0,
      monthCompleted,
      monthTotal,
      monthRate: monthTotal > 0 ? Math.round((monthCompleted / monthTotal) * 100) : 0,
      overdueCount: overdueRecords.length,
      delayedCount: delayedRecords.length,
      delayedRate: monthCompleted > 0 ? Math.round((delayedRecords.length / monthCompleted) * 100) : 0,
      topTags,
      statusDistribution,
      totalRecords: records.length,
    };
  }, [records]);

  return (
    <div className="dashboard-detail">
      {/* 今日概览 */}
      <div className="detail-section">
        <h3 className="section-title">今日概览</h3>
        <div className="overview-grid">
          <div className="overview-card">
            <div className="overview-value">{stats.todayTotal}</div>
            <div className="overview-label">今日记录</div>
          </div>
          <div className="overview-card highlight">
            <div className="overview-value">{stats.todayCompleted}</div>
            <div className="overview-label">已完成</div>
          </div>
          <div className="overview-card">
            <div className="overview-value">{stats.todayPending}</div>
            <div className="overview-label">待开始</div>
          </div>
          <div className="overview-card">
            <div className="overview-value">{stats.todayInProgress}</div>
            <div className="overview-label">进行中</div>
          </div>
        </div>
      </div>

      {/* 进度条 */}
      <div className="detail-section">
        <h3 className="section-title">完成进度</h3>
        <div className="progress-list">
          <div className="progress-item">
            <div className="progress-header">
              <span>今日</span>
              <span className="progress-value">{stats.todayTotal > 0 ? Math.round((stats.todayCompleted / stats.todayTotal) * 100) : 0}%</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${stats.todayTotal > 0 ? (stats.todayCompleted / stats.todayTotal) * 100 : 0}%` }}
              />
            </div>
          </div>
          <div className="progress-item">
            <div className="progress-header">
              <span>本周</span>
              <span className="progress-value">{stats.weekRate}%</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${stats.weekRate}%` }}
              />
            </div>
          </div>
          <div className="progress-item">
            <div className="progress-header">
              <span>本月</span>
              <span className="progress-value">{stats.monthRate}%</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${stats.monthRate}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 状态分布 */}
      <div className="detail-section">
        <h3 className="section-title">状态分布</h3>
        <div className="status-chart">
          {stats.statusDistribution.map(item => (
            <div key={item.status} className="status-bar-item">
              <span className="status-label">{item.label}</span>
              <div className="status-bar">
                <div
                  className={`status-fill ${item.status}`}
                  style={{ width: `${stats.totalRecords > 0 ? (item.count / stats.totalRecords) * 100 : 0}%` }}
                />
              </div>
              <span className="status-count">{item.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 关键指标 */}
      <div className="detail-section">
        <h3 className="section-title">关键指标</h3>
        <div className="metrics-grid">
          <div className={`metric-card ${stats.overdueCount > 0 ? 'warning' : ''}`}>
            <div className="metric-value">{stats.overdueCount}</div>
            <div className="metric-label">超期记录</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{stats.delayedCount}</div>
            <div className="metric-label">延期完成</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{stats.delayedRate}%</div>
            <div className="metric-label">延期率</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{stats.totalRecords}</div>
            <div className="metric-label">总记录</div>
          </div>
        </div>
      </div>

      {/* 热门标签 */}
      {stats.topTags.length > 0 && (
        <div className="detail-section">
          <h3 className="section-title">热门标签</h3>
          <div className="tags-cloud">
            {stats.topTags.map(([tag, count]) => (
              <div key={tag} className="tag-item">
                <span className="tag-name">{tag}</span>
                <span className="tag-count">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
