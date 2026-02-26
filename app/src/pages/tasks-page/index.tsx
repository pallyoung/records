import { useState, useMemo } from "react";
import {
  useRelaxValue,
  recordActions,
  recordsState,
} from "../../store/recordStore";
import { IconSearch } from "../../shared/icons";
import { TaskCard } from "../../components/task-card";
import type { Record, RecordStatus } from "../../types";
import styles from "./index.module.scss";

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
        <IconSearch className={styles.searchIcon} size={18} />
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
        <button
          type="button"
          className={`${styles.filterPill} ${activeFilter === "overdue" ? styles.filterPillActive : ""}`}
          onClick={() => handleFilterChange("overdue")}
        >
          已延期
        </button>
        <button
          type="button"
          className={`${styles.filterPill} ${activeFilter === "today" ? styles.filterPillActive : ""}`}
          onClick={() => handleFilterChange("today")}
        >
          今天
        </button>
        <button
          type="button"
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
                    showMenu
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
