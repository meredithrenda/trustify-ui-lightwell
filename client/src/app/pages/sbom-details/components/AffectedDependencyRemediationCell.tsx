import type React from "react";

import { Label, LabelGroup } from "@patternfly/react-core";

import type { LightwellRemediationPackage } from "@app/mocks/sbom-remediations";

interface AffectedDependencyRemediationCellProps {
  /** Remediations for the parent CVE, scoped per package. */
  remediationPackages: LightwellRemediationPackage[];
  packageId?: string;
  packageName?: string;
}

/**
 * Remediations for one package under one CVE (Affected dependencies expand).
 * Plain green outline version pills — no backport / upgrade type breakdown.
 */
export const AffectedDependencyRemediationCell: React.FC<
  AffectedDependencyRemediationCellProps
> = ({ remediationPackages, packageId, packageName }) => {
  const matchingPackage = remediationPackages.find(
    (pkg) =>
      (packageId && pkg.packageId === packageId) ||
      (packageName && pkg.packageName === packageName),
  );

  const remediations =
    matchingPackage?.remediations.filter(
      (item) => item.kind === "remediation" && item.fixedInVersion,
    ) ?? [];

  if (remediations.length === 0) {
    return <>--</>;
  }

  return (
    <LabelGroup numLabels={4}>
      {remediations.map((remediation) => (
        <Label
          key={remediation.id}
          color="green"
          variant="outline"
          isCompact
        >
          {remediation.fixedInVersion}
        </Label>
      ))}
    </LabelGroup>
  );
};
