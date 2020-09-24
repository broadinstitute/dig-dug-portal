<template>
    <div>
        <!-- Header -->
        <page-header :disease-group="$parent.diseaseGroup" :front-contents="$parent.frontContents"></page-header>

        <!-- Body -->
        <div class="container-fluid mdkp-body">
            <div class="gene-page-header card mdkp-card">
                <div class="row card-body">
                    <div class="col-md-8 gene-page-header-title">
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
                        >Set Prior Variance</a>
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
                            <div class="input-group">
                                <input
                                    class="form-control input-default"
                                    v-model.number="$store.state.priorVariance"
                                    type="number"
                                    placeholder="Prior Variance"
                                    id="prior_variance_input"
                                />
                            </div>
                        </div>
                        <span>{{$store.state.priorVariance}}</span>
                    </div>
                </div>
            </div>

            <div class="card mdkp-card">
                <div class="card-body">
                    <b-container class="bv-example-row bv-example-row-flex-cols" fluid>
                        <b-row class="mb-3 border-right">
                            <b-col md="6">
                                <b-row class="mb-3 border-right">
                                    <b-col
                                        class="col-md-auto"
                                        v-if="$parent.isSignificantAssociationCommonVariation"
                                    >
                                        <h5>Stage 1</h5>
                                        <documentation
                                            name="hugecal.stage1.subheader"
                                            :content-fill="$parent.documentationMap"
                                        ></documentation>
                                        <strong v-if="$store.state.effectorGeneData.category">
                                            {{$store.state.effectorGeneData.category}}:
                                            <span
                                                v-if="$store.state.effectorGeneData.genetic"
                                            >{{$store.state.effectorGeneData.genetic}}</span>&nbsp;
                                        </strong>
                                        <div v-if="$parent.category">
                                            <strong
                                                v-if="$parent.category.length >1"
                                            >{{$parent.category}}</strong>
                                        </div>

                                        <div v-if="$store.state.effectorGeneData.genomic">
                                            <strong>
                                                Regulatory Evidence:
                                                <span
                                                    v-if="$store.state.effectorGeneData.genomic"
                                                >{{$store.state.effectorGeneData.genomic}}</span>&nbsp;
                                            </strong>
                                        </div>
                                        <div>
                                            <strong>
                                                Perturbational Evidence:
                                                <span
                                                    v-if="$store.state.effectorGeneData.perturbational"
                                                >{{$store.state.effectorGeneData.perturbational}}</span>&nbsp;
                                            </strong>
                                        </div>
                                    </b-col>
                                    <b-col class="col-md-auto" v-else>
                                        <h5>Stage 1</h5>
                                        <documentation
                                            name="hugecal.stage1.subheader"
                                            :content-fill="$parent.documentationMap"
                                        ></documentation>
                                        <strong>No Evidence.The {{$store.state.geneName}} is not genome wide significant</strong>
                                    </b-col>
                                </b-row>
                                <b-row
                                    class="mb-3 border-right"
                                    v-if="$store.state.effectorGeneData.category"
                                >
                                    <b-col
                                        v-if="$store.state.effectorGeneData.category != 'CAUSAL'"
                                    >
                                        <h5>Stage 2</h5>
                                        <documentation
                                            name="hugecal.stage2.subheader"
                                            :content-fill="$parent.documentationMap"
                                        ></documentation>
                                        <div v-if="$parent.geneAssociations52k">
                                            <div
                                                v-if="$parent.isSignificant52kAssociationRareVariation"
                                            >
                                                <strong>{{$parent.stage2Category.category}}:{{$parent.stage2Category.Evidence}}</strong>
                                            </div>
                                            <posterior-probability-plot
                                                v-else
                                                :geneAssociationsData="$parent.geneAssociations52k"
                                                :priorVariance="$store.state.priorVariance"
                                                :isDichotomous="true"
                                            ></posterior-probability-plot>
                                        </div>
                                    </b-col>
                                    <b-col v-else>
                                        <h5>Stage 2</h5>
                                        <documentation
                                            name="hugecal.stage2.subheader"
                                            :content-fill="$parent.documentationMap"
                                        ></documentation>
                                        <strong>{{$store.state.geneName}} is Causal</strong>
                                    </b-col>
                                </b-row>

                                <b-row class="mb-3 border-right">
                                    <b-col md="10">
                                        <h5 class="card-title">Stage 3</h5>
                                        <documentation
                                            name="hugecal.stage3.subheader"
                                            :content-fill="$parent.documentationMap"
                                        ></documentation>
                                        <div v-if="$parent.geneAssociations52k">
                                            <div v-if="$parent.geneAssociationsLoftee.length >0">
                                                <forest-plot :data="$parent.geneAssociationsLoftee"></forest-plot>
                                            </div>
                                            <div v-else>
                                                <strong>There are no loss-of-function variants detected in this gene</strong>
                                            </div>
                                        </div>
                                    </b-col>
                                </b-row>
                            </b-col>
                            <b-col md="6" class="ml-auto p-3">
                                <b-row>
                                    <documentation
                                        name="hugecal.explore.docs"
                                        :content-fill="$parent.documentationMap"
                                    ></documentation>
                                </b-row>
                            </b-col>
                        </b-row>
                    </b-container>
                </div>
            </div>
            <div class="huge-calculator-show-associations-wrapper">
                <b-button
                    block
                    v-on:click="() => $parent.showAssociations == true ? $parent.showAssociations = false : $parent.showAssociations=true"
                    class="btn-sm huge-calculator-show-associations to-previous-page"
                >Show Associations Data</b-button>
            </div>
            <div class="card mdkp-card" v-if="$parent.showAssociations">
                <div class="card-body">
                    <div id="gwasAssocHolder" class="mdkp-card">
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
                            :phenotypes="$parent.phenotypes"
                            :associations="$parent.associationsData"
                        ></associations-table>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>


