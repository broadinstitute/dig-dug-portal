import { fetchPbGeneBioIndexState } from "@/views/PbGene/pbGeneBioIndexAdapter";
import { query } from "@/utils/bioIndexUtils";

const {
    attachSameGeneCoVariants,
    exactVariantContext,
    filterCarrierRecords,
    normalizeCarrierRecords,
    phenotypeCatalog,
    summarizeCooccurrence,
    summarizePhenotypes,
} = require("./carrierStatistics");
const {
    buildTranscriptIdentity,
    canonicalVariantId,
    gnomadVariantHref,
    isRsid,
    isVariantId,
    resolveRsidReference,
    resolveVariantReference,
    splitHgvs,
} = require("./variantIdentifiers");

const FACETS = ["affected", "proband", "sex", "age", "investigator", "phenotype"];
const COOCCURRENCE_LIMIT = 10;
const CARRIER_TABLE_LIMIT = 3;

function normalizeGene(value) {
    return String(value || "").trim().toUpperCase();
}

function normalizeVariant(value) {
    return canonicalVariantId(String(value || "").replace(/\s+/g, "")).toLowerCase();
}

function available(value) {
    if (value == null || value === "") return null;
    const text = String(value).trim();
    return ["unavailable", "—", "na", "nan", "n/a"].includes(text.toLowerCase()) ? null : text;
}

function evidenceValue(row, label) {
    const evidence = (row.variantEvidence || []).find(item => item.label === label);
    return available(evidence && evidence.value);
}

function displayVariant(id) {
    const parts = String(id || "").split(":");
    if (parts.length < 4) return id;
    const position = Number(parts[1]);
    return `${parts[0]}:${Number.isFinite(position) ? position.toLocaleString() : parts[1]} ${parts[2]}>${parts[3]}`;
}

function splitValues(value) {
    return String(value || "").split(/;|\|/).map(item => item.trim()).filter(Boolean);
}

function emptyFilters() {
    return FACETS.reduce((result, facet) => ({ ...result, [facet]: [] }), {});
}

function emptyIdentity(query = "", gene = "") {
    return {
        canonicalId: query,
        displayLabel: query ? displayVariant(query) : "No variant selected",
        build: "GRCh38",
        gene,
        classification: null,
        clinvar: null,
        consequence: null,
        gnomadAF: null,
        gnomadHref: null,
        crdcAF: null,
        revel: null,
        alphaMissense: null,
        loftee: null,
        hgvsc: null,
        hgvsp: null,
        ensemblTranscript: null,
        ensemblProtein: null,
        refseqTranscript: null,
        rsid: null,
        distinctCarriers: 0,
        totalSampleUniverse: null,
    };
}

export function createPbVariantState() {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("query") || "";
    const gene = normalizeGene(params.get("gene") || "");
    return {
        searchQuery: query,
        geneQuery: gene,
        searchLoading: false,
        searchProgress: "",
        searchError: "",
        variantAvailable: false,
        liveDataSource: "",
        variantIdentity: emptyIdentity(query, gene),
        geneContext: { symbol: gene, carrierCount: null, observedVariantCount: null, plpVariantCount: null },
        genePanelInfo: {
            ddg2p: { support: false, confidenceCategories: null, diseaseNames: [] },
            panelapp: { greenSupport: false, panelCount: 0, panelNames: [], modesOfInheritance: null },
            pathways: { count: 0, displayNames: [], moreCount: 0 },
        },
        carrierRecords: [],
        showCountCarrierSamples: CARRIER_TABLE_LIMIT,
        sameGeneCoOccurrenceAvailable: false,
        showCountCoVariants: COOCCURRENCE_LIMIT,
        filters: emptyFilters(),
        filterDrafts: { affected: "", proband: "", sex: "", age: "", investigator: "" },
        expandedCategories: [],
        phenotypeQuery: "",
        phenotypeSuggestOpen: false,
        contextInput: "",
        contextLoading: false,
        contextError: "",
        activeContextTerms: [],
        contextMatch: null,
    };
}

export function buildPbVariantState(geneState, requestedVariant, transcriptRows = [], identifier = {}) {
    const target = normalizeVariant(requestedVariant);
    const row = (geneState.variantRows || []).find(item => normalizeVariant(item.id) === target);
    if (!row) throw new Error(`${requestedVariant} was not returned for ${geneState.geneInfo.symbol} by the CRDC BioIndex.`);

    const samples = attachSameGeneCoVariants(
        row.carrierSamples,
        geneState.variantRows,
        row.id,
        geneState.geneInfo.symbol
    );
    const reference = geneState.geneInfo.referenceAnnotation || {};
    const panelapp = reference.panelapp || {};
    const ddg2p = reference.ddg2p || {};
    const pathways = reference.pathways || {};
    const transcript = buildTranscriptIdentity(transcriptRows, geneState.geneInfo || {});
    const rowHgvsp = splitHgvs(available(row.csq_detail) === available(row.consequence) ? "" : row.csq_detail);
    const plpVariantCount = (geneState.variantRows || []).filter(item =>
        /(?:likely\s+pathogenic|pathogenic)/i.test(available(item.clinvar) || "")
    ).length;

    return {
        variantAvailable: true,
        liveDataSource: "CRDC BioIndex · complete gene-samples continuations",
        variantIdentity: {
            canonicalId: row.id,
            displayLabel: displayVariant(row.id),
            build: (geneState.geneInfo && geneState.geneInfo.build) || "GRCh38",
            gene: geneState.geneInfo.symbol,
            classification: available(row.classification),
            clinvar: available(row.clinvar),
            consequence: available(row.consequence),
            gnomadAF: available(row.gnomadAF),
            gnomadHref: gnomadVariantHref(row.id),
            crdcAF: available(row.crdcAF),
            revel: evidenceValue(row, "REVEL"),
            alphaMissense: evidenceValue(row, "AlphaMissense"),
            loftee: evidenceValue(row, "LOFTEE"),
            hgvsc: transcript.hgvsc,
            hgvsp: transcript.hgvsp || rowHgvsp.notation,
            ensemblTranscript: transcript.ensemblTranscript,
            ensemblProtein: transcript.ensemblProtein || rowHgvsp.accession,
            refseqTranscript: transcript.refseqTranscript,
            rsid: available(identifier.rsid) || transcript.rsid,
            distinctCarriers: row.carrierCount || samples.length,
            totalSampleUniverse: geneState.crdcEvidence.crdcCohortCount,
        },
        geneContext: {
            symbol: geneState.geneInfo.symbol,
            carrierCount: geneState.crdcEvidence.currentGeneCarrierTotal,
            observedVariantCount: (geneState.variantRows || []).length,
            plpVariantCount,
        },
        genePanelInfo: {
            ddg2p: {
                support: Boolean(ddg2p.support),
                confidenceCategories: available(ddg2p.confidenceCategories),
                diseaseNames: splitValues(ddg2p.diseaseNames),
            },
            panelapp: {
                greenSupport: Boolean(panelapp.greenSupport),
                panelCount: panelapp.panelCount || 0,
                panelNames: splitValues(panelapp.panelNames),
                modesOfInheritance: available(panelapp.modesOfInheritance),
            },
            pathways: {
                count: pathways.count || 0,
                displayNames: Array.isArray(pathways.displayNames) ? pathways.displayNames : [],
                moreCount: pathways.moreCount || 0,
            },
        },
        carrierRecords: normalizeCarrierRecords(samples),
        sameGeneCoOccurrenceAvailable: true,
    };
}

function uniqueOptions(records, key, labelMap = {}) {
    return Array.from(new Set(records.map(record => record[key]).filter(Boolean)))
        .sort((a, b) => String(a).localeCompare(String(b)))
        .map(value => ({ value, label: labelMap[value] || value }));
}

export const pbVariantComputed = {
    simpleFacetDefinitions() {
        return [
            { key: "affected", label: "Affected" },
            { key: "proband", label: "Proband" },
            { key: "sex", label: "Sex" },
            { key: "investigator", label: "Cohort / investigator" },
        ];
    },
    carrierFacetOptions() {
        return {
            affected: uniqueOptions(this.carrierRecords, "affected", { Yes: "Affected", No: "Not affected" }),
            proband: uniqueOptions(this.carrierRecords, "proband"),
            sex: uniqueOptions(this.carrierRecords, "sex", { F: "Female", M: "Male", unknown: "Unknown" }),
            investigator: uniqueOptions(this.carrierRecords, "investigator"),
        };
    },
    ageOptions() {
        const bins = Array.from(new Set(this.carrierRecords.map(record => record.ageBin).filter(Boolean)))
            .map(value => ({ value: `bin:${value}`, label: value, group: "Age band" }));
        const years = Array.from(new Set(this.carrierRecords.map(record => record.ageYears).filter(value => value != null)))
            .sort((a, b) => a - b)
            .map(value => ({ value: `year:${value}`, label: String(value), group: "Exact age (years)" }));
        const unknown = (bins.length || years.length) && this.carrierRecords.some(record => record.ageBin == null && record.ageYears == null)
            ? [{ value: "unknown", label: "Unknown", group: "" }]
            : [];
        return [...unknown, ...bins, ...years];
    },
    ageOptionGroups() {
        return [
            { label: "", options: this.ageOptions.filter(option => !option.group) },
            { label: "Age band", options: this.ageOptions.filter(option => option.group === "Age band") },
            { label: "Exact age (years)", options: this.ageOptions.filter(option => option.group === "Exact age (years)") },
        ].filter(group => group.options.length);
    },
    phenotypeCatalog() {
        return phenotypeCatalog(this.carrierRecords);
    },
    phenotypeSuggestions() {
        const query = this.phenotypeQuery.trim().toLowerCase();
        return this.phenotypeCatalog.map(category => {
            const categoryMatches = !query || `${category.label} ${category.id || ""}`.toLowerCase().includes(query);
            const terms = category.terms.filter(term => !query || `${term.label} ${term.id || ""}`.toLowerCase().includes(query));
            return categoryMatches || terms.length ? { ...category, terms: categoryMatches && !query ? category.terms : terms } : null;
        }).filter(Boolean);
    },
    phenotypeExactMatch() {
        const query = this.phenotypeQuery.trim().toLowerCase();
        if (!query) return null;
        for (const category of this.phenotypeCatalog) {
            if ([category.label, category.id].filter(Boolean).some(value => value.toLowerCase() === query)) return `cat:${category.key}`;
            const term = category.terms.find(item => [item.label, item.id].filter(Boolean).some(value => value.toLowerCase() === query));
            if (term) return `term:${term.key}`;
        }
        return null;
    },
    filteredCarriers() {
        return filterCarrierRecords(this.carrierRecords, this.filters);
    },
    visibleCarrierRows() {
        return this.filteredCarriers.slice(0, this.showCountCarrierSamples);
    },
    hiddenCarrierCount() {
        return Math.max(0, this.filteredCarriers.length - this.showCountCarrierSamples);
    },
    carrierGrsSummary() {
        const scored = this.filteredCarriers.filter(carrier =>
            carrier.geneBurdenScoredVariants > 0 && Number.isFinite(carrier.geneBurden)
        );
        return {
            value: this.filteredCarriers.length && scored.length === this.filteredCarriers.length
                ? scored.reduce((total, carrier) => total + carrier.geneBurden, 0) / scored.length
                : null,
            scoredCount: scored.length,
            totalCount: this.filteredCarriers.length,
        };
    },
    contextScoreAvailableForSelection() {
        return Boolean(
            this.contextMatch
            && this.contextMatch.matchScore != null
            && this.filteredCarriers.length === this.carrierRecords.length
        );
    },
    matchCount() {
        return this.filteredCarriers.length;
    },
    filtersActive() {
        return FACETS.some(facet => this.filters[facet].length);
    },
    phenotypeRows() {
        return summarizePhenotypes(this.filteredCarriers, this.phenotypeCatalog);
    },
    cooccurGeneRows() {
        return summarizeCooccurrence(this.filteredCarriers, "coGenes", "gene", this.carrierRecords);
    },
    cooccurVariantRows() {
        return summarizeCooccurrence(this.filteredCarriers, "coVariants", "id", this.carrierRecords);
    },
    visibleCooccurVariantRows() {
        return this.cooccurVariantRows.slice(0, this.showCountCoVariants);
    },
    hiddenCooccurVariantCount() {
        return Math.max(0, this.cooccurVariantRows.length - this.showCountCoVariants);
    },
    hasPhenotypeData() {
        return this.phenotypeCatalog.length > 0;
    },
    hasCoGeneData() {
        return this.carrierRecords.some(record => record.coGenes.length);
    },
    hasCoVariantData() {
        return this.sameGeneCoOccurrenceAvailable;
    },
};

export const pbVariantMethods = {
    isUnavailableValue(value) {
        return !available(value);
    },
    addFacet(facet) {
        const value = this.filterDrafts[facet];
        if (value && !this.filters[facet].includes(value)) {
            this.filters[facet].push(value);
            this.showCountCarrierSamples = CARRIER_TABLE_LIMIT;
        }
        this.filterDrafts[facet] = "";
    },
    removeFacet(facet, value) {
        this.filters[facet] = this.filters[facet].filter(item => item !== value);
        this.showCountCarrierSamples = CARRIER_TABLE_LIMIT;
    },
    clearFilters() {
        FACETS.forEach(facet => { this.filters[facet] = []; });
        Object.keys(this.filterDrafts).forEach(facet => { this.filterDrafts[facet] = ""; });
        this.phenotypeQuery = "";
        this.showCountCarrierSamples = CARRIER_TABLE_LIMIT;
    },
    formatFacetValue(facet, value) {
        if (facet === "affected") return value === "Yes" ? "Affected" : value === "No" ? "Not affected" : value;
        if (facet === "sex") return value === "F" ? "Female" : value === "M" ? "Male" : value === "unknown" ? "Unknown" : value;
        if (facet === "age") return value === "unknown" ? "Unknown" : value.replace(/^bin:/, "").replace(/^year:/, "Age ");
        return value;
    },
    formatPhenotypeChip(token) {
        const separator = token.indexOf(":");
        const type = token.slice(0, separator);
        const key = token.slice(separator + 1);
        for (const category of this.phenotypeCatalog) {
            if (type === "cat" && category.key === key) return `${category.label} — any term`;
            const term = category.terms.find(item => item.key === key);
            if (type === "term" && term) return term.id ? `${term.label} [${term.id}]` : term.label;
        }
        return key;
    },
    addPhenotypeToken(token) {
        if (token && !this.filters.phenotype.includes(token)) {
            this.filters.phenotype.push(token);
            this.showCountCarrierSamples = CARRIER_TABLE_LIMIT;
        }
        this.phenotypeQuery = "";
        this.phenotypeSuggestOpen = false;
    },
    addTypedPhenotype() {
        this.addPhenotypeToken(this.phenotypeExactMatch);
    },
    toggleCategory(key) {
        this.expandedCategories = this.expandedCategories.includes(key)
            ? this.expandedCategories.filter(item => item !== key)
            : [...this.expandedCategories, key];
    },
    showMoreCoVariants() {
        this.showCountCoVariants = Math.min(
            this.showCountCoVariants + COOCCURRENCE_LIMIT,
            this.cooccurVariantRows.length
        );
    },
    showLessCoVariants() {
        this.showCountCoVariants = COOCCURRENCE_LIMIT;
    },
    showMoreCarrierSamples() {
        this.showCountCarrierSamples = Math.min(
            this.showCountCarrierSamples + CARRIER_TABLE_LIMIT,
            this.filteredCarriers.length
        );
    },
    showLessCarrierSamples() {
        this.showCountCarrierSamples = CARRIER_TABLE_LIMIT;
    },
    carrierAge(carrier) {
        if (carrier.ageYears != null) return carrier.ageYears;
        return carrier.ageBin || carrier.age || "Unavailable";
    },
    carrierHpoCount(carrier) {
        if (carrier.hpoCount != null) return carrier.hpoCount;
        const count = carrier.phenotypes.reduce((total, category) => total + category.terms.length, 0);
        return count || "Unavailable";
    },
    carrierCoGeneCount(carrier) {
        return carrier.coGeneCount != null ? carrier.coGeneCount : carrier.coGenes.length || "Unavailable";
    },
    displayCarrierValue(value) {
        return available(value) || "Unavailable";
    },
    displayMean(value) {
        if (value == null || value === "") return "Unavailable";
        const number = Number(value);
        if (!Number.isFinite(number)) return "Unavailable";
        if (number !== 0 && Math.abs(number) < 0.001) return number.toExponential(2);
        return number.toFixed(3);
    },
    async runVariantContext() {
        const terms = String(this.contextInput || "")
            .toUpperCase()
            .split(/[\s,;]+/)
            .filter(Boolean)
            .filter((term, index, all) => all.indexOf(term) === index);
        const invalid = terms.find(term => !/^HP:\d{7}$/.test(term));
        if (!terms.length || invalid) {
            this.contextError = invalid ? `${invalid} is not a valid HPO ID.` : "Enter at least one HPO term.";
            return;
        }
        this.contextLoading = true;
        this.contextError = "";
        this.contextMatch = null;
        try {
            const response = await fetch("/phenotype-analyzer-api/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    terms: terms.join(","),
                    gene: this.variantIdentity.gene,
                    advanced: { significance_metric: "p_value", significance_threshold: 0.05, min_carriers: 10 },
                }),
            });
            if (!response.ok) throw new Error(`Context API returned ${response.status}.`);
            const payload = await response.json();
            const result = payload.genes && payload.genes[this.variantIdentity.gene]
                ? payload.genes[this.variantIdentity.gene]
                : payload;
            const match = exactVariantContext(result, this.variantIdentity.canonicalId);
            if (!match) throw new Error("The Context API did not return this exact variant.");
            this.contextMatch = match;
            this.activeContextTerms = terms;
        } catch (error) {
            this.contextError = String(error && error.message ? error.message : error);
        } finally {
            this.contextLoading = false;
        }
    },
    async submitVariantSearch() {
        await this.loadLiveVariantData(true);
    },
    async loadLiveVariantData(updateUrl = false) {
        const requested = String(this.searchQuery || "").replace(/,/g, "").trim();
        let gene = normalizeGene(this.geneQuery);
        let variant = requested;
        let rsid = null;
        this.searchError = "";
        this.variantAvailable = false;
        if (isRsid(requested)) {
            const reference = resolveRsidReference(requested);
            if (!reference || reference.assembly !== "GRCh38") {
                this.searchError = `${requested} is not available in the internal GRCh38 rsID reference yet. Search by chr:pos:ref:alt.`;
                return;
            }
            variant = reference.variantId;
            gene = normalizeGene(reference.gene);
            rsid = requested.toLowerCase();
        } else if (!isVariantId(requested)) {
            this.searchError = "Enter an exact variant as chr:pos:ref:alt, or enter an rsID.";
            return;
        }
        const variantReference = resolveVariantReference(variant);
        if (!rsid && variantReference && variantReference.assembly === "GRCh38") rsid = variantReference.rsid;

        this.searchLoading = true;
        this.searchProgress = "Resolving variant annotation";
        try {
            const pages = {};
            const transcriptRows = await query("transcript-consequences", canonicalVariantId(variant), {
                query_private: true,
                onResolve: () => { this.searchProgress = "Loading transcript consequences"; },
            }, true);
            if (!gene) {
                const genes = Array.from(new Set(transcriptRows
                    .map(row => normalizeGene(row.symbol || row.gene_symbol || row.geneId))
                    .filter(Boolean)));
                if (genes.length !== 1) {
                    throw new Error(genes.length
                        ? `${variant} overlaps multiple genes (${genes.join(", ")}); open it from PB Gene to select the carrier context.`
                        : `${variant} has no gene mapping in the current transcript-consequences index.`);
                }
                gene = genes[0];
            }
            this.searchProgress = `Loading complete ${gene} carrier evidence`;
            const geneState = await fetchPbGeneBioIndexState(gene, {
                onProgress: index => {
                    pages[index] = (pages[index] || 0) + 1;
                    this.searchProgress = `Loading ${index} · page ${pages[index]}`;
                },
            });
            const next = buildPbVariantState(geneState, variant, transcriptRows, { rsid });
            Object.keys(next).forEach(key => { this[key] = next[key]; });
            this.clearFilters();
            this.showCountCoVariants = COOCCURRENCE_LIMIT;
            this.showCountCarrierSamples = CARRIER_TABLE_LIMIT;
            this.expandedCategories = [];
            this.activeContextTerms = [];
            this.contextMatch = null;
            this.contextError = "";
            this.searchQuery = next.variantIdentity.canonicalId;
            this.geneQuery = next.variantIdentity.gene;
            if (updateUrl) {
                const url = new URL(window.location.href);
                url.searchParams.set("query", this.searchQuery);
                if (this.geneQuery) url.searchParams.set("gene", this.geneQuery);
                else url.searchParams.delete("gene");
                window.history.pushState({}, "", url.toString());
            }
        } catch (error) {
            this.searchError = String(error && error.message ? error.message : error);
        } finally {
            this.searchLoading = false;
            this.searchProgress = "";
        }
    },
};
