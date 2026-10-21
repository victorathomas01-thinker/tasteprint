// Preserve campaign configuration that the form does not edit. Form fields remain
// authoritative for identity, branding, consent and catalog; no shared secret is needed.
export function studioManifest(template, edits) {
  const base = structuredClone(template || {});
  return {
    ...base,
    ...edits,
    localDraft: true,
    theme: { ...base.theme, ...edits.theme },
    copy: { ...base.copy, ...edits.copy },
    scoring: base.scoring || { dimensionMultipliers: {} }
  };
}
