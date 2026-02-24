import { useMemo, useState, useRef, useEffect } from 'react';
import * as echarts from 'echarts';
import type { Record } from '../../types';
import styles from './index.module.scss';

interface DashboardDetailProps {
  records: Record[];
  onBack?: () => void;
}

type ViewMode = 'week' | 'month';
type TabType = 'delay' | 'efficiency' | 'tag';

// 延期统计区块（独立展示，与 Dashboard 的今日延期平级）
function DelayStatsSection({ records }: { records: Record[] }) {
  const stats = useMemo(() => {
    const now = new Date();
    const incomplete = records.filter(r => r.status !== 'completed');

    const delayedStart = incomplete.filter(r => {
      const plannedStart = r.plannedStartTime || r.createdAt;
      return r.status === 'pending' && now > plannedStart;
    });

    const delayedEnd = incomplete.filter(r => {
      const plannedEnd = r.plannedEndTime ? new Date(r.plannedEndTime) : new Date(r.createdAt);
      plannedEnd.setHours(23, 59, 59, 999);
      return r.status === 'in_progress' && now > plannedEnd;
    });

    return { delayedStart: delayedStart.length, delayedEnd: delayedEnd.length };
  }, [records]);

  return (
    <div className={styles.overviewGrid}>
      <div className={`${styles.overviewCard} ${styles.delayed}`}>
        <div className={styles.overviewValue}>{stats.delayedStart}</div>
        <div className={styles.overviewLabel}>计划开始未开始</div>
      </div>
      <div className={`${styles.overviewCard} ${styles.delayed}`}>
        <div className={styles.overviewValue}>{stats.delayedEnd}</div>
        <div className={styles.overviewLabel}>计划完成未完成</div>
      </div>
    </div>
  );
}

// 延期分析 Tab（包含图表）
function DelayAnalysisTab({ records }: { records: Record[] }) {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  const efficiencyStats = useMemo(() => {
    const completed = records.filter(r => r.status === 'completed');
    const onTime = completed.filter(r => {
      if (!r.plannedEndTime || !r.actualEndTime) return true;
      return r.actualEndTime <= r.plannedEndTime;
    });
    const delayed = completed.length - onTime.length;

    const onTimeRate = completed.length > 0 ? Math.round((onTime.length / completed.length) * 100) : 0;
    const delayedRate = completed.length > 0 ? Math.round((delayed / completed.length) * 100) : 0;

    return { onTimeRate, delayedRate, total: completed.length };
  }, [records]);

  const dailyData = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const days = viewMode === 'week' ? 7 : 30;
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - days + 1);

    const dates: Date[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date);
    }

    const data = dates.map(date => {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const dayRecords = records.filter(r => {
        const created = new Date(r.createdAt);
        return created >= dayStart && created <= dayEnd;
      });

      const completed = dayRecords.filter(r => r.status === 'completed').length;
      const onTime = dayRecords.filter(r => {
        if (r.status !== 'completed') return false;
        if (!r.plannedEndTime || !r.actualEndTime) return true;
        return r.actualEndTime <= r.plannedEndTime;
      }).length;
      const delayed = completed - onTime;

      return {
        dateStr: `${date.getMonth() + 1}/${date.getDate()}`,
        onTime,
        delayed: delayed > 0 ? delayed : 0,
      };
    });

    return data;
  }, [records, viewMode]);

  useEffect(() => {
    if (chartRef.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    return () => {
      chartInstance.current?.dispose();
    };
  }, []);

  useEffect(() => {
    if (!chartInstance.current) return;

    chartInstance.current.setOption({
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#e0e0e0',
        textStyle: { color: '#333' },
      },
      legend: {
        data: ['准时', '延期'],
        bottom: 0,
        textStyle: { color: '#666', fontSize: 12 },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '10%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dailyData.map(d => d.dateStr),
        axisLine: { lineStyle: { color: '#e0e0e0' } },
        axisLabel: { color: '#999', fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: '#f0f0f0' } },
        axisLabel: { color: '#999', fontSize: 10 },
      },
      series: [
        {
          name: '准时',
          type: 'line',
          smooth: true,
          data: dailyData.map(d => d.onTime),
          lineStyle: { color: '#10b981', width: 2 },
          itemStyle: { color: '#10b981' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(16,185,129,0.3)' },
              { offset: 1, color: 'rgba(16,185,129,0.05)' },
            ]),
          },
        },
        {
          name: '延期',
          type: 'line',
          smooth: true,
          data: dailyData.map(d => d.delayed),
          lineStyle: { color: '#ef4444', width: 2 },
          itemStyle: { color: '#ef4444' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(239,68,68,0.3)' },
              { offset: 1, color: 'rgba(239,68,68,0.05)' },
            ]),
          },
        },
      ],
    });
  }, [dailyData]);

  useEffect(() => {
    const handleResize = () => {
      chartInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={styles.tabContent}>
      <div className={styles.overviewGrid}>
        <div className={styles.overviewCard}>
          <div className={styles.overviewValue}>{efficiencyStats.onTimeRate}%</div>
          <div className={styles.overviewLabel}>按时完成率</div>
        </div>
        <div className={`${styles.overviewCard} ${styles.delayed}`}>
          <div className={styles.overviewValue}>{efficiencyStats.delayedRate}%</div>
          <div className={styles.overviewLabel}>延期完成率</div>
        </div>
      </div>
      <div className={styles.viewToggle} style={{ marginTop: '16px' }}>
        <button
          className={`${styles.toggleBtn} ${viewMode === 'week' ? styles.active : ''}`}
          onClick={() => setViewMode('week')}
        >
          周视图
        </button>
        <button
          className={`${styles.toggleBtn} ${viewMode === 'month' ? styles.active : ''}`}
          onClick={() => setViewMode('month')}
        >
          月视图
        </button>
      </div>
      <div ref={chartRef} className={styles.echartsContainer} />
    </div>
  );
}

// Tag 分析 Tab
function TagAnalysisTab({ records }: { records: Record[] }) {
  const tagStats = useMemo(() => {
    const tagMap = new Map<string, { total: number; delayed: number; completed: number; onTime: number }>();

    records.forEach(r => {
      r.tags.forEach(tag => {
        const existing = tagMap.get(tag) || { total: 0, delayed: 0, completed: 0, onTime: 0 };
        existing.total++;
        if (r.status === 'completed') {
          existing.completed++;
          if (!r.plannedEndTime || !r.actualEndTime || r.actualEndTime <= r.plannedEndTime) {
            existing.onTime++;
          } else {
            existing.delayed++;
          }
        } else {
          // 未完成的检查是否延期
          const now = new Date();
          if (r.status === 'pending' && r.plannedStartTime && now > r.plannedStartTime) {
            existing.delayed++;
          }
          if (r.status === 'in_progress' && r.plannedEndTime) {
            const plannedEnd = new Date(r.plannedEndTime);
            plannedEnd.setHours(23, 59, 59, 999);
            if (now > plannedEnd) {
              existing.delayed++;
            }
          }
        }
        tagMap.set(tag, existing);
      });
    });

    return Array.from(tagMap.entries())
      .map(([tag, stats]) => ({
        tag,
        ...stats,
        delayedRate: stats.total > 0 ? Math.round((stats.delayed / stats.total) * 100) : 0,
        onTimeRate: stats.completed > 0 ? Math.round((stats.onTime / stats.completed) * 100) : 0,
      }))
      .sort((a, b) => b.delayedRate - a.delayedRate);
  }, [records]);

  return (
    <div className={styles.tabContent}>
      <div className={styles.tagAnalysisList}>
        {tagStats.length === 0 ? (
          <div className={styles.emptyState}>暂无数据</div>
        ) : (
          tagStats.map(item => (
            <div key={item.tag} className={styles.tagAnalysisItem}>
              <span className={styles.tagName}>{item.tag}</span>
              <div className={styles.tagStats}>
                <span className={styles.stat}>
                  <span className={styles.label}>延期率</span>
                  <span className={`${styles.value} ${styles.delayed}`}>{item.delayedRate}%</span>
                </span>
                <span className={styles.stat}>
                  <span className={styles.label}>完成率</span>
                  <span className={styles.value}>{item.completed > 0 ? Math.round((item.completed / item.total) * 100) : 0}%</span>
                </span>
              </div>
              <div className={styles.tagBar}>
                <div
                  className={styles.tagBarFill}
                  style={{ width: `${item.delayedRate}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function DashboardDetail({ records, onBack }: DashboardDetailProps) {
  const [activeTab, setActiveTab] = useState<TabType>('delay');

  return (
    <div className={styles.dashboardDetail}>
      <header className={styles.detailHeader}>
        <button onClick={onBack} className={styles.backButton}>← 返回</button>
        <h2 className={styles.detailTitle}>统计详情</h2>
      </header>

      {/* 延期统计 - 独立展示 */}
      <section className={styles.delaySummary}>
        <h3 className={styles.sectionTitle}>延期统计</h3>
        <DelayStatsSection records={records} />
      </section>

      {/* 效率分析模块 */}
      <section className={styles.efficiencyAnalysis}>
        <h3 className={styles.moduleTitle}>效率分析</h3>
        {/* Tab 切换 */}
        <div className={styles.tabToggle}>
          <button
            className={`${styles.toggleBtn} ${activeTab === 'delay' ? styles.active : ''}`}
            onClick={() => setActiveTab('delay')}
          >
            延期分析
          </button>
          <button
            className={`${styles.toggleBtn} ${activeTab === 'tag' ? styles.active : ''}`}
            onClick={() => setActiveTab('tag')}
          >
            Tag分析
          </button>
        </div>

        {activeTab === 'delay' && <DelayAnalysisTab records={records} />}
        {activeTab === 'tag' && <TagAnalysisTab records={records} />}
      </section>
    </div>
  );
}
