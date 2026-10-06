import { fetchPbGeneBioIndexState } from "@/views/PbGene/pbGeneBioIndexAdapter";
import { query, request } from "@/utils/bioIndexUtils";
import { readClinicalFocus } from "@/views/KrClinicalFocus/focusStore";
import { contextApiError, contextApiFailure, hpoLabel, resolveHpoTerms } from "@/views/PbGene/hpoContextSearch";

const {
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
} = require("./carrierStatistics");
const { mergeCarrierMetadata, sampleMetadataFromRows } = require("./sampleMetadata");
const { clampPage, pageCount, pageRows } = require("./pagination");
const { sortCarrierRows, sortCoGeneRows, sortCoVariantRows, sortPhenotypeRows } = require("./tableSorting");
const { hpoVersion } = require("./hpoHierarchy");
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

const FACETS = ["affected", "sex", "age", "project", "phenotype"];
const COOCCURRENCE_LIMIT = 5;
const CARRIER_TABLE_LIMIT = 5;
const PHENOTYPE_PAGE_LIMIT = 11;
const SAMPLE_METADATA_BATCH_SIZE = 12;
const DEFAULT_VARIANT = "chr11:5227002:T:A";
const DEFAULT_GENE = "HBB";

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
    const requestedQuery = params.get("query");
    const query = requestedQuery || DEFAULT_VARIANT;
    const gene = normalizeGene(requestedQuery ? params.get("gene") || "" : DEFAULT_GENE);
    const clinicalFocus = readClinicalFocus();
    const initialContextTerms = clinicalFocus && Array.isArray(clinicalFocus.hpoTerms)
        ? clinicalFocus.hpoTerms.filter((term) => /^HP:\d{7}$/.test(String(term.id || "")))
        : [];
    return {
        searchQuery: query,
        geneQuery: gene,
        searchLoading: false,
        searchProgress: "",
        searchError: "",
        emptyResultMessage: "",
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
        sampleMetadataById: {},
        sampleMetadataStatus: "idle",
        sampleMetadataCompleted: 0,
        sampleMetadataMatched: 0,
        sampleMetadataFailed: 0,
        sampleMetadataLoadId: 0,
        sampleMetadataPromise: null,
        resultPages: { phenotypes: 1, carriers: 1, coGenes: 1, coVariants: 1 },
        tableSort: {
            phenotypes: { key: null, dir: "asc" },
            carriers: { key: null, dir: "asc" },
            coGenes: { key: "count", dir: "desc" },
            coVariants: { key: "count", dir: "desc" },
        },
        sameGeneCoOccurrenceAvailable: false,
        filters: emptyFilters(),
        filterDrafts: { affected: "", sex: "", age: "", project: "" },
        expandedCategories: [],
        expandedPhenotypeNodes: [],
        phenotypeQuery: "",
        phenotypeSuggestOpen: false,
        contextInput: initialContextTerms.map((term) => term.id).join(", "),
        contextLoading: false,
        contextError: "",
        contextWarning: "",
        activeContextTerms: initialContextTerms.map((term) => term.id),
        contextTermDetails: initialContextTerms.map((term) => ({ id: term.id, label: term.label || term.id })),
        contextMatch: null,
        contextAssociation: null,
        contextGeneAssociation: null,
        contextResidualById: {},
        contextRunId: 0,
        coGeneAssociationByGene: {},
        coGeneAssociationStatus: "idle",
        coGeneAssociationSummary: null,
        coGeneAssociationError: "",
        contextScoreTypeInput: "max",
        contextAnalysisSetInput: "all",
        coGeneScoreType: "max",
        coGeneAnalysisSet: "all",
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
    hpoVersion() {
        return hpoVersion;
    },
    simpleFacetDefinitions() {
        return [
            { key: "affected", label: "Affected" },
            { key: "sex", label: "Sex" },
            { key: "project", label: "Project" },
        ];
    },
    carrierFacetOptions() {
        return {
            affected: uniqueOptions(this.carrierRecords, "affected", { Yes: "Affected", No: "Not affected" }),
            sex: uniqueOptions(this.carrierRecords, "sex", { F: "Female", M: "Male", unknown: "Unknown" }),
            project: uniqueOptions(this.carrierRecords, "project"),
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
            const terms = query ? category.terms.filter(term => `${term.label} ${term.id || ""}`.toLowerCase().includes(query)).slice(0, 30) : [];
            return categoryMatches || terms.length ? { ...category, terms } : null;
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
    sortedCarrierRows() {
        return sortCarrierRows(this.filteredCarriers, this.tableSort.carriers, this.sampleMetadataById, this.contextResidualById);
    },
    visibleCarrierRows() {
        return pageRows(this.sortedCarrierRows, this.resultPages.carriers, CARRIER_TABLE_LIMIT);
    },
    carrierPageCount() {
        return pageCount(this.filteredCarriers.length, CARRIER_TABLE_LIMIT);
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
    variantScore() {
        return variantPathogenicScore(this.variantIdentity.loftee, this.variantIdentity.alphaMissense);
    },
    variantScoreSource() {
        if (String(this.variantIdentity.loftee || "").trim().toUpperCase() === "HC") return "loftee";
        return this.variantScore == null ? null : "alphaMissense";
    },
    variantAssociationModelLabel() {
        const version = String(this.contextAssociation && this.contextAssociation.modelVersion || "").toLowerCase();
        if (version.includes("lmm") || version.includes("grm")) return "GRM LMM";
        if (version.includes("ols")) return "OLS (no GRM)";
        return version || "Model unspecified";
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
    sortedPhenotypeRows() {
        return sortPhenotypeRows(this.phenotypeRows, this.tableSort.phenotypes);
    },
    visiblePhenotypeRows() {
        return pageRows(this.sortedPhenotypeRows, this.resultPages.phenotypes, PHENOTYPE_PAGE_LIMIT);
    },
    phenotypePageCount() {
        return pageCount(this.phenotypeRows.length, PHENOTYPE_PAGE_LIMIT);
    },
    cooccurGeneRows() {
        return summarizeCooccurrence(this.filteredCarriers, "coGenes", "gene")
            .filter(row => row.gene !== this.variantIdentity.gene);
    },
    sortedCooccurGeneRows() {
        const rows = this.cooccurGeneRows.map(row => {
            const association = this.coGeneAssociationByGene[row.gene] || {};
            return { ...row, beta: association.beta, pValue: association.p_value, fdr: association.fdr };
        });
        return sortCoGeneRows(rows, this.tableSort.coGenes);
    },
    visibleCooccurGeneRows() {
        return pageRows(this.sortedCooccurGeneRows, this.resultPages.coGenes, COOCCURRENCE_LIMIT);
    },
    coGenePageCount() {
        return pageCount(this.cooccurGeneRows.length, COOCCURRENCE_LIMIT);
    },
    cooccurVariantRows() {
        return summarizeCooccurrence(this.filteredCarriers, "coVariants", "id");
    },
    sortedCooccurVariantRows() {
        return sortCoVariantRows(this.cooccurVariantRows, this.tableSort.coVariants);
    },
    visibleCooccurVariantRows() {
        return pageRows(this.sortedCooccurVariantRows, this.resultPages.coVariants, COOCCURRENCE_LIMIT);
    },
    coVariantPageCount() {
        return pageCount(this.cooccurVariantRows.length, COOCCURRENCE_LIMIT);
    },
    hasPhenotypeData() {
        return this.phenotypeCatalog.length > 0;
    },
    hasCoGeneData() {
        return this.carrierRecords.some(record => record.coGeneCount != null || record.coGenes.length);
    },
    hasCoVariantData() {
        return this.sameGeneCoOccurrenceAvailable;
    },
};

export const pbVariantMethods = {
    isUnavailableValue(value) {
        return !available(value);
    },
    clinvarHref(variantId) {
        return `https://www.ncbi.nlm.nih.gov/clinvar/?term=${encodeURIComponent(variantId)}`;
    },
    clinvarClass(value) {
        const labels = String(value || "")
            .toLowerCase()
            .replace(/_/g, " ")
            .split(/[&,;|/]+/)
            .map((label) => label.trim());
        if (labels.some((label) => label === "p" || /^pathogenic\b/.test(label))) return "pbv-evidence--pathogenic";
        if (labels.some((label) => label === "lp" || /^likely pathogenic\b/.test(label))) return "pbv-evidence--likely-pathogenic";
        if (labels.some((label) => label === "vus" || /uncertain significance/.test(label))) return "pbv-evidence--vus";
        return "pbv-evidence--other";
    },
    lofteeClass(value) {
        return /^HC(?:\b|[;&,|/])/i.test(String(value || "").trim())
            ? "pbv-evidence--pathogenic"
            : "pbv-evidence--other";
    },
    addFacet(facet) {
        const value = this.filterDrafts[facet];
        if (value && !this.filters[facet].includes(value)) {
            this.filters[facet].push(value);
            this.resetResultPages();
        }
        this.filterDrafts[facet] = "";
    },
    removeFacet(facet, value) {
        this.filters[facet] = this.filters[facet].filter(item => item !== value);
        this.resetResultPages();
    },
    clearFilters() {
        FACETS.forEach(facet => { this.filters[facet] = []; });
        Object.keys(this.filterDrafts).forEach(facet => { this.filterDrafts[facet] = ""; });
        this.phenotypeQuery = "";
        this.resetResultPages();
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
            this.resetResultPages();
        }
        this.phenotypeQuery = "";
        this.phenotypeSuggestOpen = false;
    },
    addTypedPhenotype() {
        this.addPhenotypeToken(this.phenotypeExactMatch);
    },
    visiblePhenotypeTerms(row) {
        const visibleParents = new Set([row.id || row.key]);
        return row.terms.filter(term => {
            if (!visibleParents.has(term.parentId || row.id || row.key)) return false;
            if (this.expandedPhenotypeNodes.includes(term.id)) visibleParents.add(term.id);
            return true;
        });
    },
    togglePhenotypeNode(id) {
        this.expandedPhenotypeNodes = this.expandedPhenotypeNodes.includes(id)
            ? this.expandedPhenotypeNodes.filter(item => item !== id)
            : [...this.expandedPhenotypeNodes, id];
    },
    toggleCategory(key) {
        this.expandedCategories = this.expandedCategories.includes(key)
            ? this.expandedCategories.filter(item => item !== key)
            : [...this.expandedCategories, key];
    },
    resetResultPages() {
        this.resultPages = { phenotypes: 1, carriers: 1, coGenes: 1, coVariants: 1 };
    },
    sortTableColumn(kind, key) {
        const current = this.tableSort[kind];
        if (!current) return;
        const defaultDir = ["age", "residual", "count", "pct", "beta"].includes(key) ? "desc" : "asc";
        const dir = current.key === key ? current.dir === "asc" ? "desc" : "asc" : defaultDir;
        this.$set(this.tableSort, kind, { key, dir });
        this.$set(this.resultPages, kind, 1);
    },
    tableSortIndicator(kind, key) {
        const sort = this.tableSort[kind];
        return sort && sort.key === key ? sort.dir === "asc" ? "▲" : "▼" : "▵";
    },
    setResultPage(kind, page) {
        const totalPages = {
            phenotypes: this.phenotypePageCount,
            carriers: this.carrierPageCount,
            coGenes: this.coGenePageCount,
            coVariants: this.coVariantPageCount,
        }[kind];
        if (totalPages) this.$set(this.resultPages, kind, clampPage(page, totalPages));
    },
    carrierAge(carrier) {
        const metadata = this.sampleMetadataById[carrier.id];
        if (metadata && metadata.ageYears != null) return metadata.ageYears;
        if (metadata && metadata.age) return metadata.age;
        if (carrier.ageYears != null) return carrier.ageYears;
        if (carrier.ageBin || carrier.age) return carrier.ageBin || carrier.age;
        return this.sampleMetadataStatus === "loading" && !metadata ? "Loading…" : "Unavailable";
    },
    carrierHpoCount(carrier) {
        if (carrier.hpoCount != null) return carrier.hpoCount;
        const count = carrier.phenotypes.reduce((total, category) => total + category.terms.length, 0);
        return count || "Unavailable";
    },
    displayCarrierValue(value) {
        return available(value) || "Unavailable";
    },
    carrierMetadataField(carrier, field) {
        const metadata = this.sampleMetadataById[carrier.id];
        const value = metadata && metadata[field] != null ? metadata[field] : carrier[field];
        if (available(value)) return value;
        return this.sampleMetadataStatus === "loading" && !metadata ? "Loading…" : "Unavailable";
    },
    async loadCarrierMetadata() {
        const loadId = this.sampleMetadataLoadId;
        const variantId = this.variantIdentity.canonicalId;
        const ids = Array.from(new Set(this.carrierRecords.map(carrier => carrier.id).filter(Boolean)));
        this.sampleMetadataStatus = "loading";
        for (let offset = 0; offset < ids.length;) {
            const batch = ids.slice(offset, offset + (offset === 0 ? CARRIER_TABLE_LIMIT : SAMPLE_METADATA_BATCH_SIZE));
            offset += batch.length;
            const results = await Promise.all(batch.map(async id => {
                try {
                    const response = await request("/api/bio/query/samples-info", { q: id, limit: 5 }, true);
                    if (!response.ok) throw new Error(`samples-info returned ${response.status}`);
                    const payload = await response.json();
                    return { id, metadata: sampleMetadataFromRows(payload.data, id, this.variantIdentity.gene), failed: false };
                } catch (error) {
                    return { id, metadata: null, failed: true };
                }
            }));
            if (loadId !== this.sampleMetadataLoadId || variantId !== this.variantIdentity.canonicalId) return;
            const metadataById = { ...this.sampleMetadataById };
            for (const result of results) {
                if (result.metadata) metadataById[result.id] = result.metadata;
                if (result.failed) this.sampleMetadataFailed += 1;
            }
            this.sampleMetadataById = metadataById;
            this.sampleMetadataCompleted += batch.length;
            this.sampleMetadataMatched += results.filter(result => result.metadata).length;
        }
        if (loadId !== this.sampleMetadataLoadId) return;
        this.carrierRecords = mergeCarrierMetadata(this.carrierRecords, this.sampleMetadataById);
        this.sampleMetadataStatus = this.sampleMetadataFailed ? "partial" : "ready";
    },
    displayMean(value) {
        if (value == null || value === "") return "Unavailable";
        const number = Number(value);
        if (!Number.isFinite(number)) return "Unavailable";
        if (number !== 0 && Math.abs(number) < 0.001) return number.toExponential(2);
        return number.toFixed(3);
    },
    displayPValue(value) {
        if (value == null || !Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > 1) return "Unavailable";
        return Number(value) === 0 ? "<1e-300" : this.displayMean(value);
    },
    carrierResidualScore(carrier) {
        if (this.contextLoading) return "Calculating…";
        if (!this.contextMatch && !this.contextAssociation) return "no context";
        const value = this.contextResidualById[String(carrier.id || "").toLowerCase()];
        return this.displayMean(value);
    },
    geneAssociationCell(gene, field) {
        if (this.coGeneAssociationStatus === "idle") return "No context";
        if (this.coGeneAssociationStatus === "loading") return "Calculating…";
        const association = this.coGeneAssociationByGene[gene];
        if (!association || association.status !== "ok") return "Unavailable";
        const value = field === "p_value" ? association.p_value : association[field];
        return field === "beta" ? this.displayMean(value) : this.displayPValue(value);
    },
    async runCoGeneAssociations(terms, runId) {
        this.coGeneAssociationStatus = "loading";
        this.coGeneAssociationError = "";
        this.coGeneAssociationByGene = {};
        this.coGeneAssociationSummary = null;
        try {
            if (this.sampleMetadataPromise) await this.sampleMetadataPromise;
            if (runId !== this.contextRunId) return;
            if (this.sampleMetadataStatus !== "ready" || this.sampleMetadataMatched !== this.carrierRecords.length) {
                throw new Error("Complete carrier gene lists are required to define the FDR gene set.");
            }
            const coGenes = summarizeCooccurrence(this.carrierRecords, "coGenes", "gene")
                .map(row => row.gene)
                .filter(gene => gene !== this.variantIdentity.gene);
            const response = await fetch("/phenotype-analyzer-api/co-gene-associations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    gene: this.variantIdentity.gene,
                    terms: terms.join(","),
                    co_genes: coGenes,
                    score_type: this.coGeneScoreType,
                    affected_only: this.coGeneAnalysisSet === "affected",
                }),
            });
            if (!response.ok) throw new Error(await contextApiError(response));
            const result = await response.json();
            if (runId !== this.contextRunId) return;
            if (result.target_gene !== this.variantIdentity.gene
                || terms.some(term => !result.query_hpo.includes(term))
                || result.query_hpo.length !== terms.length
                || result.score_type !== this.coGeneScoreType
                || result.affected_only !== (this.coGeneAnalysisSet === "affected")) {
                throw new Error("Co-gene association response did not match this HPO context.");
            }
            this.coGeneAssociationByGene = result.gene_associations || {};
            this.coGeneAssociationSummary = {
                model: result.model,
                scoreType: result.score_type,
                nRequested: result.n_requested,
                nTests: result.n_tests,
                affectedOnly: result.affected_only,
            };
            this.coGeneAssociationStatus = "ready";
        } catch (error) {
            if (runId !== this.contextRunId) return;
            this.coGeneAssociationStatus = "error";
            this.coGeneAssociationError = String(error && error.message ? error.message : error);
        }
    },
    async runVariantContext() {
        let terms;
        try { terms = resolveHpoTerms(this.contextInput); }
        catch (error) { this.contextError = error.message; return; }
        this.contextInput = terms.join(", ");
        this.contextLoading = true;
        this.contextRunId += 1;
        const runId = this.contextRunId;
        this.coGeneScoreType = this.contextScoreTypeInput;
        this.coGeneAnalysisSet = this.contextAnalysisSetInput;
        this.contextError = "";
        this.contextWarning = "";
        this.contextMatch = null;
        this.contextAssociation = null;
        this.contextGeneAssociation = null;
        this.contextResidualById = {};
        this.coGeneAssociationByGene = {};
        this.coGeneAssociationStatus = "idle";
        this.coGeneAssociationSummary = null;
        this.coGeneAssociationError = "";
        try {
            const analyze = (analysisTerms) => fetch("/phenotype-analyzer-api/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    terms: analysisTerms.join(","),
                    gene: this.variantIdentity.gene,
                    variant_id: this.variantIdentity.canonicalId,
                    score_type: this.coGeneScoreType,
                    affected_only: this.coGeneAnalysisSet === "affected",
                    advanced: { significance_metric: "p_value", significance_threshold: 0.05, min_carriers: 10 },
                }),
            });
            let analysisTerms = terms;
            let excludedTerms = [];
            let response = await analyze(analysisTerms);
            if (!response.ok) {
                const failure = await contextApiFailure(response);
                const missing = failure.missingTerms;
                if (!missing.length || missing.some(term => !terms.includes(term))) throw new Error(failure.message);
                analysisTerms = terms.filter(term => !missing.includes(term));
                if (!analysisTerms.length) throw new Error(`None of the entered HPO terms are in the CRDC cohort data: ${missing.join(", ")}.`);
                excludedTerms = missing;
                response = await analyze(analysisTerms);
            }
            if (!response.ok) throw new Error(await contextApiError(response));
            const payload = await response.json();
            const result = payload.genes && payload.genes[this.variantIdentity.gene]
                ? payload.genes[this.variantIdentity.gene]
                : payload;
            const match = exactVariantContext(result, this.variantIdentity.canonicalId);
            const association = exactVariantAssociation(result, this.variantIdentity.canonicalId);
            if (!match && !association) throw new Error("The Context API did not return this exact variant.");
            if (excludedTerms.length) this.contextWarning = `Excluded from calculation because they are not in the CRDC cohort data: ${excludedTerms.map(id => `${hpoLabel(id)} (${id})`).join(", ")}.`;
            this.contextMatch = match;
            this.contextAssociation = association;
            this.contextGeneAssociation = result.gene_association || null;
            this.contextResidualById = exactVariantCarrierResiduals(result, this.variantIdentity.canonicalId);
            this.activeContextTerms = analysisTerms;
            this.contextTermDetails = analysisTerms.map((id) => {
                const existing = this.contextTermDetails.find((term) => term.id === id);
                return existing || { id, label: hpoLabel(id) };
            });
            this.runCoGeneAssociations(analysisTerms, runId);
        } catch (error) {
            this.contextError = String(error && error.message ? error.message : error);
        } finally {
            this.contextLoading = false;
        }
    },
    async submitVariantSearch() {
        if (normalizeVariant(this.searchQuery) !== normalizeVariant(this.variantIdentity.canonicalId)) {
            this.geneQuery = "";
        }
        await this.loadLiveVariantData(true);
    },
    async loadLiveVariantData(updateUrl = false) {
        this.sampleMetadataLoadId += 1;
        this.contextRunId += 1;
        this.sampleMetadataPromise = null;
        this.sampleMetadataById = {};
        this.sampleMetadataStatus = "idle";
        this.resetResultPages();
        this.sampleMetadataCompleted = 0;
        this.sampleMetadataMatched = 0;
        this.sampleMetadataFailed = 0;
        const requested = String(this.searchQuery || "").replace(/,/g, "").trim();
        let gene = normalizeGene(this.geneQuery);
        let variant = requested;
        let rsid = null;
        this.searchError = "";
        this.emptyResultMessage = "";
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
            this.expandedCategories = [];
            this.expandedPhenotypeNodes = [];
            this.contextMatch = null;
            this.contextAssociation = null;
            this.contextGeneAssociation = null;
            this.contextResidualById = {};
            this.coGeneAssociationByGene = {};
            this.coGeneAssociationStatus = "idle";
            this.coGeneAssociationSummary = null;
            this.coGeneAssociationError = "";
            this.contextError = "";
            this.contextWarning = "";
            this.searchQuery = next.variantIdentity.canonicalId;
            this.geneQuery = next.variantIdentity.gene;
            this.sampleMetadataPromise = this.loadCarrierMetadata();
            if (updateUrl) {
                const url = new URL(window.location.href);
                url.searchParams.set("query", this.searchQuery);
                if (this.geneQuery) url.searchParams.set("gene", this.geneQuery);
                else url.searchParams.delete("gene");
                window.history.pushState({}, "", url.toString());
            }
        } catch (error) {
            const message = String(error && error.message ? error.message : error);
            if (/no live bioindex carrier or variant rows returned|was not returned for .* by the crdc bioindex/i.test(message)) {
                this.emptyResultMessage = "No local carrier record is available for this variant.";
                this.geneQuery = gene;
            } else {
                this.searchError = message;
            }
        } finally {
            this.searchLoading = false;
            this.searchProgress = "";
        }
    },
};
