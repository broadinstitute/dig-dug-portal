import { normalizeGeneSymbol } from "./geneNodeIds.js";

function normalizeLabel(label) {
    return String(label || "")
        .trim()
        .toLowerCase();
}

function geneSymbolFromSharedEntry(entry, geneDisplayLabel) {
    if (typeof geneDisplayLabel === "function") {
        return normalizeGeneSymbol(geneDisplayLabel(entry));
    }
    const label = entry && entry.geneLabel != null ? String(entry.geneLabel).trim() : "";
    if (label) return normalizeGeneSymbol(label);
    const iri = entry && entry.gene != null ? String(entry.gene).trim() : "";
    if (!iri) return "";
    const parts = iri.split(/[/#]/);
    const last = parts[parts.length - 1] || iri;
    return normalizeGeneSymbol(
        last.replace(/^NCBIGene:/i, "").replace(/^HGNC:/i, "") || last
    );
}

function sharedGeneSymbolSet(diseaseIri, diseaseGenes, geneDisplayLabel) {
    const set = new Set();
    (diseaseGenes[diseaseIri] || []).forEach((entry) => {
        const sym = geneSymbolFromSharedEntry(entry, geneDisplayLabel);
        if (sym) set.add(sym);
    });
    return set;
}

function resolveDiseaseEntries(diseaseLabels, diseaseByLabel) {
    const diseaseEntries = [];
    (diseaseLabels || []).forEach((label) => {
        const entry = diseaseByLabel.get(normalizeLabel(label));
        if (entry && entry.iri) diseaseEntries.push(entry);
    });
    return diseaseEntries;
}

/**
 * Which associated genes overlap mechanism shared genes for this biomarker row?
 *
 * @returns {{
 *   associatedGenes: string[],
 *   mappedGenes: string[],
 *   mappedCount: number,
 *   totalCount: number,
 *   mappedSymbolSet: Set<string>,
 * }}
 */
export function getRowSharedGeneMapping(input) {
    const associatedGenes = (input.associatedGenes || [])
        .map((sym) => String(sym || "").trim())
        .filter(Boolean);
    const diseaseByLabel = input.diseaseByLabel || new Map();
    const diseaseGenes = input.diseaseGenes || {};
    const geneDisplayLabel = input.geneDisplayLabel;
    const diseaseEntries = resolveDiseaseEntries(input.diseaseLabels || [], diseaseByLabel);

    const mappedSymbolSet = new Set();
    associatedGenes.forEach((symbol) => {
        const symKey = normalizeGeneSymbol(symbol);
        if (!symKey) return;
        const isMapped = diseaseEntries.some((disease) =>
            sharedGeneSymbolSet(disease.iri, diseaseGenes, geneDisplayLabel).has(symKey)
        );
        if (isMapped) mappedSymbolSet.add(symKey);
    });

    const mappedGenes = associatedGenes.filter((symbol) =>
        mappedSymbolSet.has(normalizeGeneSymbol(symbol))
    );

    return {
        associatedGenes,
        mappedGenes,
        mappedCount: mappedGenes.length,
        totalCount: associatedGenes.length,
        mappedSymbolSet,
    };
}

export function formatSharedGeneMappingBubble(mappedCount, totalCount) {
    const mapped = Number(mappedCount) || 0;
    const total = Number(totalCount) || 0;
    if (!total) return "";
    return `${mapped} / ${total}`;
}

export function buildDiseaseLabelIndex(associatedDiseases) {
    const map = new Map();
    (associatedDiseases || []).forEach((row) => {
        const label = String(row.diseaseLabel || "").trim();
        const iri = String(row.disease || "").trim();
        if (!label || !iri) return;
        map.set(normalizeLabel(label), { iri, label });
    });
    return map;
}
