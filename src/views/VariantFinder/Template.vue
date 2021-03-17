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
                                <div class="lead">
                                    <span
                                        v-if="index === 0"
                                        class="lead-icon"
                                        title="Lead Phenotype"
                                        v-b-tooltip.hover="{ variant: 'light' }"
                                        ><b-icon-check2-circle
                                            variant="light"
                                        ></b-icon-check2-circle
                                    ></span>

                                    <span
                                        v-b-tooltip.hover="{ variant: 'light' }"
                                        class="mr-4"
                                        :title="
                                            index === 0
                                                ? 'Click to clear phenotype list'
                                                : 'Click to remove this phenotype from list'
                                        "
                                        :style="`color: ${$parent.phenotypeColor(
                                            index
                                        )} !important; cursor: pointer;`"
                                        v-on:click="
                                            $parent.removePhenotype(index)
                                        "
                                        >{{ p.phenotype.description }}</span
                                    >
                                </div>
                                <transition name="slide-fade" mode="out-in"
                                    ><div
                                        class="filter-options"
                                        :key="index"
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
                                    :title="`Filters for <strong>${p.phenotype.description}</strong>`"
                                    v-b-tooltip.hover.html="{
                                        variant: 'light',
                                    }"
                                >
                                    <span
                                        v-on:click="
                                            p.filterVisible = !p.filterVisible
                                        "
                                        ><b-icon-filter></b-icon-filter
                                    ></span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- plot of all overlapping clumps -->

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

                    <!-- table of overlapping associations -->

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

                    <b-overlay :show="!$store.state.phenotypes.length">
                        <template #overlay>
                            <b-alert show
                                ><b-icon icon="info-circle"></b-icon> Please
                                select a phenotype to start.</b-alert
                            >
                        </template>
                        <b-skeleton-wrapper
                            :loading="!$store.state.phenotypes.length"
                        >
                            <template #loading>
                                <b-card>
                                    <div class="col-md-8 mx-auto">
                                        <b-skeleton
                                            width="100%"
                                            height="2rem"
                                        ></b-skeleton>
                                        <b-skeleton
                                            style="margin-left: 10%"
                                            width="90%"
                                            height="2rem"
                                        ></b-skeleton>
                                        <b-skeleton
                                            style="margin-left: 10%"
                                            width="90%"
                                            height="2rem"
                                        ></b-skeleton>
                                    </div>
                                    <b-skeleton-table
                                        :rows="5"
                                        :columns="4"
                                    ></b-skeleton-table
                                ></b-card>
                            </template> </b-skeleton-wrapper
                    ></b-overlay>
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
.selected-phenotype div.filtering-ui-content {
    display: inline-block;
}
.selected-phenotype:not(:first-child) {
    margin-left: 2rem;
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
.filter-pill-collection {
    margin: 0;
    width: 300px;
    white-space: nowrap;
}

.filter-options {
    width: 240px;
    display: inline-block;
}
.filter-options > span > div {
    display: inline-block;
}
.selected-phenotype .close {
    position: absolute;
    right: 0;
    top: 12px;
    float: unset;
}
div.lead {
    display: inline-block;
    vertical-align: top;
    margin-top: 0.4rem;
}
.selected-phenotype:first-child div.lead {
    margin-left: 2rem;
}
div.lead .lead-icon {
    position: absolute;
    left: 0.6rem;
    top: 0.3rem;
    font-size: 1.8rem;
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
    transition: all 0.5s;
}

.slide-fade-enter {
    transform: translateX(-20%);
    /* width: auto; */
}
.slide-fade-leave-to {
    transform: translateX(-10%);
    /* transform: translateY(-100%); */
}
button:focus {
    outline: none !important;
}
</style>
