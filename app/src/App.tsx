import { useState, useEffect, useMemo } from "react";
import {
  RelaxProvider,
  useRelaxValue,
  store,
  recordsState,
  tagsState,
  recordActions,
} from "./store/recordStore";
import { store as authStore, isAuthenticatedState } from "./store/authStore";
import { TabBar, type TabType } from "./components/tab-bar";
import { TaskForm } from "./components/task-form";
import { HomePage } from "./pages/home-page";
import { TasksPage } from "./pages/tasks-page";
import { InsightsPage } from "./pages/insights-page";
import { ProfilePage } from "./pages/profile-page";
import LoginForm from "./pages/auth-page/LoginForm";
import { checkAndResetRecurringRecords } from "./db/recordRepository";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import type { Record } from "./types";
import { IconAdd } from "./shared/icons";
import { ToastContainer } from "./components/toast/ToastContainer";
import { ConfirmDialog, confirm } from "./components/confirm/ConfirmDialog";
import {
  readAppSettings,
  writeAppSettings,
  type ThemeMode,
} from "./store/appSettings";
import { startSyncEngine, stopSyncEngine } from "./services/sync/syncEngine";
import { applyPullChanges } from "./services/sync/applyPullChanges";
import { session } from "./services/auth/session";
import "./App.css";

// 登录检查组件 - 在 RelaxProvider 外部检查认证状态
function AuthCheck({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    authStore.get(isAuthenticatedState),
  );

  // 监听登录状态变化（使用轮询方式）
  useEffect(() => {
    const interval = setInterval(() => {
      const currentAuth = authStore.get(isAuthenticatedState);
      setIsAuthenticated(currentAuth);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return <>{children}</>;
}

function AppContent() {
  const records = useRelaxValue(recordsState) as Record[];
  const tags = useRelaxValue(tagsState);

  useEffect(() => {
    if (session.hasTokens()) {
      startSyncEngine((changes) => {
        applyPullChanges(changes).then(() => recordActions.loadRecords());
      });
      return () => stopSyncEngine();
    }
  }, []);

  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [theme, setTheme] = useState<ThemeMode>(() => readAppSettings().theme);

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
    writeAppSettings({ ...readAppSettings(), theme: newTheme });
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

  // 处理任务点击，打开详情弹窗
  const handleEditRecord = (id: string) => {
    setSelectedTaskId(id);
    setShowTaskDetail(true);
  };

  // 渲染对应页面
  const renderPage = () => {
    switch (activeTab) {
      case "home":
        return (
          <HomePage
            records={records}
            tags={tags}
            onEditRecord={handleEditRecord}
          />
        );
      case "tasks":
        return (
          <TasksPage
            records={records}
            tags={tags}
            onEditRecord={handleEditRecord}
          />
        );
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
        return (
          <HomePage
            records={records}
            tags={tags}
            onEditRecord={handleEditRecord}
          />
        );
    }
  };

  return (
    <div className="app">
      {renderPage()}

      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

      {showQuickAdd && (
        <TaskForm
          mode="quick-add"
          visible={showQuickAdd}
          existingTags={tags}
          onClose={() => setShowQuickAdd(false)}
          onSave={async (data) => {
            await recordActions.addRecord({
              ...data,
              images: [],
              // If user provided plannedStartTime, use it; otherwise if status is not pending, set to now
              plannedStartTime:
                data.plannedStartTime ||
                (data.status !== "pending" ? new Date() : undefined),
            });
            setShowQuickAdd(false);
          }}
        />
      )}

      {showTaskDetail && (
        <TaskForm
          mode="detail"
          visible={showTaskDetail}
          record={records.find((r) => r.id === selectedTaskId) || null}
          existingTags={tags}
          onClose={() => {
            setShowTaskDetail(false);
            setSelectedTaskId(null);
          }}
          onSave={async (data) => {
            if (!selectedTaskId) return;
            await recordActions.updateRecord(selectedTaskId, data);
            setShowTaskDetail(false);
            setSelectedTaskId(null);
          }}
          onDelete={async () => {
            if (!selectedTaskId) return;
            const ok = await confirm({ message: "确定要删除这个任务吗？" });
            if (ok) {
              recordActions.deleteRecord(selectedTaskId);
              setShowTaskDetail(false);
              setSelectedTaskId(null);
            }
          }}
          onStatusChange={(newStatus) => {
            if (!selectedTaskId) return;
            const record = records.find((r) => r.id === selectedTaskId);
            if (!record) return;

            // If starting in progress, set actualStartTime
            if (newStatus === "in_progress" && record.status === "pending") {
              recordActions.updateRecord(selectedTaskId, {
                status: newStatus,
                actualStartTime: new Date(),
              });
            }
            // If completed, set actualEndTime
            else if (
              newStatus === "completed" &&
              record.status !== "completed"
            ) {
              recordActions.updateRecord(selectedTaskId, {
                status: newStatus,
                actualEndTime: new Date(),
              });
            }
          }}
        />
      )}

      <button
        type="button"
        className="fab-button"
        aria-label="新建任务"
        onClick={() => setShowQuickAdd(true)}
      >
        <IconAdd size={24} />
      </button>
    </div>
  );
}

function App() {
  return (
    <RelaxProvider store={store}>
      <AuthCheck>
        <ConfirmDialog>
          <AppContent />
          <ToastContainer />
        </ConfirmDialog>
      </AuthCheck>
    </RelaxProvider>
  );
}

export default App;
