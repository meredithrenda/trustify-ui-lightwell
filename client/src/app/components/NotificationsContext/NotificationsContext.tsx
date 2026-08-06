import React from "react";

import type { AlertProps } from "@patternfly/react-core";

export type NotificationVariant = NonNullable<AlertProps["variant"]>;

export type INotification = {
  id: string;
  title: string;
  variant: NotificationVariant;
  message?: React.ReactNode;
  hideCloseButton?: boolean;
  /** Toast timeout in ms. PatternFly recommends 8000. Use false to disable. */
  timeout?: number | boolean;
  /** When false, skip toast (drawer entry only). Defaults to true. */
  showToast?: boolean;
};

export type IDrawerNotification = {
  id: string;
  title: string;
  variant: NotificationVariant;
  message?: React.ReactNode;
  createdAt: number;
  isRead: boolean;
};

interface INotificationsContext {
  pushNotification: (
    notification: Omit<INotification, "id"> & { id?: string },
  ) => void;
  dismissNotification: (id: string) => void;
  notifications: INotification[];
  drawerNotifications: IDrawerNotification[];
  isDrawerExpanded: boolean;
  setDrawerExpanded: (expanded: boolean) => void;
  toggleDrawer: () => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  markNotificationsReadByTitle: (title: string) => void;
  removeDrawerNotification: (id: string) => void;
  clearAllDrawerNotifications: () => void;
  unreadCount: number;
  hasUnreadAttention: boolean;
  shouldNotifyBadge: boolean;
  clearShouldNotifyBadge: () => void;
}

const appContextDefaultValue = {} as INotificationsContext;

export const NotificationsContext = React.createContext<INotificationsContext>(
  appContextDefaultValue,
);

/** PatternFly toast alert recommended timeout. */
export const NOTIFICATION_TOAST_TIMEOUT_MS = 8000;
