const {hpoAvailability, loadCrdcHpoCounts, validateCrdcHpos} = require('../../utils/crdcHpoAvailability');
const {buildSearchHref, normalizeSearchValue} = require('./searchModel');

const normalizeTerm = value => normalizeSearchValue(value).replace(/\s*,\s*/g, ', ');

function resolvePhenotypeSearchIds(value, options) {
    const byText = new Map();
    for (const option of options) {
        for (const text of [option.id, option.label, `${option.label} [${option.id}]`, ...(option.aliases || [])])
            byText.set(normalizeTerm(text), option.id);
    }
    const parts = String(value || '').split(',').map(part => part.trim()).filter(Boolean);
    const ids = [];
    while (parts.length) {
        let id, consumed = 0;
        // Prefer a complete known label, including labels that contain commas.
        for (let end = parts.length; end > 0; end--) {
            const text = parts.slice(0, end).join(', ');
            id = byText.get(normalizeTerm(text));
            if (!id && end === 1 && /^HP:\d{7}$/i.test(text)) id = text.toUpperCase();
            if (id) {consumed = end; break;}
        }
        if (!id) throw new Error(`Unknown phenotype: ${parts[0]}. Select a suggestion or enter an HPO ID.`);
        ids.push(id);
        parts.splice(0, consumed);
    }
    if (!ids.length) throw new Error('Enter a phenotype first.');
    return [...new Set(ids)];
}

const frontPhenotypeSearchMixin = {
    data: () => ({frontHpoCounts: null, frontHpoCountsStatus: 'loading', frontSearchPending: false}),
    mounted() {this.loadFrontHpoCounts().catch(() => {});},
    watch: {frontHpoCountsStatus() {if (this.query && !this.frontSearchPending) this.updateSuggestions();}},
    methods: {
        async loadFrontHpoCounts() {
            this.frontHpoCountsStatus = 'loading';
            try {
                this.frontHpoCounts = await loadCrdcHpoCounts();
                this.frontHpoCountsStatus = 'ready';
            } catch (error) {
                this.frontHpoCountsStatus = 'error';
                throw error;
            }
        },
        async retryFrontHpoCounts() {
            try {
                await this.loadFrontHpoCounts();
                this.hint = 'Type, then press Enter';
            } catch (error) {this.hint = error.message;}
        },
        frontOptionAvailability(option) {
            return option.kind === 'Phenotype'
                ? hpoAvailability(option.id, this.frontHpoCounts, this.frontHpoCountsStatus)
                : {enabled: true, reason: ''};
        },
        async navigateFrontSearch(target, options) {
            if (this.frontSearchPending) return;
            const query = this.query;
            try {
                if (target.path === '/pb_phenotype.html') {
                    const ids = resolvePhenotypeSearchIds(target.value, options);
                    this.frontSearchPending = true;
                    this.hint = 'Checking CRDC phenotype availability…';
                    await this.loadFrontHpoCounts();
                    if (this.query !== query) return;
                    const labels = new Map(options.map(option => [option.id, option.label]));
                    validateCrdcHpos(ids, this.frontHpoCounts, this.frontHpoCountsStatus, id => labels.get(id) || id);
                    target = {...target, value: ids.join(',')};
                }
                window.location.assign(buildSearchHref(target));
            } catch (error) {
                if (this.query !== query) return;
                this.hint = error.message;
                this.$refs.searchInput.focus();
            } finally {this.frontSearchPending = false;}
        },
    },
};

module.exports = {frontPhenotypeSearchMixin, resolvePhenotypeSearchIds};
