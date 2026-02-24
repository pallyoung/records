import { useState, useEffect, useRef } from 'react';
import styles from './index.module.scss';

interface QuickAddProps {
  visible: boolean;
  existingTags: string[];
  onClose: () => void;
  onSave: (data: { content: string; tags: string[]; status: 'pending' | 'in_progress' | 'completed' }) => void;
}

export function QuickAdd({ visible, existingTags, onClose, onSave }: QuickAddProps) {
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [status, setStatus] = useState<'pending' | 'in_progress' | 'completed'>('pending');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (visible) {
      setContent('');
      setTags([]);
      setStatus('pending');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [visible]);

  const handleSave = () => {
    if (!content.trim()) return;
    onSave({ content: content.trim(), tags, status });
    setContent('');
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!visible) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>快速记录</h3>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <textarea
          ref={inputRef}
          className={styles.input}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="记录今天做了什么..."
        />

        <div className={styles.tags}>
          {existingTags.slice(0, 6).map((tag) => (
            <button
              key={tag}
              className={`${styles.tag} ${tags.includes(tag) ? styles.selected : ''}`}
              onClick={() => setTags(tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag])}
            >
              {tag}
            </button>
          ))}
        </div>

        <div className={styles.status}>
          {(['pending', 'in_progress', 'completed'] as const).map((s) => (
            <button
              key={s}
              className={`${styles.statusBtn} ${status === s ? styles.active : ''}`}
              onClick={() => setStatus(s)}
            >
              {s === 'pending' ? '○ 未开始' : s === 'in_progress' ? '● 进行中' : '✓ 已完成'}
            </button>
          ))}
        </div>

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose}>取消</button>
          <button className={styles.saveBtn} onClick={handleSave} disabled={!content.trim()}>保存</button>
        </div>
      </div>
    </div>
  );
}
