import Dexie, { type Table } from 'dexie';
import type { Record, Habit, HabitLog } from '../types';

export class RecordsDatabase extends Dexie {
  records!: Table<Record>;
  habits!: Table<Habit>;
  habitLogs!: Table<HabitLog>;

  constructor() {
    super('RecordsDB');
    this.version(2).stores({
      records: 'id, status, createdAt, *tags',
      habits: '++id, name, frequency, createdAt',
      habitLogs: '++id, habitId, date'
    });
  }
}

export const db = new RecordsDatabase();
