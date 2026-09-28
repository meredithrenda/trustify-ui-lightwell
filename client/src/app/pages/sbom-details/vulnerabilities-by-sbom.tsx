import React from "react";
import { generatePath, Link } from "react-router-dom";

import dayjs from "dayjs";
import { LoadingWrapper } from "@tsd-ui/core";

import {
  Alert,
  AlertActionCloseButton,
  Card,
  CardBody,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Grid,
  GridItem,
  Stack,
  StackItem,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from "@patternfly/react-core";
import {
  ActionsColumn,
  ExpandableRowContent,
  Table,
  TableText,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@patternfly/react-table";

import {
  type ExtendedSeverity,
  type VulnerabilityStatus,
} from "@app/api/models";
import type {
  AdvisoryHead,
  PurlSummary,
  SbomStatus,
  ScoredVector,
} from "@app/client";
import {
  buildExploitIntelligenceErrorBanner,
  buildExploitIntelligenceSuccessBanner,
  canRequestNewExploitIntelligenceAnalysis,
  type ExploitIntelligenceAnalysisRequestOptions,
  type ExploitIntelligenceCellState,
  type ExploitIntelligenceRequestBanner,
  ExploitIntelligenceAnalysisCell,
  formatExploitIntelligenceRequestError,
} from "@app/components/exploit-intelligence";
import { PackageQualifiers } from "@app/components/PackageQualifiers";
import { SbomVulnerabilitiesDonutChart } from "@app/components/SbomVulnerabilitiesDonutChart";
import { SeverityShieldAndText } from "@app/components/SeverityShieldAndText";
import { SimplePagination } from "@app/components/SimplePagination";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import { TdWithFocusStatus } from "@app/components/TdWithFocusStatus";
import {
  buildSbomVulnerabilityFocus,
  TPA_INTELLIGENCE_ASSISTANT_SHORT_NAME,
  useTpaAgent,
} from "@app/components/tpa-agent";
import { VulnerabilityDescription } from "@app/components/VulnerabilityDescription";
import { useVulnerabilitiesOfSbom } from "@app/hooks/domain-controls/useVulnerabilitiesOfSbom";
import { useLocalTableControls } from "@app/hooks/table-controls";
import type { LightwellRemediationPackage } from "@app/mocks/sbom-remediations";
import {
  countRemediations,
  getMockRemediationPackagesForCve,
} from "@app/mocks/sbom-remediations";
import { useFetchSBOMById } from "@app/queries/sboms";
import { Paths } from "@app/Routes";
import { useWithUiId } from "@app/utils/query-utils";
import { decomposePurl, formatDate } from "@app/utils/utils";

import { AffectedDependencyRemediationCell } from "./components/AffectedDependencyRemediationCell";
import { RemediationCountCell } from "./components/RemediationCountCell";

declare const __MOCK_DATA__: boolean;

/** Mock SBOM at index 0 (`getMockSbomAdvisories`) — CVE set aligned with exploit-intelligence column prototype. */
const MOCK_PROTOTYPE_EXPLOIT_INTEL_SBOM_ID =
  "a1b2c3d4-0001-4000-8000-000000000001";

const MOCK_PROTOTYPE_EXPLOIT_REPORT_URL =
  "https://example.com/exploit-intelligence-report";

/** Prototype interactives: click Request Analysis to demo success vs submit failure banners. */
const MOCK_PROTOTYPE_REQUEST_SUCCESS_DEMO_CVE = "CVE-2023-44487";
const MOCK_PROTOTYPE_REQUEST_FAILURE_DEMO_CVE = "CVE-2024-0232";

const MOCK_PROTOTYPE_REQUEST_FAILURE_ERROR =
  formatExploitIntelligenceRequestError({
    statusCode: 400,
    body: JSON.stringify({
      sbomValidationIssues: [
        {
          code: "MISSING_SOURCE_CODE_URL",
          configuredProperty: "exploit-iq.image.source.location-keys",
          expectedLabels: [
            "image.source-location",
            "io.openshift.build.source-location",
            "upstream-source-url",
            "org.opencontainers.image.source",
          ],
        },
        {
          code: "MISSING_SOURCE_COMMIT_ID",
          configuredProperty: "exploit-iq.image.source.commit-id-keys",
          expectedLabels: [
            "image.source.commit-id",
            "io.openshift.build.commit.id",
            "upstream-source-ref",
            "org.opencontainers.image.revision",
          ],
        },
      ],
      error: "SBOM is missing source code URL and commit ID labels.",
    }),
  });

const MOCK_PROTOTYPE_EXPLOIT_INTEL_BY_CVE: Record<
  string,
  ExploitIntelligenceCellState
> = {
  "CVE-2024-9680": {
    kind: "finding",
    finding: {
      variant: "vulnerable",
      count: 21,
      breakdown: {
        vulnerableCount: 21,
        uncertainCount: 5,
        notVulnerableCount: 24,
        failedCount: 3,
      },
    },
    reportUrl: MOCK_PROTOTYPE_EXPLOIT_REPORT_URL,
  },
  "CVE-2024-12747": {
    kind: "finding",
    finding: {
      variant: "not_vulnerable",
      breakdown: {
        vulnerableCount: 0,
        uncertainCount: 0,
        notVulnerableCount: 88,
        failedCount: 0,
      },
    },
    reportUrl: MOCK_PROTOTYPE_EXPLOIT_REPORT_URL,
  },
  "CVE-2024-6119": { kind: "finding", finding: { variant: "in_progress" } },
  "CVE-2024-47176": {
    kind: "finding",
    finding: {
      variant: "uncertain",
      count: 4,
      breakdown: {
        vulnerableCount: 0,
        uncertainCount: 4,
        notVulnerableCount: 70,
        failedCount: 0,
      },
    },
    reportUrl: MOCK_PROTOTYPE_EXPLOIT_REPORT_URL,
  },
  "CVE-2024-21626": {
    kind: "finding",
    finding: { variant: "failed" },
    reportUrl: MOCK_PROTOTYPE_EXPLOIT_REPORT_URL,
  },
  "CVE-2023-44487": { kind: "not_run" },
  "CVE-2024-0232": { kind: "not_run" },
};

interface TableData {
  vulnerability: SbomStatus;
  vulnerabilityStatus: VulnerabilityStatus;
  purls: Map<
    string,
    | { isOrphan: true; parentName: string }
    | { isOrphan: false; purlSummary: PurlSummary }
  >;
  opinionatedAdvisory: {
    advisory: AdvisoryHead | null;
    score: ScoredVector | null;
    extendedSeverity: ExtendedSeverity;
  };
  /** When the API returns exploit-intelligence state for this row, it is passed through here */
  exploitIntelligence?: ExploitIntelligenceCellState;
  /** Packages that carry remediations for this CVE (shown per package in Affected dependencies expand). */
  remediationPackages: LightwellRemediationPackage[];
}

interface VulnerabilitiesBySbomProps {
  sbomId: string;
}

export const VulnerabilitiesBySbom: React.FC<VulnerabilitiesBySbomProps> = ({
  sbomId,
}) => {
  const { openAgentWithFocus } = useTpaAgent();

  const [exploitIntelByVulnId, setExploitIntelByVulnId] = React.useState<
    Record<string, ExploitIntelligenceCellState>
  >({});
  const [exploitIntelRequestBanner, setExploitIntelRequestBanner] =
    React.useState<ExploitIntelligenceRequestBanner | null>(null);

  /** Success path: row moves to in progress and a success inline alert is shown above the table. */
  const handleRequestExploitAnalysis = (
    vulnerabilityIdentifier: string,
    options?: ExploitIntelligenceAnalysisRequestOptions,
  ) => {
    if (
      __MOCK_DATA__ &&
      sbomId === MOCK_PROTOTYPE_EXPLOIT_INTEL_SBOM_ID &&
      vulnerabilityIdentifier === MOCK_PROTOTYPE_REQUEST_FAILURE_DEMO_CVE
    ) {
      setExploitIntelRequestBanner(
        buildExploitIntelligenceErrorBanner(
          vulnerabilityIdentifier,
          MOCK_PROTOTYPE_REQUEST_FAILURE_ERROR,
        ),
      );
      setExploitIntelByVulnId((prev) => ({
        ...prev,
        [vulnerabilityIdentifier]: {
          kind: "request_failed",
          error: MOCK_PROTOTYPE_REQUEST_FAILURE_ERROR,
        },
      }));
      return;
    }

    setExploitIntelRequestBanner(
      buildExploitIntelligenceSuccessBanner(vulnerabilityIdentifier, options),
    );
    setExploitIntelByVulnId((prev) => ({
      ...prev,
      [vulnerabilityIdentifier]: {
        kind: "finding",
        finding: { variant: "in_progress" },
      },
    }));
  };

  const {
    sbom,
    isFetching: isFetchingSbom,
    fetchError: fetchErrorSbom,
  } = useFetchSBOMById(sbomId);
  const {
    data: { vulnerabilities, summary: vulnerabilitiesSummary },
    isFetching: isFetchingVulnerabilities,
    fetchError: fetchErrorVulnerabilities,
  } = useVulnerabilitiesOfSbom(sbomId);

  const affectedVulnerabilities = React.useMemo(() => {
    return vulnerabilities.filter(
      (item) => item.vulnerabilityStatus === "affected",
    );
  }, [vulnerabilities]);

  const tableData = React.useMemo(() => {
    return affectedVulnerabilities.map((item) => {
      const exploitIntelligence =
        __MOCK_DATA__ &&
        sbomId === MOCK_PROTOTYPE_EXPLOIT_INTEL_SBOM_ID &&
        item.vulnerability.identifier in MOCK_PROTOTYPE_EXPLOIT_INTEL_BY_CVE
          ? MOCK_PROTOTYPE_EXPLOIT_INTEL_BY_CVE[item.vulnerability.identifier]
          : undefined;

      const remediationPackages =
        __MOCK_DATA__ && sbomId === MOCK_PROTOTYPE_EXPLOIT_INTEL_SBOM_ID
          ? getMockRemediationPackagesForCve(item.vulnerability.identifier)
          : [];

      const result: TableData = {
        vulnerability: item.vulnerability,
        vulnerabilityStatus: item.vulnerabilityStatus,
        purls: item.purls,
        opinionatedAdvisory: item.opinionatedAdvisory,
        exploitIntelligence,
        remediationPackages,
      };

      return result;
    });
  }, [affectedVulnerabilities, sbomId]);

  const tableDataWithUiId = useWithUiId(
    tableData,
    (d) => `${d.vulnerability.identifier}-${d.vulnerabilityStatus}`,
  );

  const tableControls = useLocalTableControls({
    tableName: "vulnerability-table",
    idProperty: "_ui_unique_id",
    items: tableDataWithUiId,
    isLoading: isFetchingVulnerabilities,
    columnNames: {
      id: "Id",
      description: "Description",
      cvss: "CVSS",
      remediations: "Remediations",
      exploitIntelligence: "Exploit Intelligence Analysis",
      affectedDependencies: "Affected dependencies",
      updated: "Updated",
    },
    hasActionsColumn: true,
    isSortEnabled: true,
    sortableColumns: [
      "id",
      "cvss",
      "remediations",
      "affectedDependencies",
      "updated",
    ],
    initialSort: { columnKey: "cvss", direction: "desc" },
    getSortValues: (item) => ({
      id: item.vulnerability.identifier,
      cvss: item.opinionatedAdvisory.score?.value ?? 0,
      remediations: countRemediations(item.remediationPackages),
      affectedDependencies: item.purls.size,
      updated: item.vulnerability?.modified
        ? dayjs(item.vulnerability.modified).valueOf()
        : 0,
    }),
    isPaginationEnabled: true,
    isFilterEnabled: false,
    isExpansionEnabled: true,
    expandableVariant: "compound",
  });

  const {
    currentPageItems,
    numRenderedColumns,
    propHelpers: {
      toolbarProps,
      paginationToolbarItemProps,
      paginationProps,
      tableProps,
      getThProps,
      getTrProps,
      getTdProps,
      getExpandedContentTdProps,
    },
    expansionDerivedState: { isCellExpanded },
  } = tableControls;

  return (
    <Stack hasGutter>
      <StackItem>
        <Card>
          <CardBody>
            <LoadingWrapper
              isFetching={isFetchingSbom || isFetchingVulnerabilities}
              fetchError={fetchErrorSbom}
            >
              <Grid hasGutter>
                <GridItem md={6}>
                  <SbomVulnerabilitiesDonutChart
                    vulnerabilitiesSummary={
                      vulnerabilitiesSummary.vulnerabilityStatus.affected
                    }
                  />
                </GridItem>
                <GridItem md={6}>
                  <DescriptionList>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Name</DescriptionListTerm>
                      <DescriptionListDescription>
                        {sbom?.name}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Version</DescriptionListTerm>
                      <DescriptionListDescription>
                        {(sbom?.described_by ?? [])
                          .map((item: { version: string }) => item.version)
                          .join(", ")}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Creation date</DescriptionListTerm>
                      <DescriptionListDescription>
                        {formatDate(sbom?.published)}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                  </DescriptionList>
                </GridItem>
              </Grid>
            </LoadingWrapper>
          </CardBody>
        </Card>
      </StackItem>
      <StackItem>
        {exploitIntelRequestBanner ? (
          <Alert
            actionClose={
              <AlertActionCloseButton
                onClose={() => setExploitIntelRequestBanner(null)}
              />
            }
            className="vulnerabilities-exploit-intel-request-banner"
            isInline
            onTimeout={() => setExploitIntelRequestBanner(null)}
            timeout={8000}
            title={exploitIntelRequestBanner.title}
            variant={exploitIntelRequestBanner.variant}
          >
            {exploitIntelRequestBanner.message}
            {exploitIntelRequestBanner.detail ? (
              <>
                <br />
                {exploitIntelRequestBanner.detail}
              </>
            ) : null}
          </Alert>
        ) : null}
        <Toolbar {...toolbarProps}>
          <ToolbarContent>
            <ToolbarItem {...paginationToolbarItemProps}>
              <SimplePagination
                idPrefix="vulnerability-table"
                isTop
                paginationProps={paginationProps}
              />
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>

        <Table {...tableProps} aria-label="Vulnerability table">
          <Thead>
            <Tr>
              <TableHeaderContentWithControls {...tableControls}>
                <Th modifier="fitContent" {...getThProps({ columnKey: "id" })} />
                <Th {...getThProps({ columnKey: "description" })} />
                <Th
                  modifier="fitContent"
                  {...getThProps({ columnKey: "cvss" })}
                />
                <Th
                  modifier="fitContent"
                  {...getThProps({ columnKey: "remediations" })}
                  info={{
                    tooltip:
                      "Count of remediations for packages affected by this vulnerability. Expand Affected dependencies to see remediations per package for this CVE.",
                  }}
                />
                <Th
                  modifier="fitContent"
                  {...getThProps({ columnKey: "exploitIntelligence" })}
                  info={{
                    tooltip:
                      "Run Exploit Intelligence analysis for this vulnerability, or view the current finding.",
                  }}
                />
                <Th
                  modifier="fitContent"
                  {...getThProps({ columnKey: "affectedDependencies" })}
                />
                <Th
                  modifier="fitContent"
                  {...getThProps({ columnKey: "updated" })}
                />
              </TableHeaderContentWithControls>
            </Tr>
          </Thead>
          <ConditionalTableBody
            isLoading={isFetchingVulnerabilities}
            isError={!!fetchErrorVulnerabilities}
            isNoData={tableDataWithUiId.length === 0}
            numRenderedColumns={numRenderedColumns}
          >
            {currentPageItems?.map((item, rowIndex) => {
              const exploitIntelligenceState = exploitIntelByVulnId[
                item.vulnerability.identifier
              ] ??
                item.exploitIntelligence ?? { kind: "not_run" as const };

              return (
                <Tbody
                  key={item._ui_unique_id}
                  isExpanded={isCellExpanded(item)}
                >
                  <Tr {...getTrProps({ item })}>
                    <TableRowContentWithControls
                      {...tableControls}
                      item={item}
                      rowIndex={rowIndex}
                    >
                      <Td
                        modifier="nowrap"
                        {...getTdProps({ columnKey: "id" })}
                      >
                        <Link
                          to={generatePath(Paths.vulnerabilityDetails, {
                            vulnerabilityId: item.vulnerability.identifier,
                          })}
                        >
                          {item.vulnerability.identifier}
                        </Link>
                      </Td>
                      <TdWithFocusStatus>
                        {(isFocused, setIsFocused) => (
                          <Td
                            modifier="truncate"
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            tabIndex={0}
                            {...getTdProps({ columnKey: "description" })}
                          >
                            <TableText
                              focused={isFocused}
                              wrapModifier="truncate"
                            >
                              {item.vulnerability && (
                                <VulnerabilityDescription
                                  vulnerability={item.vulnerability}
                                />
                              )}
                            </TableText>
                          </Td>
                        )}
                      </TdWithFocusStatus>
                      <Td
                        modifier="nowrap"
                        {...getTdProps({ columnKey: "cvss" })}
                      >
                        <SeverityShieldAndText
                          value={item.opinionatedAdvisory.extendedSeverity}
                          score={item.opinionatedAdvisory.score?.value ?? null}
                          showLabel
                          showScore
                        />
                      </Td>
                      <Td
                        modifier="nowrap"
                        {...getTdProps({ columnKey: "remediations" })}
                      >
                        <RemediationCountCell
                          packages={item.remediationPackages}
                        />
                      </Td>
                      <Td
                        modifier="nowrap"
                        {...getTdProps({ columnKey: "exploitIntelligence" })}
                      >
                        <ExploitIntelligenceAnalysisCell
                          vulnerabilityIdentifier={
                            item.vulnerability.identifier
                          }
                          state={exploitIntelligenceState}
                          onRequestAnalysis={handleRequestExploitAnalysis}
                        />
                      </Td>
                      <Td
                        modifier="nowrap"
                        {...getTdProps({
                          columnKey: "affectedDependencies",
                          isCompoundExpandToggle: true,
                          item: item,
                          rowIndex,
                        })}
                      >
                        {item.purls.size}
                      </Td>
                      <Td
                        modifier="nowrap"
                        {...getTdProps({ columnKey: "updated" })}
                      >
                        {formatDate(item.vulnerability?.modified)}
                      </Td>
                      <Td isActionCell>
                        <ActionsColumn
                          items={[
                            {
                              title: `Ask ${TPA_INTELLIGENCE_ASSISTANT_SHORT_NAME}`,
                              onClick: () => {
                                openAgentWithFocus(
                                  buildSbomVulnerabilityFocus({
                                    sbomId,
                                    sbomName: sbom?.name,
                                    vulnerabilityId:
                                      item.vulnerability.identifier,
                                    vulnerabilityTitle:
                                      item.vulnerability.title,
                                    severity:
                                      item.opinionatedAdvisory.extendedSeverity,
                                    exploitIntelligence:
                                      exploitIntelligenceState,
                                  }),
                                );
                              },
                            },
                            ...(canRequestNewExploitIntelligenceAnalysis(
                              exploitIntelligenceState,
                            )
                              ? [
                                  {
                                    title: "Request new analysis",
                                    onClick: () => {
                                      handleRequestExploitAnalysis(
                                        item.vulnerability.identifier,
                                        { isRerun: true },
                                      );
                                    },
                                  },
                                ]
                              : []),
                          ]}
                        />
                      </Td>
                    </TableRowContentWithControls>
                  </Tr>
                  {isCellExpanded(item) ? (
                    <Tr isExpanded>
                      <Td
                        {...getExpandedContentTdProps({
                          item,
                        })}
                      >
                        <ExpandableRowContent>
                          {isCellExpanded(item, "affectedDependencies") ? (
                            <Table variant="compact">
                              <Thead>
                                <Tr>
                                  <Th>Type</Th>
                                  <Th>Namespace</Th>
                                  <Th>Name</Th>
                                  <Th>Version</Th>
                                  <Th>Remediations</Th>
                                  <Th>Path</Th>
                                  <Th>Qualifiers</Th>
                                </Tr>
                              </Thead>
                              <Tbody>
                                {Array.from(item.purls.values()).map(
                                  (purl, index) => {
                                    if (!purl.isOrphan) {
                                      const decomposedPurl = decomposePurl(
                                        purl.purlSummary.purl,
                                      );
                                      return (
                                        <Tr key={purl.purlSummary.uuid}>
                                          <Td>{decomposedPurl?.type}</Td>
                                          <Td>{decomposedPurl?.namespace}</Td>
                                          <Td>
                                            <Link
                                              to={generatePath(
                                                Paths.packageDetails,
                                                {
                                                  packageId:
                                                    purl.purlSummary.uuid,
                                                },
                                              )}
                                            >
                                              {decomposedPurl?.name}
                                            </Link>
                                          </Td>
                                          <Td>{decomposedPurl?.version}</Td>
                                          <Td>
                                            <AffectedDependencyRemediationCell
                                              remediationPackages={
                                                item.remediationPackages
                                              }
                                              packageId={purl.purlSummary.uuid}
                                              packageName={decomposedPurl?.name}
                                            />
                                          </Td>
                                          <Td>{decomposedPurl?.path}</Td>
                                          <Td>
                                            {decomposedPurl?.qualifiers && (
                                              <PackageQualifiers
                                                value={
                                                  decomposedPurl?.qualifiers
                                                }
                                              />
                                            )}
                                          </Td>
                                        </Tr>
                                      );
                                    }

                                    return (
                                      <Tr
                                        key={`${purl.parentName}-${index}-name`}
                                      >
                                        <Td />
                                        <Td />
                                        <Td>{purl.parentName}</Td>
                                        <Td />
                                        <Td>
                                          <AffectedDependencyRemediationCell
                                            remediationPackages={
                                              item.remediationPackages
                                            }
                                            packageName={purl.parentName}
                                          />
                                        </Td>
                                        <Td />
                                        <Td />
                                      </Tr>
                                    );
                                  },
                                )}
                              </Tbody>
                            </Table>
                          ) : null}
                        </ExpandableRowContent>
                      </Td>
                    </Tr>
                  ) : null}
                </Tbody>
              );
            })}
          </ConditionalTableBody>
        </Table>
        <SimplePagination
          idPrefix="vulnerability-table"
          isTop={false}
          paginationProps={paginationProps}
        />
      </StackItem>
    </Stack>
  );
};
