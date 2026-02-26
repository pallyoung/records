import type React from "react";
import { IconCheck, IconMore } from "../../shared/icons";
import type { Record, RecordStatus } from "../../types";
import styles from "./index.module.scss";
import {
  calculateProgress,
  isOverdue,
  getOverdueDays,
  getStartDelayDays,
} from "../../utils/progress";

// 获取任务时间提醒文案
function getTimeReminder(record: Record): string | null {
  const now = new Date();
  const status = record.status;

  // 没有计划时间则不显示
  if (!record.plannedStartTime && !record.plannedEndTime) {
    return null;
  }

  // 已完成不显示
  if (status === "completed") {
    return null;
  }

  // 有计划开始时间的情况
  if (record.plannedStartTime) {
    const startTime = new Date(record.plannedStartTime);

    // 未开始（pending 状态且未到开始时间）
    if (status === "pending" && now < startTime) {
      const diffMs = startTime.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 0) {
        return "今天开始";
      } else if (diffDays === 1) {
        return "明天开始";
      }
      return `预计${diffDays}天后开始`;
    }

    // 已延期开始（超过计划开始时间）
    if (now > startTime) {
      const diffMs = now.getTime() - startTime.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return `已延期${diffDays}天`;
    }
  }

  // 进行中状态，显示预计结束时间
  if (status === "in_progress" && record.plannedEndTime) {
    const endTime = new Date(record.plannedEndTime);

    // 已延期完成
    if (now > endTime) {
      const diffMs = now.getTime() - endTime.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return `延期${diffDays}天`;
    }

    // 预计结束
    const diffMs = endTime.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) {
      return "今天结束";
    } else if (diffDays === 1) {
      return "明天结束";
    }
    return `预计${diffDays}天后结束`;
  }

  return null;
}

interface TaskCardProps {
  record: Record;
  onStatusChange: (id: string, status: RecordStatus) => void;
  onClick: (id: string) => void;
  showMenu?: boolean;
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
    }
    return "";
  }

  const end = new Date(record.plannedEndTime);
  const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  if (endDate.getTime() === today.getTime()) return "今天";
  if (endDate.getTime() === tomorrow.getTime()) return "明天";

  return "";
}

// 状态样式映射
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

// 渲染内容，将 #标签 转换为带样式的 span
function renderContentWithTags(content: string): React.ReactNode {
  // 按 # 分隔，# 后面的内容作为标签
  const parts = content.split(/(#\S+)/g);

  return parts.map((part, index) => {
    if (part.startsWith("#")) {
      // 去掉 # 前缀获取标签名
      const tag = part.slice(1);
      return (
        <span key={index} className={styles.inlineTag}>
          {tag}
        </span>
      );
    }
    return part;
  });
}

export function TaskCard({
  record,
  onStatusChange,
  onClick,
  showMenu = false,
}: TaskCardProps) {
  const dateStr = formatTaskDate(record);
  const progress = calculateProgress(record);
  const overdue = isOverdue(record);
  const overdueDays = getOverdueDays(record);
  const timeReminder = getTimeReminder(record);
  const startDelayDays = getStartDelayDays(record);

  let progressClass = styles.progressNormal;
  if (record.status === "completed") {
    progressClass = styles.progressCompleted;
  } else if (overdue) {
    progressClass = styles.progressOverdue;
  }

  // 判断时间提醒是否为延期（用于颜色区分）
  const isReminderOverdue =
    timeReminder?.includes("延期") || timeReminder?.includes("已延期");

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
          {renderContentWithTags(record.content)}
        </div>
        <div className={styles.taskMeta}>
          {dateStr && <span className={styles.taskDate}>{dateStr}</span>}
        </div>
        {/* Progress bar + Time reminder */}
        <div className={styles.progressRow}>
          <div className={styles.progressBar}>
            <div
              className={`${styles.progressFill} ${progressClass}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          {/* Time reminder */}
          {(timeReminder || startDelayDays > 0) && (
            <div className={styles.timeReminder}>
              {startDelayDays > 0 && !timeReminder && (
                <span
                  className={`${styles.reminderText} ${styles.reminderOverdue}`}
                >
                  开始延期 {startDelayDays} 天
                </span>
              )}
              {timeReminder && (
                <span
                  className={`${styles.reminderText} ${
                    isReminderOverdue
                      ? styles.reminderOverdue
                      : styles.reminderNormal
                  }`}
                >
                  {timeReminder}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      <div className={styles.taskActions}>
        <button
          type="button"
          className={`${styles.taskCheckbox} ${record.status === "completed" ? styles.taskCheckboxChecked : ""}`}
          onClick={handleCheckboxClick}
          aria-label={
            record.status === "completed" ? "标记为未完成" : "标记为完成"
          }
        >
          <IconCheck size={16} />
        </button>
        {showMenu && (
          <button
            type="button"
            className={styles.taskMenu}
            aria-label="更多操作"
          >
            <IconMore size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
