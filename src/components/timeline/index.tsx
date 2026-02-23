import type { Record as RecordType, RecordStatus } from '../../types';
import { RecordCard } from '../record-card';
import styles from './index.module.scss';

interface TimelineProps {
  records: RecordType[];
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

export function Timeline({ records, onEdit, onDelete, onStatusChange }: TimelineProps) {
  const groups = records.reduce((acc, record) => {
    const key = getGroupKey(new Date(record.createdAt));
    if (!acc[key]) acc[key] = [];
    acc[key].push(record);
    return acc;
  }, {} as Record<string, RecordType[]>);

  const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  return (
    <div className={styles.timeline}>
      {sortedKeys.map(key => (
        <div key={key} className={styles.timelineGroup}>
          <div className={styles.timelineHeader}>{formatGroupKey(key)}</div>
          <div className={styles.timelineContent}>
            {groups[key].map(record => (
              <RecordCard
                key={record.id}
                record={record}
                onEdit={onEdit}
                onDelete={onDelete}
                onStatusChange={onStatusChange}
              />
            ))}
          </div>
        </div>
      ))}
      {records.length === 0 && (
        <div className={styles.emptyState}>暂无记录</div>
      )}
    </div>
  );
}
