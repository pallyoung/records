import { useState, useEffect } from 'react';
import { habitRepository } from '../../db/habitRepository';
import type { Habit } from '../../types';
import styles from './index.module.scss';

interface HabitsPageProps {
  onBack: () => void;
}

export function HabitsPage({ onBack }: HabitsPageProps) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [streaks, setStreaks] = useState<Record<string, number>>({});
  const [todayLogs, setTodayLogs] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [newHabit, setNewHabit] = useState({ name: '', icon: '📝', frequency: 'daily' as const, targetDays: [1,2,3,4,5,6,7] });

  useEffect(() => {
    loadHabits();
  }, []);

  const loadHabits = async () => {
    const data = await habitRepository.getAll();
    setHabits(data);

    const streakMap: Record<string, number> = {};
    const today = new Date().toISOString().split('T')[0];
    const todayLogSet = new Set<string>();

    for (const habit of data) {
      streakMap[habit.id] = await habitRepository.getStreak(habit.id);
      const logs = await habitRepository.getLogs(habit.id, today, today);
      if (logs[0]?.completed) todayLogSet.add(habit.id);
    }

    setStreaks(streakMap);
    setTodayLogs(todayLogSet);
  };

  const handleToggle = async (habitId: string) => {
    const date = new Date().toISOString().split('T')[0];
    await habitRepository.toggleLog(habitId, date);
    loadHabits();
  };

  const handleCreate = async () => {
    if (!newHabit.name.trim()) return;
    await habitRepository.create(newHabit);
    setShowForm(false);
    setNewHabit({ name: '', icon: '📝', frequency: 'daily', targetDays: [1,2,3,4,5,6,7] });
    loadHabits();
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定删除这个习惯吗？')) {
      await habitRepository.delete(id);
      loadHabits();
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>← 返回</button>
        <h2>习惯追踪</h2>
        <button className={styles.addBtn} onClick={() => setShowForm(true)}>+ 新建</button>
      </header>

      <div className={styles.grid}>
        {habits.map((habit) => (
          <div
            key={habit.id}
            className={`${styles.card} ${todayLogs.has(habit.id) ? styles.completed : ''}`}
          >
            <div className={styles.cardHeader} onClick={() => handleToggle(habit.id)}>
              <span className={styles.icon}>{habit.icon}</span>
              <span className={styles.name}>{habit.name}</span>
              <span className={styles.streak}>{streaks[habit.id] || 0}天</span>
            </div>
            <div className={styles.progress}>
              <div
                className={styles.progressBar}
                style={{ width: `${Math.min(((streaks[habit.id] || 0) / 7) * 100, 100)}%` }}
              />
            </div>
            <div className={styles.cardFooter}>
              <span className={styles.status}>
                今日: {todayLogs.has(habit.id) ? '✓' : '○'}
              </span>
              <button className={styles.deleteBtn} onClick={() => handleDelete(habit.id)}>删除</button>
            </div>
          </div>
        ))}
      </div>

      {habits.length === 0 && (
        <div className={styles.emptyState}>
          还没有习惯，点击右上角添加
        </div>
      )}

      {showForm && (
        <div className={styles.formOverlay} onClick={() => setShowForm(false)}>
          <div className={styles.form} onClick={(e) => e.stopPropagation()}>
            <h3>新建习惯</h3>
            <input
              type="text"
              placeholder="习惯名称"
              value={newHabit.name}
              onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
            />
            <div className={styles.icons}>
              {['📝', '📚', '🏃', '💪', '🧘', '💤', '🍎'].map((icon) => (
                <button
                  key={icon}
                  className={newHabit.icon === icon ? styles.selected : ''}
                  onClick={() => setNewHabit({ ...newHabit, icon })}
                >
                  {icon}
                </button>
              ))}
            </div>
            <div className={styles.formActions}>
              <button className={styles.cancelBtn} onClick={() => setShowForm(false)}>取消</button>
              <button className={styles.saveBtn} onClick={handleCreate}>创建</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
