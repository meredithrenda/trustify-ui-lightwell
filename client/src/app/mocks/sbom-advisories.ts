import type { VulnerabilityStatus } from "@app/api/models";
import type {
  SbomAdvisory,
  SbomPackage,
  SbomStatus,
  Score,
  Severity,
  VulnerabilitySbomStatus,
} from "@app/client";

import { mockPackages, packageNameFromPurl } from "./packages";
import { getMockRemediationPackagesForCve } from "./sbom-remediations";
import { mockSboms } from "./sboms";

type CveFixture = {
  identifier: string;
  title: string;
  description: string;
  cwes: string[];
  discovered: string;
  modified: string;
  published: string;
  reserved: string;
  rhsa: string;
  rhTitle: string;
  rhPublished: string;
  score: number;
  severity: Severity;
};

/** CVE/RHSA pairs plausible for Red Hat advisories (titles loosely aligned with public RHSA text). */
export const mockCveFixtures: CveFixture[] = [
  {
    identifier: "CVE-2024-0232",
    title: "sqlite: use-after-free bug in jsonParseAddNodeArray",
    description:
      "A heap use-after-free issue has been identified in SQLite in the jsonParseAddNodeArray() function in sqlite3.c.",
    cwes: ["CWE-416"],
    discovered: "2023-10-12T00:00:00Z",
    modified: "2025-11-21T13:52:30Z",
    published: "2023-10-12T00:00:00Z",
    reserved: "2024-01-02T00:00:00Z",
    rhsa: "RHSA-2024:0232",
    rhTitle: "Low: sqlite security update",
    rhPublished: "2024-01-16T14:00:00Z",
    score: 4.7,
    severity: "low",
  },
  {
    identifier: "CVE-2024-9680",
    title: "Mozilla Firefox: Security updates",
    description:
      "Mozilla: Memory safety bugs fixed in Firefox ESR 115.16 and Firefox 131.",
    cwes: ["CWE-416"],
    discovered: "2024-10-09T00:00:00Z",
    modified: "2024-10-09T00:00:00Z",
    published: "2024-10-09T00:00:00Z",
    reserved: "2024-10-08T00:00:00Z",
    rhsa: "RHSA-2024:7848",
    rhTitle: "Critical: firefox security update",
    rhPublished: "2024-10-09T12:00:00Z",
    score: 9.8,
    severity: "critical",
  },
  {
    identifier: "CVE-2024-6119",
    title: "openssl: Possible denial of service in X.509 name checks",
    description:
      "A flaw was found in OpenSSL. Name constraints checking could be exploited to cause a denial of service.",
    cwes: ["CWE-843"],
    discovered: "2024-06-27T00:00:00Z",
    modified: "2024-10-07T00:00:00Z",
    published: "2024-09-03T00:00:00Z",
    reserved: "2024-06-25T00:00:00Z",
    rhsa: "RHSA-2024:7699",
    rhTitle: "Important: openssl security update",
    rhPublished: "2024-10-07T10:00:00Z",
    score: 7.5,
    severity: "high",
  },
  {
    identifier: "CVE-2024-12747",
    title: "glibc: potential buffer overflow in the resolver",
    description:
      "A flaw in glibc name-service resolution could allow a local attacker to trigger incorrect handling of crafted hostnames.",
    cwes: ["CWE-121"],
    discovered: "2024-05-01T00:00:00Z",
    modified: "2024-08-20T00:00:00Z",
    published: "2024-08-20T00:00:00Z",
    reserved: "2024-04-28T00:00:00Z",
    rhsa: "RHSA-2024:5120",
    rhTitle: "Moderate: glibc security update",
    rhPublished: "2024-08-22T10:00:00Z",
    score: 5.3,
    severity: "medium",
  },
  {
    identifier: "CVE-2024-47176",
    title: "cups-browsed binds on INADDR_ANY",
    description:
      "A flaw in CUPS could allow remote attackers to manipulate the printing subsystem.",
    cwes: ["CWE-1327"],
    discovered: "2024-09-26T00:00:00Z",
    modified: "2024-10-01T00:00:00Z",
    published: "2024-09-26T00:00:00Z",
    reserved: "2024-09-20T00:00:00Z",
    rhsa: "RHSA-2024:7462",
    rhTitle: "Critical: cups-filters security update",
    rhPublished: "2024-10-01T08:00:00Z",
    score: 7.5,
    severity: "high",
  },
  {
    identifier: "CVE-2023-44487",
    title: "HTTP/2 rapid reset vulnerability",
    description:
      "HTTP/2 protocol flaw allowing denial-of-service via rapid stream cancellation (Rapid Reset).",
    cwes: ["CWE-770"],
    discovered: "2023-10-10T00:00:00Z",
    modified: "2024-03-15T00:00:00Z",
    published: "2023-10-10T00:00:00Z",
    reserved: "2023-10-05T00:00:00Z",
    rhsa: "RHSA-2024:0896",
    rhTitle: "Important: httpd security update",
    rhPublished: "2024-03-18T09:00:00Z",
    score: 7.5,
    severity: "high",
  },
  {
    identifier: "CVE-2024-21626",
    title: "runc: container breakout via leaky file descriptors",
    description:
      "A flaw in runc could allow an attacker to escape container isolation under certain conditions.",
    cwes: ["CWE-59"],
    discovered: "2024-01-31T00:00:00Z",
    modified: "2024-02-05T00:00:00Z",
    published: "2024-02-01T00:00:00Z",
    reserved: "2024-01-25T00:00:00Z",
    rhsa: "RHSA-2024:2163",
    rhTitle: "Important: runc security update",
    rhPublished: "2024-02-07T11:00:00Z",
    score: 8.6,
    severity: "high",
  },
  {
    identifier: "CVE-2023-52425",
    title: "libxml2: use-after-free in xmlParseBalancedChunkMemoryRecover",
    description:
      "A use-after-free flaw in libxml2 could result in a denial of service when parsing crafted XML content.",
    cwes: ["CWE-416"],
    discovered: "2023-12-13T00:00:00Z",
    modified: "2024-04-12T00:00:00Z",
    published: "2024-04-12T00:00:00Z",
    reserved: "2023-12-01T00:00:00Z",
    rhsa: "RHSA-2024:4548",
    rhTitle: "Low: libxml2 security update",
    rhPublished: "2024-04-15T10:00:00Z",
    score: 3.9,
    severity: "low",
  },
];

const lowSeverityFixtures = (): CveFixture[] =>
  mockCveFixtures.filter((f) => f.severity === "low");

const fixtureBySeverity = (severity: Severity): CveFixture | undefined =>
  mockCveFixtures.find((f) => f.severity === severity);

/** First matching high-severity fixture (several CVEs share “high”). */
const primaryHighFixture = (): CveFixture | undefined =>
  mockCveFixtures.find((f) => f.identifier === "CVE-2024-6119") ??
  mockCveFixtures.find((f) => f.severity === "high");

/**
 * SBOMs with four distinct levels: critical, high, medium, low (UX / filter demos).
 * Indices: RHEL 9.4, quarkus-bom, AAP, RH SSO.
 */
const SBOM_INDICES_FOUR_SEVERITY_TIERS = new Set([0, 2, 5, 8]);

/**
 * SBOMs with three tiers: critical, medium, low (no dedicated high row).
 * Indices: OpenShift 4.16, Advanced Cluster Security.
 */
const SBOM_INDICES_CRITICAL_MEDIUM_LOW = new Set([1, 7]);

/**
 * SBOMs with three tiers: high, medium, low (no critical in this bundle).
 * Index: Red Hat Build of Apache Camel.
 */
const SBOM_INDICES_HIGH_MEDIUM_LOW = new Set([4]);

/** Primary demo SBOM (RHEL): enough affected CVE rows to show every Exploit Intelligence cell state together. */
const SBOM_INDEX_EXPLOIT_INTEL_PROTOTYPE = 0;

const mkScore = (value: number, severity: Severity): Score => ({
  type: "3.1",
  value,
  severity,
});

const mkSbomStatus = (
  cve: CveFixture,
  pkg: SbomPackage,
  vulnStatus: VulnerabilityStatus,
): SbomStatus => ({
  identifier: cve.identifier,
  title: cve.title,
  description: cve.description,
  cwes: cve.cwes,
  discovered: cve.discovered,
  modified: cve.modified,
  published: cve.published,
  reserved: cve.reserved,
  released: null,
  withdrawn: null,
  normative: true,
  base_score: {
    score: cve.score,
    severity: cve.severity,
    type: "3.1",
  },
  packages: [pkg],
  scores: [mkScore(cve.score, cve.severity)],
  status: vulnStatus,
});

const mkSbomAdvisory = (
  cve: CveFixture,
  _pkg: SbomPackage,
  status: SbomStatus[],
): SbomAdvisory => ({
  uuid: `adv-mock-${cve.rhsa}`,
  document_id: cve.rhsa,
  identifier: cve.rhsa,
  title: cve.rhTitle,
  published: cve.rhPublished,
  modified: cve.modified,
  labels: { type: "csaf", severity: cve.severity },
  issuer: null,
  withdrawn: null,
  status,
});

/**
 * Mock `/api/v2/sbom/{id}/advisories` — several RHSAs per SBOM using the SBOM’s root package as context.
 */
export const getMockSbomAdvisories = (sbomId: string): SbomAdvisory[] => {
  const sbom = mockSboms.find((s) => s.id === sbomId);
  if (!sbom?.described_by[0]) {
    return [];
  }
  const pkg = sbom.described_by[0];
  const idx = Math.max(
    0,
    mockSboms.findIndex((s) => s.id === sbomId),
  );

  const pick = (offset: number) =>
    mockCveFixtures[(idx + offset) % mockCveFixtures.length];
  const pickPkg = (offset: number) =>
    mockPackages[(idx + offset) % mockPackages.length];

  const pkg0 = {
    ...pkg,
    purl: [pickPkg(0)],
  };
  const pkg1 = {
    ...pkg,
    purl: [pickPkg(1)],
  };
  const pkg2 = {
    ...pkg,
    purl: [pickPkg(2)],
  };
  const pkg3 = {
    ...pkg,
    purl: [pickPkg(3)],
  };
  const pkg4 = {
    ...pkg,
    purl: [pickPkg(4)],
  };
  const pkg5 = {
    ...pkg,
    purl: [pickPkg(5)],
  };
  const pkg6 = {
    ...pkg,
    purl: [pickPkg(6)],
  };

  const crit = fixtureBySeverity("critical");
  const med = fixtureBySeverity("medium");
  const lowFirst = lowSeverityFixtures()[0];
  const high = primaryHighFixture();

  if (idx === SBOM_INDEX_EXPLOIT_INTEL_PROTOTYPE) {
    const exploitPrototypeCveIdentifiers = [
      "CVE-2024-9680",
      "CVE-2024-12747",
      "CVE-2024-6119",
      "CVE-2024-47176",
      "CVE-2024-21626",
      "CVE-2023-44487",
      "CVE-2024-0232",
    ];
    const exploitPrototypePkgs = [pkg0, pkg1, pkg2, pkg3, pkg4, pkg5, pkg6];
    if (
      exploitPrototypeCveIdentifiers.every((id) =>
        mockCveFixtures.some((f) => f.identifier === id),
      )
    ) {
      return exploitPrototypeCveIdentifiers.map((id, row) => {
        const cve = mockCveFixtures.find((f) => f.identifier === id);
        const fallbackPkg = exploitPrototypePkgs[row];
        if (!cve || !fallbackPkg) {
          throw new Error(
            `[mock sbom advisory] Missing CVE or package for exploit intelligence prototype (${id}).`,
          );
        }

        // Affected packages must match remediation mock data for this CVE so
        // the Vulnerabilities expand Remediations column stays accurate.
        const remediationPkgs = getMockRemediationPackagesForCve(id).filter(
          (remPkg) =>
            remPkg.remediations.some((item) => item.kind === "remediation"),
        );
        const matchedPurls = remediationPkgs
          .map((remPkg) =>
            mockPackages.find((candidate) => candidate.uuid === remPkg.packageId),
          )
          .filter((candidate): candidate is (typeof mockPackages)[number] =>
            Boolean(candidate),
          );

        const statusPkg: SbomPackage =
          matchedPurls.length > 0
            ? {
                ...pkg,
                name:
                  matchedPurls.length === 1
                    ? packageNameFromPurl(matchedPurls[0].purl)
                    : matchedPurls
                        .map((matched) => packageNameFromPurl(matched.purl))
                        .join(" / "),
                purl: matchedPurls,
              }
            : fallbackPkg;

        return mkSbomAdvisory(cve, statusPkg, [
          mkSbomStatus(cve, statusPkg, "affected"),
        ]);
      });
    }
  }

  if (
    SBOM_INDICES_FOUR_SEVERITY_TIERS.has(idx) &&
    crit &&
    high &&
    med &&
    lowFirst
  ) {
    return [
      mkSbomAdvisory(crit, pkg0, [mkSbomStatus(crit, pkg0, "affected")]),
      mkSbomAdvisory(high, pkg1, [mkSbomStatus(high, pkg1, "affected")]),
      mkSbomAdvisory(med, pkg2, [mkSbomStatus(med, pkg2, "affected")]),
      mkSbomAdvisory(lowFirst, pkg3, [
        mkSbomStatus(lowFirst, pkg3, "affected"),
      ]),
    ];
  }

  if (SBOM_INDICES_CRITICAL_MEDIUM_LOW.has(idx) && crit && med && lowFirst) {
    return [
      mkSbomAdvisory(crit, pkg0, [mkSbomStatus(crit, pkg0, "affected")]),
      mkSbomAdvisory(med, pkg1, [mkSbomStatus(med, pkg1, "affected")]),
      mkSbomAdvisory(lowFirst, pkg2, [
        mkSbomStatus(lowFirst, pkg2, "affected"),
      ]),
    ];
  }

  if (SBOM_INDICES_HIGH_MEDIUM_LOW.has(idx) && high && med && lowFirst) {
    return [
      mkSbomAdvisory(high, pkg0, [mkSbomStatus(high, pkg0, "affected")]),
      mkSbomAdvisory(med, pkg1, [mkSbomStatus(med, pkg1, "affected")]),
      mkSbomAdvisory(lowFirst, pkg2, [
        mkSbomStatus(lowFirst, pkg2, "affected"),
      ]),
    ];
  }

  const cve0 = pick(0);
  const cve1 = pick(1);
  const cve2 = pick(2);

  return [
    mkSbomAdvisory(cve0, pkg0, [mkSbomStatus(cve0, pkg0, "affected")]),
    mkSbomAdvisory(cve1, pkg1, [mkSbomStatus(cve1, pkg1, "affected")]),
    mkSbomAdvisory(cve2, pkg2, [
      mkSbomStatus(cve2, pkg2, "under_investigation"),
    ]),
  ];
};

/** Links a mock SBOM to package PURLs for vulnerability list “Impacted SBOMs” counts. */
export const mockVulnSbomLink = (
  sbomIndex: number,
  packageIndex: number,
  statusKey: VulnerabilityStatus = "affected",
): VulnerabilitySbomStatus => {
  const s = mockSboms[sbomIndex % mockSboms.length];
  const p = mockPackages[packageIndex % mockPackages.length];
  return {
    id: s.id,
    name: s.name,
    authors: s.authors,
    data_licenses: s.data_licenses,
    document_id: s.document_id ?? null,
    labels: s.labels,
    number_of_packages: s.number_of_packages,
    published: s.published,
    suppliers: s.suppliers,
    purl_statuses: {
      [statusKey]: [p],
    },
  };
};
