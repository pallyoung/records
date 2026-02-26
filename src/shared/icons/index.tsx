import type { IconProps } from "@phosphor-icons/react";
import {
  Bell,
  ChartBar,
  Check,
  CheckSquare,
  DotsThree,
  DownloadSimple,
  House,
  Info,
  MagnifyingGlass,
  Plus,
  SignOut,
  SunDim,
  User,
} from "@phosphor-icons/react";

type AppIconProps = Omit<IconProps, "weight">;

const BASE_ICON_PROPS = {
  weight: "fill" as const,
  "aria-hidden": true as const,
};

export function IconTabHome(props: AppIconProps) {
  return <House {...BASE_ICON_PROPS} {...props} />;
}

export function IconTabTasks(props: AppIconProps) {
  return <CheckSquare {...BASE_ICON_PROPS} {...props} />;
}

export function IconTabInsights(props: AppIconProps) {
  return <ChartBar {...BASE_ICON_PROPS} {...props} />;
}

export function IconTabProfile(props: AppIconProps) {
  return <User {...BASE_ICON_PROPS} {...props} />;
}

export function IconAdd(props: AppIconProps) {
  return <Plus {...BASE_ICON_PROPS} {...props} />;
}

export function IconSearch(props: AppIconProps) {
  return <MagnifyingGlass {...BASE_ICON_PROPS} {...props} />;
}

export function IconCheck(props: AppIconProps) {
  return <Check {...BASE_ICON_PROPS} {...props} />;
}

export function IconMore(props: AppIconProps) {
  return <DotsThree {...BASE_ICON_PROPS} {...props} />;
}

export function IconTheme(props: AppIconProps) {
  return <SunDim {...BASE_ICON_PROPS} {...props} />;
}

export function IconNotification(props: AppIconProps) {
  return <Bell {...BASE_ICON_PROPS} {...props} />;
}

export function IconExport(props: AppIconProps) {
  return <DownloadSimple {...BASE_ICON_PROPS} {...props} />;
}

export function IconInfo(props: AppIconProps) {
  return <Info {...BASE_ICON_PROPS} {...props} />;
}

export function IconLogout(props: AppIconProps) {
  return <SignOut {...BASE_ICON_PROPS} {...props} />;
}
