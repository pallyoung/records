import { useState } from 'react';
import type { Record, RecordStatus, Achievement } from '../types';
import './RecordForm.css';

interface RecordFormProps {
  record?: Record;
  existingTags: string[];
  onClose: () => void;
  onSave: (data: Omit<Record, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export function RecordForm({ record, existingTags, onClose, onSave }: RecordFormProps) {
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

  const handleAddTag = () => {
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
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

  const handleSubmit = () => {
    const data = {
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
    };
    onSave(data);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="record-form" onClick={e => e.stopPropagation()}>
        <h2>{record ? '编辑记录' : '新建记录'}</h2>

        <div className="form-group">
          <label>内容</label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="记录内容..."
          />
        </div>

        <div className="form-group">
          <label>图片</label>
          <input type="file" accept="image/*" multiple onChange={handleImageUpload} />
          {images.length > 0 && (
            <div className="image-preview">
              {images.map((img, i) => (
                <div key={i} className="preview-item">
                  <img src={img} alt="" />
                  <button onClick={() => setImages(images.filter((_, idx) => idx !== i))}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Tag</label>
          <div className="tag-input">
            <input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddTag()}
              placeholder="输入 Tag 后按回车"
            />
            <button type="button" onClick={handleAddTag}>添加</button>
          </div>
          <div className="tag-list">
            {tags.map(tag => (
              <span key={tag} className="tag" onClick={() => handleRemoveTag(tag)}>
                {tag} ×
              </span>
            ))}
          </div>
          {existingTags.length > 0 && (
            <div className="existing-tags">
              <span>已有 Tag:</span>
              {existingTags.filter(t => !tags.includes(t)).map(tag => (
                <button key={tag} type="button" onClick={() => setTags([...tags, tag])}>{tag}</button>
              ))}
            </div>
          )}
        </div>

        <div className="form-group">
          <label>状态</label>
          <select value={status} onChange={e => handleStatusChange(e.target.value as RecordStatus)}>
            <option value="pending">未开始</option>
            <option value="in_progress">进行中</option>
            <option value="completed">已完成</option>
          </select>
        </div>

        <div className="form-group">
          <label>计划开始时间</label>
          <input
            type="datetime-local"
            value={plannedStartTime}
            onChange={e => setPlannedStartTime(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>计划结束时间</label>
          <input
            type="datetime-local"
            value={plannedEndTime}
            onChange={e => setPlannedEndTime(e.target.value)}
          />
        </div>

        {status === 'completed' && (
          <div className="form-group">
            <label>复盘信息</label>
            <div className="review-section">
              <label>计划达成</label>
              <div className="radio-group">
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

        <div className="form-actions">
          <button type="button" onClick={onClose}>取消</button>
          <button type="button" className="primary" onClick={handleSubmit}>保存</button>
        </div>
      </div>
    </div>
  );
}
