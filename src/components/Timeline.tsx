import type { Record as RecordType, TimelineGranularity } from '../types';
import { RecordCard } from './RecordCard';
import './Timeline.css';

interface TimelineProps {
  records: RecordType[];
  granularity: TimelineGranularity;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

function getGroupKey(date: Date, granularity: TimelineGranularity): string {
  const d = new Date(date);
  if (granularity === 'day') {
    return d.toISOString().slice(0, 10);
  }
  if (granularity === 'week') {
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    return weekStart.toISOString().slice(0, 10);
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatGroupKey(key: string, granularity: TimelineGranularity): string {
  if (granularity === 'day') {
    const date = new Date(key);
    return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
  }
  if (granularity === 'week') {
    const date = new Date(key);
    return `${date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })} 周`;
  }
  const [year, month] = key.split('-');
  return `${year}年${parseInt(month)}月`;
}

export function Timeline({ records, granularity, onEdit, onDelete }: TimelineProps) {
  const groups = records.reduce((acc, record) => {
    const key = getGroupKey(new Date(record.createdAt), granularity);
    if (!acc[key]) acc[key] = [];
    acc[key].push(record);
    return acc;
  }, {} as Record<string, RecordType[]>);

  const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  return (
    <div className="timeline">
      {sortedKeys.map(key => (
        <div key={key} className="timeline-group">
          <div className="timeline-header">{formatGroupKey(key, granularity)}</div>
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
