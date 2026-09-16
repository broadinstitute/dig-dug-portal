import dataConvert from "@/utils/dataConvert.js";
import {
    VKS_ASSOCIATION_PROJECT_GWAS_CE,
    VKS_ASSOCIATION_PROJECT_KP,
} from "./variantSifterProjects.js";

export const CREDIBLE_VARIANTS_DATA_CONVERT = [
    { type: "raw", "field name": "Position", "raw field": "position" },
    { type: "raw", "field name": "PPA", "raw field": "posteriorProbability" },
    { type: "raw", "field name": "P-Value", "raw field": "pValue" },
    { type: "raw", "field name": "rsID", "raw field": "dbSNP" },
    { type: "raw", "field name": "chromosome", "raw field": "chromosome" },
    { type: "raw", "field name": "ref", "raw field": "reference" },
    { type: "raw", "field name": "alt", "raw field": "alt" },
    {
        type: "join multi",
        "field name": "Variant ID",
        "fields to join": ["chromosome", "position", "reference", "alt"],
        "join by": [":", "_", "/"],
    },
];

export const CREDIBLE_VARIANTS_TABLE_COLUMNS = [
    "Variant ID",
    "Position",
    "PPA",
    "P-Value",
    "Phenotype",
];

export function formatCredibleVariantRows(rawRows) {
    if (!Array.isArray(rawRows) || !rawRows.length) {
        return [];
    }

    const converted = dataConvert.convertData(CREDIBLE_VARIANTS_DATA_CONVERT, rawRows);

    return converted.map((row, index) => {
        const raw = rawRows[index] || {};
        const formatted = { ...row };

        if (raw.varId) {
            formatted.varId = raw.varId;
        }
        if (raw.credibleSetId) {
            formatted.credibleSetId = raw.credibleSetId;
        }
        if (raw.phenotype) {
            formatted.phenotype = raw.phenotype;
            formatted.Phenotype = raw.phenotype;
        }
        if (formatted.PPA == null && raw.posteriorProbability != null) {
            formatted.PPA = raw.posteriorProbability;
        }

        return formatted;
    });
}

export function normalizeCredibleSetAncestry(ancestry) {
    return ancestry && ancestry !== "Mixed" ? ancestry : "Mixed";
}

export function normalizeCredibleSetProject(project) {
    const value = String(project || "").trim();
    if (
        value === VKS_ASSOCIATION_PROJECT_KP ||
        value === VKS_ASSOCIATION_PROJECT_GWAS_CE
    ) {
        return value;
    }
    return "";
}

/**
 * Truncate a GWAS-CE access token for table / UI display (keep first 10 chars).
 */
export function formatGwasCeTokenDisplay(value, maxLen = 10) {
    const text = String(value || "").trim();
    if (!text) {
        return "";
    }
    if (text.length <= maxLen) {
        return text;
    }
    return `${text.slice(0, maxLen)}...`;
}

function looksLikeGwasCeToken(value) {
    const text = String(value || "").trim();
    return /^[a-f0-9]{40,}$/i.test(text);
}

/** Phenotype cell value for credible-variant tables (never show a full CE token). */
export function formatCredibleVariantPhenotypeDisplay(phenotype, project = "") {
    const text = String(phenotype || "").trim();
    if (!text) {
        return "";
    }
    if (
        normalizeCredibleSetProject(project) === VKS_ASSOCIATION_PROJECT_GWAS_CE ||
        looksLikeGwasCeToken(text)
    ) {
        return formatGwasCeTokenDisplay(text);
    }
    return text;
}

/**
 * Stable key for a selected credible set. Same credibleSetId can exist under
 * Mixed / ancestry-specific lists, across phenotypes, and across KP vs GWAS-CE.
 * Legacy keys are `id::ancestry` (no phenotype); newer keys append `::phenotype`
 * and optionally `::project` (KP | GWAS-CE).
 */
export function makeCredibleSetSelectionKey(
    credibleSetId,
    ancestry = "Mixed",
    phenotype = "",
    project = ""
) {
    if (!credibleSetId) {
        return "";
    }
    const base = `${credibleSetId}::${normalizeCredibleSetAncestry(ancestry)}`;
    const pheno = String(phenotype || "").trim();
    const proj = normalizeCredibleSetProject(project);
    let key = pheno ? `${base}::${pheno}` : base;
    if (proj) {
        key = `${key}::${proj}`;
    }
    return key;
}

export function parseCredibleSetSelectionKey(selectionKey) {
    const raw = String(selectionKey || "");
    const parts = raw.split("::");
    let project = "";
    if (parts.length >= 3) {
        const maybeProject = normalizeCredibleSetProject(parts[parts.length - 1]);
        if (maybeProject) {
            project = maybeProject;
            parts.pop();
        }
    }
    if (parts.length >= 3) {
        return {
            credibleSetId: parts[0],
            ancestry: normalizeCredibleSetAncestry(parts[1]),
            phenotype: parts.slice(2).join("::"),
            project,
        };
    }
    if (parts.length === 2) {
        return {
            credibleSetId: parts[0],
            ancestry: normalizeCredibleSetAncestry(parts[1]),
            phenotype: "",
            project,
        };
    }
    return { credibleSetId: raw, ancestry: "Mixed", phenotype: "", project };
}

function credibleSetProjectSuffix(entry) {
    return normalizeCredibleSetProject(entry?.project);
}

function shouldShowPhenotypeInLabel(entry) {
    const phenotype = String(entry?.phenotype || "").trim();
    if (!phenotype) {
        return false;
    }
    // GWAS-CE stores the access token in phenotype — never show it in UI labels.
    if (credibleSetProjectSuffix(entry) === VKS_ASSOCIATION_PROJECT_GWAS_CE) {
        return false;
    }
    return true;
}

export function credibleSetOptionLabel(entry) {
    if (!entry?.credibleSetId) {
        return "";
    }
    const ancestry =
        entry.ancestry && entry.ancestry !== "Mixed"
            ? `Ancestry: ${entry.ancestry}`
            : null;
    const method = entry.method ? `Method: ${entry.method}` : null;
    const pmid = entry.pmid ? `PMID: ${entry.pmid}` : null;
    const suffix = [ancestry, method, pmid].filter(Boolean).join(", ");
    let label = suffix
        ? `${entry.credibleSetId} (${suffix})`
        : entry.credibleSetId;
    if (shouldShowPhenotypeInLabel(entry)) {
        label = `${label} (${String(entry.phenotype).trim()})`;
    }
    const project = credibleSetProjectSuffix(entry);
    if (project) {
        label = `${label} (${project})`;
    }
    return label;
}

/** Compact label for pills, tooltips, and table columns. */
export function credibleSetShortLabel(entry) {
    if (!entry?.credibleSetId) {
        return "";
    }
    const parts = [entry.credibleSetId];
    if (shouldShowPhenotypeInLabel(entry)) {
        parts.push(String(entry.phenotype).trim());
    }
    if (entry.ancestry && entry.ancestry !== "Mixed") {
        parts.push(entry.ancestry);
    }
    const project = credibleSetProjectSuffix(entry);
    if (project) {
        parts.push(project);
    }
    return parts.join(", ");
}

export function credibleSetColorKey(credibleSetId, phenotype) {
    return `${credibleSetId}, ${phenotype || ""}`.trim();
}
