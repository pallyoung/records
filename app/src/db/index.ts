import Dexie, { type Table } from "dexie";
import type { Record, Habit, HabitLog } from "../types";

export class RecordsDatabase extends Dexie {
  records!: Table<Record>;
  habits!: Table<Habit>;
  habitLogs!: Table<HabitLog>;

  constructor() {
    super("RecordsDB");
    this.version(3).stores({
      records: "id, status, createdAt, *tags, userId",
      habits: "++id, name, frequency, createdAt, userId",
      habitLogs: "++id, habitId, date, userId",
    });
  }
}

export const db = new RecordsDatabase();
