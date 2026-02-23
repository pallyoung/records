import { useState, useMemo } from 'react';
import type { Record as RecordType } from '../../types';
import styles from './index.module.scss';

interface ReviewPageProps {
  records: RecordType[];
  allTags: string[];
  onBack: () => void;
}

type DelayStatus = 'delayed' | 'on_time' | 'early';

function calculateDelayStatus(record: RecordType): DelayStatus | null {
  if (!record.plannedEndTime || !record.actualEndTime) return null;
  const planned = record.plannedEndTime.getTime();
  const actual = record.actualEndTime.getTime();
  const diff = actual - planned;
  const oneDay = 24 * 60 * 60 * 1000;

  if (diff > oneDay) return 'delayed';
  if (diff < -oneDay) return 'early';
  return 'on_time';
}

export function ReviewPage({ records, allTags, onBack }: ReviewPageProps) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const [startMonth, setStartMonth] = useState(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`);
  const [endMonth, setEndMonth] = useState(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const recordDate = new Date(record.createdAt);
      const monthKey = `${recordDate.getFullYear()}-${String(recordDate.getMonth() + 1).padStart(2, '0')}`;

      if (monthKey < startMonth || monthKey > endMonth) return false;

      if (selectedTags.length > 0) {
        return selectedTags.every(tag => record.tags.includes(tag));
      }

      return true;
    });
  }, [records, startMonth, endMonth, selectedTags]);

  const stats = useMemo(() => {
    const completed = filteredRecords.filter(r => r.status === 'completed');
    const delayed = completed.filter(r => calculateDelayStatus(r) === 'delayed').length;
    const onTime = completed.filter(r => calculateDelayStatus(r) === 'on_time').length;
    const early = completed.filter(r => calculateDelayStatus(r) === 'early').length;
    const below = completed.filter(r => r.review?.achievement === 'below').length;
    const met = completed.filter(r => r.review?.achievement === 'met').length;
    const exceeded = completed.filter(r => r.review?.achievement === 'exceeded').length;

    return { completed, delayed, onTime, early, below, met, exceeded, total: filteredRecords.length };
  }, [filteredRecords]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className={styles['review-page']}>
      <div className={styles['review-header']}>
        <button onClick={onBack}>← 返回</button>
        <h1>复盘</h1>
      </div>

      <div className={styles['review-filters']}>
        <div className={styles['filter-row']}>
          <label>时间范围</label>
          <div className={styles['month-picker']}>
            <input
              type="month"
              value={startMonth}
              onChange={e => setStartMonth(e.target.value)}
            />
            <span>至</span>
            <input
              type="month"
              value={endMonth}
              onChange={e => setEndMonth(e.target.value)}
            />
          </div>
        </div>

        <div className={styles['filter-row']}>
          <label>Tag</label>
          <div className={styles['tag-filters']}>
            <button
              className={selectedTags.length === 0 ? styles['active'] : ''}
              onClick={() => setSelectedTags([])}
            >
              全部
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                className={selectedTags.includes(tag) ? styles['active'] : ''}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles['review-stats']}>
        <div className={styles['stat-card']}>
          <div className={styles['stat-value']}>{stats.total}</div>
          <div className={styles['stat-label']}>总记录数</div>
        </div>
        <div className={styles['stat-card']}>
          <div className={styles['stat-value']}>{stats.completed.length}</div>
          <div className={styles['stat-label']}>已完成</div>
        </div>
        <div className={styles['stat-card']}>
          <div className={styles['stat-value']}>{stats.delayed}</div>
          <div className={styles['stat-label']}>延期</div>
        </div>
        <div className={styles['stat-card']}>
          <div className={styles['stat-value']}>{stats.onTime}</div>
          <div className={styles['stat-label']}>按期</div>
        </div>
        <div className={styles['stat-card']}>
          <div className={styles['stat-value']}>{stats.early}</div>
          <div className={styles['stat-label']}>提前</div>
        </div>
      </div>

      <div className={styles['review-achievement']}>
        <h3>计划达成</h3>
        <div className={styles['achievement-bars']}>
          <div className={styles['achievement-item']}>
            <span>未达预期</span>
            <div className={styles['bar']}>
              <div
                className={`${styles['bar-fill']} ${styles['below']}`}
                style={{ width: `${(stats.below / stats.completed.length) * 100 || 0}%` }}
              />
            </div>
            <span>{stats.below}</span>
          </div>
          <div className={styles['achievement-item']}>
            <span>达成预期</span>
            <div className={styles['bar']}>
              <div
                className={`${styles['bar-fill']} ${styles['met']}`}
                style={{ width: `${(stats.met / stats.completed.length) * 100 || 0}%` }}
              />
            </div>
            <span>{stats.met}</span>
          </div>
          <div className={styles['achievement-item']}>
            <span>超出预期</span>
            <div className={styles['bar']}>
              <div
                className={`${styles['bar-fill']} ${styles['exceeded']}`}
                style={{ width: `${(stats.exceeded / stats.completed.length) * 100 || 0}%` }}
              />
            </div>
            <span>{stats.exceeded}</span>
          </div>
        </div>
      </div>

      <div className={styles['review-details']}>
        <h3>详细记录</h3>
        {stats.completed.map(record => {
          const delayStatus = calculateDelayStatus(record);
          return (
            <div key={record.id} className={styles['review-item']}>
              <div className={styles['review-item-header']}>
                <span className={styles['review-tags']}>
                  {record.tags.map(t => <span key={t} className={styles['tag']}>{t}</span>)}
                </span>
                <span className={`${styles['delay-status']} ${styles[delayStatus || '']}`}>
                  {delayStatus === 'delayed' && '延期'}
                  {delayStatus === 'on_time' && '按期'}
                  {delayStatus === 'early' && '提前'}
                </span>
              </div>
              <div className={styles['review-item-content']}>{record.content}</div>
              {record.review && (
                <div className={styles['review-item-review']}>
                  <span className={`${styles['achievement']} ${styles[record.review.achievement]}`}>
                    {record.review.achievement === 'below' && '未达预期'}
                    {record.review.achievement === 'met' && '达成预期'}
                    {record.review.achievement === 'exceeded' && '超出预期'}
                  </span>
                  {record.review.details && (
                    <p>{record.review.details}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
