/** Filter definitions for Variant Sifter associations (GEM package). */
export const ASSOCIATIONS_FILTERS = [
    {
        field: "Variant ID",
        label: "Variant ID",
        type: "search",
        "label in bubble": "true",
    },
    {
        field: "rsID",
        label: "rsID",
        type: "search",
        "label in bubble": "true",
    },
    {
        field: "P-Value",
        label: "P-Value (<=)",
        type: "search lower than",
        "label in bubble": "true",
    },
    {
        field: "LDS",
        label: "LD score (>=)",
        type: "search greater than",
        "label in bubble": "true",
    },
    {
        field: "EAF",
        label: "EAF (>=)",
        type: "search greater than",
        "label in bubble": "true",
    },
    {
        field: "Beta",
        label: "Beta (>=)",
        type: "search greater than",
        "label in bubble": "true",
    },
    {
        field: "Z Score",
        label: "Z Score (>=)",
        type: "search greater than",
        "label in bubble": "true",
    },
    {
        field: "Consequence",
        label: "Consequence",
        type: "checkbox",
        "label in bubble": "true",
    },
    {
        field: "Phenotype",
        label: "Phenotype",
        type: "checkbox",
        "label in bubble": "true",
    },
    {
        field: "__overlappingVariants",
        label: "Show only overlapping variants",
        type: "boolean",
        "label in bubble": "true",
    },
    {
        field: "Ancestry",
        label: "Ancestry",
        type: "checkbox",
        "label in bubble": "true",
    },
    {
        field: "Project",
        label: "Project",
        type: "checkbox",
        "label in bubble": "true",
    },
];

/** Column layout for the Associations filters panel. */
export const ASSOCIATIONS_FILTER_GROUPS = [
    {
        id: "variants",
        label: "Variants",
        fields: ["Variant ID", "rsID", "Consequence"],
    },
    {
        id: "scores",
        label: "Scores",
        fields: ["P-Value", "LDS", "EAF", "Beta", "Z Score"],
    },
    {
        id: "phenotype",
        label: "Phenotype",
        fields: ["Phenotype", "__overlappingVariants"],
    },
    {
        id: "ancestry",
        label: "Ancestry",
        fields: ["Ancestry"],
    },
    {
        id: "project",
        label: "Project",
        fields: ["Project"],
    },
];

export const OVERLAPPING_VARIANTS_FILTER_FIELD = "__overlappingVariants";

function hasFieldValue(value) {
    return value != null && value !== "";
}

function rowMatchesSearch(row, field, search) {
    const value = row[field];
    if (!hasFieldValue(value)) {
        return false;
    }
    return String(value).toLowerCase().includes(String(search).toLowerCase());
}

function rowMatchesLowerThan(row, field, search) {
    const value = row[field];
    const threshold = Number(search);
    if (!hasFieldValue(value) || Number.isNaN(threshold)) {
        return false;
    }
    return typeof value === "number" && value <= threshold;
}

function rowMatchesGreaterThan(row, field, search) {
    const value = row[field];
    const threshold = Number(search);
    if (!hasFieldValue(value) || Number.isNaN(threshold)) {
        return false;
    }
    return typeof value === "number" && value >= threshold;
}

function rowMatchesExact(row, field, search) {
    if (field === "Phenotype") {
        const key = row?.PhenotypeKey || row?.Phenotype;
        if (!hasFieldValue(key)) {
            return false;
        }
        return String(key) === String(search);
    }
    const value = row[field];
    if (!hasFieldValue(value)) {
        return false;
    }
    return String(value) === String(search);
}

function rowMatchesFilter(row, filterDef, searchValues) {
    return searchValues.some((search) => {
        switch (filterDef.type) {
            case "search":
                return rowMatchesSearch(row, filterDef.field, search);
            case "search lower than":
                return rowMatchesLowerThan(row, filterDef.field, search);
            case "search greater than":
                return rowMatchesGreaterThan(row, filterDef.field, search);
            case "dropdown":
            case "checkbox":
                return rowMatchesExact(row, filterDef.field, search);
            case "boolean":
                return true;
            default:
                return true;
        }
    });
}

function variantIdForOverlap(row) {
    return String(row?.["Variant ID"] || row?.varId || "").trim();
}

function phenotypeKeyForOverlap(row) {
    return String(row?.PhenotypeKey || row?.Phenotype || "").trim();
}

/**
 * Keep rows whose Variant ID appears in every phenotype present in `rows`
 * (or in `phenotypeNames` when provided).
 */
export function filterOverlappingAssociationVariants(rows, phenotypeNames = null) {
    if (!Array.isArray(rows) || !rows.length) {
        return [];
    }

    const phenotypes = Array.isArray(phenotypeNames) && phenotypeNames.length
        ? phenotypeNames.map((name) => String(name || "").trim()).filter(Boolean)
        : Array.from(
              new Set(
                  rows
                      .map((row) => phenotypeKeyForOverlap(row))
                      .filter(Boolean)
              )
          );

    if (phenotypes.length < 2) {
        return rows;
    }

    const phenotypesByVariant = new Map();
    rows.forEach((row) => {
        const variantId = variantIdForOverlap(row);
        const phenotype = phenotypeKeyForOverlap(row);
        if (!variantId || !phenotype) {
            return;
        }
        if (!phenotypesByVariant.has(variantId)) {
            phenotypesByVariant.set(variantId, new Set());
        }
        phenotypesByVariant.get(variantId).add(phenotype);
    });

    const overlappingIds = new Set();
    phenotypesByVariant.forEach((set, variantId) => {
        if (phenotypes.every((phenotype) => set.has(phenotype))) {
            overlappingIds.add(variantId);
        }
    });

    return rows.filter((row) => overlappingIds.has(variantIdForOverlap(row)));
}

export function isOverlappingVariantsFilterActive(filtersIndex) {
    const search = filtersIndex?.[OVERLAPPING_VARIANTS_FILTER_FIELD]?.search || [];
    return search.some((value) => value === true || value === "true");
}

/**
 * Filters available for the current associations context.
 */
export function associationsFiltersForContext({
    includeProject = false,
    includePhenotype = false,
} = {}) {
    return ASSOCIATIONS_FILTERS.filter((filter) => {
        if (filter.field === "Project") {
            return includeProject;
        }
        if (
            filter.field === "Phenotype" ||
            filter.field === OVERLAPPING_VARIANTS_FILTER_FIELD
        ) {
            return includePhenotype;
        }
        return true;
    });
}

export function associationsFilterGroupsForContext({
    includeProject = false,
    includePhenotype = false,
} = {}) {
    return ASSOCIATIONS_FILTER_GROUPS.map((group) => ({
        ...group,
        fields: group.fields.filter((field) => {
            if (field === "Project") {
                return includeProject;
            }
            if (
                field === "Phenotype" ||
                field === OVERLAPPING_VARIANTS_FILTER_FIELD
            ) {
                return includePhenotype;
            }
            return true;
        }),
    })).filter((group) => group.fields.length > 0);
}

/**
 * Apply active filters to association table rows (AND across fields, OR within field).
 */
export function applyAssociationsFilters(rows, filtersIndex) {
    if (!Array.isArray(rows) || !rows.length) {
        return [];
    }

    let filtered = rows;
    const overlappingActive = isOverlappingVariantsFilterActive(filtersIndex);

    Object.keys(filtersIndex || {}).forEach((field) => {
        if (field === OVERLAPPING_VARIANTS_FILTER_FIELD) {
            return;
        }
        const filterDef = filtersIndex[field];
        const searches = (filterDef.search || []).filter(
            (value, index, array) => value !== "" && value != null && array.indexOf(value) === index
        );

        if (!searches.length) {
            return;
        }

        filtered = filtered.filter((row) => rowMatchesFilter(row, filterDef, searches));
    });

    if (overlappingActive) {
        filtered = filterOverlappingAssociationVariants(filtered);
    }

    return filtered;
}

export function buildFilterOptions(rows, field) {
    if (!Array.isArray(rows) || !rows.length) {
        return [];
    }

    if (field === "Phenotype") {
        const byKey = new Map();
        rows.forEach((row) => {
            const key = String(row?.PhenotypeKey || row?.Phenotype || "").trim();
            if (!key) {
                return;
            }
            const label =
                String(row?.PhenotypeLabel || row?.Phenotype || "").trim() ||
                key;
            if (!byKey.has(key)) {
                byKey.set(key, label);
            }
        });
        return Array.from(byKey.entries())
            .map(([value, label]) => ({ value, label }))
            .sort((a, b) => String(a.label).localeCompare(String(b.label)));
    }

    const options = new Set();
    rows.forEach((row) => {
        const value = row[field];
        if (hasFieldValue(value)) {
            options.add(value);
        }
    });

    return Array.from(options).sort((a, b) => String(a).localeCompare(String(b)));
}

export function createFiltersIndex(filters = ASSOCIATIONS_FILTERS) {
    const filtersIndex = {};
    filters.forEach((filter) => {
        filtersIndex[filter.field] = {
            type: filter.type,
            field: filter.field,
            search: [],
            "label in bubble": filter["label in bubble"] === "true",
        };
    });
    return filtersIndex;
}

export function cloneFiltersIndex(filtersIndex) {
    const next = {};
    Object.keys(filtersIndex || {}).forEach((field) => {
        const filterState = filtersIndex[field];
        next[field] = {
            ...filterState,
            search: [...(filterState.search || [])],
        };
    });
    return next;
}
