<template>
    <div>
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
        ></page-header>
        <div class="container-fluid mdkp-body">
            <div class="card mdkp-card">
                <div class="card-body">
                    <h1 class="card-title">Variant Finder</h1>

                    <documentation
                        style="margin-bottom: 30px"
                        name="tools.variantfinder.subheader"
                    ></documentation>

                    <h4 class="card-title">Build search criteria</h4>
                    <b-container fluid class="filtering-ui-wrapper">
                        <b-row class="filtering-ui-content"
                            ><b-col class="col-md-5 mx-auto">
                                <div class="label">Select Phenotypes</div>
                                <phenotype-selectpicker
                                    class="mt-2"
                                    style="width: 400px"
                                    :phenotypes="
                                        $store.state.bioPortal.phenotypes
                                    "
                                    :placeholder="
                                        $store.state.phenotypes.length == 0
                                            ? 'Select lead phenotype'
                                            : 'Select additional phenotype'
                                    "
                                    :clearOnSelected="true"
                                >
                                </phenotype-selectpicker>
                            </b-col>
                        </b-row>
                    </b-container>
                    <!-- phenotype criterion -->
                    <div class="row">
                        <div class="col-md-8 mx-auto">
                            <div
                                class="selected-phenotype text"
                                :class="`color-${index + 1}-bg`"
                                v-for="(p, index) in $store.state.phenotypes"
                                :key="index"
                            >
                                <span class="lead">
                                    <span
                                        :class="`mr-4 badge`"
                                        :style="`color: #fff; background-color: ${$parent.phenotypeColor(
                                            index
                                        )} !important; cursor: pointer;`"
                                        v-on:click="
                                            $parent.removePhenotype(index)
                                        "
                                        >{{ p.phenotype.description }}</span
                                    >
                                </span>
                                <button
                                    type="button"
                                    class="mr-2 close"
                                    aria-label="Filter"
                                >
                                    <span
                                        v-on:click="
                                            p.filterVisible = !p.filterVisible
                                        "
                                        >&#x2261;</span
                                    >
                                </button>
                                <criterion-function-group
                                    v-model="p.filter"
                                    :hide="!p.filterVisible"
                                    :inlinePills="true"
                                >
                                    <filter-pvalue-control :field="'pValue'">
                                        <div class="label">P-Value (&le;)</div>
                                    </filter-pvalue-control>

                                    <filter-effect-direction-control
                                        :computedField="
                                            (obj) => {
                                                return obj.beta * -1;
                                            }
                                        "
                                    >
                                        <div class="label">Effect (+/-)</div>
                                    </filter-effect-direction-control>
                                </criterion-function-group>
                            </div>
                        </div>
                    </div>

                    <!-- plot of all overlapping clumps -->
                    <div>
                        <manhattan-plot
                            v-show="
                                $store.state.phenotypes.length > 0 ||
                                $parent.clumpedAssociations.length > 0
                            "
                            :associations="$parent.clumpedAssociations"
                            :phenotypes="$parent.phenotypes"
                            :phenotypeMap="$store.state.bioPortal.phenotypeMap"
                            :colorByPhenotype="true"
                            class="mt-2 mb-2"
                        ></manhattan-plot>
                    </div>

                    <!-- table of overlapping associations -->
                    <div>
                        <clumped-associations-table
                            v-show="
                                $store.state.phenotypes.length > 0 ||
                                $parent.clumpedAssociations.length > 0
                            "
                            :phenotypes="$parent.phenotypes"
                            :phenotypeMap="$store.state.bioPortal.phenotypeMap"
                            :associations="$parent.clumpedAssociations"
                            :rowsPerPage="30"
                            :exclusive="true"
                        ></clumped-associations-table>
                    </div>
                </div>
            </div>
        </div>
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
<style>
.selected-phenotype {
    position: relative;
    padding: 0.25rem 1rem;
    margin-bottom: 0.5rem;
    border: 1px solid transparent;
    border-radius: 1.5rem;
}
</style>
