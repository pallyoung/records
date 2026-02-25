import { useState, useRef, useEffect } from 'react';
import type { Record, RecordStatus } from '../../types';
import styles from './index.module.scss';

interface RecordCardProps {
  record: Record;
  isSelected?: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onStatusChange?: (id: string, status: RecordStatus) => void;
}

// 根据状态获取 CSS 类
function getStatusClass(status: RecordStatus): string {
  switch (status) {
    case 'pending': return styles.pending;
    case 'in_progress': return styles.inProgress;
    case 'completed': return styles.completed;
    default: return styles.pending;
  }
}

// 格式化日期
function formatDate(record: Record): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (!record.plannedEndTime) {
    if (record.plannedStartTime) {
      const start = new Date(record.plannedStartTime);
      const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());

      if (startDate.getTime() === today.getTime()) return '今天';
      if (startDate.getTime() === tomorrow.getTime()) return '明天';

      return `${start.getMonth() + 1}/${start.getDate()}`;
    }
    return '';
  }

  const end = new Date(record.plannedEndTime);
  const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  if (endDate.getTime() === today.getTime()) {
    const hours = end.getHours().toString().padStart(2, '0');
    const minutes = end.getMinutes().toString().padStart(2, '0');
    return `今天 ${hours}:${minutes}`;
  }

  if (endDate.getTime() === tomorrow.getTime()) return '明天';

  // 过期检测
  if (endDate < today && record.status !== 'completed') {
    return `${end.getMonth() + 1}/${end.getDate()} 已过期`;
  }

  return `${end.getMonth() + 1}/${end.getDate()}`;
}

// 获取标签颜色类
function getTagClass(tag: string): string {
  const tagLower = tag.toLowerCase();
  if (tagLower.includes('工作') || tagLower === 'work') return styles.work;
  if (tagLower.includes('生活') || tagLower === 'life') return styles.life;
  if (tagLower.includes('学习') || tagLower === 'learn') return styles.learn;
  if (tagLower.includes('健康') || tagLower === 'health') return styles.health;
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
  const menuRef = useRef<HTMLDivElement>(null);

  const statusClass = getStatusClass(record.status);
  const dateStr = formatDate(record);
  const nextStatus = getNextStatus(record.status);
  const isOverdue = dateStr.includes('已过期');

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

  const primaryTag = record.tags[0];

  return (
    <div className={styles.cardWrapper}>
      {/* 卡片主体 */}
      <div
        className={`${styles.card} ${isSelected ? styles.selected : ''}`}
        onClick={() => onEdit(record.id)}
      >
        {/* 状态圆点 */}
        <div className={`${styles.statusDot} ${statusClass}`} />

        {/* 内容 */}
        <div className={styles.cardContent}>
          <h3 className={`${styles.title} ${record.status === 'completed' ? styles.completed : ''}`}>
            {record.content}
          </h3>
          <div className={styles.meta}>
            {primaryTag && (
              <span className={`${styles.tag} ${getTagClass(primaryTag)}`}>
                {primaryTag}
              </span>
            )}
            {dateStr && (
              <span className={`${styles.date} ${isOverdue ? styles.overdue : ''}`}>
                {dateStr}
              </span>
            )}
          </div>
        </div>

        {/* 操作 */}
        <div className={styles.actions}>
          {/* 复选框 */}
          <button
            className={`${styles.checkbox} ${record.status === 'completed' ? styles.checked : ''}`}
            onClick={handleStatusToggle}
            aria-label={record.status === 'completed' ? '标记为未完成' : '标记为完成'}
          >
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>

          {/* 菜单 */}
          <div className={styles.menuContainer} ref={menuRef}>
            <button
              className={styles.menuButton}
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              aria-label="更多操作"
            >
              <span className={styles.menuDot}></span>
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
    </div>
  );
}
