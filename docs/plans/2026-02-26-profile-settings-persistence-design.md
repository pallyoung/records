# Profile Settings Persistence Design

## Background

Current behavior has two UX problems:

1. The "Appearance" option in settings only updates in memory and is lost after refresh.
2. The profile page shows two avatar blocks, which creates visual duplication.

## Goals

- Persist settings in local storage using a single key.
- Make appearance setting survive page reload.
- Keep only one avatar area on the profile page.
- Keep a clear "Logout" entry in the settings list.

## Scope

In scope:

- Theme setting persistence via `localStorage`.
- Profile page structure cleanup for duplicated avatar.
- Logout entry placement update.

Out of scope:

- Notification/reminder behavior implementation.
- Data export/about feature behavior changes.
- Server-side profile/avatar features.

## Agreed Decisions

### 1) Single settings storage key

Use one local storage key (e.g. `app_settings`) to store a settings object.

- Initial shape:
  - `theme`: `"light" | "dark" | "auto"`
- Future settings should be added to the same object to avoid key sprawl.

### 2) Data ownership and flow

- `App` remains the state owner for current theme.
- On app init, `App` reads persisted settings and sets initial theme.
- On theme change, `App` updates in-memory state and writes settings back to local storage.
- `ProfilePage` stays presentation-focused and emits `onThemeChange`.

### 3) Profile layout cleanup

- Remove the upper `userSection` avatar block.
- Keep the `profileHeader` avatar/statistics block as the single avatar area.
- Keep logout entry by adding it as the last item in settings list.

## Detailed Design

### Settings persistence contract

- Storage key: `app_settings`
- Payload: JSON object with known typed fields.
- Read behavior:
  - If key missing: use defaults.
  - If JSON parse fails: use defaults.
  - If theme value invalid: fallback to `"auto"`.
- Write behavior:
  - Always write full settings object (not partial shards) to keep schema coherent.

### Theme application behavior

- Existing logic that maps theme to `document.documentElement` remains unchanged.
- Persisted value only affects initial state and subsequent setting updates.

### Logout UX

- Add a dedicated settings row labeled "退出登录" at the bottom.
- Reuse existing confirm flow (`ConfirmDialog` + `confirm`) before calling logout action.

## Error Handling

- Local storage unavailability or malformed payload must not crash rendering.
- Theme fallback path is always deterministic (`auto`).
- Logout failures (if any) should keep current page stable and not corrupt settings.

## Testing Plan

Manual acceptance checks:

1. Switch theme in settings and refresh page; selected theme remains.
2. Corrupt stored settings value manually; app loads with default `auto` without crash.
3. Profile page shows only one avatar block.
4. "退出登录" appears as last settings item and still triggers confirmation + logout.

## Risks and Mitigations

- Risk: old storage values with incompatible shape.
  - Mitigation: validate and normalize during read.
- Risk: visual spacing changes after removing `userSection`.
  - Mitigation: adjust profile page spacing styles in the same change.

## Implementation Notes

- Keep implementation minimal and local to:
  - `src/App.tsx` (settings load/save)
  - `src/pages/profile-page/index.tsx` (remove duplicate avatar block, move logout entry)
  - `src/pages/profile-page/index.module.scss` (style cleanup)
