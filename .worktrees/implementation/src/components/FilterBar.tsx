import type { FilterState, RecordStatus, TimelineGranularity } from '../types';
import './FilterBar.css';

interface FilterBarProps {
  filter: FilterState;
  tags: string[];
  granularity: TimelineGranularity;
  onFilterChange: (filter: FilterState) => void;
  onGranularityChange: (granularity: TimelineGranularity) => void;
}

export function FilterBar({
  filter,
  tags,
  granularity,
  onFilterChange,
  onGranularityChange,
}: FilterBarProps) {
  const handleTagToggle = (tag: string) => {
    const newTags = filter.tags.includes(tag)
      ? filter.tags.filter(t => t !== tag)
      : [...filter.tags, tag];
    onFilterChange({ ...filter, tags: newTags });
  };

  const handleStatusChange = (status: RecordStatus | null) => {
    onFilterChange({ ...filter, status });
  };

  return (
    <div className="filter-bar">
      <div className="filter-section">
        <label>状态</label>
        <div className="filter-buttons">
          <button
            className={filter.status === null ? 'active' : ''}
            onClick={() => handleStatusChange(null)}
          >
            全部
          </button>
          <button
            className={filter.status === 'pending' ? 'active' : ''}
            onClick={() => handleStatusChange('pending')}
          >
            未开始
          </button>
          <button
            className={filter.status === 'in_progress' ? 'active' : ''}
            onClick={() => handleStatusChange('in_progress')}
          >
            进行中
          </button>
          <button
            className={filter.status === 'completed' ? 'active' : ''}
            onClick={() => handleStatusChange('completed')}
          >
            已完成
          </button>
        </div>
      </div>

      <div className="filter-section">
        <label>Tag</label>
        <div className="filter-tags">
          {tags.map(tag => (
            <button
              key={tag}
              className={filter.tags.includes(tag) ? 'active' : ''}
              onClick={() => handleTagToggle(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <label>时间粒度</label>
        <div className="filter-buttons">
          <button
            className={granularity === 'day' ? 'active' : ''}
            onClick={() => onGranularityChange('day')}
          >
            按天
          </button>
          <button
            className={granularity === 'week' ? 'active' : ''}
            onClick={() => onGranularityChange('week')}
          >
            按周
          </button>
          <button
            className={granularity === 'month' ? 'active' : ''}
            onClick={() => onGranularityChange('month')}
          >
            按月
          </button>
        </div>
      </div>
    </div>
  );
}
