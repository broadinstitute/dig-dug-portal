export const filteredCarrierDemographicsMixin = {
    data: () => ({ selectedCarrierSummary: null, selectedCarrierStatus: '', selectedCarrierRevision: 0 }),
    computed: {
        carrierSelectionActive() { return this.variantFiltersActive || this.variantIdentifierIds !== null; },
        selectedCarrierVariantIds() { return [...new Set(this.matchingVariantRows.map(row => row.id))].sort(); },
        selectedCarrierKey() { return this.carrierSelectionActive ? JSON.stringify([this.geneInfo.symbol, this.selectedCarrierVariantIds]) : ''; },
        displayedCarrierSummary() { return this.carrierSelectionActive ? this.selectedCarrierSummary : this.geneCarrierSummary; },
        displayedCarrierCount() {
            if (!this.carrierSelectionActive) return Number(this.totalGeneCarriers) || 0;
            if (this.selectedCarrierSummary && this.selectedCarrierSummary.carrierTotal != null) return this.selectedCarrierSummary.carrierTotal;
            return new Set(this.matchingVariantRows.flatMap(row => (row.carrierSamples || []).map(sample => sample.id))).size;
        },
        displayedCarrierStatus() { return this.carrierSelectionActive ? this.selectedCarrierStatus : this.carrierSummaryProgress.__gene__ || this.carrierSummaryErrors.__gene__ || ''; },
    },
    watch: { selectedCarrierKey: { immediate: true, handler: 'queueSelectedCarrierDemographics' } },
    beforeDestroy() { clearTimeout(this._selectedCarrierTimer); this.selectedCarrierRevision += 1; },
    methods: {
        queueSelectedCarrierDemographics(key) {
            const revision = ++this.selectedCarrierRevision;
            clearTimeout(this._selectedCarrierTimer);
            this.selectedCarrierSummary = null;
            this.selectedCarrierStatus = '';
            if (!key) return;
            if (!this.selectedCarrierVariantIds.length) {
                this.selectedCarrierSummary = { status: 'ready', carrierTotal: 0, matchedMetadataCount: 0, geneCarrierDemographics: {} };
                return;
            }
            this.selectedCarrierStatus = 'Loading selected carrier demographics…';
            this._selectedCarrierTimer = setTimeout(() => this.loadSelectedCarrierDemographics(key, revision), 150);
        },
        async loadSelectedCarrierDemographics(key, revision) {
            const [gene, variantIds] = JSON.parse(key);
            try {
                for (let attempt = 0; attempt < 2400; attempt += 1) {
                    if (revision !== this.selectedCarrierRevision || key !== this.selectedCarrierKey) return;
                    const response = await fetch('/__gene_carrier_demographics__', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ gene, variant_ids: variantIds }),
                    });
                    if (!response.ok) throw new Error(`Selected carrier metadata returned ${response.status}.`);
                    const result = await response.json();
                    if (revision !== this.selectedCarrierRevision || key !== this.selectedCarrierKey) return;
                    if (result.status === 'error') throw new Error(result.error || 'Selected carrier metadata unavailable.');
                    if (result.geneCarrierDemographics) this.selectedCarrierSummary = result;
                    this.selectedCarrierStatus = result.status === 'ready' ? '' : result.total ? `${Number(result.completed || 0).toLocaleString()} / ${Number(result.total).toLocaleString()} selected carriers loaded` : 'Loading selected carrier demographics…';
                    if (result.status === 'ready') return;
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                throw new Error('Selected carrier demographics are taking longer than expected.');
            } catch (error) {
                if (revision === this.selectedCarrierRevision && key === this.selectedCarrierKey) this.selectedCarrierStatus = String(error.message || error);
            }
        },
    },
};
