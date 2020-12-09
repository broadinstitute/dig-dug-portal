<template>
    <div>
        <page-header :disease-group="$parent.diseaseGroup" :front-contents="$parent.frontContents"></page-header>
        <div class="container-fluid mdkp-body">
            <div class="card mdkp-card">
                <div class="card-body">
                    <h1 class="card-title">Complications Viewer</h1>

                    <documentation
                        style="margin-bottom: 30px"
                        name="tools.complicationsviewer.subheader"
                    ></documentation>

                    <h4 class="card-title">Build search criteria</h4>

                    <criterion-list-group
                        v-model="$parent.complicationsViewerSearchCriterion"
                        :looseMatch="true"
                        :header="'Search Criterion'"
                    >
                        <!-- Phenotype Selector -->
                        <filter-enumeration-control
                            class="filter-col-lg"
                            :field="'complication'"
                            :options="$parent.complicationPhenotypeOptions.map((phenotype) => phenotype.name)"
                            :multiple="false"
                            :labelFormatter="
                                (phenotype) =>
                                    !!$store.state.bioPortal.complicationsMap[phenotype]
                                        ? $store.state.bioPortal.complicationsMap[phenotype].name
                                        : phenotype"
                        >
                            <div>
                                <strong>Complication</strong>
                            </div>
                        </filter-enumeration-control>
                        <filter-enumeration-control
                            v-if="$parent.complicationSecondaryPhenotypeOptions"
                            class="filter-col-lg"
                            :field="'secondaryPhenotype'"
                            :options="$parent.complicationSecondaryPhenotypeOptions"
                            :multiple="false"
                            :labelFormatter="
                                (phenotype) =>
                                    !!$store.state.bioPortal.complicationsMap[phenotype]
                                        ? $store.state.bioPortal.complicationsMap[phenotype].name
                                        : phenotype"
                        >
                            <div>
                                <strong>Complication Phenotypes</strong>
                            </div>
                        </filter-enumeration-control>

                        <!-- pValue filter -->
                        <filter-pvalue-control class="filter-col-sm" :field="'pValue'">
                            <div>
                                <strong>P-Value (&le;)</strong>
                            </div>
                        </filter-pvalue-control>
                    </criterion-list-group>

                    <div>
                        <gene-finder-table
                            v-show="
                                $parent.complicationViewerPhenotypes.length > 0 &&
                                $parent.combined.length > 0
                            "
                            :phenotypes="$parent.complicationViewerPhenotypes"
                            :phenotypeMap="$store.state.bioPortal.phenotypeMap"
                            :associations="$parent.combined"
                            :rowsPerPage="20"
                            :exclusive="true"
                            :showPlot="true"
                            :showChiSquared="true"
                        ></gene-finder-table>
                        <div
                            v-if="$parent.complicationViewerPhenotypes.length > 0 &&
                                $parent.combined.length > 0"
                        >
                            <div class="card-body">
                                <h4 class="card-title">
                                    Genome-wide single-variant associations for
                                    {{ $parent.complicationsViewerPhenotype }}
                                </h4>
                                <div
                                    class="row"
                                    v-for="phenotype in $parent.complicationViewerPhenotypes"
                                >
                                    <div class="col-md-6">
                                        <div class="card" style="width: 95%; border: 0">
                                            <raw-img
                                                id="manhattanPlot"
                                                :src="`/api/raw/plot/phenotype/${phenotype}/manhattan.png`"
                                                alt="Manhattan Plot"
                                                :documentation="'phenotype.associationplots.manhattan'"
                                                :content-fill="{phenotype:phenotype}"
                                            />
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="card" style="width: 95%; border: 0">
                                            <raw-img
                                                id="qqPlot"
                                                :src="`/api/raw/plot/phenotype/${phenotype}/qq.png`"
                                                alt="QQ Plot"
                                                :documentation="'phenotype.associationplots.qq'"
                                                :content-fill="{phenotype:phenotype}"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>

<style>
.labele:before {
    content: "*";
    color: red;
}
.labelee:before {
    content: "**";
    color: red;
}
</style>
