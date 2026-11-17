// Consume server-derived units only. Never estimate a reference from visible rows.
const VERSION = "rphers_scoring_cohort_sample_sd_v1";
const finite = value => typeof value === "number" && Number.isFinite(value);

function referenceAvailable(reference) {
    return Boolean(reference && reference.version === VERSION && reference.status === "ok" &&
        reference.reference_id && reference.data_release_id && reference.scoring_cohort_id &&
        Number.isInteger(reference.reference_n) && reference.reference_n >= 2 &&
        finite(reference.reference_mean) && finite(reference.reference_sd) && reference.reference_sd > 0 &&
        reference.ddof === 1);
}

function standardizedField(row, field, reference) {
    return referenceAvailable(reference) && row && row.standardization_status === "ok" &&
        row.standardization_reference_id === reference.reference_id && finite(row[field])
        ? row[field] : null;
}

function sameReference(left, right) {
    return Boolean(left && right && left.reference_id && left.reference_id === right.reference_id &&
        left.version === right.version && left.reference_mean === right.reference_mean &&
        left.reference_sd === right.reference_sd && left.reference_n === right.reference_n);
}

function contextMatches(reference, terms) {
    const normalize = values => [...new Set(values || [])].sort().join(",");
    return Boolean(reference && normalize(reference.query_hpo) === normalize(terms));
}

function referenceDescription(reference) {
    if (!referenceAvailable(reference)) {
        const reason = reference && reference.status === "zero_or_invalid_sd"
            ? "the scoring-cohort scores have no usable variation."
            : reference && reference.status === "insufficient_reference"
                ? "fewer than two valid scoring-cohort scores are available."
                : "the scoring-cohort reference is missing or incomplete.";
        return `SD units unavailable: ${reason}`;
    }
    return `SD reference: ${reference.reference_n.toLocaleString()} valid scores in the full scoring cohort. ` +
        "Sample SD; affected-only and display filters do not change this reference.";
}

module.exports = { VERSION, referenceAvailable, standardizedField, sameReference, contextMatches, referenceDescription };
