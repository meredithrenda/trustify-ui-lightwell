import type { LicenseRefMapping, PurlSummary, SbomPackage } from "@app/client";

/** Package UUIDs that mock mode treats as having ≥1 vulnerability (for `has_vulnerabilities` UX). */
export const mockPackageUuidsWithVulnerabilities = new Set<string>([
  "pkg-001",
  "pkg-003",
  "pkg-004",
  "pkg-007",
  "pkg-008",
  "pkg-011",
  "pkg-012",
]);

const MOCK_LICENSE_IDS: LicenseRefMapping[] = [
  { license_id: "Apache-2.0", license_name: "Apache License 2.0" },
  { license_id: "MIT", license_name: "MIT License" },
  { license_id: "GPL-2.0-or-later", license_name: "GNU GPL v2 or later" },
  { license_id: "BSD-3-Clause", license_name: "BSD 3-Clause" },
];

export const packageNameFromPurl = (purl: string): string => {
  const withoutQualifiers = purl.split("?")[0] ?? purl;
  const at = withoutQualifiers.lastIndexOf("@");
  const withoutVersion =
    at >= 0 ? withoutQualifiers.slice(0, at) : withoutQualifiers;
  const match = withoutVersion.match(/^pkg:[^/]+\/(.+)$/);
  if (match?.[1]) {
    const path = match[1];
    if (path.startsWith("@")) {
      return path;
    }
    return path.split("/").pop() ?? path;
  }
  return withoutVersion;
};

/** SBOM-scoped package rows for detail Packages tab. */
export const getMockSbomPackages = (sbomId: string): SbomPackage[] => {
  const toRow = (pkg: PurlSummary, index: number): SbomPackage => ({
    id: `${sbomId}-pkg-${index + 1}`,
    name: packageNameFromPurl(pkg.purl),
    version: pkg.version.version,
    group: null,
    purl: [pkg],
    cpe: [],
    licenses: [
      {
        license_name:
          MOCK_LICENSE_IDS[index % MOCK_LICENSE_IDS.length].license_id,
        license_type: "declared" as const,
      },
    ],
    licenses_ref_mapping: [],
  });

  // Lightwell demo SBOM: always lead with spring-boot for the backport walkthrough.
  if (sbomId === "a1b2c3d4-0008-4000-8000-000000000008") {
    const springBoot = mockPackages.find((pkg) => pkg.uuid === "pkg-012");
    const supporting = mockPackages
      .filter((pkg) => pkg.uuid !== "pkg-012")
      .slice(0, 4);
    const selected = springBoot ? [springBoot, ...supporting] : supporting;
    return selected.map((pkg, index) => toRow(pkg, index));
  }

  // Rotate a stable slice of mock packages per SBOM so every detail page has rows.
  const seed = [...sbomId].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const start = seed % mockPackages.length;
  const count = 4 + (seed % 4);
  const selected = Array.from({ length: count }, (_, index) => {
    return mockPackages[(start + index) % mockPackages.length];
  });

  return selected.map((pkg, index) => toRow(pkg, index));
};

export const getMockSbomLicenseIds = (
  _sbomId: string,
): LicenseRefMapping[] => MOCK_LICENSE_IDS;

export const mockPackages: PurlSummary[] = [
  {
    uuid: "pkg-001",
    purl: "pkg:rpm/redhat/openssl@3.0.7-27.el9?arch=x86_64",
    base: {
      uuid: "base-001",
      purl: "pkg:rpm/redhat/openssl",
    },
    qualifiers: { arch: "x86_64" },
    version: {
      uuid: "ver-001",
      purl: "pkg:rpm/redhat/openssl@3.0.7-27.el9",
      version: "3.0.7-27.el9",
    },
  },
  {
    uuid: "pkg-002",
    purl: "pkg:rpm/redhat/kernel@5.14.0-362.el9?arch=x86_64",
    base: {
      uuid: "base-002",
      purl: "pkg:rpm/redhat/kernel",
    },
    qualifiers: { arch: "x86_64" },
    version: {
      uuid: "ver-002",
      purl: "pkg:rpm/redhat/kernel@5.14.0-362.el9",
      version: "5.14.0-362.el9",
    },
  },
  {
    uuid: "pkg-003",
    purl: "pkg:npm/@angular/core@17.3.0",
    base: {
      uuid: "base-003",
      purl: "pkg:npm/@angular/core",
    },
    qualifiers: {},
    version: {
      uuid: "ver-003",
      purl: "pkg:npm/@angular/core@17.3.0",
      version: "17.3.0",
    },
  },
  {
    uuid: "pkg-004",
    purl: "pkg:maven/org.apache.logging.log4j/log4j-core@2.23.1",
    base: {
      uuid: "base-004",
      purl: "pkg:maven/org.apache.logging.log4j/log4j-core",
    },
    qualifiers: {},
    version: {
      uuid: "ver-004",
      purl: "pkg:maven/org.apache.logging.log4j/log4j-core@2.23.1",
      version: "2.23.1",
    },
  },
  {
    uuid: "pkg-005",
    purl: "pkg:rpm/redhat/sqlite-libs@3.34.1-7.el9?arch=x86_64",
    base: {
      uuid: "base-005",
      purl: "pkg:rpm/redhat/sqlite-libs",
    },
    qualifiers: { arch: "x86_64" },
    version: {
      uuid: "ver-005",
      purl: "pkg:rpm/redhat/sqlite-libs@3.34.1-7.el9",
      version: "3.34.1-7.el9",
    },
  },
  {
    uuid: "pkg-006",
    purl: "pkg:npm/react@19.0.0",
    base: {
      uuid: "base-006",
      purl: "pkg:npm/react",
    },
    qualifiers: {},
    version: {
      uuid: "ver-006",
      purl: "pkg:npm/react@19.0.0",
      version: "19.0.0",
    },
  },
  {
    uuid: "pkg-007",
    purl: "pkg:maven/com.fasterxml.jackson.core/jackson-databind@2.17.0",
    base: {
      uuid: "base-007",
      purl: "pkg:maven/com.fasterxml.jackson.core/jackson-databind",
    },
    qualifiers: {},
    version: {
      uuid: "ver-007",
      purl: "pkg:maven/com.fasterxml.jackson.core/jackson-databind@2.17.0",
      version: "2.17.0",
    },
  },
  {
    uuid: "pkg-008",
    purl: "pkg:rpm/redhat/httpd@2.4.57-8.el9?arch=x86_64",
    base: {
      uuid: "base-008",
      purl: "pkg:rpm/redhat/httpd",
    },
    qualifiers: { arch: "x86_64" },
    version: {
      uuid: "ver-008",
      purl: "pkg:rpm/redhat/httpd@2.4.57-8.el9",
      version: "2.4.57-8.el9",
    },
  },
  {
    uuid: "pkg-009",
    purl: "pkg:oci/ubi9@sha256:abc123?repository_url=registry.access.redhat.com/ubi9",
    base: {
      uuid: "base-009",
      purl: "pkg:oci/ubi9",
    },
    qualifiers: { repository_url: "registry.access.redhat.com/ubi9" },
    version: {
      uuid: "ver-009",
      purl: "pkg:oci/ubi9@sha256:abc123",
      version: "sha256:abc123",
    },
  },
  {
    uuid: "pkg-010",
    purl: "pkg:rpm/redhat/python3.12@3.12.4-1.el9?arch=x86_64",
    base: {
      uuid: "base-010",
      purl: "pkg:rpm/redhat/python3.12",
    },
    qualifiers: { arch: "x86_64" },
    version: {
      uuid: "ver-010",
      purl: "pkg:rpm/redhat/python3.12@3.12.4-1.el9",
      version: "3.12.4-1.el9",
    },
  },
  {
    uuid: "pkg-011",
    purl: "pkg:rpm/redhat/firefox@115.15.0-1.el9_4?arch=x86_64",
    base: {
      uuid: "base-011",
      purl: "pkg:rpm/redhat/firefox",
    },
    qualifiers: { arch: "x86_64" },
    version: {
      uuid: "ver-011",
      purl: "pkg:rpm/redhat/firefox@115.15.0-1.el9_4",
      version: "115.15.0-1.el9_4",
    },
  },
  {
    uuid: "pkg-012",
    purl: "pkg:maven/org.springframework.boot/spring-boot@2.7.18?type=jar",
    base: {
      uuid: "base-012",
      purl: "pkg:maven/org.springframework.boot/spring-boot",
    },
    qualifiers: { type: "jar" },
    version: {
      uuid: "ver-012",
      purl: "pkg:maven/org.springframework.boot/spring-boot@2.7.18",
      version: "2.7.18",
    },
  },
];

/** SBOM used for the Lightwell spring-boot backport demo walkthrough. */
export const MOCK_SPRING_BOOT_SBOM_ID =
  "a1b2c3d4-0008-4000-8000-000000000008";

export const MOCK_SPRING_BOOT_PACKAGE_ID = "pkg-012";

/** Build SBOM package rows for specific package names (remediation deep-links). */
export const getMockSbomPackagesByNames = (
  sbomId: string,
  packageNames: string[],
): SbomPackage[] => {
  const uniqueNames = [...new Set(packageNames.filter(Boolean))];

  return uniqueNames.map((name, index) => {
    const pkg =
      mockPackages.find((item) => packageNameFromPurl(item.purl) === name) ??
      mockPackages.find((item) => item.purl.includes(`/${name}@`)) ??
      mockPackages.find((item) => item.uuid === name);

    if (pkg) {
      return {
        id: `${sbomId}-filtered-pkg-${index + 1}`,
        name: packageNameFromPurl(pkg.purl),
        version: pkg.version.version,
        group: null,
        purl: [pkg],
        cpe: [],
        licenses: [
          {
            license_name:
              MOCK_LICENSE_IDS[index % MOCK_LICENSE_IDS.length].license_id,
            license_type: "declared" as const,
          },
        ],
        licenses_ref_mapping: [],
      };
    }

    return {
      id: `${sbomId}-filtered-pkg-${index + 1}`,
      name,
      version: "—",
      group: null,
      purl: [],
      cpe: [],
      licenses: [],
      licenses_ref_mapping: [],
    };
  });
};
