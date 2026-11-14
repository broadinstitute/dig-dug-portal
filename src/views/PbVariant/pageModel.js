import { fetchPbGeneBioIndexState } from "@/views/PbGene/pbGeneBioIndexAdapter";
import { query, request } from "@/utils/bioIndexUtils";
import { readClinicalFocus } from "@/views/KrClinicalFocus/focusStore";
import { contextApiError, contextApiFailure, hpoLabel, resolveHpoTerms } from "@/views/PbGene/hpoContextSearch";
import { standardizedField, referenceDescription, referenceAvailable, contextMatches, sameReference } from "../../utils/rphersUnits";
const { clinvarDisplayLabel } = require('../../utils/clinvarLabels');

const {
    attachSameGeneCoVariants,
    exactVariantAssociation,
    exactVariantCarrierResiduals,
    exactVariantContext,
    filterCarrierRecords,
    normalizeCarrierRecords,
    phenotypeCatalog,
    summarizeCooccurrence,
    summarizeCoVariantResiduals,
    summarizePhenotypes,
    variantPathogenicScore,
} = require("./carrierStatistics");
const { mergeCarrierMetadata, sampleMetadataFromRows, sampleMetadataFromCachedInfo, carrierHpoTermCount } = require("./sampleMetadata");
const { clampPage, pageCount, pageRows } = require("./pagination");
const { sortCarrierRows, sortCoGeneRows, sortCoVariantRows, sortPhenotypeRows } = require("./tableSorting");
const { hpoVersion } = require("./hpoHierarchy");
const { hpoPath } = require('./hpoHierarchy');
const { profileTermCounts, profileTermClass, phenotypeDepthColor, phenotypeDataSelection } = require('./phenotypePresentation');
const { crdcSummaryFrequency, carrierDemographicSummary } = require("./layoutSummary");
const help = require('../PbGene2/evidenceHelp');
const layoutHelp = require('./layoutHelp');
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
const COOCCURRENCE_LIMIT = 4;
const CARRIER_TABLE_LIMIT = 5;
const PHENOTYPE_PAGE_LIMIT = 8;
const SAMPLE_METADATA_BATCH_SIZE = 96;
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
        crdcFrequencyKind: null,
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
        profileRuns: [],
        carrierSamplesExpanded: false,
        variantHpoCount: null,
        variantHpoCountStatus: 'idle',
        variantHpoResponseKey: '',
        variantHpoRevision: 0,
        currentProfileRunId: null,
        rerunningProfileRunId: null,
        contextError: "",
        contextWarning: "",
        activeContextTerms: initialContextTerms.map((term) => term.id),
        contextTermDetails: initialContextTerms.map((term) => ({ id: term.id, label: term.label || term.id })),
        contextMatch: null,
        contextAssociation: null,
        contextGeneAssociation: null,
        contextStandardization: null,
        coGeneStandardization: null,
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
            crdcFrequencyKind: row.crdcFrequencyKind || null,
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
    variantConsequenceLabel() {
        const value = String(this.variantIdentity.consequence || '').replace(/_variant$/, '').replace(/_/g, ' ');
        return value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Unavailable';
    },
    variantHpoCountKey() {
        return this.variantAvailable && this.appliedProfileTerms.length ? JSON.stringify([
            this.variantIdentity.gene, [...new Set(this.appliedProfileTerms)].sort(), this.variantIdentity.canonicalId, this.currentProfileRunId,
        ]) : '';
    },
    variantHpoCountDisplay() {
        if (!this.variantHpoCountKey) return '—';
        if (this.variantHpoCountStatus === 'loading' || this.variantHpoResponseKey !== this.variantHpoCountKey) return this.variantHpoCountStatus === 'unavailable' ? 'Unavailable' : 'Loading…';
        const result = this.variantHpoCount;
        return result && result.count != null ? Number(result.count).toLocaleString() + (result.complete ? '' : ' (partial)') : 'Unavailable';
    },
    variantHpoCountTitle() {
        const result = this.variantHpoResponseKey === this.variantHpoCountKey && this.variantHpoCount;
        return help.hpoCarriers + (result ? ` HPO metadata available for ${result.metadataCount} of ${result.carrierTotal} observed variant carriers.` : '');
    },
    appliedProfileTerms() {
        return this.contextMatch || this.contextAssociation ? this.activeContextTerms : [];
    },
    profilePhenotypeCounts() {
        return profileTermCounts(this.filteredCarriers, this.sampleMetadataById, this.appliedProfileTerms)
            .map(term => ({ ...term, label: hpoLabel(term.id) }));
    },
    unlistedProfileTerms() {
        const listed = new Set(this.phenotypeRows.flatMap(row => [row.id, ...row.terms.map(term => term.id)]));
        if (this.phenotypeRows.length) listed.add('HP:0000118');
        return this.appliedProfileTerms.filter(id => !listed.has(id)).map(id => ({ id, label: hpoLabel(id) }));
    },
    unlistedProfileStatus() {
        if (this.phenotypeCarrierSelection.unknown.length) return 'Phenotype records incomplete';
        if (!this.phenotypeCarrierSelection.present.length) return 'No phenotype data in the current selection';
        return 'Not listed among observed carrier phenotypes';
    },
    carrierDisplayLabel() {
        return this.filtersActive ? `${this.matchCount} of ${this.variantIdentity.distinctCarriers} variant carriers shown`
            : `${this.matchCount} variant ${this.matchCount === 1 ? 'carrier' : 'carriers'} shown`;
    },
    phenotypeCarrierSelection() {
        return phenotypeDataSelection(this.filteredCarriers, this.sampleMetadataById);
    },
    allPhenotypeCarrierSelection() {
        return phenotypeDataSelection(this.carrierRecords, this.sampleMetadataById);
    },
    phenotypePopulationLabel() {
        const selection = this.phenotypeCarrierSelection;
        return `Phenotype data available: ${selection.present.length} of ${selection.total} carriers${selection.unknown.length ? ` · ${selection.unknown.length} pending/unavailable` : ''}`;
    },
    carrierDemographicSummary() {
        return carrierDemographicSummary(this.carrierRecords, this.sampleMetadataById, this.sampleMetadataStatus);
    },
    crdcFrequencyLabel() {
        return crdcSummaryFrequency(this.variantIdentity).label;
    },
    crdcFrequencyHelp() {
        const frequency = crdcSummaryFrequency(this.variantIdentity);
        if (frequency.kind === 'allele') return help.crdcAF + ' AF is not the carrier count divided by the number of people.';
        const total = this.variantIdentity.totalSampleUniverse;
        return help.carrierFrequency + (frequency.kind == null
            ? ' A confirmed frequency and CRDC sample denominator are unavailable.'
            : Number(total) > 0 ? ` CRDC cohort denominator: ${Number(total).toLocaleString()} samples.` : ' Supplied by the source.');
    },
    activeProfileLabel() {
        return this.activeContextTerms.map(hpoLabel).join(' + ');
    },
    meanZHelp() {
        return help.meanZ + (this.contextMatch ? ` Individual scores available for ${this.contextMatch.scoredCarrierCount || 0} of ${this.contextMatch.carrierCount || 0} analysis-eligible carriers.` : '') + ' ' + this.rphersReferenceLabel(this.contextStandardization);
    },
    profileAnalysisDetails() {
        const association = this.contextAssociation;
        return [this.variantAssociationModelLabel,
            association && association.sampleCount != null ? `${Number(association.sampleCount).toLocaleString()} analysis samples` : '',
            association && association.carrierCount != null ? `${Number(association.carrierCount).toLocaleString()} modeled carriers` : '',
            this.contextMatch && this.contextMatch.status,
            `GRS: ${this.coGeneScoreType === 'sum' ? 'Sum' : 'Max'} (gene/co-gene models)`,
            this.rphersReferenceLabel(this.contextStandardization),
        ].filter(Boolean).join('. ');
    },
    observedPhenotypesHelp() {
        return `Observed HPO terms among the ${this.phenotypeCarrierSelection.present.length} displayed carriers with phenotype data. The denominator excludes carriers with empty or unavailable phenotype records. Counts roll up unique carriers with observed descendants using the HPO ${this.hpoVersion} parent–child hierarchy. For multiple parents, one valid parent path is shown. Expand a branch to see its terms. Metadata matched ${this.sampleMetadataMatched} / ${this.carrierRecords.length} carriers. Missing metadata is not counted as absence.`;
    },
    coGeneAnalysisDetails() {
        return [layoutHelp.coGeneHelp, help.customBeta, layoutHelp.coGeneFdrHelp,
            this.coGeneAssociationSummary ? `${this.coGeneAssociationSummary.nTests} genes tested.` : '',
            this.rphersReferenceLabel(this.coGeneStandardization)].filter(Boolean).join(' ');
    },
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
        return summarizePhenotypes(this.phenotypeCarrierSelection.present, this.phenotypeCatalog);
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
            return { ...row, beta: standardizedField(association, "beta_sd_per_0_1_grs", this.coGeneStandardization), pValue: association.p_value, fdr: association.fdr };
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
        const residuals = summarizeCoVariantResiduals(
            this.filteredCarriers, this.contextResidualById, this.coGeneAnalysisSet === "affected"
        );
        return summarizeCooccurrence(this.filteredCarriers, "coVariants", "id")
            .map(row => ({ ...row, ...residuals[row.id] }));
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
    async loadVariantHpoCounts(key) {
        const revision = ++this.variantHpoRevision;
        this.variantHpoCount = null;
        this.variantHpoResponseKey = '';
        this.variantHpoCountStatus = key ? 'loading' : 'idle';
        if (!key) return;
        const [gene, terms, variant] = JSON.parse(key);
        try {
            const response = await fetch('/__gene_variant_hpo_counts__', {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({gene, hpo_terms: terms, variant_ids: [variant]}),
            });
            if (!response.ok) throw new Error('Recorded HPO metadata unavailable');
            const result = await response.json();
            if (revision !== this.variantHpoRevision || key !== this.variantHpoCountKey) return;
            if (result.gene !== gene || result.match !== 'any' || JSON.stringify(result.hpo_terms) !== JSON.stringify(terms)) throw new Error('HPO profile mismatch');
            this.variantHpoCount = result.variants && result.variants[variant] || null;
            this.variantHpoResponseKey = key;
            this.variantHpoCountStatus = 'ready';
        } catch (_) {
            if (revision === this.variantHpoRevision && key === this.variantHpoCountKey) this.variantHpoCountStatus = 'unavailable';
        }
    },
    phenotypeProfileClass(id) {
        return profileTermClass(id, this.appliedProfileTerms);
    },
    phenotypeDepthColor,
    profileTermMetadataHelp(term) {
        return `This HPO term or its descendants are recorded for ${term.count} of the ${term.total} displayed variant carriers. HPO metadata is available for ${term.metadataCount} of ${term.total} carriers. Missing metadata is not evidence of absence. This recorded-phenotype count is independent of rPheRS scoring eligibility; applying a profile does not filter the carrier list.`;
    },
    revealAppliedPhenotypes() {
        const rows = this.sortedPhenotypeRows;
        const paths = this.appliedProfileTerms.map(hpoPath);
        const matches = rows.filter(row => this.appliedProfileTerms.includes(row.id)
            || row.terms.some(term => this.appliedProfileTerms.includes(term.id)));
        if (!matches.length) return;
        this.phenotypeRootExpanded = true;
        this.resultPages.phenotypes = Math.floor(rows.indexOf(matches[0]) / PHENOTYPE_PAGE_LIMIT) + 1;
        this.expandedCategories = [...new Set([...this.expandedCategories, ...matches.map(row => row.key)])];
        this.expandedPhenotypeNodes = [...new Set([...this.expandedPhenotypeNodes, ...paths.flat()])];
    },
    applyVariantProfile() {
        if (this.contextLoading || this.searchLoading) return;
        this.$refs.profile.finish();
        return this.runVariantContext();
    },
    async rerunVariantProfile(run) {
        if (this.contextLoading || this.searchLoading || !run || !this.profileRuns.some(item => item.id === run.id)) return;
        this.contextInput = run.terms.join(', ');
        this.contextScoreTypeInput = run.scoreType;
        this.contextAnalysisSetInput = run.analysisSet;
        this.$refs.profile.resetDraft();
        this.rerunningProfileRunId = run.id;
        try { await this.runVariantContext(); }
        finally { this.rerunningProfileRunId = null; }
    },
    deleteVariantProfile(run) {
        if (this.contextLoading || this.searchLoading || !run || !this.profileRuns.some(item => item.id === run.id)) return;
        this.profileRuns = this.profileRuns.filter(item => item.id !== run.id);
        if (this.currentProfileRunId !== run.id) return;
        this.currentProfileRunId = null;
        // Invalidate any co-gene request still completing for the deleted result.
        this.contextRunId += 1;
        this.contextMatch = null;
        this.contextAssociation = null;
        this.contextGeneAssociation = null;
        this.contextStandardization = null;
        this.coGeneStandardization = null;
        this.contextResidualById = {};
        this.activeContextTerms = [];
        this.contextTermDetails = [];
        this.contextError = '';
        this.contextWarning = '';
        this.coGeneAssociationByGene = {};
        this.coGeneAssociationStatus = 'idle';
        this.coGeneAssociationSummary = null;
        this.coGeneAssociationError = '';
    },
    isUnavailableValue(value) {
        return !available(value);
    },
    clinvarHref(variantId) {
        return `https://www.ncbi.nlm.nih.gov/clinvar/?term=${encodeURIComponent(variantId)}`;
    },
    clinvarDisplayLabel,
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
        const visible = row.terms.filter(term => {
            if (!visibleParents.has(term.parentId || row.id || row.key)) return false;
            if (this.expandedPhenotypeNodes.includes(term.id)) visibleParents.add(term.id);
            return true;
        });
        const termsById = new Map(row.terms.map(term => [term.id, term]));
        return visible.map((term, position) => {
            const path = [];
            let current = term;
            while (current && path.length < 8) {
                path.unshift(current);
                current = termsById.get(current.parentId);
            }
            const treeGuides = path.map((node, index) => {
                const hasNextSibling = visible.slice(position + 1).some(later =>
                    later.depth === node.depth && later.parentId === node.parentId);
                const elbow = index === path.length - 1;
                return { elbow, last: elbow && !hasNextSibling, continuing: !elbow && hasNextSibling };
            });
            return { ...term, treeGuides };
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
        const defaultDir = ["age", "residual", "meanResidual", "count", "pct", "beta", "hpoCount"].includes(key) ? "desc" : "asc";
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
        const count = carrierHpoTermCount(carrier, this.sampleMetadataById);
        if (count != null) return count;
        return this.sampleMetadataStatus === 'loading' && !this.sampleMetadataById[carrier.id] ? 'Loading…' : 'Unavailable';
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
            let results;
            try {
                const response = await fetch('/__pb_variant_carrier_metadata__', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ gene: this.variantIdentity.gene, variant: variantId, sample_ids: batch }),
                });
                if (!response.ok) throw new Error(`Carrier metadata returned ${response.status}`);
                const payload = await response.json();
                if (payload.gene !== this.variantIdentity.gene || payload.variant !== variantId) throw new Error('Carrier metadata selection mismatch');
                results = batch.map(id => ({id, metadata: sampleMetadataFromCachedInfo(payload.metadata[id], id, this.variantIdentity.gene), failed: (payload.failed || []).includes(id)}));
            } catch (error) {
                // Compatible fallback for integrations that have not installed the shared private batch endpoint.
                results = new Array(batch.length);
                let next = 0;
                await Promise.all(Array.from({length: Math.min(12, batch.length)}, async () => {
                    while (next < batch.length) {
                    const index = next++;
                    const id = batch[index];
                    try {
                        const response = await request('/api/bio/query/samples-info', { q: id, limit: 5 }, true);
                        if (!response.ok) throw new Error(`samples-info returned ${response.status}`);
                        const payload = await response.json();
                        results[index] = { id, metadata: sampleMetadataFromRows(payload.data, id, this.variantIdentity.gene), failed: false };
                    } catch (_) { results[index] = { id, metadata: null, failed: true }; }
                    }
                }));
            }
            if (loadId !== this.sampleMetadataLoadId || variantId !== this.variantIdentity.canonicalId) return;
            const metadataById = { ...this.sampleMetadataById };
            for (const result of results) {
                if (result.metadata) metadataById[result.id] = Object.freeze(result.metadata);
                if (result.failed) this.sampleMetadataFailed += 1;
            }
            this.sampleMetadataById = Object.freeze(metadataById);
            this.carrierRecords = mergeCarrierMetadata(this.carrierRecords, metadataById);
            this.sampleMetadataCompleted += batch.length;
            this.sampleMetadataMatched += results.filter(result => result.metadata).length;
        }
        if (loadId !== this.sampleMetadataLoadId) return;
        this.carrierRecords = mergeCarrierMetadata(this.carrierRecords, this.sampleMetadataById);
        this.sampleMetadataStatus = this.sampleMetadataFailed ? "partial" : "ready";
        this.revealAppliedPhenotypes();
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
    rphersReferenceLabel(reference) { return referenceDescription(reference); },
    geneAssociationCell(gene, field) {
        if (this.coGeneAssociationStatus === "idle") return "No context";
        if (this.coGeneAssociationStatus === "loading") return "Calculating…";
        const association = this.coGeneAssociationByGene[gene];
        if (!association || association.status !== "ok") return "Unavailable";
        const value = field === "beta" ? standardizedField(association, "beta_sd_per_0_1_grs", this.coGeneStandardization)
            : field === "p_value" ? association.p_value : association[field];
        return field === "beta" ? this.displayMean(value) : this.displayPValue(value);
    },
    async runCoGeneAssociations(terms, runId) {
        if (runId !== this.currentProfileRunId) return;
        const scoreType = this.coGeneScoreType;
        const analysisSet = this.coGeneAnalysisSet;
        this.coGeneAssociationStatus = "loading";
        this.coGeneAssociationError = "";
        this.coGeneAssociationByGene = {};
        this.coGeneAssociationSummary = null;
        try {
            if (this.sampleMetadataPromise) await this.sampleMetadataPromise;
            if (runId !== this.currentProfileRunId) return;
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
                    score_type: scoreType,
                    affected_only: analysisSet === "affected",
                }),
            });
            if (!response.ok) throw new Error(await contextApiError(response));
            const result = await response.json();
            if (runId !== this.currentProfileRunId) return;
            if (result.target_gene !== this.variantIdentity.gene
                || terms.some(term => !result.query_hpo.includes(term))
                || result.query_hpo.length !== terms.length
                || result.score_type !== scoreType
                || result.affected_only !== (analysisSet === "affected")) {
                throw new Error("Co-gene association response did not match this HPO context.");
            }
            this.coGeneAssociationByGene = result.gene_associations || {};
            this.coGeneStandardization = contextMatches(result.rphers_standardization, terms) &&
                sameReference(result.rphers_standardization, this.contextStandardization)
                ? result.rphers_standardization : null;
            this.coGeneAssociationSummary = {
                model: result.model,
                scoreType: result.score_type,
                nRequested: result.n_requested,
                nTests: result.n_tests,
                affectedOnly: result.affected_only,
            };
            this.coGeneAssociationStatus = "ready";
        } catch (error) {
            if (runId !== this.currentProfileRunId) return;
            this.coGeneAssociationStatus = "error";
            this.coGeneAssociationError = String(error && error.message ? error.message : error);
        }
    },
    async runVariantContext() {
        if (this.contextLoading || this.searchLoading) return;
        let terms;
        try { terms = resolveHpoTerms(this.contextInput); }
        catch (error) { this.contextError = error.message; return; }
        this.contextInput = terms.join(", ");
        this.contextLoading = true;
        this.contextRunId += 1;
        const runId = this.contextRunId;
        const variantId = this.variantIdentity.canonicalId;
        const gene = this.variantIdentity.gene;
        const scoreType = this.contextScoreTypeInput;
        const analysisSet = this.contextAnalysisSetInput;
        const isCurrentRequest = () => runId === this.contextRunId && variantId === this.variantIdentity.canonicalId;
        this.contextError = "";
        this.contextWarning = "";
        try {
            const analyze = (analysisTerms) => fetch("/phenotype-analyzer-api/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    terms: analysisTerms.join(","),
                    gene,
                    variant_id: variantId,
                    score_type: scoreType,
                    affected_only: analysisSet === "affected",
                    advanced: { significance_metric: "p_value", significance_threshold: 0.05, min_carriers: 10 },
                }),
            });
            let analysisTerms = terms;
            let excludedTerms = [];
            let response = await analyze(analysisTerms);
            if (!isCurrentRequest()) return;
            if (!response.ok) {
                const failure = await contextApiFailure(response);
                const missing = failure.missingTerms;
                if (!missing.length || missing.some(term => !terms.includes(term))) throw new Error(failure.message);
                analysisTerms = terms.filter(term => !missing.includes(term));
                if (!analysisTerms.length) throw new Error(`None of the entered HPO terms are in the CRDC cohort data: ${missing.join(", ")}.`);
                excludedTerms = missing;
                response = await analyze(analysisTerms);
                if (!isCurrentRequest()) return;
            }
            if (!response.ok) throw new Error(await contextApiError(response));
            const payload = await response.json();
            if (!isCurrentRequest()) return;
            const result = payload.genes && payload.genes[gene]
                ? payload.genes[gene]
                : payload;
            if (!contextMatches(result.rphers_standardization, analysisTerms)) result.rphers_standardization = null;
            const match = exactVariantContext(result, variantId);
            const association = exactVariantAssociation(result, variantId);
            if (!match && !association) throw new Error("The Context API did not return this exact variant.");
            this.coGeneScoreType = scoreType;
            this.coGeneAnalysisSet = analysisSet;
            this.currentProfileRunId = runId;
            this.coGeneStandardization = null;
            this.coGeneAssociationByGene = {};
            this.coGeneAssociationStatus = "idle";
            this.coGeneAssociationSummary = null;
            this.coGeneAssociationError = "";
            if (excludedTerms.length) this.contextWarning = `Excluded from calculation because they are not in the CRDC cohort data: ${excludedTerms.map(id => `${hpoLabel(id)} (${id})`).join(", ")}.`;
            this.contextStandardization = result.rphers_standardization || null;
            if (!referenceAvailable(this.contextStandardization))
                this.contextWarning = [this.contextWarning, referenceDescription(this.contextStandardization)].filter(Boolean).join(" ");
            this.contextMatch = match;
            this.contextAssociation = association;
            this.contextGeneAssociation = result.gene_association || null;
            this.contextResidualById = exactVariantCarrierResiduals(result, variantId);
            this.activeContextTerms = analysisTerms;
            this.revealAppliedPhenotypes();
            this.contextTermDetails = analysisTerms.map((id) => {
                const existing = this.contextTermDetails.find((term) => term.id === id);
                return existing || { id, label: hpoLabel(id) };
            });
            this.profileRuns.unshift(Object.freeze({
                id: runId, variantId, terms: Object.freeze([...analysisTerms]),
                label: analysisTerms.map(hpoLabel).join(' + '), scoreType, analysisSet,
                match: match && Object.freeze({ ...match }),
                association: association && Object.freeze({ ...association }),
                analysisDetails: this.profileAnalysisDetails,
                warning: this.contextWarning,
            }));
            this.runCoGeneAssociations(analysisTerms, runId);
        } catch (error) {
            if (isCurrentRequest()) this.contextError = String(error && error.message ? error.message : error);
        } finally {
            if (isCurrentRequest()) this.contextLoading = false;
        }
    },
    async submitVariantSearch() {
        if (normalizeVariant(this.searchQuery) !== normalizeVariant(this.variantIdentity.canonicalId)) {
            this.geneQuery = "";
        }
        await this.loadLiveVariantData(true);
    },
    async loadLiveVariantData(updateUrl = false) {
        this.carrierSamplesExpanded = false;
        this.sampleMetadataLoadId += 1;
        this.contextRunId += 1;
        this.contextLoading = false;
        this.currentProfileRunId = null;
        this.rerunningProfileRunId = null;
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
            this.profileRuns = [];
            this.contextMatch = null;
            this.contextAssociation = null;
            this.contextGeneAssociation = null;
            this.contextStandardization = null;
            this.coGeneStandardization = null;
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
