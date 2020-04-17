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
                <div v-show="$parent.transcriptConsequence">
                    <transcript-consequence-table
                        v-bind:transcriptConsequence="$parent.transcriptConsequence"
                    ></transcript-consequence-table>
                </div>
                <div v-show="$parent.transcriptionFactors">
                    <transcription-factors-table
                        v-bind:transcriptionFactors="$parent.transcriptionFactors"
                    ></transcription-factors-table>
                </div>
                <div v-show="$parent.intergenicConsequence">
                    <intergenicConsequence-table
                        v-bind:intergenicConsequence="$parent.intergenicConsequence"
                    ></intergenicConsequence-table>
                </div>
                <div v-show="$parent.regulatoryConsequence">
                    <regulatoryConsequence-table
                        v-bind:regulatoryConsequence="$parent.regulatoryConsequence"
                    ></regulatoryConsequence-table>
                </div>
            </div>
            <div class="card mdkp-card">
                <locuszoom
                    ref="lz"
                    v-if="$store.state.variant.data.length>0"
                    v-bind:panels="['phewas']"
                    v-bind:modules="[
                            { 'module': 'variant',
                              'target': 'phewas',
                              'translator': $parent.translatedAssociationsFromVariant },
                        ]"
                    v-bind:chr="$store.state.variant.data.chromosome"
                    v-bind:position="$store.state.variant.data.position"
                ></locuszoom>
            </div>
        </div>

        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
