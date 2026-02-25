# Life Records (生活记录)

一个 Apple 风格的任务与事务记录应用。

## 功能特性

- **首页** - 今日待办、日历视图、快速添加任务
- **任务管理** - 按日期分组、搜索筛选、状态管理
- **数据洞察** - 完成率统计、标签分布、趋势分析
- **个人中心** - 主题切换（浅色/深色/自动）、数据统计
- **快速记录** - 自然语言输入、智能标签识别

## 技术栈

- React 19
- TypeScript
- Vite
- Dexie (IndexedDB)
- SCSS Modules
- PWA

## 开发

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建
pnpm build

# Biome 代码检查
pnpm lint

# Biome 自动格式化
pnpm format
```

## 主题

支持浅色、深色、自动（跟随系统）三种主题模式。

## 图标使用规则

- 业务代码只能从 `src/shared/icons` 导入图标
- 严禁业务代码直接导入第三方图标库（如 `@phosphor-icons/react`）

## 提交前检查

- 使用 Husky + lint-staged，在 `pre-commit` 只检查暂存文件
- 提交时会执行 `biome check --write`，自动修复可修复问题并重新暂存
- 提交时会校验图标导入规则，业务代码若直接导入 `@phosphor-icons/react` 会被阻止
