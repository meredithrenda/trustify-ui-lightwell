import type React from "react";
import { Link } from "react-router-dom";

import {
  Button,
  Card,
  CardBody,
  Content,
  Grid,
  GridItem,
  Stack,
  StackItem,
  Title,
} from "@patternfly/react-core";
import ArrowRightIcon from "@patternfly/react-icons/dist/esm/icons/arrow-right-icon";
import { Paths } from "@app/Routes";

interface ActionCard {
  title: string;
  description: string;
  linkTo: string;
  buttonLabel: string;
}

const ACTIONS: ActionCard[] = [
  {
    title: "Review remediations",
    description:
      "Select applications and open a remediation report to see which packages have remediations available.",
    linkTo: Paths.sboms,
    buttonLabel: "Review remediations",
  },
  {
    title: "Generate vulnerability report",
    description:
      "Create a PDF or CSV summary of your current security posture across all ingested SBOMs, including VEX status and remediation guidance.",
    linkTo: Paths.vulnerabilities,
    buttonLabel: "Generate vulnerability report",
  },
  {
    title: "Analyze with Exploit Intelligence",
    description:
      "Use Exploit Intelligence to filter false positives and focus on vulnerabilities with known exploit activity in the wild.",
    linkTo: Paths.vulnerabilities,
    buttonLabel: "Start analysis",
  },
];

export const RecommendedActionsSection: React.FC = () => {
  return (
    <Stack hasGutter>
      <StackItem>
        <Title headingLevel="h2" size="lg">
          Recommended actions
        </Title>
        <Content>
          Get started with the most impactful next steps for your supply chain
          security.
        </Content>
      </StackItem>

      <StackItem>
        <Grid hasGutter>
          {ACTIONS.map((action) => (
            <GridItem key={action.title} md={4}>
              <Card isFullHeight>
                <CardBody>
                  <Stack hasGutter>
                    <StackItem>
                      <Title headingLevel="h3" size="md">
                        {action.title}
                      </Title>
                    </StackItem>

                    <StackItem isFilled>
                      <Content
                        component="p"
                        style={{ color: "var(--pf-v6-global--Color--200)" }}
                      >
                        {action.description}
                      </Content>
                    </StackItem>

                    <StackItem>
                      <Link to={action.linkTo}>
                        <Button
                          variant="link"
                          isInline
                          icon={<ArrowRightIcon />}
                          iconPosition="end"
                        >
                          {action.buttonLabel}
                        </Button>
                      </Link>
                    </StackItem>
                  </Stack>
                </CardBody>
              </Card>
            </GridItem>
          ))}
        </Grid>
      </StackItem>
    </Stack>
  );
};
