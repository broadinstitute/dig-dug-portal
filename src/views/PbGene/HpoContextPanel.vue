<template>
    <section class="pbg-context-card" aria-labelledby="pbg-context-title">
        <div class="pbg-context-head">
            <div>
                <h2 id="pbg-context-title">HPO context</h2>
                <p>Recalculate gene-level burden and variant-level carrier matching for an entered HPO list.</p>
            </div>
            <span class="pbg-context-status" :class="{ 'pbg-context-status--active': activeContextTerms.length }">
                {{ activeContextTerms.length ? 'Context active' : 'No context' }}
            </span>
        </div>
        <form class="pbg-context-form" @submit.prevent="$emit('run')">
            <input v-model.trim="contextInputModel"
                   type="text"
                   aria-label="HPO context terms"
                   autocomplete="off"
                   spellcheck="false"
                   placeholder="Enter HPO terms, e.g. HP:0001250, HP:0000133">
            <button type="submit" :disabled="contextLoading">
                {{ contextLoading ? 'Calculating' : 'Go' }}
            </button>
            <details class="pbg-context-advanced">
                <summary>Advanced</summary>
                <div class="pbg-context-advanced-panel">
                    <label>
                        <span>Statistical filter</span>
                        <select v-model="metricModel">
                            <option value="p_value">P-value</option>
                            <option value="fdr">FDR</option>
                        </select>
                    </label>
                    <label>
                        <span>Threshold</span>
                        <input v-model.number="thresholdModel" type="number" min="0.000001" max="1" step="any">
                    </label>
                    <label>
                        <span>Minimum carriers</span>
                        <input v-model.number="minCarriersModel" type="number" min="1" step="1">
                    </label>
                    <small v-if="contextSignificanceMetric === 'fdr'">
                        BH-FDR is calculated within the API-defined test family.
                    </small>
                    <button class="pbg-context-advanced-apply" type="submit" :disabled="contextLoading">
                        Apply &amp; run
                    </button>
                </div>
            </details>
        </form>
        <p v-if="externalPhenotypeResultUrl" class="pbg-context-external">
            Temporary residual PheRS source:
            <a :href="externalPhenotypeResultUrl" target="_blank" rel="noopener noreferrer">Open phenotype result ↗</a>
        </p>
        <p v-if="contextError" class="pbg-context-error">{{ contextError }}</p>
        <div class="pbg-context-results">
            <div class="pbg-context-result-head">
                <span>HPOs (Entered terms)</span>
                <span>Beta (Effect Size)</span>
                <span>P-value</span>
                <span>Status / score coverage</span>
            </div>
            <div v-for="run in contextRuns" :key="run.id" class="pbg-context-result-row">
                <span>{{ run.hpos }}<small>{{ run.sourceLabel }}</small></span>
                <strong>{{ run.beta }}</strong>
                <strong>{{ run.pValue }}</strong>
                <span class="pbg-context-result-diagnostic">
                    <strong>{{ run.statusLabel }}</strong>
                    <small>{{ run.coverageLabel }}</small>
                    <small>{{ run.modelLabel }}</small>
                </span>
            </div>
            <p v-if="!contextRuns.length" class="pbg-context-empty">Enter an HPO context and select Go to add a result.</p>
        </div>
    </section>
</template>

<script>
export default {
    name: "HpoContextPanel",
    props: {
        activeContextTerms: { type: Array, required: true },
        contextInput: { type: String, required: true },
        contextLoading: { type: Boolean, required: true },
        contextSignificanceMetric: { type: String, required: true },
        contextSignificanceThreshold: { type: Number, required: true },
        contextMinCarriers: { type: Number, required: true },
        externalPhenotypeResultUrl: { type: String, default: "" },
        contextError: { type: String, default: "" },
        contextRuns: { type: Array, required: true },
    },
    computed: {
        contextInputModel: {
            get() { return this.contextInput; },
            set(value) { this.$emit("update:contextInput", value); },
        },
        metricModel: {
            get() { return this.contextSignificanceMetric; },
            set(value) { this.$emit("update:contextSignificanceMetric", value); },
        },
        thresholdModel: {
            get() { return this.contextSignificanceThreshold; },
            set(value) { this.$emit("update:contextSignificanceThreshold", value); },
        },
        minCarriersModel: {
            get() { return this.contextMinCarriers; },
            set(value) { this.$emit("update:contextMinCarriers", value); },
        },
    },
};
</script>
