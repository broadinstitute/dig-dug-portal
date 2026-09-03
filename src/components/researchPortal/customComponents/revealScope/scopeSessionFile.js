const SCHEMA_VERSION = "scope-session-v0";
const VALID_MODULES = ["evaluate", "literature"];

/** Builds the exportable session object. v0 shortcut: no hub, so this is hand-assembled from whatever the shell has cached rather than read from a Central Hypothesis State. */
export function buildSessionExport({ hypothesisText, ranModules, evaluation, literatureQuery }) {
    return {
        schema_version: SCHEMA_VERSION,
        exported_at: new Date().toISOString(),
        hypothesis_text: hypothesisText || "",
        modules_run: Array.isArray(ranModules) ? ranModules.filter((id) => VALID_MODULES.includes(id)) : [],
        evaluation: evaluation || null,
        literature_query: literatureQuery || null,
    };
}

/** Default filename suggestion (no extension) for a session export. */
export function defaultSessionFilename() {
    return `scope-session-${new Date().toISOString().replace(/[:.]/g, "-")}`;
}

function withJsonExtension(filename) {
    const name = filename && filename.trim() ? filename.trim() : defaultSessionFilename();
    return name.toLowerCase().endsWith(".json") ? name : `${name}.json`;
}

/** Triggers a browser download of the session as a JSON file to the browser's default download location. */
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
 * Saves the session under a user-chosen name. Where the File System Access API is available
 * (Chromium-based browsers), this opens the real OS "Save As" dialog — the user can change
 * both name and folder there. Elsewhere (Firefox, Safari), there is no web API to choose a
 * folder, so this falls back to a plain download using the given filename; the browser saves
 * to its default downloads location.
 */
export async function saveSessionFile(sessionData, filename) {
    const jsonText = JSON.stringify(sessionData, null, 2);
    if (typeof window !== "undefined" && typeof window.showSaveFilePicker === "function") {
        try {
            const handle = await window.showSaveFilePicker({
                suggestedName: withJsonExtension(filename),
                types: [{ description: "SCOPE session", accept: { "application/json": [".json"] } }],
            });
            const writable = await handle.createWritable();
            await writable.write(jsonText);
            await writable.close();
            return;
        } catch (error) {
            if (error && error.name === "AbortError") {
                // User cancelled the native save dialog — respect that, don't fall back.
                return;
            }
            // Any other failure (e.g. permission denied): fall through to plain download.
        }
    }
    downloadSessionExport(sessionData, filename);
}

/** Parses and defensively normalizes an imported session file's text content. Throws on invalid JSON. */
export function parseSessionImport(rawText) {
    const parsed = JSON.parse(rawText);
    if (!parsed || typeof parsed !== "object") {
        throw new Error("Invalid session file");
    }
    return {
        hypothesisText: typeof parsed.hypothesis_text === "string" ? parsed.hypothesis_text : "",
        ranModules: Array.isArray(parsed.modules_run)
            ? parsed.modules_run.filter((id) => VALID_MODULES.includes(id))
            : [],
        evaluation: parsed.evaluation && typeof parsed.evaluation === "object" ? parsed.evaluation : null,
        literatureQuery: typeof parsed.literature_query === "string" ? parsed.literature_query : null,
    };
}
