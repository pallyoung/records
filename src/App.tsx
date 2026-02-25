import { useState, useEffect, useMemo } from "react";
import {
  RelaxProvider,
  useRelaxValue,
  store,
  recordsState,
  tagsState,
  recordActions,
} from "./store/recordStore";
import { TabBar, TabType } from "./components/tab-bar";
import { QuickAdd } from "./components/quick-add";
import { HomePage } from "./pages/home-page";
import { TasksPage } from "./pages/tasks-page";
import { InsightsPage } from "./pages/insights-page";
import { ProfilePage } from "./pages/profile-page";
import { checkAndResetRecurringRecords } from "./db/recordRepository";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import type { Record } from "./types";
import "./App.css";

type ThemeMode = "light" | "dark" | "auto";

function AppContent() {
  const records = useRelaxValue(recordsState) as Record[];
  const tags = useRelaxValue(tagsState);

  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>("auto");

  // 应用主题到 document
  useEffect(() => {
    const root = document.documentElement;

    if (theme === "auto") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", theme);
    }
  }, [theme]);

  const handleThemeChange = (newTheme: ThemeMode) => {
    setTheme(newTheme);
  };

  useEffect(() => {
    recordActions.loadRecords();
    checkAndResetRecurringRecords().catch(console.error);
  }, []);

  // 键盘快捷键
  const shortcuts = useMemo(
    () => [
      {
        key: "n",
        handler: () => setShowQuickAdd(true),
        description: "新建记录",
      },
      {
        key: "1",
        handler: () => setActiveTab("home"),
        description: "切换到首页",
      },
      {
        key: "2",
        handler: () => setActiveTab("tasks"),
        description: "切换到任务",
      },
      {
        key: "3",
        handler: () => setActiveTab("insights"),
        description: "切换到洞察",
      },
      {
        key: "4",
        handler: () => setActiveTab("profile"),
        description: "切换到我的",
      },
    ],
    [],
  );

  useKeyboardShortcuts(shortcuts, !showQuickAdd);

  // 渲染对应页面
  const renderPage = () => {
    switch (activeTab) {
      case "home":
        return <HomePage records={records} tags={tags} />;
      case "tasks":
        return <TasksPage records={records} tags={tags} />;
      case "insights":
        return <InsightsPage records={records} tags={tags} />;
      case "profile":
        return (
          <ProfilePage
            records={records}
            tags={tags}
            currentTheme={theme}
            onThemeChange={handleThemeChange}
          />
        );
      default:
        return <HomePage records={records} tags={tags} />;
    }
  };

  return (
    <div className="app">
      {renderPage()}

      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

      {showQuickAdd && (
        <QuickAdd
          visible={showQuickAdd}
          existingTags={tags}
          onClose={() => setShowQuickAdd(false)}
          onSave={async (data) => {
            await recordActions.addRecord({
              ...data,
              images: [],
              plannedStartTime:
                data.status !== "pending" ? new Date() : undefined,
            });
            setShowQuickAdd(false);
          }}
        />
      )}

      <button
        className="fab-button"
        aria-label="新建任务"
        onClick={() => setShowQuickAdd(true)}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
    </div>
  );
}

function App() {
  return (
    <RelaxProvider store={store}>
      <AppContent />
    </RelaxProvider>
  );
}

export default App;
