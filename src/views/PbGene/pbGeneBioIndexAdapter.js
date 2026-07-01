import { query } from "@/utils/bioIndexUtils";

const UNAVAILABLE = "Unavailable";
const BIOINDEX_TIMEOUT_MS = 12000;
const QUERY_LIMITS = {
    gene: 1,
    "gene-features": 1,
    "gene-variants2": 200,
    "gene-samples": null,
    "gene-associations-52k": 50,
};

export async function fetchPbGeneBioIndexState(baseState, geneSymbol) {
    const gene = normalizeGene(geneSymbol || (baseState.geneInfo || {}).symbol);
    if (!gene) return null;

    const [geneRows, geneFeatureRows, variantRows, sampleRows, associationRows] = await Promise.all([
        safeBioIndexQuery("gene", gene),
        safeBioIndexQuery("gene-features", gene),
        safeBioIndexQuery("gene-variants2", gene),
        safeBioIndexQuery("gene-samples", gene),
        safeBioIndexQuery("gene-associations-52k", gene),
    ]);

    return buildPbGeneState(baseState, gene, {
        geneRows,
        geneFeatureRows,
        variantRows,
        sampleRows,
        associationRows,
    });
}

async function safeBioIndexQuery(index, q) {
    try {
        const opts = {};
        if (QUERY_LIMITS[index] != null) opts.limit = QUERY_LIMITS[index];
        return await withTimeout(query(index, q, opts, true), BIOINDEX_TIMEOUT_MS);
    } catch (error) {
        // First slice is BioIndex-only but partial. A missing optional index
        // should not block rendering with the available Tier 1 data.
        return [];
    }
}

function withTimeout(promise, timeoutMs) {
    return Promise.race([
        promise,
        new Promise((resolve) => {
            window.setTimeout(() => resolve([]), timeoutMs);
        }),
    ]);
}

function buildPbGeneState(baseState, gene, payload) {
    const geneRecord = first(payload.geneRows) || {};
    const variants = Array.isArray(payload.variantRows) ? payload.variantRows : [];
    const samples = Array.isArray(payload.sampleRows) ? payload.sampleRows : [];
    const associations = Array.isArray(payload.associationRows) ? payload.associationRows : [];
    const samplesByVariant = groupSamplesByVariant(samples);
    const variantRowsById = new Map();
    variants.forEach((row) => {
        const id = normalizeVariantId(row.varId || row.variant_id || row.variant_ID || row.varID);
        if (id && !variantRowsById.has(id)) variantRowsById.set(id, row);
    });
    const sampleVariantIds = Object.keys(samplesByVariant).sort((a, b) => variantPosition(a) - variantPosition(b));
    const normalizedVariants = sampleVariantIds
        .map((id) => buildVariantRow(variantRowsById.get(id) || buildSampleVariantRaw(id, samplesByVariant[id]), samplesByVariant))
        .filter(Boolean)
        .filter((row) => row.carrierCount > 0)
        .sort((a, b) => {
            const carrierDiff = (b.carrierCount || 0) - (a.carrierCount || 0);
            return carrierDiff || variantPosition(a.id) - variantPosition(b.id);
        });

    const distinctCarriers = distinctSampleCount(samples);
    const variantCount = normalizedVariants.length;
    const geneInfo = buildGeneInfo(baseState.geneInfo || {}, gene, geneRecord);
    const genomeWindow = buildGenomeWindow(baseState.genomeWindow || {}, geneInfo, normalizedVariants, payload.geneFeatureRows);

    return {
        ...baseState,
        geneInfo,
        crdcEvidence: {
            ...(baseState.crdcEvidence || {}),
            currentGeneCarrierTotal: distinctCarriers,
            queriedVariantCarriers: normalizedVariants[0] ? normalizedVariants[0].carrierCount : 0,
            variantCount,
            probands: "—",
            affected: "—",
            genDxDiagnosed: "—",
            overallBurdenMatchScore: null,
            topVariantSignal: {
                score: null,
                variant: normalizedVariants[0] ? normalizedVariants[0].id : null,
            },
            source: "BCH private BioIndex",
        },
        genomeWindow,
        variantRows: normalizedVariants,
        geneCarrierDemographics: buildUnavailableDemographics(distinctCarriers),
        geneLevelPhenotypeCategories: [],
        geneLevelCoCarrierGenes: [],
        bioIndexAssociations52k: associations,
        bioIndexSource: {
            mode: "private BioIndex",
            indexes: ["gene", "gene-features", "gene-variants2", "gene-samples", "gene-associations-52k"],
        },
    };
}

function buildGeneInfo(baseGeneInfo, gene, geneRecord) {
    const geneRecordChrom = cleanChrom(geneRecord.chromosome || geneRecord.chrom);
    const sameBaseGene =
        normalizeGene(baseGeneInfo.symbol) === gene &&
        (!geneRecordChrom || cleanChrom(baseGeneInfo.chromosome) === geneRecordChrom);
    const chrom = cleanChrom(geneRecord.chromosome || geneRecord.chrom || (sameBaseGene ? baseGeneInfo.chromosome : ""));
    const start = toNumber(geneRecord.start);
    const end = toNumber(geneRecord.end);
    const location = chrom && start && end
        ? `chr${chrom}:${formatInt(start)}-${formatInt(end)}`
        : (sameBaseGene ? baseGeneInfo.location : "");

    return {
        ...baseGeneInfo,
        symbol: gene,
        fullName: geneRecord.name || (sameBaseGene ? baseGeneInfo.fullName : "") || gene,
        description: sameBaseGene
            ? baseGeneInfo.description
            : "Reference gene description unavailable from current BioIndex response.",
        chromosome: chrom || baseGeneInfo.chromosome,
        location,
        build: baseGeneInfo.build || "GRCh38",
        ensemblId: geneRecord.ensgId || geneRecord.ensembl_gene_id || (sameBaseGene ? baseGeneInfo.ensemblId : null) || UNAVAILABLE,
        omim: sameBaseGene ? (baseGeneInfo.omim || UNAVAILABLE) : UNAVAILABLE,
        referenceAnnotation: unavailableReferenceAnnotation(baseGeneInfo.referenceAnnotation),
    };
}

function unavailableReferenceAnnotation(base = {}) {
    return {
        ddg2p: {
            ...((base || {}).ddg2p || {}),
            support: false,
            confidenceCategories: null,
            diseaseNames: null,
        },
        panelapp: {
            ...((base || {}).panelapp || {}),
            greenSupport: false,
            panelCount: 0,
            modesOfInheritance: null,
        },
        pathways: {
            ...((base || {}).pathways || {}),
            count: 0,
            displayNames: [],
            allNames: [],
            items: [],
            moreCount: 0,
        },
    };
}

function buildVariantRow(raw, samplesByVariant) {
    const id = normalizeVariantId(raw.varId || raw.variant_id || raw.variant_ID || raw.varID);
    if (!id) return null;
    const variantSamples = uniqueCarrierSamples(samplesByVariant[id] || []);
    const carrierCount = variantSamples.length;
    const consequence = raw.consequence || raw.Consequence || raw.max_consequence || raw.Max_Consequence || UNAVAILABLE;
    const impact = raw.impact || raw.IMPACT || raw.Max_Impact || "";
    const hgvsp = raw.hgvsp || raw.HGVSp || raw.HGVSP || "";
    const clinvar = firstAvailable(raw.ClinVar_CLNSIG, raw.clinvar, raw.ClinVar, "—");
    const gnomadAF = firstAvailable(raw.gnomAD_AF, nested(raw, "gnomADInfo.gnomADg_AF"), nested(raw, "gnomADInfo.gnomAD_exomes_AF"), "—");
    const crdcAF = cohortAfDisplay(raw);
    const evidence = buildVariantEvidence(raw, id, gnomadAF, clinvar);

    return {
        id,
        consequence,
        csq_detail: hgvsp || raw.hgvsc || raw.HGVSc || "—",
        phenotypeMatchScore: null,
        carrierCount,
        probands: UNAVAILABLE,
        affected: UNAVAILABLE,
        topTerms: [],
        gnomadAF,
        crdcAF,
        cohortAF: crdcAF,
        clinvar,
        variantEvidence: evidence,
        carrierSamples: variantSamples,
        phenotypeCategories: [],
        coCarrierGenes: [],
        classification: clinvar,
        impact,
    };
}

function buildSampleVariantRaw(id, rows = []) {
    const firstRow = rows[0] || {};
    return {
        varId: id,
        variant_id: id,
        chromosome: cleanChrom(String(id).split(":")[0]),
        position: variantPosition(id),
        reference: String(id).split(":")[2],
        alt: String(id).split(":")[3],
        consequence: firstRow.consequence || firstRow.Consequence,
        impact: firstRow.impact || firstRow.IMPACT,
        hgvsp: firstRow.hgvsp || firstRow.HGVSp || firstRow.HGVSP,
        HGVSp: firstRow.HGVSp,
        ClinVar_CLNSIG: firstRow.ClinVar_CLNSIG,
        gnomAD_AF: firstRow.gnomAD_AF,
        cohort_AF_dp20: firstRow.cohort_AF_dp20,
        LoF: firstRow.LoF,
        alphamissense: firstRow.alphamissense,
        REVEL: firstRow.REVEL,
        pathogenicity_score: firstRow.pathogenicity_score,
        weighted_score: firstRow.weighted_score,
        score_source: firstRow.score_source,
        variant_class: firstRow.variant_class,
    };
}

function buildVariantEvidence(raw, id, gnomadAF, clinvar) {
    return [
        { label: "gnomAD AF", value: displayValue(gnomadAF), href: gnomadHref(id) },
        { label: "ClinVar", value: displayValue(clinvar), href: clinvarHref(id) },
        { label: "REVEL", value: displayValue(firstAvailable(raw.REVEL, raw.revel)) },
        { label: "AlphaMissense", value: displayValue(firstAvailable(raw.alphamissense, raw.AlphaMissense, raw.alphaMissense)) },
        { label: "LOFTEE", value: lofteeValue(raw) },
        { label: "CADD", value: displayValue(firstAvailable(raw.CADD, raw.cadd, raw.caddRawRankscore)) },
    ];
}

function groupSamplesByVariant(rows) {
    const out = {};
    rows.forEach((row) => {
        const id = normalizeVariantId(row.variant_id || row.variant_ID || row.varId || row.varID);
        if (!id) return;
        if (!out[id]) out[id] = [];
        out[id].push({
            id: row.sample_id || row.sample_ID || row.patient_id || UNAVAILABLE,
            age: UNAVAILABLE,
            sex: UNAVAILABLE,
            gt: row.GT || row.gt || UNAVAILABLE,
            hpo: UNAVAILABLE,
            genes: UNAVAILABLE,
            group: UNAVAILABLE,
            proband: UNAVAILABLE,
            affected: UNAVAILABLE,
            diagnosed: UNAVAILABLE,
            gendx: UNAVAILABLE,
            gendxNote: "Sample-level diagnosis is unavailable in the current BioIndex response.",
            gendxConflict: false,
            dp: row.DP || row.dp || null,
            altDosage: row.alt_dosage || null,
        });
    });
    return out;
}

function buildGenomeWindow(baseWindow, geneInfo, variantRows, geneFeatureRows = []) {
    const start = parseLocationStart(geneInfo.location);
    const end = parseLocationEnd(geneInfo.location);
    const span = Math.max(end - start, 1);
    const markers = variantRows.filter((row) => row.carrierCount > 0).map((row, index) => {
        const pos = variantPosition(row.id);
        const left = pos && start ? Math.max(0, Math.min(100, ((pos - start) / span) * 100)) : 0;
        const alleles = row.id.split(":").slice(2, 4).join(">");
        return {
            label: alleles || row.id,
            left: `${left.toFixed(2)}%`,
            focal: index === 0,
            coordinate: row.id.replace(/^chr/, "chr"),
            classification: row.classification || row.clinvar || "—",
            carrierCount: row.carrierCount,
            variantId: row.id,
        };
    });

    const density = buildDensity(markers);
    const exonModel = buildBioIndexExons(geneFeatureRows);
    return {
        ...baseWindow,
        exons: exonModel.exons,
        exonModelType: exonModel.type,
        markers,
        densityAll: density,
        densityProband: density.map(() => 0),
        queryDensityIndex: density.length ? Math.floor(density.length / 2) : 0,
    };
}

function buildBioIndexExons(geneFeatureRows) {
    const explicitExons = [];
    geneFeatureRows.forEach((row) => {
        const rows = Array.isArray(row.exons) ? row.exons : [];
        rows.forEach((exon, index) => {
            if (exon.left && exon.width) {
                explicitExons.push({
                    label: exon.label || `E${index + 1}`,
                    left: exon.left,
                    width: exon.width,
                    start: exon.start,
                    end: exon.end,
                });
            }
        });
    });
    if (explicitExons.length) {
        return { type: "coordinate", exons: explicitExons };
    }

    const featureCount = Math.max(
        ...geneFeatureRows.map((row) => Array.isArray(row.featurelist) ? row.featurelist.length : 0),
        0
    );
    const exonCount = Math.max(3, Math.min(featureCount || 6, 8));
    const gap = 100 / (exonCount + 1);
    const exons = Array.from({ length: exonCount }, (_, index) => ({
        label: `E${index + 1}`,
        left: `${Math.max(1, (gap * (index + 1)) - 3).toFixed(1)}%`,
        width: "6%",
        schematic: true,
    }));
    return { type: "schematic", exons };
}

function buildDensity(markers) {
    const bins = Array.from({ length: 50 }, () => 0);
    markers.forEach((marker) => {
        const left = parseFloat(marker.left);
        const idx = Math.max(0, Math.min(bins.length - 1, Math.round((left / 100) * (bins.length - 1))));
        bins[idx] += Number(marker.carrierCount || 0);
    });
    return bins;
}

function buildUnavailableDemographics(total) {
    return {
        byAge: total ? [{ band: UNAVAILABLE, count: total }] : [],
        bySex: total ? [{ label: UNAVAILABLE, count: total }] : [],
        byAffected: total ? [{ label: UNAVAILABLE, count: total }] : [],
        byProband: total ? [{ label: UNAVAILABLE, count: total }] : [],
        byInvestigator: total ? [{ inv: UNAVAILABLE, count: total }] : [],
    };
}

function distinctSampleCount(rows) {
    const ids = new Set();
    rows.forEach((row) => {
        const id = row.sample_id || row.sample_ID || row.patient_id;
        if (id) ids.add(id);
    });
    return ids.size;
}

function uniqueCarrierSamples(rows = []) {
    const seen = new Set();
    return rows.filter((row, index) => {
        const id = row.id && row.id !== UNAVAILABLE ? row.id : `__row_${index}`;
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
    });
}

function cohortAfDisplay(raw) {
    const af = firstAvailable(raw.cohort_AF_dp20, raw.cohort_AF, raw.allelefrequency, raw.AF);
    if (af != null && af !== "" && af !== "NA") return String(af);
    return "—";
}

function lofteeValue(raw) {
    const value = firstAvailable(raw.LoF, raw.LOF, raw.Lof, raw.loftee, raw.LOFTEE);
    if (value == null || value === "" || value === "NA") return "—";
    return String(value);
}

function normalizeGene(value) {
    return String(value || "").trim().toUpperCase();
}

function normalizeVariantId(value) {
    let id = String(value || "").trim();
    if (!id) return "";
    id = id.replace(/_/g, ":").replace(/\//g, ":");
    if (!/^chr/i.test(id)) id = `chr${id}`;
    return id.replace(/^CHR/i, "chr");
}

function cleanChrom(value) {
    return String(value || "").replace(/^chr/i, "").trim();
}

function variantPosition(id) {
    const pos = parseInt(String(id || "").split(":")[1], 10);
    return isNaN(pos) ? 0 : pos;
}

function parseLocationStart(location) {
    const values = String(location || "").match(/\d[\d,]*/g) || [];
    return values.length >= 2 ? Number(values[0].replace(/,/g, "")) : 0;
}

function parseLocationEnd(location) {
    const values = String(location || "").match(/\d[\d,]*/g) || [];
    return values.length >= 2 ? Number(values[1].replace(/,/g, "")) : 1;
}

function toNumber(value) {
    const parsed = Number(value);
    return isNaN(parsed) ? 0 : parsed;
}

function formatInt(value) {
    return Number(value || 0).toLocaleString();
}

function first(rows) {
    return Array.isArray(rows) && rows.length ? rows[0] : null;
}

function firstAvailable(...values) {
    for (const value of values) {
        if (value != null && value !== "" && value !== "NA") return value;
    }
    return null;
}

function displayValue(value) {
    return value == null || value === "" || value === "NA" ? "—" : String(value);
}

function nested(object, path) {
    return String(path || "").split(".").reduce((cur, key) => cur && cur[key], object);
}

function gnomadHref(id) {
    const parts = String(id || "").replace(/^chr/, "").split(":");
    if (parts.length < 4) return "";
    return `https://gnomad.broadinstitute.org/variant/${parts[0]}-${parts[1]}-${parts[2]}-${parts[3]}`;
}

function clinvarHref(id) {
    const parts = String(id || "").replace(/^chr/, "").split(":");
    if (parts.length < 4) return "";
    return `https://www.ncbi.nlm.nih.gov/clinvar/?term=${parts[0]}-${parts[1]}-${parts[2]}-${parts[3]}`;
}
