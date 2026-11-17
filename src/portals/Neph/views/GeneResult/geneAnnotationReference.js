import {
    PB_GENE_ANNOTATION_COLUMNS,
    PB_GENE_ANNOTATION_REFERENCE,
} from "./geneAnnotationReference.generated";

const PATHWAY_DISPLAY_LIMIT = 3;

export function getGeneReferenceAnnotation(geneSymbol) {
    const key = String(geneSymbol || "").trim().toUpperCase();
    const values = PB_GENE_ANNOTATION_REFERENCE[key];
    if (!values) return null;

    const row = {};
    PB_GENE_ANNOTATION_COLUMNS.forEach((column, index) => {
        row[column] = values[index];
    });

    const pathwayNames = splitValues(row.pathway_names);
    const pathwayItems = pathwayNames.map(raw => ({
        source: pathwaySource(raw),
        name: cleanPathwayName(raw),
        raw,
    }));

    return {
        ddg2p: {
            support: asBoolean(row.has_ddg2p_support),
            confidenceCategories: displayValue(row.ddg2p_confidence_categories),
            allelicRequirements: displayValue(row.ddg2p_allelic_requirements),
            diseaseNames: displayValue(row.ddg2p_disease_names),
            source: "DDG2P",
        },
        panelapp: {
            greenSupport: asBoolean(row.has_panelapp_green_support),
            panelCount: numericValue(row.green_panel_count, 0),
            modesOfInheritance: displayValue(row.modes_of_inheritance),
            panelNames: displayValue(row.panel_names),
            source: "PanelApp",
        },
        pathways: {
            count: numericValue(row.pathway_count, pathwayItems.length),
            reactomeCount: numericValue(row.reactome_count, 0),
            wikipathwaysCount: numericValue(row.wikipathways_count, 0),
            displayNames: pathwayItems.slice(0, PATHWAY_DISPLAY_LIMIT).map(item => item.name),
            allNames: pathwayItems.map(item => item.name),
            items: pathwayItems,
            moreCount: Math.max(0, pathwayItems.length - PATHWAY_DISPLAY_LIMIT),
            source: "Reactome / WikiPathways",
        },
    };
}

function splitValues(value) {
    return String(value || "")
        .split(";")
        .map(item => item.trim())
        .filter(Boolean);
}

function displayValue(value) {
    const text = String(value || "").trim();
    return text || null;
}

function numericValue(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function asBoolean(value) {
    return String(value || "").trim().toLowerCase() === "true";
}

function pathwaySource(raw) {
    return String(raw || "").startsWith("WP_") ? "WikiPathways" : "Reactome";
}

function cleanPathwayName(raw) {
    const stripped = String(raw || "")
        .replace(/^REACTOME_/, "")
        .replace(/^WP_/, "")
        .replace(/_/g, " ")
        .trim();

    return stripped
        .toLowerCase()
        .replace(/\b[a-z]/g, letter => letter.toUpperCase());
}
