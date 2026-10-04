// The release stores approximate OR and CI for a one-point burden-score increase.
// Rescale only the displayed effect; p, q, and source row order stay unchanged.
const DISPLAY_BURDEN_STEP = 0.1;

function rescaleOdds(value) {
    const odds = Number(value);
    return value != null && Number.isFinite(odds) && odds > 0
        ? Math.pow(odds, DISPLAY_BURDEN_STEP)
        : null;
}

export function displayGeneHpoAssociations(rows) {
    return rows.map(row => ({
        ...row,
        oddsRatioPerPoint: row.oddsRatio,
        ciLowPerPoint: row.ciLow,
        ciHighPerPoint: row.ciHigh,
        oddsRatio: rescaleOdds(row.oddsRatio),
        ciLow: rescaleOdds(row.ciLow),
        ciHigh: rescaleOdds(row.ciHigh),
    }));
}
