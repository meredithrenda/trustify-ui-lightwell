import type React from "react";

import { Label, LabelGroup } from "@patternfly/react-core";

import { getMockRemediationVersionsForPackageCve } from "@app/mocks/sbom-remediations";

declare const __MOCK_DATA__: boolean;

interface PackageCveRemediationCellProps {
  packageId: string;
  vulnerabilityId: string;
  packageName?: string;
}

/** Visible version pills before "+N more". */
const VISIBLE_LABELS = 3;

/**
 * Remediations for one package under one CVE (package details → Vulnerabilities).
 * Plain green outline version pills.
 */
export const PackageCveRemediationCell: React.FC<
  PackageCveRemediationCellProps
> = ({ packageId, vulnerabilityId, packageName }) => {
  const versions = __MOCK_DATA__
    ? getMockRemediationVersionsForPackageCve(
        packageId,
        vulnerabilityId,
        packageName,
      )
    : [];

  if (versions.length === 0) {
    return <>--</>;
  }

  return (
    <LabelGroup numLabels={VISIBLE_LABELS}>
      {versions.map((option) => (
        <Label key={option.version} color="green" variant="outline" isCompact>
          {option.version}
        </Label>
      ))}
    </LabelGroup>
  );
};
