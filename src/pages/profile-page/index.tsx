import { useMemo } from "react";
import { useRelaxValue, recordsState } from "../../store/recordStore";
import { authActions, store, currentUserState } from "../../store/authStore";
import { confirm } from "../../components/confirm/ConfirmDialog";
import {
  IconExport,
  IconInfo,
  IconNotification,
  IconTheme,
} from "../../shared/icons";
import type { Record } from "../../types";
import styles from "./index.module.scss";

// Page props interface
interface PageProps {
  records?: Record[];
  tags?: string[];
  currentTheme?: "light" | "dark" | "auto";
  onThemeChange?: (theme: "light" | "dark" | "auto") => void;
}

// 格式化日期为 YYYY-MM-DD
function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// 计算连续完成天数
function calculateStreakDays(records: Record[]): number {
  // 获取已完成的任务
  const completedRecords = records.filter((r) => r.status === "completed");

  if (completedRecords.length === 0) return 0;

  // 提取所有完成日期（去重）
  const completedDates = new Set<string>();
  completedRecords.forEach((record) => {
    const date = record.actualEndTime || record.updatedAt;
    completedDates.add(formatDateKey(new Date(date)));
  });

  // 排序日期
  const sortedDates = Array.from(completedDates).sort().reverse();

  if (sortedDates.length === 0) return 0;

  // 从今天/昨天开始计算连续天数
  const today = formatDateKey(new Date());
  const yesterday = formatDateKey(
    new Date(new Date().setDate(new Date().getDate() - 1)),
  );

  // 必须从今天或昨天开始才算连续
  if (sortedDates[0] !== today && sortedDates[0] !== yesterday) {
    return 0;
  }

  let streak = 1;
  let currentDate = new Date(sortedDates[0]);

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(currentDate);
    prevDate.setDate(prevDate.getDate() - 1);

    if (formatDateKey(prevDate) === sortedDates[i]) {
      streak++;
      currentDate = prevDate;
    } else {
      break;
    }
  }

  return streak;
}

// ThemeToggle 组件
interface ThemeToggleProps {
  currentTheme: "light" | "dark" | "auto";
  onThemeChange: (theme: "light" | "dark" | "auto") => void;
}

function ThemeToggle({ currentTheme, onThemeChange }: ThemeToggleProps) {
  return (
    <div className={styles.themeToggle}>
      <button
        type="button"
        className={`${styles.themeOption} ${currentTheme === "light" ? styles.themeOptionActive : ""}`}
        onClick={() => onThemeChange("light")}
      >
        浅色
      </button>
      <button
        type="button"
        className={`${styles.themeOption} ${currentTheme === "dark" ? styles.themeOptionActive : ""}`}
        onClick={() => onThemeChange("dark")}
      >
        深色
      </button>
      <button
        type="button"
        className={`${styles.themeOption} ${currentTheme === "auto" ? styles.themeOptionActive : ""}`}
        onClick={() => onThemeChange("auto")}
      >
        自动
      </button>
    </div>
  );
}

// SettingsItem 组件
interface SettingsItemProps {
  icon: React.ReactNode;
  label: string;
  right?: React.ReactNode;
  onClick?: () => void;
}

function SettingsItem({ icon, label, right, onClick }: SettingsItemProps) {
  if (onClick) {
    return (
      <button type="button" className={styles.settingsItem} onClick={onClick}>
        <div className={styles.settingsItemLeft}>
          <div className={styles.settingsIcon}>{icon}</div>
          <span className={styles.settingsLabel}>{label}</span>
        </div>
        <div className={styles.settingsRight}>{right}</div>
      </button>
    );
  }

  return (
    <div className={styles.settingsItem}>
      <div className={styles.settingsItemLeft}>
        <div className={styles.settingsIcon}>{icon}</div>
        <span className={styles.settingsLabel}>{label}</span>
      </div>
      <div className={styles.settingsRight}>{right}</div>
    </div>
  );
}

// 主 ProfilePage 组件
export function ProfilePage(props?: PageProps) {
  const records = useRelaxValue(recordsState) as Record[];
  const theme = props?.currentTheme ?? "auto";
  const onThemeChange = props?.onThemeChange;

  // 获取当前用户
  const currentUser = store.get(currentUserState);

  // 添加登出处理函数
  const handleLogout = async () => {
    const ok = await confirm({ message: "确定要退出登录吗？" });
    if (ok) {
      authActions.logout();
    }
  };

  // 计算统计数据
  const stats = useMemo(() => {
    const total = records.length;
    const completed = records.filter((r) => r.status === "completed").length;
    const completionRate =
      total > 0 ? Math.round((completed / total) * 100) : 0;
    const streakDays = calculateStreakDays(records);

    return { total, completed, completionRate, streakDays };
  }, [records]);

  // 获取用户名首字母
  const userInitial = "W"; // 默认用户名首字母

  // 处理主题变化
  const handleThemeChange = (newTheme: "light" | "dark" | "auto") => {
    onThemeChange?.(newTheme);
  };

  return (
    <div className={styles.profilePage}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>我的</h1>
      </div>

      {/* User Section - 显示已登录用户信息 */}
      {currentUser && (
        <div className={styles.userSection}>
          <div className={styles.avatar}>
            {currentUser.username.charAt(0).toUpperCase()}
          </div>
          <div className={styles.userInfo}>
            <div className={styles.username}>{currentUser.username}</div>
            <button
              type="button"
              className={styles.logoutBtn}
              onClick={handleLogout}
            >
              退出登录
            </button>
          </div>
        </div>
      )}

      {/* Profile Header */}
      <div className={styles.profileHeader}>
        <div className={styles.profileAvatar}>{userInitial}</div>
        <div className={styles.profileName}>用户</div>
        <div className={styles.profileStats}>
          <div className={styles.profileStat}>
            <div className={styles.profileStatValue}>{stats.total}</div>
            <div className={styles.profileStatLabel}>总任务</div>
          </div>
          <div className={styles.profileStat}>
            <div className={styles.profileStatValue}>
              {stats.completionRate}%
            </div>
            <div className={styles.profileStatLabel}>完成率</div>
          </div>
          <div className={styles.profileStat}>
            <div className={styles.profileStatValue}>{stats.streakDays}</div>
            <div className={styles.profileStatLabel}>连续天数</div>
          </div>
        </div>
      </div>

      {/* Settings Section */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>设置</div>
        <div className={styles.settingsList}>
          {/* 主题设置 */}
          <SettingsItem
            icon={<IconTheme size={20} />}
            label="外观"
            right={
              <ThemeToggle
                currentTheme={theme}
                onThemeChange={handleThemeChange}
              />
            }
          />

          {/* 提醒设置 */}
          <SettingsItem
            icon={<IconNotification size={20} />}
            label="提醒"
            right={<span className={styles.settingsArrow}>&#8250;</span>}
          />

          {/* 数据管理 */}
          <SettingsItem
            icon={<IconExport size={20} />}
            label="数据导出"
            right={<span className={styles.settingsArrow}>&#8250;</span>}
          />

          {/* 关于 */}
          <SettingsItem
            icon={<IconInfo size={20} />}
            label="关于"
            right={<span className={styles.settingsArrow}>&#8250;</span>}
          />
        </div>
      </div>
    </div>
  );
}
