import React from "react";
import { useNavigate } from "react-router-dom";

import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownList,
  Divider,
  MenuToggle,
  type MenuToggleElement,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from "@patternfly/react-core";

import { FilterToolbar } from "@app/components/FilterToolbar";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { SimplePagination } from "@app/components/SimplePagination";
import { ToolbarBulkSelector } from "@app/components/ToolbarBulkSelector";
import {
  mockConfiguredPolicies,
  type PendingPolicyEvaluationRequest,
} from "@app/mocks/policy-evaluations";
import { Paths } from "@app/Routes";

import { RunPolicyEvaluationModal } from "./components/RunPolicyEvaluationModal";
import {
  buildLightwellRemediationReport,
  getLightwellReportGenerationDelayMs,
  LIGHTWELL_REPORT_NAVIGATE_THRESHOLD_MS,
  type LightwellRemediationReportLocationState,
} from "./lightwell-remediation-report";
import { LightwellReportReadyMessage } from "./lightwell-remediation-report-ready-message";
import { SbomSearchContext } from "./sbom-context";

interface SbomToolbarProps {
  showFilters?: boolean;
  showActions?: boolean;
}

export const SbomToolbar: React.FC<SbomToolbarProps> = ({
  showFilters,
  showActions,
}) => {
  const navigate = useNavigate();
  const { pushNotification, markNotificationsReadByTitle } =
    React.useContext(NotificationsContext);
  const [isActionsOpen, setIsActionsOpen] = React.useState(false);
  const [isRunPolicyModalOpen, setIsRunPolicyModalOpen] = React.useState(false);
  const [selectedPolicyId, setSelectedPolicyId] = React.useState(
    mockConfiguredPolicies[0]?.id ?? "",
  );

  const {
    tableControls,
    bulkSelection: {
      isEnabled: showBulkSelector,
      controls: bulkSelectionControls,
    },
  } = React.useContext(SbomSearchContext);

  const {
    propHelpers: {
      toolbarProps,
      filterToolbarProps,
      paginationToolbarItemProps,
      paginationProps,
    },
  } = tableControls;

  const {
    selectedItems,
    propHelpers: { toolbarBulkSelectorProps },
  } = bulkSelectionControls;

  const hasSelectedSboms = selectedItems.length > 0;

  const handleRunPolicyEvaluation = () => {
    if (!selectedPolicyId) {
      return;
    }

    const pendingPolicyEvaluation: PendingPolicyEvaluationRequest = {
      sbomIds: selectedItems.map((sbom) => sbom.id),
      policy: selectedPolicyId,
      requestId: crypto.randomUUID(),
    };

    setIsRunPolicyModalOpen(false);
    navigate(Paths.policy, { state: { pendingPolicyEvaluation } });
  };

  const openRunPolicyModal = () => {
    setSelectedPolicyId(mockConfiguredPolicies[0]?.id ?? "");
    setIsRunPolicyModalOpen(true);
  };

  const handleLightwellRemediationReport = () => {
    if (!hasSelectedSboms) {
      return;
    }
    const selectedSboms = selectedItems.map((sbom) => ({
      id: sbom.id,
      name: sbom.name,
    }));
    const count = selectedSboms.length;
    const delayMs = getLightwellReportGenerationDelayMs(count);
    const willNavigate = delayMs <= LIGHTWELL_REPORT_NAVIGATE_THRESHOLD_MS;

    pushNotification({
      title: "Generating Lightwell remediation report",
      variant: "info",
      message: willNavigate
        ? `Analyzing ${count} selected SBOM${count === 1 ? "" : "s"}.`
        : `Analyzing ${count} selected SBOM${count === 1 ? "" : "s"}. Large SBOMs can take longer. You'll be notified when the report is ready.`,
    });

    if (willNavigate) {
      const state: LightwellRemediationReportLocationState = {
        selectedSboms,
      };
      navigate(Paths.sbomLightwellRemediationReport, { state });
      return;
    }

    window.setTimeout(() => {
      try {
        buildLightwellRemediationReport(selectedSboms);
        markNotificationsReadByTitle(
          "Generating Lightwell remediation report",
        );
        pushNotification({
          title: "Lightwell remediation report is ready",
          variant: "success",
          message: (
            <LightwellReportReadyMessage
              count={count}
              selectedSboms={selectedSboms}
            />
          ),
        });
      } catch {
        markNotificationsReadByTitle("Generating Lightwell remediation report");
        pushNotification({
          title: "Lightwell remediation report failed",
          variant: "danger",
          message:
            "The report could not be generated. Try again with fewer SBOMs.",
        });
      }
    }, delayMs);
  };

  return (
    <>
      <Toolbar {...toolbarProps} aria-label="sbom-toolbar">
        <ToolbarContent>
          {showBulkSelector && (
            <ToolbarGroup align={{ default: "alignStart" }}>
              <ToolbarBulkSelector {...toolbarBulkSelectorProps} />
            </ToolbarGroup>
          )}
          {showFilters && <FilterToolbar {...filterToolbarProps} />}
          {showActions && (
            <ToolbarGroup variant="action-group">
              <ToolbarItem>
                <Dropdown
                  isOpen={isActionsOpen}
                  onSelect={() => setIsActionsOpen(false)}
                  onOpenChange={setIsActionsOpen}
                  popperProps={{ position: "right" }}
                  shouldFocusToggleOnSelect
                  toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                    <MenuToggle
                      ref={toggleRef}
                      isExpanded={isActionsOpen}
                      onClick={() => setIsActionsOpen(!isActionsOpen)}
                    >
                      Actions
                    </MenuToggle>
                  )}
                >
                  <DropdownList>
                    <DropdownItem
                      key="create-group"
                      component="button"
                      onClick={() => setIsActionsOpen(false)}
                    >
                      Create group
                    </DropdownItem>
                    <DropdownItem
                      key="upload-sbom"
                      component="button"
                      onClick={() => {
                        setIsActionsOpen(false);
                        navigate(Paths.sbomUpload);
                      }}
                    >
                      Upload SBOM
                    </DropdownItem>
                    <DropdownItem
                      key="scan-sbom"
                      component="button"
                      onClick={() => {
                        setIsActionsOpen(false);
                        navigate(Paths.sbomScan);
                      }}
                    >
                      Generate vulnerability report
                    </DropdownItem>
                    {showBulkSelector && (
                      <>
                        <Divider component="li" key="bulk-actions-separator" />
                        <DropdownItem
                          key="add-to-group"
                          component="button"
                          isDisabled={!hasSelectedSboms}
                          onClick={() => setIsActionsOpen(false)}
                        >
                          Add to group
                        </DropdownItem>
                        <DropdownItem
                          key="run-policy-evaluation"
                          component="button"
                          isDisabled={!hasSelectedSboms}
                          onClick={() => {
                            setIsActionsOpen(false);
                            openRunPolicyModal();
                          }}
                        >
                          Run policy evaluation
                        </DropdownItem>
                      </>
                    )}
                  </DropdownList>
                </Dropdown>
              </ToolbarItem>
              <ToolbarItem>
                <Button
                  variant="secondary"
                  isDisabled={!hasSelectedSboms}
                  onClick={handleLightwellRemediationReport}
                >
                  Lightwell remediation report
                </Button>
              </ToolbarItem>
            </ToolbarGroup>
          )}
          <ToolbarItem {...paginationToolbarItemProps}>
            <SimplePagination
              idPrefix="sbom-table"
              isTop
              paginationProps={paginationProps}
            />
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>
      <RunPolicyEvaluationModal
        isOpen={isRunPolicyModalOpen}
        selectedPolicyId={selectedPolicyId}
        onClose={() => setIsRunPolicyModalOpen(false)}
        onPolicyChange={setSelectedPolicyId}
        onConfirm={handleRunPolicyEvaluation}
      />
    </>
  );
};
