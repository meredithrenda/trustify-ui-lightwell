import type React from "react";

import {
  formatPackageRemediationCountLabel,
  getMockPackageGuidanceCounts,
} from "@app/mocks/sbom-remediations";

declare const __MOCK_DATA__: boolean;

interface PackageRemediationCountCellProps {
  packageId: string;
}

/**
 * List-page remediation cell: count only.
 * Version remediations belong on package details → Vulnerabilities (1 package × 1 CVE).
 */
export const PackageRemediationCountCell: React.FC<
  PackageRemediationCountCellProps
> = ({ packageId }) => {
  const count = __MOCK_DATA__
    ? getMockPackageGuidanceCounts(packageId).remediations
    : 0;

  return <>{formatPackageRemediationCountLabel(count)}</>;
};
