// Existing binary-HPO coefficient units. No residual-PheRS SD conversion.
const DISPLAY_GRS_STEP = 0.1;
const finite = value => value != null && value !== "" && Number.isFinite(Number(value)) ? Number(value) : null;

function withSingleHpoDisplayUnits(row) {
    const beta = finite(row.beta);
    const se = finite(row.standardError);
    const low = finite(row.betaCiLow);
    const high = finite(row.betaCiHigh);
    const intervalAvailable = low != null && high != null && low <= high;
    return {
        ...row,
        betaPer0_1Grs: beta == null ? null : DISPLAY_GRS_STEP * beta,
        standardErrorPer0_1Grs: se == null || se < 0 ? null : DISPLAY_GRS_STEP * se,
        betaCiLowPer0_1Grs: intervalAvailable ? DISPLAY_GRS_STEP * low : null,
        betaCiHighPer0_1Grs: intervalAvailable ? DISPLAY_GRS_STEP * high : null,
        effectType: "binary_hpo_logit",
        effectUnit: "log_odds_per_0_1_grs",
        effectApproximation: "score_test",
        displayVersion: "single_hpo_beta_per_0_1_grs_v1",
        displayPredictorStep: DISPLAY_GRS_STEP,
    };
}

module.exports = { DISPLAY_GRS_STEP, withSingleHpoDisplayUnits };
