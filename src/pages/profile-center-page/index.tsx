import styles from './index.module.scss';

interface MenuItem {
  id: string;
  icon: string;
  label: string;
}

const MENU_ITEMS: MenuItem[] = [
  { id: 'review', icon: '📊', label: '复盘' },
  { id: 'settings', icon: '⚙️', label: '设置' },
  { id: 'tags', icon: '🏷️', label: '标签管理' },
];

interface ProfileCenterPageProps {
  onNavigate: (page: MenuItem['id']) => void;
}

export function ProfileCenterPage({ onNavigate }: ProfileCenterPageProps) {
  return (
    <div className={styles.profileCenter}>
      <h1 className={styles.title}>个人中心</h1>

      <div className={styles.menuList}>
        {MENU_ITEMS.map(item => (
          <button
            key={item.id}
            className={styles.menuItem}
            onClick={() => onNavigate(item.id)}
          >
            <span className={styles.menuIcon}>{item.icon}</span>
            <span className={styles.menuLabel}>{item.label}</span>
            <span className={styles.menuArrow}>›</span>
          </button>
        ))}
      </div>
    </div>
  );
}
