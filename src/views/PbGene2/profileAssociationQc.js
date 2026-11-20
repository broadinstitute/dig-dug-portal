const CHI_SQUARE_1_MEDIAN = 0.454936423119573;
// Acklam's inverse-normal approximation for the lower half of the distribution.
const CENTRAL_NUMERATOR = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
const CENTRAL_DENOMINATOR = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572, 1];
const TAIL_NUMERATOR = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
const TAIL_DENOMINATOR = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416, 1];

function polynomial(coefficients, x) {
    return coefficients.reduce((value, coefficient) => value * x + coefficient, 0);
}

function chiSquareFromP(p) {
    if (p === 0) return Infinity;
    const halfP = p / 2;
    if (halfP < 0.02425) {
        const tail = Math.sqrt(-2 * (Math.log(p) - Math.LN2));
        return (polynomial(TAIL_NUMERATOR, tail) / polynomial(TAIL_DENOMINATOR, tail)) ** 2;
    }
    const centered = halfP - 0.5;
    const square = centered * centered;
    return (centered * polynomial(CENTRAL_NUMERATOR, square) / polynomial(CENTRAL_DENOMINATOR, square)) ** 2;
}

function profileLambda(rows) {
    if (rows.length < 2) return null;
    const sortedP = rows.map(row => row.p_value).sort((a, b) => a - b);
    const lower = chiSquareFromP(sortedP[Math.floor((sortedP.length - 1) / 2)]);
    const upper = chiSquareFromP(sortedP[Math.floor(sortedP.length / 2)]);
    const lambda = (lower + upper) / (2 * CHI_SQUARE_1_MEDIAN);
    return Number.isFinite(lambda) ? lambda : null;
}

function profileAssociationQc(result, gene, run, { terms, scoreType, analysisSet }) {
    const familyTerms = result.query_hpo;
    if (!Array.isArray(familyTerms) || familyTerms.length !== terms.length ||
        terms.some(term => !familyTerms.includes(term)) || result.score_type !== scoreType ||
        result.affected_only !== (analysisSet === 'affected')) return null;

    const target = result.gene_associations[gene.toUpperCase()];
    const singleP = run.pValueSortValue;
    // The single-gene and catalog regressions must represent the same fitted test.
    if (!target || target.model !== run.geneScoreModel || target.n_samples !== run.nAnalysisSamples ||
        target.n_positive !== run.nPositiveBurden || !Number.isFinite(singleP) ||
        Math.abs(target.p_value - singleP) > 1e-7 * Math.max(target.p_value, singleP)) return null;

    return {
        qValue: target.fdr,
        lambda: profileLambda(Object.values(result.gene_associations)),
        nTests: result.n_tests,
    };
}

module.exports = { profileAssociationQc, profileLambda };
