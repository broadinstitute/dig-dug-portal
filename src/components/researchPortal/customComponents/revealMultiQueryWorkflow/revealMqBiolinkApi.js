/**
 * NameRes / NodeNorm / TRAPI relay HTTP calls for Biolink edge validation, Multi Query REVEAL.
 * Sibling to `revealMqHybridSearchApi.js` (same `vm.fetchWithTimeout` HTTP convention).
 */

function normalizeBiolinkLookupLabel(label) {
    return String(label == null ? "" : label).trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Name Resolution responses vary (array of hits, bulk map keyed by query, matches[], etc.).
 * @returns {{ curie: string | null, resolverLabel: string }}
 */
function extractTopHitFromNameResolutionResponse(json, queryLabel) {
    const q = String(queryLabel || "").trim();
    let arr = null;
    if (Array.isArray(json)) {
        arr = json;
    } else if (json && typeof json === "object") {
        if (q && Array.isArray(json[q])) arr = json[q];
        if (!arr && q) {
            const lk = Object.keys(json).find((k) => k.toLowerCase() === q.toLowerCase());
            if (lk && Array.isArray(json[lk])) arr = json[lk];
        }
        if (!arr && Array.isArray(json.matches)) arr = json.matches;
        if (!arr && Array.isArray(json.results)) arr = json.results;
        if (!arr && Array.isArray(json.items)) arr = json.items;
    }
    if (!arr || !arr.length) return { curie: null, resolverLabel: "" };
    const top = arr[0];
    if (!top || typeof top !== "object") return { curie: null, resolverLabel: "" };
    const curie = top.curie || top.identifier || top.id || null;
    const resolverLabel =
        top.label != null && String(top.label).trim() !== "" ? String(top.label).trim() : "";
    return {
        curie: curie != null ? String(curie) : null,
        resolverLabel,
    };
}

/** When NodeNorm omits types, infer a Biolink-style category from CURIE prefix for coloring. */
function inferBiolinkClassHintFromCurie(curie) {
    const c = String(curie || "").trim();
    if (!c) return "";
    const u = c.toUpperCase();
    if (/^(NCBIGENE|HGNC|ENSEMBL|ENSG|UNIPROT|PR):/i.test(c) || /^OMIM:/i.test(c)) return "biolink:Gene";
    if (/^(PUBCHEM|CHEBI|CHEMBL|DRUGBANK|HMDB|KEGG\.COMPOUND|MESH):/i.test(u)) return "biolink:SmallMolecule";
    if (/^(GO|REACTOME|WIKIPATHWAYS|PW):/i.test(c)) return "biolink:BiologicalProcess";
    if (/^(HP|MONDO|DOID|EFO|UMLS|SNOMED|NCIT):/i.test(c)) return "biolink:PhenotypicFeature";
    return "";
}

function pickPrimaryBiolinkType(types) {
    const list = Array.isArray(types) ? types.map((t) => String(t || "").trim()).filter(Boolean) : [];
    if (!list.length) return "";
    const tagged = list.find((t) => /biolink:/i.test(t));
    return String(tagged || list[0]);
}

function findNormalizedNodeEntry(normPayload, requestedCurie) {
    const req = String(requestedCurie || "").trim();
    if (!req || !normPayload || typeof normPayload !== "object") return null;
    if (normPayload[req]) return normPayload[req];
    const lower = req.toLowerCase();
    const key = Object.keys(normPayload).find((k) => String(k).toLowerCase() === lower);
    return key ? normPayload[key] : null;
}

/** TRAPI message: treat non-empty results as evidence the constrained edge can be supported by Translator. */
function trapiKnowledgeIndicatesEdgeSupport(trapiJson) {
    if (!trapiJson || typeof trapiJson !== "object" || trapiJson.error === true) return false;
    const msg = trapiJson.message;
    if (!msg || typeof msg !== "object") return false;
    const results = msg.results;
    if (Array.isArray(results) && results.length > 0) return true;
    return false;
}

function trapiCategoriesArray(biolinkClass) {
    const c = String(biolinkClass || "").trim();
    return c ? [c] : ["biolink:NamedThing"];
}

function isTrapiGeneLikeCategory(biolinkClass) {
    const c = String(biolinkClass || "").toLowerCase();
    return c.includes("gene") || c.includes("protein");
}

function isTrapiDiseaseLikeCategory(biolinkClass) {
    const c = String(biolinkClass || "").toLowerCase();
    return (
        c.includes("disease") ||
        c.includes("phenotyp") ||
        c.includes("condition") ||
        c.includes("syndrome")
    );
}

function edgeEndpointIdsFromMappedNode(node) {
    if (!node || !node.metadata || typeof node.metadata !== "object") return { subId: "", biolinkClass: "" };
    const m = node.metadata;
    const subId = String(m.primary_identifier || m.curie || "").trim();
    const biolinkClass = String(m.biolink_class || "").trim();
    return { subId, biolinkClass };
}

/**
 * NCATS Name Resolution: prefers query-string style POST (see NameResolution docs);
 * JSON-body variants are attempted as fallback.
 * @returns {{ curie: string | null, resolverLabel: string }}
 */
async function resolveLabelViaNameResolution(vm, label) {
    const key = normalizeBiolinkLookupLabel(label);
    if (!key) return { curie: null, resolverLabel: "" };
    if (Object.prototype.hasOwnProperty.call(vm.biolinkNameResolveByLabelCache, key)) {
        return vm.biolinkNameResolveByLabelCache[key];
    }
    const text = String(label || "").trim();
    if (!text) {
        const empty = { curie: null, resolverLabel: "" };
        vm.$set(vm.biolinkNameResolveByLabelCache, key, empty);
        return empty;
    }
    const proxyBase = vm.revealBiolinkProxyBaseUrl;
    if (proxyBase) {
        let best = { curie: null, resolverLabel: "" };
        try {
            const resp = await vm.fetchWithTimeout(
                `${proxyBase}/api/reveal/biolink/name-lookup`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Accept: "application/json" },
                    body: JSON.stringify({ label: text, limit: 8 }),
                },
                30000
            );
            if (resp.ok) {
                const json = await resp.json().catch(() => null);
                best = extractTopHitFromNameResolutionResponse(json, text);
            }
        } catch {
        }
        vm.$set(vm.biolinkNameResolveByLabelCache, key, best);
        return best;
    }
    const attempts = [];
    const bases = [
        "https://name-resolution-sri.renci.org/lookup",
        "https://name-resolution-sri.renci.org/1.3/lookup",
    ];
    bases.forEach((base) => {
        const qs = new URLSearchParams({ string: text, limit: "8" }).toString();
        attempts.push({
            url: `${base}?${qs}`,
            init: { method: "POST", headers: { Accept: "application/json" } },
        });
        attempts.push({
            url: `${base}?${qs}`,
            init: { method: "GET", headers: { Accept: "application/json" } },
        });
    });
    attempts.push({
        url: "https://name-resolution-sri.renci.org/1.3/lookup",
        init: {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({ string: text, offset: 0, limit: 8 }),
        },
    });
    attempts.push({
        url: "https://name-resolution-sri.renci.org/1.3/lookup",
        init: {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({ strings: [text], offset: 0, limit: 8 }),
        },
    });
    let best = { curie: null, resolverLabel: "" };
    for (const { url, init } of attempts) {
        try {
            const resp = await vm.fetchWithTimeout(url, init, 30000);
            if (!resp.ok) continue;
            const json = await resp.json().catch(() => null);
            const hit = extractTopHitFromNameResolutionResponse(json, text);
            if (hit.curie) {
                best = hit;
                break;
            }
            if (!best.resolverLabel && hit.resolverLabel) best = { ...hit };
        } catch {
        }
    }
    vm.$set(vm.biolinkNameResolveByLabelCache, key, best);
    return best;
}

async function fetchBiolinkNodeDetails(vm, curies) {
    const need = (curies || [])
        .map((c) => String(c || "").trim())
        .filter((c) => c && !Object.prototype.hasOwnProperty.call(vm.biolinkNodeByCurieCache, c));
    if (need.length) {
        try {
            const proxyBase = vm.revealBiolinkProxyBaseUrl;
            const normUrl = proxyBase
                ? `${proxyBase}/api/reveal/biolink/normalize-nodes`
                : "https://nodenormalization-sri.renci.org/1.3/get_normalized_nodes";
            const resp = await vm.fetchWithTimeout(
                normUrl,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Accept: "application/json" },
                    body: JSON.stringify({ curies: need }),
                },
                30000
            );
            const json = await resp.json().catch(() => ({}));
            if (resp.ok && json && typeof json === "object") {
                need.forEach((curie) => {
                    const entry = findNormalizedNodeEntry(json, curie);
                    vm.$set(vm.biolinkNodeByCurieCache, curie, entry);
                });
            } else {
                need.forEach((curie) => vm.$set(vm.biolinkNodeByCurieCache, curie, null));
            }
        } catch {
            need.forEach((curie) => vm.$set(vm.biolinkNodeByCurieCache, curie, null));
        }
    }
    const out = {};
    (curies || []).forEach((curie) => {
        const key = String(curie || "").trim();
        if (!key) return;
        out[key] = vm.biolinkNodeByCurieCache[key] ?? null;
    });
    return out;
}

async function trapiRelayPostTrapiMessage(vm, trapiEnvelope) {
    const base = vm.revealBiolinkProxyBaseUrl;
    if (!base) return null;
    try {
        const resp = await vm.fetchWithTimeout(
            `${base}/api/reveal/biolink/trapi-query`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify(trapiEnvelope),
            },
            35000
        );
        if (!resp.ok) return null;
        return await resp.json().catch(() => null);
    } catch {
        return null;
    }
}

/**
 * One-hop TRAPI via the REVEAL Biolink endpoint. Tries several QGs: inferred predicate, related_to,
 * standard gene<->disease predicates, swapped ends, and relaxed NamedThing categories --
 * because many KPs never index biolink:related_to for Gene-Disease pairs.
 * @returns {Promise<boolean>}
 */
async function edgeSupportedByTrapiRelay(vm, subjectId, subjectBiolinkCategory, objectId, objectBiolinkCategory, predicate) {
    if (!vm.revealBiolinkProxyBaseUrl) return false;
    const sId = String(subjectId || "").trim();
    const oId = String(objectId || "").trim();
    if (!sId || !oId || sId === oId) return false;

    const catA = trapiCategoriesArray(subjectBiolinkCategory);
    const catB = trapiCategoriesArray(objectBiolinkCategory);
    const nt = ["biolink:NamedThing"];
    const predPrimary =
        String(predicate || "biolink:related_to").trim() || "biolink:related_to";

    const aGene = isTrapiGeneLikeCategory(subjectBiolinkCategory);
    const aDis = isTrapiDiseaseLikeCategory(subjectBiolinkCategory);
    const bGene = isTrapiGeneLikeCategory(objectBiolinkCategory);
    const bDis = isTrapiDiseaseLikeCategory(objectBiolinkCategory);

    /** @type {{ n0: string, c0: string[], n1: string, c1: string[], p: string }[]} */
    const plan = [];
    const add = (n0, c0, n1, c1, p) => {
        const pr = String(p || "biolink:related_to").trim() || "biolink:related_to";
        plan.push({ n0, c0: [...c0], n1, c1: [...c1], p: pr });
    };

    add(sId, catA, oId, catB, predPrimary);
    if (predPrimary !== "biolink:related_to") add(sId, catA, oId, catB, "biolink:related_to");

    if (aGene && bDis) add(sId, catA, oId, catB, "biolink:gene_associated_with_condition");
    if (aDis && bGene) add(sId, catA, oId, catB, "biolink:condition_associated_with_gene");

    add(oId, catB, sId, catA, "biolink:related_to");

    if (bGene && aDis) add(oId, catB, sId, catA, "biolink:gene_associated_with_condition");
    if (bDis && aGene) add(oId, catB, sId, catA, "biolink:condition_associated_with_gene");

    add(sId, nt, oId, nt, "biolink:related_to");
    add(oId, nt, sId, nt, "biolink:related_to");

    if (aGene && bDis) add(sId, nt, oId, nt, "biolink:gene_associated_with_condition");
    if (aDis && bGene) add(sId, nt, oId, nt, "biolink:condition_associated_with_gene");

    const seen = new Set();
    for (const t of plan) {
        const body = {
            message: {
                query_graph: {
                    nodes: {
                        n0: { ids: [t.n0], categories: t.c0 },
                        n1: { ids: [t.n1], categories: t.c1 },
                    },
                    edges: {
                        e0: {
                            subject: "n0",
                            object: "n1",
                            predicates: [t.p],
                        },
                    },
                },
            },
        };
        const sig = JSON.stringify(body.message.query_graph);
        if (seen.has(sig)) continue;
        seen.add(sig);
        const json = await trapiRelayPostTrapiMessage(vm, body);
        if (trapiKnowledgeIndicatesEdgeSupport(json)) return true;
    }
    return false;
}

/**
 * Run one edge through Translator (relay); used for progressive and batch validation.
 */
async function validateSingleMappedBiolinkEdge(vm, edge, nodeById) {
    const srcKey =
        edge.source != null
            ? String(edge.source)
            : edge.from != null
              ? String(edge.from)
              : "";
    const tgtKey =
        edge.target != null
            ? String(edge.target)
            : edge.to != null
              ? String(edge.to)
              : "";
    const srcNode = nodeById[srcKey];
    const tgtNode = nodeById[tgtKey];
    const a = edgeEndpointIdsFromMappedNode(srcNode);
    const b = edgeEndpointIdsFromMappedNode(tgtNode);
    const pred = String(edge.predicate || "biolink:related_to").trim() || "biolink:related_to";
    let validated = false;
    let checkedDelta = 0;
    let supportedDelta = 0;
    let skippedDelta = 0;
    if (a.subId && b.subId) {
        checkedDelta = 1;
        validated = await edgeSupportedByTrapiRelay(
            vm,
            a.subId,
            a.biolinkClass,
            b.subId,
            b.biolinkClass,
            pred
        );
        if (validated) supportedDelta = 1;
    } else {
        skippedDelta = 1;
    }
    const builtEdge = {
        ...edge,
        dashes: !validated,
        metadata: {
            ...(edge.metadata || {}),
            inferred_edge: !validated,
            ...(a.subId && b.subId
                ? { trapi_validated: validated }
                : { trapi_validation_skipped: true }),
        },
    };
    return { builtEdge, checkedDelta, supportedDelta, skippedDelta };
}

/**
 * After Biolink node mapping, check each edge against Translator via REVEAL Biolink API (batch).
 */
async function validateBiolinkMappedEdgesViaRelay(vm, mappedNodes, mappedEdges) {
    const proxyBase = vm.revealBiolinkProxyBaseUrl;
    if (!proxyBase) {
        return { edges: mappedEdges, trapiStats: null };
    }
    const nodeById = {};
    (mappedNodes || []).forEach((n) => {
        if (n && n.id != null) nodeById[String(n.id)] = n;
    });
    const out = [];
    let checked = 0;
    let supported = 0;
    let skipped = 0;
    for (const edge of mappedEdges || []) {
        const { builtEdge, checkedDelta, supportedDelta, skippedDelta } =
            await validateSingleMappedBiolinkEdge(vm, edge, nodeById);
        checked += checkedDelta;
        supported += supportedDelta;
        skipped += skippedDelta;
        out.push(builtEdge);
    }
    return { edges: out, trapiStats: { checked, supported, skipped } };
}

export {
    edgeEndpointIdsFromMappedNode,
    edgeSupportedByTrapiRelay,
    extractTopHitFromNameResolutionResponse,
    fetchBiolinkNodeDetails,
    findNormalizedNodeEntry,
    inferBiolinkClassHintFromCurie,
    isTrapiDiseaseLikeCategory,
    isTrapiGeneLikeCategory,
    normalizeBiolinkLookupLabel,
    pickPrimaryBiolinkType,
    resolveLabelViaNameResolution,
    trapiCategoriesArray,
    trapiKnowledgeIndicatesEdgeSupport,
    trapiRelayPostTrapiMessage,
    validateBiolinkMappedEdgesViaRelay,
    validateSingleMappedBiolinkEdge,
};
