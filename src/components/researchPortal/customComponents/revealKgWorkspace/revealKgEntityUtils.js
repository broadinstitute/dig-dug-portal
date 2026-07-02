/** Shared helpers for initial-graph entity pickers (catalog + semantic match). */

/** Column order for Search & select (initial graph). */
export const STARTER_ENTITY_ORDER = ["gene", "gene_set", "factor", "trait"];

export const STARTER_COLUMN_CONFIG = [
    { entityType: "gene", title: "Genes", columnKey: "starter-gene" },
    { entityType: "gene_set", title: "Gene sets", columnKey: "starter-gene-set" },
    { entityType: "factor", title: "Mechanisms", columnKey: "starter-factor" },
    { entityType: "trait", title: "Traits", columnKey: "starter-trait" },
];

export const ENTITY_COLUMN_TITLES = {
    gene: "Genes",
    gene_set: "Gene sets",
    trait: "Traits",
    factor: "Mechanisms",
};

function stripMechanismFactorIdSuffix(text) {
    let t = String(text || "").trim();
    let next = t.replace(/\s*\(Factor\s*\d+\)\s*$/i, "").trim();
    while (next !== t) {
        t = next;
        next = t.replace(/\s*\(Factor\s*\d+\)\s*$/i, "").trim();
    }
    return t;
}

export function interactiveEntityKey(item) {
    if (!item || typeof item !== "object") {
        return null;
    }
    return item.node_id || item.id || item.node_key || null;
}

export function catalogItemNodeId(item) {
    const key = interactiveEntityKey(item);
    return key ? String(key) : "";
}

export function catalogItemAlreadyAdded(item, existingNodeIds = []) {
    const nodeId = catalogItemNodeId(item);
    if (!nodeId) {
        return false;
    }
    const existing = existingNodeIds instanceof Set
        ? existingNodeIds
        : new Set((existingNodeIds || []).map((id) => String(id)));
    return existing.has(nodeId);
}

export function formatEntityDisplayLabel(entityType, label) {
    const text = String(label || "").trim();
    if (!text) {
        return text;
    }
    if (entityType === "gene_set") {
        return text.replace(/_/g, " ");
    }
    return text;
}

export function formatEntitySearchSubtitle(entityType, item) {
    if (!item) {
        return null;
    }
    if (entityType === "gene") {
        return null;
    }
    if (entityType === "gene_set") {
        const line = (item.subtitle || item.node_key || "").trim();
        const score = Number(item.score);
        if (Number.isFinite(score)) {
            const scoreLabel = `match ${score.toFixed(2)}`;
            return line ? `${line} · ${scoreLabel}` : scoreLabel;
        }
        return line || null;
    }
    if (entityType === "factor") {
        const raw = (item.subtitle || item.node_key || "").trim();
        if (!raw) {
            return null;
        }
        const cleaned = stripMechanismFactorIdSuffix(raw);
        return cleaned || null;
    }
    const line = (item.subtitle || item.node_key || "").trim();
    return line || null;
}

export function normalizeInteractiveSemanticMatchRows(payload) {
    const raw =
        (Array.isArray(payload) ? payload : null) ??
        payload?.items ??
        payload?.matches ??
        payload?.results ??
        payload?.candidates ??
        payload?.data ??
        [];
    const list = Array.isArray(raw) ? raw : [];
    return list
        .map((row) => {
            if (!row || typeof row !== "object") {
                return null;
            }
            if (row.candidate && typeof row.candidate === "object") {
                const c = row.candidate;
                const nodeId = c.node_id ?? c.id ?? c.node_key;
                if (!nodeId) {
                    return null;
                }
                return {
                    ...c,
                    node_id: nodeId,
                    label: c.label ?? String(nodeId),
                    rationale: row.rationale ?? c.rationale,
                };
            }
            const nodeId = row.node_id ?? row.id ?? row.node_key;
            if (!nodeId) {
                return null;
            }
            return {
                ...row,
                node_id: nodeId,
                label: row.label ?? String(nodeId),
            };
        })
        .filter(Boolean);
}

export function normalizeStarterItem(entityType, item) {
    if (!item?.node_id && !item?.id) {
        return null;
    }
    const nodeId = item.node_id || item.id;
    const nodeType = String(item.node_type || item.type || entityType).toLowerCase();
    const rawLabel = item.label || nodeId;
    return {
        ...item,
        node_id: nodeId,
        node_type: nodeType,
        type: nodeType,
        label: formatEntityDisplayLabel(entityType, rawLabel),
        subtitle: item.subtitle || "",
    };
}

export function mergeUniqueItems(existing, additions) {
    const seen = new Set((existing || []).map((item) => item.node_id));
    const merged = [...(existing || [])];
    for (const item of additions || []) {
        if (!item?.node_id || seen.has(item.node_id)) {
            continue;
        }
        seen.add(item.node_id);
        merged.push(item);
    }
    return merged;
}

export function emptyStarterBuckets() {
    return { gene: [], gene_set: [], factor: [], trait: [] };
}

/** Clone starter bucket lists for duplicate / restore flows. */
export function cloneStarterBuckets(buckets) {
    const base = emptyStarterBuckets();
    if (!buckets || typeof buckets !== "object") {
        return base;
    }
    for (const entityType of STARTER_ENTITY_ORDER) {
        base[entityType] = (buckets[entityType] || []).map((item) => ({ ...item }));
    }
    return base;
}

/**
 * Build initial-graph picker buckets from saved graph nodes (starting nodes first).
 */
export function starterBucketsFromGraphNodes(nodes) {
    const buckets = emptyStarterBuckets();
    const list = Array.isArray(nodes) ? nodes : [];
    const anchorNodes = list.filter((node) => node?.is_anchor);
    const seeds = anchorNodes.length ? anchorNodes : list;

    for (const node of seeds) {
        const entityType = String(node.node_type || node.type || "").toLowerCase();
        if (!STARTER_ENTITY_ORDER.includes(entityType)) {
            continue;
        }
        const item = normalizeStarterItem(entityType, node);
        if (!item) {
            continue;
        }
        buckets[entityType] = mergeUniqueItems(buckets[entityType], [item]);
    }
    return buckets;
}

export function starterBucketsFromSession(session) {
    if (session?.starterBuckets && totalStarterCount(session.starterBuckets) > 0) {
        return cloneStarterBuckets(session.starterBuckets);
    }
    return starterBucketsFromGraphNodes(session?.graphNodes || session?.nodes || []);
}

export function starterItemsFromBuckets(buckets) {
    return STARTER_ENTITY_ORDER.flatMap((entityType) => buckets[entityType] || []);
}

export function totalStarterCount(buckets) {
    return STARTER_ENTITY_ORDER.reduce(
        (sum, entityType) => sum + (buckets[entityType]?.length || 0),
        0
    );
}

const STARTER_COUNT_LABELS = {
    gene: { one: "gene", many: "genes" },
    gene_set: { one: "gene set", many: "gene sets" },
    factor: { one: "mechanism", many: "mechanisms" },
    trait: { one: "trait", many: "traits" },
};

export function formatStarterCountSummary(buckets) {
    const parts = [];
    for (const entityType of STARTER_ENTITY_ORDER) {
        const count = buckets[entityType]?.length || 0;
        if (!count) {
            continue;
        }
        const labels = STARTER_COUNT_LABELS[entityType];
        parts.push(`${count} ${count === 1 ? labels.one : labels.many}`);
    }
    return parts;
}

export function anchorChipShouldShowSubtitle(entityType, subtitle) {
    const text = (subtitle || "").trim();
    if (!text) {
        return false;
    }
    const normalized = text.toLowerCase();
    if (entityType === "gene" && normalized === "gene") {
        return false;
    }
    if (entityType === "trait" && normalized === "trait") {
        return false;
    }
    if (entityType === "factor" && normalized === "mechanism") {
        return false;
    }
    if (entityType === "gene_set" && normalized === "gene set") {
        return false;
    }
    return true;
}
