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
                    <div class="col-md-4 gene-page-header-title">
                        Prior Variance
                        <a
                            class="edit-btn"
                            @click="$parent.showHideElement('priorVarianceHolder','prior_variance_input')"
                        >Enter Prior Variance</a>
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
                    <div class="col-md-4 gene-page-header-body">
                        <div id="priorVarianceHolder" class="gene-page-header-search-holder hidden">
                            <input
                                v-model="$store.state.priorVariance"
                                type="text"
                                class="form-control input-default"
                                placeholder="Prior Variance"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div class="card mdkp-card">
                <div class="card-body">
                    <h4 class="card-title">Gene associations for Type 2 Diabetes</h4>
                    <div class="row">
                        <div class="col-xs-6 col-md-4">
                            <div class="card" style="width:95%; border: 0">
                                <h4
                                    v-if="$store.state.effectorGeneData.category"
                                >{{$store.state.effectorGeneData.category}}</h4>
                                <div v-if="$parent.category">
                                    <h4 v-if="$parent.category.length >1">{{$parent.category}}</h4>
                                </div>

                                <div
                                    v-if="$store.state.effectorGeneData.genetic"
                                    class="alternative-names"
                                >
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
                        <div class="col-xs-6 col-md-4">
                            <div
                                v-if="$parent.geneAssociations"
                                class="card"
                                style="width:95%; border: 0"
                            >
                                <posterior-probability-plot
                                    :geneAssociationsData="$parent.geneAssociations"
                                    :priorVariance="$store.state.priorVariance"
                                    :isDichotomous="true"
                                ></posterior-probability-plot>
                            </div>
                        </div>
                        <div class="col-xs-6 col-md-4">
                            <div
                                v-if="$parent.geneAssociations"
                                class="card"
                                style="width:95%; border: 0"
                            >
                                <forest-plot
                                    v-if="$parent.geneAssociationsLoftee.length >0"
                                    :data="$parent.geneAssociationsLoftee"
                                ></forest-plot>
                            </div>
                        </div>
                    </div>
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
        </div>

        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>


