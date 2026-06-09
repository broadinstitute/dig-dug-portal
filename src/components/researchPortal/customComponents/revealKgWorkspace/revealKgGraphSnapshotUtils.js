/** Self-contained HTML snapshot export for REVEAL KG Canvas. */

import { successfulCfdeDatasetRuns, buildCfdeDatasetTableRows, formatCfdeDatasetRunHeadline } from "./revealKgCfdeDatasetUtils.js";
import {
    explainScopeLabel,
    interpretationMarkdownForDisplay,
    successfulGraphExplanations,
} from "./revealKgExplainUtils.js";
import {
    formatGraphTableValue,
    buildGraphTableRowsFromLedger,
    graphTableTabsForLedger,
} from "./revealKgGraphTableData.js";
import { findGraphNode } from "./revealKgGraphBootstrap.js";
import {
    mapConnectionCandidatesToRows,
    nodeIdsWithInspectorEvidence,
} from "./revealKgInspectorUtils.js";
import {
    formatPathwayRunHeadline,
    SIG_CHAIN_MATRIX_TABS,
    sigChainPathwayKey,
    sigChainRunTimestampLabel,
    successfulSigChainRuns,
} from "./revealKgSigChainPrioritizeUtils.js";
import {
    buildFactorSigChainSummaryRows,
    buildMatrixCellLookup,
    buildTraitSigChainSummaryRows,
} from "./revealKgSigChainUtils.js";

function escapeHtml(value) {
    let text = value;
    if (text === null || text === undefined) {
        text = "";
    } else if (typeof text === "object") {
        text = safeJsonStringify(text);
    } else {
        text = String(text);
    }
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function safeJsonStringify(value) {
    if (value === null || value === undefined) {
        return "";
    }
    if (typeof value === "string") {
        return value;
    }
    try {
        return JSON.stringify(value, null, 2);
    } catch (error) {
        return `[Could not serialize: ${error?.message || "unknown error"}]`;
    }
}

function slugifyFilename(value) {
    return String(value || "graph")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 48);
}

export function defaultGraphSnapshotFilename(label) {
    const stamp = new Date().toISOString().slice(0, 10);
    return `reveal-kg-snapshot-${slugifyFilename(label) || "graph"}-${stamp}.html`;
}

function parseMarkdownBlocks(text) {
    const lines = String(text || "").split(/\r?\n/);
    const blocks = [];
    let index = 0;
    while (index < lines.length) {
        const line = lines[index].trimEnd();
        if (!line.trim()) {
            index += 1;
            continue;
        }
        if (line.startsWith("- ")) {
            const items = [];
            while (index < lines.length && lines[index].trim().startsWith("- ")) {
                items.push(lines[index].trim().slice(2));
                index += 1;
            }
            blocks.push({ type: "list", items });
            continue;
        }
        if (line.startsWith("### ")) {
            blocks.push({ type: "h3", text: line.slice(4) });
            index += 1;
            continue;
        }
        if (line.startsWith("## ")) {
            blocks.push({ type: "h2", text: line.slice(3) });
            index += 1;
            continue;
        }
        if (line.startsWith("# ")) {
            blocks.push({ type: "h1", text: line.slice(2) });
            index += 1;
            continue;
        }
        const paragraph = [line];
        index += 1;
        while (
            index < lines.length &&
            lines[index].trim() &&
            !lines[index].trim().startsWith("- ") &&
            !lines[index].trim().startsWith("#")
        ) {
            paragraph.push(lines[index].trim());
            index += 1;
        }
        blocks.push({ type: "p", text: paragraph.join(" ") });
    }
    return blocks;
}

function markdownBlocksToHtml(text) {
    const blocks = parseMarkdownBlocks(text);
    return blocks
        .map((block) => {
            if (block.type === "list") {
                const items = block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
                return `<ul>${items}</ul>`;
            }
            if (block.type === "h1") {
                return `<h3>${escapeHtml(block.text)}</h3>`;
            }
            if (block.type === "h2") {
                return `<h4>${escapeHtml(block.text)}</h4>`;
            }
            if (block.type === "h3") {
                return `<h5>${escapeHtml(block.text)}</h5>`;
            }
            return `<p>${escapeHtml(block.text)}</p>`;
        })
        .join("");
}

function renderDataTable(columns, rows) {
    if (!rows.length) {
        return `<p class="rkg-snap-empty">No rows to show.</p>`;
    }
    const head = columns.map((col) => `<th>${escapeHtml(col.label)}</th>`).join("");
    const body = rows
        .map((row) => {
            const cells = columns
                .map((col) => {
                    const raw = row[col.key];
                    const value = col.format ? col.format(raw, row) : raw;
                    return `<td>${escapeHtml(value ?? "")}</td>`;
                })
                .join("");
            return `<tr>${cells}</tr>`;
        })
        .join("");
    return `<div class="rkg-snap-table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

function renderTabbedPanels({ tabs, renderPanel, openFirst = true }) {
    if (!tabs.length) {
        return `<p class="rkg-snap-empty">No content captured.</p>`;
    }
    return tabs
        .map((tab, index) => {
            const countSuffix = tab.count != null ? ` (${tab.count})` : "";
            const openAttr = openFirst && index === 0 ? " open" : "";
            return `<details class="rkg-snap-tab-details"${openAttr}><summary>${escapeHtml(`${tab.label}${countSuffix}`)}</summary>${renderPanel(tab)}</details>`;
        })
        .join("");
}

const GRAPH_TABLE_COLUMNS = [
    { key: "label", label: "Name" },
    {
        key: "aggregate_score",
        label: "Aggregate",
        format: (value) => formatGraphTableValue(value, 3),
    },
    {
        key: "raw_max_score",
        label: "Max",
        format: (value) => formatGraphTableValue(value, 3),
    },
    {
        key: "raw_mean_score",
        label: "Mean",
        format: (value) => formatGraphTableValue(value, 3),
    },
    { key: "novelty_label", label: "Novelty" },
    { key: "relevance_label", label: "Relevance" },
    { key: "rationale", label: "Description" },
    { key: "shown", label: "Shown" },
];

const CONNECTION_TABLE_COLUMNS = [
    { key: "label", label: "Node" },
    { key: "subtitle", label: "Description" },
    {
        key: "aggregate_score",
        label: "Aggregate",
        format: (value) => formatGraphTableValue(value, 3),
    },
    {
        key: "raw_max_score",
        label: "Max",
        format: (value) => formatGraphTableValue(value, 3),
    },
    {
        key: "raw_mean_score",
        label: "Mean",
        format: (value) => formatGraphTableValue(value, 3),
    },
    {
        key: "link_score",
        label: "Link",
        format: (value) => formatGraphTableValue(value, 3),
    },
    { key: "shown", label: "On graph?" },
];

const CONNECTION_TAB_LABELS = {
    gene: "Genes",
    trait: "Traits",
    factor: "Mechanisms",
    gene_set: "Gene sets",
};

function buildGraphTablesSection(session, graphEdges, contextualEdges, keyNodeIds) {
    const rowsByType = buildGraphTableRowsFromLedger(
        session?.retrievalLedger || {},
        session,
        graphEdges,
        contextualEdges,
        keyNodeIds
    );
    const tabs = graphTableTabsForLedger(session?.retrievalLedger || {}).map((tab) => ({
        ...tab,
        count: (rowsByType[tab.key] || []).length,
    }));
    return renderTabbedPanels({
        tabs,
        renderPanel: (tab) => renderDataTable(GRAPH_TABLE_COLUMNS, rowsByType[tab.key] || []),
    });
}

function buildExplanationSection(session) {
    const entries = successfulGraphExplanations(session);
    if (!entries.length) {
        return `<p class="rkg-snap-empty">No graph explanations were generated in this session.</p>`;
    }
    return entries
        .map((entry, index) => {
            const title = `Explanation ${index + 1}`;
            const meta = [
                explainScopeLabel(entry.scope),
                entry.timestamp_label || "",
            ]
                .filter(Boolean)
                .join(" · ");
            const body = markdownBlocksToHtml(
                entry.interpretation_display ||
                    interpretationMarkdownForDisplay(entry.interpretation)
            );
            const prompt = entry.prompt_preview
                ? `<details class="rkg-snap-details"><summary>Prompt</summary><pre>${escapeHtml(entry.prompt_preview)}</pre></details>`
                : "";
            return `<article class="rkg-snap-card"><h3>${escapeHtml(title)}</h3><p class="rkg-snap-meta">${escapeHtml(meta)}</p>${body}${prompt}</article>`;
        })
        .join("");
}

function buildHypothesisSection(session) {
    const runs = successfulSigChainRuns(session);
    if (!runs.length) {
        return `<p class="rkg-snap-empty">No hypothesis runs were completed in this session.</p>`;
    }
    return runs
        .map((run, runIndex) => {
            const chains = run?.payload?.chains || [];
            const headline = formatPathwayRunHeadline(chains.length, run.status);
            const meta = sigChainRunTimestampLabel(run);
            const selected = (run.selectedNodes || [])
                .map((node) => node.label || node.id)
                .filter(Boolean);
            const selectedHtml = selected.length
                ? `<p class="rkg-snap-meta"><strong>Selected nodes:</strong> ${escapeHtml(selected.join(", "))}</p>`
                : "";
            const pathways = chains
                .map((chain, chainIndex) => {
                    const key = sigChainPathwayKey(chain);
                    const pathwayState = run?.pathwayCache?.[key] || null;
                    const hypothesis = pathwayState?.hypothesisEntry?.interpretation || "";
                    const nodes = (chain.nodes || [])
                        .map((node) => node.label || node.id)
                        .filter(Boolean);
                    const hypothesisHtml = hypothesis
                        ? `<div class="rkg-snap-markdown">${markdownBlocksToHtml(hypothesis)}</div>`
                        : `<p class="rkg-snap-empty">No hypothesis text was generated for this pathway.</p>`;
                    return `<article class="rkg-snap-subcard"><h4>${escapeHtml(chain.title || `Pathway ${chainIndex + 1}`)}</h4>${
                        chain.claim
                            ? `<p>${escapeHtml(chain.claim)}</p>`
                            : ""
                    }${
                        nodes.length
                            ? `<p class="rkg-snap-meta"><strong>Nodes:</strong> ${escapeHtml(nodes.join(" → "))}</p>`
                            : ""
                    }${hypothesisHtml}</article>`;
                })
                .join("");
            return `<article class="rkg-snap-card"><h3>${escapeHtml(`Hypothesis run ${runIndex + 1}`)} — ${escapeHtml(headline)}</h3><p class="rkg-snap-meta">${escapeHtml(meta)}</p>${selectedHtml}${pathways}</article>`;
        })
        .join("");
}

function buildDatasetSection(session) {
    const runs = successfulCfdeDatasetRuns(session);
    if (!runs.length) {
        return `<p class="rkg-snap-empty">No related-dataset runs were completed in this session.</p>`;
    }
    return runs
        .map((run, index) => {
            const datasets = run?.payload?.datasets || [];
            const headline = formatCfdeDatasetRunHeadline(datasets.length, run.status);
            const genes = (run.activeSetNodes || [])
                .map((node) => node.label || node.id)
                .filter(Boolean);
            const rows = buildCfdeDatasetTableRows(datasets);
            const table = renderDataTable(
                [
                    { key: "label", label: "Gene set" },
                    { key: "source", label: "Source" },
                    {
                        key: "aggregate_score",
                        label: "Aggregate",
                        format: (value) => formatGraphTableValue(value, 3),
                    },
                    {
                        key: "raw_max_score",
                        label: "Max",
                        format: (value) => formatGraphTableValue(value, 3),
                    },
                    {
                        key: "raw_mean_score",
                        label: "Mean",
                        format: (value) => formatGraphTableValue(value, 3),
                    },
                ],
                rows
            );
            return `<article class="rkg-snap-card"><h3>${escapeHtml(`Dataset run ${index + 1}`)} — ${escapeHtml(headline)}</h3>${
                genes.length
                    ? `<p class="rkg-snap-meta"><strong>Selected genes:</strong> ${escapeHtml(genes.join(", "))}</p>`
                    : ""
            }${table}</article>`;
        })
        .join("");
}

function renderSigChainMatrixTable(matrix) {
    const lookup = buildMatrixCellLookup(matrix);
    const rows = [];
    for (const row of matrix?.rows || []) {
        for (const column of matrix?.columns || []) {
            const cell = lookup.get(`${row.id}::${column.id}`);
            if (!cell) {
                continue;
            }
            rows.push({
                row: row.label || row.id,
                column: column.label || column.id,
                score:
                    cell.score ??
                    cell.combined_score ??
                    cell.loading ??
                    cell.combined_loading,
            });
        }
    }
    if (!rows.length) {
        return `<p class="rkg-snap-empty">No scored cells in this matrix.</p>`;
    }
    return renderDataTable(
        [
            { key: "row", label: "Row" },
            { key: "column", label: "Column" },
            {
                key: "score",
                label: "Score",
                format: (value) => formatGraphTableValue(value, 3),
            },
        ],
        rows.slice(0, 80)
    );
}

function buildSigChainPacketSnapshotHtml(node, packet) {
    const matrices = packet?.matrices;
    if (!matrices || typeof matrices !== "object") {
        return `<p class="rkg-snap-meta">Packet cached.</p>`;
    }

    const nodeType = String(node?.node_type || node?.type || "").toLowerCase();
    if (nodeType === "trait") {
        const summary = buildTraitSigChainSummaryRows(node, packet);
        const blocks = [];
        if (summary.geneRows.length) {
            blocks.push(
                `<h5>Trait × gene scores</h5>${renderDataTable(
                    [
                        { key: "gene", label: "Gene" },
                        {
                            key: "combined_score",
                            label: "Combined",
                            format: (value) => formatGraphTableValue(value, 3),
                        },
                        {
                            key: "direct_score",
                            label: "Direct",
                            format: (value) => formatGraphTableValue(value, 3),
                        },
                        {
                            key: "indirect_score",
                            label: "Indirect",
                            format: (value) => formatGraphTableValue(value, 3),
                        },
                    ],
                    summary.geneRows
                )}`
            );
        }
        if (summary.factorRows.length) {
            blocks.push(
                `<h5>Trait × mechanism relevance</h5>${renderDataTable(
                    [
                        { key: "factor", label: "Mechanism" },
                        {
                            key: "relevance_score",
                            label: "Score",
                            format: (value) => formatGraphTableValue(value, 3),
                        },
                        { key: "family", label: "Family" },
                    ],
                    summary.factorRows
                )}`
            );
        }
        return blocks.length
            ? blocks.join("")
            : `<p class="rkg-snap-empty">No association scores in this packet.</p>`;
    }

    if (nodeType === "factor" || nodeType === "mechanism") {
        const summary = buildFactorSigChainSummaryRows(node, packet);
        const blocks = [];
        if (summary.geneRows.length) {
            blocks.push(
                `<h5>Mechanism × gene loadings</h5>${renderDataTable(
                    [
                        { key: "gene", label: "Gene" },
                        {
                            key: "loading",
                            label: "Loading",
                            format: (value) => formatGraphTableValue(value, 3),
                        },
                        {
                            key: "relative_loading",
                            label: "Relative",
                            format: (value) => formatGraphTableValue(value, 3),
                        },
                        {
                            key: "combined_loading",
                            label: "Combined",
                            format: (value) => formatGraphTableValue(value, 3),
                        },
                    ],
                    summary.geneRows
                )}`
            );
        }
        if (summary.traitRows.length) {
            blocks.push(
                `<h5>Mechanism × trait relevance</h5>${renderDataTable(
                    [
                        { key: "trait", label: "Trait" },
                        {
                            key: "relevance_score",
                            label: "Score",
                            format: (value) => formatGraphTableValue(value, 3),
                        },
                        { key: "family", label: "Family" },
                    ],
                    summary.traitRows
                )}`
            );
        }
        if (summary.geneSetRows.length) {
            blocks.push(
                `<h5>Top mechanism gene sets</h5>${renderDataTable(
                    [
                        { key: "gene_set", label: "Gene set" },
                        {
                            key: "loading",
                            label: "Loading",
                            format: (value) => formatGraphTableValue(value, 3),
                        },
                        {
                            key: "beta_uncorrected",
                            label: "Beta uncorr.",
                            format: (value) => formatGraphTableValue(value, 3),
                        },
                    ],
                    summary.geneSetRows
                )}`
            );
        }
        return blocks.length
            ? blocks.join("")
            : `<p class="rkg-snap-empty">No association scores in this packet.</p>`;
    }

    const tabs = SIG_CHAIN_MATRIX_TABS.filter((tab) => matrices[tab.id]).map((tab) => ({
        key: tab.id,
        label: tab.label || tab.title,
        count: (matrices[tab.id]?.cells || []).length,
    }));
    if (!tabs.length) {
        return `<p class="rkg-snap-empty">No association score matrices in this packet.</p>`;
    }
    return renderTabbedPanels({
        tabs,
        renderPanel: (tab) => renderSigChainMatrixTable(matrices[tab.key]),
    });
}

function buildInspectorNodeSection(session, nodeId) {
    const node = findGraphNode(session, nodeId);
    const label = node?.label || nodeId;
    const parts = [];

    const connectionCache = session?.nodeConnectionEvidenceCache?.[nodeId] || {};
    const connectionTabs = Object.keys(connectionCache)
        .filter((key) => Array.isArray(connectionCache[key]) && connectionCache[key].length)
        .map((key) => ({
            key,
            label: CONNECTION_TAB_LABELS[key] || key,
            count: connectionCache[key].length,
        }));
    if (connectionTabs.length) {
            parts.push(
                `<h4>Top connections</h4>${renderTabbedPanels({
                    tabs: connectionTabs,
                    renderPanel: (tab) =>
                        renderDataTable(
                            CONNECTION_TABLE_COLUMNS,
                            mapConnectionCandidatesToRows(
                                connectionCache[tab.key],
                                session.graphNodes || []
                            )
                        ),
                })}`
            );
    }

    const expressionCache = session?.nodeExpressionProfileCache?.[nodeId];
    if (expressionCache && Object.keys(expressionCache).length) {
        const expressionBlocks = Object.entries(expressionCache)
            .map(([referenceId, payload]) => {
                if (payload?.error) {
                    return `<p class="rkg-snap-meta"><strong>${escapeHtml(referenceId)}:</strong> ${escapeHtml(payload.error)}</p>`;
                }
                const profile = payload?.profile || payload;
                const rows = Array.isArray(profile?.items)
                    ? profile.items
                    : Array.isArray(profile?.rows)
                      ? profile.rows
                      : [];
                if (!rows.length) {
                    return `<p class="rkg-snap-meta"><strong>${escapeHtml(referenceId)}:</strong> Expression profile cached.</p>`;
                }
                return `<h5>${escapeHtml(referenceId)}</h5>${renderDataTable(
                    Object.keys(rows[0] || {}).slice(0, 6).map((key) => ({ key, label: key })),
                    rows.slice(0, 25)
                )}`;
            })
            .join("");
        parts.push(`<h4>Expression</h4>${expressionBlocks}`);
    }

    const sigChainEntry = session?.nodeSigChainPacketCache?.[nodeId];
    if (sigChainEntry?.packet || sigChainEntry?.error) {
        if (sigChainEntry.error) {
            parts.push(
                `<h4>Significance chain packet</h4><p class="rkg-snap-meta">${escapeHtml(sigChainEntry.error)}</p>`
            );
        } else {
            parts.push(
                `<h4>Association scores</h4>${buildSigChainPacketSnapshotHtml(node, sigChainEntry.packet)}`
            );
        }
    }

    const loadingsEntry = session?.nodeFactorLoadingsCache?.[nodeId];
    if (loadingsEntry?.payload || loadingsEntry?.error) {
        if (loadingsEntry.error) {
            parts.push(
                `<h4>Factor loadings</h4><p class="rkg-snap-meta">${escapeHtml(loadingsEntry.error)}</p>`
            );
        } else {
            const rows = (loadingsEntry.payload?.items || loadingsEntry.payload?.genes || []).slice(
                0,
                40
            );
            if (rows.length) {
                parts.push(
                    `<h4>Factor loadings</h4>${renderDataTable(
                        Object.keys(rows[0] || {})
                            .slice(0, 6)
                            .map((key) => ({ key, label: key })),
                        rows
                    )}`
                );
            }
        }
    }

    if (!parts.length) {
        return "";
    }
    return `<article class="rkg-snap-card"><h3>${escapeHtml(label)}</h3><p class="rkg-snap-meta">${escapeHtml(nodeId)}</p>${parts.join("")}</article>`;
}

function buildInspectorEdgeSections(session) {
    const provenanceById = session?.edgeProvenanceById || {};
    const edges = [
        ...(session?.graphEdges || []),
        ...(session?.contextualEdges || []),
    ];
    return edges
        .filter((edge) => edge?.id && provenanceById[edge.id] !== undefined)
        .map((edge) => {
            const provenance = provenanceById[edge.id];
            const text =
                typeof provenance === "string" ? provenance : safeJsonStringify(provenance);
            const label = `${edge.source} → ${edge.target}`;
            return `<article class="rkg-snap-subcard"><h4>${escapeHtml(label)}</h4><p class="rkg-snap-meta">${escapeHtml(edge.id)}</p><pre>${escapeHtml(text)}</pre></article>`;
        });
}

function buildInspectorSection(session) {
    const nodeIds = nodeIdsWithInspectorEvidence(session);
    const nodeSections = nodeIds.map((nodeId) => buildInspectorNodeSection(session, nodeId)).filter(Boolean);
    const edgeSections = buildInspectorEdgeSections(session);

    if (!nodeSections.length && !edgeSections.length) {
        return `<p class="rkg-snap-empty">No inspector evidence was cached in this session. Open nodes or edges in the Inspector before downloading a snapshot.</p>`;
    }

    return `${nodeSections.join("")}${
        edgeSections.length
            ? `<section class="rkg-snap-card"><h3>Edge provenance</h3>${edgeSections.join("")}</section>`
            : ""
    }`;
}

export function collectGraphSnapshotData(
    session,
    {
        graphSvgMarkup = "",
        graphEdges = [],
        contextualEdges = [],
        keyNodeIds = [],
    } = {}
) {
    const graphNodes = session?.graphNodes || [];
    return {
        label: String(session?.label || "Untitled graph").trim() || "Untitled graph",
        context: session?.context || "",
        exportedAt: new Date().toISOString(),
        graphSvgMarkup,
        graphSummary: {
            nodeCount: graphNodes.length,
            edgeCount: (graphEdges || []).length,
            contextualEdgeCount: (contextualEdges || []).length,
            keyNodeCount: (keyNodeIds || []).length,
        },
        graphTablesHtml: buildGraphTablesSection(
            session,
            graphEdges,
            contextualEdges,
            keyNodeIds
        ),
        explanationsHtml: buildExplanationSection(session),
        hypothesesHtml: buildHypothesisSection(session),
        datasetsHtml: buildDatasetSection(session),
        inspectorHtml: buildInspectorSection(session),
    };
}

const SNAPSHOT_STYLES = `
:root { color-scheme: light; }
body { margin: 0; font-family: "Segoe UI", Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.5; color: #33363d; background: #f6f5f2; }
.rkg-snap-page { max-width: 1100px; margin: 0 auto; padding: 28px 20px 48px; }
.rkg-snap-header { margin-bottom: 28px; }
.rkg-snap-header h1 { margin: 0 0 8px; font-size: 1.6rem; color: #2c5c97; }
.rkg-snap-lead { margin: 0; color: #6b6b6b; }
.rkg-snap-section { margin-bottom: 32px; background: #fff; border: 1px solid #e6e1d6; border-radius: 12px; padding: 18px 20px; }
.rkg-snap-section h2 { margin: 0 0 12px; font-size: 1.15rem; color: #2c5c97; }
.rkg-snap-graph-shell { overflow: auto; border: 1px solid #e6e1d6; border-radius: 10px; background: #f6f5f2; padding: 12px; }
.rkg-snap-graph-shell svg { display: block; max-width: 100%; height: auto; }
.rkg-snap-tab-details { margin-bottom: 10px; border: 1px solid #e6e1d6; border-radius: 10px; background: #faf9f7; }
.rkg-snap-tab-details summary { padding: 10px 12px; font-size: 13px; font-weight: 600; color: #2c5c97; cursor: pointer; }
.rkg-snap-tab-details > :not(summary) { padding: 0 12px 12px; }
.rkg-snap-table-wrap { overflow: auto; }
table { width: 100%; border-collapse: collapse; font-size: 12px; }
th, td { border-bottom: 1px solid #ece7de; padding: 8px 10px; text-align: left; vertical-align: top; }
th { background: #faf9f7; color: #2c5c97; font-size: 12px; }
.rkg-snap-card, .rkg-snap-subcard { margin-top: 14px; padding-top: 10px; border-top: 1px solid #ece7de; }
.rkg-snap-card:first-child, .rkg-snap-subcard:first-child { margin-top: 0; padding-top: 0; border-top: none; }
.rkg-snap-card h3, .rkg-snap-subcard h4 { margin: 0 0 8px; color: #33363d; }
.rkg-snap-meta { margin: 0 0 10px; color: #6b6b6b; font-size: 12px; }
.rkg-snap-empty { margin: 0; color: #6b6b6b; font-style: italic; }
.rkg-snap-markdown p, .rkg-snap-markdown ul { margin: 0 0 10px; }
.rkg-snap-details pre, pre { margin: 8px 0 0; padding: 10px 12px; border-radius: 8px; background: #f3f1ec; overflow: auto; font-size: 12px; white-space: pre-wrap; }
`;

export function buildGraphSnapshotHtml(snapshotData) {
    const title = escapeHtml(snapshotData.label);
    const exportedAt = escapeHtml(new Date(snapshotData.exportedAt).toLocaleString());
    const context = snapshotData.context
        ? `<p class="rkg-snap-lead"><strong>Context:</strong> ${escapeHtml(snapshotData.context)}</p>`
        : "";
    const summary = snapshotData.graphSummary || {};
    const summaryLine = escapeHtml(
        [
            `${summary.nodeCount || 0} nodes`,
            `${summary.edgeCount || 0} edges`,
            summary.contextualEdgeCount
                ? `${summary.contextualEdgeCount} contextual edges`
                : "",
            summary.keyNodeCount ? `${summary.keyNodeCount} selected nodes` : "",
        ]
            .filter(Boolean)
            .join(" · ")
    );
    const graphSection = snapshotData.graphSvgMarkup
        ? `<div class="rkg-snap-graph-shell">${snapshotData.graphSvgMarkup}</div>`
        : `<p class="rkg-snap-empty">Graph visualization was not available when this snapshot was created.</p>`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} — REVEAL KG graph snapshot</title>
<style>${SNAPSHOT_STYLES}</style>
</head>
<body>
<main class="rkg-snap-page">
<header class="rkg-snap-header">
<h1>${title}</h1>
<p class="rkg-snap-lead">REVEAL KG Canvas graph snapshot · exported ${exportedAt}</p>
<p class="rkg-snap-lead">${summaryLine}</p>
${context}
</header>

<section class="rkg-snap-section" id="graph-network">
<h2>Graph network</h2>
${graphSection}
</section>

<section class="rkg-snap-section" id="graph-tables">
<h2>Graph tables</h2>
<p class="rkg-snap-meta">Retrieved nodes from graph build and expansion, grouped by node type.</p>
${snapshotData.graphTablesHtml}
</section>

<section class="rkg-snap-section" id="explanations">
<h2>Explanations</h2>
${snapshotData.explanationsHtml}
</section>

<section class="rkg-snap-section" id="hypotheses">
<h2>Hypotheses</h2>
${snapshotData.hypothesesHtml}
</section>

<section class="rkg-snap-section" id="datasets">
<h2>Datasets</h2>
${snapshotData.datasetsHtml}
</section>

<section class="rkg-snap-section" id="inspector">
<h2>Inspector contents</h2>
<p class="rkg-snap-meta">Cached evidence from nodes and edges you inspected during this session.</p>
${snapshotData.inspectorHtml}
</section>
</main>
</body>
</html>`;
}

export function triggerGraphSnapshotDownload(filename, html) {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    return true;
}

export async function downloadGraphSnapshotFromSession(
    session,
    { label, graphSvgMarkup, graphEdges, contextualEdges, keyNodeIds } = {}
) {
    try {
        const snapshotData = collectGraphSnapshotData(session, {
            graphSvgMarkup,
            graphEdges,
            contextualEdges,
            keyNodeIds,
        });
        snapshotData.label = String(label || snapshotData.label).trim() || snapshotData.label;
        const html = buildGraphSnapshotHtml(snapshotData);
        const filename = defaultGraphSnapshotFilename(snapshotData.label);
        triggerGraphSnapshotDownload(filename, html);
        return { ok: true, filename, label: snapshotData.label };
    } catch (error) {
        return {
            ok: false,
            reason: String(error?.message || error || "unknown error"),
        };
    }
}
