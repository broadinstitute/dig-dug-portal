/** Retrieval ledger for tabbed graph table (Playground mergeRetrievalLedger parity). */

function mergeOriginEntry(current, candidate, item) {
    const nodeId = candidate.node_id;
    if (!nodeId) {
        return current;
    }
    const prev = current[nodeId] || {
        node_id: nodeId,
        node_type: candidate.node_type || candidate.type || "",
        label: candidate.label || nodeId,
        subtitle: candidate.subtitle || "",
        aggregate_score: null,
        raw_max_score: null,
        raw_mean_score: null,
        support_path_count: 0,
        novelty_label: "NYA",
        relevance_label: "NYA",
        rationale: "NYA",
        last_reason: "unseen",
    };
    current[nodeId] = {
        ...prev,
        node_type: candidate.node_type || candidate.type || prev.node_type,
        label: candidate.label || prev.label,
        subtitle: candidate.subtitle || prev.subtitle,
        aggregate_score: Math.max(
            prev.aggregate_score ?? -Infinity,
            item.aggregate_score ?? -Infinity
        ),
        raw_max_score: Math.max(prev.raw_max_score ?? -Infinity, item.raw_max_score ?? -Infinity),
        raw_mean_score: Math.max(
            prev.raw_mean_score ?? -Infinity,
            item.raw_mean_score ?? -Infinity
        ),
        support_path_count: Math.max(
            prev.support_path_count ?? 0,
            item.support_path_count ?? 0
        ),
        last_reason: prev.last_reason || "unseen",
    };
    return current;
}

export function mergeRetrievalLedger(session, candidates = [], updates = {}) {
    const nextLedger = { ...(session?.retrievalLedger || {}) };

    for (const item of candidates || []) {
        const candidate = item?.candidate || {};
        mergeOriginEntry(nextLedger, candidate, item);
    }

    for (const [nodeId, labelInfo] of Object.entries(updates.labelsByNodeId || {})) {
        if (!nextLedger[nodeId]) {
            nextLedger[nodeId] = {
                node_id: nodeId,
                label: nodeId,
                novelty_label: "NYA",
                relevance_label: "NYA",
                rationale: "NYA",
                last_reason: "unseen",
            };
        }
        nextLedger[nodeId] = {
            ...nextLedger[nodeId],
            novelty_label: labelInfo?.novelty_label || nextLedger[nodeId].novelty_label || "NYA",
            relevance_label:
                labelInfo?.relevance_label || nextLedger[nodeId].relevance_label || "NYA",
            rationale: labelInfo?.rationale || nextLedger[nodeId].rationale || "NYA",
        };
    }

    for (const [nodeId, reason] of Object.entries(updates.reasonByNodeId || {})) {
        if (!nextLedger[nodeId]) {
            nextLedger[nodeId] = {
                node_id: nodeId,
                label: nodeId,
                novelty_label: "NYA",
                relevance_label: "NYA",
                rationale: "NYA",
                last_reason: "unseen",
            };
        }
        nextLedger[nodeId] = {
            ...nextLedger[nodeId],
            last_reason: reason || nextLedger[nodeId].last_reason || "unseen",
        };
    }

    return nextLedger;
}

export function ledgerEntryFromGraphNode(node, reason = "yes") {
    const nodeId = node?.id || node?.node_id;
    return {
        node_id: nodeId,
        node_type: String(node?.type || node?.node_type || "").toLowerCase(),
        label: node?.label || nodeId,
        subtitle: node?.subtitle || "",
        aggregate_score: node?.aggregate_score ?? null,
        raw_max_score: node?.raw_max_score ?? null,
        raw_mean_score: node?.raw_mean_score ?? null,
        novelty_label: node?.novelty_label || "NYA",
        relevance_label: node?.relevance_label || "NYA",
        rationale: node?.rationale || node?.subtitle || "NYA",
        last_reason: reason,
    };
}

/** Mark every node on the canvas as shown in the ledger. */
export function markGraphNodesShownInLedger(ledger, graphNodes = []) {
    const reasonByNodeId = {};
    for (const node of graphNodes || []) {
        const id = node?.id || node?.node_id;
        if (id) {
            reasonByNodeId[id] = "yes";
        }
    }
    return mergeRetrievalLedger({ retrievalLedger: ledger }, [], { reasonByNodeId });
}

export function getLedgerShownReason(entry, graphNodeIds) {
    const nodeId = entry?.node_id;
    if (nodeId && graphNodeIds.has(nodeId)) {
        return "yes";
    }
    return entry?.last_reason || "no";
}

export function effectiveRetrievalLedger(session) {
    const ledger = session?.retrievalLedger || {};
    if (Object.keys(ledger).length) {
        return ledger;
    }
    const fallback = {};
    for (const node of session?.graphNodes || []) {
        const entry = ledgerEntryFromGraphNode(node, "yes");
        if (entry.node_id) {
            fallback[entry.node_id] = entry;
        }
    }
    return fallback;
}
