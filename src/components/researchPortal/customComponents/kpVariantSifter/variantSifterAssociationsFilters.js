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
        type: "dropdown",
        "label in bubble": "true",
    },
    {
        field: "Ancestry",
        label: "Ancestry",
        type: "dropdown",
        "label in bubble": "true",
    },
];

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

function rowMatchesDropdown(row, field, search) {
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
                return rowMatchesDropdown(row, filterDef.field, search);
            default:
                return true;
        }
    });
}

/**
 * Apply active filters to association table rows (AND across fields, OR within field).
 */
export function applyAssociationsFilters(rows, filtersIndex) {
    if (!Array.isArray(rows) || !rows.length) {
        return [];
    }

    let filtered = rows;

    Object.keys(filtersIndex).forEach((field) => {
        const filterDef = filtersIndex[field];
        const searches = (filterDef.search || []).filter(
            (value, index, array) => value !== "" && value != null && array.indexOf(value) === index
        );

        if (!searches.length || filterDef.type === "checkbox") {
            return;
        }

        filtered = filtered.filter((row) => rowMatchesFilter(row, filterDef, searches));
    });

    return filtered;
}

export function buildFilterOptions(rows, field) {
    if (!Array.isArray(rows) || !rows.length) {
        return [];
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
