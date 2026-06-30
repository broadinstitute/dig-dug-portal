import { ASSOCIATIONS_TABLE_FORMAT } from "./variantSifterAssociationsTableFormat.js";

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
    const topRows = [...baseTopRows, ...selectedIds, "Credible Set"];
    const mergedRows = {};

    selectedIds.forEach((credibleSetId) => {
        const setState = credibleSetsState.variantsBySet?.[credibleSetId];
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
                mergedRows[variantKey][credibleSetId] = ppa;
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

    selectedIds.forEach((credibleSetId) => {
        tableFormat["column formatting"][credibleSetId] = { type: ["scientific notation"] };
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
 */
export function buildCredibleVariantsPanelRows(credibleSetsState) {
    const selectedIds = credibleSetsState?.selectedIds || [];
    const rows = [];

    selectedIds.forEach((credibleSetId) => {
        const setState = credibleSetsState.variantsBySet?.[credibleSetId];
        const meta = setState?.meta || {};
        (setState?.formattedVariants || []).forEach((variantRow) => {
            rows.push({
                ...variantRow,
                credibleSetId,
                credibleSetLabel: meta.label || credibleSetId,
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
