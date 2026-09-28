import React from "react";
import { generatePath, Link } from "react-router-dom";

import dayjs from "dayjs";

import { Toolbar, ToolbarContent, ToolbarItem } from "@patternfly/react-core";
import {
  Table,
  TableText,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@patternfly/react-table";

import { extendedSeverityFromSeverity } from "@app/api/models";
import { SeverityShieldAndText } from "@app/components/SeverityShieldAndText";
import { SimplePagination } from "@app/components/SimplePagination";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import { TdWithFocusStatus } from "@app/components/TdWithFocusStatus";
import { VulnerabilityDescription } from "@app/components/VulnerabilityDescription";
import { useVulnerabilitiesOfPackageId } from "@app/hooks/domain-controls/useVulnerabilitiesOfPackage";
import { useLocalTableControls } from "@app/hooks/table-controls";
import { packageNameFromPurl } from "@app/mocks/packages";
import { useFetchPackageById } from "@app/queries/packages";
import { Paths } from "@app/Routes";
import { useWithUiId } from "@app/utils/query-utils";
import { formatDate } from "@app/utils/utils";

import { PackageCveRemediationCell } from "../package-list/components/PackageCveRemediationCell";

interface VulnerabilitiesByPackageProps {
  packageId: string;
}

export const VulnerabilitiesByPackage: React.FC<
  VulnerabilitiesByPackageProps
> = ({ packageId }) => {
  const { pkg } = useFetchPackageById(packageId);
  const packageName = pkg?.purl ? packageNameFromPurl(pkg.purl) : undefined;

  const {
    data: { vulnerabilities },
    isFetching: isFetchingVulnerabilities,
    fetchError: fetchErrorVulnerabilities,
  } = useVulnerabilitiesOfPackageId(packageId);

  const affectedVulnerabilities = React.useMemo(() => {
    return vulnerabilities.filter(
      (item) => item.vulnerabilityStatus === "affected",
    );
  }, [vulnerabilities]);

  const tableDataWithUiId = useWithUiId(
    affectedVulnerabilities,
    (d) => `${d.vulnerability.identifier}-${d.vulnerabilityStatus}`,
  );

  const tableControls = useLocalTableControls({
    tableName: "vulnerability-table",
    idProperty: "_ui_unique_id",
    items: tableDataWithUiId,
    isLoading: isFetchingVulnerabilities,
    columnNames: {
      identifier: "ID",
      description: "Description",
      severity: "CVSS",
      remediations: "Remediations",
      published: "Date published",
    },
    hasActionsColumn: false,
    isSortEnabled: true,
    sortableColumns: ["identifier", "severity", "published"],
    getSortValues: (item) => {
      return {
        identifier: item.vulnerability.identifier,
        severity: item.vulnerability?.base_score?.score || 0,
        published: item.vulnerability?.published
          ? dayjs(item.vulnerability?.published).valueOf()
          : 0,
      };
    },
    isPaginationEnabled: true,
    isFilterEnabled: false,
    filterCategories: [],
    isExpansionEnabled: false,
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
    },
    expansionDerivedState: { isCellExpanded },
  } = tableControls;

  return (
    <>
      <Toolbar {...toolbarProps} aria-label="vulnerability toolbar">
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

      <Table {...tableProps} aria-label="vulnerability table">
        <Thead>
          <Tr>
            <TableHeaderContentWithControls {...tableControls}>
              <Th {...getThProps({ columnKey: "identifier" })} />
              <Th {...getThProps({ columnKey: "description" })} />
              <Th {...getThProps({ columnKey: "severity" })} />
              <Th
                modifier="fitContent"
                {...getThProps({ columnKey: "remediations" })}
                info={{
                  tooltip:
                    "Remediations that apply to this package for this vulnerability.",
                }}
              />
              <Th {...getThProps({ columnKey: "published" })} />
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
            return (
              <Tbody key={item._ui_unique_id} isExpanded={isCellExpanded(item)}>
                <Tr {...getTrProps({ item })}>
                  <TableRowContentWithControls
                    {...tableControls}
                    item={item}
                    rowIndex={rowIndex}
                  >
                    <Td
                      width={15}
                      modifier="breakWord"
                      {...getTdProps({ columnKey: "identifier" })}
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
                          width={45}
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
                    <Td width={15} {...getTdProps({ columnKey: "severity" })}>
                      {item.vulnerability?.base_score && (
                        <SeverityShieldAndText
                          value={extendedSeverityFromSeverity(
                            item.vulnerability.base_score.severity,
                          )}
                          score={item.vulnerability.base_score.score}
                          showLabel
                          showScore
                        />
                      )}
                    </Td>
                    <Td
                      modifier="nowrap"
                      {...getTdProps({ columnKey: "remediations" })}
                    >
                      <PackageCveRemediationCell
                        packageId={packageId}
                        packageName={packageName}
                        vulnerabilityId={item.vulnerability.identifier}
                      />
                    </Td>
                    <Td
                      width={10}
                      modifier="truncate"
                      {...getTdProps({ columnKey: "published" })}
                    >
                      {formatDate(item.vulnerability?.published)}
                    </Td>
                  </TableRowContentWithControls>
                </Tr>
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
    </>
  );
};
