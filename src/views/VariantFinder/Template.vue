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

                    <!-- phenotype criterion -->
                    <div class="row">
                        <div class="col-md-8 mx-auto">
                            <div
                                v-for="(p, index) in $store.state.phenotypes"
                                :key="index"
                            >
                                <span class="lead">
                                    <span
                                        :class="`mr-4 badge`"
                                        :style="`color: #fff; background-color: ${$parent.phenotypeColor(
                                            index
                                        )} !important`"
                                        >{{ p.phenotype.description }}</span
                                    >
                                </span>
                                <button
                                    type="button"
                                    class="close"
                                    aria-label="Close"
                                >
                                    <span
                                        v-on:click="
                                            $parent.removePhenotype(index)
                                        "
                                        >&times;</span
                                    >
                                </button>
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
                                <div v-show="p.filterVisible">
                                    <criterion-function-group
                                        v-model="p.filter"
                                    >
                                        <filter-pvalue-control
                                            :field="'pValue'"
                                        >
                                            <div class="label">
                                                P-Value (&le;)
                                            </div>
                                        </filter-pvalue-control>

                                        <filter-effect-direction-control
                                            :field="
                                                index == 0
                                                    ? 'beta'
                                                    : 'alignedBeta'
                                            "
                                        >
                                            <div class="label">
                                                Effect (+/-)
                                            </div>
                                        </filter-effect-direction-control>
                                    </criterion-function-group>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- add another phenotype... -->
                    <div class="row">
                        <div class="col-md-4 mx-auto">
                            <phenotype-selectpicker
                                class="mt-2"
                                :phenotypes="$store.state.bioPortal.phenotypes"
                                :placeholder="
                                    $store.state.phenotypes.length == 0
                                        ? 'Select lead phenotype'
                                        : 'Select additional phenotype'
                                "
                                :clearOnSelected="true"
                            >
                            </phenotype-selectpicker>
                        </div>
                    </div>

                    <hr />

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
