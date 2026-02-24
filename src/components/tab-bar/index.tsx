import styles from './index.module.scss';

export type TabType = 'habits' | 'records' | 'profile';

export interface TabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

interface TabItem {
  id: TabType;
  label: string;
}

const TABS: TabItem[] = [
  { id: 'habits', label: '习惯' },
  { id: 'records', label: '事务' },
  { id: 'profile', label: '个人中心' },
];

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <div className={styles.tabBar}>
      {TABS.map(tab => (
        <button
          key={tab.id}
          className={`${styles.tabItem} ${activeTab === tab.id ? styles.active : ''}`}
          onClick={() => onTabChange(tab.id)}
          aria-current={activeTab === tab.id ? 'page' : undefined}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
