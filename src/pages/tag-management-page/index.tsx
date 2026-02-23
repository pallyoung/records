import { useTags } from '../../hooks/useTags';
import styles from './index.module.scss';

interface TagManagementPageProps {
  onBack: () => void;
}

export function TagManagementPage({ onBack }: TagManagementPageProps) {
  const { allTags, customTags, removeCustomTag, isDefaultTag } = useTags();

  const handleRemoveTag = (tag: string) => {
    if (confirm(`确定删除标签 "${tag}" 吗？`)) {
      removeCustomTag(tag);
    }
  };

  return (
    <div className={styles['tag-management-page']}>
      <header className={styles['page-header']}>
        <button className={styles['back-btn']} onClick={onBack}>← 返回</button>
        <h1>管理标签</h1>
      </header>

      <section className={styles['tag-section']}>
        <h3>默认标签（不可删除）</h3>
        <div className={`${styles['tag-grid']} ${styles['default']}`}>
          {allTags.filter(isDefaultTag).map(tag => (
            <span key={tag} className={`${styles['tag']} ${styles['default']}`}>{tag}</span>
          ))}
        </div>
      </section>

      <section className={styles['tag-section']}>
        <h3>自定义标签</h3>
        {customTags.length === 0 ? (
          <p className={styles['empty-message']}>暂无自定义标签</p>
        ) : (
          <div className={`${styles['tag-grid']} ${styles['custom']}`}>
            {customTags.map(tag => (
              <span
                key={tag}
                className={`${styles['tag']} ${styles['custom']}`}
                onClick={() => handleRemoveTag(tag)}
              >
                {tag} ×
              </span>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
