import { query } from "@/utils/bioIndexUtils";
import { getGeneReferenceAnnotation } from "./geneAnnotationReference";
import { getGeneExons } from "./geneExonReference";

const DENSITY_BINS = 50;

export async function fetchPbGeneBioIndexState(geneSymbol) {
    const gene = normalizeGene(geneSymbol);
    if (!gene) throw new Error("Provide a valid HGNC gene symbol.");

    const [geneRows, variantRows, sampleRows] = await Promise.all([
        safeBioIndexQuery("gene", gene, 5),
        safeBioIndexQuery("gene-variants2", gene),
        safeBioIndexQuery("gene-samples", gene),
    ]);

    if (!variantRows.length && !sampleRows.length) {
        throw new Error(`No live BioIndex carrier or variant rows returned for ${gene}.`);
    }

    return buildPbGeneState(gene, geneRows, variantRows, sampleRows);
}

async function safeBioIndexQuery(index, q, limit = null) {
    try {
        return await query(index, q, {
            limit,
            query_private: true,
        });
    } catch (error) {
        if (index === "gene") return [];
        throw error;
    }
}

function buildPbGeneState(gene, geneRows, variantRows, sampleRows) {
    const variantMap = collectVariants(variantRows, sampleRows);
    const variants = Array.from(variantMap.values())
        .map(entry => buildVariantRow(entry))
        .sort((a, b) => b.carrierCount - a.carrierCount || a.id.localeCompare(b.id));
    const carrierIds = uniqueValues(sampleRows.map(row => value(row, ["sample_id", "sampleId", "sample"])));
    const exons = getGeneExons(gene);
    const geneInfo = buildGeneInfo(gene, geneRows[0] || {}, variants, exons);
    const genomeWindow = buildGenomeWindow(geneInfo, variants, exons);
    const cohortKeys = ["crdc_cohort_count", "cohort_sample_count", "cohort_n", "total_cohort_samples"];
    const cohortRow = sampleRows.concat(variantRows).find(row => numericValue(row, cohortKeys) != null);

    return {
        geneInfo,
        crdcEvidence: {
            crdcCohortCount: cohortRow ? numericValue(cohortRow, cohortKeys) : null,
            currentGeneCarrierTotal: carrierIds.length,
            queriedVariantCarriers: variants[0] ? variants[0].carrierCount : 0,
            variantCount: variants.length,
            probands: countFlag(sampleRows, ["proband_flag", "proband", "is_proband"]),
            affected: countFlag(sampleRows, ["affected_flag", "affected", "is_affected"]),
            largestClinicalArea: largestClinicalArea(sampleRows),
            overallBurdenMatchScore: null,
            topVariantSignal: {
                score: null,
                variant: variants[0] ? variants[0].id : "-",
            },
            topCarrierTerms: [],
        },
        genomeWindow,
        variantRows: variants,
        geneCarrierDemographics: buildDemographics(sampleRows),
        geneLevelPhenotypeCategories: [],
        geneLevelCoCarrierGenes: [],
    };
}

function collectVariants(variantRows, sampleRows) {
    const annotationMap = new Map();
    variantRows.forEach(row => {
        const id = variantId(row);
        if (!id) return;
        const key = canonicalVariantId(id);
        const rows = annotationMap.get(key) || [];
        rows.push(row);
        annotationMap.set(key, rows);
    });

    const map = new Map();
    sampleRows.forEach(row => {
        const id = variantId(row);
        if (!id) return;
        const key = canonicalVariantId(id);
        const entry = map.get(key) || {
            id,
            variantRows: annotationMap.get(key) || [],
            sampleRows: [],
        };
        entry.sampleRows.push(row);
        map.set(key, entry);
    });
    return map;
}

function buildVariantRow(entry) {
    const primary = entry.sampleRows[0] || entry.variantRows[0] || {};
    const sampleIds = uniqueValues(entry.sampleRows.map(row => value(row, ["sample_id", "sampleId", "sample"])));
    const carrierSamples = sampleIds.map(sampleId => {
        const row = entry.sampleRows.find(item => value(item, ["sample_id", "sampleId", "sample"]) === sampleId) || {};
        const hpoCount = value(row, ["hpo_count", "HPO_count", "hpo_terms_count"]);
        const coGeneCount = value(row, ["co_gene_count", "genes", "other_gene_count"]);
        return {
            id: sampleId,
            age: displayValue(value(row, ["age_for_portal", "age_at_enrollment", "age", "age_band"]), "Unavailable"),
            sex: displayValue(value(row, ["sex", "gender"]), "Unavailable"),
            gt: displayValue(value(row, ["GT", "gt", "genotype"]), "Unavailable"),
            hpo: hpoCount == null ? "Unavailable" : hpoCount,
            genes: coGeneCount == null ? "Unavailable" : coGeneCount,
            group: displayValue(value(row, ["investigator", "cohort", "study", "study_code"]), "Unavailable"),
            proband: flagLabel(value(row, ["proband_flag", "proband", "is_proband"]), "Unavailable", "Proband", "non-Proband"),
            affected: flagLabel(value(row, ["affected_flag", "affected", "is_affected"]), "Unavailable", "Yes", "No"),
            diagnosed: flagLabel(value(row, ["diagnosed_flag", "gendx_flag", "diagnosed"]), "N/A", "Yes", "No"),
            gendx: displayValue(value(row, ["gendx_detail_label", "gendx", "diagnosed_interpretation"]), "N/A"),
        };
    });

    const consequence = displayValue(value(primary, ["Consequence", "consequence", "most_severe_consequence"]), "Unavailable");
    const hgvsp = displayValue(value(primary, ["HGVSp", "hgvsp", "hgvs_p", "protein_change"]), "");
    const clinvar = displayValue(value(primary, ["Clinical_sig", "clinical_sig", "ClinVar_CLNSIG", "clinvar_clnsig", "CLNSIG"]), "Unavailable");
    const carrierCount = carrierSamples.length || numericValue(primary, ["carrier_count", "carrierCount", "n_carriers"]) || 0;
    const crdcAf = displayValue(value(primary, ["crdc_vcf_af", "crdcAF", "cohortAF", "cohort_AF_dp20", "cohort_af_dp20", "AF"]), "Unavailable");
    const gnomadAf = displayValue(value(primary, ["gnomAD_AF", "gnomad_AF", "gnomad_exome_af", "gnomADe_AF"]), "Unavailable");
    const revel = optionalAnnotationValue(primary, ["REVEL", "revel", "revel_score"]);
    const alphaMissense = optionalAnnotationValue(primary, ["alphamissense", "AlphaMissense", "alphamissense_score", "am_pathogenicity"]);
    const loftee = optionalAnnotationValue(primary, ["LoF", "lof", "lof_class", "LOFTEE"]);

    return {
        id: entry.id,
        consequence,
        csq_detail: hgvsp || consequence,
        phenotypeMatchScore: null,
        carrierCount,
        probands: countFlag(entry.sampleRows, ["proband_flag", "proband", "is_proband"]),
        affected: countFlag(entry.sampleRows, ["affected_flag", "affected", "is_affected"]),
        topTerms: [],
        gnomadAF: gnomadAf,
        crdcAF: crdcAf,
        cohortAF: crdcAf,
        clinvar,
        classification: displayValue(value(primary, ["variant_class", "variantClass"]), clinvar),
        variantEvidence: [
            { label: "gnomAD AF", value: gnomadAf, href: gnomadHref(entry.id) },
            { label: "ClinVar", value: clinvar, href: clinvarHref(entry.id) },
            { label: "REVEL", value: revel },
            { label: "AlphaMissense", value: alphaMissense },
            { label: "LOFTEE", value: loftee },
            { label: "Pathogenic Score", value: displayValue(value(primary, ["pathogenicity_score"]), "Unavailable") },
            { label: "Weighted score", value: displayValue(value(primary, ["weighted_score"]), "Unavailable") },
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
    const geneRange = parseLocationRange(geneInfo.location) || exonRange(exons);
    const start = geneRange ? geneRange.start : positions.length ? Math.max(Math.min(...positions) - 1000, 1) : 1;
    const end = geneRange ? geneRange.end : positions.length ? Math.max(...positions) + 1000 : 2;
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

function largestClinicalArea(rows) {
    const uniqueRows = uniqueBy(rows, row => value(row, ["sample_id", "sampleId", "sample"]));
    const top = countField(uniqueRows, ["public_clinical_area", "clinical_area", "clinicalArea"])[0];
    return top ? { label: top.label, count: top.count } : null;
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

function optionalAnnotationValue(row, keys) {
    const key = keys.find(candidate => row && Object.prototype.hasOwnProperty.call(row, candidate));
    return key ? displayValue(row[key], "—") : "Unavailable";
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
    const value = asBoolean(raw);
    if (value === true) return trueLabel;
    if (value === false) return falseLabel;
    return fallback;
}

function booleanDisplay(raw, trueLabel = "Yes", falseLabel = "No") {
    const value = asBoolean(raw);
    if (value === true) return trueLabel;
    if (value === false) return falseLabel;
    return displayValue(raw, "Unavailable");
}

function uniqueValues(values) {
    return Array.from(new Set(values.filter(value => value != null && value !== "")));
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

function formatBp(value) {
    return Number(value).toLocaleString();
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

function clinvarHref(id) {
    return id ? `https://www.ncbi.nlm.nih.gov/clinvar/?term=${encodeURIComponent(id)}` : "";
}
