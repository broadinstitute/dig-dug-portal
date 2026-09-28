// Pure functions shared by the Explorer, Comparer, and regression checks.
export const MODELS = [
    {
        id: "cfde-inc-v2",
        label: "CFDE v2",
        host: "https://cfde-dev.hugeampkpnbi.org",
        cfde: true,
    },
    {
        id: "small",
        label: "Small",
        host: "https://bioindex.hugeamp.org",
        sigma: 2,
    },
    {
        id: "large",
        label: "Large",
        host: "https://bioindex.hugeamp.org",
        sigma: 2,
    },
];
export const TRAIT_GROUPS = [
    "portal",
    "gcat_trait",
    "rare_v2",
    "hpo",
    "portal_exomes",
];
export const GENE_METRICS = ["combined", "prior", "log_bf"];
export const SET_METRICS = ["beta", "beta_uncorrected"];
export const METRIC_LABELS = {
    combined: "Combined support",
    prior: "Indirect support",
    log_bf: "Direct support",
    beta: "Joint effect",
    beta_uncorrected: "Marginal effect",
};

export function modelFor(id) {
    const model = MODELS.find((item) => item.id === id);
    if (!model) throw new Error(`Unknown model: ${id}`);
    return model;
}

export function queryKeys(model, operation, key, context = {}) {
    if (!String(key || "").trim() || String(key).includes(","))
        throw new Error("Enter an exact identifier without commas.");
    if (operation === "trait")
        return model.cfde ? [key, model.id] : [key, model.sigma, model.id];
    if (operation === "across")
        return model.cfde
            ? [key, model.id]
            : [context.group, key, model.sigma, model.id];
    if (operation === "context")
        return model.cfde
            ? [context.trait, key, model.id]
            : [context.trait, key, model.sigma, model.id];
    throw new Error("Unknown query operation.");
}

export function finite(value) {
    if (value === null || value === undefined || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
}
export function formatScore(value) {
    const n = finite(value);
    return n === null
        ? "—"
        : n !== 0 && Math.abs(n) < 0.001
        ? n.toExponential(2)
        : n.toLocaleString(undefined, { maximumFractionDigits: 3 });
}
export function normalizeRows(rows, kind) {
    return rows
        .map((row) => {
            const result = {
                ...row,
                id: kind === "gene" ? row.gene : row.gene_set,
                library: row.source || "",
                factorLabel: row.label || "",
            };
            [
                ...GENE_METRICS,
                ...SET_METRICS,
                "n",
                "huge_score",
                "rs_score",
                "weight",
            ].forEach((key) => {
                result[key] = finite(row[key]);
            });
            return result;
        })
        .filter((row) => row.id);
}

// Preserve the source portal's exact > prefix > substring > subsequence ordering.
export function fuzzyScore(query, text) {
    if (!query) return 1;
    if (!text) return 0;
    const q = query.toLowerCase(),
        t = String(text).toLowerCase();
    if (t === q) return 1000;
    if (t.startsWith(q)) return 800 - t.length * 0.01;
    const index = t.indexOf(q);
    if (index >= 0) return 600 - index * 0.5 - t.length * 0.01;
    let cursor = 0,
        gaps = 0,
        first = -1;
    for (const char of q) {
        const next = t.indexOf(char, cursor);
        if (next < 0) return 0;
        if (first < 0) first = next;
        gaps += next - cursor;
        cursor = next + 1;
    }
    return Math.max(1, 300 - gaps * 4 - first - t.length * 0.01);
}

export function rankTraits(traits, query, model, limit = 12) {
    return traits
        .filter((trait) => !isHpoTrait(trait))
        .map((trait) => ({
            ...trait,
            score: Math.max(
                fuzzyScore(query, trait.id),
                fuzzyScore(query, trait.name) * 0.98,
                fuzzyScore(query, trait.portal_id),
                ...(trait.searchTerms || []).map(
                    (term) => fuzzyScore(query, term) * 0.96
                )
            ),
        }))
        .filter((trait) => trait.score > 0)
        .sort(
            (a, b) =>
                b.score - a.score ||
                Number(b.models.includes(model)) -
                    Number(a.models.includes(model)) ||
                a.id.localeCompare(b.id)
        )
        .slice(0, limit);
}

export function phenotypeFor(data, id) {
    const match = data && data.lookup[id];
    return match ? data.phenotypes[match.id] || null : null;
}

export function isHpoTrait(trait) {
    const id = trait.phenotype || trait.id || "";
    return (
        [trait.trait_group, trait.group, trait.gwas_source_category].some(
            (group) => String(group || "").toLowerCase() === "hpo"
        ) || /^HP[:_]\d+(?:_|$)/i.test(id)
    );
}

export const DEFAULT_GENE_MINIMUMS = Object.freeze({
    log_bf: 0,
    combined: 1,
    prior: null,
});

export function filterGenesBySupport(rows, minimums = DEFAULT_GENE_MINIMUMS) {
    const thresholds = Object.keys(DEFAULT_GENE_MINIMUMS).map((key) => [
        key,
        finite(minimums[key]),
    ]);
    return rows.filter((row) =>
        thresholds.every(([key, minimum]) => {
            const value = finite(row[key]);
            return minimum === null || (value !== null && value >= minimum);
        })
    );
}

export function phenotypeName(data, id, fallback = "") {
    const phenotype = phenotypeFor(data, id);
    return (phenotype && phenotype.name) || fallback || id;
}

export function phenotypeMappings(data, id) {
    const phenotype = phenotypeFor(data, id);
    return phenotype ? phenotype.mappings : [];
}

export function phenotypeSearchText(data, id, fallback = "") {
    const phenotype = phenotypeFor(data, id);
    return [
        id,
        phenotypeName(data, id, fallback),
        ...(phenotype ? [phenotype.portal_id, phenotype.pigean_id] : []),
        ...phenotypeMappings(data, id).flatMap((mapping) => [
            mapping.target_id,
            mapping.target_label,
        ]),
    ]
        .join(" ")
        .toLowerCase();
}

// Resolve identifiers only. Mapping predicates and evidence remain source data.
export function ontologyUrl(curie) {
    if (
        typeof curie !== "string" ||
        !/^[A-Za-z][A-Za-z0-9_]*:[A-Za-z0-9_.-]+$/.test(curie)
    )
        return null;
    const [prefix, local] = curie.split(":"),
        ontology = prefix.toUpperCase();
    if (ontology === "MESH")
        return `https://meshb.nlm.nih.gov/record/ui?ui=${encodeURIComponent(
            local
        )}`;
    if (ontology === "ORPHANET" || ontology === "ORPHA")
        return `https://www.orpha.net/en/disease/detail/${encodeURIComponent(
            local
        )}`;
    if (ontology === "OMIM")
        return `https://omim.org/entry/${encodeURIComponent(local)}`;
    if (
        [
            "EFO",
            "MONDO",
            "DOID",
            "HP",
            "OBA",
            "CMO",
            "CHEBI",
            "NCIT",
            "UBERON",
            "GO",
            "PATO",
        ].includes(ontology)
    )
        return `https://www.ebi.ac.uk/ols4/search?q=${encodeURIComponent(
            curie
        )}`;
    return `https://bioregistry.io/${encodeURIComponent(curie)}`;
}

export function mappingRelation(predicate) {
    return (
        {
            "skos:exactMatch": "Exact match",
            "skos:closeMatch": "Close match",
            "skos:broadMatch": "Broader match",
            "skos:narrowMatch": "Narrower match",
            "skos:relatedMatch": "Related match",
            "oboInOwl:hasDbXref": "Cross-reference",
        }[predicate] ||
        predicate ||
        "Unspecified relation"
    );
}

function ranks(rows, metric) {
    const sorted = rows
        .filter((row) => finite(row[metric]) !== null)
        .slice()
        .sort((a, b) => b[metric] - a[metric]);
    const result = new Map();
    let rank = 0;
    sorted.forEach((row, index) => {
        if (!index || row[metric] !== sorted[index - 1][metric])
            rank = index + 1;
        result.set(row.id, rank);
    });
    return result;
}
export function pearson(x, y) {
    if (x.length < 2 || x.length !== y.length) return null;
    const mx = x.reduce((a, b) => a + b, 0) / x.length;
    const my = y.reduce((a, b) => a + b, 0) / y.length;
    let xy = 0,
        xx = 0,
        yy = 0;
    x.forEach((v, i) => {
        xy += (v - mx) * (y[i] - my);
        xx += (v - mx) ** 2;
        yy += (y[i] - my) ** 2;
    });
    return xx && yy ? xy / Math.sqrt(xx * yy) : null;
}
export function averageRanks(values) {
    const order = values
        .map((value, i) => ({ value, i }))
        .sort((a, b) => a.value - b.value);
    const result = new Array(values.length);
    for (let i = 0; i < order.length; ) {
        let j = i + 1;
        while (j < order.length && order[j].value === order[i].value) j++;
        for (let k = i; k < j; k++) result[order[k].i] = (i + j + 1) / 2;
        i = j;
    }
    return result;
}
export function compareResults(a, b, metric, topN = 100) {
    // Duplicate identifiers would make correspondence ambiguous: do not pick one silently.
    if (
        new Set(a.map((r) => r.id)).size !== a.length ||
        new Set(b.map((r) => r.id)).size !== b.length
    ) {
        throw new Error(
            "This source returns multiple rows per identifier; comparison needs an explicit aggregation rule."
        );
    }
    const ma = new Map(a.map((row) => [row.id, row])),
        mb = new Map(b.map((row) => [row.id, row]));
    const ra = ranks(a, metric),
        rb = ranks(b, metric);
    const rows = [...new Set([...ma.keys(), ...mb.keys()])].map((id) => {
        const av = ma.has(id) ? finite(ma.get(id)[metric]) : null,
            bv = mb.has(id) ? finite(mb.get(id)[metric]) : null;
        return {
            id,
            a: av,
            b: bv,
            delta: av !== null && bv !== null ? bv - av : null,
            aRank: ra.get(id) || null,
            bRank: rb.get(id) || null,
            deltaRank:
                ra.has(id) && rb.has(id) ? rb.get(id) - ra.get(id) : null,
            status:
                ma.has(id) && mb.has(id)
                    ? "Both"
                    : ma.has(id)
                    ? "A only"
                    : "B only",
        };
    });
    const paired = rows.filter((row) => row.a !== null && row.b !== null);
    const selected = paired.filter(
        (row) => !topN || row.aRank <= topN || row.bRank <= topN
    );
    const topA = new Set(
        [...ra].filter(([, rank]) => !topN || rank <= topN).map(([id]) => id)
    );
    const topB = new Set(
        [...rb].filter(([, rank]) => !topN || rank <= topN).map(([id]) => id)
    );
    const overlap = [...topA].filter((id) => topB.has(id)).length;
    const union = new Set([...topA, ...topB]).size;
    const x = selected.map((row) => row.a),
        y = selected.map((row) => row.b);
    return {
        rows,
        paired,
        selected,
        summary: {
            n: selected.length,
            common: paired.length,
            pearson: pearson(x, y),
            spearman: pearson(averageRanks(x), averageRanks(y)),
            overlap,
            jaccard: union ? overlap / union : null,
            aOnly: rows.filter((r) => r.status === "A only").length,
            bOnly: rows.filter((r) => r.status === "B only").length,
        },
    };
}
