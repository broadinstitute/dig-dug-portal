<template>
    <div>
        <!-- Header -->
        <page-header :disease-group="$parent.diseaseGroup" :front-contents="$parent.frontContents"></page-header>

        <!-- Body -->
        <div class="container-fluid mdkp-body">
            <div class="gene-page-header card mdkp-card">
                <div class="row card-body">
                    <div class="col-md-7 gene-page-header-title">
                        Gene
                        <a
                            class="edit-btn"
                            @click="$parent.showHideElement('variantSearchHolder','gene_search_input')"
                        >Search gene</a>
                    </div>

                    <div class="col-md-8 gene-page-header-body">
                        <div id="variantSearchHolder" class="gene-page-header-search-holder hidden">
                            <gene-selectpicker
                                @onGeneChange="$store.dispatch('queryGeneName',$event)"
                            ></gene-selectpicker>
                        </div>
                        <div v-if="$parent.symbolName">
                            <span>
                                {{$parent.symbolName}}
                                <span
                                    v-if="$parent.symbolName.toLowerCase() !== $store.state.geneName.toLowerCase()"
                                >({{$store.state.geneName}})</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- HuGeCalculator -->
            <div class="card mdkp-card">
                <div v-if="$parent.inGWAS" class="card-body">
                    <div class="col-md-10">
                        <h4
                            v-if="$store.state.effectorGeneData.category"
                        >{{$store.state.effectorGeneData.category}}</h4>

                        <div v-if="$store.state.effectorGeneData.genetic" class="alternative-names">
                            <strong>Coding Evidence: &nbsp;</strong>
                            <span
                                v-if="$store.state.effectorGeneData.genetic"
                            >{{$store.state.effectorGeneData.genetic}}</span>&nbsp;
                        </div>
                        <div v-if="$store.state.effectorGeneData.regulatory">
                            <strong>Regulatory Evidence:</strong>
                            <span
                                v-if="$store.state.effectorGeneData.regulatory"
                            >{{$store.state.effectorGeneData.regulatory}}</span>
                        </div>
                        <div>
                            <strong>Perturbational Evidence:</strong>
                            <span
                                v-if="$store.state.effectorGeneData.perturbational"
                            >{{$store.state.effectorGeneData.perturbational}}</span>
                        </div>
                    </div>
                </div>
                <div v-else class="card-body">
                    <h4>{{$store.state.category}}</h4>
                </div>
            </div>
            <div>
                <b-button v-b-toggle.collapse-1 variant="primary">GWAS Associations</b-button>
                <b-collapse id="collapse-1" class="card mdkp-card">
                    <div class="card mdkp-card">
                        <div class="card-body">
                            <h4
                                v-if="$store.state.phenotype"
                                class="card-title"
                            >Associations for {{$store.state.phenotype.name}} in {{$parent.symbolName}}</h4>

                            <locuszoom
                                v-if="$parent.region"
                                ref="locuszoom"
                                :chr="$parent.region.chromosome"
                                :start="$parent.region.start"
                                :end="$parent.region.end"
                                :refSeq="true"
                            >
                                <lz-associations-panel
                                    :phenotype="$store.state.phenotype.name"
                                    :finishHandler="$parent.updateAssociationsTable"
                                ></lz-associations-panel>
                            </locuszoom>
                            <associations-table
                                v-if="$parent.inGWAS"
                                :phenotypes="$parent.phenotypes"
                                :associations="$parent.associationsData"
                            ></associations-table>
                        </div>
                    </div>
                </b-collapse>
            </div>
            <!-- <div v-if="$parent.inGWAS != true" class="card mdkp-card"> -->
            <div class="card mdkp-card">
                <h4>Stage 2</h4>
                <h4 v-if="$store.state.stage2Category">{{$store.state.stage2Category}}</h4>
            </div>
            <div class="card mdkp-card">
                <posterior-probability-plot
                    class="mb-3"
                    v-if="$store.state.geneAssociationsData"
                    :geneassociations="$store.state.geneAssociationsData"
                    :oddsRatio="$store.state.oddsRatio"
                    :stdErr="$store.state.stdErr"
                ></posterior-probability-plot>
            </div>
        </div>

        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
