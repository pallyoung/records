# Husky + Biome Workflow Design

**Date:** 2026-02-25  
**Status:** Approved

## Goal

为项目引入 Git 提交质量门禁：使用 Husky 在 `pre-commit` 阶段仅检查暂存文件（A2），并将现有 lint/format 工作流从 ESLint 迁移到 Biome（B2）。

## Confirmed Decisions

- Hook 触发点：`pre-commit`
- 检查范围：仅暂存文件
- 检查能力：`lint + format` 统一迁移到 Biome
- 方案选择：`husky + lint-staged + biome check --write`

## Scope

- 引入 `husky`、`lint-staged`、`@biomejs/biome`
- 移除 ESLint 相关依赖与配置
- 建立 `pre-commit` 钩子，提交时仅处理暂存文件
- 保留并迁移“业务禁止直连第三方图标库”约束
- 更新 README 的开发与提交流程说明

## Non-Goals

- 不改动业务功能逻辑
- 不新增 CI 流程（本次聚焦本地提交门禁）
- 不在本次迁移中调整项目目录结构

## Selected Approach

采用 `husky + lint-staged + biome check --write`：

1. `husky` 管理 Git hooks
2. `lint-staged` 仅收集已暂存文件
3. 对这些文件执行 `biome check --write`
4. 自动修复后重新加入暂存区
5. 若仍有错误则阻断提交

## Why This Approach

- 与 A2 目标一致：仅检查暂存文件，速度快
- 改动边界清晰：工具链替换不影响业务功能
- 用户体验稳定：自动修复常见问题，减少手工格式化
- 可维护性强：一个工具统一 lint + format

## Architecture and Data Flow

### Tooling layer

- `biome.json` 作为统一代码质量配置源
- `package.json` 脚本对外暴露：
  - `lint`: `biome check .`
  - `format`: `biome format --write .`
  - `prepare`: `husky`

### Commit-time flow

`git commit` -> `.husky/pre-commit` -> `lint-staged` -> `biome check --write` on staged files -> pass/fail

### Rule guardrail for icons

硬规则不变：业务代码严禁直连 `@phosphor-icons/react`。  
迁移后采用双重保障：

- Biome 可表达的 import 限制规则（优先）
- Hook 层兜底扫描（仅对暂存文件执行），防止规则漏网

## File Change Plan

- `package.json`
  - 新增 `prepare`、Biome 脚本、`lint-staged` 配置
  - 替换/移除 ESLint 相关脚本
- `pnpm-lock.yaml`
  - 更新依赖锁文件
- `biome.json`（新增）
  - 配置 lint + format
- `.husky/pre-commit`（新增）
  - 执行 `pnpm lint-staged`
- `eslint.config.js`（删除）
- `README.md`
  - 更新命令与提交前检查说明

## Failure Handling

- 可自动修复：修复并继续提交流程
- 不可自动修复：阻断提交并输出错误文件与规则
- 仅暂存文件参与处理，避免影响未暂存工作

## Validation Criteria

### Functional checks

- `pnpm lint` 可执行且由 Biome 驱动
- `pnpm format` 可执行且由 Biome 驱动
- `git commit` 时仅处理暂存文件

### Guardrail checks

- 在业务文件添加 `@phosphor-icons/react` 直接导入会被拦截
- 在 `src/shared/icons` 内部导入不被拦截

### Regression checks

- `pnpm build` 通过
- README 文档与实际命令一致

## Risks and Mitigations

- Biome 规则与 ESLint 规则覆盖差异：使用 hook 兜底保障关键 import 规则
- 历史代码风格差异导致首轮噪音：以“仅暂存文件”降低一次性改动冲击
- 开发者本地环境未安装 hooks：通过 `prepare` 脚本标准化安装流程

## Rule Reminder

业务代码必须通过公共图标入口使用图标，禁止直接访问第三方图标库。该约束在迁移到 Biome 后保持为硬规则，不得弱化。
