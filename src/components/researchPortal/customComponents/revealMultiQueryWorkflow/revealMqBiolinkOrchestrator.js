/**
 * Biolink mechanism-network mapping orchestration for Multi Query REVEAL: NameRes/NodeNorm
 * label->CURIE mapping (phase 1, dashed edges shown immediately) followed by background TRAPI
 * edge validation. Generation-guarded against overlapping runs per mechanism index.
 * Operates on the shell component instance (`vm`) for session mutation and Vue reactivity ($set).
 */

import {
    edgeSupportedByTrapiRelay,
    fetchBiolinkNodeDetails,
    findNormalizedNodeEntry,
    inferBiolinkClassHintFromCurie,
    pickPrimaryBiolinkType,
    resolveLabelViaNameResolution,
    validateSingleMappedBiolinkEdge,
} from "./revealMqBiolinkApi.js";

function classifyBiolinkNodeType(className, fallbackType = "Entity") {
    const c = String(className || "").toLowerCase().replace(/\s+/g, "");
    if (c.includes("gene") || c.includes("protein")) return "Gene";
    if (
        c.includes("smallmolecule") ||
        c.includes("chemicalentity") ||
        c.includes("chemical_substance") ||
        c.includes("molecular_entity") ||
        c.includes("chemical")
    ) return "Metabolite";
    if (c.includes("biologicalprocess") || c.includes("pathway") || c.includes("activity")) return "Process";
    if (c.includes("phenotypicfeature") || c.includes("disease") || c.includes("trait")) return "Phenotype";
    if (c.includes("cell")) return "Cell";
    if (c.includes("drug")) return "Drug";
    return fallbackType || "Entity";
}

function inferBiolinkPredicate(actionLabel) {
    const s = String(actionLabel || "").trim().toLowerCase();
    if (!s) return "biolink:related_to";
    if (/inhibit|suppress|downreg|reduce|decrease|block/.test(s)) return "biolink:decreases_activity_of";
    if (/activat|increase|upreg|promot|induce|trigger/.test(s)) return "biolink:increases_activity_of";
    if (/cleav|degrad/.test(s)) return "biolink:affects";
    if (/mediat|modulat|regulat/.test(s)) return "biolink:regulates";
    return "biolink:related_to";
}

/** Edges-only visual state for TRAPI progress: skip network reclone when unchanged (e.g. empty TRAPI results). */
function biolinkEdgeVisualSignature(edges) {
    const list = Array.isArray(edges) ? edges : [];
    return JSON.stringify(
        list.map((e) => {
            const src =
                e.source != null
                    ? String(e.source)
                    : e.from != null
                      ? String(e.from)
                      : "";
            const tgt =
                e.target != null
                    ? String(e.target)
                    : e.to != null
                      ? String(e.to)
                      : "";
            const md = e.metadata || {};
            return {
                src,
                tgt,
                dashes: !!e.dashes,
                inferred: !!md.inferred_edge,
                validated: !!md.trapi_validated,
            };
        })
    );
}

function patchMechanismBiolinkTrapiProgress(vm, idx, edges, mappedNodes, trapiStats) {
    const m = vm.mechanisms[idx];
    if (!m || !m.biolink_core_spine_network) return;
    const prevEdges = m.biolink_core_spine_network.edges;
    const sigPrev = biolinkEdgeVisualSignature(prevEdges);
    const sigNext = biolinkEdgeVisualSignature(edges);
    if (sigPrev === sigNext) {
        vm.$set(vm.mechanisms, idx, {
            ...m,
            biolink_map_meta: {
                ...m.biolink_map_meta,
                trapi_edge_validation: { ...trapiStats },
            },
        });
        return;
    }
    const mappedNetwork = {
        ...m.biolink_core_spine_network,
        nodes: mappedNodes,
        edges,
    };
    const next = {
        ...m,
        biolink_core_spine_network: vm.cloneNetworkForMapView(mappedNetwork),
        biolink_map_meta: {
            ...m.biolink_map_meta,
            trapi_edge_validation: { ...trapiStats },
        },
    };
    if (next.map_view_mode === "biolink") {
        next.core_spine_network = vm.cloneNetworkForMapView(mappedNetwork);
    }
    vm.$set(vm.mechanisms, idx, next);
}

async function runBiolinkTrapiValidationForMechanism(vm, idx, gen) {
    if (!vm.revealBiolinkProxyBaseUrl) return;
    if ((vm.biolinkTrapiValidationGeneration[idx] || 0) !== gen) return;
    const m0 = vm.mechanisms[idx];
    if (!m0?.biolink_core_spine_network?.nodes) return;
    const initialEdges0 = Array.isArray(m0.biolink_core_spine_network.edges)
        ? m0.biolink_core_spine_network.edges
        : [];
    if (initialEdges0.length === 0) return;
    vm.$set(vm.biolinkTrapiValidatingByMechanism, idx, true);
    try {
        const m = vm.mechanisms[idx];
        if (!m?.biolink_core_spine_network?.nodes) return;
        const baseNet = m.biolink_core_spine_network;
        const mappedNodes = baseNet.nodes;
        const initialEdges = Array.isArray(baseNet.edges) ? baseNet.edges : [];
        const nodeById = {};
        mappedNodes.forEach((n) => {
            if (n && n.id != null) nodeById[String(n.id)] = n;
        });
        const out = [];
        let checked = 0;
        let supported = 0;
        let skipped = 0;
        for (let i = 0; i < initialEdges.length; i++) {
            if ((vm.biolinkTrapiValidationGeneration[idx] || 0) !== gen) return;
            const edge = initialEdges[i];
            const { builtEdge, checkedDelta, supportedDelta, skippedDelta } =
                await validateSingleMappedBiolinkEdge(vm, edge, nodeById);
            checked += checkedDelta;
            supported += supportedDelta;
            skipped += skippedDelta;
            out.push(builtEdge);
        }
        if ((vm.biolinkTrapiValidationGeneration[idx] || 0) !== gen) return;
        patchMechanismBiolinkTrapiProgress(vm, idx, out, mappedNodes, {
            checked,
            supported,
            skipped,
        });
    } finally {
        if ((vm.biolinkTrapiValidationGeneration[idx] || 0) === gen) {
            vm.$set(vm.biolinkTrapiValidatingByMechanism, idx, false);
        }
    }
}

function queueBiolinkTrapiValidation(vm, idx, gen) {
    if (!vm.revealBiolinkProxyBaseUrl) return;
    void runBiolinkTrapiValidationForMechanism(vm, idx, gen);
}

/**
 * NameRes + NodeNorm -> show Biolink map immediately (dashed edges), then TRAPI validation in the background.
 */
async function mapMechanismBiolinkPhase1Only(vm, idx) {
    const mechanism = Array.isArray(vm.mechanisms) ? vm.mechanisms[idx] : null;
    if (!mechanism || !mechanism.core_spine_network || !Array.isArray(mechanism.core_spine_network.nodes)) {
        return;
    }
    const nextGen = (vm.biolinkTrapiValidationGeneration[idx] || 0) + 1;
    vm.$set(vm.biolinkTrapiValidationGeneration, idx, nextGen);
    const gen = nextGen;
    vm.$set(vm.biolinkTrapiValidatingByMechanism, idx, false);
    vm.$set(vm.biolinkMappingByMechanism, idx, true);
    try {
        const src = mechanism.original_core_spine_network || mechanism.core_spine_network || {};
        const nodes = Array.isArray(src.nodes) ? src.nodes : [];
        const edges = Array.isArray(src.edges) ? src.edges : [];
        if (!nodes.length) return;

        const resolveByLabel = {};
        for (const node of nodes) {
            const label = String(node.label || node.id || "").trim();
            if (!label) continue;
            if (!Object.prototype.hasOwnProperty.call(resolveByLabel, label)) {
                resolveByLabel[label] = await resolveLabelViaNameResolution(vm, label);
            }
        }
        const curies = [...new Set(Object.values(resolveByLabel).map((r) => r.curie).filter(Boolean))];
        const normByCurie = await fetchBiolinkNodeDetails(vm, curies);

        let mappedNodeCount = 0;
        let unmappedNodeCount = 0;
        const mappedNodes = nodes.map((node) => {
            const originalLabel = String(node.label || node.id || "").trim();
            const nameHit = resolveByLabel[originalLabel] || { curie: null, resolverLabel: "" };
            const curie = nameHit.curie || null;
            const resolverLabel = nameHit.resolverLabel || "";
            const normalized = curie ? findNormalizedNodeEntry(normByCurie, curie) : null;
            const normId = normalized && normalized.id ? normalized.id : {};
            const types = normalized && Array.isArray(normalized.type) ? normalized.type : [];
            let biolinkClass = pickPrimaryBiolinkType(types);
            if (!biolinkClass && curie) biolinkClass = inferBiolinkClassHintFromCurie(curie);
            const normalizedLabel =
                normId.label != null && String(normId.label).trim() !== ""
                    ? String(normId.label).trim()
                    : "";
            const preferredId =
                normId.identifier != null && String(normId.identifier).trim() !== ""
                    ? String(normId.identifier).trim()
                    : curie || "";
            const hasNodeNorm = !!(normalized && (normId.identifier || normId.label));
            const displayLabel =
                normalizedLabel ||
                (hasNodeNorm ? preferredId : "") ||
                resolverLabel ||
                originalLabel ||
                String(node.id || "");
            const metadata = {
                ...(node.metadata || {}),
                original_label: originalLabel,
            };
            if (curie) metadata.curie = String(curie);
            if (preferredId) metadata.primary_identifier = preferredId;
            if (biolinkClass) metadata.biolink_class = biolinkClass;
            if (resolverLabel && resolverLabel !== displayLabel) {
                metadata.name_resolver_label = resolverLabel;
            }
            const resolvedLexically = !!curie;
            if (resolvedLexically) mappedNodeCount += 1;
            else unmappedNodeCount += 1;
            if (!resolvedLexically) metadata.biolink_unmapped = true;
            const nextType = resolvedLexically
                ? classifyBiolinkNodeType(biolinkClass, node.type || "Entity")
                : (node.type || "Entity");
            return {
                ...node,
                type: nextType,
                label: displayLabel,
                metadata,
            };
        });
        const mappedEdges = edges.map((edge) => {
            const action = String(edge.label || edge.predicate || "").trim();
            return {
                ...edge,
                label: action || String(edge.label || edge.predicate || ""),
                predicate: inferBiolinkPredicate(action),
                dashes: true,
                metadata: {
                    ...(edge.metadata || {}),
                    biolink_mapped: true,
                    inferred_edge: true,
                },
            };
        });

        const mappedNetwork = {
            ...src,
            nodes: mappedNodes,
            edges: mappedEdges,
        };
        const mCurrent = vm.mechanisms[idx];
        if (!mCurrent) return;
        if ((vm.biolinkTrapiValidationGeneration[idx] || 0) !== gen) return;

        const originalStored = mechanism.original_core_spine_network
            ? vm.cloneNetworkForMapView(mechanism.original_core_spine_network)
            : vm.cloneNetworkForMapView(src);
        const nextMechanism = {
            ...mCurrent,
            original_core_spine_network: originalStored,
            biolink_core_spine_network: vm.cloneNetworkForMapView(mappedNetwork),
            /** Default to Biolink spine after phase-1 mapping; users can toggle back to original map. */
            map_view_mode: "biolink",
            core_spine_network: vm.cloneNetworkForMapView(mappedNetwork),
            biolink_map_meta: {
                mappedNodeCount,
                unmappedNodeCount,
                totalNodeCount: nodes.length,
                mappedAt: new Date().toISOString(),
            },
        };
        vm.$set(vm.mechanisms, idx, nextMechanism);
        queueBiolinkTrapiValidation(vm, idx, gen);
    } finally {
        vm.$set(vm.biolinkMappingByMechanism, idx, false);
    }
}

async function autoMapAllMechanismsToBiolink(vm) {
    const arr = vm.mechanisms;
    if (!Array.isArray(arr) || !arr.length) return;
    const jobs = [];
    for (let i = 0; i < arr.length; i++) {
        const m = arr[i];
        if (!m?.core_spine_network?.nodes?.length) continue;
        if (vm.hasMechanismBiolinkNetwork(m)) continue;
        jobs.push(mapMechanismBiolinkPhase1Only(vm, i));
    }
    await Promise.all(jobs);
}

export {
    autoMapAllMechanismsToBiolink,
    biolinkEdgeVisualSignature,
    classifyBiolinkNodeType,
    inferBiolinkPredicate,
    mapMechanismBiolinkPhase1Only,
    patchMechanismBiolinkTrapiProgress,
    queueBiolinkTrapiValidation,
    runBiolinkTrapiValidationForMechanism,
};
