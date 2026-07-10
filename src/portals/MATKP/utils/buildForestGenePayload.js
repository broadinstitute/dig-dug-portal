import { fetchForestGeneRows } from "./forestGeneApi.js";

const OUTCOME_ORDER = [
    "age",
    "depot_binary",
    "diet_group",
    "genotype_status",
    "hdl",
    "homa_ir",
    "insulin_resistance_status",
    "ldl",
    "log10_homa_ir",
    "obesity_status",
    "temperature_group",
    "treatment_group",
    "triglycerides",
];

function formatDatasetLabel(apiRow) {
    if (apiRow.datasetId) {
        return apiRow.datasetId.replace(/^bulkRNA_/, "").replace(/_/g, " ");
    }

    if (apiRow.datasetName) {
        return apiRow.datasetName.length > 42
            ? `${apiRow.datasetName.slice(0, 41)}…`
            : apiRow.datasetName;
    }

    return "Dataset";
}

function normalizeDepot(value) {
    const s = String(value || "").trim();
    return s === "None" || s === "none" ? "" : s;
}

function transformApiRow(apiRow) {
    const isPooled = apiRow.row_kind === "meta_result";
    const datasetId = apiRow.datasetId || null;
    const datasetName = apiRow.datasetName || null;
    const displayShort = isPooled ? "Pooled bulk meta" : formatDatasetLabel(apiRow);
    const outcomeId = apiRow.standardized_outcome_id;

    return {
        row_type: isPooled ? "pooled" : "dataset",
        dataset_id: datasetId,
        dataset_name: datasetName,
        source_category: isPooled ? "meta_analysis" : null,
        source_path: apiRow.dataset_dir || null,
        species: apiRow.species || null,
        depot: normalizeDepot(apiRow.depot),
        depot2: normalizeDepot(apiRow.depot2),
        tissue: apiRow.tissue || "",
        outcome_id: outcomeId,
        outcome_label: apiRow.standardized_outcome_label,
        outcome_type: apiRow.outcome_type,
        contrast_label:
            apiRow.direction_label || apiRow.standardized_outcome_label,
        effect_metric: apiRow.effect_metric,
        effect: apiRow.effect_size,
        ci_low: apiRow.ci_low,
        ci_high: apiRow.ci_high,
        stat: null,
        p_value: apiRow.p_value ?? null,
        p_value_adj: apiRow.p_value_adj ?? null,
        n_total: apiRow.n ?? null,
        n_group_a: apiRow.n_a ?? null,
        n_group_b: apiRow.n_b ?? null,
        comparison_level_a: apiRow.level_a ?? null,
        comparison_level_b: apiRow.level_b ?? null,
        comparison_name:
            apiRow.direction_label || apiRow.standardized_outcome_label,
        comparison_id: isPooled
            ? `${outcomeId}_pooled`
            : `${datasetId || "dataset"}_${outcomeId}`,
        note: apiRow.notes || apiRow.direction_notes || "",
        direction_label: apiRow.direction_label || null,
        positive_direction_text: apiRow.positive_direction_text || null,
        negative_direction_text: apiRow.negative_direction_text || null,
        gene: apiRow.gene,
        gene_key: apiRow.gene_key,
        display_label_short: displayShort,
        display_label_medium: isPooled
            ? "Pooled bulk meta-analysis"
            : datasetName || displayShort,
        display_label_full: isPooled
            ? "Pooled bulk meta-analysis"
            : `${datasetName || displayShort}${datasetId ? ` [${datasetId}]` : ""}`,
    };
}

function extractDirectionLabel(text) {
    if (!text) return null;
    const slashIdx = text.lastIndexOf("/");
    if (slashIdx !== -1) {
        return text.slice(slashIdx + 1).trim() || null;
    }
    return text.replace(/^higher expression in\s+/i, "").trim() || null;
}

function buildOutcomeAxisLabels(rawRows) {
    const datasetRows = rawRows.filter((r) => r.row_kind === "dataset_result");

    if (!datasetRows.length) {
        return { left: null, right: null, leftTooltip: null, rightTooltip: null };
    }

    const posLabels = [
        ...new Set(
            datasetRows
                .map((r) => extractDirectionLabel(r.positive_direction_text))
                .filter(Boolean)
        ),
    ];
    const negLabels = [
        ...new Set(
            datasetRows
                .map((r) => extractDirectionLabel(r.negative_direction_text))
                .filter(Boolean)
        ),
    ];

    return {
        left: negLabels.length === 1 ? negLabels[0] : null,
        right: posLabels.length === 1 ? posLabels[0] : null,
        leftTooltip: datasetRows[0].negative_direction_text || null,
        rightTooltip: datasetRows[0].positive_direction_text || null,
    };
}

function buildOutcomeContrastLabel(apiRows) {
    const datasetRows = apiRows.filter(
        (row) => row.row_kind === "dataset_result"
    );
    const labels = [
        ...new Set(datasetRows.map((row) => row.direction_label).filter(Boolean)),
    ];

    if (labels.length === 0) {
        return datasetRows[0]?.standardized_outcome_label || "";
    }

    if (labels.length === 1) {
        return labels[0];
    }

    return labels.join(" / ");
}

function buildSummaryCounts(rows) {
    const datasetRows = rows.filter((row) => row.row_type === "dataset");
    const pooledRows = rows.filter((row) => row.row_type === "pooled");

    return {
        dataset_row_count: datasetRows.length,
        pooled_row_count: pooledRows.length,
        dataset_count: new Set(
            datasetRows.map((row) => row.dataset_id).filter(Boolean)
        ).size,
        species_count: new Set(
            datasetRows.map((row) => row.species).filter(Boolean)
        ).size,
    };
}

export function buildForestGenePayload(geneSymbol, apiRows) {
    const gene = String(geneSymbol || "").trim().toUpperCase();

    if (!gene || !apiRows.length) {
        return null;
    }

    const rowsByOutcome = new Map();

    apiRows.forEach((apiRow) => {
        const outcomeId = apiRow.standardized_outcome_id;

        if (!outcomeId) {
            return;
        }

        if (!rowsByOutcome.has(outcomeId)) {
            rowsByOutcome.set(outcomeId, []);
        }

        rowsByOutcome.get(outcomeId).push(apiRow);
    });

    const outcomes = OUTCOME_ORDER.filter((outcomeId) =>
        rowsByOutcome.has(outcomeId)
    ).map((outcomeId) => {
        const rawRows = rowsByOutcome.get(outcomeId);
        const rows = rawRows.map(transformApiRow);
        const datasetRows = rows.filter((row) => row.row_type === "dataset");
        const pooledRows = rows.filter((row) => row.row_type === "pooled");

        return {
            outcome_id: outcomeId,
            outcome_label: rawRows[0].standardized_outcome_label,
            outcome_type: rawRows[0].outcome_type,
            contrast_label: buildOutcomeContrastLabel(rawRows),
            summary_counts: buildSummaryCounts(rows),
            axis_labels: buildOutcomeAxisLabels(rawRows),
            rows: [...datasetRows, ...pooledRows],
        };
    });

    const datasetIds = new Set();
    let pooledOutcomeCount = 0;

    outcomes.forEach((outcome) => {
        outcome.rows.forEach((row) => {
            if (row.row_type === "dataset" && row.dataset_id) {
                datasetIds.add(row.dataset_id);
            }
        });

        if (outcome.summary_counts.pooled_row_count > 0) {
            pooledOutcomeCount += 1;
        }
    });

    return {
        gene,
        aliases: [],
        supported_outcomes: outcomes.map((outcome) => outcome.outcome_id),
        supported_outcome_count: outcomes.length,
        page_summary: {
            dataset_count: datasetIds.size,
            outcome_count: outcomes.length,
            pooled_outcome_count: pooledOutcomeCount,
        },
        outcomes,
    };
}

export async function fetchForestGenePayload(geneSymbol) {
    const rows = await fetchForestGeneRows(geneSymbol);

    return buildForestGenePayload(geneSymbol, rows);
}
