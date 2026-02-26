import { useState, useEffect } from "react";
import { DEFAULT_TAGS } from "../constants/tags";

const STORAGE_KEY = "custom_tags";

export function useTags() {
  const [customTags, setCustomTags] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setCustomTags(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse custom tags:", e);
      }
    }
  }, []);

  const allTags = [...DEFAULT_TAGS, ...customTags];

  const addCustomTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed) return;
    if (!allTags.includes(trimmed)) {
      const newTags = [...customTags, trimmed];
      setCustomTags(newTags);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newTags));
    }
  };

  const removeCustomTag = (tag: string) => {
    if (DEFAULT_TAGS.includes(tag as (typeof DEFAULT_TAGS)[number])) {
      return; // 不能删除默认标签
    }
    const newTags = customTags.filter((t) => t !== tag);
    setCustomTags(newTags);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTags));
  };

  const isDefaultTag = (tag: string): boolean => {
    return DEFAULT_TAGS.includes(tag as (typeof DEFAULT_TAGS)[number]);
  };

  const getTagCounts = (records: { tags: string[] }[]): Map<string, number> => {
    const counts = new Map<string, number>();
    records.forEach((record) => {
      record.tags.forEach((tag) => {
        counts.set(tag, (counts.get(tag) || 0) + 1);
      });
    });
    return counts;
  };

  const getFrequentTags = (
    records: { tags: string[] }[],
    limit: number = 8,
  ): string[] => {
    const counts = getTagCounts(records);
    return allTags
      .map((tag) => ({ tag, count: counts.get(tag) || 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map((item) => item.tag);
  };

  return {
    allTags,
    customTags,
    addCustomTag,
    removeCustomTag,
    isDefaultTag,
    getTagCounts,
    getFrequentTags,
  };
}
