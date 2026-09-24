import userUtils from "@/utils/userUtils";

/**
 * Biomarker network session import/export (JSON file).
 * Mirrors the REVEAL multi-query / Canvas pattern: dump restoreable UI state
 * to a versioned JSON document, then reset and rehydrate on import.
 */

export const BIOMARKER_SESSION_KIND = "biomarker-network-session";
/** v6: full reverse (biomarker→CFDE) session fields + accordion / AI summary state. */
export const BIOMARKER_SESSION_SCHEMA_VERSION = 6;

function cloneJson(value, fallback) {
    try {
        return JSON.parse(JSON.stringify(value));
    } catch (e) {
        return fallback;
    }
}

function slugFromLabel(label) {
    return String(label || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 48);
}

/** Skip in-flight "loading" placeholders; only persist finished gene lists. */
function serializeDiseaseGenes(diseaseGenes) {
    const out = {};
    Object.keys(diseaseGenes || {}).forEach((key) => {
        const value = diseaseGenes[key];
        if (Array.isArray(value)) out[key] = cloneJson(value, []);
    });
    return out;
}

function idleSummary() {
    return {
        status: "idle",
        data: null,
        error: "",
        rowCount: 0,
        generatedAt: null,
    };
}

function serializeMechanismLinkSummary(summary) {
    const entry = summary || {};
    if (entry.status !== "done" || !entry.data || typeof entry.data !== "object") {
        return idleSummary();
    }
    return {
        status: "done",
        data: cloneJson(entry.data, null),
        error: "",
        rowCount: Number(entry.rowCount) || 0,
        generatedAt: entry.generatedAt ? String(entry.generatedAt) : null,
    };
}

function isReverseDirection(vmOrDirection) {
    const value =
        typeof vmOrDirection === "string"
            ? vmOrDirection
            : (vmOrDirection && vmOrDirection.searchDirection) || "";
    return value === "biomarker-to-cfde";
}

function reverseSessionLabel(vm) {
    return String(
        (vm &&
            ((vm.reverseResolved && vm.reverseResolved.needle) ||
                vm.reverseUserQuery)) ||
            ""
    ).trim();
}

export function sessionHasExportableContent(vm) {
    if (!vm) return false;
    if (isReverseDirection(vm)) {
        if (vm.reverseResolved && vm.reverseResolved.found) return true;
        if (vm.reverseAssociatedDiseases && vm.reverseAssociatedDiseases.length) return true;
        if (vm.reverseMechanisms && vm.reverseMechanisms.length) return true;
        if (
            vm.reverseMechanismLinkSummary &&
            vm.reverseMechanismLinkSummary.status === "done"
        ) {
            return true;
        }
        return !!(vm.reverseUserQuery && String(vm.reverseUserQuery).trim());
    }
    if (vm.searched) return true;
    if ((vm.rows && vm.rows.length) || (vm.associatedDiseases && vm.associatedDiseases.length)) {
        return true;
    }
    if (vm.mechanismLinkSummary && vm.mechanismLinkSummary.status === "done") return true;
    return Object.keys(vm.geneRegistry || {}).length > 0;
}

export function defaultSessionExportFilename(vm) {
    const stamp = new Date().toISOString().slice(0, 10);
    const label = isReverseDirection(vm)
        ? reverseSessionLabel(vm)
        : vm && (vm.searchedFactorLabel || vm.lastNeedle || vm.userQuery);
    const slug = slugFromLabel(label) || "session";
    const prefix = isReverseDirection(vm)
        ? "biomarker-network-reverse"
        : "biomarker-network";
    return `${prefix}-${slug}-${stamp}.json`;
}

export function buildBiomarkerSessionExport(vm) {
    const reverse = isReverseDirection(vm);
    return {
        kind: BIOMARKER_SESSION_KIND,
        schemaVersion: BIOMARKER_SESSION_SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
        label: reverse
            ? reverseSessionLabel(vm)
            : String((vm && (vm.searchedFactorLabel || vm.lastNeedle || vm.userQuery)) || ""),
        session: {
            searchDirection: reverse ? "biomarker-to-cfde" : "cfde-to-biomarker",
            userQuery: String((vm && vm.userQuery) || ""),
            searchNeedle: String((vm && vm.searchNeedle) || ""),
            lastNeedle: String((vm && vm.lastNeedle) || ""),
            searchedFactorLabel: String((vm && vm.searchedFactorLabel) || ""),
            selectedFactorIri: String((vm && vm.selectedFactorIri) || ""),
            selectedFactorId:
                vm && vm.selectedFactorId != null && Number.isFinite(Number(vm.selectedFactorId))
                    ? Number(vm.selectedFactorId)
                    : null,
            searched: !!(vm && vm.searched),
            biomarkersFetched: !!(vm && vm.biomarkersFetched),
            counts: cloneJson((vm && vm.counts) || null, null),
            rows: cloneJson((vm && vm.rows) || [], []),
            associatedDiseases: cloneJson((vm && vm.associatedDiseases) || [], []),
            selectedDiseaseIds: cloneJson((vm && vm.selectedDiseaseIds) || {}, {}),
            fetchLimit: Number((vm && vm.fetchLimit) || 0),
            truncatedFetch: !!(vm && vm.truncatedFetch),
            currentPage: Number((vm && vm.currentPage) || 1),
            mechanismPage: Number((vm && vm.mechanismPage) || 1),
            hiddenTypes: cloneJson((vm && vm.hiddenTypes) || {}, {}),
            hiddenDiseases: cloneJson((vm && vm.hiddenDiseases) || {}, {}),
            mappedGeneOverlapFilter: !!(vm && vm.mappedGeneOverlapFilter),
            diseasesAccordionOpen: vm && vm.diseasesAccordionOpen !== false,
            mechanismAccordionOpen: vm && vm.mechanismAccordionOpen !== false,
            biomarkersAccordionOpen: !!(vm && vm.biomarkersAccordionOpen),
            expandedDiseases: cloneJson((vm && vm.expandedDiseases) || {}, {}),
            diseaseGenes: serializeDiseaseGenes(vm && vm.diseaseGenes),
            geneRegistry: cloneJson((vm && vm.geneRegistry) || {}, {}),
            mechanismLinkSummary: serializeMechanismLinkSummary(vm && vm.mechanismLinkSummary),
            mechanismLinkAccordionOpen: !!(vm && vm.mechanismLinkAccordionOpen),
            reverseUserQuery: String((vm && vm.reverseUserQuery) || ""),
            reverseAssociatedDiseases: cloneJson((vm && vm.reverseAssociatedDiseases) || [], []),
            reverseSelectedDiseaseIds: cloneJson((vm && vm.reverseSelectedDiseaseIds) || {}, {}),
            reverseDiseasePage: Number((vm && vm.reverseDiseasePage) || 1),
            reverseMechanisms: cloneJson((vm && vm.reverseMechanisms) || [], []),
            reverseSeedGenes: cloneJson((vm && vm.reverseSeedGenes) || [], []),
            reverseMechanismPage: Number((vm && vm.reverseMechanismPage) || 1),
            reverseResolved: cloneJson((vm && vm.reverseResolved) || null, null),
            reverseBiomarkerAccordionOpen: vm && vm.reverseBiomarkerAccordionOpen !== false,
            reverseDiseasesAccordionOpen: !!(vm && vm.reverseDiseasesAccordionOpen),
            reverseMechanismsAccordionOpen: !!(vm && vm.reverseMechanismsAccordionOpen),
            reverseAiAccordionOpen: !!(vm && vm.reverseAiAccordionOpen),
            reverseMechanismLinkSummary: serializeMechanismLinkSummary(
                vm && vm.reverseMechanismLinkSummary
            ),
            reverseHiddenDiseases: cloneJson((vm && vm.reverseHiddenDiseases) || {}, {}),
        },
    };
}

export function triggerSessionDownload(filename, payload) {
    const resolvedFilename = userUtils.normalizeExportFilename(
        filename || "biomarker-network-session.json"
    );
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json;charset=utf-8",
    });
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

/**
 * Prefer the File System Access save dialog (folder + name). Fall back to a
 * normal browser download when the picker is unavailable or fails.
 */
async function saveSessionPayload(filename, payload) {
    const resolvedFilename = userUtils.normalizeExportFilename(
        filename || "biomarker-network-session.json"
    );
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
    });

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
            if (error && error.name === "AbortError") {
                return { ok: false, reason: "cancelled" };
            }
            // Fall through to anchor download on unexpected picker errors.
        }
    }

    return triggerSessionDownload(resolvedFilename, payload);
}

export async function exportBiomarkerSession(vm, { filename } = {}) {
    if (!sessionHasExportableContent(vm)) {
        return { ok: false, reason: "empty" };
    }
    const payload = buildBiomarkerSessionExport(vm);
    const resolvedFilename =
        filename || defaultSessionExportFilename(vm) || "biomarker-network-session.json";
    const saveResult = await saveSessionPayload(resolvedFilename, payload);
    if (!saveResult.ok) return saveResult;
    return {
        ok: true,
        filename: saveResult.filename,
        usedSavePicker: !!saveResult.usedSavePicker,
        payload,
        label: payload.label,
    };
}

function readFileText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Could not read the selected file."));
        reader.readAsText(file);
    });
}

export async function parseBiomarkerSessionImportFile(file) {
    if (!file) throw new Error("No file selected.");
    const text = await readFileText(file);
    let parsed;
    try {
        parsed = JSON.parse(text);
    } catch (e) {
        throw new Error("Invalid JSON file.");
    }
    if (!parsed || parsed.kind !== BIOMARKER_SESSION_KIND) {
        throw new Error("Not a biomarker network session file.");
    }
    if (!parsed.session || typeof parsed.session !== "object") {
        throw new Error("Session file is missing session data.");
    }
    return parsed;
}

function assign(vm, key, value) {
    if (vm && typeof vm.$set === "function") {
        vm.$set(vm, key, value);
    } else if (vm) {
        vm[key] = value;
    }
}

/**
 * Apply an imported session after the caller has already reset the UI.
 * Restores full search/results/filter/accordion state from the export payload.
 */
export function applyBiomarkerSessionImport(vm, payload, { setKeyParams } = {}) {
    const session = (payload && payload.session) || {};
    const factorIri = String(session.selectedFactorIri || "");
    const factorId =
        session.selectedFactorId != null && Number.isFinite(Number(session.selectedFactorId))
            ? Number(session.selectedFactorId)
            : null;
    const reverse = isReverseDirection(session.searchDirection);

    assign(
        vm,
        "searchDirection",
        reverse ? "biomarker-to-cfde" : "cfde-to-biomarker"
    );
    assign(vm, "userQuery", String(session.userQuery || ""));
    assign(vm, "searchNeedle", String(session.searchNeedle || session.userQuery || ""));
    assign(vm, "lastNeedle", String(session.lastNeedle || ""));
    assign(vm, "searchedFactorLabel", String(session.searchedFactorLabel || ""));
    assign(vm, "selectedFactorIri", factorIri);
    assign(vm, "selectedFactorId", factorId);
    assign(vm, "searched", session.searched !== false);
    assign(
        vm,
        "biomarkersFetched",
        session.biomarkersFetched != null
            ? !!session.biomarkersFetched
            : Array.isArray(session.rows) && session.rows.length > 0
    );
    assign(vm, "counts", cloneJson(session.counts, null));
    assign(vm, "rows", cloneJson(session.rows, []));
    assign(vm, "associatedDiseases", cloneJson(session.associatedDiseases, []));
    const selectedDiseaseIds = cloneJson(session.selectedDiseaseIds, {});
    if (
        (!selectedDiseaseIds || !Object.keys(selectedDiseaseIds).length) &&
        Array.isArray(session.associatedDiseases)
    ) {
        session.associatedDiseases.forEach((d) => {
            if (d && d.disease) selectedDiseaseIds[d.disease] = true;
        });
    }
    assign(vm, "selectedDiseaseIds", selectedDiseaseIds);
    assign(vm, "fetchLimit", Number(session.fetchLimit) || 0);
    assign(vm, "truncatedFetch", !!session.truncatedFetch);
    assign(vm, "currentPage", Math.max(1, Number(session.currentPage) || 1));
    assign(vm, "mechanismPage", Math.max(1, Number(session.mechanismPage) || 1));
    assign(vm, "hiddenTypes", cloneJson(session.hiddenTypes, {}));
    assign(vm, "hiddenDiseases", cloneJson(session.hiddenDiseases, {}));
    assign(vm, "mappedGeneOverlapFilter", !!session.mappedGeneOverlapFilter);
    assign(vm, "diseasesAccordionOpen", session.diseasesAccordionOpen !== false);
    assign(
        vm,
        "mechanismAccordionOpen",
        session.mechanismAccordionOpen != null
            ? !!session.mechanismAccordionOpen
            : !session.searched
    );
    assign(
        vm,
        "biomarkersAccordionOpen",
        session.biomarkersAccordionOpen != null
            ? !!session.biomarkersAccordionOpen
            : session.activeTab === "biomarkers"
    );
    assign(vm, "expandedDiseases", cloneJson(session.expandedDiseases, {}));
    assign(vm, "diseaseGenes", serializeDiseaseGenes(session.diseaseGenes));
    assign(vm, "geneRegistry", cloneJson(session.geneRegistry, {}));
    assign(
        vm,
        "mechanismLinkSummary",
        session.mechanismLinkSummary
            ? serializeMechanismLinkSummary(session.mechanismLinkSummary)
            : idleSummary()
    );
    assign(vm, "mechanismLinkAccordionOpen", !!session.mechanismLinkAccordionOpen);

    assign(vm, "reverseUserQuery", String(session.reverseUserQuery || ""));
    assign(
        vm,
        "reverseAssociatedDiseases",
        cloneJson(session.reverseAssociatedDiseases, [])
    );
    const reverseSelectedDiseaseIds = cloneJson(session.reverseSelectedDiseaseIds, {});
    if (
        (!reverseSelectedDiseaseIds || !Object.keys(reverseSelectedDiseaseIds).length) &&
        Array.isArray(session.reverseAssociatedDiseases)
    ) {
        session.reverseAssociatedDiseases.forEach((d) => {
            if (d && d.disease) reverseSelectedDiseaseIds[d.disease] = true;
        });
    }
    assign(vm, "reverseSelectedDiseaseIds", reverseSelectedDiseaseIds);
    assign(vm, "reverseDiseasePage", Math.max(1, Number(session.reverseDiseasePage) || 1));
    assign(vm, "reverseMechanisms", cloneJson(session.reverseMechanisms, []));
    assign(vm, "reverseSeedGenes", cloneJson(session.reverseSeedGenes, []));
    assign(
        vm,
        "reverseMechanismPage",
        Math.max(1, Number(session.reverseMechanismPage) || 1)
    );
    assign(vm, "reverseResolved", cloneJson(session.reverseResolved, null));
    assign(
        vm,
        "reverseBiomarkerAccordionOpen",
        session.reverseBiomarkerAccordionOpen != null
            ? !!session.reverseBiomarkerAccordionOpen
            : !session.reverseResolved
    );
    assign(
        vm,
        "reverseDiseasesAccordionOpen",
        session.reverseDiseasesAccordionOpen != null
            ? !!session.reverseDiseasesAccordionOpen
            : !!(session.reverseAssociatedDiseases && session.reverseAssociatedDiseases.length)
    );
    assign(
        vm,
        "reverseMechanismsAccordionOpen",
        session.reverseMechanismsAccordionOpen != null
            ? !!session.reverseMechanismsAccordionOpen
            : !!(session.reverseMechanisms && session.reverseMechanisms.length)
    );
    assign(vm, "reverseAiAccordionOpen", !!session.reverseAiAccordionOpen);
    assign(
        vm,
        "reverseMechanismLinkSummary",
        session.reverseMechanismLinkSummary
            ? serializeMechanismLinkSummary(session.reverseMechanismLinkSummary)
            : idleSummary()
    );
    assign(vm, "reverseHiddenDiseases", cloneJson(session.reverseHiddenDiseases, {}));
    assign(vm, "reverseLoading", false);
    assign(vm, "reverseLoadingMessage", "");
    assign(vm, "reverseMechanismLoading", false);
    assign(vm, "reverseMechanismLoadingMessage", "");
    assign(vm, "reverseMechanismLinkLoading", false);
    assign(vm, "reverseMechanismLinkStatus", "");

    assign(vm, "loading", false);
    assign(vm, "biomarkerLoading", false);
    assign(vm, "loadingMessage", "");
    assign(vm, "error", "");

    if (typeof setKeyParams === "function") {
        const biomarkerNeedle = reverse
            ? String(
                  (session.reverseResolved && session.reverseResolved.needle) ||
                      session.reverseUserQuery ||
                      ""
              ).trim()
            : "";
        setKeyParams({
            disease: "",
            factor: !reverse && factorId != null ? String(factorId) : "",
            biomarker: biomarkerNeedle,
            direction: reverse ? "biomarker-to-cfde" : "cfde-to-biomarker",
        });
    }

    return {
        label: String(
            (payload && payload.label) ||
                (reverse
                    ? reverseSessionLabel({
                          reverseResolved: session.reverseResolved,
                          reverseUserQuery: session.reverseUserQuery,
                      })
                    : session.searchedFactorLabel) ||
                "session"
        ),
        factorIri,
        factorId,
        searchDirection: reverse ? "biomarker-to-cfde" : "cfde-to-biomarker",
    };
}
