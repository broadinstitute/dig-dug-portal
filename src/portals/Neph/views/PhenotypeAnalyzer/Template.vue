<template>
    <div>
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
        ></page-header>

        <div class="container-fluid mdkp-body">
            <div class="gene-page-header card mdkp-card">
                <div class="row card-body">
                    <div class="col-md-12 gene-page-header-title">
                        Phenotype Analyzer
                    </div>
                    <div class="col-md-12 gene-page-header-body">
                        <span>Analyze phenotype terms</span>
                    </div>
                </div>
            </div>

            <div class="card mdkp-card">
                <div class="card-body">
                    <h4 class="card-title">Input phenotypes</h4>
                    <b-form @submit.prevent="$parent.analyzePhenotypes">
                        <b-form-group
                            label="Phenotypes"
                            label-for="phenotypeAnalyzerTerms"
                        >
                            <b-form-textarea
                                id="phenotypeAnalyzerTerms"
                                v-model="$store.state.terms"
                                rows="4"
                                max-rows="8"
                                placeholder="HP:0000118, HP:0000095, HP:0100820"
                            ></b-form-textarea>
                        </b-form-group>

                        <b-button
                            type="submit"
                            variant="primary"
                            :disabled="$parent.isAnalyzeDisabled"
                        >
                            <span v-if="$store.state.loading">Analyzing...</span>
                            <span v-else>Analyze</span>
                        </b-button>
                    </b-form>
                </div>
            </div>

            <div class="card mdkp-card" v-if="$store.state.error">
                <div class="card-body">
                    <h4 class="card-title">Error</h4>
                    <b-alert show variant="danger" class="mb-0">
                        {{ $store.state.error }}
                    </b-alert>
                </div>
            </div>

            <div class="card mdkp-card">
                <div class="card-body">
                    <h4 class="card-title">Top Matches</h4>
                    <b-table
                        v-if="$parent.topMatches.length > 0"
                        striped
                        hover
                        responsive
                        :items="$parent.topMatches"
                        :fields="$parent.topMatchFields"
                    >
                        <template #cell()="data">
                            <span v-if="typeof data.value !== 'object'">
                                {{ data.value }}
                            </span>
                            <code v-else>{{ JSON.stringify(data.value) }}</code>
                        </template>
                    </b-table>
                    <div v-else class="text-muted">
                        No top matches returned yet.
                    </div>
                </div>
            </div>

            <div class="card mdkp-card">
                <div class="card-body">
                    <h4 class="card-title">Return JSON</h4>
                    <pre class="phenotype-analyzer-json-box">{{
                        $parent.formattedResult
                    }}</pre>
                </div>
            </div>
        </div>

        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>

<style>
.phenotype-analyzer-json-box {
    min-height: 240px;
    max-height: 620px;
    overflow: auto;
    padding: 16px;
    border: 1px solid #d9e2ec;
    border-radius: 4px;
    background: #f8fafc;
    color: #1f2933;
    font-size: 13px;
    line-height: 1.45;
    white-space: pre-wrap;
    word-break: break-word;
}
</style>
