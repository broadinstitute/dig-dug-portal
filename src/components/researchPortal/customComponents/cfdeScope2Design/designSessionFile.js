/**
 * DESIGN session export/import — same save/load pattern as
 * `revealScope/scopeSessionFile.js`, with a DESIGN-specific payload
 * (config form + generated protocol results). Kept in this product tree so
 * DESIGN does not import from SCOPE.
 */

const SCHEMA_VERSION = "design-session-v0";

/**
 * @param {object} state
 * @returns {object}
 */
export function buildSessionExport({
    hypothesisText,
    genesText,
    experimentConstraints,
    selectedAssayTypes,
    selectedCellTypes,
    selectedReadouts,
    selectedThroughput,
    selectedSpecies,
    selectedTimeBudget,
    showConfigurationSection,
    hasGeneratedProtocol,
    activeConfigTab,
    reviewAccordionOpen,
    experimentResults,
}) {
    return {
        schema_version: SCHEMA_VERSION,
        exported_at: new Date().toISOString(),
        hypothesis_text: hypothesisText || "",
        genes_text: genesText || "",
        experiment_constraints: experimentConstraints || "",
        selected_assay_types: Array.isArray(selectedAssayTypes) ? [...selectedAssayTypes] : [],
        selected_cell_types: Array.isArray(selectedCellTypes) ? [...selectedCellTypes] : [],
        selected_readouts: Array.isArray(selectedReadouts) ? [...selectedReadouts] : [],
        selected_throughput: selectedThroughput || "",
        selected_species: selectedSpecies || "",
        selected_time_budget: selectedTimeBudget || "",
        show_configuration_section: Boolean(showConfigurationSection),
        has_generated_protocol: Boolean(hasGeneratedProtocol),
        active_config_tab: activeConfigTab === "protocol" ? "protocol" : "config",
        review_accordion_open: reviewAccordionOpen !== false,
        experiment_results: Array.isArray(experimentResults) ? experimentResults : [],
    };
}

/** Default filename suggestion (no extension) for a session export. */
export function defaultSessionFilename() {
    return `design-session-${new Date().toISOString().replace(/[:.]/g, "-")}`;
}

function withJsonExtension(filename) {
    const name = filename && filename.trim() ? filename.trim() : defaultSessionFilename();
    return name.toLowerCase().endsWith(".json") ? name : `${name}.json`;
}

/** Triggers a browser download of the session as a JSON file. */
export function downloadSessionExport(sessionData, filename) {
    const blob = new Blob([JSON.stringify(sessionData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = withJsonExtension(filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Saves the session under a user-chosen name. File System Access API where
 * available; plain download fallback elsewhere (same as SCOPE).
 */
export async function saveSessionFile(sessionData, filename) {
    const jsonText = JSON.stringify(sessionData, null, 2);
    if (typeof window !== "undefined" && typeof window.showSaveFilePicker === "function") {
        try {
            const handle = await window.showSaveFilePicker({
                suggestedName: withJsonExtension(filename),
                types: [{ description: "DESIGN session", accept: { "application/json": [".json"] } }],
            });
            const writable = await handle.createWritable();
            await writable.write(jsonText);
            await writable.close();
            return;
        } catch (error) {
            if (error && error.name === "AbortError") {
                return;
            }
        }
    }
    downloadSessionExport(sessionData, filename);
}

function asStringArray(value) {
    return Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : [];
}

/** Parses and defensively normalizes an imported DESIGN session. Throws on invalid JSON. */
export function parseSessionImport(rawText) {
    const parsed = JSON.parse(rawText);
    if (!parsed || typeof parsed !== "object") {
        throw new Error("Invalid session file");
    }
    const hasProtocol =
        Boolean(parsed.has_generated_protocol) ||
        (Array.isArray(parsed.experiment_results) && parsed.experiment_results.length > 0);
    return {
        hypothesisText: typeof parsed.hypothesis_text === "string" ? parsed.hypothesis_text : "",
        genesText: typeof parsed.genes_text === "string" ? parsed.genes_text : "",
        experimentConstraints:
            typeof parsed.experiment_constraints === "string" ? parsed.experiment_constraints : "",
        selectedAssayTypes: asStringArray(parsed.selected_assay_types),
        selectedCellTypes: asStringArray(parsed.selected_cell_types),
        selectedReadouts: asStringArray(parsed.selected_readouts),
        selectedThroughput: typeof parsed.selected_throughput === "string" ? parsed.selected_throughput : "",
        selectedSpecies: typeof parsed.selected_species === "string" ? parsed.selected_species : "",
        selectedTimeBudget:
            typeof parsed.selected_time_budget === "string" ? parsed.selected_time_budget : "",
        showConfigurationSection: Boolean(parsed.show_configuration_section),
        hasGeneratedProtocol: hasProtocol,
        activeConfigTab: parsed.active_config_tab === "protocol" && hasProtocol ? "protocol" : "config",
        reviewAccordionOpen: parsed.review_accordion_open !== false,
        experimentResults: Array.isArray(parsed.experiment_results) ? parsed.experiment_results : [],
    };
}
