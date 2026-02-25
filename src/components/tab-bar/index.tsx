import { ReactNode } from 'react';
import styles from './index.module.scss';
import {
  IconTabHome,
  IconTabInsights,
  IconTabProfile,
  IconTabTasks,
} from '../../shared/icons';

export type TabType = 'home' | 'tasks' | 'insights' | 'profile';

export interface TabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const HomeIcon = () => <IconTabHome size={24} />;

const TasksIcon = () => <IconTabTasks size={24} />;

const InsightsIcon = () => <IconTabInsights size={24} />;

const ProfileIcon = () => <IconTabProfile size={24} />;

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
