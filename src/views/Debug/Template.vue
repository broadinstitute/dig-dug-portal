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
                    <b-container fluid class="bv-example-row bv-example-row-flex-cols">
                        <b-row class="mb-3">
                            <b-col md="8">
                                <h4 class="card-title">Gene associations for Type 2 Diabetes</h4>
                                <b-row class="mb-3">
                                    <b-col class="col-md-auto">
                                        <h4 class="card-title">Stage 1</h4>
                                        <strong
                                            v-if="$store.state.effectorGeneData.category"
                                        >Category: {{$store.state.effectorGeneData.category}}</strong>
                                        <div v-if="$parent.category">
                                            <strong
                                                v-if="$parent.category.length >1"
                                            >{{$parent.category}}</strong>
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
                                    </b-col>
                                </b-row>
                                <b-row class="mb-3">
                                    <b-col>
                                        <h4 class="card-title">Stage 2</h4>

                                        <div v-if="$parent.geneAssociations">
                                            <posterior-probability-plot
                                                :geneAssociationsData="$parent.geneAssociations"
                                                :priorVariance="$store.state.priorVariance"
                                                :isDichotomous="true"
                                            ></posterior-probability-plot>
                                        </div>
                                    </b-col>
                                </b-row>
                                <b-row class="mb-3">
                                    <b-col md="6" class="p-3">
                                        <h4 class="card-title">Stage 3</h4>
                                        <div v-if="$parent.geneAssociations">
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
                            <b-col md="4" class="ml-auto p-3">
                                <documentation
                                    name="hugecal.explore.docs"
                                    :content-fill="$parent.documentationMap"
                                ></documentation>
                            </b-col>
                        </b-row>
                    </b-container>
                </div>
            </div>

            <div class="card mdkp-card">
                <div class="card-body">
                    <b-button
                        block
                        variant="info"
                        v-on:click="() => $parent.showAssociations == true ? $parent.showAssociations = false : $parent.showAssociations=true"
                    >Show Associations Data</b-button>

                    <div id="gwasAssocHolder" class="mdkp-card" v-if="$parent.showAssociations">
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
            </div>
        </div>

        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>


