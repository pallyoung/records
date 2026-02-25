# Icon System Design (Phosphor Fill)

**Date:** 2026-02-25  
**Status:** Approved

## Goal

将当前分散在业务代码中的大量内联 `svg` 图标，统一替换为开源图标方案，并通过单一入口封装，实现视觉一致、可维护、可替换。

## Scope

- 引入并采用 `@phosphor-icons/react`（优先使用 Fill 风格）
- 新建统一图标出口并完成当前业务页面的一次性全量替换
- 建立工程约束，禁止业务直接导入第三方图标库

## Non-Goals

- 不改动页面交互逻辑、状态管理或业务数据流
- 不新增图标以外的视觉重设计
- 不在本阶段做图标动画系统

## Decision Summary

### Selected approach

选择方案 A：`@phosphor-icons/react` + 统一封装层。

### Why

- 设计一致性高，满足“视觉统一优先”
- 实心图标可读性高，贴近当前产品目标
- React 生态成熟，封装成本低
- 通过隔离层可实现未来零业务改造换库

### Alternatives considered

- `@heroicons/react` Solid：风格统一但覆盖相对受限
- Material Symbols：覆盖广但与现有视觉气质偏差更大

## Architecture

### Single source of truth

新增统一图标入口：

- `src/shared/icons/index.tsx`

该文件作为唯一第三方图标接入层，对业务导出语义化图标组件。

### Hard rule (must follow)

1. 业务代码只能从 `src/shared/icons` 导入图标  
2. 严禁业务代码直接导入 `@phosphor-icons/react`（以及任何第三方图标库）  
3. 第三方图标库访问权限仅在 `src/shared/icons/*` 内部

### API conventions

统一图标组件约定：

- 默认 `weight="fill"`
- 默认 `size`：列表/按钮为 `16`，Tab/FAB 为 `24`
- 颜色使用 `currentColor`
- 支持 `className` 以适配样式系统
- 默认装饰性图标 `aria-hidden="true"`；有语义时由业务层传 `aria-label`

## Icon naming and mapping

采用“业务语义命名”，避免暴露第三方命名细节。

- `IconTabHome`
- `IconTabTasks`
- `IconTabInsights`
- `IconTabProfile`
- `IconAdd`
- `IconSearch`
- `IconCheck`
- `IconMore`
- `IconTheme`
- `IconNotification`
- `IconExport`
- `IconInfo`

示例映射（可在实现时微调）：

- `House` -> `IconTabHome`
- `CheckSquare` -> `IconTabTasks`
- `ChartBar` -> `IconTabInsights`
- `User` -> `IconTabProfile`
- `Plus` -> `IconAdd`
- `MagnifyingGlass` -> `IconSearch`
- `Check` -> `IconCheck`
- `DotsThree` -> `IconMore`
- `SunDim` -> `IconTheme`
- `Bell` -> `IconNotification`
- `DownloadSimple` -> `IconExport`
- `Info` -> `IconInfo`

## Rollout plan (big bang)

一次性全量替换以下位置：

- `src/components/tab-bar/index.tsx`
- `src/App.tsx`
- `src/pages/home-page/index.tsx`
- `src/pages/tasks-page/index.tsx`
- `src/pages/profile-page/index.tsx`

## Lint guardrail

在 ESLint 中增加限制：

- 使用 `no-restricted-imports`
- 禁止业务目录直接导入 `@phosphor-icons/react`
- 允许 `src/shared/icons/*` 作为唯一白名单区域

## Accessibility

- 装饰性图标默认隐藏给读屏器
- 带语义图标通过组件 props 传递可访问名称
- 不让图标独立承担按钮语义，按钮语义由外层元素负责

## Risk and mitigation

- 图标选型不符合预期：仅调整 `src/shared/icons` 内映射
- 将来更换图标库：保持业务导出名不变，仅替换封装层实现
- 视觉不一致：通过尺寸与 `currentColor` 规范统一处理

## Validation criteria

### Static checks

- 业务代码直连第三方图标时，ESLint 报错

### Build checks

- `pnpm lint` 通过
- `pnpm build` 通过

### UI checks

- 首页、任务、洞察、我的页面图标均来自统一入口
- 深浅主题下图标颜色正确继承
- 关键控件图标尺寸、对齐一致，无点击区域回归

## Rule reminder

这条规则是本设计的硬约束：**业务严禁直接访问第三方图标库，必须统一从公共 `icons` 文件对外暴露并导入。**
