<template>
    <div>
        <!-- Header -->
        <page-header :disease-group="$parent.diseaseGroup" :front-contents="$parent.frontContents"></page-header>

        <!-- Body -->
        <div class="container-fluid mdkp-body">
            <div class="gene-page-header card mdkp-card">
                <div class="row card-body">
                    <div class="col-md-4 gene-page-header-title"></div>
                    <!-- change this to variantSearchHolder 
                    mdkp.utility.showHideElement('phenotypeSearchHolder')
                    -->
                    <div class="col-md-4 gene-page-header-title">
                        Variant
                        <a
                            class="edit-btn"
                            onclick="mdkp.utility.showHideElement('variantSearchHolder');"
                        >Set variant ID</a>
                    </div>
                    <div class="col-md-4 gene-page-header-title"></div>
                    <div class="col-md-4 gene-page-header-body">
                        <span>
                            Variant Info
                            {{$store.state.variantID}}
                        </span>
                    </div>
                    <!-- change this class to variantInfo -->
                    <div class="col-md-4 gene-page-header-body variantInfo">
                        <div
                            id="variantSearchHolder"
                            class="gene-page-header-search-holder"
                            style="display: none;"
                        >
                            <div class="variant-search">
                                <div class="col-md-10 input-wrapper">
                                    <input
                                        v-model="$store.state.newVariantID"
                                        type="text"
                                        class="form-control input-default"
                                        style="margin-left: 15px;padding-top: 30px;padding-left:30px"
                                        placeholder="Search Variant"
                                    />

                                    <div class="col-md-2 input-wrapper">
                                        <button
                                            id="variantSearchGo"
                                            class="btn btn-primary"
                                            type="button"
                                            @click="$store.dispatch('queryVariant')"
                                        >GO</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-10">
                <div v-if="$parent.transcriptConsequence.length">
                    <transcript-consequence-table
                        v-bind:transcriptConsequence="$parent.transcriptConsequence"
                    ></transcript-consequence-table>
                </div>
                <div v-if="$parent.transcriptionFactors">
                    <transcription-factors-table
                        v-bind:transcriptionFactors="$parent.transcriptionFactors"
                    ></transcription-factors-table>
                </div>
                <div v-if="$parent.intergenicConsequence">
                    <intergenicConsequence-table
                        v-bind:intergenicConsequence="$parent.intergenicConsequence"
                    ></intergenicConsequence-table>
                </div>
            </div>
            <locuszoom
                ref="lz"
                v-if="$parent.associations !== null"
                v-bind:panels="['association','phewas']"
                v-bind:modules="[
                            { 'module': 'associations',
                              'target': 'assoc',
                              'translator': $parent.associationsForLZ },
                        ]"
                v-bind:chr="$store.state.chr"
                v-bind:start="$store.state.start"
                v-bind:end="$store.state.end"
            ></locuszoom>
        </div>

        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
