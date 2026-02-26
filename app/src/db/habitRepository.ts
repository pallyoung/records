import { db } from "./index";
import type { Habit, HabitLog } from "../types";

export const habitRepository = {
  async getAll(): Promise<Habit[]> {
    return db.habits.toArray();
  },

  async create(habit: Omit<Habit, "id" | "createdAt">): Promise<string> {
    const id = crypto.randomUUID();
    await db.habits.add({
      ...habit,
      id,
      createdAt: new Date(),
    });
    return id;
  },

  async update(id: string, data: Partial<Habit>): Promise<void> {
    await db.habits.update(id, data);
  },

  async delete(id: string): Promise<void> {
    await db.habits.delete(id);
    await db.habitLogs.where("habitId").equals(id).delete();
  },

  async getLogs(
    habitId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<HabitLog[]> {
    const collection = db.habitLogs.where("habitId").equals(habitId);
    if (startDate && endDate) {
      return collection
        .filter((log) => log.date >= startDate && log.date <= endDate)
        .toArray();
    }
    return collection.toArray();
  },

  async toggleLog(habitId: string, date: string): Promise<boolean> {
    const existing = await db.habitLogs.where({ habitId, date }).first();

    if (existing) {
      await db.habitLogs.delete(existing.id);
      return false;
    } else {
      await db.habitLogs.add({
        id: crypto.randomUUID(),
        habitId,
        date,
        completed: true,
      });
      return true;
    }
  },

  async getStreak(habitId: string): Promise<number> {
    const logs = await db.habitLogs.where("habitId").equals(habitId).toArray();

    if (logs.length === 0) return 0;

    // Sort by date descending
    logs.sort((a, b) => b.date.localeCompare(a.date));

    let streak = 0;
    const today = new Date().toISOString().split("T")[0];
    let checkDate = today;

    for (const log of logs) {
      if (log.date === checkDate && log.completed) {
        streak++;
        const d = new Date(checkDate);
        d.setDate(d.getDate() - 1);
        checkDate = d.toISOString().split("T")[0];
      } else if (log.date < checkDate) {
        break;
      }
    }

    return streak;
  },
};
