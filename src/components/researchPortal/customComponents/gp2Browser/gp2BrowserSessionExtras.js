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
                  phenotype: literatureEvidenceState.phenotype || null,
                  query: literatureEvidenceState.query || null,
                  genesSearched: literatureEvidenceState.genesSearched || [],
                  usedLocusDigest: Boolean(literatureEvidenceState.usedLocusDigest),
                  locusDigest: literatureEvidenceState.locusDigest || null,
                  papers: literatureEvidenceState.papers || [],
                  knownFindings: literatureEvidenceState.knownFindings || "",
                  knowledgeGaps: literatureEvidenceState.knowledgeGaps || "",
                  moreBatches: (literatureEvidenceState.moreBatches || []).map((batch) => ({
                      papers: batch.papers || [],
                      knownFindings: batch.knownFindings || "",
                      knowledgeGaps: batch.knowledgeGaps || "",
                  })),
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
                  phenotype: literatureEvidence.phenotype || null,
                  query: literatureEvidence.query || null,
                  genesSearched: Array.isArray(literatureEvidence.genesSearched)
                      ? literatureEvidence.genesSearched
                      : [],
                  usedLocusDigest: Boolean(literatureEvidence.usedLocusDigest),
                  locusDigest: literatureEvidence.locusDigest || null,
                  papers: Array.isArray(literatureEvidence.papers)
                      ? literatureEvidence.papers
                      : [],
                  synthesizing: false,
                  synthesisError: null,
                  knownFindings: literatureEvidence.knownFindings || "",
                  knowledgeGaps: literatureEvidence.knowledgeGaps || "",
                  moreBatches: Array.isArray(literatureEvidence.moreBatches)
                      ? literatureEvidence.moreBatches.map((batch) => ({
                            papers: Array.isArray(batch?.papers) ? batch.papers : [],
                            synthesizing: false,
                            synthesisError: null,
                            knownFindings: batch?.knownFindings || "",
                            knowledgeGaps: batch?.knowledgeGaps || "",
                        }))
                      : [],
                  loadingMore: false,
                  loadMoreError: null,
              }
            : null,
        visibleSectionIds: Array.isArray(gp2.visibleSectionIds) ? gp2.visibleSectionIds : null,
        viewingCenterBp: gp2.viewingCenterBp ?? null,
        viewingRegionWidthBp: gp2.viewingRegionWidthBp ?? null,
    };
}
