import React from "react";

import {
  Dropdown,
  DropdownItem,
  DropdownList,
  EmptyState,
  EmptyStateBody,
  EmptyStateVariant,
  MenuToggle,
  type MenuToggleElement,
  NotificationDrawer,
  NotificationDrawerBody,
  NotificationDrawerHeader,
  NotificationDrawerList,
  NotificationDrawerListItem,
  NotificationDrawerListItemBody,
  NotificationDrawerListItemHeader,
} from "@patternfly/react-core";
import EllipsisVIcon from "@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon";
import SearchIcon from "@patternfly/react-icons/dist/esm/icons/search-icon";

import {
  type IDrawerNotification,
  NotificationsContext,
  type NotificationVariant,
} from "./NotificationsContext";

const variantSrLabel = (variant: NotificationVariant) => {
  switch (variant) {
    case "success":
      return "Success";
    case "danger":
      return "Danger";
    case "warning":
      return "Warning";
    case "info":
      return "Info";
    default:
      return "Custom";
  }
};

/** PatternFly: relative under 1 hour, absolute after. */
export const formatNotificationTimestamp = (createdAt: number, now: number) => {
  const seconds = Math.max(0, Math.floor((now - createdAt) / 1000));
  if (seconds < 60) {
    return seconds <= 1 ? "1 second ago" : `${seconds} seconds ago`;
  }
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
  }
  const date = new Date(createdAt);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${date.toDateString()} at ${hours}:${minutes}`;
};

export const NotificationDrawerPanel: React.FunctionComponent = () => {
  const {
    drawerNotifications,
    unreadCount,
    setDrawerExpanded,
    markNotificationRead,
    markAllNotificationsRead,
    removeDrawerNotification,
    clearAllDrawerNotifications,
  } = React.useContext(NotificationsContext);

  const [isHeaderActionsOpen, setIsHeaderActionsOpen] = React.useState(false);
  const [openItemActionsKey, setOpenItemActionsKey] = React.useState<
    string | null
  >(null);
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
    const hasRecent = drawerNotifications.some(
      (notification) => Date.now() - notification.createdAt < 3600_000,
    );
    if (!hasRecent) {
      return;
    }
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, [drawerNotifications]);

  const renderItem = (notification: IDrawerNotification, index: number) => (
    <NotificationDrawerListItem
      key={notification.id}
      variant={notification.variant}
      isRead={notification.isRead}
      onClick={() => markNotificationRead(notification.id)}
    >
      <NotificationDrawerListItemHeader
        variant={notification.variant}
        title={notification.title}
        srTitle={`${variantSrLabel(notification.variant)} notification:`}
      >
        <Dropdown
          isOpen={openItemActionsKey === notification.id}
          onSelect={() => setOpenItemActionsKey(null)}
          popperProps={{ position: "right" }}
          onOpenChange={(isOpen: boolean) =>
            !isOpen && setOpenItemActionsKey(null)
          }
          toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
            <MenuToggle
              ref={toggleRef}
              isExpanded={openItemActionsKey === notification.id}
              variant="plain"
              onClick={(event) => {
                event.stopPropagation();
                setOpenItemActionsKey((prev) =>
                  prev === notification.id ? null : notification.id,
                );
              }}
              aria-label={`Notification ${index + 1} actions`}
              icon={<EllipsisVIcon />}
            />
          )}
        >
          <DropdownList>
            <DropdownItem
              key={`markRead-${notification.id}`}
              onClick={() => markNotificationRead(notification.id)}
              isDisabled={notification.isRead}
            >
              Mark as read
            </DropdownItem>
            <DropdownItem
              key={`clear-${notification.id}`}
              onClick={() => removeDrawerNotification(notification.id)}
            >
              Clear
            </DropdownItem>
          </DropdownList>
        </Dropdown>
      </NotificationDrawerListItemHeader>
      <NotificationDrawerListItemBody
        timestamp={formatNotificationTimestamp(notification.createdAt, now)}
      >
        {notification.message}
      </NotificationDrawerListItemBody>
    </NotificationDrawerListItem>
  );

  return (
    <NotificationDrawer>
      <NotificationDrawerHeader
        // Hide status text when there are no unread items (avoid "0 unread").
        {...(unreadCount > 0 ? { count: unreadCount } : {})}
        onClose={() => setDrawerExpanded(false)}
      >
        <Dropdown
          isOpen={isHeaderActionsOpen}
          onSelect={() => setIsHeaderActionsOpen(false)}
          popperProps={{ position: "right" }}
          onOpenChange={(isOpen: boolean) => setIsHeaderActionsOpen(isOpen)}
          toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
            <MenuToggle
              ref={toggleRef}
              isExpanded={isHeaderActionsOpen}
              variant="plain"
              onClick={() => setIsHeaderActionsOpen((prev) => !prev)}
              aria-label="Notification drawer actions"
              icon={<EllipsisVIcon />}
            />
          )}
        >
          <DropdownList>
            <DropdownItem
              key="markAllRead"
              onClick={markAllNotificationsRead}
              isDisabled={unreadCount === 0}
            >
              Mark all read
            </DropdownItem>
            <DropdownItem
              key="clearAll"
              onClick={clearAllDrawerNotifications}
              isDisabled={drawerNotifications.length === 0}
            >
              Clear all
            </DropdownItem>
          </DropdownList>
        </Dropdown>
      </NotificationDrawerHeader>
      <NotificationDrawerBody>
        {drawerNotifications.length === 0 ? (
          <EmptyState
            headingLevel="h2"
            titleText="No notifications found"
            icon={SearchIcon}
            variant={EmptyStateVariant.full}
          >
            <EmptyStateBody>
              There are currently no notifications.
            </EmptyStateBody>
          </EmptyState>
        ) : (
          <NotificationDrawerList>
            {drawerNotifications.map(renderItem)}
          </NotificationDrawerList>
        )}
      </NotificationDrawerBody>
    </NotificationDrawer>
  );
};
