import { useState, useMemo } from "react";
import {
  useRelaxValue,
  recordActions,
  recordsState,
  filterState,
} from "../../store/recordStore";
import { IconAdd } from "../../shared/icons";
import { TaskCard } from "../../components/task-card";
import { StatsCard } from "../../components/stats-card";
import type { Record, RecordStatus, FilterState } from "../../types";
import styles from "./index.module.scss";

// 获取今天的格式化日期
function getTodayFormatted(): { title: string; date: string } {
  const now = new Date();
  const months = [
    "1月",
    "2月",
    "3月",
    "4月",
    "5月",
    "6月",
    "7月",
    "8月",
    "9月",
    "10月",
    "11月",
    "12月",
  ];
  const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const month = months[now.getMonth()];
  const day = now.getDate();
  const weekday = weekdays[now.getDay()];
  return { title: "今天", date: `${month} ${day} 日 ${weekday}` };
}

// 格式化日期为 YYYY-MM-DD
function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// 判断是否是同一天
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

// 主 HomePage 组件
interface HomePageProps {
  records?: Record[];
  tags?: string[];
  onOpenQuickAdd?: () => void;
  onEditRecord?: (id: string) => void;
}

export function HomePage({ onOpenQuickAdd, onEditRecord }: HomePageProps) {
  const records = useRelaxValue(recordsState) as Record[];
  const filter = useRelaxValue(filterState) as FilterState;

  // 筛选状态
  const [activeFilter, setActiveFilter] = useState<
    "all" | "in_progress" | "completed"
  >("all");

  // 获取今天的日期格式化
  const todayFormatted = useMemo(() => getTodayFormatted(), []);

  // 统计计算
  const stats = useMemo(() => {
    const today = new Date();
    const todayStr = formatDateKey(today);

    // 今日任务：所有日期为今天的任务
    const todayRecords = records.filter((record) => {
      const recordDate =
        record.plannedEndTime || record.plannedStartTime || record.createdAt;
      return formatDateKey(new Date(recordDate)) === todayStr;
    });

    // 已完成：今天且状态为 completed
    const completedToday = todayRecords.filter(
      (r) => r.status === "completed",
    ).length;

    // 紧急任务：截止日期 <= 今天
    const urgentTasks = records.filter((r) => {
      if (!r.plannedEndTime) return false;
      const endDate = formatDateKey(new Date(r.plannedEndTime));
      return endDate <= todayStr;
    }).length;

    return {
      total: todayRecords.length,
      completed: completedToday,
      urgent: urgentTasks,
    };
  }, [records]);

  // 筛选今天的任务
  const todayRecords = useMemo(() => {
    const today = new Date();
    const todayStr = formatDateKey(today);

    return records.filter((record) => {
      const recordDate =
        record.plannedEndTime || record.plannedStartTime || record.createdAt;
      const recordDateStr = formatDateKey(new Date(recordDate));
      return recordDateStr === todayStr;
    });
  }, [records]);

  // 根据筛选状态过滤任务
  const filteredRecords = useMemo(() => {
    if (activeFilter === "all") return todayRecords;
    return todayRecords.filter((r) => r.status === activeFilter);
  }, [todayRecords, activeFilter]);

  // 处理筛选变化
  const handleFilterChange = (
    filterType: "all" | "in_progress" | "completed",
  ) => {
    setActiveFilter(filterType);
    // 更新 store 筛选状态
    const newFilter =
      filterType === "all"
        ? { ...filter, status: null }
        : { ...filter, status: filterType };
    recordActions.setFilter(newFilter);
  };

  // 处理状态变化
  const handleStatusChange = (id: string, status: RecordStatus) => {
    recordActions.updateRecord(id, { status });
  };

  // 处理任务点击
  const handleTaskClick = (id: string) => {
    onEditRecord?.(id);
  };

  return (
    <div className={styles.homePage}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.headerTitle}>{todayFormatted.title}</h1>
          <div className={styles.headerDate}>{todayFormatted.date}</div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.avatar}>👤</div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <StatsCard number={stats.total} label="今日任务" />
        <StatsCard number={stats.completed} label="已完成" />
        <StatsCard number={stats.urgent} label="紧急任务" variant="danger" />
      </div>

      {/* Filter Pills */}
      <div className={styles.filterPills}>
        <button
          type="button"
          className={`${styles.filterPill} ${activeFilter === "all" ? styles.filterPillActive : ""}`}
          onClick={() => handleFilterChange("all")}
        >
          全部
        </button>
        <button
          type="button"
          className={`${styles.filterPill} ${activeFilter === "in_progress" ? styles.filterPillActive : ""}`}
          onClick={() => handleFilterChange("in_progress")}
        >
          进行中
        </button>
        <button
          type="button"
          className={`${styles.filterPill} ${activeFilter === "completed" ? styles.filterPillActive : ""}`}
          onClick={() => handleFilterChange("completed")}
        >
          已完成
        </button>
      </div>

      {/* Task Section */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>
            今日待办 · {filteredRecords.length}
          </div>
        </div>

        {filteredRecords.length > 0 ? (
          <div className={styles.taskList}>
            {filteredRecords.map((record) => (
              <TaskCard
                key={record.id}
                record={record}
                onStatusChange={handleStatusChange}
                onClick={handleTaskClick}
              />
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📝</div>
            <div className={styles.emptyText}>今天没有待办事项</div>
          </div>
        )}

        {/* Quick Add */}
        <div className={styles.quickAdd} onClick={onOpenQuickAdd}>
          <div className={styles.quickAddPlus}>
            <IconAdd size={18} />
          </div>
          <input
            type="text"
            className={styles.quickAddInput}
            placeholder="添加任务... (支持自然语言)"
            readOnly
          />
        </div>
      </div>
    </div>
  );
}
