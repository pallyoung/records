import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Record, RecordStatus, Achievement } from '../../types';
import { useTags } from '../../hooks/useTags';
import styles from './index.module.scss';

interface RecordFormProps {
  record?: Record;
  existingTags: string[];
  records?: Record[];
  onClose: () => void;
  onSave: (data: Omit<Record, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export function RecordForm({ record, records = [], onClose, onSave }: RecordFormProps) {
  const isNewRecord = !record;
  const { allTags, addCustomTag, getFrequentTags } = useTags();
  const [showAllTags, setShowAllTags] = useState(false);

  // 计算高频标签
  const frequentTags = useMemo(() => getFrequentTags(records, 8), [records, getFrequentTags]);

  const [content, setContent] = useState(record?.content || '');
  const [tags, setTags] = useState<string[]>(record?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [images, setImages] = useState<string[]>(record?.images || []);
  const [status, setStatus] = useState<RecordStatus>(record?.status || 'pending');
  const [plannedStartTime, setPlannedStartTime] = useState(
    record?.plannedStartTime?.toISOString().slice(0, 16) || ''
  );
  const [plannedEndTime, setPlannedEndTime] = useState(
    record?.plannedEndTime?.toISOString().slice(0, 16) || ''
  );
  const [reviewAchievement, setReviewAchievement] = useState<Achievement | ''>(
    record?.review?.achievement || ''
  );
  const [reviewDetails, setReviewDetails] = useState(record?.review?.details || '');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // 构建保存数据
  const buildSaveData = useCallback(() => ({
    content,
    tags,
    images,
    status,
    plannedStartTime: plannedStartTime ? new Date(plannedStartTime) : undefined,
    plannedEndTime: plannedEndTime ? new Date(plannedEndTime) : undefined,
    actualStartTime: record?.actualStartTime,
    actualEndTime: record?.actualEndTime,
    review: reviewAchievement ? {
      achievement: reviewAchievement as Achievement,
      details: reviewDetails,
    } : undefined,
  }), [content, tags, images, status, plannedStartTime, plannedEndTime, reviewAchievement, reviewDetails, record]);

  // 防抖保存函数（仅用于编辑已有记录）
  const debouncedSave = useCallback(
    (() => {
      let timeoutId: ReturnType<typeof setTimeout>;
      return (data: Parameters<typeof onSave>[0]) => {
        setIsSaving(true);
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          onSave(data);
          setIsSaving(false);
          setLastSaved(new Date());
        }, 1000);
      };
    })(),
    [onSave]
  );

  // 监听字段变化，自动保存（仅对编辑现有记录生效）
  useEffect(() => {
    if (isNewRecord) return; // 新建记录不自动保存
    debouncedSave(buildSaveData());
  }, [content, tags, images, status, plannedStartTime, plannedEndTime, reviewAchievement, reviewDetails]);

  // 手动保存（新建记录时使用）
  const handleSave = () => {
    if (!content.trim()) {
      alert('请输入内容');
      return;
    }
    setIsSaving(true);
    onSave(buildSaveData());
    setIsSaving(false);
    setLastSaved(new Date());
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter(t => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = tagInput.trim();
      if (value) {
        addCustomTag(value);
        if (!tags.includes(value)) {
          setTags([...tags, value]);
        }
        setTagInput('');
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleStatusChange = (newStatus: RecordStatus) => {
    const now = new Date();
    if (newStatus === 'in_progress' && !record?.actualStartTime) {
      setPlannedStartTime(now.toISOString().slice(0, 16));
    }
    if (newStatus === 'completed' && !record?.actualEndTime) {
      setPlannedEndTime(now.toISOString().slice(0, 16));
    }
    setStatus(newStatus);
  };

  // 格式化保存时间
  const formatSaveTime = () => {
    if (!lastSaved) return '';
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastSaved.getTime()) / 1000);
    if (diff < 60) return '刚刚保存';
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前保存`;
    return lastSaved.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.recordForm} onClick={e => e.stopPropagation()}>
        <div className={styles.formHeader}>
          <h2>{record ? '编辑记录' : '新建记录'}</h2>
          <div className={styles.saveStatus}>
            {isSaving ? (
              <span className={styles.saving}>保存中...</span>
            ) : lastSaved ? (
              <span className={styles.saved}>{formatSaveTime()}</span>
            ) : null}
          </div>
          <div className={styles.headerButtons}>
            {isNewRecord && (
              <button className={styles.saveBtn} onClick={handleSave} disabled={isSaving}>
                保存
              </button>
            )}
            <button className={styles.closeBtn} onClick={onClose}>
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>内容</label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="记录内容..."
          />
        </div>

        <div className={styles.formGroup}>
          <label>图片</label>
          <input type="file" accept="image/*" multiple onChange={handleImageUpload} />
          {images.length > 0 && (
            <div className={styles.imagePreview}>
              {images.map((img, i) => (
                <div key={i} className={styles.previewItem}>
                  <img src={img} alt="" />
                  <button onClick={() => setImages(images.filter((_, idx) => idx !== i))}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.formGroup}>
          <label>Tag</label>
          {/* 已选标签 */}
          <div className={`${styles.tagList} ${styles.selectedTags}`}>
            {tags.map(tag => (
              <span key={tag} className={styles.tag} onClick={() => handleRemoveTag(tag)}>
                {tag} ×
              </span>
            ))}
          </div>
          {/* 常用标签 */}
          <div className={`${styles.tagList} ${styles.frequentTags}`}>
            {frequentTags.map(tag => (
              <span
                key={tag}
                className={`${styles.tag} ${tags.includes(tag) ? styles.selected : ''}`}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </span>
            ))}
          </div>
          {/* 更多标签按钮 */}
          {allTags.length > 8 && (
            <button
              type="button"
              className={styles.moreTagsBtn}
              onClick={() => setShowAllTags(!showAllTags)}
            >
              {showAllTags ? '收起' : '更多标签'}
            </button>
          )}
          {/* 全部标签列表 */}
          {showAllTags && (
            <div className={styles.allTagsList}>
              {allTags.slice(8).map(tag => (
                <span
                  key={tag}
                  className={`${styles.tag} ${tags.includes(tag) ? styles.selected : ''}`}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          {/* 输入新标签 */}
          <div className={styles.tagInput}>
            <input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={handleTagInputKeyDown}
              placeholder="输入新标签后按回车"
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>状态</label>
          <select value={status} onChange={e => handleStatusChange(e.target.value as RecordStatus)}>
            <option value="pending">未开始</option>
            <option value="in_progress">进行中</option>
            <option value="completed">已完成</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>计划开始时间</label>
          <input
            type="datetime-local"
            value={plannedStartTime}
            onChange={e => setPlannedStartTime(e.target.value)}
          />
        </div>

        <div className={styles.formGroup}>
          <label>计划结束时间</label>
          <input
            type="datetime-local"
            value={plannedEndTime}
            onChange={e => setPlannedEndTime(e.target.value)}
          />
        </div>

        {status === 'completed' && (
          <div className={styles.formGroup}>
            <label>复盘信息</label>
            <div className={styles.reviewSection}>
              <label>计划达成</label>
              <div className={styles.radioGroup}>
                <label>
                  <input
                    type="radio"
                    name="achievement"
                    value="below"
                    checked={reviewAchievement === 'below'}
                    onChange={e => setReviewAchievement(e.target.value as Achievement)}
                  />
                  未达预期
                </label>
                <label>
                  <input
                    type="radio"
                    name="achievement"
                    value="met"
                    checked={reviewAchievement === 'met'}
                    onChange={e => setReviewAchievement(e.target.value as Achievement)}
                  />
                  达成预期
                </label>
                <label>
                  <input
                    type="radio"
                    name="achievement"
                    value="exceeded"
                    checked={reviewAchievement === 'exceeded'}
                    onChange={e => setReviewAchievement(e.target.value as Achievement)}
                  />
                  超出预期
                </label>
              </div>
              <label>详细总结</label>
              <textarea
                value={reviewDetails}
                onChange={e => setReviewDetails(e.target.value)}
                placeholder="总结原因..."
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
