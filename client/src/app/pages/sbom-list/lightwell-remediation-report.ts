import { getMockSbomPackages } from "@app/mocks/packages";
import {
  getMockRemediationCveIdsForPackage,
  getMockRemediationsForPackage,
  getMockRemediationVersionsForPackage,
} from "@app/mocks/sbom-remediations";
import { mockSboms } from "@app/mocks/sboms";

export type LightwellReportApplication = {
  id: string;
  name: string;
  addressablePackageCount: number;
  /** Unique CVEs addressed by Lightwell remediations in this SBOM. */
  vulnerabilityCount: number;
};

export type LightwellReportPackage = {
  packageId: string;
  packageName: string;
  version?: string;
  /** Recommended fixed versions from Lightwell remediations. */
  recommendedVersions: string[];
  /** CVEs addressed by those remediations for this package. */
  vulnerabilityIds: string[];
  applicationNames: string[];
};

export type LightwellRemediationReport = {
  selectedApplicationCount: number;
  addressableApplicationCount: number;
  addressablePackageCount: number;
  applications: LightwellReportApplication[];
  packages: LightwellReportPackage[];
};

export type LightwellRemediationSelectedSbom = {
  id: string;
  name: string;
};

export type LightwellRemediationReportLocationState = {
  selectedSboms: LightwellRemediationSelectedSbom[];
  /** Open a finished report from the ready notification (skip loading). */
  fromNotification?: boolean;
};

const REPORT_SELECTION_STORAGE_KEY = "remediation-report-selected-sboms";

/** Persist selection so refresh / HMR does not wipe the prototype report. */
export const persistLightwellReportSelection = (
  selectedSboms: LightwellRemediationSelectedSbom[],
) => {
  try {
    sessionStorage.setItem(
      REPORT_SELECTION_STORAGE_KEY,
      JSON.stringify(selectedSboms),
    );
  } catch {
    // Ignore quota / private-mode failures in the prototype.
  }
};

export const readPersistedLightwellReportSelection = ():
  | LightwellRemediationSelectedSbom[]
  | null => {
  try {
    const raw = sessionStorage.getItem(REPORT_SELECTION_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return null;
    }
    return parsed.filter(
      (item): item is LightwellRemediationSelectedSbom =>
        !!item &&
        typeof item === "object" &&
        typeof (item as LightwellRemediationSelectedSbom).id === "string" &&
        typeof (item as LightwellRemediationSelectedSbom).name === "string",
    );
  } catch {
    return null;
  }
};

/**
 * Prototype-only seed when the report URL is opened with no selection
 * (direct link, refresh after lost state). Includes the spring-boot demo SBOM.
 */
export const getDemoLightwellReportSelection =
  (): LightwellRemediationSelectedSbom[] => {
    const preferredIds = new Set([
      "a1b2c3d4-0008-4000-8000-000000000008", // spring-boot
      "a1b2c3d4-0001-4000-8000-000000000001", // RHEL
      "a1b2c3d4-0002-4000-8000-000000000002", // OpenShift
    ]);
    const preferred = mockSboms
      .filter((sbom) => preferredIds.has(sbom.id))
      .map((sbom) => ({ id: sbom.id, name: sbom.name }));
    if (preferred.length > 0) {
      return preferred;
    }
    return mockSboms
      .slice(0, 3)
      .map((sbom) => ({ id: sbom.id, name: sbom.name }));
  };

/**
 * If generation finishes within this window, navigate to the report page and
 * show a loading empty state. Longer jobs stay on the current page and use the
 * ready notification instead.
 */
export const LIGHTWELL_REPORT_NAVIGATE_THRESHOLD_MS = 10_000;

/**
 * Prototype delay for demo scenarios:
 * - 1–3 SBOMs: short wait on the report page (immediate-load path)
 * - 4–9 SBOMs: longer loading on the report page, still under the navigate threshold
 * - 10+ SBOMs: stay on SBOMs and surface the ready notification
 */
export const getLightwellReportGenerationDelayMs = (sbomCount: number) => {
  if (sbomCount <= 3) {
    return 1_200;
  }
  if (sbomCount >= 10) {
    return 12_000;
  }
  // 4–9: ramp toward the navigate threshold without crossing it
  const steps = sbomCount - 3;
  return Math.round(1_200 + steps * 1_400);
};

const packageHasLightwellRemediation = (
  packageId: string,
  packageName: string,
): boolean =>
  getMockRemediationVersionsForPackage(packageId, packageName).length > 0 ||
  getMockRemediationsForPackage(packageId, packageName).length > 0;

/**
 * Report UI mirrors eng: usually one recommended version pill per package.
 * Prefer a Lightwell backport (`.rhlw-####`) when several fixed versions exist.
 */
const getRecommendedVersionsForPackage = (
  packageId: string,
  packageName: string,
): string[] => {
  const fromCves = [
    ...new Set(
      getMockRemediationsForPackage(packageId, packageName)
        .map((item) => item.remediation.fixedInVersion)
        .filter((version): version is string => Boolean(version)),
    ),
  ];

  const candidates =
    fromCves.length > 0
      ? fromCves
      : getMockRemediationVersionsForPackage(packageId, packageName).map(
          (option) => option.version,
        );

  if (candidates.length === 0) {
    return [];
  }

  const backport = candidates.find((version) =>
    /\.rhlw-\d+/i.test(version),
  );
  return [backport ?? candidates[0]];
};

/**
 * Build a remediation report for one or more selected SBOMs.
 */
export const buildLightwellRemediationReport = (
  selectedSboms: LightwellRemediationSelectedSbom[],
): LightwellRemediationReport => {
  const applications: LightwellReportApplication[] = [];
  const packagesById = new Map<string, LightwellReportPackage>();

  for (const sbom of selectedSboms) {
    const name =
      sbom.name ||
      mockSboms.find((item) => item.id === sbom.id)?.name ||
      sbom.id;
    const packages = getMockSbomPackages(sbom.id);
    const addressable = packages.filter((pkg) => {
      const packageId = pkg.purl[0]?.uuid ?? pkg.id;
      return packageHasLightwellRemediation(packageId, pkg.name);
    });

    const vulnerabilityIdsForSbom = new Set<string>();
    for (const pkg of addressable) {
      const packageId = pkg.purl[0]?.uuid ?? pkg.id;
      for (const cveId of getMockRemediationCveIdsForPackage(
        packageId,
        pkg.name,
      )) {
        vulnerabilityIdsForSbom.add(cveId);
      }
    }

    if (addressable.length > 0) {
      applications.push({
        id: sbom.id,
        name,
        addressablePackageCount: addressable.length,
        vulnerabilityCount: vulnerabilityIdsForSbom.size,
      });
    }

    for (const pkg of addressable) {
      const packageId = pkg.purl[0]?.uuid ?? pkg.id;
      const vulnerabilityIds = getMockRemediationCveIdsForPackage(
        packageId,
        pkg.name,
      );
      const recommendedVersions = getRecommendedVersionsForPackage(
        packageId,
        pkg.name,
      );
      const existing = packagesById.get(packageId);
      if (existing) {
        if (!existing.applicationNames.includes(name)) {
          existing.applicationNames.push(name);
        }
        for (const cveId of vulnerabilityIds) {
          if (!existing.vulnerabilityIds.includes(cveId)) {
            existing.vulnerabilityIds.push(cveId);
          }
        }
        for (const version of recommendedVersions) {
          if (!existing.recommendedVersions.includes(version)) {
            existing.recommendedVersions.push(version);
          }
        }
        continue;
      }
      packagesById.set(packageId, {
        packageId,
        packageName: pkg.name,
        version: pkg.version ?? undefined,
        recommendedVersions,
        vulnerabilityIds,
        applicationNames: [name],
      });
    }
  }

  const packages = [...packagesById.values()].sort((a, b) =>
    a.packageName.localeCompare(b.packageName),
  );

  return {
    selectedApplicationCount: selectedSboms.length,
    addressableApplicationCount: applications.length,
    addressablePackageCount: packages.length,
    applications: applications.sort((a, b) => a.name.localeCompare(b.name)),
    packages,
  };
};
