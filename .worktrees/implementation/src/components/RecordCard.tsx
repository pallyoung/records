import type { Record } from '../types';
import './RecordCard.css';

interface RecordCardProps {
  record: Record;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
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

export function RecordCard({ record, onEdit, onDelete }: RecordCardProps) {
  const statusText = getStatusText(record);
  const overdue = isOverdue(record);

  return (
    <div className={`record-card ${overdue ? 'overdue' : ''}`}>
      <div className="record-header">
        <span className={`status-badge ${record.status}`}>{statusText}</span>
        <div className="actions">
          <button onClick={() => onEdit(record.id)}>编辑</button>
          <button onClick={() => onDelete(record.id)}>删除</button>
        </div>
      </div>
      <div className="record-content">{record.content}</div>
      {record.images.length > 0 && (
        <div className="record-images">
          {record.images.map((img, i) => (
            <img key={i} src={img} alt="" />
          ))}
        </div>
      )}
      <div className="record-tags">
        {record.tags.map(tag => (
          <span key={tag} className="tag">{tag}</span>
        ))}
      </div>
    </div>
  );
}
