import { useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import type { HubRequestParams } from "@app/api/models";
import type { PurlAdvisory, PurlDetails } from "@app/client";
import {
  getMockSbomPackages,
  getMockSbomPackagesByNames,
  mockPackageUuidsWithVulnerabilities,
  mockPackages,
  packageNameFromPurl,
} from "@app/mocks/packages";
import { mockCveFixtures } from "@app/mocks/sbom-advisories";
import {
  getMockRemediationCveIdsForPackage,
  getMockRemediationVersionsForPackageCve,
} from "@app/mocks/sbom-remediations";

import { client } from "../axios-config/apiInit";
import { getPurl, listPackages, listPurl } from "../client";
import { requestParamsQuery } from "../hooks/table-controls";

declare const __MOCK_DATA__: boolean;

export const PackagesQueryKey = "packages";

const getMockPackageDetails = (id: string): PurlDetails => {
  const summary =
    mockPackages.find((pkg) => pkg.uuid === id) ?? mockPackages[0];
  const packageName = packageNameFromPurl(summary.purl);
  const cveIds = getMockRemediationCveIdsForPackage(summary.uuid, packageName);

  const advisories: PurlAdvisory[] = cveIds.flatMap((cveId) => {
    const cve = mockCveFixtures.find((fixture) => fixture.identifier === cveId);
    const remediations = getMockRemediationVersionsForPackageCve(
      summary.uuid,
      cveId,
      packageName,
    );
    const fixedVersion = remediations[0]?.version;

    const severity = cve?.severity ?? "medium";
    const score = cve?.score ?? 5.0;
    const title =
      cve?.title ??
      `${packageName}: Lightwell remediation available${
        fixedVersion ? ` (${fixedVersion})` : ""
      }`;
    const description =
      cve?.description ??
      `Prototype vulnerability for ${packageName} with Lightwell remediations.`;
    const rhsa = cve?.rhsa ?? `RHLW-${cveId}`;
    const published = cve?.published ?? "2024-01-01T00:00:00Z";
    const modified = cve?.modified ?? published;

    const advisoryHead = {
      uuid: `adv-pkg-${summary.uuid}-${rhsa}`,
      document_id: rhsa,
      identifier: rhsa,
      title: cve?.rhTitle ?? `Lightwell remediation for ${cveId}`,
      published: cve?.rhPublished ?? published,
      modified,
      labels: { type: "csaf", severity },
      issuer: null,
      withdrawn: null,
    };

    return [
      {
        ...advisoryHead,
        status: [
          {
            advisory: advisoryHead,
            context: null,
            scores: [
              {
                type: "3.1" as const,
                value: score,
                severity,
              },
            ],
            status: "affected",
            vulnerability: {
              identifier: cveId,
              title,
              description,
              cwes: cve?.cwes ?? [],
              discovered: cve?.discovered ?? published,
              modified,
              published,
              reserved: cve?.reserved ?? published,
              released: null,
              withdrawn: null,
              normative: true,
              base_score: {
                score,
                severity,
                type: "3.1" as const,
              },
            },
          },
        ],
      },
    ];
  });

  return {
    uuid: summary.uuid,
    purl: summary.purl,
    base: summary.base,
    version: summary.version,
    licenses: [],
    licenses_ref_mapping: [],
    advisories,
  };
};

export type UseFetchPackagesOptions = {
  disableQuery?: boolean;
  /**
   * When true, request only packages with at least one vulnerability (`has_vulnerabilities`
   * query param). Mock data filters the same way for UX development.
   */
  hasVulnerabilities?: boolean;
};

const normalizeFetchPackagesOptions = (
  opts?: boolean | UseFetchPackagesOptions,
): UseFetchPackagesOptions => {
  if (opts === undefined) {
    return {};
  }
  if (typeof opts === "boolean") {
    return { disableQuery: opts };
  }
  return opts;
};

export const useFetchPackages = (
  params: HubRequestParams = {},
  opts?: boolean | UseFetchPackagesOptions,
) => {
  const { disableQuery = false, hasVulnerabilities = false } =
    normalizeFetchPackagesOptions(opts);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [PackagesQueryKey, params, hasVulnerabilities],
    queryFn: () => {
      const baseQuery = requestParamsQuery(params);
      const query = {
        ...baseQuery,
        ...(hasVulnerabilities ? { has_vulnerabilities: true as const } : {}),
      };

      if (__MOCK_DATA__) {
        let items = [...mockPackages];
        if (hasVulnerabilities) {
          items = items.filter((p) =>
            mockPackageUuidsWithVulnerabilities.has(p.uuid),
          );
        }
        return Promise.resolve({
          data: { items, total: items.length },
        });
      }
      return listPurl({
        client: client,
        query,
      });
    },
    enabled: !disableQuery,
  });

  return {
    result: {
      data: data?.data?.items || [],
      total: data?.data?.total ?? 0,
      params: params,
    },
    isFetching: isLoading,
    fetchError: error as AxiosError | null,
    refetch,
  };
};

export const packageByIdQueryOptions = (id: string) => ({
  queryKey: [PackagesQueryKey, id],
  queryFn: () => {
    if (__MOCK_DATA__) {
      return Promise.resolve({ data: getMockPackageDetails(id) });
    }
    return getPurl({ client, path: { key: id } });
  },
});

export const useFetchPackageById = (id: string) => {
  const { data, isLoading, error } = useQuery(packageByIdQueryOptions(id));

  return {
    pkg: data?.data,
    isFetching: isLoading,
    fetchError: error as AxiosError | null,
  };
};

export const useFetchPackagesBySbomId = (
  sbomId: string,
  params: HubRequestParams = {},
) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [PackagesQueryKey, "by-sbom", sbomId, params],
    queryFn: () => {
      if (__MOCK_DATA__) {
        const nameFilter = params.filters?.find(
          (filter) => filter.field === "name",
        );
        let packageNames: string[] = [];
        if (nameFilter) {
          if (
            typeof nameFilter.value === "object" &&
            Array.isArray(nameFilter.value.list)
          ) {
            packageNames = nameFilter.value.list.map(String);
          } else if (
            nameFilter.value !== undefined &&
            nameFilter.value !== null
          ) {
            packageNames = [String(nameFilter.value)];
          }
        }

        const items =
          packageNames.length > 0
            ? getMockSbomPackagesByNames(sbomId, packageNames)
            : getMockSbomPackages(sbomId);

        return Promise.resolve({
          data: { items, total: items.length },
        });
      }
      return listPackages({
        client,
        path: { id: sbomId },
        query: { ...requestParamsQuery(params) },
      });
    },
  });

  return {
    result: {
      data: data?.data?.items || [],
      total: data?.data?.total ?? 0,
      params,
    },
    isFetching: isLoading,
    fetchError: error as AxiosError | null,
    refetch,
  };
};
