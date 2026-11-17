const { referenceAvailable } = require('./rphersUnits');

// Individual per-carrier rPheRS scores are not served by the GeneResult data link.
async function fetchCarrierScores() {
    throw new Error('Individual carrier scores are not available from the phenotype analyzer service.');
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

module.exports = { fetchCarrierScores, carrierScoreMixin };
