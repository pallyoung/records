import { useMemo, useState } from 'react';
import type { Record } from '../types';
import './DashboardDetail.css';

interface DashboardDetailProps {
  records: Record[];
}

type ViewMode = 'week' | 'month';

export function DashboardDetail({ records }: DashboardDetailProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('week');

  // 计算日期范围内的每日数据
  const dailyData = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 确定日期范围
    const days = viewMode === 'week' ? 7 : 30;
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - days + 1);

    // 生成日期数组
    const dates: Date[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date);
    }

    // 计算每日数据
    const data = dates.map(date => {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      // 当日创建的记录
      const dayRecords = records.filter(r => {
        const created = new Date(r.createdAt);
        return created >= dayStart && created <= dayEnd;
      });

      const pending = dayRecords.filter(r => r.status === 'pending').length;
      const inProgress = dayRecords.filter(r => r.status === 'in_progress').length;
      const completed = dayRecords.filter(r => r.status === 'completed').length;
      const incomplete = pending + inProgress;

      // 延期统计（当日已完成且延期的）
      const delayed = dayRecords.filter(r => {
        if (r.status !== 'completed') return false;
        if (!r.plannedEndTime || !r.actualEndTime) return false;
        const actualEnd = new Date(r.actualEndTime);
        const plannedEnd = new Date(r.plannedEndTime);
        return actualEnd > plannedEnd;
      }).length;

      const onTime = completed - delayed;

      return {
        date,
        dateStr: `${date.getMonth() + 1}/${date.getDate()}`,
        pending: incomplete, // 待完成 = pending + in_progress
        completed,
        delayed,
        onTime: onTime > 0 ? onTime : 0,
      };
    });

    return data;
  }, [records, viewMode]);

  // 找到最大值用于Y轴
  const maxPending = Math.max(...dailyData.map(d => Math.max(d.pending, d.completed)), 5);
  const maxTimely = Math.max(...dailyData.map(d => Math.max(d.delayed, d.onTime)), 5);

  return (
    <div className="dashboard-detail">
      {/* 视图切换 */}
      <div className="view-toggle">
        <button
          className={`toggle-btn ${viewMode === 'week' ? 'active' : ''}`}
          onClick={() => setViewMode('week')}
        >
          周视图
        </button>
        <button
          className={`toggle-btn ${viewMode === 'month' ? 'active' : ''}`}
          onClick={() => setViewMode('month')}
        >
          月视图
        </button>
      </div>

      {/* 图表1：待完成与已完成趋势 */}
      <div className="chart-section">
        <h3 className="section-title">待完成与已完成趋势</h3>
        <div className="line-chart">
          <div className="chart-y-axis">
            {[0, 1, 2, 3, 4].map(i => (
              <span key={i}>{maxPending - Math.floor((maxPending / 4) * i)}</span>
            ))}
          </div>
          <div className="chart-area">
            {/* 待完成折线 */}
            <svg className="chart-line pending-line" viewBox={`0 0 ${dailyData.length * 40} 100`} preserveAspectRatio="none">
              <polyline
                fill="none"
                stroke="var(--warning)"
                strokeWidth="2"
                points={dailyData.map((d, i) => `${i * 40 + 20},${100 - (d.pending / maxPending) * 90}`).join(' ')}
              />
            </svg>
            {/* 已完成折线 */}
            <svg className="chart-line completed-line" viewBox={`0 0 ${dailyData.length * 40} 100`} preserveAspectRatio="none">
              <polyline
                fill="none"
                stroke="var(--accent-secondary)"
                strokeWidth="2"
                points={dailyData.map((d, i) => `${i * 40 + 20},${100 - (d.completed / maxPending) * 90}`).join(' ')}
              />
            </svg>
            {/* 数据点 */}
            {dailyData.map((d, i) => (
              <div key={i} className="data-points" style={{ left: `${(i / (dailyData.length - 1)) * 100}%` }}>
                <div className="data-point pending" title={`待完成: ${d.pending}`}>
                  {d.pending}
                </div>
                <div className="data-point completed" title={`已完成: ${d.completed}`}>
                  {d.completed}
                </div>
              </div>
            ))}
          </div>
          <div className="chart-x-axis">
            {dailyData.filter((_, i) => viewMode === 'week' || i % 5 === 0).map((d, i) => (
              <span key={i}>{d.dateStr}</span>
            ))}
          </div>
        </div>
        <div className="chart-legend">
          <span className="legend-item pending">
            <span className="legend-dot" style={{ background: 'var(--warning)' }}></span>
            待完成
          </span>
          <span className="legend-item completed">
            <span className="legend-dot" style={{ background: 'var(--accent-secondary)' }}></span>
            已完成
          </span>
        </div>
      </div>

      {/* 图表2：延期与准时趋势 */}
      <div className="chart-section">
        <h3 className="section-title">延期与准时趋势</h3>
        <div className="line-chart">
          <div className="chart-y-axis">
            {[0, 1, 2, 3, 4].map(i => (
              <span key={i}>{maxTimely - Math.floor((maxTimely / 4) * i)}</span>
            ))}
          </div>
          <div className="chart-area">
            {/* 延期折线 */}
            <svg className="chart-line delayed-line" viewBox={`0 0 ${dailyData.length * 40} 100`} preserveAspectRatio="none">
              <polyline
                fill="none"
                stroke="var(--danger)"
                strokeWidth="2"
                points={dailyData.map((d, i) => `${i * 40 + 20},${100 - (d.delayed / maxTimely) * 90}`).join(' ')}
              />
            </svg>
            {/* 准时折线 */}
            <svg className="chart-line ontime-line" viewBox={`0 0 ${dailyData.length * 40} 100`} preserveAspectRatio="none">
              <polyline
                fill="none"
                stroke="var(--success)"
                strokeWidth="2"
                points={dailyData.map((d, i) => `${i * 40 + 20},${100 - (d.onTime / maxTimely) * 90}`).join(' ')}
              />
            </svg>
            {/* 数据点 */}
            {dailyData.map((d, i) => (
              <div key={i} className="data-points" style={{ left: `${(i / (dailyData.length - 1)) * 100}%` }}>
                <div className="data-point delayed" title={`延期: ${d.delayed}`}>
                  {d.delayed}
                </div>
                <div className="data-point ontime" title={`准时: ${d.onTime}`}>
                  {d.onTime}
                </div>
              </div>
            ))}
          </div>
          <div className="chart-x-axis">
            {dailyData.filter((_, i) => viewMode === 'week' || i % 5 === 0).map((d, i) => (
              <span key={i}>{d.dateStr}</span>
            ))}
          </div>
        </div>
        <div className="chart-legend">
          <span className="legend-item delayed">
            <span className="legend-dot" style={{ background: 'var(--danger)' }}></span>
            延期
          </span>
          <span className="legend-item ontime">
            <span className="legend-dot" style={{ background: 'var(--success)' }}></span>
            准时
          </span>
        </div>
      </div>
    </div>
  );
}
