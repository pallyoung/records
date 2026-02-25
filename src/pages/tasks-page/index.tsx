import { useState, useMemo } from "react";
import {
  useRelaxValue,
  recordActions,
  recordsState,
} from "../../store/recordStore";
import type { Record, RecordStatus } from "../../types";
import styles from "./index.module.scss";

// Page props interface
interface PageProps {
  records?: Record[];
  tags?: string[];
}

// Filter type
type FilterType =
  | "all"
  | "in_progress"
  | "completed"
  | "overdue"
  | "today"
  | "week";

// 日期分组类型
interface TimelineGroup {
  title: string;
  records: Record[];
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

// 判断是否是本周
function isThisWeek(date: Date): boolean {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  // 获取本周开始（周日）
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());

  // 获取本周结束（周六）
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  return targetDate >= weekStart && targetDate <= weekEnd;
}

// 判断是否已延期
function isOverdue(record: Record): boolean {
  if (record.status === "completed") return false;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const targetDate = record.plannedEndTime || record.plannedStartTime;
  if (!targetDate) return false;

  const recordDate = new Date(targetDate);
  const recordDateOnly = new Date(
    recordDate.getFullYear(),
    recordDate.getMonth(),
    recordDate.getDate(),
  );

  return recordDateOnly < today;
}

// 标签样式映射
function getTagClass(tag: string): string {
  const tagLower = tag.toLowerCase();
  if (tagLower.includes("工作") || tagLower === "work") return styles.tagWork;
  if (tagLower.includes("生活") || tagLower === "life") return styles.tagLife;
  if (tagLower.includes("学习") || tagLower === "learn") return styles.tagLearn;
  if (tagLower.includes("健康") || tagLower === "health")
    return styles.tagHealth;
  return styles.tagDefault;
}

// 格式化任务日期
function formatTaskDate(record: Record): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (!record.plannedEndTime) {
    if (record.plannedStartTime) {
      const start = new Date(record.plannedStartTime);
      const startDate = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate(),
      );
      if (startDate.getTime() === today.getTime()) return "今天";
      if (startDate.getTime() === tomorrow.getTime()) return "明天";
      return `${start.getMonth() + 1}/${start.getDate()}`;
    }
    return "";
  }

  const end = new Date(record.plannedEndTime);
  const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  if (endDate.getTime() === today.getTime()) {
    const hours = end.getHours().toString().padStart(2, "0");
    const minutes = end.getMinutes().toString().padStart(2, "0");
    return `今天 ${hours}:${minutes}`;
  }

  if (endDate.getTime() === tomorrow.getTime()) return "明天";
  return `${end.getMonth() + 1}/${end.getDate()}`;
}

// 状态类名映射
function getStatusClass(status: RecordStatus): string {
  switch (status) {
    case "pending":
      return styles.statusPending;
    case "in_progress":
      return styles.statusInProgress;
    case "completed":
      return styles.statusCompleted;
    default:
      return styles.statusPending;
  }
}

// 任务卡片组件
interface TaskCardProps {
  record: Record;
  onStatusChange: (id: string, status: RecordStatus) => void;
  onClick: (id: string) => void;
}

function TaskCard({ record, onStatusChange, onClick }: TaskCardProps) {
  const dateStr = formatTaskDate(record);
  const primaryTag = record.tags[0];

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextStatus: RecordStatus =
      record.status === "pending"
        ? "in_progress"
        : record.status === "in_progress"
          ? "completed"
          : "pending";
    if (nextStatus) {
      onStatusChange(record.id, nextStatus);
    }
  };

  return (
    <div className={styles.taskCard} onClick={() => onClick(record.id)}>
      <div className={`${styles.statusDot} ${getStatusClass(record.status)}`} />
      <div className={styles.taskContent}>
        <div
          className={`${styles.taskTitle} ${record.status === "completed" ? styles.taskTitleCompleted : ""}`}
        >
          {record.content}
        </div>
        <div className={styles.taskMeta}>
          {primaryTag && (
            <span className={`${styles.taskTag} ${getTagClass(primaryTag)}`}>
              {primaryTag}
            </span>
          )}
          {dateStr && <span className={styles.taskDate}>{dateStr}</span>}
        </div>
      </div>
      <div className={styles.taskActions}>
        <button
          className={`${styles.taskCheckbox} ${record.status === "completed" ? styles.taskCheckboxChecked : ""}`}
          onClick={handleCheckboxClick}
          aria-label={
            record.status === "completed" ? "标记为未完成" : "标记为完成"
          }
        >
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <button className={styles.taskMenu} aria-label="更多操作">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="6" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="12" cy="18" r="2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// 主 TasksPage 组件
interface TasksPageProps {
  records?: Record[];
  tags?: string[];
  onEditRecord?: (id: string) => void;
}

export function TasksPage({ onEditRecord }: TasksPageProps) {
  const records = useRelaxValue(recordsState) as Record[];

  // 搜索和筛选状态
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  // 按日期分组的任务
  const groupedRecords = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 1. 筛选搜索
    let filtered = records;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = records.filter(
        (r) =>
          r.content.toLowerCase().includes(query) ||
          r.tags.some((tag) => tag.toLowerCase().includes(query)),
      );
    }

    // 2. 按筛选状态过滤
    let statusFiltered = filtered;
    switch (activeFilter) {
      case "in_progress":
        statusFiltered = filtered.filter((r) => r.status === "in_progress");
        break;
      case "completed":
        statusFiltered = filtered.filter((r) => r.status === "completed");
        break;
      case "overdue":
        statusFiltered = filtered.filter((r) => isOverdue(r));
        break;
      case "today":
        statusFiltered = filtered.filter((r) => {
          const targetDate =
            r.plannedEndTime || r.plannedStartTime || r.createdAt;
          return isSameDay(new Date(targetDate), today);
        });
        break;
      case "week":
        statusFiltered = filtered.filter((r) => {
          const targetDate =
            r.plannedEndTime || r.plannedStartTime || r.createdAt;
          return isThisWeek(new Date(targetDate));
        });
        break;
      default:
        // "all" - 不过滤
        break;
    }

    // 3. 按日期分组
    const groups: TimelineGroup[] = [];
    const todayRecords: Record[] = [];
    const tomorrowRecords: Record[] = [];
    const weekRecords: Record[] = [];
    const otherRecords: Record[] = [];

    const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

    statusFiltered.forEach((record) => {
      const targetDate =
        record.plannedEndTime || record.plannedStartTime || record.createdAt;
      const date = new Date(targetDate);
      const dateOnly = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
      );

      if (dateOnly.getTime() === today.getTime()) {
        todayRecords.push(record);
      } else if (dateOnly.getTime() === tomorrow.getTime()) {
        tomorrowRecords.push(record);
      } else if (isThisWeek(date)) {
        weekRecords.push(record);
      } else {
        // 按日期排序放入其他
        const existingIndex = otherRecords.findIndex((r) => {
          const rDate = r.plannedEndTime || r.plannedStartTime || r.createdAt;
          return new Date(rDate).getTime() === dateOnly.getTime();
        });
        if (existingIndex === -1) {
          otherRecords.push(record);
        } else {
          otherRecords.splice(existingIndex, 0, record);
        }
      }
    });

    // 按日期排序其他记录
    otherRecords.sort((a, b) => {
      const aDate = a.plannedEndTime || a.plannedStartTime || a.createdAt;
      const bDate = b.plannedEndTime || b.plannedStartTime || b.createdAt;
      return new Date(aDate).getTime() - new Date(bDate).getTime();
    });

    // 构建分组
    if (todayRecords.length > 0) {
      groups.push({
        title: "今天",
        records: todayRecords,
      });
    }
    if (tomorrowRecords.length > 0) {
      groups.push({
        title: "明天",
        records: tomorrowRecords,
      });
    }
    if (weekRecords.length > 0) {
      groups.push({
        title: "本周",
        records: weekRecords,
      });
    }
    if (otherRecords.length > 0) {
      // 按日期进一步分组
      const dateGroups: { [key: string]: Record[] } = {};
      otherRecords.forEach((record) => {
        const targetDate =
          record.plannedEndTime || record.plannedStartTime || record.createdAt;
        const date = new Date(targetDate);
        const key = formatDateKey(date);
        if (!dateGroups[key]) {
          dateGroups[key] = [];
        }
        dateGroups[key].push(record);
      });

      // 转换为分组
      Object.entries(dateGroups).forEach(([key, recs]) => {
        const date = new Date(key);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const weekday = weekdays[date.getDay()];
        groups.push({
          title: `${month}月${day}日 ${weekday}`,
          records: recs,
        });
      });
    }

    return groups;
  }, [records, searchQuery, activeFilter]);

  // 处理筛选变化
  const handleFilterChange = (filterType: FilterType) => {
    setActiveFilter(filterType);
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
    <div className={styles.tasksPage}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>任务</h1>
        <div className={styles.headerRight}>
          <div className={styles.avatar}>👤</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className={styles.searchBar}>
        <svg
          className={styles.searchIcon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="搜索任务..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <span className={styles.searchFilterBtn}>筛选</span>
      </div>

      {/* Filter Pills */}
      <div className={styles.filterPills}>
        <button
          className={`${styles.filterPill} ${activeFilter === "all" ? styles.filterPillActive : ""}`}
          onClick={() => handleFilterChange("all")}
        >
          全部
        </button>
        <button
          className={`${styles.filterPill} ${activeFilter === "in_progress" ? styles.filterPillActive : ""}`}
          onClick={() => handleFilterChange("in_progress")}
        >
          进行中
        </button>
        <button
          className={`${styles.filterPill} ${activeFilter === "completed" ? styles.filterPillActive : ""}`}
          onClick={() => handleFilterChange("completed")}
        >
          已完成
        </button>
        <button
          className={`${styles.filterPill} ${activeFilter === "overdue" ? styles.filterPillActive : ""}`}
          onClick={() => handleFilterChange("overdue")}
        >
          已延期
        </button>
        <button
          className={`${styles.filterPill} ${activeFilter === "today" ? styles.filterPillActive : ""}`}
          onClick={() => handleFilterChange("today")}
        >
          今天
        </button>
        <button
          className={`${styles.filterPill} ${activeFilter === "week" ? styles.filterPillActive : ""}`}
          onClick={() => handleFilterChange("week")}
        >
          本周
        </button>
      </div>

      {/* Timeline Groups */}
      <div className={styles.timelineContainer}>
        {groupedRecords.length > 0 ? (
          groupedRecords.map((group) => (
            <div key={group.title} className={styles.timelineGroup}>
              <div className={styles.timelineDate}>{group.title}</div>
              <div className={styles.taskList}>
                {group.records.map((record) => (
                  <TaskCard
                    key={record.id}
                    record={record}
                    onStatusChange={handleStatusChange}
                    onClick={handleTaskClick}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📝</div>
            <div className={styles.emptyText}>没有找到任务</div>
          </div>
        )}
      </div>
    </div>
  );
}
