export type ThemeMode = "light" | "dark" | "auto";

export interface AppSettings {
  theme: ThemeMode;
}

const APP_SETTINGS_KEY = "app_settings";

const DEFAULT_SETTINGS: AppSettings = {
  theme: "auto",
};

function isThemeMode(value: unknown): value is ThemeMode {
  return value === "light" || value === "dark" || value === "auto";
}

export function getDefaultSettings(): AppSettings {
  return DEFAULT_SETTINGS;
}

export function readAppSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(APP_SETTINGS_KEY);
    if (!raw) return getDefaultSettings();

    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      theme: isThemeMode(parsed.theme)
        ? parsed.theme
        : getDefaultSettings().theme,
    };
  } catch {
    return getDefaultSettings();
  }
}

export function writeAppSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Ignore write errors (private mode/storage disabled) and keep app usable.
  }
}
