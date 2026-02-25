import styles from './index.module.scss';

interface MenuItem {
  id: string;
  icon: string;
  label: string;
}

const MENU_ITEMS: MenuItem[] = [
  { id: 'guide', icon: '🎁', label: '新手引导' },
  { id: 'welfare', icon: '🎀', label: '福利中心' },
  { id: 'settings', icon: '⚙️', label: '设置' },
  { id: 'tags', icon: '🏷️', label: '标签管理' },
  { id: 'review', icon: '📊', label: '复盘' },
];

interface ProfileCenterPageProps {
  onNavigate: (page: MenuItem['id']) => void;
}

export function ProfileCenterPage({ onNavigate }: ProfileCenterPageProps) {
  return (
    <div className={styles.profileCenter}>
      {/* 头部区域 - 头像和用户信息 */}
      <div className={styles.header}>
        <div className={styles.avatar}>
          <span>👤</span>
        </div>
        <div className={styles.userInfo}>
          <span className={styles.username}>Steve</span>
          <span className={styles.level}>注册会员 Lv.3</span>
        </div>
      </div>

      {/* 统计栏 - 4列 */}
      <div className={styles.statsBar}>
        <div className={styles.statItem}>
          <span className={styles.statValue}>0</span>
          <span className={styles.statLabel}>收藏</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>0</span>
          <span className={styles.statLabel}>足迹</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>0</span>
          <span className={styles.statLabel}>下载</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>0</span>
          <span className={styles.statLabel}>已购</span>
        </div>
      </div>

      {/* 功能卡片列表 */}
      <div className={styles.menuList}>
        {MENU_ITEMS.map(item => (
          <button
            key={item.id}
            className={styles.menuItem}
            aria-label={item.label}
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
