import { createFiltersIndex, cloneFiltersIndex } from "./variantSifterAssociationsFilters.js";
import {
    cloneCredibleSetsPanelFilters,
    createCredibleSetsPanelFilters,
} from "./variantSifterCredibleSetsFilters.js";
import { clampRegionZoom, clampRegionViewArea } from "./variantSifterRegionZoom.js";
import { clampRegionZoomOut, regionShiftBpFromLegacyViewArea } from "./variantSifterRegionPan.js";
import { emptyPlotMarkersState } from "./variantSifterPlotMarkers.js";
import { normalizeSelectedGeneTypes, resolveSelectedGeneTypesForData } from "./variantSifterGenesFilter.js";
import {
    normalizeGlobalEnrichmentFromSession,
    snapshotGlobalEnrichmentForExport,
} from "./variantSifterGlobalEnrichmentData.js";
import {
    normalizeV2gFromSession,
    snapshotV2gForExport,
} from "./variantSifterV2gData.js";
import {
    normalizeS2gFromSession,
    snapshotS2gForExport,
} from "./variantSifterS2gData.js";
import {
    normalizeMappingState,
    normalizeWorkspaceMappingFilter,
} from "./variantSifterMappingData.js";
import {
    defaultVisibleSectionIds,
    normalizeVisibleSectionIds,
} from "./variantSifterToolSettings.js";
import { VARIANT_SIFTER_SECTIONS } from "./variantSifterSections.js";
import {
    isGwasCeProject,
    projectAssociationsOnly,
    resolveGwasCeToken,
    VKS_GWAS_CE_TOKEN_REDACTION,
} from "./variantSifterProjects.js";

export const VKS_SESSION_VERSION = 11;
export const VKS_SESSION_APP = "kp-variant-sifter";

const SUPPORTED_SESSION_VERSIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

function emptyPlotOverlaysSnapshot() {
    return {
        recombData: null,
        refVariant: null,
        refVariantUserSet: false,
    };
}

/**
 * Ensure the workspace has finished loading everything visible before export.
 */
export function validateSessionExportReady({
    associationsState,
    genesState,
    plotOverlaysState,
    globalEnrichmentState,
    v2gState,
    s2gState,
    projectId = "",
}) {
    const associationsOnly = projectAssociationsOnly(projectId);

    if (associationsState?.loading) {
        throw new Error("Association data is still loading. Wait before exporting.");
    }
    if (associationsState?.ldLoading) {
        throw new Error("LD scores are still loading. Wait before exporting.");
    }
    if (
        associationsState?.ancestrySeriesLoading &&
        Object.values(associationsState.ancestrySeriesLoading).some(Boolean)
    ) {
        throw new Error("Ancestry association data is still loading. Wait before exporting.");
    }
    if (
        associationsState?.phenotypeSeriesLoading &&
        Object.values(associationsState.phenotypeSeriesLoading).some(Boolean)
    ) {
        throw new Error("Phenotype association data is still loading. Wait before exporting.");
    }
    if (!associationsState?.rows?.length) {
        throw new Error("No association data to export. Wait for data to load first.");
    }
    if (associationsOnly) {
        return;
    }
    if (genesState?.loading) {
        throw new Error("Genes track is still loading. Wait before exporting.");
    }
    if (!genesState?.data?.length) {
        throw new Error(
            "Genes track is not ready. Wait for the genes track to finish loading before exporting."
        );
    }
    if (plotOverlaysState?.loading) {
        throw new Error("Plot overlays are still loading. Wait before exporting.");
    }
    if (globalEnrichmentState?.loading) {
        throw new Error("Global enrichment is still loading. Wait before exporting.");
    }
    if (globalEnrichmentState?.llmRelevance?.loading) {
        throw new Error(
            "Global enrichment tissue filtering is still running. Wait before exporting."
        );
    }
    if (v2gState?.loadingTissue) {
        throw new Error(
            "Variant-to-gene links are still loading. Wait before exporting."
        );
    }
    if (s2gState?.loadingTissue) {
        throw new Error(
            "SNP-to-gene links are still loading. Wait before exporting."
        );
    }
    if (globalEnrichmentState?.biosampleLoading) {
        throw new Error(
            "Selected GE biosample tracks are still loading. Wait before exporting."
        );
    }
}

/**
 * Replace every occurrence of the GWAS-CE token in the export payload.
 */
export function redactGwasCeTokenInPayload(payload, token) {
    const secret = String(token || "").trim();
    if (!secret || !payload || typeof payload !== "object") {
        return payload;
    }
    const redacted = JSON.parse(JSON.stringify(payload));
    const walk = (value) => {
        if (typeof value === "string") {
            return value.split(secret).join(VKS_GWAS_CE_TOKEN_REDACTION);
        }
        if (Array.isArray(value)) {
            return value.map(walk);
        }
        if (value && typeof value === "object") {
            const next = {};
            Object.keys(value).forEach((key) => {
                next[key] = walk(value[key]);
            });
            return next;
        }
        return value;
    };
    return walk(redacted);
}

/**
 * Build a portable JSON snapshot of the Variant Sifter workspace.
 * Includes every data layer needed to restore the current view without API calls.
 */
export function exportVariantSifterSession({
    projectId = "",
    searchSession,
    associationsState,
    genesState = null,
    plotOverlaysState = null,
    plotMarkersState = null,
    credibleSetsState = null,
    globalEnrichmentState = null,
    v2gState = null,
    s2gState = null,
    regionZoom = 0,
    regionZoomOut = 0,
    regionViewArea = 0,
    viewOffsetBp = 0,
    regionShiftBp = viewOffsetBp,
    dataRegion = null,
    openDrawerId = null,
    dataTableOpen = false,
    visibleSectionIds = null,
    mappingState = null,
    workspaceMappingFilter = null,
}) {
    validateSessionExportReady({
        associationsState,
        genesState,
        plotOverlaysState,
        globalEnrichmentState,
        v2gState,
        s2gState,
        projectId,
    });

    if (!searchSession?.phenotype || !searchSession?.region) {
        throw new Error("No active search session to export.");
    }

    const payload = {
        version: VKS_SESSION_VERSION,
        app: VKS_SESSION_APP,
        exportedAt: new Date().toISOString(),
        projectId: projectId || "",
        searchSession: {
            phenotypeName: searchSession.phenotype.name,
            phenotypeDescription: searchSession.phenotype.description || null,
            ancestry: searchSession.ancestry || null,
            region: {
                chr: searchSession.region.chr,
                start: searchSession.region.start,
                end: searchSession.region.end,
            },
            regionLabel: searchSession.regionLabel,
            geneOrVariantQuery: searchSession.geneOrVariantQuery || null,
            regionExpandBp: searchSession.regionExpandBp ?? null,
            gwasCeToken: searchSession.gwasCeToken || null,
        },
        associationsState: {
            rows: stampAssociationRowsPhenotypeForSession(
                associationsState.rows,
                searchSession.phenotype
            ),
            index: associationsState.index,
            query: associationsState.query,
            ldError: associationsState.ldError || null,
            selectedAncestries: [...(associationsState.selectedAncestries || [])],
            selectedPhenotypes: (associationsState.selectedPhenotypes || [])
                .map((entry) => {
                    if (typeof entry === "string") {
                        return {
                            name: entry,
                            description: null,
                            selectedAncestries: [],
                        };
                    }
                    if (!entry?.name) {
                        return null;
                    }
                    return {
                        name: entry.name,
                        description: entry.description || null,
                        selectedAncestries: [
                            ...(entry.selectedAncestries || []),
                        ],
                    };
                })
                .filter(Boolean),
            filtersIndex: cloneFiltersIndex(
                associationsState.filtersIndex || createFiltersIndex()
            ),
        },
        genesTrack: {
            data: genesState.data,
            selectedTypes: normalizeSelectedGeneTypes(genesState.selectedTypes),
        },
        plotOverlays: {
            recombData: plotOverlaysState?.recombData ?? null,
            refVariant: plotOverlaysState?.refVariant ?? null,
            refVariantUserSet: Boolean(plotOverlaysState?.refVariantUserSet),
        },
        plotMarkers: {
            starredVariants: plotMarkersState?.starredVariants ?? [],
            positionMarkers: plotMarkersState?.positionMarkers ?? [],
        },
        credibleSets: credibleSetsState
            ? {
                  available: credibleSetsState.available ?? [],
                  selectedIds: credibleSetsState.selectedIds ?? [],
                  variantsBySet: credibleSetsState.variantsBySet ?? {},
                  panelFilters: cloneCredibleSetsPanelFilters(
                      credibleSetsState.panelFilters
                  ),
              }
            : null,
        globalEnrichment: snapshotGlobalEnrichmentForExport(globalEnrichmentState),
        variantToGene: snapshotV2gForExport(v2gState),
        snp2Gene: snapshotS2gForExport(s2gState),
        ui: {
            regionZoom,
            regionZoomOut,
            regionViewArea,
            viewOffsetBp: regionShiftBp,
            regionShiftBp,
            dataRegion: dataRegion
                ? {
                      chr: dataRegion.chr,
                      start: Number(dataRegion.start),
                      end: Number(dataRegion.end),
                  }
                : null,
            openDrawerId,
            dataTableOpen: Boolean(dataTableOpen),
            visibleSectionIds: normalizeVisibleSectionIds(
                visibleSectionIds,
                VARIANT_SIFTER_SECTIONS
            ),
            mapping: normalizeMappingState(mappingState),
            workspaceMappingFilter:
                normalizeWorkspaceMappingFilter(workspaceMappingFilter),
        },
    };

    if (isGwasCeProject(projectId)) {
        return redactGwasCeTokenInPayload(
            payload,
            resolveGwasCeToken(searchSession)
        );
    }
    return payload;
}

function sanitizeFilenamePart(value, fallback) {
    const text = String(value ?? "").trim();
    if (!text) {
        return fallback;
    }
    return text.replace(/[^\w.-]+/g, "_");
}

/**
 * Untagged association rows become the primary phenotype so multi-phenotype
 * plots/filters keep working after import (including older session files).
 */
export function stampAssociationRowsPhenotypeForSession(
    rows,
    primaryPhenotype = null
) {
    const primaryName = String(primaryPhenotype?.name || "").trim();
    const primaryLabel =
        String(primaryPhenotype?.description || "").trim() || primaryName;
    return (Array.isArray(rows) ? rows : []).map((row) => {
        if (!row || typeof row !== "object") {
            return row;
        }
        const key = String(row.PhenotypeKey || "").trim();
        const label = String(row.Phenotype || row.PhenotypeLabel || "").trim();
        if (key) {
            return {
                ...row,
                Phenotype: row.Phenotype || row.PhenotypeLabel || key,
                PhenotypeLabel: row.PhenotypeLabel || row.Phenotype || key,
            };
        }
        if (label) {
            const resolvedKey =
                primaryName &&
                (label === primaryName || label === primaryLabel)
                    ? primaryName
                    : label;
            return {
                ...row,
                PhenotypeKey: resolvedKey,
                Phenotype: label,
                PhenotypeLabel: row.PhenotypeLabel || label,
            };
        }
        if (!primaryName) {
            return row;
        }
        return {
            ...row,
            PhenotypeKey: primaryName,
            Phenotype: primaryLabel || primaryName,
            PhenotypeLabel: primaryLabel || primaryName,
        };
    });
}

function associationRowPhenotypeName(row) {
    return String(row?.PhenotypeKey || row?.Phenotype || "").trim();
}

function inferSelectedAncestriesForPhenotype(
    rows,
    phenotypeName,
    primaryAncestry = "Mixed"
) {
    const target = String(phenotypeName || "").trim();
    const primary = primaryAncestry || "Mixed";
    const codes = new Set();
    (rows || []).forEach((row) => {
        if (associationRowPhenotypeName(row) !== target) {
            return;
        }
        const ancestry = String(row?.Ancestry || "").trim();
        if (ancestry && ancestry !== primary && ancestry !== "Mixed") {
            codes.add(ancestry);
        }
    });
    return Array.from(codes);
}

/**
 * Prefer exported selectedPhenotypes; otherwise infer additive phenotypes from
 * association row PhenotypeKey values (backward-compatible with older sessions).
 */
export function normalizeSelectedPhenotypesForSession(
    exportedSelectedPhenotypes,
    rows,
    primaryPhenotypeName,
    primaryAncestry = "Mixed"
) {
    const primaryName = String(primaryPhenotypeName || "").trim();
    const fromExport = Array.isArray(exportedSelectedPhenotypes)
        ? exportedSelectedPhenotypes
              .map((entry) => {
                  if (typeof entry === "string") {
                      return {
                          name: entry,
                          description: null,
                          selectedAncestries: [],
                      };
                  }
                  if (!entry?.name || entry.name === primaryName) {
                      return null;
                  }
                  return {
                      name: entry.name,
                      description: entry.description || null,
                      selectedAncestries: Array.isArray(entry.selectedAncestries)
                          ? entry.selectedAncestries.filter(
                                (code) => code && code !== primaryAncestry
                            )
                          : [],
                  };
              })
              .filter(Boolean)
        : [];

    const byName = new Map();
    fromExport.forEach((entry) => {
        byName.set(entry.name, entry);
    });

    (rows || []).forEach((row) => {
        const name = associationRowPhenotypeName(row);
        if (!name || name === primaryName || byName.has(name)) {
            return;
        }
        byName.set(name, {
            name,
            description: String(row.PhenotypeLabel || row.Phenotype || "").trim() || null,
            selectedAncestries: [],
        });
    });

    return Array.from(byName.values()).map((entry) => {
        const inferred = inferSelectedAncestriesForPhenotype(
            rows,
            entry.name,
            primaryAncestry
        );
        const selectedAncestries =
            entry.selectedAncestries?.length > 0
                ? entry.selectedAncestries
                : inferred;
        return {
            name: entry.name,
            description: entry.description || null,
            selectedAncestries,
        };
    });
}

export function buildSessionExportFilename(searchSession, { projectId } = {}) {
    const traitId = isGwasCeProject(projectId)
        ? `GWAS-CE_${sanitizeFilenamePart(searchSession?.phenotype?.name, "session")}`
        : sanitizeFilenamePart(searchSession?.phenotype?.name, "session");
    const ancestry = sanitizeFilenamePart(
        searchSession?.ancestry || "Mixed",
        "Mixed"
    );
    const region = sanitizeFilenamePart(searchSession?.regionLabel, "locus");
    return normalizeExportFilename(`${traitId}_${ancestry}_${region}.json`);
}

export function normalizeExportFilename(filename) {
    let name = String(filename || "").trim();
    if (!name) {
        return "vks-session-export.json";
    }
    name = name.replace(/[/\\]/g, "_");
    if (!name.toLowerCase().endsWith(".json")) {
        name += ".json";
    }
    return name;
}

/**
 * Save JSON via system save dialog when supported, else download to Downloads.
 */
export async function saveJsonBundle(filename, data) {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const resolvedFilename = normalizeExportFilename(filename);

    if (
        typeof window !== "undefined" &&
        typeof window.showSaveFilePicker === "function"
    ) {
        try {
            const handle = await window.showSaveFilePicker({
                suggestedName: resolvedFilename,
                types: [
                    {
                        description: "JSON",
                        accept: { "application/json": [".json"] },
                    },
                ],
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            return {
                ok: true,
                filename: handle.name || resolvedFilename,
                usedSavePicker: true,
            };
        } catch (error) {
            if (error?.name === "AbortError") {
                return { ok: false, reason: "cancelled" };
            }
        }
    }

    if (typeof document === "undefined") {
        return { ok: false, reason: "no_document" };
    }

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = resolvedFilename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    return { ok: true, filename: resolvedFilename, usedSavePicker: false };
}

export function countActiveAssociationFilters(filtersIndex) {
    if (!filtersIndex) {
        return 0;
    }
    return Object.values(filtersIndex).reduce(
        (count, filter) => count + (filter.search?.length || 0),
        0
    );
}

function resolvePhenotype(exported, phenotypes) {
    const name = exported?.phenotypeName;
    if (!name) {
        throw new Error("Session file is missing phenotypeName.");
    }

    const match = (phenotypes || []).find((entry) => entry.name === name);
    if (match) {
        return match;
    }

    return {
        name,
        description: exported.phenotypeDescription || name,
    };
}

function normalizeFiltersIndex(filtersIndex) {
    if (!filtersIndex || typeof filtersIndex !== "object") {
        return createFiltersIndex();
    }
    return cloneFiltersIndex(filtersIndex);
}

function normalizePlotMarkersState(payload) {
    const exported = payload?.plotMarkers;
    if (!exported) {
        return emptyPlotMarkersState();
    }
    return {
        starredVariants: Array.isArray(exported.starredVariants)
            ? exported.starredVariants
            : [],
        positionMarkers: Array.isArray(exported.positionMarkers)
            ? exported.positionMarkers
            : [],
    };
}

function normalizePlotOverlaysState(payload) {
    const exported = payload?.plotOverlays || emptyPlotOverlaysSnapshot();
    return {
        ready: true,
        loading: false,
        error: null,
        recombData: exported.recombData ?? null,
        refVariant: exported.refVariant ?? null,
        refVariantUserSet: Boolean(exported.refVariantUserSet),
    };
}

function normalizeGenesState(payload) {
    const exportedGenes = payload?.genesTrack?.data;
    return {
        ready: true,
        loading: false,
        error:
            Array.isArray(exportedGenes) && exportedGenes.length
                ? null
                : "Session file did not include genes track data.",
        data: Array.isArray(exportedGenes) && exportedGenes.length ? exportedGenes : null,
        selectedTypes: resolveSelectedGeneTypesForData(
            payload?.genesTrack?.selectedTypes,
            exportedGenes
        ),
    };
}

function normalizeCredibleSetsState(payload) {
    const exported = payload?.credibleSets;
    if (!exported) {
        return {
            listLoading: false,
            listError: null,
            available: [],
            selectedIds: [],
            variantsBySet: {},
            variantsLoading: false,
            variantsError: null,
            panelFilters: createCredibleSetsPanelFilters(),
        };
    }
    return {
        listLoading: false,
        listError: null,
        available: Array.isArray(exported.available) ? exported.available : [],
        selectedIds: Array.isArray(exported.selectedIds) ? exported.selectedIds : [],
        variantsBySet:
            exported.variantsBySet && typeof exported.variantsBySet === "object"
                ? exported.variantsBySet
                : {},
        variantsLoading: false,
        variantsError: null,
        panelFilters: cloneCredibleSetsPanelFilters(exported.panelFilters),
    };
}

/**
 * Restore workspace state from an exported session file payload.
 * Does not require network access when the export includes all snapshot fields.
 */
export function importVariantSifterSession(payload, phenotypes = []) {
    if (!payload || typeof payload !== "object") {
        throw new Error("Session file is empty or invalid.");
    }
    if (payload.app !== VKS_SESSION_APP) {
        throw new Error("This file is not a Variant Sifter session export.");
    }
    if (!SUPPORTED_SESSION_VERSIONS.includes(payload.version)) {
        throw new Error(
            `Unsupported session version (${payload.version}). Expected ${SUPPORTED_SESSION_VERSIONS.join(" or ")}.`
        );
    }

    const exportedSearch = payload.searchSession;
    const exportedAssociations = payload.associationsState;

    if (!exportedSearch?.region) {
        throw new Error("Session file is missing search region.");
    }
    if (!Array.isArray(exportedAssociations?.rows) || !exportedAssociations.rows.length) {
        throw new Error("Session file is missing association rows.");
    }

    const searchSession = {
        phenotype: resolvePhenotype(exportedSearch, phenotypes),
        ancestry: exportedSearch.ancestry || null,
        region: {
            chr: exportedSearch.region.chr,
            start: Number(exportedSearch.region.start),
            end: Number(exportedSearch.region.end),
        },
        regionLabel: exportedSearch.regionLabel,
        geneOrVariantQuery: exportedSearch.geneOrVariantQuery || exportedSearch.regionLabel,
        regionExpandBp: exportedSearch.regionExpandBp ?? null,
        gwasCeToken: exportedSearch.gwasCeToken || null,
    };

    const primaryAncestry = searchSession.ancestry || "Mixed";
    const primaryPhenotypeName = searchSession.phenotype?.name || null;
    const stampedRows = stampAssociationRowsPhenotypeForSession(
        exportedAssociations.rows,
        searchSession.phenotype
    );
    const inferredSelectedAncestries = inferSelectedAncestriesForPhenotype(
        stampedRows,
        primaryPhenotypeName,
        primaryAncestry
    );
    const selectedAncestries = Array.isArray(exportedAssociations.selectedAncestries)
        ? exportedAssociations.selectedAncestries.filter(
              (code) => code && code !== primaryAncestry
          )
        : inferredSelectedAncestries;
    const selectedPhenotypes = normalizeSelectedPhenotypesForSession(
        exportedAssociations.selectedPhenotypes,
        stampedRows,
        primaryPhenotypeName,
        primaryAncestry
    ).map((entry) => {
        const match = (phenotypes || []).find((p) => p.name === entry.name);
        return {
            ...entry,
            description: entry.description || match?.description || null,
        };
    });

    const associationsState = {
        loading: false,
        ldLoading: false,
        error: null,
        ldError: exportedAssociations.ldError || null,
        rows: stampedRows,
        index: exportedAssociations.index ?? null,
        query: exportedAssociations.query ?? null,
        filtersIndex: normalizeFiltersIndex(exportedAssociations.filtersIndex),
        ancestryAvailability: [],
        ancestryAvailabilityByPhenotype: {},
        ancestryAvailabilityLoading: false,
        ancestryAvailabilityLoadingByPhenotype: {},
        ancestryAvailabilityError: null,
        ancestryAvailabilityErrorByPhenotype: {},
        selectedAncestries,
        ancestrySeriesLoading: {},
        ancestrySeriesErrors: {},
        selectedPhenotypes,
        phenotypeSeriesLoading: {},
        phenotypeSeriesErrors: {},
    };

    const ui = payload.ui || {};
    const regionZoom =
        typeof ui.regionZoom === "number" ? clampRegionZoom(ui.regionZoom) : 0;
    const regionZoomOut =
        typeof ui.regionZoomOut === "number" ? clampRegionZoomOut(ui.regionZoomOut) : 0;
    const regionViewArea =
        typeof ui.regionViewArea === "number"
            ? clampRegionViewArea(ui.regionViewArea)
            : 0;
    const regionShiftBp =
        typeof ui.regionShiftBp === "number"
            ? ui.regionShiftBp
            : typeof ui.viewOffsetBp === "number"
            ? ui.viewOffsetBp
            : regionShiftBpFromLegacyViewArea(
                  searchSession.region,
                  regionZoom,
                  regionViewArea
              );
    const dataRegion =
        ui.dataRegion?.chr != null
            ? {
                  chr: ui.dataRegion.chr,
                  start: Number(ui.dataRegion.start),
                  end: Number(ui.dataRegion.end),
              }
            : { ...searchSession.region };

    return {
        projectId: payload.projectId || "",
        searchSession,
        associationsState,
        genesState: normalizeGenesState(payload),
        plotOverlaysState: normalizePlotOverlaysState(payload),
        plotMarkersState: normalizePlotMarkersState(payload),
        credibleSetsState: normalizeCredibleSetsState(payload),
        globalEnrichmentState: normalizeGlobalEnrichmentFromSession(payload.globalEnrichment),
        v2gState: normalizeV2gFromSession(payload.variantToGene),
        s2gState: normalizeS2gFromSession(payload.snp2Gene),
        regionZoom,
        regionZoomOut,
        regionViewArea,
        regionShiftBp,
        viewOffsetBp: regionShiftBp,
        dataRegion,
        openDrawerId: ui.openDrawerId ?? null,
        dataTableOpen: Boolean(ui.dataTableOpen),
        visibleSectionIds: Array.isArray(ui.visibleSectionIds)
            ? normalizeVisibleSectionIds(ui.visibleSectionIds, VARIANT_SIFTER_SECTIONS)
            : defaultVisibleSectionIds(VARIANT_SIFTER_SECTIONS),
        mappingState: normalizeMappingState(ui.mapping || payload.mapping),
        workspaceMappingFilter: normalizeWorkspaceMappingFilter(
            ui.workspaceMappingFilter || payload.workspaceMappingFilter
        ),
        importedFromSnapshot: true,
    };
}

export function readSessionFile(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error("No file selected."));
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            try {
                const payload = JSON.parse(String(reader.result));
                resolve(payload);
            } catch (error) {
                reject(new Error("Session file is not valid JSON."));
            }
        };
        reader.onerror = () => {
            reject(new Error("Could not read session file."));
        };
        reader.readAsText(file);
    });
}
