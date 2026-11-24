/**
 * GP2-only session export/import extensions, layered on top of the shared
 * Variant Sifter session schema (`kpVariantSifter/variantSifterSession.js`,
 * never modified directly — see gp2Browser/AGENTS.md). Covers GP2-specific
 * state the shared exporter/importer don't know about:
 * - QTL evidences data (raw rows + the user's type/tissue/gene/p-value
 *   filter selections) — the shared schema has no QTL concept at all.
 * - Gene scores (`gene-scoring` rows + drawer column visibility).
 * - The Actions assistant's conversation (requests run and the results they
 *   produced, e.g. AI summary / literature evidence confirmations).
 * - Literature evidence panel results (papers + claims/excerpts/gaps + KG).
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
import {
    describeGp2LocusDigestFindings,
    geneSearchPlanFromAiSummaryDigest,
} from "./gp2BrowserLiteratureEvidence.js";
import { gp2DefaultGeneScoreVisibleFields } from "./gp2BrowserLocusSummaryApi.js";

export function buildGp2SessionExtras({
    qtlState,
    geneScoresState,
    assistantState,
    literatureEvidenceState,
    aiSummaryMessage = null,
    visibleSectionIds,
    viewingCenterBp,
    viewingRegionWidthBp,
    enableAiSupport = false,
}) {
    return {
        enableAiSupport: Boolean(enableAiSupport),
        qtl: {
            rawRows: qtlState?.rawRows || [],
            selectedTypes: qtlState?.selectedTypes || [],
            selectedTissues: qtlState?.selectedTissues || [],
            selectedGenes: qtlState?.selectedGenes || [],
            deselectedGenes: qtlState?.deselectedGenes || [],
            pValueMax: qtlState?.pValueMax || "",
        },
        geneScores: {
            rows: geneScoresState?.rows || [],
            loadedKey: geneScoresState?.loadedKey || null,
            visibleFields: Array.isArray(geneScoresState?.visibleFields)
                ? geneScoresState.visibleFields.slice()
                : gp2DefaultGeneScoreVisibleFields(),
        },
        assistant: {
            threadEntries: assistantState?.threadEntries || [],
        },
        /** Stage-1 AI summary prose (also nested under literatureEvidence when LE loaded). */
        aiSummaryMessage: aiSummaryMessage ? String(aiSummaryMessage) : null,
        literatureEvidence: literatureEvidenceState?.loaded
            ? {
                  phenotype: literatureEvidenceState.phenotype || null,
                  query: literatureEvidenceState.query || null,
                  genesSearched: literatureEvidenceState.genesSearched || [],
                  variantsSearched: literatureEvidenceState.variantsSearched || [],
                  highlightTerms: literatureEvidenceState.highlightTerms || [],
                  aiSupport: Boolean(literatureEvidenceState.aiSupport),
                  geneReasons: literatureEvidenceState.geneReasons || [],
                  digestFindings: literatureEvidenceState.digestFindings || [],
                  aiSummary: aiSummaryMessage ? String(aiSummaryMessage) : null,
                  usedLocusDigest: Boolean(literatureEvidenceState.usedLocusDigest),
                  locusDigest: literatureEvidenceState.locusDigest || null,
                  papers: literatureEvidenceState.papers || [],
                  claims: literatureEvidenceState.aiSupport
                      ? literatureEvidenceState.claims || []
                      : [],
                  excerpts: literatureEvidenceState.aiSupport
                      ? literatureEvidenceState.excerpts || []
                      : [],
                  gaps: literatureEvidenceState.aiSupport
                      ? literatureEvidenceState.gaps || []
                      : [],
                  kg: literatureEvidenceState.aiSupport
                      ? literatureEvidenceState.kg || null
                      : null,
                  exhausted: Boolean(literatureEvidenceState.exhausted),
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
    const geneScores = gp2.geneScores || {};
    const literatureEvidence = gp2.literatureEvidence || null;
    return {
        qtlRows: Array.isArray(qtl.rawRows) ? qtl.rawRows : [],
        qtlSelectedTypes: Array.isArray(qtl.selectedTypes) ? qtl.selectedTypes : [],
        qtlSelectedTissues: Array.isArray(qtl.selectedTissues) ? qtl.selectedTissues : [],
        qtlSelectedGenes: Array.isArray(qtl.selectedGenes) ? qtl.selectedGenes : [],
        qtlDeselectedGenes: Array.isArray(qtl.deselectedGenes) ? qtl.deselectedGenes : [],
        qtlPValueMax: qtl.pValueMax != null ? String(qtl.pValueMax) : "",
        geneScoresRows: Array.isArray(geneScores.rows) ? geneScores.rows : [],
        geneScoresLoadedKey:
            typeof geneScores.loadedKey === "string" && geneScores.loadedKey
                ? geneScores.loadedKey
                : null,
        geneScoresVisibleFields: Array.isArray(geneScores.visibleFields)
            ? geneScores.visibleFields.slice()
            : gp2DefaultGeneScoreVisibleFields(),
        enableAiSupport: Boolean(gp2.enableAiSupport),
        assistantThreadEntries: Array.isArray(gp2.assistant?.threadEntries)
            ? gp2.assistant.threadEntries
            : [],
        aiSummaryMessage:
            (typeof gp2.aiSummaryMessage === "string" && gp2.aiSummaryMessage.trim()) ||
            (typeof literatureEvidence?.aiSummary === "string" &&
                literatureEvidence.aiSummary.trim()) ||
            null,
        literatureEvidenceState: literatureEvidence
            ? (() => {
                  const locusDigest = literatureEvidence.locusDigest || null;
                  const savedGeneReasons = Array.isArray(literatureEvidence.geneReasons)
                      ? literatureEvidence.geneReasons
                      : [];
                  const savedDigestFindings = Array.isArray(literatureEvidence.digestFindings)
                      ? literatureEvidence.digestFindings
                      : [];
                  const plan =
                      locusDigest && !savedGeneReasons.length
                          ? geneSearchPlanFromAiSummaryDigest(locusDigest)
                          : null;
                  const geneReasons = savedGeneReasons.length
                      ? savedGeneReasons
                      : plan?.geneReasons || [];
                  const digestFindings = savedDigestFindings.length
                      ? savedDigestFindings
                      : locusDigest
                        ? describeGp2LocusDigestFindings(locusDigest)
                        : [];
                  return {
                      loading: false,
                      loaded: true,
                      error: null,
                      phenotype: literatureEvidence.phenotype || null,
                      query: literatureEvidence.query || null,
                      genesSearched: Array.isArray(literatureEvidence.genesSearched)
                          ? literatureEvidence.genesSearched
                          : [],
                      variantsSearched: Array.isArray(literatureEvidence.variantsSearched)
                          ? literatureEvidence.variantsSearched
                          : [],
                      highlightTerms: Array.isArray(literatureEvidence.highlightTerms)
                          ? literatureEvidence.highlightTerms
                          : [],
                      aiSupport: Boolean(literatureEvidence.aiSupport),
                      geneReasons,
                      digestFindings,
                      usedLocusDigest: Boolean(literatureEvidence.usedLocusDigest),
                      locusDigest,
                      progressLabel: null,
                      papers: Array.isArray(literatureEvidence.papers)
                          ? literatureEvidence.papers
                          : [],
                      synthesizing: false,
                      synthesisError: null,
                      claims:
                          literatureEvidence.aiSupport &&
                          Array.isArray(literatureEvidence.claims)
                              ? literatureEvidence.claims
                              : [],
                      excerpts:
                          literatureEvidence.aiSupport &&
                          Array.isArray(literatureEvidence.excerpts)
                              ? literatureEvidence.excerpts
                              : [],
                      gaps:
                          literatureEvidence.aiSupport &&
                          Array.isArray(literatureEvidence.gaps)
                              ? literatureEvidence.gaps
                              : [],
                      kg:
                          literatureEvidence.aiSupport &&
                          literatureEvidence.kg &&
                          Array.isArray(literatureEvidence.kg.nodes) &&
                          Array.isArray(literatureEvidence.kg.edges)
                              ? literatureEvidence.kg
                              : null,
                      kgLoading: false,
                      kgError: null,
                      loadingMore: false,
                      loadMoreError: null,
                      exhausted: Boolean(literatureEvidence.exhausted),
                  };
              })()
            : null,
        visibleSectionIds: Array.isArray(gp2.visibleSectionIds) ? gp2.visibleSectionIds : null,
        viewingCenterBp: gp2.viewingCenterBp ?? null,
        viewingRegionWidthBp: gp2.viewingRegionWidthBp ?? null,
    };
}
