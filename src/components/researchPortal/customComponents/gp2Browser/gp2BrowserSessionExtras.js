/**
 * GP2-only session export/import extensions, layered on top of the shared
 * Variant Sifter session schema (`kpVariantSifter/variantSifterSession.js`,
 * never modified directly — see gp2Browser/AGENTS.md). Covers GP2-specific
 * state the shared exporter/importer don't know about:
 * - QTL evidences data (raw rows + the user's type/tissue/gene/p-value
 *   filter selections) — the shared schema has no QTL concept at all.
 * - The Actions assistant's conversation (requests run and the results they
 *   produced, e.g. AI summary / literature evidence confirmations).
 * - Literature evidence panel results (papers + knownFindings/knowledgeGaps).
 * - The focused-view Zoom level state (viewingCenterBp/viewingRegionWidthBp).
 * - `visibleSectionIds` as GP2 Browser actually has it. The shared exporter's
 *   `ui.visibleSectionIds` is normalized against the shared Variant Sifter
 *   section registry, which has no "qtl-evidences" id — so it silently
 *   drops QTL out of the Settings checklist on export. Capturing the real
 *   list here (normalized against GP2's own section registry instead) is
 *   what fixes that.
 *
 * Stored under a top-level `gp2` key so it never collides with the shared
 * payload's own keys and is trivially ignored by anything reading the
 * payload as a plain Variant Sifter session.
 */

export function buildGp2SessionExtras({
    qtlState,
    assistantState,
    literatureEvidenceState,
    visibleSectionIds,
    viewingCenterBp,
    viewingRegionWidthBp,
}) {
    return {
        qtl: {
            rawRows: qtlState?.rawRows || [],
            selectedTypes: qtlState?.selectedTypes || [],
            selectedTissues: qtlState?.selectedTissues || [],
            selectedGenes: qtlState?.selectedGenes || [],
            deselectedGenes: qtlState?.deselectedGenes || [],
            pValueMax: qtlState?.pValueMax || "",
        },
        assistant: {
            threadEntries: assistantState?.threadEntries || [],
        },
        literatureEvidence: literatureEvidenceState?.loaded
            ? {
                  query: literatureEvidenceState.query || null,
                  genesSearched: literatureEvidenceState.genesSearched || [],
                  usedLocusDigest: Boolean(literatureEvidenceState.usedLocusDigest),
                  papers: literatureEvidenceState.papers || [],
                  knownFindings: literatureEvidenceState.knownFindings || "",
                  knowledgeGaps: literatureEvidenceState.knowledgeGaps || "",
              }
            : null,
        visibleSectionIds: Array.isArray(visibleSectionIds) ? visibleSectionIds : null,
        viewingCenterBp: viewingCenterBp ?? null,
        viewingRegionWidthBp: viewingRegionWidthBp ?? null,
    };
}

export function restoreGp2SessionExtras(payload) {
    const gp2 = payload?.gp2 || {};
    const qtl = gp2.qtl || {};
    const literatureEvidence = gp2.literatureEvidence || null;
    return {
        qtlRows: Array.isArray(qtl.rawRows) ? qtl.rawRows : [],
        qtlSelectedTypes: Array.isArray(qtl.selectedTypes) ? qtl.selectedTypes : [],
        qtlSelectedTissues: Array.isArray(qtl.selectedTissues) ? qtl.selectedTissues : [],
        qtlSelectedGenes: Array.isArray(qtl.selectedGenes) ? qtl.selectedGenes : [],
        qtlDeselectedGenes: Array.isArray(qtl.deselectedGenes) ? qtl.deselectedGenes : [],
        qtlPValueMax: qtl.pValueMax != null ? String(qtl.pValueMax) : "",
        assistantThreadEntries: Array.isArray(gp2.assistant?.threadEntries)
            ? gp2.assistant.threadEntries
            : [],
        literatureEvidenceState: literatureEvidence
            ? {
                  loading: false,
                  loaded: true,
                  error: null,
                  query: literatureEvidence.query || null,
                  genesSearched: Array.isArray(literatureEvidence.genesSearched)
                      ? literatureEvidence.genesSearched
                      : [],
                  usedLocusDigest: Boolean(literatureEvidence.usedLocusDigest),
                  papers: Array.isArray(literatureEvidence.papers)
                      ? literatureEvidence.papers
                      : [],
                  synthesizing: false,
                  synthesisError: null,
                  knownFindings: literatureEvidence.knownFindings || "",
                  knowledgeGaps: literatureEvidence.knowledgeGaps || "",
              }
            : null,
        visibleSectionIds: Array.isArray(gp2.visibleSectionIds) ? gp2.visibleSectionIds : null,
        viewingCenterBp: gp2.viewingCenterBp ?? null,
        viewingRegionWidthBp: gp2.viewingRegionWidthBp ?? null,
    };
}
