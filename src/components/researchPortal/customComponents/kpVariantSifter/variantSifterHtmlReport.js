/**
 * Build a downloadable HTML report of the current Variant Sifter workspace:
 * canvas visualizer snapshots + mapped options + variants data table.
 */
import {
    buildMappedVariantDataTableView,
    collectMappingCategories,
    groupMappingCategories,
    normalizeMappingMode,
    normalizeMappingState,
    normalizeWorkspaceMappingFilter,
    VKS_MAPPING_MODES,
} from "./variantSifterMappingData.js";
import {
    formatRegion,
    formatSearchSessionLabel,
} from "./variantSifterSearchUtils.js";
import { normalizeProjectId } from "./variantSifterProjects.js";

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function waitForNextPaint() {
    return new Promise((resolve) => {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => resolve());
        });
    });
}

function isCanvasCaptureable(canvas) {
    if (!(canvas instanceof HTMLCanvasElement)) {
        return false;
    }
    if (!canvas.width || !canvas.height) {
        return false;
    }
    const style = window.getComputedStyle?.(canvas);
    if (style && (style.display === "none" || style.visibility === "hidden")) {
        return false;
    }
    // v-show sets display:none; offsetParent is null for hidden (except fixed).
    if (canvas.offsetParent === null && style?.position !== "fixed") {
        return false;
    }
    return true;
}

function resolveCanvasTitle(canvas, index) {
    if (canvas.closest(".vks-genes-track") || canvas.closest(".vks-genes-track-dock")) {
        return "Genes";
    }

    if (canvas.classList.contains("vks-anno-biosample-canvas")) {
        const sectionTitle = canvas
            .closest(".vks-plot-section")
            ?.querySelector(".vks-plot-section-title")
            ?.textContent?.trim();
        return sectionTitle
            ? `${sectionTitle} — biosample tracks`
            : "Biosample tracks";
    }

    const series = canvas.closest(".vks-associations-plot-series");
    if (series) {
        const code = series
            .querySelector(".vks-associations-ancestry-bubble-code")
            ?.textContent?.trim();
        const label = series
            .querySelector(".vks-associations-ancestry-bubble-label")
            ?.textContent?.trim();
        const sectionTitle = canvas
            .closest(".vks-plot-section")
            ?.querySelector(".vks-plot-section-title")
            ?.textContent?.trim();
        const ancestry = [code, label].filter(Boolean).join(" · ");
        if (sectionTitle && ancestry) {
            return `${sectionTitle} — ${ancestry}`;
        }
        return ancestry || sectionTitle || `Visualizer ${index + 1}`;
    }

    const sectionTitle = canvas
        .closest(".vks-plot-section")
        ?.querySelector(".vks-plot-section-title")
        ?.textContent?.trim();
    if (sectionTitle) {
        return sectionTitle;
    }

    return `Visualizer ${index + 1}`;
}

/**
 * Capture painted canvases under the workspace track stack.
 * VS canvases are 2× internal resolution — report CSS size is half.
 */
export function captureWorkspaceCanvases(rootEl) {
    if (!rootEl?.querySelectorAll) {
        return [];
    }
    const trackRoot =
        rootEl.querySelector(".vks-canvas-tracks") ||
        rootEl.querySelector(".vks-associations-plot") ||
        rootEl;
    const canvases = [...trackRoot.querySelectorAll("canvas")].filter(
        isCanvasCaptureable
    );

    return canvases.map((canvas, index) => {
        let dataUrl = "";
        let error = null;
        try {
            dataUrl = canvas.toDataURL("image/png");
        } catch (err) {
            error = err?.message || "Could not capture canvas";
        }
        return {
            id: `canvas-${index}`,
            title: resolveCanvasTitle(canvas, index),
            dataUrl,
            cssWidth: Math.max(1, Math.round(canvas.width / 2)),
            cssHeight: Math.max(1, Math.round(canvas.height / 2)),
            error,
        };
    });
}

function formatReportCellValue(value) {
    if (value == null || value === "") {
        return "";
    }
    if (typeof value === "number") {
        if (!Number.isFinite(value)) {
            return "";
        }
        if (Math.abs(value) !== 0 && (Math.abs(value) < 0.001 || Math.abs(value) >= 1e6)) {
            return value.toExponential(2);
        }
        if (Number.isInteger(value)) {
            return String(value);
        }
        return String(Number(value.toPrecision(6)));
    }
    if (typeof value === "boolean") {
        return value ? "true" : "false";
    }
    if (Array.isArray(value)) {
        return value.map((item) => formatReportCellValue(item)).filter(Boolean).join("; ");
    }
    if (typeof value === "object") {
        try {
            return JSON.stringify(value);
        } catch (_error) {
            return String(value);
        }
    }
    return String(value);
}

export function buildHtmlReportTableSnapshot({
    associationRows = [],
    mappingState = null,
    credibleSetsState = null,
    globalEnrichmentState = null,
    v2gState = null,
    s2gState = null,
    workspaceMappingFilter = null,
} = {}) {
    const mapping = normalizeMappingState(mappingState);
    const categories = collectMappingCategories({
        credibleSetsState,
        globalEnrichmentState,
        v2gState,
        s2gState,
    });
    const selectedSet = new Set(mapping.selectedCategoryIds);
    const groups = groupMappingCategories(categories).map((group) => ({
        id: group.id,
        label: group.label,
        categories: (group.categories || []).map((category) => ({
            id: category.id,
            label: category.label,
            selected: selectedSet.has(category.id),
        })),
    }));
    const tableView = buildMappedVariantDataTableView(associationRows, {
        mappingCategories: categories,
        selectedCategoryIds: mapping.selectedCategoryIds,
        mappingMode: mapping.mappingMode,
    });
    const workspaceFilter = normalizeWorkspaceMappingFilter(workspaceMappingFilter);
    const modeLabel =
        VKS_MAPPING_MODES.find((option) => option.id === mapping.mappingMode)?.label ||
        (normalizeMappingMode(mapping.mappingMode) === "and" ? "And" : "Or");

    let note = "";
    if (!tableView.filtered) {
        note = categories.length
            ? "All loaded association variants. Select mapping categories to intersect associations with workspace features."
            : "All loaded association variants. Load credible sets, enrichment tissues, or gene-link tracks to enable mapping.";
    } else {
        const selectedCount = mapping.selectedCategoryIds.length;
        note = `Showing ${tableView.rows.length.toLocaleString()} variant(s) mapped with ${selectedCount} selected categor${
            selectedCount === 1 ? "y" : "ies"
        } (${modeLabel}).`;
    }

    const columns = Array.isArray(tableView.topRows) ? tableView.topRows : [];
    const rows = (tableView.rows || []).map((row) =>
        columns.map((column) => formatReportCellValue(row?.[column]))
    );

    return {
        mappingMode: mapping.mappingMode,
        mappingModeLabel: modeLabel,
        selectedCategoryIds: mapping.selectedCategoryIds,
        groups,
        workspaceFilterActive: Boolean(workspaceFilter?.active),
        workspaceFilterRowCount: workspaceFilter?.rowCount || 0,
        note,
        filtered: Boolean(tableView.filtered),
        columns,
        rows,
        rowCount: rows.length,
    };
}

function renderMappingSection(tableSnapshot) {
    const selected = (tableSnapshot.groups || [])
        .map((group) => {
            const chips = (group.categories || [])
                .map((category) => {
                    const cls = category.selected ? "chip is-selected" : "chip";
                    return `<span class="${cls}">${escapeHtml(category.label)}</span>`;
                })
                .join("");
            if (!chips) {
                return "";
            }
            return `<div class="mapping-group"><h3>${escapeHtml(
                group.label
            )}</h3><div class="chips">${chips}</div></div>`;
        })
        .filter(Boolean)
        .join("");

    const filterLine = tableSnapshot.workspaceFilterActive
        ? `<p class="meta">Workspace filter on: <strong>${Number(
              tableSnapshot.workspaceFilterRowCount || 0
          ).toLocaleString()}</strong> mapped variant(s) driving visualizers.</p>`
        : `<p class="meta">Workspace filter off — visualizers show the full loaded workspace view.</p>`;

    return `
<section class="report-section">
  <h2>Mapped options</h2>
  <p class="meta">Compare mode: <strong>${escapeHtml(
      tableSnapshot.mappingModeLabel || "Or"
  )}</strong></p>
  ${filterLine}
  ${
      selected ||
      `<p class="meta">No mapping categories available yet.</p>`
  }
</section>`;
}

function renderVisualizersSection(canvases) {
    if (!canvases.length) {
        return `
<section class="report-section">
  <h2>Workspace visualizers</h2>
  <p class="meta">No visualizer canvases were available to capture.</p>
</section>`;
    }

    const figures = canvases
        .map((canvas, index) => {
            if (canvas.error || !canvas.dataUrl) {
                return `<figure class="viz">
  <figcaption>${escapeHtml(canvas.title || `Visualizer ${index + 1}`)}</figcaption>
  <p class="meta">Could not capture this canvas${
      canvas.error ? `: ${escapeHtml(canvas.error)}` : ""
  }.</p>
</figure>`;
            }
            return `<figure class="viz">
  <figcaption>${escapeHtml(canvas.title || `Visualizer ${index + 1}`)}</figcaption>
  <img src="${canvas.dataUrl}" width="${canvas.cssWidth}" height="${canvas.cssHeight}" alt="${escapeHtml(
                canvas.title || `Visualizer ${index + 1}`
            )}" />
</figure>`;
        })
        .join("\n");

    return `
<section class="report-section">
  <h2>Workspace visualizers</h2>
  <p class="meta">${canvases.length} snapshot(s) from the current workspace view.</p>
  ${figures}
</section>`;
}

function renderVariantsTableSection(tableSnapshot) {
    const columns = tableSnapshot.columns || [];
    if (!columns.length) {
        return `
<section class="report-section">
  <h2>Variants data table</h2>
  <p class="meta">No table columns available.</p>
</section>`;
    }

    const thead = columns
        .map((column) => `<th>${escapeHtml(column)}</th>`)
        .join("");
    const bodyRows = (tableSnapshot.rows || [])
        .map((cells) => {
            const tds = columns
                .map((_, index) => `<td>${escapeHtml(cells[index] ?? "")}</td>`)
                .join("");
            return `<tr>${tds}</tr>`;
        })
        .join("\n");

    return `
<section class="report-section">
  <h2>Variants data table</h2>
  <p class="meta">${escapeHtml(tableSnapshot.note || "")}</p>
  <p class="meta">Total rows: <strong>${Number(
      tableSnapshot.rowCount || 0
  ).toLocaleString()}</strong></p>
  <div class="table-wrap">
    <table>
      <thead><tr>${thead}</tr></thead>
      <tbody>
        ${
            bodyRows ||
            `<tr><td colspan="${columns.length}">No variant rows match the current filters.</td></tr>`
        }
      </tbody>
    </table>
  </div>
</section>`;
}

export function buildVariantSifterHtmlReport({
    searchSession = null,
    projectId = "",
    viewRegion = null,
    canvases = [],
    tableSnapshot = null,
    exportedAt = new Date(),
} = {}) {
    const title = formatSearchSessionLabel(searchSession) || "Variant Sifter report";
    const viewLabel = viewRegion ? formatRegion(viewRegion) : searchSession?.regionLabel || "";
    const when =
        exportedAt instanceof Date
            ? exportedAt.toISOString()
            : String(exportedAt || new Date().toISOString());

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<style>
  :root {
    color-scheme: light;
    --ink: #33363d;
    --muted: #6b6b6b;
    --border: #e6e1d6;
    --bg: #ffffff;
    --chip: #f6f5f2;
    --chip-selected: #2c5c97;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 24px;
    font: 14px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    color: var(--ink);
    background: var(--bg);
  }
  h1 { margin: 0 0 8px; font-size: 22px; line-height: 1.25; }
  h2 { margin: 0 0 12px; font-size: 18px; }
  h3 { margin: 0 0 8px; font-size: 14px; }
  .meta { margin: 0 0 8px; color: var(--muted); }
  .report-section { margin: 28px 0; page-break-inside: avoid; }
  .viz { margin: 0 0 20px; }
  .viz img {
    display: block;
    max-width: 100%;
    height: auto;
    border: 1px solid var(--border);
    background: #fff;
  }
  figcaption {
    margin: 0 0 8px;
    font-weight: 700;
  }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; margin: 0 0 14px; }
  .chip {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 999px;
    background: var(--chip);
    border: 1px solid var(--border);
    font-size: 12px;
  }
  .chip.is-selected {
    background: var(--chip-selected);
    border-color: var(--chip-selected);
    color: #fff;
  }
  .mapping-group { margin: 0 0 14px; }
  .table-wrap { overflow-x: auto; border: 1px solid var(--border); }
  table {
    border-collapse: collapse;
    width: 100%;
    font-size: 12px;
  }
  th, td {
    border-bottom: 1px solid var(--border);
    padding: 6px 8px;
    text-align: left;
    vertical-align: top;
    white-space: nowrap;
  }
  th {
    background: var(--chip);
    position: sticky;
    top: 0;
  }
  @media print {
    body { padding: 12px; }
    .viz img { break-inside: avoid; }
  }
</style>
</head>
<body>
  <header>
    <h1>Variant Sifter report</h1>
    <p class="meta"><strong>${escapeHtml(title)}</strong></p>
    <p class="meta">Project: ${escapeHtml(normalizeProjectId(projectId) || "—")}</p>
    <p class="meta">View region: ${escapeHtml(viewLabel || "—")}</p>
    <p class="meta">Exported: ${escapeHtml(when)}</p>
  </header>
  ${renderVisualizersSection(canvases)}
  ${renderMappingSection(tableSnapshot || {})}
  ${renderVariantsTableSection(tableSnapshot || { columns: [], rows: [] })}
</body>
</html>`;
}

export function buildHtmlReportFilename(searchSession) {
    const trait = String(searchSession?.phenotype?.name || "session")
        .trim()
        .replace(/[^\w.-]+/g, "_");
    const ancestry = String(searchSession?.ancestry || "Mixed")
        .trim()
        .replace(/[^\w.-]+/g, "_");
    const region = String(searchSession?.regionLabel || "locus")
        .trim()
        .replace(/[^\w.-]+/g, "_");
    return `${trait}_${ancestry}_${region}_report.html`;
}

export async function saveHtmlBundle(filename, html) {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    let resolvedFilename = String(filename || "").trim() || "vks-report.html";
    if (!resolvedFilename.toLowerCase().endsWith(".html")) {
        resolvedFilename += ".html";
    }

    if (
        typeof window !== "undefined" &&
        typeof window.showSaveFilePicker === "function"
    ) {
        try {
            const handle = await window.showSaveFilePicker({
                suggestedName: resolvedFilename,
                types: [
                    {
                        description: "HTML",
                        accept: { "text/html": [".html"] },
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

/**
 * Capture workspace canvases (after paint), build HTML, and download.
 */
export async function exportVariantSifterHtmlReport({
    rootEl,
    searchSession,
    projectId,
    viewRegion,
    associationRows,
    mappingState,
    credibleSetsState,
    globalEnrichmentState,
    v2gState,
    s2gState,
    workspaceMappingFilter,
} = {}) {
    await waitForNextPaint();
    const canvases = captureWorkspaceCanvases(rootEl);
    const tableSnapshot = buildHtmlReportTableSnapshot({
        associationRows,
        mappingState,
        credibleSetsState,
        globalEnrichmentState,
        v2gState,
        s2gState,
        workspaceMappingFilter,
    });
    const html = buildVariantSifterHtmlReport({
        searchSession,
        projectId,
        viewRegion,
        canvases,
        tableSnapshot,
        exportedAt: new Date(),
    });
    return saveHtmlBundle(buildHtmlReportFilename(searchSession), html);
}
