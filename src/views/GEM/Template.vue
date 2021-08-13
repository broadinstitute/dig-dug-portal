<template>
    <div id="gem">
        <!-- Header -->
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
        ></page-header>

        <div class="container-fluid mdkp-body">
            <b-sidebar id="sidebar-1" title="GEM Criteria" shadow width="260px">
                <div class="px-3 py-2">
                    <gene-selectpicker
                        @onGeneChange="$parent.onGeneChange($event)"
                    ></gene-selectpicker>
                    <b-badge pill variant="info" class="btn">
                        {{ $parent.selectedGene }}
                    </b-badge>

                    <criterion-list-group
                        class="first"
                        v-model="$parent.regionPageSearchCriterion"
                        :header="''"
                    >
                        <!-- Phenotype Selector -->
                        <filter-enumeration-control
                            class="filter-col-lg"
                            :field="'phenotype'"
                            :options="$parent.allphenotypes"
                            :multiple="true"
                            :pillFormatter="
                                (filter) =>
                                    $store.state.bioPortal.phenotypeMap[
                                        filter.threshold
                                    ].description
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
                            placeholder="Select one or more phenotypes"
                            ><div class="label"></div>
                        </filter-enumeration-control>

                        <div class="col filter-col-md">
                            <credible-sets-selectpicker
                                :credibleSets="$parent.credibleSets"
                                :clearOnSelected="true"
                                @credibleset="
                                    $parent.addCredibleVariantsPanel($event)
                                "
                            />
                        </div>

                        <div class="col filter-col-md">
                            <tissue-selectpicker
                                :tissues="$parent.globalEnrichmentTissues"
                                :clearOnSelected="true"
                                @tissue="
                                    $parent.addTissueIntervalsPanel($event)
                                "
                            />
                        </div>

                        <div class="col filter-col-md">
                            <annotation-selectpicker
                                :annotations="
                                    $parent.globalEnrichmentAnnotations
                                "
                                :clearOnSelected="true"
                                @annotation="
                                    $parent.addAnnotationIntervalsPanel($event)
                                "
                            />
                        </div>

                        <div class="col filter-col-md">
                            <tissue-selectpicker
                                :tissues="$parent.globalEnrichmentTissues"
                                :clearOnSelected="true"
                                @tissue="
                                    $parent.addTissueCoaccessibilityPanel(
                                        $event
                                    )
                                "
                            />
                        </div>
                    </criterion-list-group>
                </div>
            </b-sidebar>
            <div class="card mdkp-card">
                <div class="card-body">
                    <documentation name="region.lz.subheader"></documentation>
                    <documentation name="region.igv.subheader"></documentation>
                </div>
            </div>
            <div class="card mdkp-card">
                <div class="card-body">
                    <criterion-function-group
                        v-model="$parent.associationsFilter"
                        v-if="$parent.selectedPhenotypes.length > 0"
                    >
                        <filter-enumeration-control
                            :field="'consequence'"
                            :options="$parent.associationConsequences"
                            :inclusive="false"
                        >
                            <div class="label">Consequence</div>
                        </filter-enumeration-control>

                        <filter-enumeration-control
                            class="filter-col-sm"
                            :field="'nearest'"
                            :options="$parent.associationNearestGenes"
                            :inclusive="false"
                        >
                            <div class="label">Closest Genes</div>
                        </filter-enumeration-control>

                        <filter-pvalue-control :field="'pValue'">
                            <div class="label">P-Value (&le;)</div>
                        </filter-pvalue-control>

                        <filter-effect-direction-control :field="'beta'">
                            <div class="label">Effect (+/-)</div>
                        </filter-effect-direction-control>
                        <!--
                                <template
                                    slot="filtered"
                                    slot-scope="{ filter }"
                                >
                                </template> -->
                    </criterion-function-group>
                    <b-tabs content-class="mt-3">
                        <b-tab title="Score View" active>
                            <associations-table
                                id="associations-table"
                                :phenotypes="$parent.selectedPhenotypes"
                                :associations="$parent.pageAssociations"
                                :filter="$parent.associationsFilter"
                                :exclusive="false"
                            ></associations-table>
                        </b-tab>
                        <b-tab title="Evidence View">
                            <locuszoom
                                v-if="$parent.selectedPhenotypes.length > 0"
                                ref="locuszoom"
                                :chr="$store.state.chr"
                                :start="$store.state.start"
                                :end="$store.state.end"
                                :filterAssociations="$parent.associationsFilter"
                                :filterAnnotations="$parent.annotationsFilter"
                                @regionchanged="
                                    ($event) => {
                                        $parent.requestCredibleSets(
                                            $event.data
                                        );
                                    }
                                "
                                :ldpop="true"
                                :refSeq="true"
                            >
                                <p
                                    v-for="phenotype in $parent.selectedPhenotypes"
                                    :key="phenotype.name"
                                >
                                    <lz-associations-panel
                                        :phenotype="phenotype.name"
                                        :title="phenotype.description"
                                        @input="
                                            $parent.updatePageAssociations({
                                                phenotype: phenotype.name,
                                                data: $event,
                                            })
                                        "
                                    ></lz-associations-panel>
                                    <lz-catalog-annotations-panel
                                        :phenotype="phenotype.name"
                                        :title="phenotype.description"
                                    ></lz-catalog-annotations-panel>
                                </p>
                            </locuszoom>
                        </b-tab>
                    </b-tabs>
                </div>
            </div>
        </div>

        <b-button v-b-toggle.sidebar-1 class="fixedButton" pill size="sm"
            >Show Criteria</b-button
        >
    </div>
</template>
<style >
.fixedButton {
    position: fixed;
    bottom: 20px;
    left: 20px;
    padding: 20px;
}
.my-sidebar.b-sidebar-outer {
    position: absolute !important;
    height: 100% !important;
}

.my-sidebar .b-sidebar {
    position: absolute !important;
    height: 100% !important;
}
.relative {
    position: relative;
    height: 100% !important;
}
</style>

