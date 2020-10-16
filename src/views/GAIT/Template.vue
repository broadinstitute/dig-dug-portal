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

                    <filter-group
                        v-model="$parent.associationsFilter"
                        :looseMatch="true"
                    >
                        <filter-enumeration-control
                            :field="'phenotype'"
                            :options="
                                $store.state.bioPortal.phenotypes.map(
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
                        <filter-pvalue-control :field="'pValue'">
                            <div class="label">P-Value (&le;)</div>
                        </filter-pvalue-control>
                    </filter-group>

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
                        <b-button variant="primary">Search Variants</b-button>
                    </div>

                    <div class="row">results</div>
                </div>
            </div>
        </div>

        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
