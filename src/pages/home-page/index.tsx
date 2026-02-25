import { useState, useMemo } from "react";
import {
  useRelaxValue,
  recordActions,
  recordsState,
  filterState,
} from "../../store/recordStore";
import { IconAdd, IconCheck } from "../../shared/icons";
import type { Record, RecordStatus, FilterState } from "../../types";
import styles from "./index.module.scss";

// Page props interface
interface PageProps {
  records?: Record[];
  tags?: string[];
}

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

// 获取某月的天数
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// 获取某月的第一天是星期几
function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
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

// CalendarMini 组件
interface CalendarMiniProps {
  onDateSelect?: (date: Date) => void;
}

function CalendarMini({ onDateSelect }: CalendarMiniProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const today = new Date();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const monthNames = [
    "一月",
    "二月",
    "三月",
    "四月",
    "五月",
    "六月",
    "七月",
    "八月",
    "九月",
    "十月",
    "十一月",
    "十二月",
  ];
  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];

  // 生成日历格子
  const calendarDays = useMemo(() => {
    const days: { day: number; isToday: boolean; isCurrentMonth: boolean }[] =
      [];

    // 上个月的天数
    const prevMonthDays = getDaysInMonth(year, month - 1);
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        isToday: false,
        isCurrentMonth: false,
      });
    }

    // 当月的天数
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        isToday: isSameDay(new Date(year, month, i), today),
        isCurrentMonth: true,
      });
    }

    // 下个月的天数填满格子
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        day: i,
        isToday: false,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [year, month, daysInMonth, firstDay]);

  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDateClick = (dayInfo: {
    day: number;
    isCurrentMonth: boolean;
  }) => {
    if (!dayInfo.isCurrentMonth || onDateSelect) {
      const selectedDate = new Date(year, month, dayInfo.day);
      onDateSelect?.(selectedDate);
    }
  };

  return (
    <div className={styles.calendarMini}>
      <div className={styles.calendarHeader}>
        <span className={styles.calendarMonth}>
          {monthNames[month]} {year}
        </span>
        <div className={styles.calendarNav}>
          <button onClick={goToPrevMonth} aria-label="上个月">
            ‹
          </button>
          <button onClick={goToNextMonth} aria-label="下个月">
            ›
          </button>
        </div>
      </div>
      <div className={styles.calendarGrid}>
        {weekdays.map((day) => (
          <div key={day} className={styles.calendarWeekday}>
            {day}
          </div>
        ))}
        {calendarDays.map((dayInfo, index) => (
          <div
            key={index}
            className={`${styles.calendarDay} ${dayInfo.isToday ? styles.today : ""} ${!dayInfo.isCurrentMonth ? styles.otherMonth : ""}`}
            onClick={() => handleDateClick(dayInfo)}
          >
            {dayInfo.day}
          </div>
        ))}
      </div>
    </div>
  );
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
          <IconCheck size={16} />
        </button>
      </div>
    </div>
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

      {/* CalendarMini */}
      <CalendarMini />

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
