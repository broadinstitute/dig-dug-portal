/**
 * Gene-set cart (KC): factor table row builders and per-row gene / gene-set accessors.
 * Slimmed from multiQueriesReveal gene-set entry path (no selection / heatmap filters).
 */

import { resolveCfdeFactorClusterDisplayLabel } from "@/utils/cfdeUtils";

function normalizeGeneSymbolToken(raw) {
    const token = String(raw || "")
        .trim()
        .replace(/\(.*/g, "")
        .replace(/[^A-Za-z0-9-]/g, "")
        .toUpperCase();
    return token && token.length >= 2 ? token : "";
}

function normalizeGeneList(list) {
    const input = Array.isArray(list) ? list : [];
    const out = [];
    const seen = new Set();
    input.forEach((entry) => {
        const text = String(entry || "").trim();
        if (!text) return;
        text
            .split(/[\/,;]+/)
            .map((part) => normalizeGeneSymbolToken(part))
            .filter(Boolean)
            .forEach((g) => {
                if (seen.has(g)) return;
                seen.add(g);
                out.push(g);
            });
    });
    return out;
}

function getRowKey(item) {
    if (!item || item.phenotype == null || item.factor == null) return "";
    const direction = item.fetched_direction || item.fetchDirection || item.route_category || "";
    return `${item.phenotype}|${item.factor}|${direction}`;
}

function getFactorForPhenotypeRow(factorData, phenotype, factor, fetchedDirection = null) {
    const data = factorData || {};
    const pData = data[phenotype];
    if (!pData) return null;
    const factors = pData.factors || [];
    const allFactors = pData.allFactors || [];
    const direction =
        fetchedDirection != null && String(fetchedDirection).trim() !== ""
            ? String(fetchedDirection).trim()
            : "";
    const matches = (x) => {
        if (!(x.factor === factor || String(x.factor) === String(factor))) return false;
        if (!direction) return true;
        const rowDirection = x.fetched_direction || x.route_category || "";
        return String(rowDirection).trim() === direction;
    };
    return factors.find(matches) || allFactors.find(matches) || null;
}

function buildFactorDataTableRows(factorData, expandedFactorRowKeys = {}) {
    const rows = [];
    const data = factorData || {};
    Object.keys(data).forEach((phenotype) => {
        const allFactors = data[phenotype].allFactors || data[phenotype].factors || [];
        allFactors.forEach((f) => {
            const topGeneSetsStr = f.top_gene_sets;
            const topGeneSetProgramsStr = f.gene_set_program;
            const topGeneSets =
                typeof topGeneSetsStr === "string" && topGeneSetsStr
                    ? topGeneSetsStr
                          .split(";")
                          .map((s) => s.trim())
                          .filter(Boolean)
                    : [];
            const topGeneSetPrograms =
                typeof topGeneSetProgramsStr === "string" && topGeneSetProgramsStr
                    ? topGeneSetProgramsStr
                          .split("|")
                          .map((s) => s.trim())
                          .filter(Boolean)
                    : [];
            const fetchedDirection =
                f.fetched_direction != null && String(f.fetched_direction).trim() !== ""
                    ? String(f.fetched_direction).trim()
                    : f.route_category != null
                      ? String(f.route_category).trim()
                      : "";
            const rowKey = `${phenotype}|${f.factor}|${fetchedDirection}`;
            rows.push({
                phenotype,
                factor: f.factor,
                factorLabel: f.label != null ? f.label : f.factor,
                top_gene_sets: topGeneSets.join(", "),
                top_gene_set_programs: topGeneSetPrograms,
                fetched_direction: fetchedDirection,
                fetchDirection: fetchedDirection,
                _rowKey: rowKey,
                _showDetails: !!expandedFactorRowKeys[rowKey],
            });
        });
    });
    rows.sort((a, b) => (a.phenotype || "").localeCompare(b.phenotype || ""));
    return rows;
}

function getFactorClusterDisplay(row) {
    if (!row) return "";
    const key =
        row.factorLabel != null && String(row.factorLabel).trim() !== ""
            ? String(row.factorLabel).trim()
            : row.factor != null
              ? String(row.factor).trim()
              : "";
    return resolveCfdeFactorClusterDisplayLabel(key);
}

function getGenesetForFactor(factorData, phenotype, factor, fetchedDirection = null) {
    const f = getFactorForPhenotypeRow(factorData, phenotype, factor, fetchedDirection);
    if (!f) return [];
    const topGeneSetsStr = f.top_gene_sets;
    const topGeneSetProgramsStr = f.gene_set_program;
    const topGeneSets =
        typeof topGeneSetsStr === "string" && topGeneSetsStr
            ? topGeneSetsStr
                  .split(";")
                  .map((s) => s.trim())
                  .filter(Boolean)
            : [];
    const topGeneSetPrograms =
        typeof topGeneSetProgramsStr === "string" && topGeneSetProgramsStr
            ? topGeneSetProgramsStr
                  .split("|")
                  .map((s) => s.trim())
                  .filter(Boolean)
            : [];
    const geneSetsMeta = f.geneSets || {};
    const result = topGeneSets.map((g, i) => {
        const meta = geneSetsMeta[g] || {};
        const rawFv = meta.factor_value;
        const fvNum =
            rawFv != null && rawFv !== "" && !isNaN(Number(rawFv)) ? Number(rawFv) : null;
        const pRaw = meta.p_value;
        const pNum =
            pRaw != null && pRaw !== "" && !isNaN(Number(pRaw)) ? Number(pRaw) : null;
        return {
            geneset: g,
            program: topGeneSetPrograms[i],
            factor_value: fvNum != null ? Number(fvNum.toFixed(3)) : null,
            factor_value_display: fvNum != null ? fvNum.toFixed(3) : "—",
            p_value: pNum,
            p_value_display:
                pNum == null
                    ? "—"
                    : pNum > 0 && pNum < 0.001
                      ? pNum.toExponential(2)
                      : pNum.toFixed(3),
            _sortAbs: fvNum != null ? Math.abs(fvNum) : -1,
        };
    });
    result.sort((a, b) => b._sortAbs - a._sortAbs);
    return result.map(({ _sortAbs, ...row }) => row);
}

function getGenesForFactor(factorData, phenotype, factor, fetchedDirection = null) {
    const data = factorData || {};
    const pData = data[phenotype];
    if (!pData) return [];
    const f = getFactorForPhenotypeRow(factorData, phenotype, factor, fetchedDirection);
    if (!f || !f.genes) return [];
    const globalGenes = pData.genes || {};
    const rows = Object.keys(f.genes)
        .map((geneName) => {
            const rel = f.genes[geneName];
            const global = globalGenes[geneName] || {};
            const rawVal = rel.factor_value ?? rel.factorRelevance;
            const fvNum =
                rawVal != null && rawVal !== "" && !isNaN(Number(rawVal)) ? Number(rawVal) : null;
            const factorValueDisplay = fvNum != null ? fvNum.toFixed(3) : "—";
            const pinned = rel.includedFromRequest === true;
            const geneScoreRaw =
                rel.gene_score != null && !isNaN(Number(rel.gene_score))
                    ? Number(rel.gene_score)
                    : global.gene_score != null && !isNaN(Number(global.gene_score))
                      ? Number(global.gene_score)
                      : null;
            return {
                gene: geneName,
                userRequested: pinned ? "Yes" : "—",
                inSearch: pinned,
                factor_value: fvNum != null ? Number(fvNum.toFixed(3)) : null,
                factor_value_display: factorValueDisplay,
                gene_score_display: geneScoreRaw != null ? Number(geneScoreRaw).toFixed(3) : "—",
                _sortAbs: fvNum != null ? Math.abs(fvNum) : 0,
            };
        })
        .filter(Boolean);
    rows.sort((a, b) => b._sortAbs - a._sortAbs);
    return rows.map(({ _sortAbs, ...row }) => row);
}

function getGeneSetCountForRow(factorData, row) {
    if (!row) return 0;
    return getGenesetForFactor(factorData, row.phenotype, row.factor, row.fetched_direction).length;
}

function getGeneSearchContextCountDisplay(factorData, row) {
    const genes = getGenesForFactor(
        factorData,
        row && row.phenotype,
        row && row.factor,
        row && row.fetched_direction
    );
    let search = 0;
    let context = 0;
    genes.forEach((g) => {
        if (g && g.userRequested === "Yes") search += 1;
        else context += 1;
    });
    return `${search}:${context}`;
}

export {
    buildFactorDataTableRows,
    getFactorClusterDisplay,
    getFactorForPhenotypeRow,
    getGeneSearchContextCountDisplay,
    getGeneSetCountForRow,
    getGenesForFactor,
    getGenesetForFactor,
    getRowKey,
    normalizeGeneList,
    normalizeGeneSymbolToken,
};
