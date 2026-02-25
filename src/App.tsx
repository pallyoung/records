import { useState, useEffect, useMemo } from "react";
import {
  RelaxProvider,
  useRelaxValue,
  store,
  recordsState,
  tagsState,
  filterState,
  loadingState,
} from "./store/recordStore";
import { Timeline } from "./components/timeline";
import { Dashboard } from "./components/dashboard";
import { DashboardDetail } from "./components/dashboard-detail";
import { RecordForm } from "./components/record-form";
import { ReviewPage } from "./pages/review-page";
import { TagManagementPage } from "./pages/tag-management-page";
import { SettingsPage } from "./pages/settings-page";
import { ProfileCenterPage } from "./pages/profile-center-page";
import { TabBar, TabType } from "./components/tab-bar";
import { recordActions } from "./store/recordStore";
import { checkAndResetRecurringRecords } from "./db/recordRepository";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { QuickAdd } from "./components/quick-add";
import type { Record, FilterState, RecordStatus } from "./types";
import "./App.css";

function AppContent() {
  const records = useRelaxValue(recordsState);
  const tags = useRelaxValue(tagsState);
  const filter = useRelaxValue(filterState);
  const loading = useRelaxValue(loadingState);

  const [showForm, setShowForm] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [showTagManagement, setShowTagManagement] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDashboardDetail, setShowDashboardDetail] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    recordActions.loadRecords();
    checkAndResetRecurringRecords();
  }, []);

  const handleEdit = (id: string) => {
    setEditingId(id);
    setShowForm(true);
    setActiveTab("home");
  };

  // 键盘快捷键
  const shortcuts = useMemo(
    () => [
      {
        key: "n",
        handler: () => setShowQuickAdd(true),
        description: "新建记录",
      },
      {
        key: "/",
        handler: () => document.getElementById("search-input")?.focus(),
        description: "搜索",
      },
      {
        key: "j",
        handler: () =>
          setSelectedIndex((i) =>
            records.length > 0 ? Math.min(i + 1, records.length - 1) : 0,
          ),
        description: "下一条",
      },
      {
        key: "k",
        handler: () =>
          setSelectedIndex((i) =>
            records.length > 0 ? Math.max(i - 1, 0) : 0,
          ),
        description: "上一条",
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
      {
        key: "Enter",
        handler: () =>
          records[selectedIndex] && handleEdit(records[selectedIndex].id),
        description: "编辑",
      },
      {
        key: "Escape",
        handler: () => {
          setShowForm(false);
          setShowReview(false);
          setShowTagManagement(false);
          setShowSettings(false);
          setShowDashboardDetail(false);
        },
        description: "关闭",
      },
    ],
    [handleEdit, records.length],
  );

  useKeyboardShortcuts(
    shortcuts,
    !showForm &&
      !showReview &&
      !showTagManagement &&
      !showSettings &&
      !showDashboardDetail,
  );

  const handleFilterChange = (newFilter: FilterState) => {
    recordActions.setFilter(newFilter);
  };

  const handleDelete = async (id: string) => {
    if (confirm("确定删除这条记录吗？")) {
      await recordActions.deleteRecord(id);
    }
  };

  const handleStatusChange = async (id: string, status: RecordStatus) => {
    await recordActions.updateRecord(id, { status });
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const handleSave = async (
    data: Omit<Record, "id" | "createdAt" | "updatedAt">,
  ) => {
    if (editingId) {
      await recordActions.updateRecord(editingId, data);
      handleCloseForm();
    } else {
      await recordActions.addRecord(data);
      // 新建记录保存后关闭表单
      handleCloseForm();
    }
  };

  const handleProfileNavigate = (page: string) => {
    if (page === "review") {
      setShowReview(true);
    } else if (page === "settings") {
      setShowSettings(true);
    } else if (page === "tags") {
      setShowTagManagement(true);
    }
  };

  const editingRecord = editingId
    ? records.find((r: Record) => r.id === editingId)
    : undefined;

  // Sub-pages take over full screen
  if (showReview) {
    return (
      <ReviewPage
        records={records}
        allTags={tags}
        onBack={() => setShowReview(false)}
      />
    );
  }

  if (showTagManagement) {
    return <TagManagementPage onBack={() => setShowTagManagement(false)} />;
  }

  if (showSettings) {
    return <SettingsPage onBack={() => setShowSettings(false)} />;
  }

  if (showDashboardDetail) {
    return (
      <div className="app-full-page">
        <DashboardDetail
          records={records}
          onBack={() => setShowDashboardDetail(false)}
        />
      </div>
    );
  }

  // 获取当前日期
  const getCurrentDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const weekdays = [
      "星期日",
      "星期一",
      "星期二",
      "星期三",
      "星期四",
      "星期五",
      "星期六",
    ];
    const weekday = weekdays[now.getDay()];
    return `${year}年${month}月${day}日 ${weekday}`;
  };

  return (
    <div className="app">
      {/* Dashboard at top */}
      <Dashboard
        records={records}
        onClick={() => setShowDashboardDetail(true)}
      />

      {/* Tab content */}
      {activeTab === "home" && (
        <main className="app-main records-main">
          {/* 头部问候语 */}
          <div className="records-header">
            <h2 className="greeting">Hey, Steve</h2>
            <p className="date">{getCurrentDate()}</p>
          </div>

          <Timeline
            records={records}
            selectedIndex={selectedIndex}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
          />

          {/* 移动端 FAB 按钮 - only visible on records tab */}
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
        </main>
      )}

      {activeTab === "tasks" && (
        <main className="app-main tasks-main">
          <div className="page-placeholder">
            <h2>任务</h2>
            <p>任务页面开发中...</p>
          </div>
        </main>
      )}

      {activeTab === "insights" && (
        <main className="app-main insights-main">
          <div className="page-placeholder">
            <h2>洞察</h2>
            <p>洞察页面开发中...</p>
          </div>
        </main>
      )}

      {activeTab === "profile" && (
        <main className="app-main profile-main">
          <ProfileCenterPage onNavigate={handleProfileNavigate} />
        </main>
      )}

      {/* TabBar at bottom */}
      <TabBar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSelectedIndex(0);
        }}
      />

      {showForm && (
        <RecordForm
          record={editingRecord}
          existingTags={tags}
          records={records}
          onClose={handleCloseForm}
          onSave={handleSave}
        />
      )}

      {/* 快速记录面板 */}
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
          setActiveTab("home");
        }}
      />
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
