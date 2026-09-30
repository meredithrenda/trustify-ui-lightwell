import React from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@patternfly/react-core";

import { NotificationsContext } from "@app/components/NotificationsContext";
import { Paths } from "@app/Routes";

import {
  persistLightwellReportSelection,
  type LightwellRemediationReportLocationState,
  type LightwellRemediationSelectedSbom,
} from "./lightwell-remediation-report";

type LightwellReportReadyMessageProps = {
  count: number;
  selectedSboms: LightwellRemediationSelectedSbom[];
};

export const LightwellReportReadyMessage: React.FC<
  LightwellReportReadyMessageProps
> = ({ count, selectedSboms }) => {
  const navigate = useNavigate();
  const { setDrawerExpanded, markNotificationsReadByTitle } = React.useContext(
    NotificationsContext,
  );

  return (
    <>
      Report ready for {count} SBOM{count === 1 ? "" : "s"}.{" "}
      <Button
        variant="link"
        isInline
        onClick={(event) => {
          event.stopPropagation();
          markNotificationsReadByTitle("Remediation report is ready");
          setDrawerExpanded(false);
          persistLightwellReportSelection(selectedSboms);
          const state: LightwellRemediationReportLocationState = {
            selectedSboms,
            fromNotification: true,
          };
          navigate(Paths.sbomRemediationReport, { state });
        }}
      >
        View report
      </Button>
    </>
  );
};
