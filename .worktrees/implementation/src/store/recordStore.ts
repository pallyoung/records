import { createStore } from '@relax-state/react';
import type { Record, FilterState, TimelineGranularity } from '../types';
import { recordRepository } from '../db/recordRepository';

interface RecordState {
  records: Record[];
  tags: string[];
  filter: FilterState;
  granularity: TimelineGranularity;
  loading: boolean;
}

const initialState: RecordState = {
  records: [],
  tags: [],
  filter: { tags: [], status: null },
  granularity: 'day',
  loading: false,
};

export const recordStore = createStore<RecordState>('records', initialState);

export const recordActions = {
  async loadRecords() {
    recordStore.setState({ loading: true });
    try {
      const records = await recordRepository.getByFilter(recordStore.getState().filter);
      const tags = await recordRepository.getAllTags();
      recordStore.setState({ records, tags, loading: false });
    } catch (error) {
      console.error('Failed to load records:', error);
      recordStore.setState({ loading: false });
    }
  },

  async addRecord(data: Omit<Record, 'id' | 'createdAt' | 'updatedAt'>) {
    await recordRepository.create(data);
    await recordActions.loadRecords();
  },

  async updateRecord(id: string, data: Partial<Record>) {
    await recordRepository.update(id, data);
    await recordActions.loadRecords();
  },

  async deleteRecord(id: string) {
    await recordRepository.delete(id);
    await recordActions.loadRecords();
  },

  setFilter(filter: FilterState) {
    recordStore.setState({ filter });
    recordActions.loadRecords();
  },

  setGranularity(granularity: TimelineGranularity) {
    recordStore.setState({ granularity });
  },
};
