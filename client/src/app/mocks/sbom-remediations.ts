/**
 * Prototype Lightwell remediations.
 *
 * Accurate attribution is 1 package × 1 CVE:
 * - Package / SBOM package lists show remediation **counts** only
 * - Package details → Vulnerabilities shows version remediations per CVE
 * - SBOM Vulnerabilities shows a count on the CVE row; expand Affected
 *   dependencies to see remediations per package for that CVE
 */

export type LightwellRemediationKind = "remediation" | "recommendation";

/** How a remediation addresses the CVE. */
export type LightwellFixShape = "backport" | "upgrade";

/** Full remediation payload for expand panel content. */
export interface LightwellRemediation {
  id: string;
  kind: LightwellRemediationKind;
  fixShape?: LightwellFixShape;
  fixedInVersion?: string;
  details: string;
  advisoryId?: string;
  /** CVE this remediation addresses. */
  vulnerabilityId: string;
}

/** A package that carries remediations for a given CVE (list-level summary). */
export interface LightwellRemediationPackage {
  packageId: string;
  packageName: string;
  remediations: LightwellRemediation[];
}

/** Flat remediation row for compound-expand panels. */
export interface LightwellRemediationExpandItem {
  packageId: string;
  packageName: string;
  remediation: LightwellRemediation;
}

export const formatFixShapeLabel = (
  fixShape?: LightwellFixShape,
): string | undefined => {
  if (fixShape === "backport") {
    return "Lightwell backport";
  }
  if (fixShape === "upgrade") {
    return "Version upgrade";
  }
  return undefined;
};

/** True when a remediation version uses the Lightwell `.rhlw-####` build suffix. */
export const isLightwellBackportVersion = (version: string): boolean =>
  /\.rhlw-\d+/i.test(version);

export type RemediationVersionOption = {
  /** Fixed / recommended package version string as shown in live TPA. */
  version: string;
};

/**
 * Live-style remediation options for package rows.
 * `.rhlw-####` = Lightwell backport; other versions = upgrades.
 * Seeded to mirror real TPA variety: backport-only, upgrade-only, both, and dense lists.
 */
export const MOCK_REMEDIATION_VERSIONS_BY_PACKAGE: Record<
  string,
  RemediationVersionOption[]
> = {
  // Backport only
  "pkg-001": [{ version: "3.0.7-27.el9.rhlw-00001" }],
  // Upgrade only
  "pkg-007": [{ version: "2.17.1" }, { version: "2.18.0" }],
  // Both (Lightwell spring-boot demo)
  "pkg-012": [
    { version: "2.7.18.rhlw-00004" },
    { version: "3.5.14" },
    { version: "4.0.6" },
    { version: "3.3.11" },
    { version: "3.4.5" },
    { version: "2.2.11.RELEASE" },
  ],
  "spring-boot": [
    { version: "2.7.18.rhlw-00004" },
    { version: "3.5.14" },
    { version: "4.0.6" },
    { version: "3.3.11" },
    { version: "3.4.5" },
    { version: "2.2.11.RELEASE" },
  ],
  // Dense upgrade list (real TPA can hit 60+; keep mock large enough to stress the cell)
  "pkg-002": [
    { version: "5.14.0-284.el9.rhlw-00003" },
    ...Array.from({ length: 48 }, (_, index) => ({
      version: `5.14.0-${280 + index}.el9_${1 + (index % 5)}`,
    })),
  ],
  kernel: [
    { version: "5.14.0-284.el9.rhlw-00003" },
    ...Array.from({ length: 48 }, (_, index) => ({
      version: `5.14.0-${280 + index}.el9_${1 + (index % 5)}`,
    })),
  ],
};

export const getMockRemediationVersionsForPackage = (
  packageId: string,
  packageName?: string,
): RemediationVersionOption[] => {
  if (MOCK_REMEDIATION_VERSIONS_BY_PACKAGE[packageId]) {
    return MOCK_REMEDIATION_VERSIONS_BY_PACKAGE[packageId];
  }
  if (packageName && MOCK_REMEDIATION_VERSIONS_BY_PACKAGE[packageName]) {
    return MOCK_REMEDIATION_VERSIONS_BY_PACKAGE[packageName];
  }
  return [];
};

/**
 * Remediations for one package under one CVE (accurate 1×1 context).
 * Prefer this over package-level version lists on list pages.
 */
export const getMockRemediationVersionsForPackageCve = (
  packageId: string,
  vulnerabilityId: string,
  packageName?: string,
): RemediationVersionOption[] => {
  const packagesForCve =
    MOCK_REMEDIATION_PACKAGES_BY_CVE[vulnerabilityId] ?? [];

  const matchingPackage = packagesForCve.find(
    (pkg) =>
      pkg.packageId === packageId ||
      (!!packageName && pkg.packageName === packageName),
  );

  if (!matchingPackage) {
    return [];
  }

  return matchingPackage.remediations
    .filter((item) => item.kind === "remediation" && item.fixedInVersion)
    .map((item) => ({ version: item.fixedInVersion! }));
};

/** CVE identifiers that have Lightwell remediations for this package. */
export const getMockRemediationCveIdsForPackage = (
  packageId: string,
  packageName?: string,
): string[] => {
  const cveIds: string[] = [];

  for (const [cveId, packages] of Object.entries(
    MOCK_REMEDIATION_PACKAGES_BY_CVE,
  )) {
    const hasRemediation = packages.some(
      (pkg) =>
        (pkg.packageId === packageId ||
          (!!packageName && pkg.packageName === packageName)) &&
        pkg.remediations.some((item) => item.kind === "remediation"),
    );
    if (hasRemediation) {
      cveIds.push(cveId);
    }
  }

  return cveIds;
};

/** Fix shapes present for a package based on remediation version pills. */
export const getPackageRemediationFixShapes = (
  packageId: string,
  packageName?: string,
): LightwellFixShape[] => {
  const versions = getMockRemediationVersionsForPackage(packageId, packageName);
  if (versions.length === 0) {
    return [];
  }

  const shapes: LightwellFixShape[] = [];
  if (versions.some((option) => isLightwellBackportVersion(option.version))) {
    shapes.push("backport");
  }
  if (versions.some((option) => !isLightwellBackportVersion(option.version))) {
    shapes.push("upgrade");
  }
  return shapes;
};

/**
 * Multiselect OR matcher: package matches if it has any selected fix shape.
 * Packages with no remediations never match.
 */
export const packageMatchesLightwellRemediationFilter = (
  packageId: string,
  packageName: string | undefined,
  selectedShapes: string[],
): boolean => {
  if (selectedShapes.length === 0) {
    return true;
  }
  const shapes = getPackageRemediationFixShapes(packageId, packageName);
  return selectedShapes.some((selected) =>
    shapes.includes(selected as LightwellFixShape),
  );
};

export const flattenRemediationPackages = (
  packages: LightwellRemediationPackage[],
): LightwellRemediationExpandItem[] =>
  packages.flatMap((pkg) =>
    pkg.remediations
      .filter((item) => item.kind === "remediation")
      .map((remediation) => ({
        packageId: pkg.packageId,
        packageName: pkg.packageName,
        remediation,
      })),
  );

export const formatRemediationCountLabel = (count: number): string => {
  if (count === 0) {
    return "None";
  }
  return `${count} Remediation${count === 1 ? "" : "s"}`;
};

export const formatRecommendationCountLabel = (count: number): string => {
  if (count === 0) {
    return "0 Recommendations";
  }
  return `${count} Recommendation${count === 1 ? "" : "s"}`;
};

export const formatPackageRemediationCountLabel = (count: number): string => {
  if (count === 0) {
    return "0 Remediations";
  }
  return `${count} Remediation${count === 1 ? "" : "s"}`;
};

export const countRemediations = (
  packages: LightwellRemediationPackage[],
): number =>
  packages.reduce(
    (sum, pkg) =>
      sum +
      pkg.remediations.filter((item) => item.kind === "remediation").length,
    0,
  );

/**
 * Extra Red Hat recommendations keyed by package UUID (not Lightwell fixes).
 * Used by the packages list column.
 */
export const MOCK_RH_RECOMMENDATION_COUNT_BY_PACKAGE: Record<string, number> = {
  "pkg-001": 1,
  "pkg-002": 0,
  "pkg-003": 0,
  "pkg-004": 1,
  "pkg-005": 1,
  "pkg-006": 0,
  "pkg-007": 1,
  "pkg-008": 1,
  "pkg-009": 0,
  "pkg-010": 1,
};

/** Aggregate package-list counts for Red Hat recommendations and Lightwell remediations. */
export const getMockPackageGuidanceCounts = (
  packageId: string,
): { recommendations: number; remediations: number } => {
  let remediations = 0;

  for (const packages of Object.values(MOCK_REMEDIATION_PACKAGES_BY_CVE)) {
    for (const pkg of packages) {
      if (pkg.packageId !== packageId) {
        continue;
      }
      remediations += pkg.remediations.filter(
        (item) => item.kind === "remediation",
      ).length;
    }
  }

  return {
    recommendations: MOCK_RH_RECOMMENDATION_COUNT_BY_PACKAGE[packageId] ?? 0,
    remediations,
  };
};

/**
 * Packages with remediations for each CVE. Aligned with the prototype SBOM
 * exploit-intelligence CVE set and mock package UUIDs.
 */
export const MOCK_REMEDIATION_PACKAGES_BY_CVE: Record<
  string,
  LightwellRemediationPackage[]
> = {
  "CVE-2024-9680": [
    {
      packageId: "pkg-011",
      packageName: "firefox",
      remediations: [
        {
          id: "rem-2024-9680-1",
          kind: "remediation",
          fixShape: "backport",
          fixedInVersion: "115.16.0-2.el9_4",
          vulnerabilityId: "CVE-2024-9680",
          details:
            "Red Hat has backported the memory-safety fixes into the supported stream without requiring a major version upgrade.",
          advisoryId: "RHSA-2024:7848",
        },
      ],
    },
  ],
  "CVE-2024-12747": [
    {
      packageId: "pkg-001",
      packageName: "openssl",
      remediations: [
        {
          id: "rem-2024-12747-1",
          kind: "remediation",
          fixShape: "backport",
          fixedInVersion: "3.0.7-27.el9.rhlw-00001",
          vulnerabilityId: "CVE-2024-12747",
          details:
            "Lightwell backport applied in the 3.0.7 stream without requiring a major upgrade.",
          advisoryId: "RHSA-2024:9001",
        },
      ],
    },
    {
      packageId: "pkg-007",
      packageName: "jackson-databind",
      remediations: [
        {
          id: "rem-2024-12747-2",
          kind: "remediation",
          fixShape: "upgrade",
          fixedInVersion: "2.17.1",
          vulnerabilityId: "CVE-2024-12747",
          details:
            "Upgrade jackson-databind to the fixed version that includes the security patch.",
          advisoryId: "RHSA-2024:9002",
        },
        {
          id: "rec-2024-12747-1",
          kind: "recommendation",
          vulnerabilityId: "CVE-2024-12747",
          details:
            "If an immediate upgrade is not possible, restrict untrusted deserialization until the fixed package is applied.",
          advisoryId: "RHSA-2024:9002",
        },
      ],
    },
  ],
  "CVE-2024-6119": [
    {
      packageId: "pkg-001",
      packageName: "openssl",
      remediations: [
        {
          id: "rec-2024-6119-1",
          kind: "recommendation",
          vulnerabilityId: "CVE-2024-6119",
          details:
            "Monitor for a Red Hat remediation. Until then, avoid exposing services that rely on X.509 name constraint checks to untrusted input.",
        },
      ],
    },
  ],
  "CVE-2024-47176": [
    {
      packageId: "pkg-008",
      packageName: "httpd",
      remediations: [
        {
          id: "rem-2024-47176-1",
          kind: "remediation",
          fixShape: "upgrade",
          fixedInVersion: "2.4.59-1.el9",
          vulnerabilityId: "CVE-2024-47176",
          details:
            "Upgrade httpd to the fixed version that includes the security patch.",
          advisoryId: "RHSA-2024:8500",
        },
      ],
    },
  ],
  "CVE-2024-21626": [],
  "CVE-2023-44487": [
    {
      packageId: "pkg-003",
      packageName: "@angular/core",
      remediations: [
        {
          id: "rem-2023-44487-1",
          kind: "remediation",
          fixShape: "backport",
          fixedInVersion: "17.3.1",
          vulnerabilityId: "CVE-2023-44487",
          details:
            "Red Hat backported the HTTP/2 rapid reset mitigation into the supported package stream.",
          advisoryId: "RHSA-2023:5838",
        },
      ],
    },
  ],
  "CVE-2024-0232": [],
  "CVE-2024-38816": [
    {
      packageId: "pkg-012",
      packageName: "spring-boot",
      remediations: [
        {
          id: "rem-2024-38816-1",
          kind: "remediation",
          fixShape: "backport",
          fixedInVersion: "2.7.18.rhlw-00004",
          vulnerabilityId: "CVE-2024-38816",
          details:
            "Lightwell backport (2.7.18.rhlw-00004): security fix applied in the 2.7.18 stream without requiring a major upgrade. Other listed versions are upgrades to newer Spring Boot releases.",
          advisoryId: "RHLW-2024:38816",
        },
      ],
    },
  ],
};

export const getMockRemediationPackagesForCve = (
  cveIdentifier: string,
): LightwellRemediationPackage[] =>
  MOCK_REMEDIATION_PACKAGES_BY_CVE[cveIdentifier] ?? [];

/** All Lightwell remediations for a package across CVEs. */
export const getMockRemediationsForPackage = (
  packageId: string,
  packageName?: string,
): LightwellRemediationExpandItem[] => {
  const items: LightwellRemediationExpandItem[] = [];

  for (const packages of Object.values(MOCK_REMEDIATION_PACKAGES_BY_CVE)) {
    for (const pkg of packages) {
      const matchesId = pkg.packageId === packageId;
      const matchesName =
        !!packageName && pkg.packageName === packageName;
      if (!matchesId && !matchesName) {
        continue;
      }
      for (const remediation of pkg.remediations) {
        if (remediation.kind !== "remediation") {
          continue;
        }
        items.push({
          packageId: pkg.packageId,
          packageName: pkg.packageName,
          remediation,
        });
      }
    }
  }

  return items;
};
