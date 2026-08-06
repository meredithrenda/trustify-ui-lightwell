import React from "react";
import {
  Link,
  useBlocker,
  useLocation,
  useNavigate,
  type BlockerFunction,
} from "react-router-dom";

import {
  Alert,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Card,
  CardBody,
  CardTitle,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
  EmptyStateVariant,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  PageSection,
  Progress,
  ProgressMeasureLocation,
  ProgressSize,
  Spinner,
} from "@patternfly/react-core";
import {
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@patternfly/react-table";
import DownloadIcon from "@patternfly/react-icons/dist/esm/icons/download-icon";

import { DocumentMetadata } from "@app/components/DocumentMetadata";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { Paths } from "@app/Routes";

import { downloadLightwellRemediationReportCsv } from "./lightwell-remediation-report-download";
import {
  buildLightwellRemediationReport,
  getLightwellReportGenerationDelayMs,
  type LightwellRemediationReport,
  type LightwellRemediationReportLocationState,
} from "./lightwell-remediation-report";

import "./lightwell-remediation-report.css";

export type { LightwellRemediationReportLocationState };

const isReportState = (
  state: unknown,
): state is LightwellRemediationReportLocationState => {
  if (!state || typeof state !== "object") {
    return false;
  }
  const candidate = state as LightwellRemediationReportLocationState;
  return Array.isArray(candidate.selectedSboms);
};

export const LightwellRemediationReportPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { markNotificationsReadByTitle, pushNotification } = React.useContext(
    NotificationsContext,
  );

  const selectedSboms = React.useMemo(() => {
    if (
      !isReportState(location.state) ||
      location.state.selectedSboms.length === 0
    ) {
      return [];
    }
    return location.state.selectedSboms;
  }, [location.state]);

  const fromNotification =
    isReportState(location.state) && location.state.fromNotification === true;

  const selectionKey = selectedSboms.map((sbom) => sbom.id).join(",");

  const [report, setReport] = React.useState<LightwellRemediationReport | null>(
    null,
  );
  const [isGenerating, setIsGenerating] = React.useState(false);

  React.useEffect(() => {
    if (selectedSboms.length === 0) {
      setReport(null);
      setIsGenerating(false);
      return;
    }

    let cancelled = false;

    const finish = (next: LightwellRemediationReport) => {
      if (cancelled) {
        return;
      }
      setReport(next);
      setIsGenerating(false);
      markNotificationsReadByTitle("Generating Lightwell remediation report");
    };

    if (fromNotification) {
      try {
        finish(buildLightwellRemediationReport(selectedSboms));
      } catch {
        setIsGenerating(false);
        pushNotification({
          title: "Lightwell remediation report failed",
          variant: "danger",
          message:
            "The report could not be generated. Try again with fewer SBOMs.",
        });
      }
      return () => {
        cancelled = true;
      };
    }

    setIsGenerating(true);
    setReport(null);

    const timer = window.setTimeout(() => {
      try {
        finish(buildLightwellRemediationReport(selectedSboms));
      } catch {
        if (!cancelled) {
          setIsGenerating(false);
        }
        markNotificationsReadByTitle("Generating Lightwell remediation report");
        pushNotification({
          title: "Lightwell remediation report failed",
          variant: "danger",
          message:
            "The report could not be generated. Try again with fewer SBOMs.",
        });
      }
    }, getLightwellReportGenerationDelayMs(selectedSboms.length));

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- regenerate when selection or entry mode changes
  }, [selectionKey, fromNotification]);

  const shouldBlock = React.useCallback<BlockerFunction>(
    ({ currentLocation, nextLocation }) =>
      (report !== null || isGenerating) &&
      currentLocation.pathname !== nextLocation.pathname,
    [report, isGenerating],
  );
  const blocker = useBlocker(shouldBlock);

  const coveragePercent = report
    ? report.selectedApplicationCount === 0
      ? 0
      : Math.round(
          (report.addressableApplicationCount /
            report.selectedApplicationCount) *
            100,
        )
    : 0;

  const handleDownloadCsv = () => {
    if (!report) {
      return;
    }
    downloadLightwellRemediationReportCsv(report);
  };

  return (
    <>
      <DocumentMetadata title="Lightwell remediation report" />
      <PageSection type="breadcrumb">
        <Breadcrumb>
          <BreadcrumbItem>
            <Link to={Paths.sboms}>SBOMs</Link>
          </BreadcrumbItem>
          <BreadcrumbItem isActive>Lightwell remediation report</BreadcrumbItem>
        </Breadcrumb>
      </PageSection>

      <PageSection>
        <div className="lw-report__header">
          <div className="lw-report__header-text">
            <Content>
              <Content component="h1">Lightwell remediation report</Content>
              <Content component="p">
                Impact summary for your selected SBOMs. Download a copy if you
                want to keep it.
              </Content>
            </Content>
          </div>
          {report ? (
            <Button variant="primary" onClick={handleDownloadCsv}>
              Download
            </Button>
          ) : null}
        </div>
      </PageSection>

      <PageSection>
        {isGenerating ? (
          <EmptyState
            titleText="Generating Lightwell remediation report"
            headingLevel="h4"
            icon={Spinner}
          >
            <EmptyStateBody>
              Analyzing {selectedSboms.length} selected SBOM
              {selectedSboms.length === 1 ? "" : "s"} for Lightwell
              remediations.
            </EmptyStateBody>
          </EmptyState>
        ) : !report ? (
          <EmptyState
            headingLevel="h4"
            titleText="No report to show"
            variant={EmptyStateVariant.sm}
          >
            <EmptyStateBody>
              Select one or more SBOMs on the SBOMs page, then choose Lightwell
              remediation report.
            </EmptyStateBody>
            <EmptyStateFooter>
              <EmptyStateActions>
                <Button variant="primary" onClick={() => navigate(Paths.sboms)}>
                  Go to SBOMs
                </Button>
              </EmptyStateActions>
            </EmptyStateFooter>
          </EmptyState>
        ) : (
          <div className="lw-report">
            <Alert
              variant="custom"
              title="Lightwell remediations available"
              isInline
            >
              Based on the selected SBOMs, Lightwell can address{" "}
              {report.addressableApplicationCount} of{" "}
              {report.selectedApplicationCount} and{" "}
              {report.addressablePackageCount} related package
              {report.addressablePackageCount === 1 ? "" : "s"}.
            </Alert>

            <Card>
              <CardTitle>
                <span className="lw-report__card-title">Impact summary</span>
              </CardTitle>
              <CardBody>
                <div className="lw-report__impact-grid">
                  <div className="lw-report__stat">
                    <div className="lw-report__stat-label">
                      SBOMs Lightwell can address
                    </div>
                    <div className="lw-report__stat-value">
                      {report.addressableApplicationCount}
                      <span className="lw-report__stat-suffix">
                        / {report.selectedApplicationCount}
                      </span>
                    </div>
                    <div className="lw-report__stat-help">
                      You selected {report.selectedApplicationCount} SBOM
                      {report.selectedApplicationCount === 1 ? "" : "s"}
                    </div>
                  </div>
                  <div className="lw-report__stat">
                    <div className="lw-report__stat-label">
                      Packages Lightwell can address
                    </div>
                    <div className="lw-report__stat-value">
                      {report.addressablePackageCount}
                    </div>
                    <div className="lw-report__stat-help">
                      Unique packages across selected SBOMs
                    </div>
                  </div>
                </div>

                <div className="lw-report__progress">
                  <Progress
                    value={coveragePercent}
                    title="SBOM coverage"
                    measureLocation={ProgressMeasureLocation.outside}
                    size={ProgressSize.md}
                    aria-label="Percent of selected SBOMs Lightwell can address"
                  />
                </div>

                <DescriptionList
                  isHorizontal
                  isCompact
                  horizontalTermWidthModifier={{ default: "20ch" }}
                >
                  <DescriptionListGroup>
                    <DescriptionListTerm>Selected SBOMs</DescriptionListTerm>
                    <DescriptionListDescription>
                      {report.selectedApplicationCount}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>
                      Addressable SBOMs
                    </DescriptionListTerm>
                    <DescriptionListDescription>
                      {report.addressableApplicationCount}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>
                      Addressable packages
                    </DescriptionListTerm>
                    <DescriptionListDescription>
                      {report.addressablePackageCount}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                </DescriptionList>
              </CardBody>
            </Card>

            <Card>
              <CardTitle>
                <span className="lw-report__card-title">
                  SBOMs Lightwell can help with
                </span>
              </CardTitle>
              <CardBody>
                {report.applications.length === 0 ? (
                  <Content component="p" className="lw-report__empty">
                    None of the selected SBOMs have Lightwell remediations
                    available.
                  </Content>
                ) : (
                  <Table
                    aria-label="SBOMs Lightwell can help with"
                    variant="compact"
                  >
                    <Thead>
                      <Tr>
                        <Th width={35}>SBOM</Th>
                        <Th width={30}>Addressable packages</Th>
                        <Th width={35}>Status</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {report.applications.map((application) => (
                        <Tr key={application.id}>
                          <Td dataLabel="SBOM" width={35}>
                            {application.name}
                          </Td>
                          <Td dataLabel="Addressable packages" width={30}>
                            {application.addressablePackageCount}
                          </Td>
                          <Td dataLabel="Status" width={35}>
                            <Label color="green" variant="outline" isCompact>
                              Lightwell can help
                            </Label>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardTitle>
                <span className="lw-report__card-title">
                  Packages Lightwell can help with
                </span>
              </CardTitle>
              <CardBody>
                {report.packages.length === 0 ? (
                  <Content component="p" className="lw-report__empty">
                    No Lightwell-addressable packages were found in the selected
                    SBOMs.
                  </Content>
                ) : (
                  <Table
                    aria-label="Packages Lightwell can help with"
                    variant="compact"
                  >
                    <Thead>
                      <Tr>
                        <Th>Package</Th>
                        <Th>Version</Th>
                        <Th>Found in</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {report.packages.map((pkg) => (
                        <Tr key={pkg.packageId}>
                          <Td dataLabel="Package">{pkg.packageName}</Td>
                          <Td dataLabel="Version">{pkg.version ?? "—"}</Td>
                          <Td dataLabel="Found in">
                            <div className="lw-report__app-labels">
                              {pkg.applicationNames.map((name) => (
                                <Label
                                  key={name}
                                  color="grey"
                                  variant="outline"
                                  isCompact
                                >
                                  {name}
                                </Label>
                              ))}
                            </div>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                )}
              </CardBody>
            </Card>
          </div>
        )}
      </PageSection>

      <Modal
        variant="small"
        isOpen={blocker.state === "blocked"}
        onClose={() => blocker.state === "blocked" && blocker.reset()}
      >
        <ModalHeader
          title={
            isGenerating
              ? "Leave while report is generating?"
              : "Leave Lightwell remediation report?"
          }
        />
        <ModalBody>
          {isGenerating
            ? "The report is still generating. If you leave now, generation will stop and you will need to start again from the SBOMs page."
            : "This report is not saved and will be unavailable after leaving this page. To save the report, download it."}
        </ModalBody>
        <ModalFooter>
          {report ? (
            <Button
              variant="primary"
              icon={<DownloadIcon />}
              onClick={() => {
                handleDownloadCsv();
                if (blocker.state === "blocked") {
                  blocker.proceed();
                }
              }}
            >
              Download and leave
            </Button>
          ) : null}
          <Button
            variant={report ? "secondary" : "primary"}
            onClick={() => {
              if (blocker.state === "blocked") {
                blocker.proceed();
              }
            }}
          >
            {report ? "Leave without downloading" : "Leave"}
          </Button>
          <Button
            variant="link"
            onClick={() => {
              if (blocker.state === "blocked") {
                blocker.reset();
              }
            }}
          >
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default LightwellRemediationReportPage;
