import type { Record, FilterState, TimelineGranularity } from '../types';
import { recordRepository } from '../db/recordRepository';
import { state, createStore, useRelaxState, useRelaxValue, RelaxProvider } from '@relax-state/react';

// 创建状态描述符
const recordsState = state<Record[]>([], 'records');
const tagsState = state<string[]>([], 'tags');
const filterState = state<FilterState>({ tags: [], status: null }, 'filter');
const searchQueryState = state<string>('', 'searchQuery');
const granularityState = state<TimelineGranularity>('day', 'granularity');
const loadingState = state<boolean>(false, 'loading');

// 创建 store 实例
const store = createStore();

// 监听搜索变化事件
if (typeof window !== 'undefined') {
  window.addEventListener('filterSearchChange', ((event: CustomEvent<string>) => {
    store.set(searchQueryState, event.detail);
    recordActions.loadRecords();
  }) as EventListener);
}

// 导出 store 供外部使用
export { store };

// 导出 hooks 和 Provider 供组件使用
export { useRelaxState, useRelaxValue, RelaxProvider };

// 导出状态描述符供 store 操作使用
export { recordsState, tagsState, filterState, searchQueryState, granularityState, loadingState };

// actions
export const recordActions = {
  async loadRecords() {
    const currentFilter = store.get(filterState);
    const searchQuery = store.get(searchQueryState);
    store.set(loadingState, true);
    try {
      const records = await recordRepository.getByFilter(currentFilter, searchQuery);
      const tags = await recordRepository.getAllTags();
      store.set(recordsState, records);
      store.set(tagsState, tags);
      store.set(loadingState, false);
    } catch (error) {
      console.error('Failed to load records:', error);
      store.set(loadingState, false);
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
    store.set(filterState, filter);
    recordActions.loadRecords();
  },

  setGranularity(granularity: TimelineGranularity) {
    store.set(granularityState, granularity);
  },
};
