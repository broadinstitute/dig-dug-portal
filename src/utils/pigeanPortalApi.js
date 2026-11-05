import { queryComplete, rawUrl, request } from "./bioIndexUtils";
import {
    isHpoTrait,
    modelFor,
    queryKeys,
    normalizeRows,
    TRAIT_GROUPS,
} from "./pigeanPortalUtils";

const cache = new Map();
const contextCache = new Map();
const catalogs = new Map();
const options = (model, signal) => ({
    host: model.host,
    signal,
    publicRequest: true,
});

export async function loadRegistry() {
    const response = await fetch("/pigean/registry/catalog.json");
    if (!response.ok)
        throw new Error(
            "The trait catalog could not be loaded. You can still enter an exact phenotype key."
        );
    const registry = await response.json();
    if (registry.schemaVersion !== 2 || !Array.isArray(registry.traits))
        throw new Error("Unsupported trait catalog.");
    return registry;
}

export async function loadPhenotypes() {
    const response = await fetch("/pigean/registry/phenotypes.json");
    if (!response.ok)
        throw new Error(
            "Phenotype metadata could not be loaded. Source identifiers are still available."
        );
    const data = await response.json();
    if (
        data.schemaVersion !== 1 ||
        !data.phenotypes ||
        !data.lookup ||
        !data.source
    )
        throw new Error("Unsupported phenotype metadata file.");
    return Object.freeze({
        ...data,
        phenotypes: Object.freeze(data.phenotypes),
        lookup: Object.freeze(data.lookup),
    });
}

export async function loadResult(modelId, trait, signal, snapshot = false) {
    if (isHpoTrait({ id: trait.trim() }))
        throw new Error("HPO traits are excluded. Choose another phenotype.");
    const model = modelFor(modelId);
    const q = queryKeys(model, "trait", trait.trim()).join(",");
    const key = JSON.stringify([model.host, q, snapshot]);
    if (cache.has(key)) return cache.get(key);
    let genes,
        geneSets,
        date = null;
    if (snapshot) {
        if (modelId !== "cfde-inc-v2" || trait !== "T2D")
            throw new Error("The saved example contains CFDE v2 / T2D only.");
        const response = await fetch("/pigean/registry/cfde-t2d.json", {
            signal,
        });
        if (!response.ok)
            throw new Error("The saved T2D example could not be loaded.");
        const saved = await response.json();
        genes = saved.genes;
        geneSets = saved.geneSets;
        date = saved.snapshotDate;
        if (!genes.complete || !geneSets.complete)
            throw new Error("The saved example is incomplete.");
    } else {
        [genes, geneSets] = await Promise.all([
            queryComplete("pigean-gene-phenotype", q, options(model, signal)),
            queryComplete(
                "pigean-gene-set-phenotype",
                q,
                options(model, signal)
            ),
        ]);
    }
    const result = {
        model: modelId,
        trait,
        snapshot,
        date,
        genes: normalizeRows(genes.data, "gene"),
        geneSets: normalizeRows(geneSets.data, "gene_set"),
        sources: [genes.source, geneSets.source],
    };
    // Keep Vue from recursively observing tens of thousands of immutable score records.
    Object.freeze(result.genes);
    Object.freeze(result.geneSets);
    Object.freeze(result);
    if (cache.size >= 6) cache.delete(cache.keys().next().value);
    cache.set(key, result);
    return result;
}

export async function loadAcross(modelId, kind, id, signal) {
    const model = modelFor(modelId);
    const index = kind === "gene" ? "pigean-gene" : "pigean-gene-set";
    const groups = model.cfde
        ? [null]
        : TRAIT_GROUPS.filter((group) => group !== "hpo");
    // Bounded concurrency; one rejected group invalidates the complete cross-trait view.
    const rows = [];
    for (const group of groups) {
        const result = await queryComplete(
            index,
            queryKeys(model, "across", id, { group }).join(","),
            options(model, signal)
        );
        rows.push(...result.data);
    }
    return normalizeRows(rows, kind).filter((row) => !isHpoTrait(row));
}

export async function loadContext(modelId, trait, kind, id, signal) {
    const model = modelFor(modelId);
    const index =
        kind === "gene" ? "pigean-joined-gene" : "pigean-joined-gene-set";
    const q = queryKeys(model, "context", id, { trait }).join(",");
    const key = JSON.stringify([model.host, index, q]);
    if (contextCache.has(key)) return contextCache.get(key);
    const result = await queryComplete(index, q, options(model, signal));
    if (
        result.data.some(
            (row) =>
                (row.phenotype !== undefined && row.phenotype !== trait) ||
                (row.gene_set_size !== undefined &&
                    row.gene_set_size !== modelId) ||
                (row[kind] !== undefined && row[kind] !== id)
        )
    )
        throw new Error(
            "The source returned relationships for a different selection. Please retry."
        );
    const context = Object.freeze({
        rows: Object.freeze(
            normalizeRows(result.data, kind === "gene" ? "gene_set" : "gene")
        ),
        source: result.source,
    });
    if (contextCache.size >= 20)
        contextCache.delete(contextCache.keys().next().value);
    contextCache.set(key, context);
    return context;
}

export async function loadMemberships(modelId, kind, id, signal) {
    const model = modelFor(modelId);
    // The captured v2 catalogs advertise only cfde. Never silently switch models.
    if (model.cfde)
        return {
            available: false,
            reason: "Gene-set membership is unavailable for this model.",
        };
    const index =
        kind === "gene" ? "pigean-gene-gene-sets" : "pigean-gene-set-genes";
    if (!catalogs.has(model.host)) {
        const response = await request("/api/bio/indexes", {}, model.host, {
            signal,
            publicRequest: true,
        });
        if (!response.ok)
            throw new Error(
                `Could not check membership coverage (HTTP ${response.status}).`
            );
        const catalog = await response.json();
        if (!Array.isArray(catalog.data))
            throw new Error("Invalid membership index catalog.");
        catalogs.set(model.host, catalog.data);
    }
    const entry = catalogs
        .get(model.host)
        .find(
            (item) =>
                item.index === index &&
                item.query &&
                item.query.keys.includes("gene_set_size")
        );
    if (!entry)
        return {
            available: false,
            reason: "Gene-set membership is unavailable for this model.",
        };
    const keys = entry.query.keys;
    const response = await request(
        `/api/bio/keys/${index}/${keys.length}`,
        { columns: "gene_set_size" },
        model.host,
        { signal, publicRequest: true }
    );
    if (!response.ok)
        throw new Error(
            `Could not check membership model coverage (HTTP ${response.status}).`
        );
    const body = await response.json();
    if (!Array.isArray(body.keys))
        throw new Error("Invalid membership model catalog.");
    if (!body.keys.some((key) => key.includes(modelId)))
        return {
            available: false,
            reason: "Gene-set membership is unavailable for this model.",
        };
    const values = {
        gene: id,
        gene_set: id,
        gene_set_size: modelId,
        sigma: model.sigma,
    };
    if (keys.some((key) => values[key] === undefined))
        return {
            available: false,
            reason: "This membership index uses an unsupported query configuration.",
        };
    const result = await queryComplete(
        index,
        keys.map((key) => values[key]).join(","),
        options(model, signal)
    );
    return {
        available: true,
        rows: normalizeRows(result.data, kind === "gene" ? "gene_set" : "gene"),
        source: result.source,
    };
}

export function sourceLink(modelId, trait) {
    const model = modelFor(modelId);
    return rawUrl(
        "/api/bio/query/pigean-gene-phenotype",
        { q: queryKeys(model, "trait", trait).join(",") },
        model.host
    );
}
