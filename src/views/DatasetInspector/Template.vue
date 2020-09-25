<template>
    <div>
        <!-- Header -->
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
        ></page-header>

        <!-- Body -->
        <div class="container-fluid mdkp-body">
            <div class="card mdkp-card gene-page-header">
                <div class="row card-body">
                    <div class="col-md-8 gene-page-header-title">
                        Dataset
                        <a
                            class="edit-btn"
                            v-on:click="
                                () =>
                                    $parent.showHideElement(
                                        'datasetSearchHolder',
                                        'dataset_search'
                                    )
                            "
                            >Select datasets</a
                        >
                    </div>
                    <div class="col-md-4 gene-page-header-title">
                        Phenotype
                        <a
                            class="edit-btn"
                            v-on:click="
                                () =>
                                    $parent.showHideElement(
                                        'phenotypeSearchHolder'
                                    )
                            "
                            >Select phenotype</a
                        >
                    </div>

                    <div class="col-md-8 gene-page-header-body">
                        <div
                            id="datasetSearchHolder"
                            class="gene-page-header-search-holder hidden"
                        >
                            <dataset-selectpicker
                                v-if="$store.state.bioPortal.datasetMap"
                                :datasets="$store.state.bioPortal.datasets"
                            ></dataset-selectpicker>
                        </div>
                        <span v-if="$store.state.selectedDataset">{{
                            $store.state.selectedDataset.description
                        }}</span>
                    </div>

                    <div class="col-md-4 gene-page-header-body">
                        <div
                            id="phenotypeSearchHolder"
                            class="gene-page-header-search-holder hidden"
                        >
                            <phenotype-selectpicker
                                v-if="$store.state.bioPortal.phenotypeMap"
                                :phenotypes="$parent.datasetPhenotypes"
                            ></phenotype-selectpicker>
                        </div>
                        <span v-if="$store.state.selectedPhenotype">{{
                            $store.state.selectedPhenotype.description
                        }}</span>
                    </div>
                </div>
            </div>

            <div v-if="$store.state.selectedPhenotype" class="card mdkp-card">
                <div class="card-body">
                    <h4 class="card-title">
                        {{ $store.state.selectedPhenotype.description }}
                        association plots
                    </h4>
                    <!-- TODO: phenotype select -->
                    <div class="row">
                        <div class="col-md-6">
                            <div
                                v-if="$parent.manhattanPlot"
                                class="card"
                                style="width: 95%; border: 0"
                            >
                                <raw-img
                                    :src="$parent.manhattanPlot"
                                    alt="Card image cap"
                                    :documentation="'dinspector.associationplots.manhattan'"
                                    :content-fill="$parent.documentationMap"
                                />
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div
                                v-if="$parent.qqPlot"
                                class="card"
                                style="width: 95%; border: 0"
                            >
                                <raw-img
                                    :src="$parent.qqPlot"
                                    alt="Card image cap"
                                    :documentation="'dinspector.associationplots.qq'"
                                    :content-fill="$parent.documentationMap"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="$store.state.selectedPhenotype" class="card mdkp-card">
                <div class="card-body">
                    <h4 v-if="$store.state.selectedDataset" class="card-title">
                        Top
                        {{
                            $parent.intFormatter(
                                $store.state.datasetAssociations.data.length
                            )
                        }}
                        variants for
                        {{ $store.state.selectedDataset.description }}
                    </h4>
                    <associations-table
                        :phenotypes="[$store.state.selectedPhenotype]"
                        :associations="$store.state.datasetAssociations.data"
                    ></associations-table>
                    <unauthorized-message
                        :restricted="
                            $store.state.datasetAssociations.restricted
                        "
                        :failed="$store.state.datasetAssociations.error"
                    ></unauthorized-message>
                </div>
            </div>
            <div v-else class="card mdkp-card">
                <div class="card-body">
                    <h4 class="card-title">
                        Select phenotype for associations
                    </h4>
                </div>
            </div>

            <div class="card mdkp-card">
                <div class="card-body">
                    <h4 class="card-title">Dataset Description</h4>
                    <div class="row">
                        <div class="col-md-12">
                            <dataset-info-section
                                :datasetInfo="$parent.datasetInfo"
                            ></dataset-info-section>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
