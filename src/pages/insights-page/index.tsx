import { useState, useMemo } from "react";
import { useRelaxValue, recordsState } from "../../store/recordStore";
import type { Record as RecordType } from "../../types";
import styles from "./index.module.scss";

// Page props interface
interface PageProps {
  records?: RecordType[];
  tags?: string[];
}

// Filter type
type TimeFilter = "week" | "month" | "year" | "custom";

// 标签颜色映射 (移到组件外部作为常量)
const tagColorMap: Record<string, string> = {
  工作: "#007AFF",
  生活: "#FF9500",
  学习: "#AF52DE",
  健康: "#34C759",
  default: "#8E8E93",
};

// 获取本周开始日期
function getWeekStart(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day;
  return new Date(now.getFullYear(), now.getMonth(), diff);
}

// 获取本月开始日期
function getMonthStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

// 获取本年开始日期
function getYearStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), 0, 1);
}

// 判断日期是否在范围内
function isInRange(date: Date, startDate: Date, endDate: Date): boolean {
  const targetDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const start = new Date(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate(),
  );
  const end = new Date(
    endDate.getFullYear(),
    endDate.getMonth(),
    endDate.getDate(),
  );
  end.setDate(end.getDate() + 1); // 包含结束日期
  return targetDate >= start && targetDate < end;
}

// DonutChart 组件
interface DonutChartProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}

function DonutChart({
  percentage,
  size = 72,
  strokeWidth = 8,
}: DonutChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={styles.donutChart} style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          className={styles.donutBg}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <circle
          className={styles.donutProgress}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className={styles.donutCenter}>
        <span className={styles.donutPercent}>{Math.round(percentage)}%</span>
      </div>
    </div>
  );
}

// StatsList 组件
interface StatsListItem {
  label: string;
  count: number;
  color: string;
}

interface StatsListProps {
  items: StatsListItem[];
}

function StatsList({ items }: StatsListProps) {
  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className={styles.statsList}>
      {items.map((item) => (
        <div key={item.label} className={styles.statItem}>
          <span
            className={styles.statDot}
            style={{ backgroundColor: item.color }}
          />
          <span className={styles.statLabel}>{item.label}</span>
          <span className={styles.statCount}>{item.count}</span>
          <span className={styles.statPercent}>
            ({total > 0 ? Math.round((item.count / total) * 100) : 0}%)
          </span>
        </div>
      ))}
    </div>
  );
}

// TagBar 组件
interface TagBarItem {
  label: string;
  count: number;
  color: string;
}

interface TagBarProps {
  items: TagBarItem[];
}

function TagBar({ items }: TagBarProps) {
  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className={styles.tagBar}>
      {items.map((item) => (
        <div key={item.label} className={styles.tagBarItem}>
          <div className={styles.tagBarHeader}>
            <span className={styles.tagBarLabel}>{item.label}</span>
            <span className={styles.tagBarCount}>{item.count}</span>
          </div>
          <div className={styles.tagBarTrack}>
            <div
              className={styles.tagBarFill}
              style={{
                width: total > 0 ? `${(item.count / total) * 100}%` : "0%",
                backgroundColor: item.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// TrendChart 组件
interface TrendData {
  label: string;
  value: number;
}

interface TrendChartProps {
  data: TrendData[];
}

function TrendChart({ data }: TrendChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className={styles.trendChart}>
      <div className={styles.trendBars}>
        {data.map((item, index) => (
          <div key={index} className={styles.trendBarWrapper}>
            <div
              className={styles.trendBar}
              style={{ height: `${(item.value / maxValue) * 100}%` }}
            />
            <span className={styles.trendLabel}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// 主 InsightsPage 组件
export function InsightsPage(_props?: PageProps) {
  const records = useRelaxValue(recordsState) as RecordType[];
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("week");
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);

  // 根据时间筛选计算统计数据
  const stats = useMemo(() => {
    let startDate: Date;
    const now = new Date();

    switch (timeFilter) {
      case "week":
        startDate = getWeekStart();
        break;
      case "month":
        startDate = getMonthStart();
        break;
      case "year":
        startDate = getYearStart();
        break;
      case "custom":
        startDate = customStartDate || getWeekStart();
        break;
      default:
        startDate = getWeekStart();
    }

    // 筛选时间范围内的记录
    const filteredRecords = records.filter((record) => {
      const recordDate = record.createdAt;
      const endDate =
        timeFilter === "custom" && customEndDate ? customEndDate : now;
      return isInRange(new Date(recordDate), startDate, endDate);
    });

    // 计算统计数据
    const completedCount = filteredRecords.filter(
      (r) => r.status === "completed",
    ).length;
    const inProgressCount = filteredRecords.filter(
      (r) => r.status === "in_progress",
    ).length;
    const pendingCount = filteredRecords.filter(
      (r) => r.status === "pending",
    ).length;
    const totalCount = filteredRecords.length;

    // 计算完成率
    const completionRate =
      totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    // 计算较上周的变化
    const weekStart = getWeekStart();
    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(weekStart);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);

    const lastWeekRecords = records.filter((record) => {
      const recordDate = new Date(record.createdAt);
      return isInRange(recordDate, lastWeekStart, lastWeekEnd);
    });
    const lastWeekCompletedCount = lastWeekRecords.filter(
      (r) => r.status === "completed",
    ).length;

    let lastWeekChange = 0;
    if (lastWeekCompletedCount > 0) {
      lastWeekChange = Math.round(
        ((completedCount - lastWeekCompletedCount) / lastWeekCompletedCount) *
          100,
      );
    } else if (completedCount > 0) {
      lastWeekChange = 100; // 上周没有完成，本周有完成
    }

    // 标签分布
    const tagCountMap: Record<string, number> = {};
    filteredRecords.forEach((record) => {
      record.tags.forEach((tag) => {
        tagCountMap[tag] = (tagCountMap[tag] || 0) + 1;
      });
    });

    const tagDistribution = Object.entries(tagCountMap).map(([tag, count]) => ({
      label: tag,
      count,
      color: tagColorMap[tag] || tagColorMap.default,
    }));

    // 按数量排序
    tagDistribution.sort((a, b) => b.count - a.count);

    // 状态分布
    const statusDistribution = [
      { label: "已完成", count: completedCount, color: "#34C759" },
      { label: "进行中", count: inProgressCount, color: "#007AFF" },
      { label: "待处理", count: pendingCount, color: "#8E8E93" },
    ];

    // 趋势数据 (最近7天)
    const trendData: TrendData[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayRecords = records.filter((r) => {
        const recordDate = new Date(r.createdAt);
        return (
          recordDate.getFullYear() === date.getFullYear() &&
          recordDate.getMonth() === date.getMonth() &&
          recordDate.getDate() === date.getDate()
        );
      });
      const dayLabels = ["日", "一", "二", "三", "四", "五", "六"];
      trendData.push({
        label: dayLabels[date.getDay()],
        value: dayRecords.filter((r) => r.status === "completed").length,
      });
    }

    return {
      completedCount,
      inProgressCount,
      pendingCount,
      totalCount,
      completionRate,
      lastWeekChange,
      tagDistribution,
      statusDistribution,
      trendData,
    };
  }, [records, timeFilter, customStartDate, customEndDate]);

  return (
    <div className={styles.insightsPage}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>洞察</h1>
      </div>

      {/* Filter Pills */}
      <div className={styles.filterPills}>
        <button
          type="button"
          className={`${styles.filterPill} ${timeFilter === "week" ? styles.filterPillActive : ""}`}
          onClick={() => setTimeFilter("week")}
        >
          本周
        </button>
        <button
          type="button"
          className={`${styles.filterPill} ${timeFilter === "month" ? styles.filterPillActive : ""}`}
          onClick={() => setTimeFilter("month")}
        >
          本月
        </button>
        <button
          type="button"
          className={`${styles.filterPill} ${timeFilter === "year" ? styles.filterPillActive : ""}`}
          onClick={() => setTimeFilter("year")}
        >
          本年
        </button>
        <button
          type="button"
          className={`${styles.filterPill} ${timeFilter === "custom" ? styles.filterPillActive : ""}`}
          onClick={() => {
            // 设置默认自定义范围：最近30天
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 30);
            setCustomStartDate(startDate);
            setCustomEndDate(endDate);
            setTimeFilter("custom");
          }}
        >
          自定义
        </button>
      </div>

      {/* Completion Rate Section */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>完成率</div>
        <div className={styles.completionCard}>
          <div className={styles.donutContainer}>
            <DonutChart percentage={stats.completionRate} />
            <div className={styles.statsGrid}>
              <div className={styles.statBox}>
                <span className={styles.statValue}>{stats.completedCount}</span>
                <span className={styles.statLabel}>完成任务</span>
              </div>
              <div className={styles.statBox}>
                <span
                  className={`${styles.statValue} ${stats.lastWeekChange >= 0 ? styles.statValueUp : styles.statValueDown}`}
                >
                  {stats.lastWeekChange >= 0 ? "+" : ""}
                  {stats.lastWeekChange}%
                </span>
                <span className={styles.statLabel}>较上周</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Distribution Section */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>状态分布</div>
        <div className={styles.card}>
          <StatsList items={stats.statusDistribution} />
        </div>
      </div>

      {/* Tag Distribution Section */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>标签分布</div>
        <div className={styles.card}>
          {stats.tagDistribution.length > 0 ? (
            <TagBar items={stats.tagDistribution} />
          ) : (
            <div className={styles.emptyState}>暂无标签数据</div>
          )}
        </div>
      </div>

      {/* Trend Section */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>完成趋势</div>
        <div className={styles.card}>
          <TrendChart data={stats.trendData} />
        </div>
      </div>
    </div>
  );
}
