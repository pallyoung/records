import { useState, useRef } from 'react';
import type { Record, RecordStatus, RecurringConfig } from '../../types';
import styles from './index.module.scss';

interface RecordCardProps {
  record: Record;
  isSelected?: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onStatusChange?: (id: string, status: RecordStatus) => void;
}

function getDaysUntil(date?: Date): number | null {
  if (!date) return null;
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getStatusText(record: Record): string {
  const daysUntilStart = getDaysUntil(record.plannedStartTime);
  const daysUntilEnd = getDaysUntil(record.plannedEndTime);

  if (record.status === 'pending') {
    if (daysUntilStart !== null && daysUntilStart < 0) {
      return '已超期';
    }
    return daysUntilStart !== null ? `${daysUntilStart}天后开始` : '未开始';
  }

  if (record.status === 'in_progress') {
    if (daysUntilEnd !== null && daysUntilEnd < 0) {
      return '已超期';
    }
    return daysUntilEnd !== null ? `${daysUntilEnd}天后结束` : '进行中';
  }

  return '已完成';
}

function isOverdue(record: Record): boolean {
  if (record.status === 'pending' && record.plannedStartTime) {
    return new Date() > record.plannedStartTime;
  }
  if (record.status === 'in_progress' && record.plannedEndTime) {
    return new Date() > record.plannedEndTime;
  }
  return false;
}

// 获取下一个状态
function getNextStatus(current: RecordStatus): RecordStatus | null {
  if (current === 'pending') return 'in_progress';
  if (current === 'in_progress') return 'completed';
  return null;
}

// 获取状态按钮文本
function getStatusButtonText(current: RecordStatus): string {
  if (current === 'pending') return '开始';
  if (current === 'in_progress') return '完成';
  return '';
}

// 获取循环事务标签文本
const getRecurringLabel = (config: RecurringConfig) => {
  switch (config.frequency) {
    case 'daily': return '每日';
    case 'weekly': return '每周';
    case 'monthly': return '每月';
    case 'interval_days': return `每${config.intervalValue}天`;
    case 'interval_hours': return `每${config.intervalValue}小时`;
    default: return '循环';
  }
};

export function RecordCard({ record, isSelected = false, onEdit, onDelete, onStatusChange }: RecordCardProps) {
  const statusText = getStatusText(record);
  const overdue = isOverdue(record);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeX, setSwipeX] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);

  // 处理滑动删除
  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startXRef.current;
    // 只允许左滑显示删除
    if (diff < 0) {
      setSwipeX(Math.max(diff, -80));
    }
  };

  const handleTouchEnd = () => {
    if (swipeX < -50) {
      // 左滑超过50px，触发删除
      onDelete(record.id);
    }
    setSwipeX(0);
    setIsSwiping(false);
  };

  // 处理状态快速切换
  const handleStatusToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextStatus = getNextStatus(record.status);
    if (nextStatus && onStatusChange) {
      onStatusChange(record.id, nextStatus);
    }
  };

  const nextStatus = getNextStatus(record.status);
  const canToggleStatus = nextStatus !== null;

  return (
    <div className={styles.recordCardWrapper}>
      {/* 删除按钮（滑动时显示） */}
      <button
        className={styles.swipeDelete}
        onClick={() => onDelete(record.id)}
        style={{ opacity: swipeX < -20 ? 1 : 0 }}
      >
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      </button>

      {/* 卡片主体 */}
      <div
        ref={cardRef}
        className={`${styles.recordCard} ${overdue ? styles.overdue : ''} ${isSwiping ? styles.swiping : ''} ${isSelected ? styles.selected : ''}`}
        style={{ transform: `translateX(${swipeX}px)` }}
        onClick={() => onEdit(record.id)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className={styles.recordHeader}>
          <div className={styles.recordHeaderLeft}>
            <span className={`${styles.statusBadge} ${styles[record.status]}`}>{statusText}</span>
            {record.type === 'recurring' && record.recurringConfig && (
              <div className={styles.recurringBadge}>
                <span className={styles.recurringIcon}>🔄</span>
                <span>{getRecurringLabel(record.recurringConfig)}</span>
                {record.recurringConfig.totalCompletions > 0 && (
                  <span className={styles.completionCount}>
                    累计{record.recurringConfig.totalCompletions}次
                  </span>
                )}
              </div>
            )}
            {/* 状态切换按钮 */}
            {canToggleStatus && (
              <button
                className={styles.statusToggleBtn}
                onClick={handleStatusToggle}
                title={`切换到${getStatusButtonText(record.status)}`}
              >
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                {getStatusButtonText(record.status)}
              </button>
            )}
          </div>
        </div>
        <div className={styles.recordContent}>{record.content}</div>
        {record.images.length > 0 && (
          <div className={styles.recordImages}>
            {record.images.map((img, i) => (
              <img key={i} src={img} alt="" />
            ))}
          </div>
        )}
        <div className={styles.recordTags}>
          {record.tags.map(tag => (
            <span key={tag} className={styles.tag}>{tag}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
