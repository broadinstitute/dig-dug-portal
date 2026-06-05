/** Node and edge colors for REVEAL KG Canvas tree graph (Playground parity). */

export const ACTIVE_SET_NODE_COLOR = "#ff6600";
export const TREE_VIEW_DEFAULT_NODE_COLOR = "#777777";
/** Starting nodes — gray diamond when not a key node. */
export const TREE_VIEW_ANCHOR_NODE_COLOR = "#888888";
/** Key nodes — blue circle or blue diamond. */
export const TREE_VIEW_KEY_NODE_COLOR = "#488bf7";
export const TREE_VIEW_EDGE_COLOR = "#b0a890";
/** Inspector connected bubbles — 1-hop (prominent). */
export const INSPECTOR_DIRECT_NEIGHBOR_COLOR = "#e07b39";
/** Inspector connected bubbles — 2-hop only (muted). */
export const INSPECTOR_INDIRECT_NEIGHBOR_COLOR = TREE_VIEW_EDGE_COLOR;

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
