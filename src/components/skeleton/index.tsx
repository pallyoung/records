import styles from './index.module.scss';

interface SkeletonProps {
  variant?: 'card' | 'list' | 'text';
  count?: number;
}

export function Skeleton({ variant = 'card', count = 3 }: SkeletonProps) {
  return (
    <div className={styles.container}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`${styles.skeleton} ${styles[variant]}`}>
          <div className={styles.shimmer} />
        </div>
      ))}
    </div>
  );
}
