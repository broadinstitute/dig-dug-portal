<template>
    <div>
        <!-- Header -->
        <page-header :disease-group="$parent.diseaseGroup" :front-contents="$parent.frontContents"></page-header>

        <!-- Body -->
        <div class="container-fluid mdkp-body">
            <div class="gene-page-header card mdkp-card">
                <div class="row card-body">
                    <div class="col-md-8 gene-page-header-title">Variant</div>
                    <div class="col-md-4 gene-page-header-title">
                        <a class="edit-btn">Set Variant</a>
                    </div>
                    <div class="col-md-8 gene-page-header-body">
                        <span>
                            {{$parent.variantData.varId}}
                            <span
                                v-if="$parent.variantData.dbSNP"
                            >/ {{$parent.variantData.dbSNP}}</span>
                        </span>
                    </div>
                    <!-- change this class to variantInfo -->
                    <div class="col-md-4 gene-page-header-body variantInfo">
                        <div id="variantSearchHolder" class="gene-page-header-search-holder">
                            <div class="variant-search">
                                <div class="col-md-10 input-wrapper">
                                    <input
                                        v-model="$store.state.newVariantID"
                                        type="text"
                                        class="form-control input-default"
                                        style="margin-left: 15px;padding-top: 30px;padding-left:30px"
                                        placeholder="Search Variant"
                                        @change="$store.dispatch('queryVariant')"
                                    />
                                </div>
                            </div>
                        </div>
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
                <div class="card mdkp-card">
                    <div class="card-body">
                        <h4 class="card-title">Phenotype-Wide Associations (PheWAS)</h4>
                        <locuszoom

                            v-bind:panels="['phewas']"

                            v-bind:phewas="{
                              'data': $parent.lzAssociations,
                              'translator': $parent.lzAssociationsTransform
                            }"

                            v-bind:chr="$store.state.variant.data[0].chromosome"
                            v-bind:start="$store.state.variant.data[0].position"
                            v-bind:end="$store.state.variant.data[0].position + 1"

                        ></locuszoom>
                        <phewas-table
                            :associations="$parent.variantData.associations"
                            :phenotype-map="$store.state.bioPortal.phenotypeMap"
                        ></phewas-table>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
