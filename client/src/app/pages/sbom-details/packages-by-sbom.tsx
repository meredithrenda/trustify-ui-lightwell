import React from "react";
import { generatePath, Link } from "react-router-dom";

import {
  List,
  ListItem,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import {
  ExpandableRowContent,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@patternfly/react-table";

import type { LicenseRefMapping } from "@app/client";
import { FilterToolbar, FilterType } from "@app/components/FilterToolbar";
import { SimplePagination } from "@app/components/SimplePagination";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import { VulnerabilityGallery } from "@app/components/VulnerabilityGallery";
import { WithPackage } from "@app/components/WithPackage";
import { FILTER_TEXT_CATEGORY_KEY } from "@app/Constants";
import {
  getHubRequestParams,
  useTableControlProps,
  useTableControlState,
} from "@app/hooks/table-controls";
import {
  mockPackages,
  packageNameFromPurl,
} from "@app/mocks/packages";
import { useFetchPackagesBySbomId } from "@app/queries/packages";
import { useFetchSbomsLicenseIds } from "@app/queries/sboms";
import { Paths } from "@app/Routes";

import { PackageVulnerabilities } from "../package-list/components/PackageVulnerabilities";
import { PackageRemediationCountCell } from "../package-list/components/PackageRemediationCountCell";

import { SBOM_PACKAGES_TABLE_PREFIX } from "./helpers";

const packageNameOptions = [
  ...new Map(
    mockPackages.map((pkg) => {
      const name = packageNameFromPurl(pkg.purl);
      return [name, { value: name, label: name }] as const;
    }),
  ).values(),
];

const renderLicenseWithMappings = (
  license: string,
  mappings: LicenseRefMapping[],
) => {
  return mappings.reduce((prev, { license_id, license_name }) => {
    return prev.replaceAll(license_id, license_name);
  }, `${license}`);
};

interface PackagesProps {
  sbomId: string;
}

export const PackagesBySbom: React.FC<PackagesProps> = ({ sbomId }) => {
  const { licenseIds } = useFetchSbomsLicenseIds(sbomId);

  const tableControlState = useTableControlState({
    tableName: "package-table",
    persistenceKeyPrefix: SBOM_PACKAGES_TABLE_PREFIX,
    persistTo: "urlParams",
    columnNames: {
      name: "Name",
      version: "Version",
      vulnerabilities: "Vulnerabilities",
      licenses: "Licenses",
      remediations: "Remediations",
      purls: "PURLs",
      cpes: "CPEs",
    },
    isSortEnabled: true,
    sortableColumns: ["name"],
    isPaginationEnabled: true,
    isFilterEnabled: true,
    filterCategories: [
      {
        categoryKey: FILTER_TEXT_CATEGORY_KEY,
        title: "Filter text",
        placeholderText: "Search",
        type: FilterType.search,
      },
      {
        categoryKey: "name",
        title: "Package",
        placeholderText: "Filter by package name",
        type: FilterType.multiselect,
        logicOperator: "OR",
        selectOptions: packageNameOptions,
      },
      {
        categoryKey: "license",
        title: "License",
        placeholderText: "Filter results by license",
        type: FilterType.multiselect,
        operator: "=",
        logicOperator: "OR",
        selectOptions: licenseIds.map((license) => ({
          value: license.license_id,
          label: license.license_name.toUpperCase(),
        })),
      },
    ],
    isExpansionEnabled: true,
    expandableVariant: "compound",
  });

  const {
    result: { data: packages, total: totalItemCount },
    isFetching,
    fetchError,
  } = useFetchPackagesBySbomId(sbomId, {
    ...getHubRequestParams({
      ...tableControlState,
      hubSortFieldKeys: {
        name: "name",
      },
    }),
    total: true,
  });

  const tableControls = useTableControlProps({
    ...tableControlState,
    idProperty: "id",
    currentPageItems: packages,
    totalItemCount,
    isLoading: isFetching,
  });

  const {
    currentPageItems,
    numRenderedColumns,
    propHelpers: {
      toolbarProps,
      filterToolbarProps,
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
    <>
      <Toolbar {...toolbarProps} aria-label="Package toolbar">
        <ToolbarContent>
          <FilterToolbar {...filterToolbarProps} />
          <ToolbarItem {...paginationToolbarItemProps}>
            <SimplePagination
              idPrefix="package-table"
              isTop
              paginationProps={paginationProps}
            />
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>

      <Table {...tableProps} aria-label="Package table">
        <Thead>
          <Tr>
            <TableHeaderContentWithControls {...tableControls}>
              <Th {...getThProps({ columnKey: "name" })} />
              <Th {...getThProps({ columnKey: "version" })} />
              <Th {...getThProps({ columnKey: "vulnerabilities" })} />
              <Th
                modifier="fitContent"
                {...getThProps({ columnKey: "licenses" })}
              />
              <Th
                modifier="fitContent"
                {...getThProps({ columnKey: "remediations" })}
                info={{
                  tooltip:
                    "Number of remediations available for this package. Open the package and use the Vulnerabilities tab to see remediations per CVE.",
                }}
              />
              <Th {...getThProps({ columnKey: "purls" })} />
              <Th
                modifier="fitContent"
                {...getThProps({ columnKey: "cpes" })}
              />
            </TableHeaderContentWithControls>
          </Tr>
        </Thead>
        <ConditionalTableBody
          isLoading={isFetching}
          isError={!!fetchError}
          isNoData={currentPageItems.length === 0}
          numRenderedColumns={numRenderedColumns}
        >
          {currentPageItems?.map((item, rowIndex) => {
            const packageId = item.purl[0]?.uuid ?? item.id;

            return (
              <Tbody key={item.id} isExpanded={isCellExpanded(item)}>
                <Tr {...getTrProps({ item })}>
                  <TableRowContentWithControls
                    {...tableControls}
                    item={item}
                    rowIndex={rowIndex}
                  >
                    <Td width={15} {...getTdProps({ columnKey: "name" })}>
                      {[item.name, item.group].filter(Boolean).join("/")}
                    </Td>
                    <Td
                      width={10}
                      modifier="truncate"
                      {...getTdProps({ columnKey: "version" })}
                    >
                      {item?.version}
                    </Td>
                    <Td
                      width={10}
                      modifier="breakWord"
                      {...getTdProps({ columnKey: "vulnerabilities" })}
                    >
                      {item.purl[0] ? (
                        <WithPackage packageId={item.purl[0].uuid}>
                          {(pkg, isFetching, fetchError) => (
                            <PackageVulnerabilities
                              pkg={pkg}
                              isFetching={isFetching}
                              fetchError={fetchError}
                            />
                          )}
                        </WithPackage>
                      ) : (
                        <VulnerabilityGallery
                          severities={{
                            critical: 0,
                            high: 0,
                            medium: 0,
                            low: 0,
                            none: 0,
                            unknown: 0,
                          }}
                        />
                      )}
                    </Td>
                    <Td
                      width={10}
                      modifier="breakWord"
                      {...getTdProps({
                        columnKey: "licenses",
                        isCompoundExpandToggle: item.licenses.length > 0,
                        item: item,
                        rowIndex,
                      })}
                    >
                      {item.licenses.length} Licenses
                    </Td>
                    <Td
                      modifier="nowrap"
                      {...getTdProps({ columnKey: "remediations" })}
                    >
                      <PackageRemediationCountCell packageId={packageId} />
                    </Td>
                    <Td
                      width={20}
                      modifier="breakWord"
                      {...getTdProps({
                        columnKey: "purls",
                        isCompoundExpandToggle: item.purl.length > 1,
                        item: item,
                        rowIndex,
                      })}
                    >
                      {item.purl.length === 1 ? (
                        <Link
                          to={generatePath(Paths.packageDetails, {
                            packageId: item.purl[0].uuid,
                          })}
                        >
                          {item.purl[0].purl}
                        </Link>
                      ) : (
                        `${item.purl.length} PURLs`
                      )}
                    </Td>
                    <Td
                      width={10}
                      modifier="breakWord"
                      {...getTdProps({
                        columnKey: "cpes",
                        isCompoundExpandToggle: item.cpe.length > 0,
                        item,
                        rowIndex,
                      })}
                    >
                      {item.cpe.length} CPEs
                    </Td>
                  </TableRowContentWithControls>
                </Tr>
                {isCellExpanded(item) ? (
                  <Tr isExpanded>
                    <Td
                      {...getExpandedContentTdProps({
                        item,
                      })}
                      className={spacing.pLg}
                    >
                      <ExpandableRowContent>
                        <div className={spacing.ptLg}>
                          {isCellExpanded(item, "licenses") ? (
                            <List isPlain>
                              {item.licenses.map((e) => (
                                <ListItem
                                  key={`${e.license_name}-${e.license_type}`}
                                >
                                  {renderLicenseWithMappings(
                                    e.license_name,
                                    item.licenses_ref_mapping,
                                  )}
                                </ListItem>
                              ))}
                            </List>
                          ) : null}
                          {isCellExpanded(item, "purls") ? (
                            <List isPlain>
                              {item.purl.map((e) => {
                                return (
                                  <ListItem key={e.uuid}>
                                    <Link
                                      to={generatePath(Paths.packageDetails, {
                                        packageId: e.uuid,
                                      })}
                                    >
                                      {e.purl}
                                    </Link>
                                  </ListItem>
                                );
                              })}
                            </List>
                          ) : null}
                          {isCellExpanded(item, "cpes") ? (
                            <List isPlain>
                              {item.cpe.map((e) => (
                                <ListItem key={e}>{e}</ListItem>
                              ))}
                            </List>
                          ) : null}
                        </div>
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
        idPrefix="package-table"
        isTop={false}
        paginationProps={paginationProps}
      />
    </>
  );
};
