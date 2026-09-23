/**
 * Reverse step 3: BiomarkerKB diseases (+ seed genes) → overlapping CFDE REVEAL factors.
 *
 * Uses gene→factor, trait→factor, and gene→trait. Strict factor-IRI intersection is often
 * empty in digcfdekg (gene-linked and trait-linked factors are different nodes), so results
 * are soft-scored: gene support, trait support, and factor-label disease-context match.
 */

import { CFDE_KG_GRAPH, fetchCfdeKgSparql } from "./cfdeKgSparql.js";

const PREFIXES = `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX reveal: <https://purl.org/okn/frink/kg/digcfdekg/schema/>
`;

const DEFAULT_GENE_FACTOR_LIMIT = 40;
const DEFAULT_TRAIT_FACTOR_LIMIT = 25;
const TRAIT_QUERY_CONCURRENCY = 6;
const GENE_QUERY_CONCURRENCY = 4;

function sparqlEscape(value) {
    return String(value || "")
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"');
}

function sparqlNumber(binding) {
    if (!binding || binding.value == null || binding.value === "") return null;
    const n = Number(binding.value);
    return Number.isNaN(n) ? null : n;
}

function sparqlString(binding) {
    return (binding && binding.value) || "";
}

function factorHash(iri) {
    const value = String(iri || "");
    const parts = value.split("/");
    return parts[parts.length - 1] || value;
}

function absOrNull(n) {
    return n == null || Number.isNaN(n) ? null : Math.abs(n);
}

function maxAbs(a, b) {
    const aa = absOrNull(a);
    const bb = absOrNull(b);
    if (aa == null) return bb;
    if (bb == null) return aa;
    return Math.max(aa, bb);
}

/** Parse "… (trait context: Foo)" from REVEAL factor labels. */
export function parseFactorTraitContext(label) {
    const text = String(label || "");
    const match = text.match(/\(trait context:\s*([^)]+)\)\s*$/i);
    return match ? String(match[1] || "").trim() : "";
}

function normalizeMatchText(value) {
    return String(value || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

/** Drop generic disease suffixes so "type 2 diabetes mellitus" ≈ "type 2 diabetes". */
function diseaseMatchCore(label) {
    return normalizeMatchText(label)
        .replace(
            /\b(mellitus|disorder|disease|syndrome|condition)\b/g,
            " "
        )
        .replace(/\s+/g, " ")
        .trim();
}

function labelMatchesDisease(factorLabel, diseaseLabel) {
    const hay = normalizeMatchText(factorLabel);
    const needle = normalizeMatchText(diseaseLabel);
    if (!hay || !needle || needle.length < 4) return false;
    if (hay.includes(needle)) return true;
    const core = diseaseMatchCore(diseaseLabel);
    if (core.length >= 4 && hay.includes(core)) return true;
    const tokens = core.split(" ").filter((t) => t.length > 2);
    if (tokens.length < 2) return false;
    const hits = tokens.filter((t) => hay.includes(t)).length;
    return hits >= Math.ceil(tokens.length * 0.75);
}

function geneToFactorQuery(geneText, limit) {
    const escaped = sparqlEscape(String(geneText || "").trim().toLowerCase());
    return `${PREFIXES}
SELECT ?gene ?geneLabel ?factor ?factorLabel ?weight
WHERE {
  GRAPH <${CFDE_KG_GRAPH}> {
    ?stmt rdf:subject ?gene ;
          rdf:predicate reveal:geneToFactor ;
          rdf:object ?factor ;
          reveal:weight ?weight .
    ?gene rdfs:label ?geneLabel .
    OPTIONAL { ?factor rdfs:label ?factorLabel . }
    FILTER(LCASE(STR(?geneLabel)) = "${escaped}")
  }
}
ORDER BY DESC(ABS(?weight))
LIMIT ${limit}
`;
}

function traitToFactorQuery(traitIri, limit) {
    return `${PREFIXES}
SELECT ?factor ?factorLabel ?weight
WHERE {
  GRAPH <${CFDE_KG_GRAPH}> {
    ?stmt rdf:subject <${traitIri}> ;
          rdf:predicate reveal:traitToFactor ;
          rdf:object ?factor ;
          reveal:weight ?weight .
    OPTIONAL { ?factor rdfs:label ?factorLabel . }
  }
}
ORDER BY DESC(ABS(?weight))
LIMIT ${limit}
`;
}

function geneToTraitQuery(geneText, traitIris) {
    const escaped = sparqlEscape(String(geneText || "").trim().toLowerCase());
    const values = traitIris.map((iri) => `<${iri}>`).join(" ");
    return `${PREFIXES}
SELECT ?gene ?geneLabel ?trait ?traitLabel ?weight
WHERE {
  GRAPH <${CFDE_KG_GRAPH}> {
    VALUES ?trait { ${values} }
    ?stmt rdf:subject ?gene ;
          rdf:predicate reveal:geneToTrait ;
          rdf:object ?trait ;
          reveal:weight ?weight .
    ?gene rdfs:label ?geneLabel .
    OPTIONAL { ?trait rdfs:label ?traitLabel . }
    FILTER(LCASE(STR(?geneLabel)) = "${escaped}")
  }
}
ORDER BY DESC(ABS(?weight))
`;
}

async function mapPool(items, concurrency, mapper) {
    const list = Array.isArray(items) ? items : [];
    const out = [];
    for (let i = 0; i < list.length; i += concurrency) {
        const chunk = list.slice(i, i + concurrency);
        const chunkResults = await Promise.all(chunk.map(mapper));
        chunkResults.forEach((row) => out.push(row));
    }
    return out;
}

function ensureFactor(map, iri, label) {
    if (!iri) return null;
    let row = map.get(iri);
    if (!row) {
        row = {
            factor: iri,
            factorLabel: label || "",
            hash: factorHash(iri),
            traitContext: parseFactorTraitContext(label),
            geneWeight: null,
            traitWeight: null,
            geneTraitWeight: null,
            geneSymbols: [],
            supportingDiseases: [],
            matchedDiseaseLabels: [],
            hasGeneEdge: false,
            hasTraitEdge: false,
            hasLabelDiseaseMatch: false,
            hasGeneTraitBoost: false,
            supportTier: 4,
            supportLabel: "gene",
            score: 0,
        };
        map.set(iri, row);
    } else if (label && (!row.factorLabel || row.factorLabel === iri)) {
        row.factorLabel = label;
        row.traitContext = parseFactorTraitContext(label) || row.traitContext;
    }
    return row;
}

function pushUnique(list, value, keyFn) {
    const key = keyFn ? keyFn(value) : value;
    if (!key) return;
    if (list.some((item) => (keyFn ? keyFn(item) : item) === key)) return;
    list.push(value);
}

function finalizeFactor(row) {
    const hasGene = !!row.hasGeneEdge;
    const hasTrait = !!row.hasTraitEdge;
    const hasLabel = !!row.hasLabelDiseaseMatch;
    const hasGeneTrait = !!row.hasGeneTraitBoost;

    let supportTier;
    let supportLabel;
    if (hasGene && hasTrait) {
        supportTier = 1;
        supportLabel = "gene + trait";
    } else if (hasGene && hasLabel) {
        supportTier = 2;
        supportLabel = "gene + disease context";
    } else if (hasTrait) {
        supportTier = 3;
        supportLabel = "trait";
    } else {
        supportTier = 4;
        supportLabel = "gene";
    }

    const geneW = absOrNull(row.geneWeight) || 0;
    const traitW = absOrNull(row.traitWeight) || 0;
    const geneTraitW = absOrNull(row.geneTraitWeight) || 0;
    const labelBonus = hasLabel ? 0.35 : 0;
    const geneTraitBonus = hasGeneTrait ? Math.min(1, geneTraitW / 10) : 0;

    row.supportTier = supportTier;
    row.supportLabel = supportLabel;
    row.score = geneW + traitW + labelBonus + geneTraitBoostScore(geneTraitBonus);
    row.geneSymbols = (row.geneSymbols || []).slice().sort((a, b) => a.localeCompare(b));
    row.supportingDiseases = (row.supportingDiseases || [])
        .slice()
        .sort((a, b) => String(a.diseaseLabel || "").localeCompare(String(b.diseaseLabel || "")));
    row.matchedDiseaseLabels = (row.matchedDiseaseLabels || [])
        .slice()
        .sort((a, b) => a.localeCompare(b));
    return row;
}

function geneTraitBoostScore(value) {
    return value;
}

/**
 * @param {{
 *   genes?: string[],
 *   diseases?: Array<{ disease: string, diseaseLabel?: string }>,
 *   geneFactorLimit?: number,
 *   traitFactorLimit?: number,
 *   signal?: AbortSignal,
 * }} [opts]
 * @returns {Promise<{
 *   mechanisms: object[],
 *   seedGenes: string[],
 *   diseaseCount: number,
 *   coverage: object,
 * }>}
 */
export async function findReverseMechanisms(opts = {}) {
    const seedGenes = Array.from(
        new Set(
            (opts.genes || [])
                .map((g) => String(g || "").trim().toUpperCase())
                .filter(Boolean)
        )
    );
    const diseases = (opts.diseases || [])
        .map((d) => ({
            disease: String((d && d.disease) || "").trim(),
            diseaseLabel: String((d && d.diseaseLabel) || "").trim(),
        }))
        .filter((d) => /^https?:\/\//i.test(d.disease));

    if (!seedGenes.length && !diseases.length) {
        return emptyResult([]);
    }

    const geneFactorLimit = Math.max(
        1,
        Math.min(80, Number(opts.geneFactorLimit) || DEFAULT_GENE_FACTOR_LIMIT)
    );
    const traitFactorLimit = Math.max(
        1,
        Math.min(50, Number(opts.traitFactorLimit) || DEFAULT_TRAIT_FACTOR_LIMIT)
    );
    const signal = opts.signal;
    const factorMap = new Map();

    const geneFactorBatches = await mapPool(seedGenes, GENE_QUERY_CONCURRENCY, async (gene) => {
        try {
            const { bindings } = await fetchCfdeKgSparql(geneToFactorQuery(gene, geneFactorLimit), {
                signal,
            });
            return bindings.map((b) => ({
                gene,
                geneIri: sparqlString(b.gene),
                geneLabel: sparqlString(b.geneLabel) || gene,
                factor: sparqlString(b.factor),
                factorLabel: sparqlString(b.factorLabel),
                weight: sparqlNumber(b.weight),
            }));
        } catch (error) {
            if (error && error.name === "AbortError") throw error;
            return [];
        }
    });
    geneFactorBatches.flat().forEach((edge) => {
        const row = ensureFactor(factorMap, edge.factor, edge.factorLabel);
        if (!row) return;
        row.hasGeneEdge = true;
        row.geneWeight = maxAbs(row.geneWeight, edge.weight);
        pushUnique(row.geneSymbols, edge.geneLabel || edge.gene, (s) =>
            String(s || "").toUpperCase()
        );
    });

    const traitFactorBatches = await mapPool(diseases, TRAIT_QUERY_CONCURRENCY, async (disease) => {
        try {
            const { bindings } = await fetchCfdeKgSparql(
                traitToFactorQuery(disease.disease, traitFactorLimit),
                { signal }
            );
            return bindings.map((b) => ({
                disease: disease.disease,
                diseaseLabel: disease.diseaseLabel,
                factor: sparqlString(b.factor),
                factorLabel: sparqlString(b.factorLabel),
                weight: sparqlNumber(b.weight),
            }));
        } catch (error) {
            if (error && error.name === "AbortError") throw error;
            return [];
        }
    });
    traitFactorBatches.flat().forEach((edge) => {
        const row = ensureFactor(factorMap, edge.factor, edge.factorLabel);
        if (!row) return;
        row.hasTraitEdge = true;
        row.traitWeight = maxAbs(row.traitWeight, edge.weight);
        pushUnique(
            row.supportingDiseases,
            { disease: edge.disease, diseaseLabel: edge.diseaseLabel },
            (d) => d.disease
        );
    });

    if (seedGenes.length && diseases.length) {
        const traitIris = diseases.map((d) => d.disease);
        const geneTraitBatches = await mapPool(seedGenes, GENE_QUERY_CONCURRENCY, async (gene) => {
            try {
                const { bindings } = await fetchCfdeKgSparql(geneToTraitQuery(gene, traitIris), {
                    signal,
                });
                return bindings.map((b) => ({
                    gene,
                    trait: sparqlString(b.trait),
                    traitLabel: sparqlString(b.traitLabel),
                    weight: sparqlNumber(b.weight),
                }));
            } catch (error) {
                if (error && error.name === "AbortError") throw error;
                return [];
            }
        });
        const geneTraitByDisease = new Map();
        geneTraitBatches.flat().forEach((edge) => {
            const prev = geneTraitByDisease.get(edge.trait);
            if (!prev || (absOrNull(edge.weight) || 0) > (absOrNull(prev.weight) || 0)) {
                geneTraitByDisease.set(edge.trait, edge);
            }
        });

        factorMap.forEach((row) => {
            const label = row.factorLabel || "";
            diseases.forEach((disease) => {
                if (labelMatchesDisease(label, disease.diseaseLabel)) {
                    row.hasLabelDiseaseMatch = true;
                    pushUnique(row.matchedDiseaseLabels, disease.diseaseLabel);
                }
            });
            row.supportingDiseases.forEach((d) => {
                const gt = geneTraitByDisease.get(d.disease);
                if (!gt) return;
                row.hasGeneTraitBoost = true;
                row.geneTraitWeight = maxAbs(row.geneTraitWeight, gt.weight);
            });
            if (!row.hasGeneTraitBoost && row.hasLabelDiseaseMatch) {
                diseases.forEach((disease) => {
                    if (!labelMatchesDisease(label, disease.diseaseLabel)) return;
                    const gt = geneTraitByDisease.get(disease.disease);
                    if (!gt) return;
                    row.hasGeneTraitBoost = true;
                    row.geneTraitWeight = maxAbs(row.geneTraitWeight, gt.weight);
                });
            }
        });
    } else {
        factorMap.forEach((row) => {
            const label = row.factorLabel || "";
            diseases.forEach((disease) => {
                if (labelMatchesDisease(label, disease.diseaseLabel)) {
                    row.hasLabelDiseaseMatch = true;
                    pushUnique(row.matchedDiseaseLabels, disease.diseaseLabel);
                }
            });
        });
    }

    const scored = Array.from(factorMap.values())
        .map(finalizeFactor)
        .filter((row) => row.hasGeneEdge || row.hasTraitEdge);

    const overlapping = scored.filter(
        (row) =>
            row.hasTraitEdge ||
            row.hasLabelDiseaseMatch ||
            (row.hasGeneEdge && row.hasGeneTraitBoost)
    );
    const mechanisms = (overlapping.length ? overlapping : scored).sort((a, b) => {
        if (a.supportTier !== b.supportTier) return a.supportTier - b.supportTier;
        if (b.score !== a.score) return b.score - a.score;
        return String(a.factorLabel || "").localeCompare(String(b.factorLabel || ""));
    });

    return {
        mechanisms,
        seedGenes,
        diseaseCount: diseases.length,
        coverage: {
            kg: "CFDE REVEAL KG (digcfdekg)",
            graph: CFDE_KG_GRAPH,
            routes: ["geneToFactor", "traitToFactor", "geneToTrait", "labelDiseaseContext"],
            overlappedOnly: overlapping.length > 0,
        },
    };
}

function emptyResult(seedGenes) {
    return {
        mechanisms: [],
        seedGenes: seedGenes || [],
        diseaseCount: 0,
        coverage: {
            kg: "CFDE REVEAL KG (digcfdekg)",
            graph: CFDE_KG_GRAPH,
            routes: ["geneToFactor", "traitToFactor", "geneToTrait", "labelDiseaseContext"],
        },
    };
}
