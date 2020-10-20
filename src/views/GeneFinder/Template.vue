<template>
    <div>
        <page-header :disease-group="$parent.diseaseGroup" :front-contents="$parent.frontContents"></page-header>
        <div class="card mdkp-card">
            <div class="card-body">
                <h4 class="card-title">
                    Gene Finder
                    <tooltip-documentation
                        name="phenotype.top1000.tooltip"
                        :content-fill="$parent.documentationMap"
                        :isHover="true"
                        :noIcon="false"
                    ></tooltip-documentation>
                </h4>

                <!-- <documentation style="margin-bottom: 30px" name="tools.genefinder.subheader"></documentation> -->

                <h5 class="card-title">
                    Build search criteria
                    <tooltip-documentation
                        name="phenotype.top1000.tooltip"
                        :content-fill="$parent.documentationMap"
                        :isHover="true"
                        :noIcon="false"
                    ></tooltip-documentation>
                </h5>

                <div class="labele" id="req">Multiple phenotypes can be selected.</div>
                <div
                    style="margin-bottom: 30px"
                    class="labelee"
                    id="req"
                >Required for search, otherwise returns genes with p-value<=0.05.</div>

                <!-- <documentation name="tools.genefinder.buildcriteria.subheader"></documentation> -->

                <filter-group
                    v-model="$parent.geneFinderSearchCriterion"
                    :looseMatch="true"
                    :filterMaker="id=>id"
                    :predicateMaker="id=>id"
                    :header="'Search Criterion'"
                >
                    <!-- Phenotype Selector -->
                    <filter-enumeration-control
                        class="filter-col-lg"
                        :field="'phenotype'"
                        :options="$parent.secondaryPhenotypeOptions.map(phenotype => phenotype.name)"
                        :multiple="true"
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
                        <div class="labelee">
                            <strong>Select phenotypes</strong>
                        </div>
                    </filter-enumeration-control>

                    <!-- pValue filter -->
                    <filter-pvalue-control class="filter-col-lg" :field="'pValue'">
                        <div class="labelee">
                            <strong>P-Value (&le;)</strong>
                        </div>
                    </filter-pvalue-control>
                </filter-group>

                <div>
                    <gene-finder-table
                        v-if="$parent.geneFinderPhenotypes.length > 0 && $parent.combined.length > 0"
                        :phenotypes="$parent.geneFinderPhenotypes"
                        :phenotypeMap="$store.state.bioPortal.phenotypeMap"
                        :associations="$parent.combined"
                        :per-page="10"
                        :exclusive="true"
                    ></gene-finder-table>
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
