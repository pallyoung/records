import { useState, useRef, useEffect } from 'react';
import type { Record, RecordStatus, RecurringConfig } from '../../types';
import styles from './index.module.scss';

interface RecordCardProps {
  record: Record;
  isSelected?: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onStatusChange?: (id: string, status: RecordStatus) => void;
}

// 根据状态获取颜色
function getStatusColor(status: RecordStatus): string {
  switch (status) {
    case 'pending': return 'purple';
    case 'in_progress': return 'coral';
    case 'completed': return 'teal';
    default: return 'purple';
  }
}

// 格式化时间范围
function formatTimeRange(record: Record): string {
  if (!record.plannedStartTime && !record.plannedEndTime) {
    return '';
  }

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${month}/${day} ${hours}:${minutes}`;
  };

  if (record.plannedStartTime && record.plannedEndTime) {
    return `${formatDate(record.plannedStartTime)} - ${formatDate(record.plannedEndTime)}`;
  } else if (record.plannedStartTime) {
    return `开始: ${formatDate(record.plannedStartTime)}`;
  } else if (record.plannedEndTime) {
    return `截止: ${formatDate(record.plannedEndTime)}`;
  }
  return '';
}

// 获取下一个状态
function getNextStatus(current: RecordStatus): RecordStatus | null {
  if (current === 'pending') return 'in_progress';
  if (current === 'in_progress') return 'completed';
  return null;
}

export function RecordCard({ record, isSelected = false, onEdit, onDelete, onStatusChange }: RecordCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeX, setSwipeX] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);

  const statusColor = getStatusColor(record.status);
  const timeRange = formatTimeRange(record);
  const nextStatus = getNextStatus(record.status);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  // 处理滑动
  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startXRef.current;
    if (diff < 0) {
      setSwipeX(Math.max(diff, -80));
    }
  };

  const handleTouchEnd = () => {
    if (swipeX < -50) {
      onDelete(record.id);
    }
    setSwipeX(0);
    setIsSwiping(false);
  };

  // 处理状态切换
  const handleStatusToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (nextStatus && onStatusChange) {
      onStatusChange(record.id, nextStatus);
    }
    setShowMenu(false);
  };

  // 处理编辑
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(record.id);
    setShowMenu(false);
  };

  // 处理删除
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(record.id);
    setShowMenu(false);
  };

  return (
    <div className={styles.cardWrapper}>
      {/* 删除按钮 */}
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
        className={`${styles.card} ${isSelected ? styles.selected : ''}`}
        style={{ transform: `translateX(${swipeX}px)` }}
        onClick={() => onEdit(record.id)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* 顶部彩色条 */}
        <div className={`${styles.colorBar} ${styles[statusColor]}`} />

        {/* 卡片内容 */}
        <div className={styles.cardContent}>
          {/* 标题行：标题 + 复选框 + 菜单 */}
          <div className={styles.titleRow}>
            {/* 标题 */}
            <h3 className={styles.title}>{record.content}</h3>

            {/* 右侧：复选框 + 菜单 */}
            <div className={styles.titleRight}>
              {/* 空心复选框 */}
              <button
                className={`${styles.checkbox} ${record.status === 'completed' ? styles.checked : ''}`}
                onClick={handleStatusToggle}
              >
                {record.status === 'completed' && (
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>

              {/* 三点菜单 */}
              <div className={styles.menuContainer} ref={menuRef}>
                <button
                  className={styles.menuButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                  }}
                >
                  <span></span>
                  <span></span>
                  <span></span>
                </button>

                {showMenu && (
                  <div className={styles.menu}>
                    <button onClick={handleEditClick}>
                      <svg viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                      编辑
                    </button>
                    {nextStatus && (
                      <button onClick={handleStatusToggle}>
                        <svg viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        {nextStatus === 'in_progress' ? '开始' : '完成'}
                      </button>
                    )}
                    <button className={styles.deleteBtn} onClick={handleDeleteClick}>
                      <svg viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      删除
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 底部信息行 - 时间 */}
          <div className={styles.infoRow}>
            {/* 时间和图标 */}
            {timeRange && (
              <div className={styles.timeInfo}>
                <svg className={styles.timeIcon} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span className={styles.timeText}>{timeRange}</span>
              </div>
            )}
            {/* 占位保持布局 */}
            {!timeRange && <div />}
          </div>

          {/* 标签 */}
          {record.tags.length > 0 && (
            <div className={styles.tags}>
              {record.tags.map(tag => (
                <span key={tag} className={styles.tag}>{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
