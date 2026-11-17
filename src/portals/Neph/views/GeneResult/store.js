import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import kp4cd from "@/modules/kp4cd";
import { query } from "@/utils/bioIndexUtils";
import { getGeneReferenceAnnotation } from "./geneAnnotationReference";
import { getGeneExons } from "./geneExonReference";

Vue.use(Vuex);

// ─── BioIndex helpers (inlined from pbGeneBioIndexAdapter.js) ─────────────────

const DENSITY_BINS = 50;

// Staged loading. `onStage(state)` (optional) receives progressively fuller
// states so the page can render in this order:
//   1. identity card (HGNC name + NCBI summary + reference annotation)
//   2. gene locus (gene range + exons, no variant markers yet)
//   3. everything else (variants, carriers, samples, HPO associations)
// All queries start immediately; only the rendering is staged.
const nextFrame = () => new Promise(resolve => setTimeout(resolve, 0));

async function fetchPbGeneBioIndexState(geneSymbol, hpoTerms = [], onStage = null) {
    const gene = normalizeGene(geneSymbol);
    if (!gene) throw new Error("Provide a valid HGNC gene symbol.");

    const genePromise = safeBioIndexQuery("gene", gene, 5);
    const restPromise = Promise.all([
        //safeBioIndexQuery("gene-variants2", gene),
        fetchGeneVariantsCrdc(gene, hpoTerms),
        safeBioIndexQuery("gene-samples", gene),
        safeBioIndexQuery("gene-hpo15", gene, 1),
    ]);
    restPromise.catch(() => {}); // surfaced below; avoid unhandled rejection while stage 1 awaits

    const geneRows = await genePromise;
    if (onStage) {
        // Stage 1: identity card only (locus window left empty).
        const identity = buildPbGeneState(gene, geneRows, [], [], []);
        identity.genomeWindow = { axisTicks: [], exons: [], markers: [], densityAll: [], densityProband: [], queryDensityIndex: 0 };
        onStage(identity);
        await nextFrame();
        // Stage 2: gene locus (range + exons) before the variant data arrives.
        onStage(buildPbGeneState(gene, geneRows, [], [], []));
        await nextFrame();
    }

    const [variantRows, sampleRows, hpoRows] = await restPromise;
    //console.log("fetchPbGeneBioIndexState", gene, geneRows.length, variantRows.length, sampleRows.length, hpoRows.length);
    if (!variantRows.length && !sampleRows.length) {
        throw new Error(`No live BioIndex carrier or variant rows returned for ${gene}.`);
    }

    return buildPbGeneState(gene, geneRows, variantRows, sampleRows, hpoRows);
}

async function safeBioIndexQuery(index, q, limit = null) {
    try {
        return await query(index, q, {
            limit,
            query_private: true,
        });
    } catch (error) {
        // Optional/supplementary indexes: degrade gracefully rather than
        // failing the whole gene page load if they're unavailable.
        if (index === "gene" || index === "gene-hpo15") return [];
        throw error;
    }
}

// gene-variants-crdc is served by the phenotype-analyzer service (port 4999)
// rather than the standard BioIndex service (port 5000), so it uses a direct
// POST call instead of the shared BioIndex query() helper.
async function fetchGeneVariantsCrdc(gene, hpoTerms = []) {
    try {
        const url = "/phenotype-analyzer-api/gene-variants-crdc";
        console.log("http://100.80.30.199:4999/gene-variants-crdc");
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                gene,
                hpo_terms: (Array.isArray(hpoTerms) && hpoTerms.length)
                    ? hpoTerms
                    : [],
            }),
        });
        if (!response.ok) return [];
        const result = await response.json();
        
        return Array.isArray(result && result.data) ? result.data : [];
    } catch (error) {
        return [];
    }
}

function deepFreeze(obj) {
    if (obj && typeof obj === "object" && !Object.isFrozen(obj)) {
        Object.freeze(obj);
        (Array.isArray(obj) ? obj : Object.values(obj)).forEach(deepFreeze);
    }
    return obj;
}

function buildPbGeneState(gene, geneRows, variantRows, sampleRows, hpoRows = []) {
    const variantMap = collectVariants(variantRows, sampleRows);
    const variants = Array.from(variantMap.values())
        .map(entry => buildVariantRow(entry))
        .sort((a, b) => b.carrierCount - a.carrierCount || a.id.localeCompare(b.id));
    const carrierIds = uniqueValues(sampleRows.map(row => value(row, ["sample_id", "sampleId", "sample"])));
    const exons = getGeneExons(gene);
    const geneInfo = buildGeneInfo(gene, geneRows[0] || {}, variants, exons);
    const genomeWindow = buildGenomeWindow(geneInfo, variants, exons);

    // Large, read-only data: freeze so Vue 2 doesn't walk it to install
    // reactive getters/setters (a major main-thread stall on big genes).
    // Per-row UI state lives in separate maps in the component, not on rows.
    deepFreeze(variants);
    deepFreeze(genomeWindow);

    return {
        geneInfo,
        crdcEvidence: {
            currentGeneCarrierTotal: carrierIds.length,
            queriedVariantCarriers: variants[0] ? variants[0].carrierCount : 0,
            variantCount: variants.length,
            probands: countFlag(sampleRows, ["proband_flag", "proband", "is_proband"]),
            affected: countFlag(sampleRows, ["affected_flag", "affected", "is_affected"]),
            genDxDiagnosed: countFlag(sampleRows, ["diagnosed_flag", "gendx_flag", "diagnosed"]),
            overallBurdenMatchScore: null,
            topVariantSignal: {
                score: null,
                variant: variants[0] ? variants[0].id : "-",
            },
            topCarrierTerms: [],
        },
        genomeWindow,
        variantRows: variants,
        geneCarrierDemographics: deepFreeze(buildDemographics(sampleRows)),
        geneLevelPhenotypeCategories: [],
        geneLevelCoCarrierGenes: [],
        genePhenotypeAssociations: deepFreeze(buildGenePhenotypeAssociations(hpoRows)),
    };
}

// gene-hpo15 returns (at most) one row per gene, carrying a nested
// "associations" array of precomputed gene-burden x HPO-term results
// (one entry per HPO term). Keep only positive, FDR-significant
// associations and sort the strongest first — the UI just slices the
// front of this array for the hero/summary cards.
function buildGenePhenotypeAssociations(hpoRows) {
    const hpoRow = (hpoRows && hpoRows[0]) || {};
    const associations = Array.isArray(hpoRow.associations) ? hpoRow.associations : [];

    return associations
        .filter(assoc => asBoolean(value(assoc, ["positive_direction"])) === true)
        .filter(assoc => {
            const flagged = value(assoc, ["q_significant"]);
            if (flagged != null) return asBoolean(flagged) === true;
            const pValue = numericValue(assoc, ["p_value", "pValue"]);
            return pValue != null && pValue < 0.05;
        })
        .map(assoc => ({
            hpoId: displayValue(value(assoc, ["hpo_id", "hpoId"]), ""),
            label: displayValue(
                value(assoc, ["hpo_name", "hpoName", "name"]),
                displayValue(value(assoc, ["hpo_id", "hpoId"]), "")
            ),
            oddsRatio: numericValue(assoc, ["odds_ratio_approx", "oddsRatio", "odds_ratio"]),
            ciLow: numericValue(assoc, ["ci_lower_approx", "ciLow", "ci_lower"]),
            ciHigh: numericValue(assoc, ["ci_upper_approx", "ciHigh", "ci_upper"]),
            pValue: numericValue(assoc, ["p_value", "pValue"]),
            qValue: numericValue(assoc, ["q_by_hpo", "qValue", "q_value"]),
            rank: numericValue(assoc, ["rank"]),
        }))
        .filter(row => row.hpoId)
        .sort((a, b) => {
            if (a.rank != null && b.rank != null && a.rank !== b.rank) return a.rank - b.rank;
            const ap = a.pValue == null ? Infinity : a.pValue;
            const bp = b.pValue == null ? Infinity : b.pValue;
            return ap - bp;
        });
}

function collectVariants(variantRows, sampleRows) {
    // Seed one entry per variant-annotation row so EVERY variant returned by
    // gene-variants-crdc becomes a displayed row (not only carrier-bearing ones).
    const map = new Map();
    variantRows.forEach(row => {
        const id = variantId(row);
        if (!id) return;
        const key = canonicalVariantId(id);
        const entry = map.get(key) || {
            id,
            variantRows: [],
            sampleRows: [],
        };
        entry.variantRows.push(row);
        map.set(key, entry);
    });

    // Attach carrier samples to their variant. If a sample references a variant
    // not present in the annotation set, create the entry on the fly.
    sampleRows.forEach(row => {
        const id = variantId(row);
        if (!id) return;
        const key = canonicalVariantId(id);
        const entry = map.get(key) || {
            id,
            variantRows: [],
            sampleRows: [],
        };
        entry.sampleRows.push(row);
        map.set(key, entry);
    });
    return map;
}

function buildVariantRow(entry) {
    // Annotation fields (consequence, ClinVar, AF, scores) come from the
    // gene-variants-crdc row; fall back to a carrier sample row if absent.
    const crdcRow = entry.variantRows[0] || null;
    const primary = crdcRow || entry.sampleRows[0] || {};

    // Carrier list carried on the variant-annotation row (gene-variants-crdc).
    // Both the CARRIERS count and the Carrier samples subtable are strictly
    // scoped to this gene-variants-crdc row's samples field: if it is empty
    // or missing (count is 0), the subtable shows no samples either — there
    // is intentionally no fallback to the gene-samples BioIndex here.
    const samples = crdcRow
        ? normalizeSampleList(value(crdcRow, ["samples", "sample_id", "sample_ids", "sampleIds", "carriers"]))
        : [];
    const sampleIds = samples;

    const carrierSamples = sampleIds.map(sampleId => {
        const row = entry.sampleRows.find(item => value(item, ["sample_id", "sampleId", "sample", "samples"]) === sampleId) || {};
        // CO-GENES: the sample's "genes" array (gene_symbol values merged in
        // from sample_gene.jsonl), rendered as a comma-separated list.
        const genesList = Array.isArray(row.genes) ? row.genes : null;
        const coGenes = genesList ? (genesList.length ? genesList.join(", ") : "None") : "Unavailable";
        // HPO: the sample's "phenotypes" array (merged in from
        // sample_hpo.jsonl as {hpo_id, is_observed} pairs) — hpo_id values
        // only, comma-separated.
        const phenotypesList = Array.isArray(row.phenotypes) ? row.phenotypes : null;
        const hpoIds = phenotypesList
            ? phenotypesList.map(p => p && p.hpo_id).filter(Boolean)
            : null;
        const hpo = hpoIds ? (hpoIds.length ? hpoIds.join(", ") : "None") : "Unavailable";
        return {
            id: sampleId,
            uniqueId: displayValue(value(row, ["sample_id", "sampleid"]), "Unavailable"),
            age: displayValue(value(row, ["age_for_portal", "age_at_enrollment", "age", "age_band"]), "Unavailable"),
            sex: displayValue(value(row, ["sex", "gender"]), "Unavailable"),
            gt: displayValue(value(row, ["GT", "gt", "genotype"]), "Unavailable"),
            hpo,
            genes: coGenes,
            group: displayValue(value(row, ["investigator", "cohort", "study", "study_code"]), "Unavailable"),
            proband: flagLabel(value(row, ["proband_flag", "proband", "is_proband"]), "Unavailable", "Proband", "non-Proband"),
            affected: flagLabel(value(row, ["affected_flag", "affected", "is_affected"]), "Unavailable", "Yes", "No"),
            diagnosed: flagLabel(value(row, ["diagnosed_flag", "gendx_flag", "diagnosed"]), "N/A", "Yes", "No"),
            gendx: displayValue(value(row, ["gendx_detail_label", "gendx", "diagnosed_interpretation"]), "N/A"),
        };
    });

    const consequence = displayValue(value(primary, ["Consequence", "consequence", "most_severe_consequence"]), "Unavailable");
    const hgvsp = displayValue(value(primary, ["HGVSp", "hgvsp", "hgvs_p", "protein_change"]), "");
    const clinvar = displayValue(value(primary, ["ClinVar_CLNSIG", "clinvar_clnsig"]), "NA");
    const clinvarIdValue = value(primary, ["ClinVar", "clinvar"]);
    // CARRIERS column: exact length of the raw "samples" array from the
    // gene-variants-crdc record (not the de-duplicated/normalized list).
    const rawSamples = crdcRow
        ? value(crdcRow, ["samples", "sample_id", "sample_ids", "sampleIds", "carriers"])
        : null;
    const carrierCount = Array.isArray(rawSamples) ? rawSamples.length : samples.length;
    const crdcAf = displayValue(value(primary, ["af", "crdc_vcf_af", "crdcAF", "cohortAF", "cohort_AF_dp20", "cohort_af_dp20", "AF"]), "Unavailable");
    const gnomadAf = displayValue(value(primary, ["gnomAD_AF", "gnomad_AF", "gnomad_exome_af", "gnomADe_AF"]), "NA");
    const revel = displayValue(value(primary, ["REVEL", "revel", "revel_score"]), "NA");
    const alphaMissense = displayValue(value(primary, ["am_pathogenicity", "alphamissense", "AlphaMissense", "alphamissense_score"]), "NA");
    const loftee = displayValue(value(primary, ["LoF", "lof", "lof_class", "LOFTEE"]), "NA");
    const pathogenicityScore = displayValue(value(primary, ["pathogenicity_score"]), "NA");
    const weightedScore = displayValue(value(primary, ["weighted_score"]), "NA");
    const matchScore = displayValue(value(primary, ["match_score"]), "unavailable");
    const effectScoreBeta = displayValue(
        value(primary, ["effect_score_beta", "effect_score", "beta"])
            ?? value(primary.variant_association, ["beta"]),
        "Unavailable",
    );
    const effectScorePValue = displayValue(
        value(primary, ["effect_score_p_value", "p_value", "pValue"])
            ?? value(primary.variant_association, ["p_value", "pValue"]),
        "Unavailable",
    );

    return {
        id: entry.id,
        consequence,
        csq_detail: hgvsp || consequence,
        phenotypeMatchScore: null,
        samples,
        carrierCount,
        probands: countFlag(entry.sampleRows, ["proband_flag", "proband", "is_proband"]),
        affected: countFlag(entry.sampleRows, ["affected_flag", "affected", "is_affected"]),
        topTerms: [],
        gnomadAF: gnomadAf,
        gnomadHref: gnomadHref(entry.id),
        clinvarHref: clinvarHref(entry.id, clinvarIdValue),
        revel,
        alphaMissense,
        loftee,
        pathogenicityScore,
        weightedScore,
        crdcAF: crdcAf,
        cohortAF: crdcAf,
        clinvar,
        matchScore,
        effectScoreBeta,
        effectScorePValue,
        classification: displayValue(value(primary, ["impact", "IMPACT"]), clinvar),
        variantEvidence: [
            { label: "gnomAD AF", value: gnomadAf, href: gnomadHref(entry.id) },
            { label: "ClinVar", value: clinvar, href: clinvarHref(entry.id, clinvarIdValue) },
            { label: "REVEL", value: revel },
            { label: "AlphaMissense", value: alphaMissense },
            { label: "LOFTEE", value: loftee },
            { label: "Pathogenicity score", value: displayValue(value(primary, ["pathogenicity_score"]), "Unavailable") },
            { label: "Weighted score", value: displayValue(value(primary, ["weighted_score"]), "Unavailable") },
            { label: "Match score", value: matchScore },
            { label: "Effect Score (β)", value: effectScoreBeta },
            { label: "P-value", value: effectScorePValue },
        ],
        carrierSamples,
        phenotypeCategories: [],
        coCarrierGenes: [],
    };
}

function buildGeneInfo(gene, geneRow, variants, exons = []) {
    const chromosome = cleanChrom(value(geneRow, ["chromosome", "chrom", "chr"]) || exonChromosome(exons) || variantChromosome(variants) || "");
    const range = geneRange(geneRow, variants, exons);
    return {
        symbol: gene,
        fullName: displayValue(value(geneRow, ["description", "name", "gene_name", "full_name"]), "Unavailable in live BioIndex"),
        description: displayValue(value(geneRow, ["summary", "ncbi_summary", "description"]), "Live BioIndex gene annotation is not available for this field."),
        cytogeneticLocation: displayValue(value(geneRow, ["cytogeneticLocation", "cytoband", "location"]), ""),
        nameSource: "BioIndex",
        descriptionSource: "BioIndex",
        ensemblId: displayValue(value(geneRow, ["ensemblId", "ensembl_id", "ensg"]), "Unavailable"),
        chromosome,
        location: range ? `chr${chromosome}:${formatBp(range.start)}-${formatBp(range.end)}` : "Unavailable",
        strand: displayValue(value(geneRow, ["strand"]), "+"),
        build: "GRCh38",
        omim: displayValue(value(geneRow, ["omim", "omim_id"]), "Unavailable"),
        referenceAnnotation: getGeneReferenceAnnotation(gene) || emptyReferenceAnnotation(),
        variantStats: {
            highestRevel: null,
            highestAM: null,
            lofteeHC: false,
            source: "BioIndex",
        },
    };
}

function buildGenomeWindow(geneInfo, variants, exons = []) {
    const positions = variants.map(row => variantPosition(row.id)).filter(Boolean);
    const geneRng = parseLocationRange(geneInfo.location) || exonRange(exons);
    const start = geneRng ? geneRng.start : positions.length ? Math.max(Math.min(...positions) - 1000, 1) : 1;
    const end = geneRng ? geneRng.end : positions.length ? Math.max(...positions) + 1000 : 2;
    const span = Math.max(end - start, 1);
    const densityAll = Array.from({ length: DENSITY_BINS }, () => 0);
    const markers = variants.map((row, index) => {
        const pos = variantPosition(row.id);
        const leftPct = pos ? Math.max(0, Math.min(100, ((pos - start) / span) * 100)) : 0;
        const bin = Math.max(0, Math.min(DENSITY_BINS - 1, Math.round((leftPct / 100) * (DENSITY_BINS - 1))));
        densityAll[bin] += row.carrierCount || 0;
        return {
            label: alleleLabel(row.id),
            left: `${leftPct.toFixed(2)}%`,
            focal: index === 0,
            coordinate: pos ? `chr${geneInfo.chromosome}:${formatBp(pos)}` : row.id,
            classification: row.classification || row.clinvar || "Unavailable",
            carrierCount: row.carrierCount || 0,
            variantId: row.id,
        };
    });

    return {
        axisTicks: axisTicks(start, end),
        exons: buildExonRows(exons, start, end),
        markers,
        densityAll,
        densityProband: densityAll.slice(),
        queryDensityIndex: markers[0]
            ? Math.max(0, Math.min(DENSITY_BINS - 1, Math.round((parseFloat(markers[0].left) / 100) * (DENSITY_BINS - 1))))
            : 0,
    };
}

function buildDemographics(sampleRows) {
    const uniqueRows = uniqueBy(sampleRows, row => value(row, ["sample_id", "sampleId", "sample"]));
    return {
        byAge: countField(uniqueRows, ["age_for_portal", "age_at_enrollment", "age", "age_band"])
            .map(row => ({ band: row.label, count: row.count })),
        bySex: countField(uniqueRows, ["sex", "gender"]),
        byAffected: countField(uniqueRows, ["affected_flag", "affected", "is_affected"])
            .map(row => ({ label: booleanDisplay(row.label), count: row.count })),
        byProband: countField(uniqueRows, ["proband_flag", "proband", "is_proband"])
            .map(row => ({ label: booleanDisplay(row.label, "Proband", "non-Proband"), count: row.count })),
        byInvestigator: countField(uniqueRows, ["investigator", "cohort", "study", "study_code"])
            .map(row => ({ inv: row.label, count: row.count })),
    };
}

function countField(rows, keys) {
    const counts = {};
    rows.forEach(row => {
        const key = value(row, keys);
        if (key == null || key === "") return;
        counts[key] = (counts[key] || 0) + 1;
    });
    return Object.keys(counts)
        .map(label => ({ label, count: counts[label] }))
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function countFlag(rows, keys) {
    const hasAnyField = rows.some(row => keys.some(key => row && row[key] != null && row[key] !== ""));
    if (!hasAnyField) return null;
    const ids = new Set();
    rows.forEach((row, index) => {
        const flag = asBoolean(value(row, keys));
        if (flag !== true) return;
        ids.add(value(row, ["sample_id", "sampleId", "sample"]) || String(index));
    });
    return ids.size;
}

function value(row, keys) {
    for (const key of keys) {
        if (row && row[key] != null && row[key] !== "") return row[key];
    }
    return null;
}

function displayValue(raw, fallback = "Unavailable") {
    if (raw == null || raw === "" || raw === "NA" || raw === "NaN") return fallback;
    return String(raw);
}

function numericValue(row, keys) {
    const parsed = Number(value(row, keys));
    return Number.isFinite(parsed) ? parsed : null;
}

function asBoolean(raw) {
    if (raw === true || raw === 1) return true;
    if (raw === false || raw === 0) return false;
    const text = String(raw == null ? "" : raw).trim().toLowerCase();
    if (["true", "yes", "y", "1", "affected", "proband"].includes(text)) return true;
    if (["false", "no", "n", "0", "unaffected", "non-proband", "nonproband"].includes(text)) return false;
    return null;
}

function flagLabel(raw, fallback, trueLabel, falseLabel) {
    const v = asBoolean(raw);
    if (v === true) return trueLabel;
    if (v === false) return falseLabel;
    return fallback;
}

function booleanDisplay(raw, trueLabel = "Yes", falseLabel = "No") {
    const v = asBoolean(raw);
    if (v === true) return trueLabel;
    if (v === false) return falseLabel;
    return displayValue(raw, "Unavailable");
}

function uniqueValues(values) {
    return Array.from(new Set(values.filter(v => v != null && v !== "")));
}

// Normalize a variant-row "samples" field into an array of sample IDs.
// Accepts a real array, or a delimited string (comma / semicolon / pipe / whitespace).
function normalizeSampleList(raw) {
    if (raw == null) return [];
    if (Array.isArray(raw)) {
        return uniqueValues(raw.map(item =>
            typeof item === "object" && item !== null
                ? value(item, ["sample_id", "sampleId", "sample", "id"])
                : item
        ));
    }
    return uniqueValues(String(raw).split(/[,;|\s]+/));
}

function uniqueBy(rows, keyFn) {
    const seen = new Set();
    const out = [];
    rows.forEach(row => {
        const key = keyFn(row);
        if (!key || seen.has(key)) return;
        seen.add(key);
        out.push(row);
    });
    return out;
}

function variantId(row) {
    const existing = value(row, ["variant_id", "variantId", "varId", "varid", "id"]);
    if (existing) return String(existing);
    const chrom = cleanChrom(value(row, ["chromosome", "chrom", "chr", "#CHROM"]));
    const pos = value(row, ["position", "pos", "POS"]);
    const ref = value(row, ["reference", "ref", "REF"]);
    const alt = value(row, ["alt", "ALT", "alternate"]);
    return chrom && pos && ref && alt ? `chr${chrom}:${pos}:${ref}:${alt}` : "";
}

function canonicalVariantId(id) {
    return String(id || "").replace(/^chr/i, "");
}

function variantPosition(id) {
    const parsed = parseInt(String(id || "").split(":")[1], 10);
    return Number.isFinite(parsed) ? parsed : null;
}

function variantChromosome(variants) {
    const id = variants[0] && variants[0].id;
    return cleanChrom(String(id || "").split(":")[0]);
}

function alleleLabel(id) {
    const parts = String(id || "").split(":");
    return parts.length >= 4 ? `${parts[2]}>${parts[3]}` : id;
}

function cleanChrom(raw) {
    return String(raw || "").replace(/^chr/i, "");
}

function normalizeGene(raw) {
    return String(raw || "").trim().toUpperCase();
}

function geneRange(geneRow, variants, exons = []) {
    const start = numericValue(geneRow, ["start", "gene_start", "txStart"]);
    const end = numericValue(geneRow, ["end", "gene_end", "txEnd"]);
    if (start != null && end != null) return { start: Math.min(start, end), end: Math.max(start, end) };
    const range = exonRange(exons);
    if (range) return range;
    const positions = variants.map(row => variantPosition(row.id)).filter(Boolean);
    if (!positions.length) return null;
    return {
        start: Math.max(Math.min(...positions) - 1000, 1),
        end: Math.max(...positions) + 1000,
    };
}

function exonChromosome(exons) {
    return cleanChrom((exons[0] || {}).chrom || "");
}

function exonRange(exons) {
    const starts = exons.map(exon => Number(exon.start)).filter(Number.isFinite);
    const ends = exons.map(exon => Number(exon.end)).filter(Number.isFinite);
    if (!starts.length || !ends.length) return null;
    return { start: Math.min(...starts), end: Math.max(...ends) };
}

function buildExonRows(exons, geneStart, geneEnd) {
    const span = Math.max(geneEnd - geneStart, 1);
    return (exons || []).map((exon, index) => {
        const start = Number(exon.start);
        const end = Number(exon.end);
        if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
        const leftPct = Math.max(0, Math.min(100, ((start - geneStart) / span) * 100));
        const widthPct = Math.max(((end - start) / span) * 100, 0.3);
        return {
            label: `E${exon.exonNumber || index + 1}`,
            left: `${leftPct.toFixed(2)}%`,
            width: `${widthPct.toFixed(2)}%`,
            start,
            end,
            sequence: "",
        };
    }).filter(Boolean);
}

function parseLocationRange(location) {
    const raw = String(location || "");
    const coordinateText = raw.includes(":") ? raw.slice(raw.indexOf(":") + 1) : raw;
    const values = coordinateText.match(/\d[\d,]*/g) || [];
    if (values.length < 2) return null;
    const parsed = values.map(item => parseInt(item.replace(/,/g, ""), 10)).filter(Number.isFinite);
    return parsed.length >= 2 ? { start: Math.min(parsed[0], parsed[1]), end: Math.max(parsed[0], parsed[1]) } : null;
}

function formatBp(v) {
    return Number(v).toLocaleString();
}

function axisTicks(start, end) {
    return Array.from({ length: 5 }, (_, index) => {
        const bp = Math.round(start + ((end - start) * index) / 4);
        const mb = bp / 1000000;
        return `${mb.toFixed(3)} Mb`;
    });
}

function emptyReferenceAnnotation() {
    return {
        ddg2p: { support: false, confidenceCategories: null, diseaseNames: null, source: "DDG2P" },
        panelapp: { greenSupport: false, panelCount: 0, modesOfInheritance: null, source: "PanelApp" },
        pathways: {
            count: 0,
            reactomeCount: 0,
            wikipathwaysCount: 0,
            displayNames: [],
            allNames: [],
            items: [],
            moreCount: 0,
            source: "Reactome / WikiPathways",
        },
    };
}

function gnomadHref(id) {
    const parts = String(id || "").replace(/^chr/i, "").split(":");
    return parts.length >= 4 ? `https://gnomad.broadinstitute.org/variant/${parts[0]}-${parts[1]}-${parts[2]}-${parts[3]}` : "";
}

function clinvarHref(id, clinvarId) {
    const cid = clinvarId == null ? "" : String(clinvarId).trim();
    const term = cid && !/^(na|n\/a|unavailable|-|—)$/i.test(cid) ? cid : id;
    return term ? `https://www.ncbi.nlm.nih.gov/clinvar/?term=${encodeURIComponent(term)}` : "";
}

// ─── pbGene Vuex module ───────────────────────────────────────────────────────

const pbGene = {
    namespaced: true,
    state: () => ({
        geneData: null,
        loading: false,
        error: null,
    }),
    mutations: {
        SET_GENE_DATA(state, data) {
            state.geneData = data;
        },
        SET_LOADING(state, val) {
            state.loading = val;
        },
        SET_ERROR(state, msg) {
            state.error = msg;
        },
    },
    actions: {
        async loadGeneData({ commit, state }, payload) {
            commit("SET_LOADING", true);
            commit("SET_ERROR", null);
            const geneSymbol = typeof payload === "string" ? payload : payload && payload.gene;
            const hpoTerms = (payload && Array.isArray(payload.hpoTerms)) ? payload.hpoTerms : [];
            try {
                // Stage only when switching genes; re-runs for the same gene
                // (e.g. after an HPO context analysis) keep the current page.
                const current = state.geneData && state.geneData.geneInfo && state.geneData.geneInfo.symbol;
                const staged = normalizeGene(geneSymbol) !== current;
                const geneData = await fetchPbGeneBioIndexState(
                    geneSymbol, hpoTerms, staged ? partial => commit("SET_GENE_DATA", partial) : null
                );
                commit("SET_GENE_DATA", geneData);
            } catch (error) {
                const msg = String(error && error.message ? error.message : error);
                commit("SET_ERROR", msg);
                throw error;
            } finally {
                commit("SET_LOADING", false);
            }
        },
    },
};

// ─── Vuex store ───────────────────────────────────────────────────────────────

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
        pbGene,
    },
});
