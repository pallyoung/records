import { useState } from 'react';
import type { FilterState, RecordStatus } from '../types';
import './FilterBar.css';

interface FilterBarProps {
  filter: FilterState;
  tags: string[];
  onFilterChange: (filter: FilterState) => void;
}

export function FilterBar({
  filter,
  tags,
  onFilterChange,
}: FilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllTags, setShowAllTags] = useState(false);

  // 可见标签数量限制
  const VISIBLE_TAG_COUNT = 5;
  const visibleTags = showAllTags ? tags : tags.slice(0, VISIBLE_TAG_COUNT);
  const hasMoreTags = tags.length > VISIBLE_TAG_COUNT;

  const handleTagToggle = (tag: string) => {
    const newTags = filter.tags.includes(tag)
      ? filter.tags.filter(t => t !== tag)
      : [...filter.tags, tag];
    onFilterChange({ ...filter, tags: newTags });
  };

  const handleStatusChange = (status: RecordStatus | null) => {
    onFilterChange({ ...filter, status });
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    // 触发自定义事件通知搜索变化
    window.dispatchEvent(new CustomEvent('filterSearchChange', { detail: value }));
  };

  const clearFilters = () => {
    onFilterChange({ tags: [], status: null });
    setSearchQuery('');
  };

  // 计算激活的筛选数量
  const activeFilterCount = (filter.status ? 1 : 0) + filter.tags.length;
  const hasActiveFilters = activeFilterCount > 0 || searchQuery;

  return (
    <div className={`filter-bar ${isExpanded ? 'expanded' : ''}`}>
      {/* 头部行 - 始终显示 */}
      <div className="filter-bar-header">
        <div className="filter-search">
          <svg className="search-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          <input
            type="text"
            placeholder="搜索内容或标签..."
            value={searchQuery}
            onChange={e => handleSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search" onClick={() => handleSearchChange('')}>
              ×
            </button>
          )}
        </div>

        <div className="filter-header-actions">


          {/* 展开/折叠按钮 */}
          <button
            className={`expand-btn ${isExpanded ? 'active' : ''}`}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <span>筛选</span>
            {activeFilterCount > 0 && (
              <span className="filter-badge">{activeFilterCount}</span>
            )}
            <svg className="expand-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* 展开区域 */}
      {isExpanded && (
        <div className="filter-bar-content">
          {/* 状态选择 - 展开时显示按钮组 */}
          <div className="filter-group">
            <label>状态</label>
            <div className="filter-options">
              <button
                className={filter.status === 'pending' ? 'active' : ''}
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

          {/* 标签选择 */}
          {tags.length > 0 && (
            <div className="filter-group">
              <label>
                标签
                {filter.tags.length > 0 && (
                  <span className="selected-count">已选 {filter.tags.length} 个</span>
                )}
              </label>
              <div className="filter-tags">
                {visibleTags.map(tag => (
                  <button
                    key={tag}
                    className={filter.tags.includes(tag) ? 'active' : ''}
                    onClick={() => handleTagToggle(tag)}
                  >
                    {tag}
                  </button>
                ))}
                {hasMoreTags && (
                  <button
                    className="show-more-tags"
                    onClick={() => setShowAllTags(!showAllTags)}
                  >
                    {showAllTags ? '收起' : `+${tags.length - VISIBLE_TAG_COUNT} 个`}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 底部操作 */}
          {hasActiveFilters && (
            <div className="filter-actions">
              <button className="clear-filters" onClick={clearFilters}>
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                清除筛选
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
