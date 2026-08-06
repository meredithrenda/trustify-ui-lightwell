import { getMockSbomPackages } from "@app/mocks/packages";
import { getMockRemediationVersionsForPackage } from "@app/mocks/sbom-remediations";
import { mockSboms } from "@app/mocks/sboms";

export type LightwellReportApplication = {
  id: string;
  name: string;
  addressablePackageCount: number;
};

export type LightwellReportPackage = {
  packageId: string;
  packageName: string;
  version?: string;
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
  getMockRemediationVersionsForPackage(packageId, packageName).length > 0;

/**
 * Build a Lightwell remediation report for one or more selected SBOMs.
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

    if (addressable.length > 0) {
      applications.push({
        id: sbom.id,
        name,
        addressablePackageCount: addressable.length,
      });
    }

    for (const pkg of addressable) {
      const packageId = pkg.purl[0]?.uuid ?? pkg.id;
      const existing = packagesById.get(packageId);
      if (existing) {
        if (!existing.applicationNames.includes(name)) {
          existing.applicationNames.push(name);
        }
        continue;
      }
      packagesById.set(packageId, {
        packageId,
        packageName: pkg.name,
        version: pkg.version ?? undefined,
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
