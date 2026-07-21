import { ASSOCIATIONS_TABLE_FORMAT } from "./variantSifterAssociationsTableFormat.js";
import { variantOverlapsRegion } from "./variantSifterCredibleSetsRegion.js";

const CS_KEY_FIELD = ASSOCIATIONS_TABLE_FORMAT["custom table"]["Credible Set"]["key field"];
const CS_PPA_FIELD = ASSOCIATIONS_TABLE_FORMAT["custom table"]["Credible Set"]["PPA"];

function rowVariantKeys(row) {
    const keys = new Set();
    if (row?.[CS_KEY_FIELD]) {
        keys.add(row[CS_KEY_FIELD]);
    }
    if (row?.varId) {
        keys.add(row.varId);
    }
    return keys;
}

function indexAssociationRows(associationRows) {
    const byKey = new Map();
    (associationRows || []).forEach((row) => {
        rowVariantKeys(row).forEach((key) => {
            if (!byKey.has(key)) {
                byKey.set(key, row);
            }
        });
    });
    return byKey;
}

function resolveCsVariantKeys(csRow) {
    const keys = [];
    if (csRow?.[CS_KEY_FIELD]) {
        keys.push(csRow[CS_KEY_FIELD]);
    }
    if (csRow?.varId) {
        keys.push(csRow.varId);
    }
    return keys;
}

function findAssociationRow(associationByKey, csRow) {
    const keys = resolveCsVariantKeys(csRow);
    for (const key of keys) {
        if (associationByKey.has(key)) {
            return associationByKey.get(key);
        }
    }
    return null;
}

function resolveCsPpa(csRow) {
    const value = csRow?.[CS_PPA_FIELD] ?? csRow?.PPA ?? csRow?.posteriorProbability;
    if (value == null || value === "") {
        return null;
    }
    const numeric = Number(value);
    return Number.isNaN(numeric) ? value : numeric;
}

/**
 * Build rows for the cross-section Variant data table.
 * Associations panel stays unfiltered; this applies credible-set membership when sets are selected.
 */
export function buildVariantDataTableView(associationRows, credibleSetsState) {
    const baseTopRows = [...ASSOCIATIONS_TABLE_FORMAT["top rows"]];
    const selectedIds = credibleSetsState?.selectedIds || [];

    if (!selectedIds.length) {
        return {
            topRows: baseTopRows,
            rows: Array.isArray(associationRows) ? [...associationRows] : [],
            filteredByCredibleSets: false,
            tableFormat: ASSOCIATIONS_TABLE_FORMAT,
        };
    }

    const associationByKey = indexAssociationRows(associationRows);
    const columnKeys = selectedIds.map((selectionKey) => {
        const meta = credibleSetsState.variantsBySet?.[selectionKey]?.meta;
        return meta?.label || meta?.credibleSetId || selectionKey;
    });
    const topRows = [...baseTopRows, ...columnKeys, "Credible Set"];
    const mergedRows = {};

    selectedIds.forEach((selectionKey, index) => {
        const setState = credibleSetsState.variantsBySet?.[selectionKey];
        const columnKey = columnKeys[index];
        const csRows = setState?.formattedVariants || [];

        csRows.forEach((csRow) => {
            const associationRow = findAssociationRow(associationByKey, csRow);
            if (!associationRow) {
                return;
            }

            const variantKey =
                associationRow[CS_KEY_FIELD] || associationRow.varId || resolveCsVariantKeys(csRow)[0];
            if (!variantKey) {
                return;
            }

            const ppa = resolveCsPpa(csRow);
            if (!mergedRows[variantKey]) {
                mergedRows[variantKey] = { ...associationRow };
            }

            if (ppa != null) {
                mergedRows[variantKey][columnKey] = ppa;
                const previous = mergedRows[variantKey]["Credible Set"];
                if (previous == null || (typeof ppa === "number" && ppa > previous)) {
                    mergedRows[variantKey]["Credible Set"] = ppa;
                }
            }
        });
    });

    const tableFormat = {
        ...ASSOCIATIONS_TABLE_FORMAT,
        "top rows": topRows,
        "column formatting": {
            ...ASSOCIATIONS_TABLE_FORMAT["column formatting"],
            "Credible Set": { type: ["scientific notation"] },
        },
    };

    columnKeys.forEach((columnKey) => {
        tableFormat["column formatting"][columnKey] = { type: ["scientific notation"] };
    });

    return {
        topRows,
        rows: Object.values(mergedRows),
        filteredByCredibleSets: true,
        tableFormat,
    };
}

/**
 * Flatten credible variants from all selected sets for the CS panel table.
 * When `region` is provided, only variants overlapping that region are included.
 */
export function buildCredibleVariantsPanelRows(credibleSetsState, region = null) {
    const selectedIds = credibleSetsState?.selectedIds || [];
    const rows = [];

    selectedIds.forEach((selectionKey) => {
        const setState = credibleSetsState.variantsBySet?.[selectionKey];
        const meta = setState?.meta || {};
        const credibleSetId = meta.credibleSetId || selectionKey;
        const formatted = setState?.formattedVariants || [];
        const raw = setState?.rawVariants || [];

        formatted.forEach((variantRow, index) => {
            const regionSource = raw[index] || variantRow;
            if (region && !variantOverlapsRegion(regionSource, region)) {
                return;
            }
            rows.push({
                ...variantRow,
                credibleSetId,
                credibleSetLabel: meta.label || credibleSetId,
                selectionKey,
            });
        });
    });

    rows.sort((a, b) => {
        const ppaA = Number(a.PPA ?? a.posteriorProbability ?? 0);
        const ppaB = Number(b.PPA ?? b.posteriorProbability ?? 0);
        return ppaB - ppaA;
    });

    return rows;
}
