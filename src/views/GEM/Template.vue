<template>
    <div id="gem">
        <!-- Header -->
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
        ></page-header>

        <div class="container-fluid mdkp-body">
            <div class="card mdkp-card">
                <div class="card-body">
                    <documentation name="region.lz.subheader"></documentation>
                    <documentation name="region.igv.subheader"></documentation>
                </div>
            </div>
            <div class="card mdkp-card">
                <div class="card-body">
                    <div class="filtering-ui-wrapper container-fluid">
                        <div class="row filtering-ui-content">filters</div>
                    </div>
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
                        <b-tab title="Evidence View" lazy>
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

        <b-button v-b-toggle.sidebar-1>Show Criteria</b-button>
        <b-sidebar id="sidebar-1" title="Criteria" shadow>
            <div class="px-3 py-2">
                <gene-selectpicker
                    @onGeneChange="$store.dispatch('onGeneChange', $event)"
                ></gene-selectpicker>

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
                                !!$store.state.bioPortal.phenotypeMap[phenotype]
                                    ? $store.state.bioPortal.phenotypeMap[
                                          phenotype
                                      ].description
                                    : phenotype
                        "
                        placeholder="Select one or more phenotypes"
                    >
                        <div class="label">Add Phenotypes</div>
                    </filter-enumeration-control>

                    <div class="col filter-col-md">
                        <div class="label" style="margin-bottom: 5px">
                            Add credible sets
                        </div>
                        <credible-sets-selectpicker
                            :credibleSets="$parent.credibleSets"
                            :clearOnSelected="true"
                            @credibleset="
                                $parent.addCredibleVariantsPanel($event)
                            "
                        />
                    </div>

                    <div class="col filter-col-md">
                        <div class="label" style="margin-bottom: 5px">
                            Add tissues
                        </div>
                        <tissue-selectpicker
                            :tissues="$parent.globalEnrichmentTissues"
                            :clearOnSelected="true"
                            @tissue="$parent.addTissueIntervalsPanel($event)"
                        />
                    </div>

                    <div class="col filter-col-md">
                        <div class="label" style="margin-bottom: 5px">
                            Add annotations
                        </div>
                        <annotation-selectpicker
                            :annotations="$parent.globalEnrichmentAnnotations"
                            :clearOnSelected="true"
                            @annotation="
                                $parent.addAnnotationIntervalsPanel($event)
                            "
                        />
                    </div>

                    <div class="col filter-col-md">
                        <div class="label" style="margin-bottom: 5px">
                            Add tissue loop track
                        </div>
                        <tissue-selectpicker
                            :tissues="$parent.globalEnrichmentTissues"
                            :clearOnSelected="true"
                            @tissue="
                                $parent.addTissueCoaccessibilityPanel($event)
                            "
                        />
                    </div>
                </criterion-list-group>
            </div>
        </b-sidebar>
    </div>
</template>
