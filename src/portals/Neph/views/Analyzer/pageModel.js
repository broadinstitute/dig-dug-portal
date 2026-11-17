import { exampleQueries } from "./mockData";
import variantUtils from "@/utils/variantUtils";

const PHENOTYPE_ANALYSIS_URL = "/phenotype-analyzer-api/analyze";
const PHENOTYPE_ANALYSIS_STORAGE_KEY = "crdc_phenotype_analysis_result";
const SAMPLE_PHENOTYPE_URL = "/phenotype-analyzer-api/sample_phenotypes";
const SAMPLE_PHENOTYPE_STORAGE_KEY = "crdc_sample_phenotype_result";

export const searchModes = [
    {
        id: "sample",
        label: "Sample ID",
        placeholder: "BCH-22-76362-01",
        helper: "Find sample phenotype and genotype evidence."
    },
    {
        id: "phenotype",
        label: "Phenotype profile",
        placeholder: "HP:0001250,HP:0000133",
        helper: "Find CRDC samples and references matching HPO terms."
    },
    {
        id: "variant",
        label: "Variant",
        placeholder: "17:43044295:G:A",
        helper: "Find carriers, recurrence, and annotation for a specific variant."
    },
    {
        id: "gene",
        label: "Gene",
        placeholder: "COL4A3",
        helper: "Find all variant carriers and gene-level associations for a gene."
    }
];

export function normalizeTerms(value) {
    return String(value || "")
        .split(",")
        .map(term => term.trim())
        .filter(Boolean)
        .join(",");
}

export function parseVariantGeneQuery(query) {
    let trimmed = String(query || "").trim();

    if (!trimmed) {
        throw new Error("Please enter a variant or gene.");
    }

    let varId = variantUtils.parseVariant(trimmed);
    if (varId) {
        return { type: "variant", query: varId };
    }

    if (/^[A-Za-z][A-Za-z0-9.-]*$/.test(trimmed)) {
        return { type: "gene", gene: trimmed.toUpperCase() };
    }

    throw new Error(
        "Enter a valid gene symbol or variant ID (e.g. COL4A3 or 17:43044295:G:A)."
    );
}

export function buildVariantResultRoute(parsed) {
    if (parsed.type === "gene") {
        return `./generesult.html?query=${encodeURIComponent(parsed.gene)}`;
    }

    return `./variantresult.html?query=${encodeURIComponent(parsed.query)}`;
}

export function buildSearchRoute(mode, query) {
    let safeQuery = encodeURIComponent(String(query || "").trim());

    if (mode === "sample") {
        return `./sampleresult.html?sample_id=${safeQuery}`;
    }
    if (mode === "phenotype") {
        return `./phenotyperesult.html?query=${safeQuery}`;
    }
    return buildVariantResultRoute(parseVariantGeneQuery(query));
}

async function analyzePhenotypeTerms(query) {
    let terms = normalizeTerms(query);

    let response = await fetch(PHENOTYPE_ANALYSIS_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ terms })
    });
    let contentType = response.headers.get("content-type") || "";
    let result = contentType.includes("application/json")
        ? await response.json()
        : await response.text();

    if (!response.ok) {
        throw new Error(
            typeof result === "string"
                ? result
                : `Phenotype analysis failed with status ${response.status}`
        );
    }

    return result;
}

async function fetchSamplePhenotypes(sample_id) {
    let response = await fetch(SAMPLE_PHENOTYPE_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ sample_id })
    });
    let contentType = response.headers.get("content-type") || "";
    let result = contentType.includes("application/json")
        ? await response.json()
        : await response.text();

    if (!response.ok) {
        throw new Error(
            typeof result === "string"
                ? result
                : `Sample phenotype lookup failed with status ${response.status}`
        );
    }

    return result;
}

export const computed = {
    activeModeConfig() {
        return searchModes.find(mode => mode.id === this.searchMode);
    },
    contextStatusLabel() {
        return this.activeContext.length > 0 ? "Edit Context" : "Set Context";
    },
    contextStatusText() {
        if (this.activeContext.length === 0) {
            return "No context";
        }
        return `Context active: ${this.activeContext.join(", ")}`;
    }
};

export const methods = {
    setExample() {
        this.query = exampleQueries[this.searchMode];
    },
    applyContext() {
        this.activeContext = normalizeTerms(this.contextInput).split(",").filter(Boolean);
    },
    clearContext() {
        this.contextInput = "";
        this.activeContext = [];
    },
    async submitSearch() {
        if (this.searchMode === "phenotype" || this.searchMode === "sample") {
            this.searchLoading = true;
            this.searchError = null;

            try {
                let result;
                let storageKey;
                let finalQuery;

                if (this.searchMode === "phenotype") {
                    result = await analyzePhenotypeTerms(this.query);
                    storageKey = PHENOTYPE_ANALYSIS_STORAGE_KEY;
                    finalQuery = normalizeTerms(this.query);
                } else {
                    result = await fetchSamplePhenotypes(this.query);
                    storageKey = SAMPLE_PHENOTYPE_STORAGE_KEY;
                    finalQuery = this.query;
                }

                sessionStorage.setItem(
                    storageKey,
                    JSON.stringify({
                        query: finalQuery,
                        result
                    })
                );
                window.location.href = buildSearchRoute(this.searchMode, finalQuery);
            } catch (error) {
                this.searchError = error.message || "Search request failed";
            } finally {
                this.searchLoading = false;
            }
            return;
        }

        if (this.searchMode === "variant") {
            this.searchLoading = true;
            this.searchError = null;

            try {
                let trimmed = String(this.query || "").trim();
                if (!trimmed) throw new Error("Please enter a variant ID.");
                let varId = variantUtils.parseVariant(trimmed);
                if (!varId) throw new Error("Enter a valid variant ID (e.g. 17:43044295:G:A).");
                window.location.href = `./variantresult.html?query=${encodeURIComponent(varId)}`;
            } catch (error) {
                this.searchError = error.message || "Search request failed";
            } finally {
                this.searchLoading = false;
            }
            return;
        }

        if (this.searchMode === "gene") {
            this.searchLoading = true;
            this.searchError = null;

            try {
                let trimmed = String(this.query || "").trim();
                if (!trimmed) throw new Error("Please enter a gene symbol.");
                if (!/^[A-Za-z][A-Za-z0-9.-]*$/.test(trimmed)) {
                    throw new Error("Enter a valid gene symbol (e.g. COL4A3).");
                }
                window.location.href = `./generesult.html?query=${encodeURIComponent(trimmed.toUpperCase())}`;
            } catch (error) {
                this.searchError = error.message || "Search request failed";
            } finally {
                this.searchLoading = false;
            }
            return;
        }

        window.location.href = buildSearchRoute(this.searchMode, this.query);
    }
};
