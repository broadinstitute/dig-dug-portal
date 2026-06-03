/** Node and edge colors for REVEAL KG workspace tree graph (Playground parity). */

export const ACTIVE_SET_NODE_COLOR = "#ff6600";
export const TREE_VIEW_DEFAULT_NODE_COLOR = "#777777";
/** Starting nodes — gray diamond when not highlighted. */
export const TREE_VIEW_ANCHOR_NODE_COLOR = "#888888";
/** User-marked nodes of interest — blue circle or blue diamond. */
export const TREE_VIEW_HIGHLIGHTED_NODE_COLOR = "#488bf7";
export const TREE_VIEW_EDGE_COLOR = "#b0a890";

export const HIERARCHY_LAYERS = [
    { key: "gene", label: "Genes" },
    { key: "gene_set", label: "Gene sets" },
    { key: "factor", label: "Mechanisms" },
    { key: "trait", label: "Traits" },
];

export function hierarchyLayerIndex(node) {
    const nodeType = String(node?.type || node?.node_type || node?.nodeType || "").toLowerCase();
    if (nodeType === "gene") {
        return 0;
    }
    if (nodeType === "gene_set") {
        return 1;
    }
    if (nodeType === "factor" || nodeType === "mechanism") {
        return 2;
    }
    if (nodeType === "trait") {
        return 3;
    }
    return -1;
}
