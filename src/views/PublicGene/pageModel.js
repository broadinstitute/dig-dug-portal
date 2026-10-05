import { resolveHpoTerms, contextApiError } from "../PbGene/hpoContextSearch";
import { publicGeneReference } from "./publicReference";
import { displayGeneHpoAssociations } from "../PbGene/geneHpoDisplay";
import { VARIANT_PAGE_SIZE, visiblePageNumbers } from "../PbGene/variantTableNavigation";

export function createPublicGeneState() {
    const params = new URLSearchParams(window.location.search);
    const query = String(params.get("query") || "HBB").trim().toUpperCase();
    const reference = publicGeneReference(query);

    return {
        geneInfo: reference.geneInfo,
        genomeWindow: reference.genomeWindow,
        referenceAvailable: reference.known,
        searchGeneQuery: query,
        searchGeneError: reference.known ? "" : `No public gene reference found for ${query}.`,
        publicContextInput: "",
        publicContextTerms: [],
        publicContextError: "",
        publicContextLoading: false,
        publicGeneAssociation: null,
        publicVariantAssociations: {},
        publicVariantMatchScores: {},
        genePhenotypeAssociations: [],
        associationsLoading: reference.known,
        associationsError: "",
        summaryPages: { phenotype: 1, genotype: 1, project: 1 },
        summarySort: { phenotype: { key: "pValue", dir: "asc" }, genotype: { key: "count", dir: "desc" }, project: { key: "project", dir: "asc" } },
        distinctCarriers: null,
        carrierDensity: [],
        carrierScopeFilter: "All",
        ageFilter: "All ages",
        projectFilter: "All projects",
        sexFilter: "All",
        locusFilterResult: null,
        locusFilterProgress: "",
        locusFilterError: "",
        locusFilterSequence: 0,
        variantRows: [],
        variantsLoading: reference.known,
        variantsError: "",
        expandedVariantId: null,
        variantPage: 1,
        variantSearchStart: null,
        variantSearchResultId: null,
        variantPositionQuery: "",
        variantPositionError: "",
        variantPageJump: "",
        variantPageJumpError: "",
        variantSortKey: "position",
        variantSortAsc: true,
        geneCarrierSummary: null,
        variantCarrierSummaries: {},
        carrierSummaryPending: {},
        carrierSummaryProgress: {},
        carrierSummaryErrors: {},
    };
}

export function variantScore(row) {
    if (String(row.loftee || "").trim().toUpperCase() === "HC") return 1;
    const alphaMissense = Number(row.alphaMissense);
    return row.alphaMissense !== "" && Number.isFinite(alphaMissense) && alphaMissense >= 0 && alphaMissense <= 1
        ? alphaMissense
        : null;
}

export function sortedPublicVariants() {
    const key = this.variantSortKey;
    const direction = this.variantSortAsc ? 1 : -1;
    return [...this.variantRows].sort((a, b) => {
        if (key === "position") return (a.position - b.position) * direction || a.id.localeCompare(b.id);
        if (key === "consequence" || key === "clinvar") {
            return String(a[key] || "").localeCompare(String(b[key] || "")) * direction || a.position - b.position;
        }
        const value = row => {
            if (key === "score") return variantScore(row);
            if (key === "carriers") return Number(row.carrierCount);
            if (key === "crdcAF") return row.crdcAF == null ? null : Number(row.crdcAF);
            if (key === "matchScore") return row.phenotypeMatchScore;
            if (key === "effectScore") return row.variantEffectBeta;
            if (key === "pValue") return row.variantEffectPValue;
            return null;
        };
        const av = value(a);
        const bv = value(b);
        const missingA = av == null || !Number.isFinite(av);
        const missingB = bv == null || !Number.isFinite(bv);
        if (missingA || missingB) return missingA === missingB ? a.position - b.position : missingA ? 1 : -1;
        return (av - bv) * direction || a.position - b.position;
    });
}

export function publicVariantPageCount() {
    return Math.ceil(this.variantRows.length / VARIANT_PAGE_SIZE);
}

export function publicVariantPageNumbers() {
    return visiblePageNumbers(this.variantPage, this.variantPageCount);
}

export async function loadPublicGeneAssociations() {
    if (!this.referenceAvailable) return;
    this.associationsLoading = true;
    this.associationsError = "";
    try {
        const response = await fetch(`/__gene_hpo_associations__?gene=${encodeURIComponent(this.geneInfo.symbol)}`);
        if (!response.ok) throw new Error("Association source unavailable");
        const payload = await response.json();
        if (!Array.isArray(payload.associations)) throw new Error("Unexpected association response");
        this.genePhenotypeAssociations = displayGeneHpoAssociations(payload.associations);
    } catch (error) {
        this.associationsError = "Precomputed gene–HPO results could not be loaded from this server.";
    } finally {
        this.associationsLoading = false;
    }
}

export async function loadPublicVariants() {
    if (!this.referenceAvailable) return;
    this.variantsLoading = true;
    this.variantsError = "";
    try {
        const exons = this.genomeWindow.exons;
        const start = exons.length ? Math.min(...exons.map(row => row.start)) : null;
        const end = exons.length ? Math.max(...exons.map(row => row.end)) : null;
        const bounds = start != null && end != null ? `&start=${start}&end=${end}` : "";
        const response = await fetch(`/__public_gene_variants__?gene=${encodeURIComponent(this.geneInfo.symbol)}${bounds}`);
        if (!response.ok) throw new Error("Projection unavailable");
        const payload = await response.json();
        if (!Array.isArray(payload.variants)) throw new Error("Unexpected projection");
        this.variantRows = payload.variants
            .filter(row => Number.isSafeInteger(row.carrierCount) && row.carrierCount > 0)
            .map(row => publicAssociationRow(row, this.publicVariantAssociations, this.publicVariantMatchScores));
        this.distinctCarriers = Number.isSafeInteger(payload.distinctCarriers) ? payload.distinctCarriers : null;
        this.carrierDensity = Array.isArray(payload.carrierDensity) ? payload.carrierDensity : [];
        this.loadPublicCarrierSummary();
    } catch (error) {
        this.variantsError = "Public variant annotations could not be loaded from this server.";
    } finally {
        this.variantsLoading = false;
    }
}

export async function loadPublicCarrierSummary(variantId = "") {
    const gene = String((this.geneInfo || {}).symbol || "").trim().toUpperCase();
    if (!gene) return;
    const key = variantId || "__gene__";
    const existing = variantId ? this.variantCarrierSummaries[variantId] : this.geneCarrierSummary;
    if (this.carrierSummaryPending[key] || (existing && existing.status === "ready" &&
        (!variantId || existing.matchedMetadataCount >= existing.carrierTotal))) return;
    this.$set(this.carrierSummaryPending, key, true);
    this.$set(this.carrierSummaryErrors, key, "");
    try {
        const params = new URLSearchParams({ gene });
        if (variantId) params.set("variant", variantId);
        let incompleteVariantRefreshes = 0;
        for (let attempt = 0; attempt < 2400; attempt += 1) {
            const requestParams = new URLSearchParams(params);
            if (incompleteVariantRefreshes) requestParams.set("refresh", String(incompleteVariantRefreshes));
            const response = await fetch(`/__gene_carrier_summary__?${requestParams.toString()}`);
            if (!response.ok) throw new Error(`Carrier metadata returned ${response.status}.`);
            const result = await response.json();
            if (String((this.geneInfo || {}).symbol || "").toUpperCase() !== gene) return;
            if (result.status === "error") throw new Error(result.error || "Carrier metadata unavailable.");
            if (result.status === "ready") {
                if (variantId) this.$set(this.variantCarrierSummaries, variantId, result);
                else this.geneCarrierSummary = result;
                if (variantId && incompleteVariantRefreshes < 2 && result.matchedMetadataCount < result.carrierTotal) {
                    incompleteVariantRefreshes += 1;
                    await new Promise(resolve => setTimeout(resolve, 250));
                    continue;
                }
                return;
            }
            if (result.geneCarrierDemographics && Array.isArray(result.coCarrierGenes)) {
                if (variantId) this.$set(this.variantCarrierSummaries, variantId, result);
                else this.geneCarrierSummary = result;
            }
            this.$set(this.carrierSummaryProgress, key, result.total
                ? `Calculating ${variantId ? "variant" : "gene"} carrier statistics · ${result.completed}/${result.total} checked (partial)`
                : "Loading carrier metadata…");
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
        throw new Error("Carrier metadata is still loading. Refresh to check again.");
    } catch (error) {
        if (String((this.geneInfo || {}).symbol || "").toUpperCase() === gene) {
            this.$set(this.carrierSummaryErrors, key, String(error && error.message ? error.message : error));
        }
    } finally {
        this.$set(this.carrierSummaryPending, key, false);
    }
}

export function submitPublicGeneSearch() {
    const query = String(this.searchGeneQuery || "").trim().toUpperCase();
    if (!query) {
        this.searchGeneError = "Enter a gene symbol.";
        return;
    }
    window.location.assign(`public_Gene.html?query=${encodeURIComponent(query)}`);
}

function publicAssociationRow(row, associations, matchScores = {}) {
    const association = associations[String(row.id || "").toLowerCase()] || null;
    const match = matchScores[String(row.id || "").toLowerCase()] || null;
    const beta = association && association.status === "ok" ? Number(association.beta) : NaN;
    const pValue = association && association.status === "ok" ? Number(association.p_value) : NaN;
    const matchScore = match && match.match_score != null ? Number(match.match_score) : NaN;
    return {
        ...row,
        phenotypeMatchScore: Number.isFinite(matchScore) ? matchScore : null,
        variantEffectBeta: Number.isFinite(beta) ? beta : null,
        variantEffectPValue: Number.isFinite(pValue) && pValue >= 0 && pValue <= 1 ? pValue : null,
    };
}

export async function selectPublicHpoContext() {
    let terms;
    try { terms = resolveHpoTerms(this.publicContextInput); }
    catch (error) { this.publicContextError = error.message; return; }
    this.publicContextTerms = terms;
    this.publicContextInput = terms.join(", ");
    this.publicContextError = "";
    this.publicContextLoading = true;
    this.publicGeneAssociation = null;
    this.publicVariantAssociations = {};
    this.publicVariantMatchScores = {};
    this.variantRows = this.variantRows.map(row => publicAssociationRow(row, {}));
    try {
        const response = await fetch("/phenotype-analyzer-api/public-analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ gene: this.geneInfo.symbol, terms }),
        });
        if (!response.ok) throw new Error(await contextApiError(response));
        const result = await response.json();
        this.publicGeneAssociation = result.gene_association || { status: "unavailable" };
        this.publicVariantAssociations = Object.fromEntries(
            Object.entries(result.variant_associations || {}).map(([id, value]) => [id.toLowerCase(), value])
        );
        this.publicVariantMatchScores = Object.fromEntries(
            Object.entries(result.variant_match_scores || {}).map(([id, value]) => [id.toLowerCase(), value])
        );
        this.variantRows = this.variantRows.map(row => publicAssociationRow(row, this.publicVariantAssociations, this.publicVariantMatchScores));
    } catch (error) {
        this.publicContextError = String(error && error.message ? error.message : error);
    } finally {
        this.publicContextLoading = false;
    }
}
