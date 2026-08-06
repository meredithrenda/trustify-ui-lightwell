import React from "react";

import {
  Banner,
  Flex,
  FlexItem,
  Page,
  SkipToContent,
} from "@patternfly/react-core";
import InfoCircleIcon from "@patternfly/react-icons/dist/esm/icons/info-circle-icon";

import { Notifications } from "@app/components/Notifications";
import {
  NotificationDrawerPanel,
  NotificationsContext,
} from "@app/components/NotificationsContext";
import { PageContentWithDrawerProvider } from "@app/components/PageDrawerContext";
import { ReadOnlyContext } from "@app/components/ReadOnlyContext";
import { TpaAgentLauncher, TpaAgentProvider } from "@app/components/tpa-agent";
import {
  isPrototypeDemoMode,
  TourProvider,
  TourSpotlight,
  WorkflowTourSwitcher,
} from "@app/prototype-tours";

import { HeaderApp } from "./header";
import { SidebarApp } from "./sidebar";

import "@app/prototype-tours/workflow-tours.css";

interface DefaultLayoutProps {
  children?: React.ReactNode;
}

export const DefaultLayout: React.FC<DefaultLayoutProps> = ({ children }) => {
  const { areMutationsDisabled } = React.useContext(ReadOnlyContext);
  const { isDrawerExpanded } = React.useContext(NotificationsContext);
  const pageId = "main-content-page-layout-horizontal-nav";
  const PageSkipToContent = (
    <SkipToContent href={`#${pageId}`}>Skip to content</SkipToContent>
  );

  const showWorkflowTours = isPrototypeDemoMode();

  const page = (
    <Page
      masthead={<HeaderApp />}
      sidebar={<SidebarApp />}
      isManagedSidebar
      skipToContent={PageSkipToContent}
      mainContainerId={pageId}
      notificationDrawer={<NotificationDrawerPanel />}
      isNotificationDrawerExpanded={isDrawerExpanded}
    >
      {areMutationsDisabled ? (
        <Banner
          isSticky
          status="info"
          screenReaderText="Info banner: application is in read-only mode"
        >
          <Flex
            justifyContent={{ default: "justifyContentCenter" }}
            alignItems={{ default: "alignItemsCenter" }}
            gap={{ default: "gapSm" }}
          >
            <FlexItem>
              <InfoCircleIcon />
            </FlexItem>
            <FlexItem>
              This instance is running in read-only mode. Uploads, imports, and
              other modifications are disabled.
            </FlexItem>
          </Flex>
        </Banner>
      ) : null}
      <TpaAgentProvider>
        <PageContentWithDrawerProvider>
          {children}
          <Notifications />
          <TpaAgentLauncher />
        </PageContentWithDrawerProvider>
      </TpaAgentProvider>
    </Page>
  );

  if (!showWorkflowTours) {
    return page;
  }

  return (
    <TourProvider>
      <div className="workflow-tours-shell">
        <WorkflowTourSwitcher />
        {page}
        <TourSpotlight />
      </div>
    </TourProvider>
  );
};
