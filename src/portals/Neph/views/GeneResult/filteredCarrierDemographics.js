import { buildCarrierSummary } from "./carrierSummary";

// Demographics of the carriers of the variants that match the current filters,
// computed from the carrier rows already loaded for the gene.
export const filteredCarrierDemographicsMixin = {
    computed: {
        carrierSelectionActive() { return this.variantFiltersActive || this.variantIdentifierIds !== null; },
        selectedCarrierVariantIds() { return [...new Set(this.matchingVariantRows.map(row => row.id))].sort(); },
        selectedCarrierKey() { return this.carrierSelectionActive ? JSON.stringify([this.geneInfo.symbol, this.selectedCarrierVariantIds]) : ''; },
        selectedCarrierSummary() {
            if (!this.carrierSelectionActive) return null;
            return buildCarrierSummary(this.matchingVariantRows.flatMap(row => row.carrierSamples || []), this.carrierSampleDetail);
        },
        displayedCarrierSummary() { return this.carrierSelectionActive ? this.selectedCarrierSummary : this.geneCarrierSummary; },
        displayedCarrierCount() {
            if (!this.carrierSelectionActive) return Number(this.totalGeneCarriers) || 0;
            return this.selectedCarrierSummary ? this.selectedCarrierSummary.carrierTotal : 0;
        },
        displayedCarrierStatus() { return ''; },
    },
};
