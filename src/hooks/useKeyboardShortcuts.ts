import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  handler: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled = true) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // 忽略在 input/textarea 中的快捷键
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        // 只有 Escape 在输入框中也可以触发
        if (e.key !== 'Escape') return;
      }

      const shortcut = shortcuts.find((s) => s.key === e.key);
      if (shortcut) {
        e.preventDefault();
        shortcut.handler();
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
