import { useMemo } from 'react';
import type { Record } from '../../types';
import styles from './index.module.scss';

interface DashboardProps {
  records: Record[];
  onClick?: () => void;
}

export function Dashboard({ records, onClick }: DashboardProps) {
  const todayStats = useMemo(() => {
    const now = new Date();

    const incompleteRecords = records.filter(r => r.status !== 'completed');
    const pending = incompleteRecords.filter(r => r.status === 'pending').length;
    const inProgress = incompleteRecords.filter(r => r.status === 'in_progress').length;
    const completed = records.filter(r => r.status === 'completed').length;

    const delayed = incompleteRecords.filter(r => {
      const plannedStart = r.plannedStartTime || r.createdAt;
      const plannedEnd = r.plannedEndTime ? new Date(r.plannedEndTime) : new Date(r.createdAt);
      plannedEnd.setHours(23, 59, 59, 999);

      if (r.status === 'pending' && now > plannedStart) return true;
      if (r.status === 'in_progress' && now > plannedEnd) return true;
      return false;
    });

    const delayedStart = delayed.filter(r => r.status === 'pending').length;
    const delayedEnd = delayed.filter(r => r.status === 'in_progress').length;

    return { pending, inProgress, completed, incomplete: pending + inProgress, delayedStart, delayedEnd };
  }, [records]);

  return (
    <div className={styles.dashboardBar} onClick={onClick}>
      {/* 今日待完成 */}
      <div className={styles.dashboardSection}>
        <span className={styles.sectionLabel}>今日待完成</span>
        <span className={styles.statNumbers}>
          <span className={styles.num}>{todayStats.incomplete}</span>
          <span className={styles.sep}>/</span>
          <span className={`${styles.num} ${styles.completed}`}>{todayStats.completed}</span>
        </span>
      </div>

      {/* 今日延期 */}
      <div className={styles.dashboardSection}>
        <span className={styles.sectionLabel}>今日延期</span>
        <span className={styles.statNumbers}>
          <span className={`${styles.num} ${styles.delayed}`}>{todayStats.delayedStart}</span>
          <span className={styles.sep}>/</span>
          <span className={`${styles.num} ${styles.delayed}`}>{todayStats.delayedEnd}</span>
        </span>
      </div>
    </div>
  );
}
