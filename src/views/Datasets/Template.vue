<template>
    <div>
        <!-- Header -->
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
        ></page-header>

        <!-- Body -->
        <div class="container-fluid mdkp-body">
            <div class="card mdkp-card dataset-page-header">
                <div class="row card-body">
                    <div class="col-md-12">
                        <h2 v-if="!!$parent.diseaseGroup">
                            {{ $parent.diseaseGroup.description }} KP Datasets
                        </h2>
                    </div>
                </div>
            </div>
            <div class="card mdkp-card">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-12">
                            <criterion-list-group
                                v-if="!!$parent.datasetsList"
                                v-model="$parent.datasetsSearchCriterion"
                                :looseMatch="true"
                                :header="'Search Criterion'"
                            >
                                <filter-enumeration-control
                                    class="filter-col-lg"
                                    :field="'field_phenotypes'"
                                    :pillFormatter="
                                        (filter) => filter.threshold
                                    "
                                    :options="
                                        $parent.datasetsPhenotypeOptions.map(
                                            (dataset) => dataset
                                        )
                                    "
                                    :multiple="true"
                                    :labelFormatter="(dataset) => dataset"
                                >
                                    <div>
                                        <strong>Search by phenotypes</strong>
                                    </div>
                                </filter-enumeration-control>
                            </criterion-list-group>

                            <portal-datasets-list-table
                                :diseaseGroups="
                                    $store.state.bioPortal.diseaseGroups
                                "
                                :diseaseGroup="$parent.diseaseGroup"
                                :datasetsList="$parent.datasetsList"
                                :phenotypes="$store.state.bioPortal.phenotypes"
                            ></portal-datasets-list-table>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
