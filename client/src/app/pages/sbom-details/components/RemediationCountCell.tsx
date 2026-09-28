import type React from "react";

import type { LightwellRemediationPackage } from "@app/mocks/sbom-remediations";
import {
  countRemediations,
  formatRemediationCountLabel,
} from "@app/mocks/sbom-remediations";

interface RemediationCountCellProps {
  packages: LightwellRemediationPackage[];
}

/**
 * SBOM vulnerability list cell: remediation count for this CVE.
 * Expand Affected dependencies to see remediations per package.
 */
export const RemediationCountCell: React.FC<RemediationCountCellProps> = ({
  packages,
}) => {
  const packagesWithRemediations = packages.filter((pkg) =>
    pkg.remediations.some((item) => item.kind === "remediation"),
  );
  const totalCount = countRemediations(packagesWithRemediations);

  return <>{formatRemediationCountLabel(totalCount)}</>;
};
