import Dexie, { type Table } from 'dexie';
import type { Record } from '../types';

export class RecordsDatabase extends Dexie {
  records!: Table<Record>;

  constructor() {
    super('RecordsDB');
    this.version(1).stores({
      records: 'id, status, createdAt, *tags'
    });
  }
}

export const db = new RecordsDatabase();
