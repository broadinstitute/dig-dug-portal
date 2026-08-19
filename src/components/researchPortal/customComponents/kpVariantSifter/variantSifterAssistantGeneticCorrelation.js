/**
 * Genetic correlation (LDSC) helpers for Variant Sifter Assist.
 * Phenotype-page CorrelationTable highlights p < 1e-5 as high significance.
 */

import { query } from "@/utils/bioIndexUtils";

export const VKS_GENETIC_CORRELATION_P_MAX = 1e-5;

export function resolveGeneticCorrelationQuery(phenotypeName, ancestry) {
    const phenotype = String(phenotypeName || "").trim();
    if (!phenotype) {
        return null;
    }
    if (!ancestry || ancestry === "Mixed") {
        return phenotype;
    }
    return `${phenotype},${ancestry}`;
}

export async function fetchGeneticCorrelation(phenotypeName, ancestry, host) {
    const q = resolveGeneticCorrelationQuery(phenotypeName, ancestry);
    if (!q) {
        return { q: null, rows: [] };
    }
    const data = await query("genetic-correlation", q, { host });
    return {
        q,
        rows: Array.isArray(data) ? data : [],
    };
}

export function filterSignificantGeneticCorrelations(
    rows = [],
    { pMax = VKS_GENETIC_CORRELATION_P_MAX, phenotypeMap = null } = {}
) {
    const map = phenotypeMap && typeof phenotypeMap === "object" ? phenotypeMap : null;
    return (rows || [])
        .filter((row) => {
            const pValue = Number(row?.pValue);
            if (!Number.isFinite(pValue) || !(pValue < pMax)) {
                return false;
            }
            const other = String(row?.other_phenotype || "").trim();
            if (!other) {
                return false;
            }
            if (map && !map[other]) {
                return false;
            }
            return true;
        })
        .sort((a, b) => Number(a.pValue) - Number(b.pValue));
}

export function buildGeneticCorrelationRunningMessage() {
    return "Finding genetically correlated phenotypes…";
}

export function buildGeneticCorrelationIntroMessage(session, ancestries = []) {
    const phenotype =
        session?.phenotype?.description ||
        session?.phenotype?.name ||
        "this phenotype";
    const ancestryLabel = (ancestries || []).join(", ") || "Mixed";
    return [
        `Loading genetic correlations (LDSC) for ${phenotype}`,
        `across ${ancestryLabel}.`,
        `Keeping phenotypes with p < ${VKS_GENETIC_CORRELATION_P_MAX}.`,
    ].join(" ");
}

export function formatGeneticCorrelationPValue(pValue) {
    const value = Number(pValue);
    if (!Number.isFinite(value)) {
        return "—";
    }
    if (value === 0) {
        return "0";
    }
    return value.toExponential(2);
}

export function formatGeneticCorrelationRg(rg) {
    const value = Number(rg);
    if (!Number.isFinite(value)) {
        return "—";
    }
    return value.toFixed(4);
}

export function buildGeneticCorrelationPhenotypeGroups({
    ancestry,
    rows = [],
    phenotypeMap = {},
} = {}) {
    const phenotypes = (rows || []).map((row) => {
        const name = String(row.other_phenotype || "").trim();
        const mapped = phenotypeMap?.[name];
        return {
            name,
            description: mapped?.description || name,
            pValue: row.pValue,
            rg: row.rg,
            ancestry: ancestry || "Mixed",
        };
    });
    return {
        ancestry: ancestry || "Mixed",
        phenotypes,
    };
}

export function buildGeneticCorrelationResultEntry({
    session,
    groups = [],
} = {}) {
    const phenotype =
        session?.phenotype?.description ||
        session?.phenotype?.name ||
        "this phenotype";
    const total = (groups || []).reduce(
        (sum, group) => sum + (group.phenotypes?.length || 0),
        0
    );
    const text = total
        ? [
              `Found ${total} genetically correlated phenotype${total === 1 ? "" : "s"}`,
              `for ${phenotype} (p < ${VKS_GENETIC_CORRELATION_P_MAX}), grouped by ancestry.`,
              "Click a phenotype to open Variant Sifter in a new tab with the same locus search.",
          ].join(" ")
        : [
              `No genetically correlated phenotypes (p < ${VKS_GENETIC_CORRELATION_P_MAX})`,
              `were found for ${phenotype} across the loaded ancestries.`,
          ].join(" ");

    return {
        text,
        phenotypeGroups: groups,
    };
}
