// HPO availability checks for the term pickers.
// The phenotype analyzer service does not publish per-HPO CRDC sample counts,
// so counts are unavailable. A term can still be searched when the reference
// ontology knows it; the analyzer ignores terms it has no data for.

function hpoAvailability(id, counts, status) {
    if (status === "unavailable" || !counts) {
        return { enabled: true, count: null, reason: "" };
    }
    if (status !== "ready") {
        return { enabled: false, count: null, reason: "Checking CRDC sample availability…" };
    }
    if (!Object.prototype.hasOwnProperty.call(counts, id)) {
        return { enabled: false, count: null, reason: "Not available in the CRDC analysis HPO set" };
    }
    const count = counts[id];
    if (!Number.isInteger(count) || count < 0) {
        return { enabled: false, count: null, reason: "CRDC sample count unavailable" };
    }
    return {
        enabled: count >= 1,
        count,
        reason: count >= 1 ? `${count.toLocaleString()} ${count === 1 ? "sample" : "samples"}` : "0 CRDC samples · cannot select",
    };
}

function validateCrdcHpos(ids, counts, status, label = (id) => id) {
    if (!ids.length || status === "unavailable") return;
    if (status !== "ready" || !counts) {
        throw new Error("Wait for CRDC sample availability to finish loading.");
    }
    const unsupported = [...new Set(ids)].filter((id) => !hpoAvailability(id, counts, status).enabled);
    if (unsupported.length) {
        throw new Error(
            `Each HPO must be recorded in at least 1 CRDC sample. Unavailable: ${unsupported
                .map((id) => `${label(id)}${label(id) === id ? "" : ` (${id})`}`)
                .join(", ")}. Remove or replace these terms.`
        );
    }
}

export { hpoAvailability, validateCrdcHpos };
