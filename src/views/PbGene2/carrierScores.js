const { referenceAvailable, contextMatches, sameReference } = require('../../utils/rphersUnits');
const { exactVariantCarrierResiduals } = require('../PbVariant/carrierStatistics');

const canonical = id => String(id || '').replace(/^chr/i, '').toLowerCase();

function readCarrierScores(result, gene, variantId, context) {
    const source = result && result.variant_carrier_residuals;
    const reference = result && result.rphers_standardization;
    if (!result || result.gene !== gene || !source || canonical(source.variant_id) !== canonical(variantId))
        throw new Error('Individual scores did not match the selected gene and variant.');
    if (!referenceAvailable(reference) || !contextMatches(reference, context.terms) ||
        !sameReference(reference, context.reference) || !sameReference(source.rphers_standardization, reference))
        throw new Error('Individual scores did not match the applied HPO scoring reference.');
    if (!source.sample_rphers_z || typeof source.sample_rphers_z !== 'object' || Array.isArray(source.sample_rphers_z))
        throw new Error('The analysis service did not supply individual Z-scores.');
    return exactVariantCarrierResiduals(result, variantId);
}

async function fetchCarrierScores(gene, variantId, context, fetcher = fetch, timeoutMs = 120000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetcher('/phenotype-analyzer-api/analyze', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
            body: JSON.stringify({ gene, variant_id: variantId, terms: context.terms.join(','),
                score_type: context.scoreType, affected_only: context.analysisSet === 'affected',
                advanced: { significance_metric: 'p_value', significance_threshold: 0.05, min_carriers: 10 } }),
        });
        if (!response.ok) throw new Error(`Individual score request failed (${response.status}). Please retry.`);
        return readCarrierScores(await response.json(), gene, variantId, context);
    } catch (error) {
        if (controller.signal.aborted) throw new Error('Individual score request timed out. Please retry.');
        throw error;
    } finally { clearTimeout(timeout); }
}

const carrierScoreMixin = {
    data: () => ({ carrierScoreResult: { key: '', status: 'idle', scores: {}, error: '' }, carrierScoreSequence: 0 }),
    computed: {
        carrierScoreRequestKey() {
            return this.expandedVariantId && this.appliedContext
                ? JSON.stringify([this.geneInfo.symbol, this.expandedVariantId, this.appliedContext]) : '';
        },
        currentCarrierScores() {
            return this.carrierScoreResult.key === this.carrierScoreRequestKey
                ? this.carrierScoreResult : { status: this.carrierScoreRequestKey ? 'loading' : 'idle', scores: {}, error: '' };
        },
        hasMissingCarrierScores() {
            const row = this.variantRows.find(row => row.id === this.expandedVariantId);
            return this.currentCarrierScores.status === 'ready' && row &&
                row.carrierSamples.some(sample => this.currentCarrierScores.scores[String(sample.id).toLowerCase()] == null);
        },
    },
    watch: { carrierScoreRequestKey: { immediate: true, handler() { this.loadIndividualCarrierScores(); } } },
    beforeDestroy() { this.carrierScoreSequence++; },
    methods: {
        scoredCarrierCount(row) {
            if (!this.appliedContext) return '—';
            const count = row.phenotypeMatchScoredCarrierCount;
            return referenceAvailable(this.appliedContext.reference) && Number.isInteger(count) && count >= 0 ? count.toLocaleString() : 'Unavailable';
        },
        scoredCarrierTitle(row) {
            return !this.appliedContext ? 'Apply a phenotype profile to see scoring coverage.' : `${this.scoredCarrierCount(row)} scored / ${row.phenotypeMatchCarrierCount == null ? 'unknown' : row.phenotypeMatchCarrierCount} analysis-eligible carriers; ${row.carrierCount} total observed variant carriers. Scored does not mean HPO-positive.`;
        },
        scoredCarrierCoverage(row) {
            if (!this.appliedContext) return 'no context';
            const count = row.phenotypeMatchScoredCarrierCount;
            return referenceAvailable(this.appliedContext.reference) && Number.isInteger(count) && count >= 0
                ? `${count} / ${row.carrierCount}` : 'Unavailable';
        },
        fetchCarrierScoreResult: fetchCarrierScores,
        async loadIndividualCarrierScores() {
            const sequence = ++this.carrierScoreSequence;
            const key = this.carrierScoreRequestKey;
            this.carrierScoreResult = { key, status: key ? 'loading' : 'idle', scores: {}, error: '' };
            if (!key) return;
            try {
                const scores = await this.fetchCarrierScoreResult(this.geneInfo.symbol, this.expandedVariantId, this.appliedContext);
                if (sequence === this.carrierScoreSequence && key === this.carrierScoreRequestKey)
                    this.carrierScoreResult = { key, status: 'ready', scores, error: '' };
            } catch (error) {
                if (sequence === this.carrierScoreSequence && key === this.carrierScoreRequestKey)
                    this.carrierScoreResult = { key, status: 'error', scores: {}, error: String(error.message || error) };
            }
        },
        individualCarrierScore(sample) {
            const state = this.currentCarrierScores;
            if (state.status === 'idle') return 'no context';
            if (state.status === 'loading') return 'Loading…';
            if (state.status === 'error') return 'Unavailable';
            const score = state.scores[String(sample.id).toLowerCase()];
            return score == null ? 'none*' : score.toFixed(3);
        },
    },
};

module.exports = { readCarrierScores, fetchCarrierScores, carrierScoreMixin };
