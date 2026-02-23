import type { Record as RecordType } from '../types';
import { RecordCard } from './RecordCard';
import './Timeline.css';

interface TimelineProps {
  records: RecordType[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

function getGroupKey(date: Date): string {
  const d = new Date(date);
  return d.toISOString().slice(0, 10);
}

function formatGroupKey(key: string): string {
  const date = new Date(key);
  return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
}

export function Timeline({ records, onEdit, onDelete }: TimelineProps) {
  const groups = records.reduce((acc, record) => {
    const key = getGroupKey(new Date(record.createdAt));
    if (!acc[key]) acc[key] = [];
    acc[key].push(record);
    return acc;
  }, {} as Record<string, RecordType[]>);

  const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  return (
    <div className="timeline">
      {sortedKeys.map(key => (
        <div key={key} className="timeline-group">
          <div className="timeline-header">{formatGroupKey(key)}</div>
          <div className="timeline-content">
            {groups[key].map(record => (
              <RecordCard
                key={record.id}
                record={record}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      ))}
      {records.length === 0 && (
        <div className="empty-state">暂无记录</div>
      )}
    </div>
  );
}
