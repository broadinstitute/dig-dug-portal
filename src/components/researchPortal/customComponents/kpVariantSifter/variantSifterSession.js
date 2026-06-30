import { createFiltersIndex, cloneFiltersIndex } from "./variantSifterAssociationsFilters.js";
import { clampRegionZoom, clampRegionViewArea } from "./variantSifterRegionZoom.js";
import { regionShiftBpFromLegacyViewArea } from "./variantSifterRegionPan.js";
import { emptyPlotMarkersState } from "./variantSifterPlotMarkers.js";

export const VKS_SESSION_VERSION = 4;
export const VKS_SESSION_APP = "kp-variant-sifter";

const SUPPORTED_SESSION_VERSIONS = [1, 2, 3, 4];

function emptyPlotOverlaysSnapshot() {
    return {
        recombData: null,
        refVariant: null,
    };
}

/**
 * Ensure the workspace has finished loading everything visible before export.
 */
export function validateSessionExportReady({
    associationsState,
    genesState,
    plotOverlaysState,
}) {
    if (associationsState?.loading) {
        throw new Error("Association data is still loading. Wait before exporting.");
    }
    if (associationsState?.ldLoading) {
        throw new Error("LD scores are still loading. Wait before exporting.");
    }
    if (!associationsState?.rows?.length) {
        throw new Error("No association data to export. Wait for data to load first.");
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
}

/**
 * Build a portable JSON snapshot of the Variant Sifter workspace.
 * Includes every data layer needed to restore the current view without API calls.
 */
export function exportVariantSifterSession({
    searchSession,
    associationsState,
    genesState = null,
    plotOverlaysState = null,
    plotMarkersState = null,
    regionZoom = 0,
    regionViewArea = 0,
    viewOffsetBp = 0,
    regionShiftBp = viewOffsetBp,
    dataRegion = null,
    openDrawerId = null,
    dataTableOpen = false,
}) {
    validateSessionExportReady({
        associationsState,
        genesState,
        plotOverlaysState,
    });

    if (!searchSession?.phenotype || !searchSession?.region) {
        throw new Error("No active search session to export.");
    }

    return {
        version: VKS_SESSION_VERSION,
        app: VKS_SESSION_APP,
        exportedAt: new Date().toISOString(),
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
        },
        associationsState: {
            rows: associationsState.rows,
            index: associationsState.index,
            query: associationsState.query,
            ldError: associationsState.ldError || null,
            filtersIndex: cloneFiltersIndex(
                associationsState.filtersIndex || createFiltersIndex()
            ),
        },
        genesTrack: {
            data: genesState.data,
        },
        plotOverlays: {
            recombData: plotOverlaysState?.recombData ?? null,
            refVariant: plotOverlaysState?.refVariant ?? null,
        },
        plotMarkers: {
            starredVariants: plotMarkersState?.starredVariants ?? [],
            positionMarkers: plotMarkersState?.positionMarkers ?? [],
        },
        ui: {
            regionZoom,
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
        },
    };
}

function sanitizeFilenamePart(value, fallback) {
    const text = String(value ?? "").trim();
    if (!text) {
        return fallback;
    }
    return text.replace(/[^\w.-]+/g, "_");
}

export function buildSessionExportFilename(searchSession) {
    const traitId = sanitizeFilenamePart(searchSession?.phenotype?.name, "session");
    const ancestry = sanitizeFilenamePart(searchSession?.ancestry || "Mixed", "Mixed");
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
    };

    const associationsState = {
        loading: false,
        ldLoading: false,
        error: null,
        ldError: exportedAssociations.ldError || null,
        rows: exportedAssociations.rows,
        index: exportedAssociations.index ?? null,
        query: exportedAssociations.query ?? null,
        filtersIndex: normalizeFiltersIndex(exportedAssociations.filtersIndex),
    };

    const ui = payload.ui || {};
    const regionZoom =
        typeof ui.regionZoom === "number" ? clampRegionZoom(ui.regionZoom) : 0;
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
        searchSession,
        associationsState,
        genesState: normalizeGenesState(payload),
        plotOverlaysState: normalizePlotOverlaysState(payload),
        plotMarkersState: normalizePlotMarkersState(payload),
        regionZoom,
        regionViewArea,
        regionShiftBp,
        viewOffsetBp: regionShiftBp,
        dataRegion,
        openDrawerId: ui.openDrawerId ?? null,
        dataTableOpen: Boolean(ui.dataTableOpen),
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
