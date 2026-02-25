import { useMemo } from "react";
import type { Record } from "../../types";
import styles from "./index.module.scss";

interface DashboardDetailProps {
  records: Record[];
  onBack?: () => void;
}

// SVG 环形图组件
function DonutChart({
  percent,
  size = 100,
  label,
}: {
  percent: number;
  size?: number;
  label?: string;
}) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);

  return (
    <div className={styles.donutChart} style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--bg-primary)"
          strokeWidth="12"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--accent-success)"
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      <div className={styles.donutCenter}>
        <div className={styles.donutPercent}>{percent}%</div>
        {label && <div className={styles.donutLabel}>{label}</div>}
      </div>
    </div>
  );
}

// 状态分布条形图
function StatusBar({
  completed,
  inProgress,
  pending,
}: {
  completed: number;
  inProgress: number;
  pending: number;
}) {
  const total = completed + inProgress + pending;
  const completedPct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const inProgressPct = total > 0 ? Math.round((inProgress / total) * 100) : 0;
  const pendingPct = total > 0 ? Math.round((pending / total) * 100) : 0;

  return (
    <div className={styles.statusBar}>
      <div className={styles.statusBarTrack}>
        {completedPct > 0 && (
          <div
            className={styles.statusBarFill}
            style={{
              width: `${completedPct}%`,
              background: "var(--accent-success)",
            }}
          />
        )}
        {inProgressPct > 0 && (
          <div
            className={styles.statusBarFill}
            style={{
              width: `${inProgressPct}%`,
              background: "var(--accent-info)",
            }}
          />
        )}
        {pendingPct > 0 && (
          <div
            className={styles.statusBarFill}
            style={{
              width: `${pendingPct}%`,
              background: "var(--accent-muted)",
            }}
          />
        )}
      </div>
    </div>
  );
}

// 标签分布条形图
function TagBar({
  label,
  percent,
  color,
}: {
  label: string;
  percent: number;
  color: string;
}) {
  return (
    <div className={styles.tagBar}>
      <span className={styles.tagBarLabel}>{label}</span>
      <div className={styles.tagBarTrack}>
        <div
          className={styles.tagBarFill}
          style={{ width: `${percent}%`, background: color }}
        />
      </div>
      <span className={styles.tagBarPercent}>{percent}%</span>
    </div>
  );
}

// 周趋势柱状图
function TrendChart({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  const weekdays = ["一", "二", "三", "四", "五", "六", "日"];

  return (
    <div className={styles.trendChart}>
      {data.map((val, i) => (
        <div key={i} className={styles.trendBar}>
          <div
            className={styles.trendBarFill}
            style={{
              height: `${(val / max) * 100}%`,
              background:
                i < 5 ? "var(--accent-success)" : "var(--accent-muted)",
            }}
          />
          <span className={styles.trendBarLabel}>{weekdays[i]}</span>
        </div>
      ))}
    </div>
  );
}

// 统计卡片
function StatCard({
  label,
  value,
  trend,
}: {
  label: string;
  value: string | number;
  trend?: "up" | "down";
}) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue}>
        {value}
        {trend && (
          <span
            className={`${styles.statTrend} ${trend === "up" ? styles.up : styles.down}`}
          >
            {trend === "up" ? "↑" : "↓"}
          </span>
        )}
      </div>
    </div>
  );
}

export function DashboardDetail({ records, onBack }: DashboardDetailProps) {
  // 本月数据统计
  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthRecords = records.filter((r) => {
      const created = new Date(r.createdAt);
      return created >= monthStart;
    });

    const completed = monthRecords.filter(
      (r) => r.status === "completed",
    ).length;
    const inProgress = monthRecords.filter(
      (r) => r.status === "in_progress",
    ).length;
    const pending = monthRecords.filter((r) => r.status === "pending").length;
    const total = monthRecords.length;
    const completionRate =
      total > 0 ? Math.round((completed / total) * 100) : 0;

    // 标签统计
    const tagMap = new Map<string, number>();
    monthRecords.forEach((r) => {
      r.tags.forEach((tag) => {
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
      });
    });
    const tagStats = Array.from(tagMap.entries())
      .map(([tag, count]) => ({
        tag,
        percent: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.percent - a.percent);

    // 周趋势 (模拟数据)
    const weekData = [3, 5, 8, 6, 4, 2, 1];

    return {
      completed,
      inProgress,
      pending,
      total,
      completionRate,
      tagStats,
      weekData,
    };
  }, [records]);

  const tagColors = [
    "var(--accent-info)",
    "var(--accent-tertiary)",
    "var(--accent-success)",
    "var(--accent-warning)",
  ];

  return (
    <div className={styles.dashboardDetail}>
      <header className={styles.detailHeader}>
        <button onClick={onBack} className={styles.backButton}>
          ← 返回
        </button>
        <h2 className={styles.detailTitle}>统计详情</h2>
      </header>

      {/* 延期统计 - 独立展示 */}
      <section className={styles.delaySummary}>
        <h3 className={styles.sectionTitle}>延期统计</h3>
      </section>

      {/* 统计指标 */}
      <section className={styles.section}>
        <div className={styles.statsGrid}>
          <StatCard label="完成任务" value={stats.completed} trend="up" />
          <StatCard label="较上周" value="+12%" />
        </div>
      </section>

      {/* 状态分布 */}
      <section className={styles.section}>
        <div className={styles.sectionTitle}>状态分布</div>
        <div className={styles.overviewCard}>
          <div className={styles.statsList}>
            <div className={styles.statItem}>
              <div className={styles.statItemLeft}>
                <div
                  className={styles.statDot}
                  style={{ background: "var(--accent-success)" }}
                />
                <span className={styles.statLabel}>已完成</span>
              </div>
              <span className={styles.statValue}>{stats.completed}</span>
            </div>
            <StatusBar
              completed={stats.completed}
              inProgress={stats.inProgress}
              pending={stats.pending}
            />

            <div className={styles.statItem}>
              <div className={styles.statItemLeft}>
                <div
                  className={styles.statDot}
                  style={{ background: "var(--accent-info)" }}
                />
                <span className={styles.statLabel}>进行中</span>
              </div>
              <span className={styles.statValue}>{stats.inProgress}</span>
            </div>

            <div className={styles.statItem}>
              <div className={styles.statItemLeft}>
                <div
                  className={styles.statDot}
                  style={{ background: "var(--accent-muted)" }}
                />
                <span className={styles.statLabel}>未开始</span>
              </div>
              <span className={styles.statValue}>{stats.pending}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 标签分布 */}
      <section className={styles.section}>
        <div className={styles.sectionTitle}>标签分布</div>
        <div className={styles.overviewCard}>
          <div className={styles.tagDist}>
            {stats.tagStats.map((item, i) => (
              <TagBar
                key={item.tag}
                label={item.tag}
                percent={item.percent}
                color={tagColors[i % tagColors.length]}
              />
            ))}
            {stats.tagStats.length === 0 && (
              <div className={styles.emptyState}>暂无数据</div>
            )}
          </div>
        </div>
      </section>

      {/* 完成趋势 */}
      <section className={styles.section}>
        <div className={styles.sectionTitle}>完成趋势</div>
        <div className={styles.overviewCard}>
          <TrendChart data={stats.weekData} />
        </div>
      </section>
    </div>
  );
}
