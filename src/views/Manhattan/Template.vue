<template>
    <div>
        <!-- Header -->
        <page-header></page-header>

        <!-- Body -->
        <div class="container-fluid mdkp-body">
            <div class="gene-page-header card mdkp-card">
                <div class="row card-body">
                    <div class="col-md-4 gene-page-header-title"></div>
                    <div class="col-md-4 gene-page-header-title">
                        Phenotype
                        <a
                            class="edit-btn"
                            onclick="mdkp.utility.showHideElement('phenotypeSearchHolder');"
                        >Set phenotype</a>
                    </div>
                    <div class="col-md-4 gene-page-header-title">
                        Dataset
                        <a
                            class="edit-btn"
                            onclick="mdkp.utility.showHideElement('datasetSearchHolder');"
                        >Set dataset</a>
                    </div>
                    <div class="col-md-4 gene-page-header-body">
                        <span>Manhattan Plot</span>
                    </div>
                    <div class="col-md-4 gene-page-header-body regionInfo">
                        <div
                            id="phenotypeSearchHolder"
                            class="gene-page-header-search-holder"
                            style="display: none;"
                        >
                            <phenotype-selectpicker v-bind:phenotypes="$parent.phenotypes"></phenotype-selectpicker>
                        </div>
                        <span>{{$store.state.phenotypeName}}</span>
                    </div>
                    <div class="col-md-4 gene-page-header-body">
                        <div
                            id="datasetSearchHolder"
                            class="gene-page-header-search-holder"
                            style="display: none;"
                        >
                            <dataset-selectpicker v-bind:datasets="$parent.datasetList"></dataset-selectpicker>
                        </div>
                        <span>{{$store.state.datasetName}}</span>
                    </div>
                </div>
            </div>

            <div class="card mdkp-card">
                <div class="card-body">
                    <manhattan-plot
                        v-bind:variants="$store.state.manhattan.variants"
                        v-bind:dataset="$store.state.selectedDataset"
                        v-bind:phenotype="$store.state.selectedPhenotype"
                    ></manhattan-plot>
                </div>
            </div>
            <div class="card mdkp-card">
                <div class="card-body">
                    <mplot-variants-table v-if="$store.state.manhattan.variants != null"></mplot-variants-table>
                </div>
            </div>
        </div>

        <!-- Footer-->
        <page-footer></page-footer>
    </div>
</template>
