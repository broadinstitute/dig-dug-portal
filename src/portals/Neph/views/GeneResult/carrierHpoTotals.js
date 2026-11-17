import { hpoIdsOf } from "./carrierSummary";

// Total recorded HPO terms per carrier, taken from the carrier's samples-info record.
export const carrierHpoTotalsMixin = {
    methods: {
        carrierHpoTotalDisplay(sample) {
            const ids = hpoIdsOf(this.carrierSampleField(sample, 'hpo'));
            return ids ? ids.length.toLocaleString() : 'Unavailable';
        },
    },
};
