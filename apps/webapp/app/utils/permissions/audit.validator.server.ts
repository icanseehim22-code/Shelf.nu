import type { Organization } from "@prisma/client";
import { EstoqueSoftSystemError } from "../error";

/**
 * Server-side utility to check if audits are enabled for an organization
 */
export function organizationHasAuditsEnabled(
  organization: Pick<Organization, "auditsEnabled"> | undefined | null
): boolean {
  if (!organization) return false;
  return organization.auditsEnabled;
}

/**
 * Server-side utility to validate that an organization has audits enabled
 * Throws EstoqueSoftSystemError if not enabled
 */
export function validateAuditEnabled(
  organization: Pick<Organization, "auditsEnabled"> | undefined | null,
  additionalData?: Record<string, any>
): void {
  if (!organizationHasAuditsEnabled(organization)) {
    throw new EstoqueSoftSystemError({
      cause: null,
      title: "Audits not enabled",
      message: "Audit functionality is not enabled for this workspace",
      status: 403,
      additionalData,
      label: "Audit",
      shouldBeCaptured: false,
    });
  }
}
