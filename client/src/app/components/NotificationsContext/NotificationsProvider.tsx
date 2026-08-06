import * as React from "react";

import {
  type IDrawerNotification,
  type INotification,
  NotificationsContext,
  NOTIFICATION_TOAST_TIMEOUT_MS,
  type NotificationVariant,
} from "./NotificationsContext";

interface INotificationsProvider {
  children: React.ReactNode;
}

const notificationDefault: Pick<INotification, "hideCloseButton" | "timeout"> =
  {
    hideCloseButton: false,
    timeout: NOTIFICATION_TOAST_TIMEOUT_MS,
  };

const createNotificationId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const NotificationsProvider: React.FunctionComponent<
  INotificationsProvider
> = ({ children }: INotificationsProvider) => {
  const [notifications, setNotifications] = React.useState<INotification[]>([]);
  const [drawerNotifications, setDrawerNotifications] = React.useState<
    IDrawerNotification[]
  >([]);
  const [isDrawerExpanded, setDrawerExpanded] = React.useState(false);
  const [shouldNotifyBadge, setShouldNotifyBadge] = React.useState(false);
  const isDrawerExpandedRef = React.useRef(isDrawerExpanded);
  isDrawerExpandedRef.current = isDrawerExpanded;

  const pushNotification = (
    notification: Omit<INotification, "id"> & { id?: string },
  ) => {
    const id = notification.id ?? createNotificationId();
    const next: INotification = {
      ...notificationDefault,
      ...notification,
      id,
      variant: (notification.variant ?? "custom") as NotificationVariant,
    };

    setDrawerNotifications((prev) => [
      {
        id,
        title: next.title,
        variant: next.variant,
        message: next.message,
        createdAt: Date.now(),
        isRead: false,
      },
      ...prev,
    ]);
    setShouldNotifyBadge(true);

    const shouldShowToast =
      next.showToast !== false && !isDrawerExpandedRef.current;
    if (shouldShowToast) {
      setNotifications((prev) => [...prev, next]);
    }
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const toggleDrawer = () => {
    setDrawerExpanded((prev) => {
      const next = !prev;
      if (next) {
        // Opening the drawer dismisses visible toasts (history remains in drawer).
        setNotifications([]);
      }
      return next;
    });
  };

  const markNotificationRead = (id: string) => {
    setDrawerNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id
          ? { ...notification, isRead: true }
          : notification,
      ),
    );
  };

  const markAllNotificationsRead = () => {
    setDrawerNotifications((prev) =>
      prev.map((notification) => ({ ...notification, isRead: true })),
    );
  };

  const markNotificationsReadByTitle = (title: string) => {
    setDrawerNotifications((prev) =>
      prev.map((notification) =>
        notification.title === title
          ? { ...notification, isRead: true }
          : notification,
      ),
    );
  };

  const removeDrawerNotification = (id: string) => {
    setDrawerNotifications((prev) =>
      prev.filter((notification) => notification.id !== id),
    );
  };

  const clearAllDrawerNotifications = () => {
    setDrawerNotifications([]);
  };

  const unreadCount = drawerNotifications.filter((n) => !n.isRead).length;
  // Attention is reserved for unread critical (danger) notifications.
  const hasUnreadAttention = drawerNotifications.some(
    (n) => !n.isRead && n.variant === "danger",
  );

  return (
    <NotificationsContext.Provider
      value={{
        pushNotification,
        dismissNotification,
        notifications,
        drawerNotifications,
        isDrawerExpanded,
        setDrawerExpanded,
        toggleDrawer,
        markNotificationRead,
        markAllNotificationsRead,
        markNotificationsReadByTitle,
        removeDrawerNotification,
        clearAllDrawerNotifications,
        unreadCount,
        hasUnreadAttention,
        shouldNotifyBadge,
        clearShouldNotifyBadge: () => setShouldNotifyBadge(false),
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};
