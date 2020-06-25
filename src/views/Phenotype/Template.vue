<template>
    <div>
        <!-- Header -->
        <page-header :disease-group="$parent.diseaseGroup" :front-contents="$parent.frontContents"></page-header>

        <!-- Body -->
        <div class="container-fluid mdkp-body">
            <div class="gene-page-header card mdkp-card">
                <div class="row card-body">
                    <div class="col-md-12 gene-page-header-title">
                        Phenotype
                        <a
                            class="edit-btn"
                            v-on:click="$parent.showHideElement('phenotypeSearchHolder')"
                        >Select phenotype</a>
                    </div>

                    <div class="col-md-12 gene-page-header-body">
                        <div
                            id="phenotypeSearchHolder"
                            class="gene-page-header-search-holder hidden"
                        >
                            <phenotype-selectpicker
                                v-if="$store.state.phenotype"
                                :phenotypes="$store.state.bioPortal.phenotypes"
                                :default-phenotype="$store.state.phenotype.description"
                            ></phenotype-selectpicker>
                        </div>
                        <span v-if="$store.state.phenotype">{{$store.state.phenotype.description}}</span>
                    </div>
                </div>
            </div>

            <div v-if="$store.state.phenotype">
                <div class="card mdkp-card">
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h4 class="card-title">Association Plots</h4>
                                <b-tabs content-class="mt-3">
                                    <b-tab title="Manhattan" active>
                                        <img style="width: 100%" :src="$parent.manhattanPlot" />
                                    </b-tab>
                                    <b-tab title="QQ">
                                        <img style="width: 100%" :src="$parent.qqPlot" />
                                    </b-tab>
                                </b-tabs>
                            </div>
                            <div class="col-md-6">
                                <h4 class="card-title">Documentation</h4>
                                <documentation
                                    name="phenotype.associationplots.description"
                                    :content-fill="$store.getters['documentationMap']"
                                ></documentation>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card mdkp-card">
                    <div class="card-body">
                        <h4
                            class="card-title"
                        >Genome-wide, bottom-line associations for {{$store.state.phenotype.description}}</h4>
                        <associations-table
                            :phenotypes="[$store.state.phenotype]"
                            :associations="$store.state.associations.data"
                            :per-page="10"
                        ></associations-table>
                    </div>
                </div>

                <div class="card mdkp-card">
                    <div class="card-body">
                        <h4
                            class="card-title"
                        >Datasets Associated with {{$store.state.phenotype.description}}</h4>
                        <datasets-table
                            :datasets="$store.state.bioPortal.datasets"
                            :phenotype="$store.state.phenotype"
                        ></datasets-table>
                    </div>
                </div>

                <div class="card mdkp-card">
                    <div class="card-body">
                        <h4
                            class="card-title"
                        >Globally Enriched Annotations for {{$store.state.phenotype.description}}</h4>
                        <enrichment-table
                            :phenotypes="[$store.state.phenotype]"
                            :annotations="$store.state.annotations.data"
                            :per-page="10"
                        ></enrichment-table>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
