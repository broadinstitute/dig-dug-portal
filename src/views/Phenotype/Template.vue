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
                        >Set phenotype</a>
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
                        <h4
                            class="card-title"
                        >Genome-wide associations for {{$store.state.phenotype.description}}</h4>
                        <div class="row">
                            <div class="col-md-6">
                                <div class="card" style="width:95%; border: 0">
                                    <raw-img
                                        id="manhattanPlot"
                                        :src="$parent.manhattanPlot"
                                        alt="Card image cap"
                                        :documentation="'phenotype.associationplots.manhattan'"
                                        :content-fill="$store.getters['documentationMap']"
                                    />
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="card" style="width:95%; border: 0">
                                    <raw-img
                                        id="qqPlot"
                                        :src="$parent.qqPlot"
                                        alt="Card image cap"
                                        :documentation="'phenotype.associationplots.qq'"
                                        :content-fill="$store.getters['documentationMap']"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card mdkp-card">
                    <div class="card-body">
                        <h4 class="card-title">
                            Top {{$parent.intFormatter($store.state.associations.data.length)}} associations for {{$store.state.phenotype.description}}
                            <tooltip-documentation
                                name="phenotype.top1000.tooltip"
                                :content-fill="$parent.documentationMap"
                                :isHover="true"
                                :noIcon="false"
                            ></tooltip-documentation>
                        </h4>
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
                        >Datasets contributing to meta-analysis for {{$store.state.phenotype.description}}</h4>
                        <documentation
                            name="pheno.assocdatasets.subheader"
                            :content-fill="$parent.documentationMap"
                        ></documentation>
                        <datasets-table
                            :datasets="$store.state.bioPortal.datasets"
                            :phenotype="$store.state.phenotype"
                        ></datasets-table>
                    </div>
                </div>

                <div class="card mdkp-card">
                    <div class="card-body">
                        <h4 class="card-title">
                            Globally enriched annotations for {{$store.state.phenotype.description}}
                            <tooltip-documentation
                                name="phenotype.annot.tooltip"
                                :content-fill="$parent.documentationMap"
                                :isHover="true"
                                :noIcon="false"
                            ></tooltip-documentation>
                        </h4>
                        <documentation
                            name="pheno.globalenrich.subheader"
                            :content-fill="$parent.documentationMap"
                        ></documentation>

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
