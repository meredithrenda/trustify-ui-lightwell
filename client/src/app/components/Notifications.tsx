import React from "react";

import {
  Alert,
  AlertActionCloseButton,
  AlertGroup,
} from "@patternfly/react-core";

import {
  NotificationsContext,
  NOTIFICATION_TOAST_TIMEOUT_MS,
} from "./NotificationsContext";

export const Notifications: React.FunctionComponent = () => {
  const appContext = React.useContext(NotificationsContext);

  const onOverflowClick = () => {
    appContext.notifications.forEach((notification) => {
      appContext.dismissNotification(notification.id);
    });
    appContext.setDrawerExpanded(true);
  };

  const visibleToasts = appContext.notifications.slice(0, 3);
  const overflowCount = appContext.notifications.length - visibleToasts.length;

  return (
    <AlertGroup
      hasAnimations
      isToast
      isLiveRegion
      onOverflowClick={onOverflowClick}
      overflowMessage={
        overflowCount > 0
          ? `View ${overflowCount} more notification(s) in notification drawer`
          : undefined
      }
    >
      {visibleToasts.map((notification) => (
        <Alert
          title={notification.title}
          variant={notification.variant}
          key={notification.id}
          timeout={
            notification.timeout === undefined
              ? NOTIFICATION_TOAST_TIMEOUT_MS
              : notification.timeout
          }
          onTimeout={() => appContext.dismissNotification(notification.id)}
          {...(!notification.hideCloseButton && {
            actionClose: (
              <AlertActionCloseButton
                title={notification.title}
                variantLabel={`${notification.variant} alert`}
                onClose={() => appContext.dismissNotification(notification.id)}
              />
            ),
          })}
        >
          {notification.message}
        </Alert>
      ))}
    </AlertGroup>
  );
};
