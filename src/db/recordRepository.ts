import { db } from './index';
import type { Record, FilterState } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const recordRepository = {
  async create(data: Omit<Record, 'id' | 'createdAt' | 'updatedAt'>): Promise<Record> {
    const now = new Date();
    const record: Record = {
      ...data,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    await db.records.add(record);
    return record;
  },

  async update(id: string, data: Partial<Record>): Promise<void> {
    await db.records.update(id, { ...data, updatedAt: new Date() });
  },

  async delete(id: string): Promise<void> {
    await db.records.delete(id);
  },

  async getById(id: string): Promise<Record | undefined> {
    return await db.records.get(id);
  },

  async getAll(): Promise<Record[]> {
    return await db.records.orderBy('createdAt').reverse().toArray();
  },

  async getByFilter(filter: FilterState, searchQuery?: string): Promise<Record[]> {
    let records = await db.records.orderBy('createdAt').reverse().toArray();

    // 状态筛选
    if (filter.status) {
      records = records.filter(r => r.status === filter.status);
    }

    // 标签筛选
    if (filter.tags.length > 0) {
      records = records.filter(r =>
        filter.tags.every(tag => r.tags.includes(tag))
      );
    }

    // 搜索功能
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      records = records.filter(r => {
        // 搜索内容
        const contentMatch = r.content.toLowerCase().includes(query);
        // 搜索标签
        const tagMatch = r.tags.some(tag => tag.toLowerCase().includes(query));
        return contentMatch || tagMatch;
      });
    }

    return records;
  },

  async getAllTags(): Promise<string[]> {
    const records = await db.records.toArray();
    const tagSet = new Set<string>();
    records.forEach(r => r.tags.forEach(t => tagSet.add(t)));
    return Array.from(tagSet).sort();
  },

  async getByDateRange(startDate: Date, endDate: Date): Promise<Record[]> {
    return await db.records
      .where('createdAt')
      .between(startDate, endDate)
      .toArray();
  }
};
