const MISSING_VALUES = new Set(["", "unavailable", "na", "nan", "n/a", "—"]);

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
    if (["true", "yes", "y", "1", "affected", "proband"].includes(lower)) return positiveLabel;
    if (["false", "no", "n", "0", "unaffected", "non-proband", "nonproband"].includes(lower)) return negativeLabel;
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
    if (typeof raw === "string") return { id: clean(raw), gene: null, classification: null };
    return {
        id: clean(raw && (raw.id || raw.variantId || raw.variant_id)),
        gene: clean(raw && (raw.gene || raw.symbol)),
        classification: clean(raw && (raw.classification || raw.clinvar)),
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
    const numericAge = Number(ageValue != null ? ageValue : sample.age);
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
        proband: normalizeFlag(sample.proband, "Proband", "non-Proband"),
        sex: normalizeSex(sample.sex),
        ageBin: clean(sample.ageBin || sample.age_bin || sample.ageBand || sample.age_band),
        ageYears: Number.isFinite(numericAge) ? numericAge : null,
        investigator: clean(sample.investigator || sample.group || sample.cohort || sample.study),
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
        coVariants: parseList(sample.coVariants || sample.co_variants || sample.sameGeneVariants || sample.same_gene_variants),
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
            if (isTarget || seen[index].has(id)) return;
            output[index].coVariants.push({ id, gene, classification: clean(row.classification || row.clinvar) });
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

function filterCarrierRecords(records, filters) {
    return (records || []).filter(carrier => {
        if (filters.affected.length && !filters.affected.includes(carrier.affected)) return false;
        if (filters.proband.length && !filters.proband.includes(carrier.proband)) return false;
        if (filters.sex.length && !filters.sex.includes(carrier.sex)) return false;
        if (filters.investigator.length && !filters.investigator.includes(carrier.investigator)) return false;
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
        const existing = categories.get(category.key) || { ...category, terms: [] };
        const termMap = new Map(existing.terms.map(term => [term.key, term]));
        category.terms.forEach(term => termMap.set(term.key, term));
        existing.terms = Array.from(termMap.values()).sort((a, b) => a.label.localeCompare(b.label));
        categories.set(category.key, existing);
    }));
    return Array.from(categories.values()).sort((a, b) => a.label.localeCompare(b.label));
}

function summarizePhenotypes(records, catalog) {
    const denominator = records.length;
    return catalog.map(category => {
        const carriers = records.filter(carrier => carrier.phenotypes.some(item => item.key === category.key));
        return {
            ...category,
            count: carriers.length,
            pct: denominator ? Math.round((carriers.length / denominator) * 100) : 0,
            terms: category.terms.map(term => {
                const count = records.filter(carrier => carrier.phenotypes.some(item =>
                    item.key === category.key && item.terms.some(candidate => candidate.key === term.key)
                )).length;
                return { ...term, count, pct: denominator ? Math.round((count / denominator) * 100) : 0 };
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
    exactVariantContext,
    filterCarrierRecords,
    normalizeCarrierRecords,
    phenotypeCatalog,
    summarizeCooccurrence,
    summarizePhenotypes,
};
