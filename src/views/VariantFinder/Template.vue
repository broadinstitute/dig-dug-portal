<template>
    <div id="variant-finder">
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
                                <transition name="slide-fade" mode="out-in"
                                    ><div
                                        :key="index"
                                        style="width: 240px"
                                        v-show="p.filterVisible"
                                    >
                                        <criterion-function-group
                                            v-model="p.filter"
                                            header=""
                                            :inlinePills="true"
                                        >
                                            <filter-pvalue-control
                                                :field="'pValue'"
                                                :placeholder="`P-Value (\u2264)`"
                                                ><span></span>
                                            </filter-pvalue-control>

                                            <filter-effect-direction-control
                                                placeholder="Effect (+/-)"
                                                :computedField="
                                                    (obj) => {
                                                        return obj.beta * -1;
                                                    }
                                                "
                                            >
                                            </filter-effect-direction-control>
                                        </criterion-function-group>
                                    </div>
                                </transition>
                                <!-- <div class="filters-wrapper">
                                    Slide example
                                    <div
                                        id="sliding_filters_wrapper"
                                        class="hidden"
                                    >
                                        Filters go here!!
                                    </div>
                                    <div>
                                        <a
                                            href="javascript:;"
                                            @click="$parent.showFilters()"
                                            >>></a
                                        >
                                    </div>
                                </div> -->

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
    min-height: 50px;
}
#variant-finder div.col .label {
    display: inline-block;
}
.selected-phenotype div {
    vertical-align: middle;
}
#variant-finder .selected-phenotype div.filtering-ui-wrapper {
    border: none;
    background-color: transparent;
    margin: auto;
    padding: 0;
    width: 240px;
    transition: all 2s;
    /* overflow: hidden; */
    /* white-space: nowrap; */
    display: inline-block;
}
.filters-wrapper {
    border: solid 1px #ddd;
    border-radius: 5px;
    padding: 10px 15px;
    font-size: 16px;
    font-family: Arial, Helvetica, sans-serif;
}
.filters-wrapper div,
.filters-wrapper span {
    display: inline-block;
}
#sliding_filters_wrapper {
    width: 50%;
    overflow: hidden;
    white-space: nowrap;
    border: solid 1px #ddd;
    transition: all 2s;
}
#sliding_filters_wrapper.hidden {
    width: 0 !important;
    border: solid 0px #fff;
}
.slide-fade-enter-active,
.slide-fade-leave-active {
    transition: all 2s;
}

.slide-fade-enter {
    transform: translateY(-10%);
    /* width: auto; */
}
.slide-fade-leave-to {
    transform: translateX(-50px);
    /* transform: translateY(-100%); */
}
button:focus {
    outline: none !important;
}
</style>
