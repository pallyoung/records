import { useMemo, useState, useRef, useEffect } from 'react';
import * as echarts from 'echarts';
import type { Record } from '../types';
import './DashboardDetail.css';

interface DashboardDetailProps {
  records: Record[];
}

type ViewMode = 'week' | 'month';

export function DashboardDetail({ records }: DashboardDetailProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const chart1Ref = useRef<HTMLDivElement>(null);
  const chart2Ref = useRef<HTMLDivElement>(null);
  const chart1Instance = useRef<echarts.ECharts | null>(null);
  const chart2Instance = useRef<echarts.ECharts | null>(null);

  // 计算日期范围内的每日数据
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

      const pending = dayRecords.filter(r => r.status === 'pending').length;
      const inProgress = dayRecords.filter(r => r.status === 'in_progress').length;
      const completed = dayRecords.filter(r => r.status === 'completed').length;
      const incomplete = pending + inProgress;

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
        pending: incomplete,
        completed,
        delayed,
        onTime: onTime > 0 ? onTime : 0,
      };
    });

    return data;
  }, [records, viewMode]);

  // 初始化图表
  useEffect(() => {
    if (chart1Ref.current) {
      chart1Instance.current = echarts.init(chart1Ref.current);
    }
    if (chart2Ref.current) {
      chart2Instance.current = echarts.init(chart2Ref.current);
    }

    return () => {
      chart1Instance.current?.dispose();
      chart2Instance.current?.dispose();
    };
  }, []);

  // 更新图表数据
  useEffect(() => {
    if (!chart1Instance.current || !chart2Instance.current) return;

    // 图表1：待完成与已完成
    chart1Instance.current.setOption({
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#e0e0e0',
        textStyle: { color: '#333' },
      },
      legend: {
        data: ['待完成', '已完成'],
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
          name: '待完成',
          type: 'line',
          smooth: true,
          data: dailyData.map(d => d.pending),
          lineStyle: { color: '#f59e0b', width: 2 },
          itemStyle: { color: '#f59e0b' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(245,158,11,0.3)' },
              { offset: 1, color: 'rgba(245,158,11,0.05)' },
            ]),
          },
        },
        {
          name: '已完成',
          type: 'line',
          smooth: true,
          data: dailyData.map(d => d.completed),
          lineStyle: { color: '#10b981', width: 2 },
          itemStyle: { color: '#10b981' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(16,185,129,0.3)' },
              { offset: 1, color: 'rgba(16,185,129,0.05)' },
            ]),
          },
        },
      ],
    });

    // 图表2：延期与准时
    chart2Instance.current.setOption({
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#e0e0e0',
        textStyle: { color: '#333' },
      },
      legend: {
        data: ['延期', '准时'],
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
        {
          name: '准时',
          type: 'line',
          smooth: true,
          data: dailyData.map(d => d.onTime),
          lineStyle: { color: '#3b82f6', width: 2 },
          itemStyle: { color: '#3b82f6' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(59,130,246,0.3)' },
              { offset: 1, color: 'rgba(59,130,246,0.05)' },
            ]),
          },
        },
      ],
    });
  }, [dailyData]);

  // 窗口resize时重新调整图表
  useEffect(() => {
    const handleResize = () => {
      chart1Instance.current?.resize();
      chart2Instance.current?.resize();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
        <div ref={chart1Ref} className="echarts-container" />
      </div>

      {/* 图表2：延期与准时趋势 */}
      <div className="chart-section">
        <h3 className="section-title">延期与准时趋势</h3>
        <div ref={chart2Ref} className="echarts-container" />
      </div>
    </div>
  );
}
