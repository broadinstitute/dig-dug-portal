import { canonicalGeneNodeId, normalizeGeneSymbol } from "./geneNodeIds.js";

function normalizeLabel(label) {
    return String(label || "")
        .trim()
        .toLowerCase();
}

function truncate(text, limit = 14) {
    const s = String(text == null ? "" : text);
    return s.length > limit ? `${s.slice(0, limit - 2)}…` : s;
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

export function formatSharedGeneMappingLabel(mappedCount, totalCount) {
    const mapped = Number(mappedCount) || 0;
    const total = Number(totalCount) || 0;
    if (!total) return "";
    const geneWord = total === 1 ? "gene" : "genes";
    return `${mapped} of ${total} associated ${geneWord} mapped with shared genes`;
}

export function formatSharedGeneMappingBubble(mappedCount, totalCount) {
    const mapped = Number(mappedCount) || 0;
    const total = Number(totalCount) || 0;
    if (!total) return "";
    return `${mapped} / ${total}`;
}

/**
 * Build a compact linkage graph for the biomarker associated-gene hover popup.
 *
 * Path: biomarker -(role)-> gene(s) <-> disease(s) <-> mechanism
 * Gene-disease links only when the gene is shared for that disease.
 * Disease-mechanism links only for diseases with at least one mapped gene on this row.
 * All row diseases are shown; unmapped diseases have no gene or mechanism edges.
 *
 * @param {{
 *   biomarkerId: string,
 *   biomarkerLabel: string,
 *   factorId: string,
 *   factorLabel: string,
 *   associatedGenes: string[],
 *   diseaseLabels: string[],
 *   roles: string[],
 *   diseaseByLabel: Map<string, { iri: string, label: string }>,
 *   diseaseGenes: Record<string, Array<{ gene?: string, geneLabel?: string }>>,
 *   geneDisplayLabel?: (entry: { gene?: string, geneLabel?: string }) => string,
 * }} input
 * @returns {{ nodes: Array, edges: Array, mapping: object }}
 */
export function buildBiomarkerLinkageGraph(input) {
    const biomarkerId = String(input.biomarkerId || "biomarker");
    const factorId = String(input.factorId || "factor");
    const factorLabel = String(input.factorLabel || "Mechanism");
    const biomarkerLabel = String(input.biomarkerLabel || "Biomarker");
    const associatedGenes = (input.associatedGenes || [])
        .map((sym) => String(sym || "").trim())
        .filter(Boolean);
    const diseaseLabels = input.diseaseLabels || [];
    const roles = (input.roles || []).filter(Boolean);
    const roleEdgeLabel = roles.length ? roles.join(", ") : "role";
    const diseaseByLabel = input.diseaseByLabel || new Map();
    const diseaseGenes = input.diseaseGenes || {};
    const geneDisplayLabel = input.geneDisplayLabel;
    const mapping = getRowSharedGeneMapping(input);

    const nodes = [
        {
            id: biomarkerId,
            label: truncate(biomarkerLabel, 18),
            fullLabel: biomarkerLabel,
            type: "Biomarker",
        },
        {
            id: factorId,
            label: truncate(factorLabel, 18),
            fullLabel: factorLabel,
            type: "Factor",
        },
    ];
    const edges = [];
    const nodeIds = new Set(nodes.map((n) => n.id));

    associatedGenes.forEach((symbol) => {
        const geneId = canonicalGeneNodeId(symbol);
        if (!geneId || nodeIds.has(geneId)) return;
        const symKey = normalizeGeneSymbol(symbol);
        nodeIds.add(geneId);
        nodes.push({
            id: geneId,
            label: symbol,
            fullLabel: symbol,
            type: "Gene",
            level: 1,
            metadata: {
                isShared: mapping.mappedSymbolSet.has(symKey),
            },
        });
        edges.push({
            id: `bio-role-${geneId}`,
            source: biomarkerId,
            target: geneId,
            label: roleEdgeLabel,
        });
    });

    const diseaseEntries = resolveDiseaseEntries(diseaseLabels, diseaseByLabel);
    diseaseEntries.forEach((entry) => {
        if (!nodeIds.has(entry.iri)) {
            nodeIds.add(entry.iri);
            nodes.push({
                id: entry.iri,
                label: truncate(entry.label, 18),
                fullLabel: entry.label,
                type: "Phenotype",
                level: 2,
            });
        }
    });

    const diseasesLinkedToMappedGenes = new Set();

    associatedGenes.forEach((symbol) => {
        const symKey = normalizeGeneSymbol(symbol);
        const geneId = canonicalGeneNodeId(symbol);
        if (!geneId || !symKey || !mapping.mappedSymbolSet.has(symKey)) return;

        diseaseEntries.forEach((disease) => {
            const shared = sharedGeneSymbolSet(disease.iri, diseaseGenes, geneDisplayLabel);
            if (!shared.has(symKey)) return;
            diseasesLinkedToMappedGenes.add(disease.iri);
            edges.push({
                id: `gene-disease-${geneId}-${disease.iri}`,
                source: geneId,
                target: disease.iri,
                bidirectional: true,
            });
        });
    });

    diseasesLinkedToMappedGenes.forEach((diseaseIri) => {
        edges.push({
            id: `disease-mechanism-${diseaseIri}`,
            source: diseaseIri,
            target: factorId,
            bidirectional: true,
        });
    });

    nodes.forEach((node) => {
        if (node.level != null) return;
        if (node.type === "Biomarker") node.level = 0;
        else if (node.type === "Gene") node.level = 1;
        else if (node.type === "Factor") node.level = 3;
    });

    return { nodes, edges, mapping };
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
