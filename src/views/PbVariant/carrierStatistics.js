const MISSING_VALUES = new Set(["", "unavailable", "na", "nan", "n/a", "—"]);
const { orderHierarchyTerms } = require("./hpoHierarchy");

function clean(value) {
    if (value == null) return null;
    const text = String(value).trim();
    return MISSING_VALUES.has(text.toLowerCase()) ? null : text;
}

function parseList(value) {
    if (Array.isArray(value)) return value;
    if (value == null || value === "") return [];
    if (typeof value === "object") return [value];
    const text = String(value).trim();
    if (!text) return [];
    if (text[0] === "[" || text[0] === "{") {
        try {
            const parsed = JSON.parse(text);
            return Array.isArray(parsed) ? parsed : [parsed];
        } catch (error) {
            return [];
        }
    }
    return text.split(/;|\|/).map(item => item.trim()).filter(Boolean);
}

function slug(value, fallback) {
    const normalized = clean(value);
    return normalized
        ? normalized.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
        : fallback;
}

function normalizeSex(value) {
    const text = clean(value);
    if (!text) return null;
    const lower = text.toLowerCase();
    if (["f", "female"].includes(lower)) return "F";
    if (["m", "male"].includes(lower)) return "M";
    if (["unknown", "unk", "u"].includes(lower)) return "unknown";
    return text;
}

function normalizeFlag(value, positiveLabel, negativeLabel) {
    const text = clean(value);
    if (!text) return null;
    const lower = text.toLowerCase();
    if (["true", "yes", "y", "1", "affected"].includes(lower)) return positiveLabel;
    if (["false", "no", "n", "0", "unaffected"].includes(lower)) return negativeLabel;
    return text;
}

function normalizeTerm(raw, categoryKey, index) {
    if (typeof raw === "string") {
        const idMatch = raw.match(/HP:\d+/i);
        const id = idMatch ? idMatch[0].toUpperCase() : null;
        return { key: id || slug(raw, `${categoryKey}-term-${index}`), id, label: raw.replace(/\s*\[HP:\d+\]\s*/i, "").trim() };
    }
    const id = clean(raw && (raw.id || raw.hpoId || raw.hpo_id));
    const label = clean(raw && (raw.label || raw.name || raw.term || raw.hpoName || raw.hpo_name));
    if (!id && !label) return null;
    return { key: id || slug(label, `${categoryKey}-term-${index}`), id, label: label || id };
}

function normalizeCategory(raw, index) {
    if (typeof raw === "string") {
        const key = slug(raw, `category-${index}`);
        return { key, id: null, label: raw, terms: [] };
    }
    const id = clean(raw && (raw.id || raw.hpoId || raw.hpo_id || raw.hp));
    const label = clean(raw && (raw.label || raw.name || raw.category || raw.categoryLabel || raw.category_label));
    const key = clean(raw && (raw.key || raw.categoryKey || raw.category_key)) || slug(label || id, `category-${index}`);
    const terms = parseList(raw && (raw.terms || raw.phenotypeTerms || raw.phenotype_terms))
        .map((term, termIndex) => normalizeTerm(term, key, termIndex))
        .filter(Boolean);
    return label || id ? { key, id, label: label || id, terms } : null;
}

function normalizePhenotypes(sample) {
    const categories = parseList(sample.phenotypeCategories || sample.phenotype_categories || sample.phenotypesByCategory || sample.pheno)
        .map(normalizeCategory)
        .filter(Boolean);
    const termMap = sample.phenoTerms || sample.phenotypeTermsByCategory || sample.phenotype_terms_by_category;
    if (termMap && !Array.isArray(termMap) && typeof termMap === "object") {
        Object.keys(termMap).forEach((categoryKey) => {
            let category = categories.find(item => item.key === categoryKey);
            if (!category) {
                category = { key: categoryKey, id: null, label: categoryKey, terms: [] };
                categories.push(category);
            }
            category.terms = parseList(termMap[categoryKey])
                .map((term, index) => normalizeTerm(term, category.key, index))
                .filter(Boolean);
        });
    }
    return categories;
}

function normalizeCoGene(raw) {
    if (typeof raw === "string") return { gene: clean(raw), note: null };
    return {
        gene: clean(raw && (raw.gene || raw.symbol || raw.label)),
        note: clean(raw && raw.note),
    };
}

function normalizeCoVariant(raw) {
    if (typeof raw === "string") return { id: clean(raw), gene: null, clinvar: null, variantScore: null };
    return {
        id: clean(raw && (raw.id || raw.variantId || raw.variant_id)),
        gene: clean(raw && (raw.gene || raw.symbol)),
        clinvar: clean(raw && raw.clinvar),
        variantScore: finiteNumber(raw && (raw.variantScore ?? raw.variant_score)),
    };
}

function finiteNumber(value) {
    if (value == null || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
}

function variantEvidenceValue(row, label) {
    const target = String(label || "").toLowerCase();
    const item = (row.variantEvidence || []).find(entry => String(entry.label || "").toLowerCase() === target);
    return clean(item && item.value);
}

function variantBurdenPathogenicScore(row) {
    const loftee = String(variantEvidenceValue(row, "LOFTEE") || "").toLowerCase();
    if (loftee === "hc" || loftee === "high confidence") return 1;
    return finiteNumber(variantEvidenceValue(row, "AlphaMissense"));
}

function normalizeCarrier(sample, index) {
    const ageValue = sample.ageYears != null ? sample.ageYears : sample.age_years;
    const ageInput = ageValue != null ? ageValue : sample.age;
    const numericAge = ageInput == null || ageInput === "" ? NaN : Number(ageInput);
    const key = clean(sample.id || sample.sampleId || sample.sample_id) || `carrier-${index}`;
    return {
        key,
        id: key,
        age: clean(sample.age),
        genotype: clean(sample.gt || sample.genotype),
        hpoCount: clean(sample.hpo || sample.hpoCount || sample.hpo_count),
        coGeneCount: clean(sample.genes || sample.coGeneCount || sample.co_gene_count),
        gendx: clean(sample.gendx || sample.genDx),
        gendxNote: clean(sample.gendxNote || sample.genDxNote),
        gendxConflict: Boolean(sample.gendxConflict || sample.genDxConflict),
        geneBurden: finiteNumber(sample.geneBurden),
        geneBurdenScoredVariants: finiteNumber(sample.geneBurdenScoredVariants) || 0,
        affected: normalizeFlag(sample.affected, "Yes", "No"),
        sex: normalizeSex(sample.sex),
        ageBin: clean(sample.ageBin || sample.age_bin || sample.ageBand || sample.age_band),
        ageYears: Number.isFinite(numericAge) ? numericAge : null,
        investigator: clean(sample.investigator || sample.group || sample.cohort || sample.study),
        project: clean(sample.project || sample.Project || sample.project_name || sample.clean_name),
        phenotypes: normalizePhenotypes(sample),
        coGenes: parseList(sample.coGenes || sample.co_genes || sample.coCarrierGenes || sample.co_carrier_genes)
            .map(normalizeCoGene).filter(item => item.gene),
        coVariants: parseList(sample.coVariants || sample.co_variants || sample.sameGeneVariants || sample.same_gene_variants)
            .map(normalizeCoVariant).filter(item => item.id),
    };
}

function normalizeCarrierRecords(samples) {
    const records = new Map();
    (samples || []).map(normalizeCarrier).forEach(record => {
        if (!records.has(record.key)) records.set(record.key, record);
    });
    return Array.from(records.values());
}

function attachSameGeneCoVariants(samples, variantRows, targetVariantId, gene) {
    const output = (samples || []).map(sample => ({
        ...sample,
        coVariants: parseList(sample.coVariants || sample.co_variants || sample.sameGeneVariants || sample.same_gene_variants)
            .map(normalizeCoVariant).filter(item => item.id),
        geneBurden: 0,
        geneBurdenScoredVariants: 0,
    }));
    const sampleIndexes = new Map();
    output.forEach((sample, index) => {
        const key = clean(sample.id || sample.sampleId || sample.sample_id);
        if (key) sampleIndexes.set(key, index);
    });
    const target = String(targetVariantId || "").toLowerCase();
    const seen = output.map(sample => new Set(sample.coVariants.map(item => normalizeCoVariant(item).id).filter(Boolean)));

    (variantRows || []).forEach(row => {
        const id = clean(row.id || row.variantId || row.variant_id);
        if (!id) return;
        const burdenScore = variantBurdenPathogenicScore(row);
        const isTarget = id.toLowerCase() === target;
        (row.carrierSamples || []).forEach(sample => {
            const key = clean(sample.id || sample.sampleId || sample.sample_id);
            const index = sampleIndexes.get(key);
            if (index == null) return;
            if (burdenScore != null) {
                output[index].geneBurden += burdenScore;
                output[index].geneBurdenScoredVariants += 1;
            }
            if (isTarget) return;
            const variantScore = variantPathogenicScore(
                variantEvidenceValue(row, "LOFTEE"),
                variantEvidenceValue(row, "AlphaMissense")
            );
            const clinvar = clean(row.clinvar);
            if (seen[index].has(id)) {
                const existing = output[index].coVariants.find(item => normalizeCoVariant(item).id === id);
                if (existing && typeof existing === "object") {
                    if (clinvar != null) existing.clinvar = clinvar;
                    if (variantScore != null) existing.variantScore = variantScore;
                }
                return;
            }
            output[index].coVariants.push({ id, gene, clinvar, variantScore });
            seen[index].add(id);
        });
    });
    return output;
}

function exactVariantContext(result, variantId) {
    const scores = result && result.variant_match_scores;
    if (!scores || typeof scores !== "object") return null;
    const canonical = String(variantId || "").replace(/^chr/i, "").toLowerCase();
    const entry = Object.entries(scores).find(([id]) => String(id).replace(/^chr/i, "").toLowerCase() === canonical);
    if (!entry) return null;
    const row = entry[1] || {};
    const carrierCount = finiteNumber(row.carrier_count);
    const scoredCarrierCount = finiteNumber(row.scored_carrier_count);
    const complete = row.status === "ok" && carrierCount > 0 && scoredCarrierCount === carrierCount;
    return {
        matchScore: complete ? finiteNumber(row.match_score) : null,
        carrierCount,
        scoredCarrierCount,
        status: clean(row.status) || "unknown",
    };
}

function exactVariantAssociation(result, variantId) {
    const associations = result && result.variant_associations;
    if (!associations || typeof associations !== "object") return null;
    const canonical = String(variantId || "").replace(/^chr/i, "").toLowerCase();
    const entry = Object.entries(associations).find(([id]) => String(id).replace(/^chr/i, "").toLowerCase() === canonical);
    if (!entry) return null;
    const row = entry[1] || {};
    const pValue = finiteNumber(row.p_value);
    return {
        beta: row.status === "ok" ? finiteNumber(row.beta) : null,
        pValue: row.status === "ok" && pValue != null && pValue >= 0 && pValue <= 1 ? pValue : null,
        carrierCount: finiteNumber(row.n_carriers),
        sampleCount: finiteNumber(row.n_samples),
        lowCarrierCount: Boolean(row.low_carrier_count),
        modelVersion: clean(row.model_version || result.variant_association_model),
        status: clean(row.status) || "unknown",
    };
}

function exactVariantCarrierResiduals(result, variantId) {
    const source = result && result.variant_carrier_residuals;
    if (!source || !source.sample_scores) return {};
    const canonical = id => String(id || "").replace(/^chr/i, "").toLowerCase();
    if (canonical(source.variant_id) !== canonical(variantId)) return {};
    return Object.entries(source.sample_scores).reduce((scores, [id, value]) => {
        const number = finiteNumber(value);
        if (number != null) scores[id.toLowerCase()] = number;
        return scores;
    }, {});
}

function variantPathogenicScore(loftee, alphaMissense) {
    if (String(loftee || "").trim().toLowerCase() === "hc") return 1;
    const value = parseFloat(String(alphaMissense == null ? "" : alphaMissense).replace(/,/g, ""));
    return Number.isFinite(value) ? value : null;
}

function filterCarrierRecords(records, filters) {
    return (records || []).filter(carrier => {
        if (filters.affected.length && !filters.affected.includes(carrier.affected)) return false;
        if (filters.sex.length && !filters.sex.includes(carrier.sex)) return false;
        if (filters.project.length && !filters.project.includes(carrier.project)) return false;
        if (filters.age.length) {
            const tokens = [
                carrier.ageBin ? `bin:${carrier.ageBin}` : null,
                carrier.ageYears != null ? `year:${carrier.ageYears}` : null,
                carrier.ageBin == null && carrier.ageYears == null ? "unknown" : null,
            ].filter(Boolean);
            if (!tokens.some(token => filters.age.includes(token))) return false;
        }
        if (filters.phenotype.length) {
            const tokens = carrier.phenotypes.flatMap(category => [
                `cat:${category.key}`,
                ...category.terms.map(term => `term:${term.key}`),
            ]);
            if (!tokens.some(token => filters.phenotype.includes(token))) return false;
        }
        return true;
    });
}

function phenotypeCatalog(records) {
    const categories = new Map();
    (records || []).forEach(carrier => carrier.phenotypes.forEach(category => {
        const existing = categories.get(category.key) || { ...category, terms: new Map() };
        category.terms.forEach(term => existing.terms.set(term.key, term));
        categories.set(category.key, existing);
    }));
    return Array.from(categories.values())
        .map(category => ({ ...category, terms: orderHierarchyTerms([...category.terms.values()], category.id || category.key) }))
        .sort((a, b) => a.label.localeCompare(b.label));
}

function summarizePhenotypes(records, catalog) {
    const denominator = records.length;
    const categoryCounts = new Map();
    const termCounts = new Map();
    for (const carrier of records) {
        for (const category of carrier.phenotypes) {
            categoryCounts.set(category.key, (categoryCounts.get(category.key) || 0) + 1);
            for (const term of category.terms) {
                const key = `${category.key}|${term.key}`;
                termCounts.set(key, (termCounts.get(key) || 0) + 1);
            }
        }
    }
    return catalog.map(category => {
        const count = categoryCounts.get(category.key) || 0;
        return {
            ...category,
            count,
            pct: denominator ? Math.round((count / denominator) * 100) : 0,
            terms: category.terms.map(term => {
                const termCount = termCounts.get(`${category.key}|${term.key}`) || 0;
                return { ...term, count: termCount, pct: denominator ? Math.round((termCount / denominator) * 100) : 0 };
            }),
        };
    });
}

function summarizeCooccurrence(records, key, idField, catalogRecords = records) {
    const catalog = new Map();
    catalogRecords.forEach(carrier => carrier[key].forEach(item => {
        const id = item[idField];
        if (!catalog.has(id)) catalog.set(id, { ...item, count: 0 });
    }));
    records.forEach(carrier => {
        const counted = new Set();
        carrier[key].forEach(item => {
            const id = item[idField];
            const current = catalog.get(id);
            if (current && !counted.has(id)) current.count += 1;
            counted.add(id);
        });
    });
    return Array.from(catalog.values())
        .map(item => ({ ...item, pct: records.length ? Math.round((item.count / records.length) * 100) : 0 }))
        .sort((a, b) => b.count - a.count || String(a[idField]).localeCompare(String(b[idField])));
}

module.exports = {
    attachSameGeneCoVariants,
    exactVariantAssociation,
    exactVariantCarrierResiduals,
    exactVariantContext,
    filterCarrierRecords,
    normalizeCarrierRecords,
    phenotypeCatalog,
    summarizeCooccurrence,
    summarizePhenotypes,
    variantPathogenicScore,
};
