import {
    geneInfo, crdcEvidence, genomeWindow, variantRows,
    geneCarrierDemographics, geneLevelPhenotypeCategories, geneLevelCoCarrierGenes,
} from "./mockData";
import { applyPbGeneFixturePipeline, fixtureGeneSymbol, fixtureLoaded } from "./fixturePipeline";
import { fetchPbGeneBioIndexState } from "./pbGeneBioIndexAdapter";

const LOCAL_CONTEXT_FIXTURE_ENABLED = process.env.VUE_APP_PB_GENE_CONTEXT_FIXTURE === "true";

export function createPbGeneState() {
    const params = new URLSearchParams(window.location.search);
    const query = normalizeGeneQuery(params.get("query") || fixtureGeneSymbol || geneInfo.symbol);
    const mockSymbol = normalizeGeneQuery(geneInfo.symbol);
    const useMockBase = fixtureLoaded || query === mockSymbol;

    // Base state from mockData
    const base = useMockBase
        ? {
            geneInfo: { ...geneInfo, symbol: query },
            crdcEvidence,
            genomeWindow,
            variantRows,
            geneCarrierDemographics,
            geneLevelPhenotypeCategories,
            geneLevelCoCarrierGenes,
        }
        : createUnavailableGeneState(query);

    // Apply RDS fixture if available (overrides mockData)
    const resolved = fixtureLoaded ? applyPbGeneFixturePipeline(base, query) : base;
    return createPbGeneRuntimeState(resolved, query, params);
}

function createPbGeneRuntimeState(resolved, query, params = new URLSearchParams()) {
    const initialLocusMode = params.get("locus") || params.get("locusView") || "";
    const initialVariantId =
        ((resolved.genomeWindow.markers || []).find(m => m.focal) || {}).variantId ||
        ((resolved.variantRows || [])[0] && resolved.variantRows[0].id) ||
        null;
    const initialVariantBp = initialVariantId
        ? parseInt(String(initialVariantId).split(":")[1], 10)
        : null;
    const initialZoomLevel = initialLocusMode === "base" ? MAX_ZOOM : initialLocusMode === "codon" ? 4 : initialLocusMode === "variant" ? 3 : 1;

    return {
        ...resolved,

        // Block 3 summary mode
        geneTab: "gene",
        summaryExpandedCards: {},
        searchGeneQuery: query,
        searchGeneLoading: false,
        searchGeneError: "",
        liveDataLoaded: false,
        liveDataSource: fixtureLoaded ? "local fixture" : "mock fallback",

        // User-entered HPO context and accumulated gene-level runs
        contextInput: "",
        contextLoading: false,
        contextError: "",
        contextRuns: [],
        activeContextTerms: [],
        contextSignificanceMetric: "p_value",
        contextSignificanceThreshold: 0.05,
        contextMinCarriers: 5,

        // Variants sub-accordion
        expandedVariantId: null,
        activeTabMap: {},

        // Density + sample filters
        activeDensity: "all",
        carrierScopeFilter: "All",
        ageFilter: "All ages",
        investigatorFilter: "All investigators",
        sexFilter: "All",

        // Zoom level (1=whole gene … 6=queried variant ±25 bp)
        zoomLevel: initialZoomLevel,
        // Pan: genomic bp at window center (null = centered on queried variant)
        panCenterBp: initialZoomLevel > 1 && initialVariantBp ? initialVariantBp : null,
        dragState: null,
        locusVariantId: initialVariantId,

        // Carrier table "show more" (+5 increments)
        showCountCarrierMap:  {},   // variantId → count shown
        showCountGeneCarriers: 5,
        showCountVariants: 10,

        // Expandable phenotype categories
        expandedPhenoCategories: {},
        showAllTermsMap: {},         // category → bool (show all terms)
        showPathwayDetails: false,

        // Phenotype category list "show 5, hide rest" toggles
        showAllPhenoCategories: false,   // gene-level profile
        showAllVariantPhenoMap: {},      // variantId → bool (accordion profile)

        // Carrier samples sort
        sortKey: null,
        sortDir: "asc",
        variantSortKey: "variantScore",
        variantSortDir: "desc",
    };
}

// ── constants ─────────────────────────────────────────────────────────────────
function normalizeGeneQuery(value) {
    return String(value || "").trim().toUpperCase();
}

function createUnavailableGeneState(query) {
    return {
        geneInfo: {
            ...geneInfo,
            symbol: query,
            fullName: "Unavailable until private BioIndex responds",
            description: "Live private BioIndex data has not loaded for this gene.",
            cytogeneticLocation: "",
            ensemblId: "Unavailable",
            chromosome: "",
            location: "Unavailable",
            strand: "+",
            omim: "Unavailable",
            referenceAnnotation: {
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
            },
        },
        crdcEvidence: {
            crdcCohortCount: null,
            currentGeneCarrierTotal: 0,
            queriedVariantCarriers: 0,
            variantCount: 0,
            probands: null,
            affected: null,
            largestClinicalArea: null,
            overallBurdenMatchScore: null,
            topVariantSignal: { score: null, variant: "-" },
            topCarrierTerms: [],
        },
        genomeWindow: {
            axisTicks: [],
            exons: [],
            markers: [],
            densityAll: Array.from({ length: 50 }, () => 0),
            densityProband: Array.from({ length: 50 }, () => 0),
            queryDensityIndex: 0,
        },
        variantRows: [],
        geneCarrierDemographics: { byAge: [], bySex: [], byAffected: [], byProband: [], byInvestigator: [] },
        geneLevelPhenotypeCategories: [],
        geneLevelCoCarrierGenes: [],
    };
}

const ZOOM_HALF_WINDOWS = [25, 13, 7, 4, 2]; // (legacy) bins on each side
// Single coordinate system, zoom-driven window WIDTH in bp.
// L1 = whole gene · L2 = 5 kb · L3 = 500 bp · L4 = 100 bp · L5 = ±25 bp.
const ZOOM_BP_WIDTHS = [null, 5000, 500, 100, 50];
const MAX_ZOOM = 5;
const LOCUS_DENSITY_PLOT_PX = 108;
const TERMS_LIMIT    = 5;
const CARRIER_LIMIT  = 5;
const VARIANT_LIMIT  = 10;
const PHENO_CAT_LIMIT = 5;
const SUMMARY_PHENO_LIMIT = 4;
const SUMMARY_GENE_LIMIT = 6;
const SUMMARY_DEMO_LIMIT = 4;

export const pbGeneComputed = {
    // ── sample filter helper ─────────────────────────────────────────────────
    sampleMatches() {
        return (s) => {
            const matchAge = this.ageFilter === "All ages" || s.age === this.ageFilter;
            const matchInv = this.investigatorFilter === "All investigators" || s.group === this.investigatorFilter;
            const sampleSex = String(s.sex || "").toLowerCase();
            let matchSex = true;
            if (this.sexFilter === "Female") matchSex = sampleSex === "f" || sampleSex === "female";
            else if (this.sexFilter === "Male") matchSex = sampleSex === "m" || sampleSex === "male";
            else if (this.sexFilter === "n/a") matchSex = !sampleSex || sampleSex === "unknown" || sampleSex === "na" || sampleSex === "n/a";
            else matchSex = this.sexFilter === "All" || s.sex === this.sexFilter;
            return matchAge && matchInv && matchSex;
        };
    },

    filteredCarrierCount() {
        let count = 0;
        const matches = this.sampleMatches;
        this.variantRows.forEach(row => {
            row.carrierSamples.forEach(s => { if (matches(s)) count++; });
        });
        return count;
    },

    densityBins() {
        const base = this.activeDensity === "proband"
            ? this.genomeWindow.densityProband
            : this.genomeWindow.densityAll;
        const total    = this.totalGeneCarriers;
        const filtered = this.filteredCarrierCount;
        if (filtered === total) return base;
        const scale = filtered / total;
        return base.map(v => Math.round(v * scale));
    },

    // ── zoom ──────────────────────────────────────────────────────────────────
    // zoom 1× = the WHOLE gene (default); higher levels narrow around the queried variant.
    visibleZoomRange() {
        const idx   = this.genomeWindow.queryDensityIndex;
        const total = this.genomeWindow.densityAll.length;
        if (this.zoomLevel <= 1) return { start: 0, end: total };
        const half  = ZOOM_HALF_WINDOWS[this.zoomLevel - 1];
        const start = Math.max(0, idx - half);
        const end   = Math.min(total, idx + half);
        return { start, end };
    },

    visibleDensityBins() {
        const { start, end } = this.visibleZoomRange;
        return this.densityBins.slice(start, end);
    },

    visibleDensityMax() {
        return Math.max(...this.visibleDensityBins, 1);
    },

    visibleQueryIndex() {
        return this.genomeWindow.queryDensityIndex - this.visibleZoomRange.start;
    },

    // variants mapped onto the currently-visible density bins (aligned to the bars)
    variantVisibleBins() {
        const len = this.visibleDensityBins.length || 1;
        const map = {};
        this.visibleMarkers.forEach(m => {
            let idx;
            if (m.focal) idx = this.visibleQueryIndex;
            else idx = Math.round((parseFloat(m.left) / 100) * (len - 1));
            idx = Math.max(0, Math.min(len - 1, idx));
            (map[idx] = map[idx] || []).push(m);
        });
        return map;
    },

    visibleBinHasFocal() {
        const out = {};
        const map = this.variantVisibleBins;
        Object.keys(map).forEach(k => { out[k] = map[k].some(m => m.focal); });
        return out;
    },

    visibleAxisTicks() {
        const total      = this.genomeWindow.densityAll.length;
        const { start, end } = this.visibleZoomRange;
        const binCount   = Math.max(total, 1);
        const visStartBp = this.geneStartBp + (start / binCount) * this.geneSpanBp;
        const visEndBp   = this.geneStartBp + (end / binCount) * this.geneSpanBp;
        const rangeBp    = visEndBp - visStartBp;
        const tickCount  = this.zoomLevel >= 2 ? 7 : 5;

        return Array.from({ length: tickCount }, (_, i) => {
            const bp = Math.round(visStartBp + (i / (tickCount - 1)) * rangeBp);
            if (rangeBp < 3000) {
                return bp.toLocaleString();
            }
            const kb = bp / 1000;
            const thou = Math.floor(kb / 1000);
            const frac = String(Math.round(kb % 1000)).padStart(3, "0");
            return `${thou},${frac}k`;
        });
    },

    // ── zoom: exon + marker tracks ────────────────────────────────────────────
    visibleExons() {
        const binCount   = this.genomeWindow.densityAll.length;
        const { start, end } = this.visibleZoomRange;
        const totalBins  = Math.max(binCount, 1);
        const visStartBp = this.geneStartBp + (start / totalBins) * this.geneSpanBp;
        const visEndBp   = this.geneStartBp + (end / totalBins) * this.geneSpanBp;
        const visRange   = visEndBp - visStartBp;

        const focal = (this.genomeWindow.markers || []).find(m => m.focal);
        const focalAbs = focal ? this.geneStartBp + (parseFloat(focal.left) / 100) * this.geneSpanBp : null;

        return this.genomeWindow.exons.map(exon => {
            const leftFrac  = parseFloat(exon.left)  / 100;
            const widthFrac = parseFloat(exon.width) / 100;
            const absLeft   = this.geneStartBp + leftFrac * this.geneSpanBp;
            const absRight  = absLeft + widthFrac * this.geneSpanBp;

            if (absRight <= visStartBp || absLeft >= visEndBp) return null;

            const cLeft  = Math.max(absLeft,  visStartBp);
            const cRight = Math.min(absRight, visEndBp);
            const pxWidth = (cRight - cLeft) / visRange * 100;
            return {
                ...exon,
                left:  ((cLeft  - visStartBp) / visRange * 100).toFixed(1) + "%",
                width: pxWidth.toFixed(1) + "%",
                widthPct: pxWidth,
                focal: focalAbs != null && focalAbs >= absLeft - 0.05 && focalAbs <= absRight + 0.05,
            };
        }).filter(Boolean);
    },

    visibleMarkers() {
        const binCount   = this.genomeWindow.densityAll.length;
        const { start, end } = this.visibleZoomRange;
        const totalBins  = Math.max(binCount, 1);
        const visStartBp = this.geneStartBp + (start / totalBins) * this.geneSpanBp;
        const visEndBp   = this.geneStartBp + (end / totalBins) * this.geneSpanBp;
        const visRange   = visEndBp - visStartBp;

        const visible = this.genomeWindow.markers.map(marker => {
            const leftFrac = parseFloat(marker.left) / 100;
            const absBp    = this.geneStartBp + leftFrac * this.geneSpanBp;

            if (absBp < visStartBp || absBp > visEndBp) return null;

            return {
                ...marker,
                left: ((absBp - visStartBp) / visRange * 100).toFixed(1) + "%",
            };
        }).filter(Boolean);

        // Re-assign yIndex based on position in visible list (for staggered vertical layout)
        return visible.map((m, i) => ({ ...m, yIndex: i }));
    },

    // ── gene-level carrier samples (deduplicated by sample ID) ───────────────
    geneCarrierSamples() {
        const seen = new Set();
        const out  = [];
        for (const row of this.variantRows) {
            for (const s of row.carrierSamples) {
                if (seen.has(s.id)) continue;
                seen.add(s.id);
                out.push({
                    ...s,
                    variantId:   row.id,
                    csqDetail:   row.csq_detail,
                    consequence: row.consequence,
                    clinvar:     row.clinvar,
                });
            }
        }
        return out;
    },

    visibleGeneCarrierSamples() {
        return this.sortedGeneCarrierSamples.slice(0, this.showCountGeneCarriers);
    },

    sortedGeneCarrierSamples() {
        if (!this.sortKey) return this.geneCarrierSamples;
        const key = this.sortKey;
        const dir = this.sortDir === "asc" ? 1 : -1;
        return [...this.geneCarrierSamples].sort((a, b) => {
            const av = String(a[key] || "");
            const bv = String(b[key] || "");
            return av < bv ? -dir : av > bv ? dir : 0;
        });
    },

    queriedDensityCount() {
        const row = this.currentLocusVariantRow;
        if (!row) return 0;
        const matches = this.variantFilterMatches;
        return row.carrierSamples.filter(s => matches(s)).length;
    },

    queriedVariantCarrierCount() {
        const row = this.queriedVariantRow;
        if (!row) return 0;
        const matches = this.variantFilterMatches;
        return (row.carrierSamples || []).filter(s => matches(s)).length || row.carrierCount || 0;
    },

    queriedPositionCarrierCount() {
        const item = this.positionCarrierCountMap[this.queriedBp];
        return item ? item.count : this.queriedVariantCarrierCount;
    },

    queriedVariantCodingContext() {
        const row = this.queriedVariantRow;
        return row ? row.codingContext : null;
    },

    defaultQueriedVariantId() {
        // Legacy fixture flag: translate once into the current "queried variant" concept.
        const queriedMarker = (this.genomeWindow.markers || []).find(m => m.focal);
        return queriedMarker ? queriedMarker.variantId : (this.variantRows[0] && this.variantRows[0].id);
    },

    queriedVariantId() {
        return this.locusVariantId || this.defaultQueriedVariantId;
    },

    queriedVariantRow() {
        return (this.variantRows || []).find(row => row.id === this.queriedVariantId) || null;
    },

    currentLocusVariantRow() {
        return this.queriedVariantRow;
    },

    queriedBp() {
        const selected = this.variantPosition(this.queriedVariantId);
        if (selected) return selected;
        const frac = this.genomeWindow.queryDensityIndex / Math.max((this.genomeWindow.densityAll || []).length, 1);
        return Math.round(this.geneStartBp + frac * this.geneSpanBp);
    },

    queriedVariantAlleles() {
        const parts = String(this.queriedVariantId || "").split(":");
        return parts.length >= 4 ? { ref: parts[2], alt: parts[3] } : { ref: "ref", alt: "alt" };
    },

    queriedVariantShortLabel() {
        const a = this.queriedVariantAlleles;
        return `${a.ref}>${a.alt}`;
    },

    queriedVariantDisplayLabel() {
        return `chr${this.geneInfo.chromosome}:${this.queriedBp.toLocaleString()} ${this.queriedVariantShortLabel} | query`;
    },

    isWholeGeneView() {
        return this.zoomLevel <= 1;
    },

    geneLocusRangeLabel() {
        const location = String(this.geneInfo.location || "").replace(/\s*–\s*/g, " - ");
        const cytogenetic = String(this.geneInfo.cytogeneticLocation || "").trim();
        const spanLabel = `${(this.geneSpanBp / 1000).toFixed(1)} kb`;
        return cytogenetic
            ? `${location} (${cytogenetic}; ${spanLabel})`
            : `${location} (${spanLabel})`;
    },

    carrierScopeOptions() {
        return [
            { value: "All", label: "All carriers" },
            { value: "Proband", label: "Probands only" },
            { value: "Affected", label: "Affected only" },
        ];
    },

    sexFilterOptions() {
        return [
            { value: "All", label: "All sexes" },
            { value: "Female", label: "Female" },
            { value: "Male", label: "Male" },
            { value: "n/a", label: "n/a" },
        ];
    },

    totalGeneCarriers() {
        const e = this.crdcEvidence || {};
        return e.currentGeneCarrierTotal != null ? e.currentGeneCarrierTotal : (e.queriedVariantCarriers || 0);
    },

    selectedEvidenceVariant() {
        if (!this.expandedVariantId) return null;
        return (this.variantRows || []).find(row => row.id === this.expandedVariantId) || null;
    },

    summaryCarrierTotal() {
        return this.geneTab === "variant" && this.selectedEvidenceVariant
            ? (this.selectedEvidenceVariant.carrierCount || 0)
            : this.totalGeneCarriers;
    },

    summaryPhenotypeCategories() {
        if (this.geneTab === "variant" && this.selectedEvidenceVariant) {
            return this.selectedEvidenceVariant.phenotypeCategories || [];
        }
        return this.geneLevelPhenotypeCategories || [];
    },

    summaryPhenotypeCardLabel() {
        if (this.isSummaryCardExpanded("phenotype")) {
            return `${this.summaryPhenotypeCategories.length} categories`;
        }
        const shown = Math.min(SUMMARY_PHENO_LIMIT, this.summaryPhenotypeCategories.length);
        return shown ? `Top ${shown} categories` : "0 categories";
    },

    summaryPhenotypeRows() {
        if (this.isSummaryCardExpanded("phenotype")) return this.summaryPhenotypeCategories;
        return this.summaryPhenotypeCategories.slice(0, SUMMARY_PHENO_LIMIT);
    },

    summaryPhenotypeHiddenCount() {
        return Math.max(0, this.summaryPhenotypeCategories.length - SUMMARY_PHENO_LIMIT);
    },

    summaryCoCarrierGenes() {
        if (this.geneTab === "variant" && this.selectedEvidenceVariant) {
            return this.selectedEvidenceVariant.coCarrierGenes || [];
        }
        const hasVariantLevelEvidence = (this.variantRows || []).some(row => (row.coCarrierGenes || []).length);
        if (!hasVariantLevelEvidence) return [];
        return this.geneLevelCoCarrierGenes || [];
    },

    summaryCoCarrierCardLabel() {
        if (this.isSummaryCardExpanded("genotype")) {
            return `${this.summaryCoCarrierGenes.length} co-carrier genes`;
        }
        const shown = Math.min(SUMMARY_GENE_LIMIT, this.summaryCoCarrierGenes.length);
        return this.summaryCoCarrierGenes.length > shown
            ? `Top ${shown} of ${this.summaryCoCarrierGenes.length} genes`
            : `${this.summaryCoCarrierGenes.length} co-carrier genes`;
    },

    summaryCoCarrierGenesVisible() {
        if (this.isSummaryCardExpanded("genotype")) return this.summaryCoCarrierGenes;
        return this.summaryCoCarrierGenes.slice(0, SUMMARY_GENE_LIMIT);
    },

    summaryCoCarrierHiddenCount() {
        return Math.max(0, this.summaryCoCarrierGenes.length - SUMMARY_GENE_LIMIT);
    },

    summaryCarrierDemographics() {
        if (!(this.geneTab === "variant" && this.selectedEvidenceVariant)) {
            return this.geneCarrierDemographics || { byAge: [], byInvestigator: [], bySex: [], byAffected: [] };
        }
        const samples = this.selectedEvidenceVariant.carrierSamples || [];
        const countBy = (field) => {
            const map = {};
            samples.forEach(sample => {
                const key = sample[field];
                if (this.isMissingMetadataValue(key)) return;
                map[key] = (map[key] || 0) + 1;
            });
            return Object.keys(map)
                .map(key => ({ key, count: map[key] }))
                .sort((a, b) => b.count - a.count || String(a.key).localeCompare(String(b.key)));
        };
        return {
            byAge: countBy("age").map(row => ({ band: row.key, count: row.count })),
            byInvestigator: countBy("group").map(row => ({ inv: row.key, count: row.count })),
            bySex: countBy("sex").map(row => ({ label: row.key, count: row.count })),
            byAffected: countBy("affected").map(row => ({ label: row.key, count: row.count })),
        };
    },

    summaryCarrierDemographicsHasRows() {
        const demo = this.summaryCarrierDemographics || {};
        return ["byAge", "byInvestigator", "bySex", "byAffected"].some(key => (demo[key] || []).length);
    },

    summaryCarrierDemographicsVisible() {
        const demo = this.summaryCarrierDemographics || {};
        if (this.isSummaryCardExpanded("demographics")) {
            return {
                byAge: demo.byAge || [],
                byInvestigator: demo.byInvestigator || [],
                bySex: demo.bySex || [],
                byAffected: demo.byAffected || [],
            };
        }
        return {
            byAge: (demo.byAge || []).slice(0, SUMMARY_DEMO_LIMIT),
            byInvestigator: (demo.byInvestigator || []).slice(0, SUMMARY_DEMO_LIMIT),
            bySex: (demo.bySex || []).slice(0, SUMMARY_DEMO_LIMIT),
            byAffected: (demo.byAffected || []).slice(0, SUMMARY_DEMO_LIMIT),
        };
    },

    summaryCarrierDemographicsHiddenCount() {
        const demo = this.summaryCarrierDemographics || {};
        return ["byAge", "byInvestigator", "bySex", "byAffected"].reduce((total, key) => {
            const rows = demo[key] || [];
            return total + Math.max(0, rows.length - SUMMARY_DEMO_LIMIT);
        }, 0);
    },

    availableAges() {
        const ages = new Set();
        this.variantRows.forEach(row => row.carrierSamples.forEach(s => ages.add(s.age)));
        const ordered = ["<1", "1-5", "6-11", "12-17", "18+", "Unknown", "0-1", "2-4", "5-12", "13-18", "Adult"];
        const known = ordered.filter(a => ages.has(a));
        const rest = Array.from(ages).filter(a => !ordered.includes(a)).sort();
        return ["All ages", ...known, ...rest];
    },

    availableInvestigators() {
        const invs = new Set();
        this.variantRows.forEach(row => row.carrierSamples.forEach(s => invs.add(s.group)));
        return ["All investigators", ...Array.from(invs).sort()];
    },

    availableSexes() {
        const sexes = new Set();
        this.variantRows.forEach(row => row.carrierSamples.forEach(s => sexes.add(s.sex)));
        return ["All", ...Array.from(sexes).sort()];
    },

    demoMax() {
        return this.totalGeneCarriers;
    },

    // ── Carrier counts rows (+ F/M split derived from gene-level sex ratio) ──
    carrierCountRows() {
        const e = this.crdcEvidence || {};
        const total = this.totalGeneCarriers;
        const bySex = (this.geneCarrierDemographics && this.geneCarrierDemographics.bySex) || [];
        const fem = bySex.find(r => /female|^f$/i.test(r.label));
        const mal = bySex.find(r => /male|^m$/i.test(r.label));
        let femaleFrac = 0.5;
        if (fem && mal && (fem.count + mal.count) > 0) {
            femaleFrac = fem.count / (fem.count + mal.count);
        }
        const split = (n) => {
            const f = Math.round(n * femaleFrac);
            return { female: f, male: Math.max(n - f, 0) };
        };
        const pct = (n) => (total ? Math.round((n / total) * 100) + "%" : "—");
        const mk = (label, n, sub) => Object.assign({ label, n, sub }, split(n));
        return [
            mk("Carriers", total,             (e.variantCount || 0) + " vars"),
            mk("Probands", e.probands || 0,   pct(e.probands || 0)),
            mk("Affected", e.affected || 0,   pct(e.affected || 0)),
            mk("GenDx Dx", e.genDxDiagnosed || 0, pct(e.genDxDiagnosed || 0)),
        ];
    },

    // ── Full-gene locus view (no zoom): axis, density, variant→bin mapping ──
    fullAxisTicks() {
        const n = 6;
        const out = [];
        for (let i = 0; i < n; i++) {
            const bp = Math.round(this.geneStartBp + (i / (n - 1)) * this.geneSpanBp);
            const kb = bp / 1000;
            const thou = Math.floor(kb / 1000);
            const frac = String(Math.round(kb % 1000)).padStart(3, "0");
            out.push(`${thou},${frac}k`);
        }
        return out;
    },

    densityFullBins() {
        return this.densityBins;
    },

    densityFullMax() {
        return Math.max(...this.densityBins, 1);
    },

    focalBinIndex() {
        return this.genomeWindow.queryDensityIndex;
    },

    // binIndex → array of variant markers sitting in that bin (focal pinned to focal bar)
    variantBins() {
        const len = (this.genomeWindow.densityAll || []).length || 1;
        const map = {};
        (this.genomeWindow.markers || []).forEach((m) => {
            let idx;
            if (m.focal) {
                idx = this.genomeWindow.queryDensityIndex;
            } else {
                const frac = parseFloat(m.left) / 100;
                idx = Math.round(frac * (len - 1));
            }
            idx = Math.max(0, Math.min(len - 1, idx));
            (map[idx] = map[idx] || []).push(m);
        });
        return map;
    },

    binHasFocal() {
        const map = this.variantBins;
        const out = {};
        Object.keys(map).forEach((k) => {
            out[k] = map[k].some((m) => m.focal);
        });
        return out;
    },

    locusVariants() {
        return [...(this.genomeWindow.markers || [])].sort(
            (a, b) => (b.focal ? 1 : 0) - (a.focal ? 1 : 0) || b.carrierCount - a.carrierCount
        );
    },

    // ── Per-position (per-bp) carrier count aligned 1:1 with coding-context bases.
    // One bar = 1 bp = one base cell. Count = carriers with a variant at that exact bp.
    codingBaseBars() {
        const cc = this.queriedVariantCodingContext;
        if (!cc || !cc.bases) return null;
        const posCount = {};
        (this.genomeWindow.markers || []).forEach((m) => {
            const pos = parseInt(String(m.variantId).split(":")[1], 10);
            if (!isNaN(pos)) posCount[pos] = (posCount[pos] || 0) + (m.carrierCount || 0);
        });
        const bars = cc.bases.map((b) => ({
            pos: b.pos,
            count: posCount[parseInt(b.pos, 10)] || 0,
            isVariant: b.isVariant,
        }));
        const max = Math.max(...bars.map((b) => b.count), 1);
        return { bars, max };
    },

    // ════════════════════════════════════════════════════════════════════════
    // Single coordinate system (bp) shared by axis / exons / variants / bases.
    // Zoom changes the window WIDTH; everything maps bp → % of the window.
    // ════════════════════════════════════════════════════════════════════════
    geneLocationRangeBp() {
        const loc = String(this.geneInfo.location || "");
        const range = loc.includes(":") ? loc.slice(loc.indexOf(":") + 1) : loc;
        const values = range.match(/\d[\d,]*/g) || [];
        const parsed = values.map(v => parseInt(v.replace(/,/g, ""), 10)).filter(v => !isNaN(v));
        return parsed.length >= 2
            ? { start: Math.min(parsed[0], parsed[1]), end: Math.max(parsed[0], parsed[1]) }
            : null;
    },

    exonRangeBp() {
        const values = [];
        (this.genomeWindow.exons || []).forEach(exon => {
            const start = parseInt(exon.start, 10);
            const end = parseInt(exon.end, 10);
            if (!isNaN(start)) values.push(start);
            if (!isNaN(end)) values.push(end);
        });
        return values.length ? { start: Math.min(...values), end: Math.max(...values) } : null;
    },

    markerRangeBp() {
        const values = [];
        (this.variantRows || []).forEach(row => {
            const pos = this.variantPosition(row.id);
            if (pos) values.push(pos);
        });
        (this.genomeWindow.markers || []).forEach(marker => {
            const pos = this.variantPosition(marker.variantId);
            if (pos) values.push(pos);
        });
        return values.length ? { start: Math.min(...values), end: Math.max(...values) } : null;
    },

    geneStartBp() {
        const range = this.geneLocationRangeBp || this.exonRangeBp || this.markerRangeBp;
        return range ? range.start : 0;
    },

    geneEndBp() {
        const range = this.geneLocationRangeBp || this.exonRangeBp || this.markerRangeBp;
        if (range && range.end > range.start) return range.end;
        return this.geneStartBp + 1;
    },

    geneSpanBp() {
        return Math.max(1, this.geneEndBp - this.geneStartBp);
    },

    locusWindowWidth() {
        if (this.zoomLevel <= 1) return this.geneSpanBp;
        return ZOOM_BP_WIDTHS[this.zoomLevel - 1] || 50;
    },

    maxZoomLevel() {
        return MAX_ZOOM;
    },

    focalBp() {
        return this.queriedBp;
    },

    codingBaseSpan() {
        const cc = this.queriedVariantCodingContext;
        if (!cc || !cc.bases || !cc.bases.length) return null;
        const ps = cc.bases.map(b => parseInt(b.pos, 10));
        return { start: Math.min(...ps), end: Math.max(...ps) };
    },

    isBaseLevel() {
        return this.zoomLevel >= MAX_ZOOM;
    },

    winBp() {
        const geneStart = this.geneStartBp;
        const geneEnd = this.geneEndBp;
        if (this.zoomLevel <= 1) return { start: geneStart, end: geneEnd };
        const width = this.locusWindowWidth;
        const c = this.panCenterBp != null ? this.panCenterBp : this.queriedBp;
        let start = c - width / 2;
        if (start < geneStart) start = geneStart;
        if (start + width > geneEnd) start = Math.max(geneStart, geneEnd - width);
        return { start, end: start + width };
    },

    canPan() {
        return this.zoomLevel > 1;
    },
    canPanLeft() {
        return this.canPan && this.winBp.start > this.geneStartBp + 1;
    },
    canPanRight() {
        return this.canPan && this.winBp.end < this.geneEndBp - 1;
    },

    winLabel() {
        const span = this.winBp.end - this.winBp.start;
        if (this.zoomLevel <= 1) return "whole gene";
        if (this.isBaseLevel) return "±25 bp · base level";
        if (span >= 1000) {
            const kb = span / 1000;
            return (Number.isInteger(kb) ? kb.toFixed(0) : kb.toFixed(1)) + " kb window";
        }
        return Math.round(span) + " bp window";
    },

    winExons() {
        const { start, end } = this.winBp;
        const span = (end - start) || 1;
        const queriedBp = this.queriedBp;
        return (this.genomeWindow.exons || []).map(e => {
            const eStart = this.geneStartBp + (parseFloat(e.left) / 100) * this.geneSpanBp;
            const eEnd = eStart + (parseFloat(e.width) / 100) * this.geneSpanBp;
            if (eEnd <= start || eStart >= end) return null;
            const l = Math.max(eStart, start);
            const r = Math.min(eEnd, end);
            const widthPct = ((r - l) / span) * 100;
            return {
                label: e.label,
                left: (((l - start) / span) * 100).toFixed(2) + "%",
                width: widthPct.toFixed(2) + "%",
                widthPct,
                queried: queriedBp >= eStart && queriedBp <= eEnd,
            };
        }).filter(Boolean);
    },

    winMarkers() {
        const { start, end } = this.winBp;
        const span = (end - start) || 1;
        return (this.genomeWindow.markers || []).map(m => {
            const p = parseInt(String(m.variantId).split(":")[1], 10);
            if (isNaN(p) || p < start || p > end) return null;
            return { ...m, pos: p, leftPct: ((p - start) / span) * 100 };
        }).filter(Boolean).sort((a, b) => a.leftPct - b.leftPct);
    },

    locusVariantMarkers() {
        return this.locusDensityColumns.filter(col => col.variantIds && col.variantIds.length);
    },

    locusVariantMarkerItems() {
        const { start, end } = this.winBp;
        const span = (end - start) || 1;
        const rows = (this.variantRows || []).map(row => {
            const pos = this.variantPosition(row.id);
            if (!pos || pos < start || pos > end) return null;
            const count = this.variantCarrierCountMap[row.id] != null
                ? this.variantCarrierCountMap[row.id]
                : row.carrierCount;
            return {
                id: row.id,
                pos,
                count,
                leftPct: ((pos - start) / span) * 100,
                isQueried: row.id === this.queriedVariantId,
                title: `${row.id} · ${count} carriers`,
            };
        }).filter(Boolean).sort((a, b) => a.leftPct - b.leftPct || a.id.localeCompare(b.id));

        const clusters = [];
        rows.forEach(marker => {
            const last = clusters[clusters.length - 1];
            if (last && Math.abs(marker.leftPct - last.center) <= 1.1) {
                last.items.push(marker);
                last.center = last.items.reduce((sum, item) => sum + item.leftPct, 0) / last.items.length;
            } else {
                clusters.push({ center: marker.leftPct, items: [marker] });
            }
        });

        return clusters.flatMap(cluster => {
            const n = cluster.items.length;
            return cluster.items.map((marker, idx) => ({
                ...marker,
                clusterSize: n,
                yIndex: n > 1 ? idx % 4 : 0,
                xNudge: n > 1 ? this.clampMarkerNudge((idx - (n - 1) / 2) * 7, marker.leftPct) : 0,
            }));
        });
    },

    codingTrackContext() {
        const cc = this.queriedVariantCodingContext;
        if (!cc || !cc.bases || !cc.bases.length) return null;
        const { start, end } = this.winBp;
        const positions = cc.bases.map(b => parseInt(b.pos, 10)).filter(p => !isNaN(p));
        if (!positions.length) return null;
        if (Math.max(...positions) < start || Math.min(...positions) > end) return null;
        return cc;
    },

    visibleExonSequenceBases() {
        const { start, end } = this.winBp;
        const winStart = Math.ceil(start);
        const winEnd = Math.floor(end);
        const scaleSpan = Math.max(1, winEnd - winStart + 1);
        const out = [];
        (this.genomeWindow.exons || []).forEach(exon => {
            const seq = String(exon.sequence || "").toUpperCase();
            const exonStart = parseInt(exon.start, 10);
            const exonEnd = parseInt(exon.end, 10);
            if (!seq || isNaN(exonStart) || isNaN(exonEnd)) return;
            const left = Math.max(winStart, exonStart);
            const right = Math.min(winEnd, exonEnd);
            if (right < left) return;
            for (let pos = left; pos <= right; pos++) {
                const idx = pos - exonStart;
                const base = seq[idx];
                if (!base) continue;
                out.push({
                    pos,
                    base,
                    exonLabel: exon.label,
                    leftPct: ((pos - winStart) / scaleSpan) * 100,
                    widthPct: (1 / scaleSpan) * 100,
                    isVariant: pos === this.queriedBp,
                    alt: pos === this.queriedBp ? this.queriedVariantAlleles.alt : null,
                });
            }
        });
        return out.sort((a, b) => a.pos - b.pos);
    },

    geneTrackSequenceMode() {
        if (!this.visibleExonSequenceBases.length) return "";
        if (this.isBaseLevel || this.locusWindowWidth <= 60) return "base";
        return this.locusWindowWidth <= 220 ? "codon" : "";
    },

    codingContextCodons() {
        const cc = this.codingTrackContext || this.queriedVariantCodingContext;
        if (!cc || !cc.codons) return [];
        return cc.codons.map(codon => {
            const rel = Number(codon.rel || 0);
            const label = rel === 0 ? "queried codon" : `codon ${rel > 0 ? "+" : ""}${rel}`;
            return {
                ...codon,
                label,
                aaChange: codon.isQueried && codon.altAa ? `${codon.aa} → ${codon.altAa}` : codon.aa,
                baseChange: codon.isQueried && codon.altBases ? `${codon.bases} → ${codon.altBases}` : codon.bases,
            };
        });
    },

    geneTrackBases() {
        return this.geneTrackSequenceMode === "base" ? this.visibleExonSequenceBases : [];
    },

    geneTrackCodons() {
        if (this.geneTrackSequenceMode !== "codon") return [];
        const basesByPos = {};
        this.visibleExonSequenceBases.forEach(base => { basesByPos[base.pos] = base; });
        const queriedCodon = (this.queriedVariantCodingContext && this.queriedVariantCodingContext.codons || [])
            .find(codon => codon.isQueried) || null;
        const anchor = queriedCodon && parseInt(queriedCodon.genomicStart, 10);
        if (isNaN(anchor)) return [];
        const { start, end } = this.winBp;
        const winStart = Math.ceil(start);
        const winEnd = Math.floor(end);
        const scaleSpan = Math.max(1, winEnd - winStart + 1);
        const first = anchor + Math.floor((winStart - anchor) / 3) * 3;
        const out = [];
        for (let codonStart = first; codonStart <= winEnd; codonStart += 3) {
            const triplet = [0, 1, 2].map(i => basesByPos[codonStart + i]).filter(Boolean);
            if (triplet.length !== 3) continue;
            const bases = triplet.map(b => b.base).join("");
            const isQueried = this.queriedBp >= codonStart && this.queriedBp <= codonStart + 2;
            out.push({
                codonStart,
                bases,
                aa: this.translateCodon(bases),
                leftPct: ((codonStart - winStart) / scaleSpan) * 100,
                widthPct: (3 / scaleSpan) * 100,
                isQueried,
            });
        }
        return out;
    },

    winAxisTicks() {
        const { start, end } = this.winBp;
        const span = end - start;
        const n = 5;
        const out = [];
        for (let i = 0; i < n; i++) {
            const bp = start + (i / (n - 1)) * span;
            if (span >= 3000) {
                const kb = bp / 1000;
                out.push(Math.floor(kb / 1000) + "," + String(Math.round(kb % 1000)).padStart(3, "0") + "k");
            } else {
                out.push(Math.round(bp).toLocaleString());
            }
        }
        return out;
    },

    variantFilterMatches() {
        const matches = this.sampleMatches;
        return (sample) => {
            if (!matches(sample)) return false;
            if (this.carrierScopeFilter === "Affected") return sample.affected === "Yes" || sample.affected === true;
            if (this.carrierScopeFilter === "Proband") return sample.proband === "Proband";
            return true;
        };
    },

    variantCarrierCountMap() {
        const out = {};
        const matches = this.variantFilterMatches;
        (this.variantRows || []).forEach(row => {
            out[row.id] = (row.carrierSamples || []).filter(s => matches(s)).length;
        });
        return out;
    },

    filteredGeneCarrierCount() {
        const seen = new Set();
        const matches = this.variantFilterMatches;
        (this.variantRows || []).forEach(row => {
            (row.carrierSamples || []).forEach(s => {
                if (matches(s)) seen.add(s.id);
            });
        });
        return seen.size;
    },

    genePositionBars() {
        const { start, end } = this.winBp;
        const span = (end - start) || 1;
        const groups = {};
        const markerMap = {};
        (this.genomeWindow.markers || []).forEach(marker => {
            markerMap[marker.variantId] = marker;
        });
        const matches = this.variantFilterMatches;
        (this.variantRows || []).forEach(row => {
            const pos = this.variantPosition(row.id);
            if (!pos || pos < start || pos > end) return;
            const marker = markerMap[row.id] || {};
            const group = groups[pos] || {
                pos,
                variantId: row.id,
                variantIds: [],
                sampleIds: new Set(),
                fallbackCount: 0,
                isQueried: false,
            };
            group.variantIds.push(row.id);
            group.isQueried = group.isQueried || row.id === this.queriedVariantId;
            const samples = row.carrierSamples || [];
            if (samples.length) {
                samples.forEach(sample => {
                    if (matches(sample)) group.sampleIds.add(sample.id);
                });
            } else {
                group.fallbackCount += Number(row.carrierCount || marker.carrierCount || 0);
            }
            if (row.id === this.queriedVariantId) group.variantId = row.id;
            groups[pos] = group;
        });
        return Object.values(groups).sort((a, b) => a.pos - b.pos).map(group => {
            const count = group.sampleIds.size || group.fallbackCount;
            return {
                pos: group.pos,
                variantId: group.variantId,
                variantIds: group.variantIds,
                carrierCount: count,
                count,
                isQueried: group.isQueried,
                leftPct: ((group.pos - start) / span) * 100,
                title: `chr${this.geneInfo.chromosome}:${group.pos.toLocaleString()} · ${count} carriers · ${group.variantIds.length} variant${group.variantIds.length === 1 ? "" : "s"}`,
            };
        }).map(bar => ({
            ...bar,
            heightPx: bar.count > 0 ? Math.max(6, Math.round((bar.count / this.geneDensityMax) * 104)) : 2,
        }));
    },

    geneDensityMax() {
        const matches = this.variantFilterMatches;
        const groups = {};
        (this.variantRows || []).forEach(row => {
            const pos = this.variantPosition(row.id);
            if (!pos) return;
            const group = groups[pos] || { sampleIds: new Set(), fallbackCount: 0 };
            const samples = row.carrierSamples || [];
            if (samples.length) {
                samples.forEach(sample => {
                    if (matches(sample)) group.sampleIds.add(sample.id);
                });
            } else {
                group.fallbackCount += Number(row.carrierCount || 0);
            }
            groups[pos] = group;
        });
        const values = Object.values(groups).map(group => group.sampleIds.size || group.fallbackCount);
        const max = Math.max(1, ...values);
        if (max <= 10) return 10;
        return Math.ceil(max / 10) * 10;
    },

    locusWindowTitle() {
        const start = Math.round(this.winBp.start).toLocaleString();
        const end = Math.round(this.winBp.end).toLocaleString();
        if (this.isBaseLevel) return `chr${this.geneInfo.chromosome}:${start}-${end} (±25bp)`;
        return `chr${this.geneInfo.chromosome}:${start}-${end} (${this.geneInfo.build})`;
    },

    locusMajorTicks() {
        const { start, end } = this.winBp;
        const span = end - start;
        const n = this.isBaseLevel ? 5 : this.isWholeGeneView ? 6 : 5;
        return Array.from({ length: n }, (_, i) => {
            const pos = Math.round(start + (i / (n - 1)) * span);
            const label = span >= 10000
                ? `${(pos / 1000000).toFixed(3)} Mb`
                : pos.toLocaleString();
            return {
                pos,
                leftPct: ((pos - start) / (span || 1)) * 100,
                label,
                edge: i === 0 ? "start" : i === n - 1 ? "end" : "middle",
            };
        });
    },

    locusMinorTicks() {
        if (!this.isBaseLevel) return [];
        const start = Math.ceil(this.winBp.start / 5) * 5;
        const end = Math.floor(this.winBp.end / 5) * 5;
        const out = [];
        for (let pos = start; pos <= end; pos += 5) {
            out.push({
                pos,
                leftPct: ((pos - this.winBp.start) / ((this.winBp.end - this.winBp.start) || 1)) * 100,
                label: String(pos).slice(-3),
            });
        }
        return out;
    },

    queriedGuideLeftPct() {
        const { start, end } = this.winBp;
        return ((this.queriedBp - start) / ((end - start) || 1)) * 100;
    },

    positionCarrierCountMap() {
        const matches = this.variantFilterMatches;
        const groups = {};
        (this.variantRows || []).forEach(row => {
            const pos = this.variantPosition(row.id);
            if (!pos) return;
            const group = groups[pos] || { pos, variantIds: [], sampleIds: new Set(), fallbackCount: 0 };
            group.variantIds.push(row.id);
            const samples = row.carrierSamples || [];
            if (samples.length) {
                samples.forEach(sample => {
                    if (matches(sample)) group.sampleIds.add(sample.id);
                });
            } else {
                group.fallbackCount += Number(row.carrierCount || 0);
            }
            groups[pos] = group;
        });
        const out = {};
        Object.values(groups).forEach(group => {
            out[group.pos] = {
                count: group.sampleIds.size || group.fallbackCount,
                variantIds: group.variantIds,
            };
        });
        return out;
    },

    locusDensityMax() {
        const values = Object.values(this.positionCarrierCountMap).map(item => Number(item.count) || 0);
        const max = Math.max(1, ...values);
        if (max <= 10) return 10;
        return Math.ceil(max / 5) * 5;
    },

    locusDensityAxisTicks() {
        const max = this.locusDensityMax;
        return [max, Math.round(max / 10) * 5 || Math.round(max / 2), 0];
    },

    locusDensityPlotHeightPx() {
        return this.isBaseLevel ? LOCUS_DENSITY_PLOT_PX : 82;
    },

    locusDensityColumns() {
        const { start, end } = this.winBp;
        const span = (end - start) || 1;
        const map = this.positionCarrierCountMap;
        const max = this.locusDensityMax;
        const plotHeight = this.locusDensityPlotHeightPx;
        const maxBarHeight = Math.max(2, plotHeight - 3);
        if (this.isBaseLevel) {
            const cols = [];
            const s = Math.ceil(start);
            const e = Math.floor(end);
            for (let pos = s; pos <= e; pos++) {
                const item = map[pos] || { count: 0, variantIds: [] };
                cols.push({
                    pos,
                    leftPct: ((pos - start) / span) * 100,
                    widthPct: Math.min(1.65, 100 / Math.max(e - s + 1, 1)),
                    count: item.count,
                    variantIds: item.variantIds,
                    isQueried: pos === this.queriedBp,
                    heightPx: item.count > 0 ? Math.min(maxBarHeight, Math.max(7, Math.round((item.count / max) * maxBarHeight))) : 2,
                    title: `chr${this.geneInfo.chromosome}:${pos.toLocaleString()} · ${item.count} carriers`,
                });
            }
            return cols;
        }
        const binCount = this.isWholeGeneView ? 120 : 80;
        const bins = Array.from({ length: binCount }, (_, idx) => ({
            idx,
            start: start + (idx / binCount) * span,
            end: start + ((idx + 1) / binCount) * span,
            sampleIds: new Set(),
            fallbackCount: 0,
            variantIds: [],
            positions: [],
            isQueried: false,
        }));
        const matches = this.variantFilterMatches;
        (this.variantRows || []).forEach(row => {
            const pos = this.variantPosition(row.id);
            if (!pos || pos < start || pos > end) return;
            const idx = Math.max(0, Math.min(binCount - 1, Math.floor(((pos - start) / span) * binCount)));
            const bin = bins[idx];
            bin.variantIds.push(row.id);
            bin.positions.push(pos);
            bin.isQueried = bin.isQueried || row.id === this.queriedVariantId;
            const samples = row.carrierSamples || [];
            if (samples.length) {
                samples.forEach(sample => {
                    if (matches(sample)) bin.sampleIds.add(sample.id);
                });
            } else {
                bin.fallbackCount += Number(row.carrierCount || 0);
            }
        });
        return bins.map(bin => {
            const count = bin.sampleIds.size || bin.fallbackCount;
            const pos = Math.round((bin.start + bin.end) / 2);
            const variantLabel = bin.variantIds.length
                ? ` · ${bin.variantIds.join(", ")}`
                : "";
            return {
                pos,
                leftPct: (((bin.start + bin.end) / 2 - start) / span) * 100,
                widthPct: Math.max(0.3, 92 / binCount),
                count,
                variantIds: bin.variantIds,
                isQueried: bin.isQueried,
                heightPx: count > 0 ? Math.min(maxBarHeight, Math.max(7, Math.round((count / max) * maxBarHeight))) : 2,
                title: `chr${this.geneInfo.chromosome}:${Math.round(bin.start).toLocaleString()}-${Math.round(bin.end).toLocaleString()} · ${count} carriers${variantLabel}`,
            };
        });
    },

    baseContextBases() {
        const cc = this.queriedVariantCodingContext;
        if (!this.isBaseLevel || !cc || !cc.bases) return [];
        const cdnaMatch = String(cc.hgvsc || "").match(/c\.(\d+)/);
        const queryCdna = cdnaMatch ? parseInt(cdnaMatch[1], 10) : null;
        const queryPos = parseInt(cc.variantPos || this.queriedBp, 10);
        const strandMul = this.geneInfo.strand === "-" ? -1 : 1;
        return cc.bases.map(base => {
            const pos = parseInt(base.pos, 10);
            const cLabel = queryCdna != null && !isNaN(pos)
                ? queryCdna + (pos - queryPos) * strandMul
                : String(pos).slice(-3);
            return { ...base, pos, cLabel };
        });
    },

    baseContextGuidePct() {
        const bases = this.baseContextBases;
        if (!bases.length) return 50;
        const idx = bases.findIndex(base => base.isVariant);
        if (idx < 0) return 50;
        return ((idx + 0.5) / bases.length) * 100;
    },

    baseContextCodons() {
        if (!this.isBaseLevel) return [];
        return this.codingContextCodons;
    },

    queriedCodon() {
        return this.baseContextCodons.find(codon => codon.isQueried) || null;
    },

    baseTrackContext() {
        if (!this.isBaseLevel || !this.queriedVariantCodingContext) return null;
        const bases = this.queriedVariantCodingContext.bases || [];
        if (!bases.length) return null;
        const { start, end } = this.winBp;
        const positions = bases.map(b => parseInt(b.pos, 10)).filter(p => !isNaN(p));
        if (!positions.length) return null;
        if (Math.max(...positions) < start || Math.min(...positions) > end) return null;
        return this.queriedVariantCodingContext;
    },

    baseTrackBases() {
        const cc = this.baseTrackContext;
        if (!cc) return [];
        const { start, end } = this.winBp;
        const span = (end - start) || 1;
        const widthPct = Math.max(2.2, Math.min(6, 100 / span));
        return (cc.bases || []).map(base => {
            const pos = parseInt(base.pos, 10);
            if (isNaN(pos) || pos < start || pos > end) return null;
            return {
                ...base,
                pos,
                leftPct: ((pos - start) / span) * 100,
                widthPct,
            };
        }).filter(Boolean);
    },

    baseTrackCodons() {
        const cc = this.baseTrackContext;
        if (!cc) return [];
        const { start, end } = this.winBp;
        const span = (end - start) || 1;
        const meta = {};
        (cc.codons || []).forEach(codon => { meta[codon.codonNum] = codon; });
        const groups = {};
        (cc.bases || []).forEach(base => {
            const pos = parseInt(base.pos, 10);
            if (isNaN(pos) || pos < start || pos > end) return;
            const key = base.codonNum;
            const group = groups[key] || { codonNum: key, positions: [], bases: [] };
            group.positions.push(pos);
            group.bases.push(base.base);
            groups[key] = group;
        });
        return Object.values(groups).map(group => {
            const l = Math.min(...group.positions);
            const r = Math.max(...group.positions) + 1;
            return {
                ...(meta[group.codonNum] || {}),
                codonNum: group.codonNum,
                bases: (meta[group.codonNum] && meta[group.codonNum].bases) || group.bases.join(""),
                leftPct: ((l - start) / span) * 100,
                widthPct: ((r - l) / span) * 100,
            };
        }).sort((a, b) => a.codonNum - b.codonNum);
    },

    // ── gnomAD-style gene model: exons drawn readable, introns compressed ────
    geneModelExons() {
        const exons = this.genomeWindow.exons || [];
        const n = exons.length;
        if (!n) return [];
        const MIN_W = 2.4;   // min display width % so every exon is a readable box
        const GAP = 1.4;     // compressed intron connector width %
        const raws = exons.map((e) => Math.max(parseFloat(e.width) || 0, MIN_W));
        const sumRaw = raws.reduce((a, b) => a + b, 0);
        const totalGap = GAP * (n - 1);
        const scale = (100 - totalGap) / sumRaw;
        // Queried variant genomic fraction (to highlight the exon that contains it).
        const focal = (this.genomeWindow.markers || []).find((m) => m.focal);
        const focalFrac = focal ? parseFloat(focal.left) / 100 : null;
        let x = 0;
        return exons.map((e, i) => {
            const w = raws[i] * scale;
            const left = x;
            x += w + GAP;
            const rl = parseFloat(e.left) / 100;
            const rr = rl + (parseFloat(e.width) || 0) / 100;
            const isFocal = focalFrac != null && focalFrac >= rl - 0.005 && focalFrac <= rr + 0.005;
            return {
                label: e.label,
                left: left.toFixed(2) + "%",
                width: w.toFixed(2) + "%",
                focal: isFocal,
            };
        });
    },

    // ── gene-level phenotype profile: show first 5 categories, hide rest ──────
    phenoCatLimit() {
        return PHENO_CAT_LIMIT;
    },

    visibleGeneLevelPhenoCategories() {
        if (this.showAllPhenoCategories) return this.geneLevelPhenotypeCategories;
        return this.geneLevelPhenotypeCategories.slice(0, PHENO_CAT_LIMIT);
    },

    topHeroPhenotypeCategories() {
        return (this.geneLevelPhenotypeCategories || []).slice(0, 4);
    },

    sortedVariantRows() {
        const rows = [...(this.variantRows || [])];
        if (!this.variantSortKey) return rows;
        const key = this.variantSortKey;
        const dir = this.variantSortDir === "asc" ? 1 : -1;
        return rows.sort((a, b) => {
            const av = this.variantSortValue(a, key);
            const bv = this.variantSortValue(b, key);
            if (av == null && bv == null) return a.id.localeCompare(b.id);
            if (av == null) return 1;
            if (bv == null) return -1;
            if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir || a.id.localeCompare(b.id);
            return String(av).localeCompare(String(bv)) * dir || a.id.localeCompare(b.id);
        });
    },

    visibleVariantRows() {
        return this.sortedVariantRows.slice(0, this.showCountVariants || VARIANT_LIMIT);
    },

    hiddenVariantCount() {
        return Math.max(0, (this.variantRows || []).length - (this.showCountVariants || VARIANT_LIMIT));
    },

    pathwayDetailItems() {
        const pathways = (this.geneInfo.referenceAnnotation || {}).pathways || {};
        if (Array.isArray(pathways.items) && pathways.items.length) {
            return pathways.items.map(item => ({
                source: item.source || this.inferPathwaySource(item.raw || item.name),
                name: item.name || item.raw || "",
            }));
        }
        const names = pathways.allNames || pathways.displayNames || [];
        return names.map(name => ({
            source: this.inferPathwaySource(name),
            name,
        }));
    },

    // ── Most severe observed variant by annotation-only score ────────────────
    topVariant() {
        if (!this.variantRows || !this.variantRows.length) return null;
        let best = null;
        let bestScore = -1;
        for (const row of this.variantRows) {
            const score = this.variantScoreValue(row);
            if (score == null) continue;
            if (score > bestScore) {
                bestScore = score;
                best = {
                    id: row.id,
                    revel: this.variantEvidenceValue(row, "REVEL"),
                    am: this.variantEvidenceValue(row, "AlphaMissense"),
                    loftee: this.variantEvidenceValue(row, "LOFTEE"),
                    topScore: score,
                    scoreSource: this.variantScoreSource(row),
                };
            }
        }
        return best;
    },

};

export const pbGeneMethods = {
    displayMetric(value) {
        return value == null || value === "" ? "Unavailable" : value;
    },

    metricRatio(value) {
        if (this.isUnavailableValue(value)) return "Unavailable";
        const total = Number(this.totalGeneCarriers || 0);
        const count = Number(value);
        return total ? `${count} / ${total} (${Math.round(count / total * 100)}%)` : `${count}`;
    },

    cohortCount(value) {
        const count = Number(value);
        return Number.isFinite(count) && count > 0 ? count.toLocaleString() : "Unavailable";
    },

    cohortRatio(value) {
        const count = Number(value);
        const total = Number((this.crdcEvidence || {}).crdcCohortCount);
        if (!Number.isFinite(count)) return "Unavailable";
        if (!Number.isFinite(total) || total <= 0) return count.toLocaleString();
        return `${count.toLocaleString()} / ${total.toLocaleString()} (${(count / total * 100).toFixed(1)}%)`;
    },

    coGeneItems(value) {
        if (Array.isArray(value)) return value.map(item => String(item).trim()).filter(Boolean);
        if (typeof value !== "string" || !/[,;|]/.test(value)) return [];
        return value.split(/[,;|]/).map(item => item.trim()).filter(Boolean);
    },

    coGenePreview(value) {
        const items = this.coGeneItems(value);
        return items.length ? items.slice(0, 3).join(", ") : this.displayMetric(value);
    },

    coGeneRemaining(value) {
        return this.coGeneItems(value).slice(3);
    },

    isUnavailableValue(value) {
        return value == null || value === "" || String(value).toLowerCase() === "unavailable";
    },

    isMissingMetadataValue(value) {
        if (value == null || value === "") return true;
        const normalized = String(value).trim().toLowerCase();
        return ["unavailable", "unknown", "n/a", "na", "-", "—"].includes(normalized);
    },

    shortPhenotypeCategory(label) {
        const withoutId = String(label || "").replace(/\s*\[[^\]]+\]\s*$/, "").trim();
        const simplified = withoutId
            .replace(/^Abnormality of the\s+/i, "")
            .replace(/^Abnormality of\s+/i, "")
            .replace(/^Abnormal\s+/i, "");
        if (!simplified) return withoutId;
        return simplified.charAt(0).toUpperCase() + simplified.slice(1);
    },

    inferPathwaySource(name) {
        const raw = String(name || "");
        return raw.indexOf("WP_") === 0 || /wikipath/i.test(raw) ? "WikiPathways" : "Reactome";
    },

    clampMarkerNudge(nudgePx, leftPct) {
        const markerHalfWidthPx = 6;
        const maxTrackWidthPx = 980;
        const leftRoomPx = (Math.max(0, leftPct) / 100) * maxTrackWidthPx - markerHalfWidthPx;
        const rightRoomPx = ((100 - Math.min(100, leftPct)) / 100) * maxTrackWidthPx - markerHalfWidthPx;
        return Math.max(-Math.max(leftRoomPx, 0), Math.min(Math.max(rightRoomPx, 0), nudgePx));
    },

    togglePathwayDetails() {
        this.showPathwayDetails = !this.showPathwayDetails;
    },

    isSummaryCardExpanded(key) {
        return !!this.summaryExpandedCards[key];
    },

    toggleSummaryCard(key) {
        this.$set(this.summaryExpandedCards, key, !this.isSummaryCardExpanded(key));
    },

    async runContextAnalysis() {
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
        const significanceThreshold = Number(this.contextSignificanceThreshold);
        const minCarriers = Number(this.contextMinCarriers);
        if (!Number.isFinite(significanceThreshold) || significanceThreshold <= 0 || significanceThreshold > 1) {
            this.contextError = "Threshold must be greater than 0 and no more than 1.";
            return;
        }
        if (!Number.isInteger(minCarriers) || minCarriers < 1) {
            this.contextError = "Minimum carriers must be a whole number of at least 1.";
            return;
        }

        this.contextLoading = true;
        this.contextError = "";
        try {
            const response = LOCAL_CONTEXT_FIXTURE_ENABLED
                ? await fetch("/__pb_gene_context_fixture__")
                : await fetch("/phenotype-analyzer-api/analyze", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        terms: terms.join(","),
                        gene: this.geneInfo.symbol,
                        advanced: {
                            significance_metric: this.contextSignificanceMetric,
                            significance_threshold: significanceThreshold,
                            min_carriers: minCarriers,
                        },
                    }),
                });
            if (!response.ok) throw new Error(`Context API returned ${response.status}.`);
            const payload = await response.json();
            let result = payload;
            let sourceLabel = "Private API";
            if (LOCAL_CONTEXT_FIXTURE_ENABLED) {
                const expectedTerms = Array.isArray(payload.query_hpo) ? payload.query_hpo : [];
                const sameTerms = expectedTerms.length === terms.length && terms.every(term => expectedTerms.includes(term));
                const gene = String((this.geneInfo || {}).symbol || "").toUpperCase();
                if (!sameTerms || !payload.genes || !payload.genes[gene]) {
                    throw new Error(`Local fixture supports only ${expectedTerms.join(", ")} for CEP152 or DMD.`);
                }
                result = payload.genes[gene];
                sourceLabel = "Local validation fixture";
                this.installLocalContextVariantRows(result);
            }
            this.applyVariantContextScores(result);
            const burden = result.gene_burden || result.burden || {};
            this.contextRuns.push({
                id: `${Date.now()}-${this.contextRuns.length}`,
                hpos: terms.join(", "),
                beta: this.contextStatistic(burden.beta != null ? burden.beta : result.beta),
                pValue: this.contextStatistic(
                    burden.p_value != null ? burden.p_value : burden.pValue != null ? burden.pValue : result.p_value
                ),
                fdr: this.contextStatistic(burden.fdr),
                status: burden.status || "unknown",
                nPositiveBurden: burden.n_positive_burden,
                minCarriers: burden.min_carriers,
                nVariantsScored: burden.n_variants_scored,
                nVariantsTotal: burden.n_variants_total,
                interpretationScope: burden.interpretation_scope,
                modelVersion: burden.model_version,
                statusLabel: this.contextBurdenStatusLabel(burden),
                coverageLabel: this.contextBurdenCoverageLabel(burden),
                sourceLabel,
            });
            this.activeContextTerms = terms;
        } catch (error) {
            this.contextError = String(error && error.message ? error.message : error);
        } finally {
            this.contextLoading = false;
        }
    },

    installLocalContextVariantRows(result) {
        if ((this.variantRows || []).length) return;
        const scores = result.variant_match_scores || {};
        this.variantRows = Object.keys(scores).map(variantId => ({
            id: variantId,
            carrierCount: Number(scores[variantId].carrier_count || 0),
            affected: null,
            carrierSamples: [],
            crdcAF: "Unavailable",
            classification: "Unavailable",
            consequence: "Unavailable",
            phenotypeCategories: [],
            variantEvidence: [],
            phenotypeMatchScore: null,
        }));
        this.crdcEvidence = {
            ...(this.crdcEvidence || {}),
            currentGeneCarrierTotal: Number(result.carrier_sample_count || 0),
            variantCount: this.variantRows.length,
        };
    },

    applyVariantContextScores(result) {
        const scores = result && result.variant_match_scores && typeof result.variant_match_scores === "object"
            ? result.variant_match_scores
            : {};
        const scoreByVariant = new Map(
            Object.keys(scores).map(variantId => [String(variantId).toLowerCase(), scores[variantId]])
        );
        (this.variantRows || []).forEach(row => {
            const context = scoreByVariant.get(String(row.id || "").toLowerCase()) || null;
            const score = context && context.match_score != null ? Number(context.match_score) : NaN;
            row.phenotypeMatchScore = Number.isFinite(score) ? score : null;
            row.phenotypeMatchStatus = context && context.status ? context.status : "not_returned";
            row.phenotypeMatchCarrierCount = context && context.carrier_count != null
                ? Number(context.carrier_count)
                : null;
            row.phenotypeMatchScoredCarrierCount = context && context.scored_carrier_count != null
                ? Number(context.scored_carrier_count)
                : null;
        });
    },

    contextBurdenStatusLabel(burden) {
        const status = String(burden.status || "unknown");
        const positive = Number(burden.n_positive_burden);
        const minimum = Number(burden.min_carriers);
        if (status === "ok") {
            return Number.isFinite(positive)
                ? `Calculated · ${positive.toLocaleString()} positive-burden samples`
                : "Calculated";
        }
        if (status === "insufficient_carriers") {
            const support = Number.isFinite(positive) && Number.isFinite(minimum) ? ` · ${positive}/${minimum}` : "";
            return `Insufficient positive-burden samples${support}`;
        }
        const labels = {
            constant_input: "No variable burden signal",
            singular_design: "Singular model design",
            non_converged: "Model did not converge",
            invalid_standard_error: "Invalid standard error",
            zero_residual_scale: "Zero residual scale",
            invalid_data: "Invalid analysis data",
        };
        return labels[status] || `Unavailable · ${status}`;
    },

    contextBurdenCoverageLabel(burden) {
        const scored = Number(burden.n_variants_scored);
        const total = Number(burden.n_variants_total);
        if (!Number.isFinite(scored) || !Number.isFinite(total)) return "Pathogenic Score coverage unavailable";
        if (total === 0) return "No gene variants in this context result";
        const percent = ((scored / total) * 100).toFixed(1);
        const partial = burden.interpretation_scope === "exploratory_scored_variants_only"
            ? " · exploratory scored-variants-only burden"
            : "";
        return `${scored}/${total} variants scored (${percent}%)${partial}`;
    },

    contextStatistic(value) {
        const number = Number(value);
        if (!Number.isFinite(number)) return "—";
        if (number !== 0 && Math.abs(number) < 0.001) return number.toExponential(2);
        return number.toFixed(3);
    },

    async submitGeneSearch() {
        const query = normalizeGeneQuery(this.searchGeneQuery);
        if (!query) return;
        const current = normalizeGeneQuery(this.geneInfo && this.geneInfo.symbol);
        if (query === current) {
            this.searchGeneQuery = query;
            return;
        }
        this.searchGeneLoading = true;
        this.searchGeneError = "";
        try {
            await this.loadLiveGeneData(query, true);
        } catch (error) {
            this.searchGeneError = String(error && error.message ? error.message : error);
        } finally {
            this.searchGeneLoading = false;
        }
    },

    async loadLiveGeneData(queryOverride = null, updateUrl = false) {
        const query = normalizeGeneQuery(queryOverride || this.searchGeneQuery || (this.geneInfo || {}).symbol);
        if (!query) return;
        if (LOCAL_CONTEXT_FIXTURE_ENABLED) {
            if (updateUrl) {
                const url = new URL(window.location.href);
                url.pathname = "/pb_Gene.html";
                url.searchParams.set("query", query);
                window.location.assign(url.toString());
            }
            return;
        }
        this.searchGeneLoading = true;
        this.searchGeneError = "";
        try {
            const geneState = await fetchPbGeneBioIndexState(query);
            const resolvedSymbol = normalizeGeneQuery((geneState.geneInfo || {}).symbol || query);
            const nextState = createPbGeneRuntimeState(geneState, resolvedSymbol, new URLSearchParams());
            Object.keys(nextState).forEach(key => {
                this[key] = nextState[key];
            });
            this.liveDataLoaded = true;
            this.liveDataSource = "private BioIndex";
            if (updateUrl) {
                const url = new URL(window.location.href);
                url.pathname = "/pb_Gene.html";
                url.searchParams.set("query", resolvedSymbol);
                url.searchParams.delete("locus");
                url.searchParams.delete("locusView");
                window.history.pushState({}, "", url.toString());
            }
        } catch (error) {
            this.liveDataLoaded = false;
            this.liveDataSource = "mock fallback";
            this.searchGeneError = String(error && error.message ? error.message : error);
            throw error;
        } finally {
            this.searchGeneLoading = false;
        }
    },

    // ── gene-level tab ────────────────────────────────────────────────────────
    setGeneTab(tab) {
        if (tab === "variant" && !this.expandedVariantId) {
            const first = (this.variantRows || [])[0];
            if (first) this.expandedVariantId = first.id;
        }
        if (tab === "gene") {
            this.expandedVariantId = null;
        }
        this.geneTab = tab;
    },

    // ── variant accordion ─────────────────────────────────────────────────────
    toggleVariant(variantId) {
        if (this.expandedVariantId === variantId) {
            this.expandedVariantId = null;
            this.geneTab = "gene";
            return;
        }
        this.expandedVariantId = variantId;
        this.geneTab = "variant";
        if (!this.activeTabMap[variantId]) {
            this.$set(this.activeTabMap, variantId, "phenotype");
        }
    },

    setTab(variantId, tab) {
        this.$set(this.activeTabMap, variantId, tab);
    },

    activeTab(variantId) {
        return this.activeTabMap[variantId] || "phenotype";
    },

    scrollToVariant(variantId) {
        if (!variantId) return;
        this.geneTab = "variant";
        this.expandedVariantId = variantId;
        if (!this.activeTabMap[variantId]) {
            this.$set(this.activeTabMap, variantId, "phenotype");
        }
        this.$nextTick(() => {
            const el = this.$el.querySelector(`[data-variant-id="${variantId}"]`);
            if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        });
    },

    // ── locus view / navigation ───────────────────────────────────────────────
    variantPosition(variantId) {
        const p = parseInt(String(variantId || "").split(":")[1], 10);
        return isNaN(p) ? null : p;
    },

    translateCodon(codon) {
        const table = {
            TTT: "Phe", TTC: "Phe", TTA: "Leu", TTG: "Leu",
            TCT: "Ser", TCC: "Ser", TCA: "Ser", TCG: "Ser",
            TAT: "Tyr", TAC: "Tyr", TAA: "Stop", TAG: "Stop",
            TGT: "Cys", TGC: "Cys", TGA: "Stop", TGG: "Trp",
            CTT: "Leu", CTC: "Leu", CTA: "Leu", CTG: "Leu",
            CCT: "Pro", CCC: "Pro", CCA: "Pro", CCG: "Pro",
            CAT: "His", CAC: "His", CAA: "Gln", CAG: "Gln",
            CGT: "Arg", CGC: "Arg", CGA: "Arg", CGG: "Arg",
            ATT: "Ile", ATC: "Ile", ATA: "Ile", ATG: "Met",
            ACT: "Thr", ACC: "Thr", ACA: "Thr", ACG: "Thr",
            AAT: "Asn", AAC: "Asn", AAA: "Lys", AAG: "Lys",
            AGT: "Ser", AGC: "Ser", AGA: "Arg", AGG: "Arg",
            GTT: "Val", GTC: "Val", GTA: "Val", GTG: "Val",
            GCT: "Ala", GCC: "Ala", GCA: "Ala", GCG: "Ala",
            GAT: "Asp", GAC: "Asp", GAA: "Glu", GAG: "Glu",
            GGT: "Gly", GGC: "Gly", GGA: "Gly", GGG: "Gly",
        };
        return table[String(codon || "").toUpperCase()] || "";
    },

    setLocusView(view) {
        if (view === "gene") {
            this.zoomLevel = 1;
            this.panCenterBp = null;
            return;
        }
        if (view === "variant") {
            this.zoomLevel = 3;
            if (this.panCenterBp == null) this.panCenterBp = this.queriedBp;
            return;
        }
        if (view === "base") {
            this.zoomLevel = MAX_ZOOM;
            this.panCenterBp = this.queriedBp;
        }
    },

    focusVariantMarker(marker) {
        if (marker && marker.variantId) this.locusVariantId = marker.variantId;
        const pos = marker && (marker.pos || this.variantPosition(marker.variantId));
        if (!pos) return;
        this.panCenterBp = pos;
        this.zoomLevel = MAX_ZOOM;
        if (this.zoomLevel <= 1) this.zoomLevel = 2;
    },

    selectQueriedVariant(variantId, zoomToBase = false) {
        if (!variantId) return;
        this.locusVariantId = variantId;
        const pos = this.variantPosition(variantId);
        if (!pos) return;
        this.panCenterBp = pos;
        if (zoomToBase) this.zoomLevel = MAX_ZOOM;
    },

    startLocusDrag(event) {
        if (!this.canPan) return;
        const rect = event.currentTarget.getBoundingClientRect();
        this.dragState = {
            active: true,
            startX: event.clientX,
            startCenter: this.panCenterBp != null ? this.panCenterBp : this.queriedBp,
            widthPx: rect.width || 1,
            spanBp: this.winBp.end - this.winBp.start,
        };
    },

    moveLocusDrag(event) {
        if (!this.dragState || !this.dragState.active) return;
        const deltaX = event.clientX - this.dragState.startX;
        const deltaBp = -(deltaX / this.dragState.widthPx) * this.dragState.spanBp;
        this.setPanCenter(this.dragState.startCenter + deltaBp);
    },

    endLocusDrag() {
        if (this.dragState) this.dragState = null;
    },

    setPanCenter(center) {
        const geneStart = this.geneStartBp;
        const geneEnd = this.geneEndBp;
        const width = this.locusWindowWidth;
        this.panCenterBp = Math.max(geneStart + width / 2, Math.min(geneEnd - width / 2, center));
    },

    // ── zoom ──────────────────────────────────────────────────────────────────
    zoomIn() {
        if (this.zoomLevel < MAX_ZOOM) {
            if (this.zoomLevel === 1 && this.panCenterBp == null) this.panCenterBp = this.queriedBp;
            this.zoomLevel++;
        }
    },

    zoomOut() {
        if (this.zoomLevel > 1) this.zoomLevel--;
        if (this.zoomLevel <= 1) this.panCenterBp = null;
    },

    panBy(dir) {
        const width = this.locusWindowWidth;
        const cur = this.panCenterBp != null ? this.panCenterBp : this.queriedBp;
        const next = cur + dir * width * 0.5;
        this.setPanCenter(next);
    },
    panLeft() { this.panBy(-1); },
    panRight() { this.panBy(1); },

    // ── carrier table show-more (+5 increments) ───────────────────────────────
    visibleCarrierRows(row) {
        const n = this.showCountCarrierMap[row.id] || CARRIER_LIMIT;
        return row.carrierSamples.slice(0, n);
    },

    showMoreCarriers(variantId, total) {
        const cur = this.showCountCarrierMap[variantId] || CARRIER_LIMIT;
        this.$set(this.showCountCarrierMap, variantId, Math.min(cur + 5, total));
    },

    showMoreGeneCarriers() {
        this.showCountGeneCarriers = Math.min(
            this.showCountGeneCarriers + 5,
            this.sortedGeneCarrierSamples.length
        );
    },

    showLessGeneCarriers() {
        this.showCountGeneCarriers = 5;
    },

    showMoreVariants() {
        this.showCountVariants = Math.min(
            (this.showCountVariants || VARIANT_LIMIT) + VARIANT_LIMIT,
            (this.variantRows || []).length
        );
    },

    // ── expandable phenotype categories ───────────────────────────────────────
    togglePhenoCategory(cat) {
        this.$set(this.expandedPhenoCategories, cat, !this.expandedPhenoCategories[cat]);
    },

    isExpandedPheno(cat) {
        return !!this.expandedPhenoCategories[cat];
    },

    visibleTerms(cat) {
        const showAll = !!this.showAllTermsMap[cat.category];
        return showAll ? cat.terms : cat.terms.slice(0, TERMS_LIMIT);
    },

    toggleShowAllTerms(category) {
        this.$set(this.showAllTermsMap, category, !this.showAllTermsMap[category]);
    },

    termsLimit() {
        return TERMS_LIMIT;
    },

    // ── phenotype category list "show 5, hide rest" ───────────────────────────
    toggleAllPhenoCategories() {
        this.showAllPhenoCategories = !this.showAllPhenoCategories;
    },

    visibleVariantPhenoCategories(row) {
        const cats = row.phenotypeCategories || [];
        if (this.showAllVariantPhenoMap[row.id]) return cats;
        return cats.slice(0, PHENO_CAT_LIMIT);
    },

    toggleVariantPheno(rowId) {
        this.$set(this.showAllVariantPhenoMap, rowId, !this.showAllVariantPhenoMap[rowId]);
    },

    // ── carrier samples sort ──────────────────────────────────────────────────
    sortBy(key) {
        if (this.sortKey === key) {
            this.sortDir = this.sortDir === "asc" ? "desc" : "asc";
        } else {
            this.sortKey = key;
            this.sortDir = "asc";
        }
    },

    sortIndicator(key) {
        if (this.sortKey !== key) return "◇";
        return this.sortDir === "asc" ? "▲" : "▼";
    },

    sortVariantsBy(key) {
        if (this.variantSortKey === key) {
            this.variantSortDir = this.variantSortDir === "asc" ? "desc" : "asc";
        } else {
            this.variantSortKey = key;
            this.variantSortDir = key === "variantScore" || key === "matchScore" ? "desc" : "asc";
        }
    },

    variantSortIndicator(key) {
        if (this.variantSortKey !== key) return "▵";
        return this.variantSortDir === "asc" ? "▲" : "▼";
    },

    variantSortValue(row, key) {
        if (key === "variant") return row.id || "";
        if (key === "carriers") return Number(row.carrierCount || 0);
        if (key === "crdcAF") return this.parseAfValue(this.crdcAF(row));
        if (key === "classification") return `${this.variantClassification(row)} ${row.consequence || ""}`.trim().toLowerCase();
        if (key === "variantScore") return this.variantScoreValue(row);
        if (key === "matchScore") return row.phenotypeMatchScore;
        return null;
    },

    // ── Block 3 evidence helpers ──────────────────────────────────────────────
    variantEvidenceValue(row, label, fallback = "—") {
        const target = String(label || "").toLowerCase();
        const item = (row.variantEvidence || []).find(ev => String(ev.label || "").toLowerCase() === target);
        return item && item.value != null && item.value !== "" ? item.value : fallback;
    },

    variantEvidenceHref(row, label) {
        const target = String(label || "").toLowerCase();
        const item = (row.variantEvidence || []).find(ev => String(ev.label || "").toLowerCase() === target && ev.href);
        return item ? item.href : "";
    },

    crdcAF(row) {
        return row.crdcAF || row.cohortAF || "—";
    },

    parseAfValue(value) {
        const raw = String(value == null ? "" : value).trim();
        if (!raw || raw === "-" || raw === "—") return null;
        const pct = raw.match(/([0-9]+(?:\.[0-9]+)?)\s*%/);
        if (pct) return Number(pct[1]) / 100;
        const numeric = raw.match(/[0-9]+(?:\.[0-9]+)?(?:e[-+]?[0-9]+)?/i);
        if (!numeric) return null;
        const parsed = Number(numeric[0]);
        return isNaN(parsed) ? null : parsed;
    },

    variantAfWarningSources(row) {
        const crdc = this.parseAfValue(this.crdcAF(row));
        const gnomad = this.parseAfValue(row.gnomadAF || this.variantEvidenceValue(row, "gnomAD AF"));
        const sources = [];
        if (crdc != null && crdc >= 0.10) sources.push(`CRDC carrier frequency ${(crdc * 100).toFixed(1)}%`);
        if (gnomad != null && gnomad >= 0.10) sources.push(`gnomAD AF ${(gnomad * 100).toFixed(1)}%`);
        return sources;
    },

    variantHasHighAf(row) {
        return this.variantAfWarningSources(row).length > 0;
    },

    variantAfWarningText(row) {
        const sources = this.variantAfWarningSources(row);
        if (!sources.length) return "";
        return `${sources.join("; ")} is >= 10%. Review this variant because the rare-disease display expects rare gnomAD-filtered calls.`;
    },

    variantClassification(row) {
        return row.classification || row.clinvar || "—";
    },

    variantAffectedCount(row) {
        if (row.affected != null) return row.affected;
        return (row.carrierSamples || []).filter(sample => sample.affected === "Yes" || sample.affected === true).length;
    },

    parseEvidenceNumber(row, label) {
        const raw = this.variantEvidenceValue(row, label);
        const value = parseFloat(String(raw).replace(/,/g, ""));
        return isNaN(value) ? null : value;
    },

    isLofteeHC(row) {
        const raw = String(this.variantEvidenceValue(row, "LOFTEE") || "").trim().toLowerCase();
        return raw === "hc" || raw === "high confidence";
    },

    variantScoreValue(row) {
        if (this.isLofteeHC(row)) return 1;
        const alphaMissense = this.parseEvidenceNumber(row, "AlphaMissense");
        if (alphaMissense != null) return alphaMissense;
        const revel = this.parseEvidenceNumber(row, "REVEL");
        if (revel != null) return revel;
        return null;
    },

    variantScoreSource(row) {
        if (this.isLofteeHC(row)) return "LoFTEE HC";
        if (this.parseEvidenceNumber(row, "AlphaMissense") != null) return "AlphaMissense";
        if (this.parseEvidenceNumber(row, "REVEL") != null) return "REVEL";
        return "unavailable";
    },

    variantScoreDisplay(row) {
        const value = this.variantScoreValue(row);
        return value == null ? "—" : value.toFixed(2);
    },

    variantScoreClass(row) {
        const value = this.variantScoreValue(row);
        return value == null ? "" : this.scoreClass(value);
    },

    variantEvidenceRows(row) {
        return [
            { label: "CRDC carrier frequency", value: this.crdcAF(row) },
            { label: "AlphaMissense", value: this.variantEvidenceValue(row, "AlphaMissense") },
            { label: "REVEL", value: this.variantEvidenceValue(row, "REVEL") },
            { label: "LOFTEE", value: this.variantEvidenceValue(row, "LOFTEE") },
            {
                label: "gnomAD AF",
                value: row.gnomadAF || this.variantEvidenceValue(row, "gnomAD AF"),
                href: this.variantEvidenceHref(row, "gnomAD AF"),
            },
            {
                label: "ClinVar",
                value: this.variantEvidenceValue(row, "ClinVar", "Unavailable"),
                href: this.variantEvidenceHref(row, "ClinVar"),
            },
        ];
    },

    summaryDemoBarWidth(count) {
        const denom = Math.max(this.summaryCarrierTotal || 1, 1);
        return `${Math.min(100, Math.round((count / denom) * 100))}%`;
    },

    // ── styling helpers ───────────────────────────────────────────────────────
    densityBarHeight(count) {
        return count === 0 ? "2px" : `${Math.round((count / this.visibleDensityMax) * 60)}px`;
    },

    densityBarHeightFull(count) {
        return count === 0 ? "2px" : `${Math.round((count / this.densityFullMax) * 60)}px`;
    },

    demoBarWidth(count) {
        return `${Math.round((count / this.demoMax) * 100)}%`;
    },

    pathogenicityClass(clinvar) {
        if (!clinvar) return "";
        const v = clinvar.toLowerCase();
        if (v.startsWith("likely pathogenic")) return "pbg-badge--likely-path";
        if (v.startsWith("pathogenic"))        return "pbg-badge--pathogenic";
        if (v === "vus")                        return "pbg-badge--vus";
        return "";
    },

    consequenceClass(csq) {
        if (!csq) return "";
        if (csq === "stop_gained" || csq === "frameshift") return "pbg-csq--lof";
        if (csq === "missense")                             return "pbg-csq--missense";
        return "";
    },

    scoreColor(score) {
        if (score >= 0.85) return "#1a6434";
        if (score >= 0.70) return "#174a7c";
        return "#526071";
    },

    scoreClass(score) {
        if (!score && score !== 0) return "";
        if (score >= 0.85) return "pbg-ev-score--high";
        if (score >= 0.70) return "pbg-ev-score--mid";
        return "pbg-ev-score--low";
    },
};
