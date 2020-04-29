<template>
    <div>
        <!-- Header -->
        <page-header :disease-group="$parent.diseaseGroup" :front-contents="$parent.frontContents"></page-header>

        <!-- Body -->
        <div class="container-fluid mdkp-body">
            <div class="gene-page-header card mdkp-card">
                <div class="row card-body">
                    <div class="col-md-12 gene-page-header-title">
                        Variant
                        <a
                            class="edit-btn"
                            v-on:click="$parent.showHideElement('variantSearchHolder','variant_search_input')"
                        >Set variant</a>
                    </div>
                    <div class="col-md-12 gene-page-header-body">
                        <div id="variantSearchHolder" class="gene-page-header-search-holder hidden">
                            <div class="col-md-5">
                                <input
                                    v-model="$store.state.newVariantID"
                                    type="text"
                                    class="form-control input-default"
                                    placeholder="Search Variant"
                                    id="variant_search_input"
                                />
                            </div>
                            <div class="col-md-1 input-wrapper">
                                <button
                                    id="variantSearchGo"
                                    class="btn btn-primary"
                                    type="button"
                                    @click="$store.dispatch('queryVariant', $store.state.newVariantID)"
                                >GO</button>
                            </div>
                            <div class="col-md-6 search-example">
                                <strong>Search format examples</strong>
                                <br />rs11716727, chr3:12489012_C_T, 3_12489012_C/T, 3:12489012_C/T, chr3:12489012:C:T
                            </div>
                        </div>
                        <span v-if="$parent.variantData">
                            {{$parent.variantData.varId}}
                            <span
                                v-if="$parent.variantData.dbSNP"
                            >/ {{$parent.variantData.dbSNP}}</span>
                        </span>
                    </div>
                </div>
            </div>

            <div v-if="$parent.variantData">
                <div class="card mdkp-card">
                    <div class="card-body">
                        <h4 class="card-title">Most Severe Consequence</h4>
                        <div>{{$parent.consequence}} &mdash; {{$parent.consequenceMeaning}}</div>
                    </div>
                </div>
                <div class="card mdkp-card">
                    <div class="card-body">
                        <h4 class="card-title">PheWAS Associations</h4>
                        <locuszoom :panels="['phewas']" :phewas="$parent.lzAssociations"></locuszoom>
                        <phewas-table
                            :associations="$parent.variantData.associations"
                            :phenotype-map="$store.state.bioPortal.phenotypeMap"
                        ></phewas-table>
                    </div>
                </div>
                <div class="card mdkp-card">
                    <div class="card-body">
                        <h4 class="card-title">Transcript Consequences</h4>
                        <div v-if="$parent.variantData.transcriptConsequences">
                            <transcript-consequence-table
                                v-bind:transcriptConsequences="$parent.variantData.transcriptConsequences"
                            ></transcript-consequence-table>
                        </div>
                        <div v-else class="card-body">
                            <h4>None found</h4>
                        </div>
                    </div>
                </div>
                <div class="card mdkp-card">
                    <div class="card-body">
                        <h4 class="card-title">Transcription Factors</h4>
                        <div v-if="$parent.variantData.transcriptionFactors">
                            <transcription-factors-table
                                v-bind:transcriptionFactors="$parent.variantData.transcriptionFactors"
                            ></transcription-factors-table>
                        </div>
                        <div v-else class="card-body">
                            <h4>None found</h4>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
