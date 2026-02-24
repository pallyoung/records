import type { Record as RecordType, RecordStatus } from '../../types';
import { RecordCard } from '../record-card';
import { Skeleton } from '../skeleton';
import styles from './index.module.scss';

interface TimelineProps {
  records: RecordType[];
  selectedIndex?: number;
  loading?: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onStatusChange?: (id: string, status: RecordStatus) => void;
}

function getGroupKey(date: Date): string {
  const d = new Date(date);
  return d.toISOString().slice(0, 10);
}

function formatGroupKey(key: string): string {
  const date = new Date(key);
  return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
}

export function Timeline({ records, selectedIndex = 0, loading = false, onEdit, onDelete, onStatusChange }: TimelineProps) {
  if (loading) {
    return (
      <div className={styles.timeline}>
        <Skeleton count={5} variant="card" />
      </div>
    );
  }
  const groups = records.reduce((acc, record) => {
    const key = getGroupKey(new Date(record.createdAt));
    if (!acc[key]) acc[key] = [];
    acc[key].push(record);
    return acc;
  }, {} as Record<string, RecordType[]>);

  const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  // 计算扁平化的索引
  let flatIndex = 0;

  return (
    <div className={styles.timeline}>
      {sortedKeys.map(key => (
        <div key={key} className={styles.timelineGroup}>
          <div className={styles.timelineHeader}>{formatGroupKey(key)}</div>
          <div className={styles.timelineContent}>
            {groups[key].map(record => {
              const currentIndex = flatIndex++;
              return (
                <RecordCard
                  key={record.id}
                  record={record}
                  isSelected={currentIndex === selectedIndex}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onStatusChange={onStatusChange}
                />
              );
            })}
          </div>
        </div>
      ))}
      {records.length === 0 && (
        <div className={styles.emptyState}>暂无记录</div>
      )}
    </div>
  );
}
