import { ReactNode } from 'react';
import styles from './index.module.scss';

export type TabType = 'home' | 'tasks' | 'insights' | 'profile';

export interface TabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

// Apple SF Symbols style icons
const HomeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const TasksIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);

const InsightsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const ProfileIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const tabs: { key: TabType; label: string; icon: ReactNode }[] = [
  { key: 'home', label: '首页', icon: <HomeIcon /> },
  { key: 'tasks', label: '任务', icon: <TasksIcon /> },
  { key: 'insights', label: '洞察', icon: <InsightsIcon /> },
  { key: 'profile', label: '我的', icon: <ProfileIcon /> },
];

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <div className={styles.tabBar}>
      {tabs.map(tab => (
        <button
          key={tab.key}
          className={`${styles.tabItem} ${activeTab === tab.key ? styles.active : ''}`}
          onClick={() => onTabChange(tab.key)}
          aria-current={activeTab === tab.key ? 'page' : undefined}
        >
          <span className={styles.icon}>{tab.icon}</span>
          <span className={styles.label}>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
