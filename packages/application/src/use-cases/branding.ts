import { validateThemeDraft, type PortalThemeDraft } from "@lotiva/domain";
import type { ThemeRepository } from "../ports.js";

export async function saveThemeDraft(deps: {
  themes: ThemeRepository;
  propertyId: string;
  tenantId: string;
  draft: PortalThemeDraft;
}) {
  const errors = validateThemeDraft(deps.draft);
  if (errors.length) {
    throw Object.assign(new Error(errors.join("; ")), { code: "THEME_INVALID", details: { errors } });
  }
  return deps.themes.saveDraft(deps.propertyId, deps.tenantId, deps.draft);
}

export async function publishTheme(deps: {
  themes: ThemeRepository;
  propertyId: string;
  tenantId: string;
  versionId: string;
}) {
  return deps.themes.publish(deps.propertyId, deps.tenantId, deps.versionId);
}

export async function rollbackTheme(deps: {
  themes: ThemeRepository;
  propertyId: string;
  tenantId: string;
  versionId: string;
}) {
  return deps.themes.rollback(deps.propertyId, deps.tenantId, deps.versionId);
}
