/**
 * HTTP calls backing the Query Helper modal for Multi Query REVEAL: gene autocomplete,
 * per-phenotype factor lookup, and CFDE C2M2 gene-set provenance. Sibling to
 * `revealMqHybridSearchApi.js` (same `vm.fetchWithTimeout` HTTP convention where applicable).
 */

import uiUtils from "@/utils/uiUtils";

/** Gene autocomplete for the Query Helper's "genes of interest" input, race-guarded by a request sequence. */
async function fetchGeneSuggestionsForQueryHelper(vm) {
    const q = String(vm.queryHelperGeneInput || "").trim();
    if (q.length < 2 || q.includes(",")) {
        vm.queryHelperGeneSuggestions = [];
        return;
    }
    const seq = vm.queryHelperGeneLookupSeq + 1;
    vm.queryHelperGeneLookupSeq = seq;
    vm.queryHelperGeneLookupLoading = true;
    try {
        const url = `${uiUtils.biDomain()}/api/bio/match/gene?q=${encodeURIComponent(q)}&limit=15`;
        const resp = await vm.fetchWithTimeout(url, { method: "GET" }, vm.hybridSearchTimeoutMs);
        const json = await resp.json().catch(() => ({}));
        if (seq !== vm.queryHelperGeneLookupSeq) return;
        if (!resp.ok || !Array.isArray(json && json.data)) {
            vm.queryHelperGeneSuggestions = [];
            return;
        }
        const selected = new Set((vm.queryHelperGenesOfInterest || []).map((g) => String(g).toUpperCase()));
        const out = [];
        const seen = new Set();
        (json.data || []).forEach((entry) => {
            const label = vm.extractGeneSuggestionLabel(entry);
            if (!label) return;
            const canon = label.toUpperCase();
            if (selected.has(canon) || seen.has(canon)) return;
            seen.add(canon);
            out.push(canon);
        });
        vm.queryHelperGeneSuggestions = out.slice(0, 15);
    } catch (err) {
        if (seq === vm.queryHelperGeneLookupSeq) {
            vm.queryHelperGeneSuggestions = [];
        }
    } finally {
        if (seq === vm.queryHelperGeneLookupSeq) {
            vm.queryHelperGeneLookupLoading = false;
        }
    }
}

/** Per-selected-phenotype factor-cluster rows for the Query Helper's Data step. */
async function fetchQueryHelperFactorRows(vm) {
    const phenotypeTerms = (vm.queryHelperSelectedPhenotypes || []).map((x) => String(x.value)).filter(Boolean);
    vm.queryHelperFactorError = "";
    vm.queryHelperFactorRows = [];
    vm.queryHelperFactorSelection = {};
    vm.queryHelperNoFactorPhenotypeLabels = [];
    vm.queryHelperFactorPage = 1;
    if (!phenotypeTerms.length) return;
    vm.queryHelperLoadingFactors = true;
    try {
        const selectedById = {};
        (vm.queryHelperSelectedPhenotypes || []).forEach((p) => {
            if (!p || p.value == null) return;
            selectedById[String(p.value)] = String(p.label || p.value);
        });
        const template = String(vm.queryHelperPigeanFactorUrlTemplate || "").trim();
        if (!template || !template.includes("$phenotype")) {
            throw new Error("Query helper factor API template is missing or invalid.");
        }
        const perPhenotypeResults = await Promise.all(
            phenotypeTerms.map(async (phenotypeId) => {
                const url = template.replace("$phenotype", encodeURIComponent(String(phenotypeId)));
                const resp = await vm.fetchWithTimeout(url, { method: "GET" }, vm.hybridSearchTimeoutMs);
                const json = await resp.json().catch(() => ({}));
                if (!resp.ok) {
                    const detail = vm.hybridSearchErrorMessage(resp.status, json);
                    throw new Error(`Factor API failed for ${phenotypeId}: ${resp.status} ${detail}`);
                }
                const factors = Array.isArray(json && json.data) ? json.data : [];
                return { phenotypeId: String(phenotypeId), factors };
            })
        );
        const rows = [];
        const seen = new Set();
        perPhenotypeResults.forEach(({ phenotypeId, factors }) => {
            factors.forEach((item) => {
                const factorId =
                    item && item.factor != null && String(item.factor).trim() !== ""
                        ? String(item.factor).trim()
                        : item && item.cluster != null && String(item.cluster).trim() !== ""
                            ? String(item.cluster).trim()
                            : "";
                if (!factorId) return;
                const factorLabelRaw =
                    item && item.label != null && String(item.label).trim() !== ""
                        ? String(item.label).trim()
                        : factorId;
                const key = `${phenotypeId}|${factorId}`;
                if (seen.has(key)) return;
                seen.add(key);
                rows.push({
                    key,
                    phenotypeId: String(phenotypeId),
                    phenotypeLabel: selectedById[String(phenotypeId)] || vm.getPhenotypeDisplay(phenotypeId),
                    factorId,
                    factorLabelRaw,
                    factorLabel: factorLabelRaw || factorId,
                    topGeneSetsRaw:
                        item && item.top_gene_sets != null && String(item.top_gene_sets).trim() !== ""
                            ? String(item.top_gene_sets).trim()
                            : "",
                });
            });
        });
        vm.queryHelperFactorRows = rows;
        const prevSelection = vm.queryHelperFactorSelection || {};
        const selection = {};
        rows.forEach((row) => {
            selection[row.key] = Object.prototype.hasOwnProperty.call(prevSelection, row.key)
                ? !!prevSelection[row.key]
                : true;
        });
        vm.queryHelperFactorSelection = selection;
        vm.queryHelperNoFactorPhenotypeLabels = phenotypeTerms
            .filter((pid) => !rows.some((r) => String(r.phenotypeId) === String(pid)))
            .map((pid) => selectedById[String(pid)] || vm.getPhenotypeDisplay(pid));
        vm.applyQueryHelperClusterFilterSelection();
        if (!vm.queryHelperHardConstraintEligible) {
            vm.queryHelperHardConstraintEnabled = false;
        }
        if (!rows.length) {
            vm.queryHelperFactorError = "";
        }
    } catch (err) {
        vm.queryHelperFactorError =
            err && err.message ? String(err.message) : "Failed to load factors for selected phenotypes.";
    } finally {
        vm.queryHelperLoadingFactors = false;
    }
}

/**
 * CFDE C2M2 provenance API. Returns json.data (array) or null.
 * @see https://cfde-dev.hugeampkpnbi.org/api/bio/query/c2m2-provenance
 */
async function fetchC2m2Provenance(geneset) {
    const q = encodeURIComponent(String(geneset || "").trim());
    if (!q) return null;
    const url = `https://cfde-dev.hugeampkpnbi.org/api/bio/query/c2m2-provenance?q=${q}`;
    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const json = await res.json();
        return Array.isArray(json.data) ? json.data : null;
    } catch (e) {
        return null;
    }
}

export { fetchC2m2Provenance, fetchGeneSuggestionsForQueryHelper, fetchQueryHelperFactorRows };
