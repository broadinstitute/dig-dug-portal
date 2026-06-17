/** Stable keys and helpers for heatmap node selection (traits, gene sets, genes, crossings). */

export const HEATMAP_SELECTION_KIND = {
    ROW: "row",
    GENE_SET: "gene-set",
    GENE: "gene",
    CROSSING: "crossing",
    NETWORK_NODE: "network-node",
};

/** Orange highlight shared by heatmap and data-tab network selection. */
export const SELECTION_HIGHLIGHT_ORANGE = {
    nodeBackground: "#ff6600",
    nodeBorder: "#e55a00",
    edge: "#ff6600",
    label: "#ff6600",
};

export function rowSelectionKey({ phenotype, factor, fetchedDirection }) {
    const p = phenotype != null ? String(phenotype) : "";
    const f = factor != null ? String(factor) : "";
    const d = fetchedDirection != null ? String(fetchedDirection) : "";
    return `row:${p}|${f}|${d}`;
}

export function geneSetSelectionKey(geneSetId) {
    return `gs:${String(geneSetId || "").trim()}`;
}

export function geneSelectionKey(geneSymbol) {
    return `gene:${String(geneSymbol || "").trim()}`;
}

export function crossingSelectionKey(rowKey, colKey) {
    return `cross:${rowKey}|${colKey}`;
}

/** Stable identity for crossings regardless of fetchedDirection on the row axis. */
export function crossingSelectionIdentity(crossing) {
    if (!crossing) return "";
    const row = parseRowSelectionKey(crossing.rowKey);
    if (!row) return crossing.key || "";
    const colPart = crossing.colIsGeneSet
        ? geneSetSelectionKey(crossing.colLabel)
        : geneSelectionKey(crossing.colLabel);
    return `cross-id:${row.phenotype}|${row.factor}|${colPart}`;
}

function rowKeysMatchLoose(rowKeyA, rowKeyB) {
    if (!rowKeyA || !rowKeyB) return false;
    if (rowKeyA === rowKeyB) return true;
    const a = parseRowSelectionKey(rowKeyA);
    const b = parseRowSelectionKey(rowKeyB);
    return !!(a && b && a.phenotype === b.phenotype && a.factor === b.factor);
}

export function rowKeyFromTableRow(row) {
    if (!row) return "";
    const direction =
        row.fetched_direction != null && String(row.fetched_direction).trim() !== ""
            ? String(row.fetched_direction).trim()
            : row.fetchDirection != null && String(row.fetchDirection).trim() !== ""
              ? String(row.fetchDirection).trim()
              : row.route_category != null
                ? String(row.route_category).trim()
                : "";
    return rowSelectionKey({
        phenotype: row.phenotype,
        factor: row.factor,
        fetchedDirection: direction,
    });
}

export function formatRowSelectionLabel(rowMeta) {
    const parts = [];
    if (rowMeta.fetchedDirection) parts.push(rowMeta.fetchedDirection);
    if (rowMeta.phenotypeDisplay) parts.push(rowMeta.phenotypeDisplay);
    else if (rowMeta.phenotype) parts.push(rowMeta.phenotype);
    if (rowMeta.factorClusterLabel) parts.push(rowMeta.factorClusterLabel);
    return parts.join(" · ") || "Phenotype row";
}

export function buildRowSelectionNode(rowMeta) {
    const key = rowSelectionKey({
        phenotype: rowMeta.phenotype,
        factor: rowMeta.factor,
        fetchedDirection: rowMeta.fetchedDirection,
    });
    return {
        key,
        kind: HEATMAP_SELECTION_KIND.ROW,
        label: formatRowSelectionLabel(rowMeta),
        phenotype: rowMeta.phenotype,
        factor: rowMeta.factor,
        fetchedDirection: rowMeta.fetchedDirection || "",
    };
}

export function buildGeneSetSelectionNode(geneSetId) {
    const id = String(geneSetId || "").trim();
    return {
        key: geneSetSelectionKey(id),
        kind: HEATMAP_SELECTION_KIND.GENE_SET,
        label: id,
        geneSetId: id,
    };
}

export function buildGeneSelectionNode(geneSymbol) {
    const gene = String(geneSymbol || "").trim();
    return {
        key: geneSelectionKey(gene),
        kind: HEATMAP_SELECTION_KIND.GENE,
        label: gene,
        gene,
    };
}

export function buildCrossingSelectionNode(rowMeta, colLabel, isGeneSetColumn) {
    const rowKey = rowSelectionKey({
        phenotype: rowMeta.phenotype,
        factor: rowMeta.factor,
        fetchedDirection: rowMeta.fetchedDirection,
    });
    const colKey = isGeneSetColumn ? geneSetSelectionKey(colLabel) : geneSelectionKey(colLabel);
    const rowLabel = formatRowSelectionLabel(rowMeta);
    return {
        key: crossingSelectionKey(rowKey, colKey),
        kind: HEATMAP_SELECTION_KIND.CROSSING,
        label: `${rowLabel} × ${colLabel}`,
        rowKey,
        colKey,
        phenotype: rowMeta.phenotype,
        factor: rowMeta.factor,
        fetchedDirection: rowMeta.fetchedDirection || "",
        colLabel,
        colIsGeneSet: !!isGeneSetColumn,
    };
}

export function isSelectionNodeSelected(selectedNodes, node) {
    if (!node || !node.key) return false;
    if (node.kind === HEATMAP_SELECTION_KIND.CROSSING) {
        const identity = crossingSelectionIdentity(node);
        return (selectedNodes || []).some(
            (n) => n && n.kind === HEATMAP_SELECTION_KIND.CROSSING && crossingSelectionIdentity(n) === identity
        );
    }
    return (selectedNodes || []).some((n) => n && n.key === node.key);
}

export function toggleSelectionNode(selectedNodes, node) {
    const list = Array.isArray(selectedNodes) ? selectedNodes.slice() : [];
    if (node && node.kind === HEATMAP_SELECTION_KIND.CROSSING) {
        const identity = crossingSelectionIdentity(node);
        const idx = list.findIndex(
            (n) => n && n.kind === HEATMAP_SELECTION_KIND.CROSSING && crossingSelectionIdentity(n) === identity
        );
        if (idx >= 0) {
            list.splice(idx, 1);
            return list;
        }
        list.push(node);
        return list;
    }
    const idx = list.findIndex((n) => n && n.key === node.key);
    if (idx >= 0) {
        list.splice(idx, 1);
        return list;
    }
    list.push(node);
    return list;
}

export function removeSelectionNode(selectedNodes, key) {
    return (selectedNodes || []).filter((n) => n && n.key !== key);
}

function rowMetaFromFactorRow(rowMeta) {
    return rowSelectionKey({
        phenotype: rowMeta.phenotype,
        factor: rowMeta.factor,
        fetchedDirection: rowMeta.fetchedDirection,
    });
}

export function isHeatmapRowHighlighted(rowMeta, selectedNodes) {
    const rk = rowMetaFromFactorRow(rowMeta);
    return (selectedNodes || []).some((n) => {
        if (!n) return false;
        if (n.kind === HEATMAP_SELECTION_KIND.ROW) return n.key === rk;
        if (n.kind === HEATMAP_SELECTION_KIND.CROSSING) return rowKeysMatchLoose(n.rowKey, rk);
        return false;
    });
}

export function isHeatmapColHighlighted(colLabel, colIndex, geneSetCount, selectedNodes) {
    const colKey =
        colIndex < geneSetCount ? geneSetSelectionKey(colLabel) : geneSelectionKey(colLabel);
    return (selectedNodes || []).some((n) => {
        if (!n) return false;
        if (n.kind === HEATMAP_SELECTION_KIND.GENE_SET && colIndex < geneSetCount) {
            return n.key === colKey;
        }
        if (n.kind === HEATMAP_SELECTION_KIND.GENE && colIndex >= geneSetCount) {
            return n.key === colKey;
        }
        if (n.kind === HEATMAP_SELECTION_KIND.CROSSING) return n.colKey === colKey;
        return false;
    });
}

export function isHeatmapCellHighlighted(rowMeta, colLabel, colIndex, geneSetCount, selectedNodes) {
    const rk = rowMetaFromFactorRow(rowMeta);
    const colKey =
        colIndex < geneSetCount ? geneSetSelectionKey(colLabel) : geneSelectionKey(colLabel);
    return (selectedNodes || []).some((n) => {
        if (!n || n.kind !== HEATMAP_SELECTION_KIND.CROSSING) return false;
        if (!rowKeysMatchLoose(n.rowKey, rk)) return false;
        return n.colKey === colKey;
    });
}

function geneSetIdsForRow(row) {
    const top = row && row.top_gene_sets;
    if (typeof top !== "string" || !top.trim()) return [];
    return top.split(";").map((s) => s.trim()).filter(Boolean);
}

function rowHasGene(row, gene, factorData) {
    const phenotype = row && row.phenotype;
    const data = factorData && phenotype ? factorData[phenotype] : null;
    if (!data || !data.genes) return false;
    return Object.prototype.hasOwnProperty.call(data.genes, gene);
}

/**
 * When heatmap selections exist, narrow table rows used for hypothesis generation.
 * Empty selection preserves the incoming rows unchanged.
 */
export function filterTableRowsByHeatmapSelection(rows, selectedNodes, factorData = {}) {
    const list = Array.isArray(rows) ? rows : [];
    const selected = Array.isArray(selectedNodes) ? selectedNodes : [];
    if (!selected.length) return list;

    const rowKeys = new Set();
    const geneSets = new Set();
    const genes = new Set();
    const crossings = [];

    selected.forEach((n) => {
        if (!n) return;
        if (n.kind === HEATMAP_SELECTION_KIND.ROW) rowKeys.add(n.key);
        else if (n.kind === HEATMAP_SELECTION_KIND.GENE_SET && n.geneSetId) geneSets.add(n.geneSetId);
        else if (n.kind === HEATMAP_SELECTION_KIND.GENE && n.gene) genes.add(n.gene);
        else if (n.kind === HEATMAP_SELECTION_KIND.CROSSING) crossings.push(n);
    });

    return list.filter((row) => {
        const rk = rowKeyFromTableRow(row);

        if (crossings.length) {
            return crossings.some((c) => {
                if (!rowKeysMatchLoose(c.rowKey, rk)) return false;
                if (c.colIsGeneSet) {
                    return geneSetIdsForRow(row).includes(c.colLabel);
                }
                return rowHasGene(row, c.colLabel, factorData);
            });
        }

        const rowOk = !rowKeys.size || rowKeys.has(rk);
        const gsOk =
            !geneSets.size ||
            geneSetIdsForRow(row).some((id) => geneSets.has(id));
        const geneOk =
            !genes.size || Array.from(genes).some((g) => rowHasGene(row, g, factorData));
        return rowOk && gsOk && geneOk;
    });
}

export function parseFactorNetworkNodeId(id) {
    const s = String(id || "");
    if (!s.startsWith("factor:")) return null;
    const rest = s.slice(7);
    const pipe = rest.indexOf("|");
    if (pipe < 0) return null;
    return { phenotype: rest.slice(0, pipe), factor: rest.slice(pipe + 1) };
}

export function parseGeneSetNetworkNodeId(id) {
    const m = String(id || "").match(/^gs:([^|]+)\|([^|]+)\|(.+)$/);
    if (!m) return null;
    return { phenotype: m[1], factor: m[2], geneSetId: m[3] };
}

export function parseRowSelectionKey(rowKey) {
    const s = String(rowKey || "");
    if (!s.startsWith("row:")) return null;
    const rest = s.slice(4);
    const parts = rest.split("|");
    if (parts.length < 2) return null;
    const phenotype = parts[0];
    const factor = parts[1];
    const fetchedDirection = parts.length > 2 ? parts.slice(2).join("|") : "";
    return { phenotype, factor, fetchedDirection };
}

/** Factor / gene / gene-set vis node ids implied by a heatmap crossing selection. */
export function networkNodeIdsForCrossing(crossing) {
    if (!crossing || crossing.kind !== HEATMAP_SELECTION_KIND.CROSSING) return [];
    const row = parseRowSelectionKey(crossing.rowKey);
    if (!row) return [];
    const ids = [`factor:${row.phenotype}|${row.factor}`];
    if (crossing.colIsGeneSet) {
        ids.push(`gs:${row.phenotype}|${row.factor}|${crossing.colLabel}`);
    } else if (crossing.colLabel) {
        ids.push(`gene:${crossing.colLabel}`);
    }
    return ids;
}

/** True when a vis edge corresponds to a heatmap row×column crossing. */
export function edgeMatchesHeatmapCrossing(visEdge, crossing) {
    if (!visEdge || !crossing || crossing.kind !== HEATMAP_SELECTION_KIND.CROSSING) return false;
    const row = parseRowSelectionKey(crossing.rowKey);
    if (!row) return false;
    const from = String(visEdge.from);
    const to = String(visEdge.to);
    const factorId = `factor:${row.phenotype}|${row.factor}`;
    const gsPrefix = `gs:${row.phenotype}|${row.factor}|`;

    if (crossing.colIsGeneSet) {
        const gsId = `${gsPrefix}${crossing.colLabel}`;
        return (
            (from === factorId && to === gsId) ||
            (from === gsId && to === factorId)
        );
    }

    const geneId = `gene:${crossing.colLabel}`;
    const touchesGene = from === geneId || to === geneId;
    if (!touchesGene) return false;
    const other = from === geneId ? to : from;
    return other.startsWith(gsPrefix);
}

/**
 * Map a network edge to a heatmap crossing when endpoints are factor↔gs or gene↔gs.
 */
export function resolveCrossingFromNetworkEdge(fromId, toId) {
    const from = String(fromId || "");
    const to = String(toId || "");
    const factorFrom = parseFactorNetworkNodeId(from);
    const factorTo = parseFactorNetworkNodeId(to);
    const gsFrom = parseGeneSetNetworkNodeId(from);
    const gsTo = parseGeneSetNetworkNodeId(to);

    if (factorFrom && gsTo) {
        return buildCrossingSelectionNode(
            {
                phenotype: gsTo.phenotype,
                factor: gsTo.factor,
                fetchedDirection: "",
                phenotypeDisplay: gsTo.phenotype,
                factorClusterLabel: from,
            },
            gsTo.geneSetId,
            true
        );
    }
    if (factorTo && gsFrom) {
        return buildCrossingSelectionNode(
            {
                phenotype: gsFrom.phenotype,
                factor: gsFrom.factor,
                fetchedDirection: "",
                phenotypeDisplay: gsFrom.phenotype,
                factorClusterLabel: to,
            },
            gsFrom.geneSetId,
            true
        );
    }

    const geneId = from.startsWith("gene:") ? from : to.startsWith("gene:") ? to : "";
    const gsParsed = gsFrom || gsTo;
    if (geneId && gsParsed) {
        const gene = geneId.replace(/^gene:/i, "").trim();
        return buildCrossingSelectionNode(
            {
                phenotype: gsParsed.phenotype,
                factor: gsParsed.factor,
                fetchedDirection: "",
                phenotypeDisplay: gsParsed.phenotype,
            },
            gene,
            false
        );
    }
    return null;
}

export function networkEdgeSelectionKey(fromId, toId) {
    return `edge:${String(fromId)}|${String(toId)}`;
}

export function buildNetworkNodeSelectionNode(graphNode) {
    if (!graphNode || !graphNode.id) return null;
    const id = String(graphNode.id);
    const type = graphNode.type || "Gene";
    const label = String(graphNode.label || id);

    if (type === "Gene") {
        const gene = label.replace(/^gene:/i, "").trim() || id.replace(/^gene:/i, "").trim();
        return { ...buildGeneSelectionNode(gene), networkNodeId: id };
    }
    if (type === "Pathway") {
        const parsed = parseGeneSetNetworkNodeId(id);
        const gsName = parsed ? parsed.geneSetId : label;
        return { ...buildGeneSetSelectionNode(gsName), networkNodeId: id };
    }
    if (type === "Factor") {
        const parsed = parseFactorNetworkNodeId(id);
        if (parsed) {
            return {
                ...buildRowSelectionNode({
                    phenotype: parsed.phenotype,
                    factor: parsed.factor,
                    fetchedDirection: "",
                    phenotypeDisplay: parsed.phenotype,
                    factorClusterLabel: label,
                }),
                networkNodeId: id,
            };
        }
    }
    if (type === "Phenotype") {
        const pheno = id.replace(/^pheno:/i, "").trim() || label;
        return {
            key: `net-node:${id}`,
            kind: HEATMAP_SELECTION_KIND.NETWORK_NODE,
            label: pheno,
            networkNodeId: id,
        };
    }
    return {
        key: `net-node:${id}`,
        kind: HEATMAP_SELECTION_KIND.NETWORK_NODE,
        label,
        networkNodeId: id,
    };
}

export function buildNetworkEdgeSelectionNode(visEdge, nodeMap = {}) {
    if (!visEdge || visEdge.from == null || visEdge.to == null) return null;
    const fromId = String(visEdge.from);
    const toId = String(visEdge.to);
    const fromNode = nodeMap[fromId];
    const toNode = nodeMap[toId];
    const fromLabel = (fromNode && (fromNode.label || fromNode.id)) || fromId;
    const toLabel = (toNode && (toNode.label || toNode.id)) || toId;
    const predicate = String(visEdge.title || "").trim();
    const edgeLabel = predicate ? `${fromLabel} → ${toLabel} (${predicate})` : `${fromLabel} → ${toLabel}`;
    const crossing = resolveCrossingFromNetworkEdge(fromId, toId);
    if (crossing) {
        return {
            ...crossing,
            label: edgeLabel,
            sourceId: fromId,
            targetId: toId,
            networkEdge: true,
            edgeVisId: visEdge.id,
        };
    }
    return {
        key: networkEdgeSelectionKey(fromId, toId),
        kind: HEATMAP_SELECTION_KIND.CROSSING,
        label: edgeLabel,
        sourceId: fromId,
        targetId: toId,
        networkEdge: true,
        edgeVisId: visEdge.id,
    };
}

export function isNetworkNodeHighlighted(nodeId, selectedNodes) {
    const id = String(nodeId || "");
    if (!id) return false;
    return (selectedNodes || []).some((n) => {
        if (!n) return false;
        if (n.networkNodeId === id) return true;
        if (n.networkEdge && (n.sourceId === id || n.targetId === id)) return true;
        if (n.kind === HEATMAP_SELECTION_KIND.GENE && id === `gene:${n.gene}`) return true;
        if (n.kind === HEATMAP_SELECTION_KIND.GENE_SET && id.startsWith("gs:") && id.endsWith(`|${n.geneSetId}`)) {
            return true;
        }
        if (n.kind === HEATMAP_SELECTION_KIND.ROW && id.startsWith("factor:")) {
            const parsed = parseFactorNetworkNodeId(id);
            if (!parsed) return false;
            return (
                n.key ===
                rowSelectionKey({
                    phenotype: parsed.phenotype,
                    factor: parsed.factor,
                    fetchedDirection: n.fetchedDirection || "",
                })
            );
        }
        if (n.kind === HEATMAP_SELECTION_KIND.CROSSING) {
            return networkNodeIdsForCrossing(n).includes(id);
        }
        return false;
    });
}

export function isNetworkEdgeHighlighted(visEdge, selectedNodes) {
    if (!visEdge) return false;
    const fromId = String(visEdge.from);
    const toId = String(visEdge.to);
    const key = networkEdgeSelectionKey(fromId, toId);
    const reverseKey = networkEdgeSelectionKey(toId, fromId);
    return (selectedNodes || []).some((n) => {
        if (!n) return false;
        if (n.kind === HEATMAP_SELECTION_KIND.CROSSING && edgeMatchesHeatmapCrossing(visEdge, n)) {
            return true;
        }
        if (!n.networkEdge) return false;
        if (n.key === key || n.key === reverseKey) return true;
        if (n.edgeVisId && visEdge.id && n.edgeVisId === visEdge.id) return true;
        return (
            (n.sourceId === fromId && n.targetId === toId) ||
            (n.sourceId === toId && n.targetId === fromId)
        );
    });
}
