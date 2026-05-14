// This file contains shared hierarchy and detail-panel derivation helpers so
// page-level navigation logic is easier to reason about and easier to reuse.

export function buildFactorContextKey({ dataset, cellType, model }) {
    return [dataset, cellType, model].join("::");
}

export function groupSearchEdgesByHierarchy(edges = []) {
    const hierarchyMap = new Map();

    edges.forEach((edge) => {
        const { dataset, cellType, model, factor } = edge.factorContext || {};

        if (!dataset || !cellType || !model || !factor) {
            return;
        }

        if (!hierarchyMap.has(dataset)) {
            hierarchyMap.set(dataset, new Map());
        }

        const datasetMap = hierarchyMap.get(dataset);

        if (!datasetMap.has(cellType)) {
            datasetMap.set(cellType, new Map());
        }

        const cellTypeMap = datasetMap.get(cellType);

        if (!cellTypeMap.has(model)) {
            cellTypeMap.set(model, []);
        }

        cellTypeMap.get(model).push({
            factor,
            score: edge.value,
            scoreField: edge.value_field,
            edge
        });
    });

    return Array.from(hierarchyMap.entries()).map(([dataset, cellTypesMap]) => ({
        dataset,
        cellTypes: Array.from(cellTypesMap.entries()).map(([cellType, modelsMap]) => ({
            cellType,
            models: Array.from(modelsMap.entries()).map(([model, factors]) => ({
                model,
                factors
            }))
        }))
    }));
}

export function buildSearchHierarchy(searchPayload) {
    return groupSearchEdgesByHierarchy(searchPayload?.data || []);
}

export function getSearchRootDisplayValue({ selectedSearchValue, searchTerm }) {
    return selectedSearchValue || searchTerm || "";
}

export function isHierarchyItemActive({ activeHierarchyPath, selectedSearchValue, searchTerm }, level, value, context = {}) {
    if (level === "searchRoot") {
        return Boolean(getSearchRootDisplayValue({ selectedSearchValue, searchTerm }));
    }

    if (level === "dataset") {
        return activeHierarchyPath.dataset === value;
    }

    if (level === "cellType") {
        return activeHierarchyPath.dataset === context.dataset
            && activeHierarchyPath.cellType === value;
    }

    if (level === "model") {
        return activeHierarchyPath.dataset === context.dataset
            && activeHierarchyPath.cellType === context.cellType
            && activeHierarchyPath.model === value;
    }

    return false;
}

export function resolveDatasetMetadataId(dataset) {
    if (dataset === "scRNA") {
        return "islet_of_Langerhans_scRNA_v3-3";
    }

    return dataset;
}

export function getDatasetMetadata(ligerDatasetMetadata, dataset) {
    return ligerDatasetMetadata[resolveDatasetMetadataId(dataset)] || null;
}

export function getDatasetDisplayLabel(ligerDatasetMetadata, dataset) {
    return getDatasetMetadata(ligerDatasetMetadata, dataset)?.tissue || dataset;
}

export function getDatasetDisplaySubLabel(dataset) {
    return dataset;
}

export function getActiveDatasetGroup(searchHierarchy = [], activeHierarchyPath) {
    return searchHierarchy.find(
        (datasetGroup) => datasetGroup.dataset === activeHierarchyPath.dataset
    ) || null;
}

export function getActiveCellTypeGroup(searchHierarchy = [], activeHierarchyPath) {
    const datasetGroup = getActiveDatasetGroup(searchHierarchy, activeHierarchyPath);

    if (!datasetGroup) {
        return null;
    }

    return (datasetGroup.cellTypes || []).find(
        (cellTypeGroup) => cellTypeGroup.cellType === activeHierarchyPath.cellType
    ) || null;
}

export function getActiveModelGroup(searchHierarchy = [], activeHierarchyPath) {
    const cellTypeGroup = getActiveCellTypeGroup(searchHierarchy, activeHierarchyPath);

    if (!cellTypeGroup) {
        return null;
    }

    return (cellTypeGroup.models || []).find(
        (modelGroup) => modelGroup.model === activeHierarchyPath.model
    ) || null;
}

export function getAllHierarchyModelContexts(searchHierarchy = []) {
    return searchHierarchy.flatMap((datasetGroup) =>
        (datasetGroup.cellTypes || []).flatMap((cellTypeGroup) =>
            (cellTypeGroup.models || []).map((modelGroup) => ({
                dataset: datasetGroup.dataset,
                cellType: cellTypeGroup.cellType,
                model: modelGroup.model
            }))
        )
    );
}

export function isSharedSearchRootActive({ selectedSearchValue, searchTerm }) {
    return Boolean(getSearchRootDisplayValue({ selectedSearchValue, searchTerm }));
}

export function buildVisibleDetailPanels({
    searchType,
    browserMode,
    activeSharedProgramContextKey,
    activeHierarchyPath,
    factorModalData,
    ligerDatasetMetadata,
    selectedSearchValue,
    searchTerm
}) {
    const panels = [];
    const searchValue = getSearchRootDisplayValue({ selectedSearchValue, searchTerm });

    if (searchValue) {
        panels.push({
            type: "searchRoot",
            key: `${searchType}::${searchValue}`,
            badgeClass: "is-search",
            badgeLabel: searchType === "gene" ? "Gene" : "Trait",
            value: searchValue,
            placeholder: `${searchType === "gene" ? "Gene" : "Trait"} detail placeholder`
        });
    }

    if (browserMode === "sharedPrograms" && !activeSharedProgramContextKey) {
        return panels;
    }

    if (activeHierarchyPath.dataset) {
        const datasetMetadata = getDatasetMetadata(ligerDatasetMetadata, activeHierarchyPath.dataset);
        panels.push({
            type: "dataset",
            key: activeHierarchyPath.dataset,
            badgeClass: "is-dataset",
            badgeLabel: "Tissue",
            value: getDatasetDisplayLabel(ligerDatasetMetadata, activeHierarchyPath.dataset),
            placeholder: "Dataset detail placeholder",
            metadata: datasetMetadata
        });
    }

    if (activeHierarchyPath.cellType) {
        panels.push({
            type: "cellType",
            key: [activeHierarchyPath.dataset, activeHierarchyPath.cellType].join("::"),
            badgeClass: "is-cell-type",
            badgeLabel: "Cell Type",
            value: activeHierarchyPath.cellType,
            placeholder: "Cell type detail placeholder"
        });
    }

    if (activeHierarchyPath.model) {
        panels.push({
            type: "model",
            key: [activeHierarchyPath.dataset, activeHierarchyPath.cellType, activeHierarchyPath.model].join("::"),
            badgeClass: "is-model",
            badgeLabel: "Model",
            value: activeHierarchyPath.model,
            placeholder: "Model detail placeholder"
        });
    }

    if (factorModalData) {
        panels.push({
            type: "geneProgram",
            key: factorModalData.factorContextKey,
            badgeClass: "is-factor",
            badgeLabel: "Gene Program",
            value: factorModalData.summary?.label || factorModalData.factor
        });
    }

    return panels;
}

export function buildSharedProgramGroups(searchHierarchy = [], helpers) {
    const { getFactorSummary, getDatasetDisplayLabel, getDatasetDisplaySubLabel } = helpers;
    const groupedPrograms = new Map();

    searchHierarchy.forEach((datasetGroup) => {
        (datasetGroup.cellTypes || []).forEach((cellTypeGroup) => {
            (cellTypeGroup.models || []).forEach((modelGroup) => {
                (modelGroup.factors || []).forEach((factorGroup) => {
                    const summary = getFactorSummary(
                        datasetGroup.dataset,
                        cellTypeGroup.cellType,
                        modelGroup.model,
                        factorGroup.factor
                    );
                    const label = summary?.label || factorGroup.factor;
                    const groupKey = (label || factorGroup.factor || "").trim();

                    if (!groupKey) {
                        return;
                    }

                    if (!groupedPrograms.has(groupKey)) {
                        groupedPrograms.set(groupKey, {
                            key: groupKey,
                            label,
                            contexts: [],
                            distinctDatasets: new Set(),
                            distinctCellTypes: new Set(),
                            distinctModels: new Set()
                        });
                    }

                    const group = groupedPrograms.get(groupKey);
                    const contextKey = [
                        datasetGroup.dataset,
                        cellTypeGroup.cellType,
                        modelGroup.model,
                        factorGroup.factor
                    ].join("::");

                    group.contexts.push({
                        key: contextKey,
                        dataset: datasetGroup.dataset,
                        cellType: cellTypeGroup.cellType,
                        model: modelGroup.model,
                        factor: factorGroup.factor,
                        score: factorGroup.score,
                        scoreField: factorGroup.scoreField,
                        summary,
                        label,
                        datasetLabel: getDatasetDisplayLabel(datasetGroup.dataset),
                        datasetSubLabel: getDatasetDisplaySubLabel(datasetGroup.dataset)
                    });
                    group.distinctDatasets.add(datasetGroup.dataset);
                    group.distinctCellTypes.add(`${datasetGroup.dataset}::${cellTypeGroup.cellType}`);
                    group.distinctModels.add(`${datasetGroup.dataset}::${cellTypeGroup.cellType}::${modelGroup.model}`);
                });
            });
        });
    });

    const sharedGroups = Array.from(groupedPrograms.values())
        .map((group) => ({
            key: group.key,
            label: group.label,
            contexts: group.contexts.sort((contextA, contextB) => {
                const scoreA = Number(contextA.score);
                const scoreB = Number(contextB.score);
                const normalizedScoreA = Number.isFinite(scoreA) ? scoreA : Number.NEGATIVE_INFINITY;
                const normalizedScoreB = Number.isFinite(scoreB) ? scoreB : Number.NEGATIVE_INFINITY;

                return normalizedScoreB - normalizedScoreA;
            }),
            contextCount: group.contexts.length,
            datasetCount: group.distinctDatasets.size,
            cellTypeCount: group.distinctCellTypes.size,
            modelCount: group.distinctModels.size
        }))
        .sort((groupA, groupB) => {
            if (groupB.contextCount !== groupA.contextCount) {
                return groupB.contextCount - groupA.contextCount;
            }

            const bestScoreA = Number(groupA.contexts[0]?.score);
            const bestScoreB = Number(groupB.contexts[0]?.score);
            const normalizedScoreA = Number.isFinite(bestScoreA) ? bestScoreA : Number.NEGATIVE_INFINITY;
            const normalizedScoreB = Number.isFinite(bestScoreB) ? bestScoreB : Number.NEGATIVE_INFINITY;

            if (normalizedScoreB !== normalizedScoreA) {
                return normalizedScoreB - normalizedScoreA;
            }

            return groupA.label.localeCompare(groupB.label);
        });

    const recurringGroups = sharedGroups.filter((group) => group.contextCount > 1);
    return recurringGroups.length ? recurringGroups : sharedGroups;
}
