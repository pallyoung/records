import type { Record, FilterState, TimelineGranularity } from "../types";
import { recordRepository } from "../db/recordRepository";
import {
  state,
  createStore,
  useRelaxState,
  useRelaxValue,
  RelaxProvider,
} from "@relax-state/react";

import { action, type Store } from "@relax-state/react";

// 创建状态描述符
const recordsState = state<Record[]>([], "records");
const tagsState = state<string[]>([], "tags");
const filterState = state<FilterState>({ tags: [], status: null }, "filter");
const searchQueryState = state<string>("", "searchQuery");
const granularityState = state<TimelineGranularity>("day", "granularity");
const loadingState = state<boolean>(false, "loading");

// 创建 store 实例
const store = createStore();

// 监听搜索变化事件
if (typeof window !== "undefined") {
  window.addEventListener("filterSearchChange", ((
    event: CustomEvent<string>,
  ) => {
    store.set(searchQueryState, event.detail);
    recordActions.loadRecords();
  }) as EventListener);
}

// 导出 store 供外部使用
export { store };

// 导出 hooks 和 Provider 供组件使用
export { useRelaxState, useRelaxValue, RelaxProvider };

// 导出状态描述符供 store 操作使用
export {
  recordsState,
  tagsState,
  filterState,
  searchQueryState,
  granularityState,
  loadingState,
};

// ==================== Action API ====================
// 使用 action() 包装业务逻辑，将逻辑与视图分离

const loadRecordsAction = action<void, void>(
  async (s: Store) => {
    const currentFilter = s.get(filterState);
    const searchQuery = s.get(searchQueryState);
    s.set(loadingState, true);
    try {
      const records = await recordRepository.getByFilter(
        currentFilter,
        searchQuery,
      );
      const tags = await recordRepository.getAllTags();
      s.set(recordsState, records);
      s.set(tagsState, tags);
    } catch (error) {
      console.error("Failed to load records:", error);
    } finally {
      s.set(loadingState, false);
    }
  },
  { name: "loadRecords" },
);

const addRecordAction = action<
  Omit<Record, "id" | "createdAt" | "updatedAt">,
  void
>(
  async (s: Store, data) => {
    await recordRepository.create(data);
    loadRecordsAction(s);
  },
  { name: "addRecord" },
);

const updateRecordAction = action<{ id: string; data: Partial<Record> }, void>(
  async (s: Store, { id, data }) => {
    await recordRepository.update(id, data);
    loadRecordsAction(s);
  },
  { name: "updateRecord" },
);

const deleteRecordAction = action<string, void>(
  async (s: Store, id) => {
    await recordRepository.delete(id);
    loadRecordsAction(s);
  },
  { name: "deleteRecord" },
);

const setFilterAction = action<FilterState, void>(
  (s: Store, filter) => {
    s.set(filterState, filter);
    loadRecordsAction(s);
  },
  { name: "setFilter" },
);

const setGranularityAction = action<TimelineGranularity, void>(
  (s: Store, granularity) => {
    s.set(granularityState, granularity);
  },
  { name: "setGranularity" },
);

const searchAction = action<string, void>(
  (s: Store, query) => {
    s.set(searchQueryState, query);
    loadRecordsAction(s);
  },
  { name: "search" },
);

// 导出 actions (保持向后兼容)
export const recordActions = {
  loadRecords: () => loadRecordsAction(store),
  addRecord: (data: Omit<Record, "id" | "createdAt" | "updatedAt">) =>
    addRecordAction(store, data),
  updateRecord: (id: string, data: Partial<Record>) =>
    updateRecordAction(store, { id, data }),
  deleteRecord: (id: string) => deleteRecordAction(store, id),
  setFilter: (filter: FilterState) => setFilterAction(store, filter),
  setGranularity: (granularity: TimelineGranularity) =>
    setGranularityAction(store, granularity),
  search: (query: string) => searchAction(store, query),
};
