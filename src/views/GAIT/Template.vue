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
                        <h2>Genetic Association Interactive Tool</h2>
                    </div>
                </div>
            </div>
            <div class="card mdkp-card">
                <div class="card-body">
                    <h4 class="card-title">Search Criteria</h4>

                    <filter-list-group
                        v-model="$parent.geneFinderSearchCriterion"
                        :looseMatch="true"
                        :header="'Search Criterion'"
                    >
                        <filter-enumeration-control
                            :field="'phenotype'"
                            :multiple="true"
                            :options="
                                $store.state.ldServer.phenotypes.map(
                                    (phenotype) => phenotype.name
                                )
                            "
                            :labelFormatter="
                                (phenotype) =>
                                    !!$store.state.bioPortal.phenotypeMap[
                                        phenotype
                                    ]
                                        ? $store.state.bioPortal.phenotypeMap[
                                              phenotype
                                          ].description
                                        : phenotype
                            "
                        >
                            <div class="label">Phenotypes</div>
                        </filter-enumeration-control>
                        <filter-enumeration-control
                            :field="'gene'"
                            :color="'orange'"
                            :options="
                                $store.state.genes.map((gene) => gene.gene)
                            "
                        >
                            <div class="label">Gene</div>
                        </filter-enumeration-control>

                        <filter-enumeration-control
                            :field="'mask'"
                            :multiple="true"
                            :options="$parent.masks.map((v) => v.value)"
                            :labelFormatter="
                                (v) =>
                                    $parent.masks.find((o) => o.value === v)
                                        .text
                            "
                            ><div class="label">
                                Masks
                            </div></filter-enumeration-control
                        >

                        <filter-enumeration-control
                            :field="'dataset'"
                            :options="$parent.datasets.map((v) => v.value)"
                            :labelFormatter="
                                (v) =>
                                    $parent.datasets.find((o) => o.value === v)
                                        .text
                            "
                            ><div class="label">
                                Dataset
                            </div></filter-enumeration-control
                        >
                        <template slot="filtered" slot-scope="{ filter }">
                        </template>
                    </filter-list-group>

                    <a
                        href="#"
                        @click="
                            $parent.set_covariates = !$parent.set_covariates
                        "
                        ><b-icon-chevron-right
                            v-show="!$parent.set_covariates"
                        ></b-icon-chevron-right>
                        <b-icon-chevron-down
                            v-show="$parent.set_covariates"
                        ></b-icon-chevron-down>
                        Set covariates (Optional)</a
                    >

                    <b-collapse :visible="$parent.set_covariates"
                        >principal</b-collapse
                    >

                    <b-form-checkbox
                        v-model="$parent.auto_select"
                        name="auto_select"
                    >
                        Auto select variants
                        <b>(Checked: {{ $parent.auto_select }})</b>
                    </b-form-checkbox>

                    <b-collapse :visible="!$parent.auto_select"
                        >manual select</b-collapse
                    >

                    <div style="text-align: center">
                        <b-button
                            variant="primary"
                            @click="$parent.searchVariants"
                            :disabled="
                                $parent.selectedPhenotypes.length == 0 ||
                                $parent.selectedGene.length == 0 ||
                                $parent.selectedMasks.length == 0
                            "
                            >Search Variants</b-button
                        >
                    </div>

                    <div class="variants" v-if="$parent.tableData.length > 0">
                        <b-table
                            striped
                            hover
                            :items="$parent.tableData"
                            :per-page="$parent.perPage"
                            :current-page="$parent.currentPage"
                        >
                            <template #cell(selected)="data">
                                <b-form-group>
                                    <input
                                        type="checkbox"
                                        v-model="data.item.selected"
                                    />
                                </b-form-group>
                            </template>
                        </b-table>
                        <b-pagination
                            v-model="$parent.currentPage"
                            :total-rows="$parent.tableData.length"
                            :per-page="$parent.perPage"
                            aria-controls="variant-table"
                        ></b-pagination>
                    </div>

                    <div style="text-align: center">
                        <b-button
                            variant="primary"
                            @click="$parent.searchCovariances"
                            >Search Covariances</b-button
                        >
                    </div>
                    <div
                        id="covariances"
                        v-if="$store.state.ldServer.covariances"
                    >
                        <b-table
                            striped
                            hover
                            :items="$store.state.ldServer.covariances.variants"
                            :per-page="$parent.perPage"
                            :current-page="$parent.currentPage2"
                        >
                        </b-table>
                        <b-pagination
                            v-if="$store.state.ldServer.covariances.variants"
                            v-model="$parent.currentPage2"
                            :total-rows="
                                $store.state.ldServer.covariances.variants
                                    ? $store.state.ldServer.covariances.variants
                                          .length
                                    : 0
                            "
                            :per-page="$parent.perPage"
                            aria-controls="covariances-table"
                        ></b-pagination>
                    </div>

                    <div v-if="$store.state.ldServer.covariances.groups">
                        <strong>Covariances:</strong>
                        {{
                            $store.state.ldServer.covariances.groups[0]
                                .covariance
                        }}
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
