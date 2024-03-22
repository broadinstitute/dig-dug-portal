<template>
    <div id="variant-finder">
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
        ></page-header>
        <div class="container-fluid mdkp-body">
            <!-- <div class="card mdkp-card">
                <div class="card-body temporary-card">
                    <documentation
                        name="signalsifter.header.info"
                    ></documentation>
                </div>
            </div> -->
            <div class="card mdkp-card">
                <div class="card-body">
                    <h1 class="card-title">Variant Finder</h1>

                    <!-- <documentation
                        style="margin-bottom: 30px"
                        name="tools.variantfinder.subheader"
                    ></documentation> -->

                    <h4 class="card-title">Build search criteria</h4>
                    <b-container fluid class="filtering-ui-wrapper">
                        <b-row class="filtering-ui-content"
                            ><b-col class="col-md-5 mx-auto">
                                <div class="label">Select Phenotypes</div>
                                <phenotype-selectpicker
                                    class="mt-2"
                                    style="width: 400px"
                                    :phenotypes="$parent.phenotypeList"
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
                        <!-- <b-row class="filtering-ui-content">
                            <b-col class="col-md-5 mx-auto">
                                <div class="label">Consequence Field</div>
                                <b-form-select
                                    class="mt-2"
                                    style="width: 300px"
                                    v-model="$store.state.selectedconsequence"
                                    :options="$store.state.consequences"
                                    :placeholder="
                                        'Select consequence field'
                                    "
                                    :clearOnSelected="false"
                                    @hit="onFilterChange($event)"
                                >
                                </b-form-select>
                            </b-col>
                            <b-col class="col-md-5 mx-auto">
                                <div class="label">Inheritance Pattern</div>
                                <phenotype-selectpicker
                                    class="mt-2"
                                    style="width: 300px"
                                    :placeholder="
                                        'Select inheritance pattern'
                                    "
                                    :clearOnSelected="false"
                                >
                                </phenotype-selectpicker>
                            </b-col>
                        </b-row> -->
                    </b-container>
                    <!-- phenotype criterion -->
                    <div class="row">
                        <div class="col-md-10 mx-auto">
                            <div
                                class="selected-phenotype text"
                                :class="`color-${index + 1}-bg`"
                                v-for="(p, index) in $store.state.phenotypes"
                                :key="index"
                            >
                                <div class="lead">
                                    <small
                                        ><span
                                            v-if="index === 0"
                                            class="lead-icon"
                                            title="Lead Phenotype"
                                            v-b-tooltip.hover="{
                                                variant: 'light',
                                            }"
                                            ><b-icon-check2-circle
                                                variant="light"
                                            ></b-icon-check2-circle></span
                                    ></small>

                                    <span
                                        v-b-tooltip.hover="{ variant: 'light' }"
                                        class="mr-4"
                                        :title="p.phenotype.description"
                                        :style="`color: ${$parent.phenotypeColor(
                                            index
                                        )}`"
                                        >{{ p.phenotype.description }}</span
                                    >
                                </div>
                                <div
                                    class="filter-options"
                                    :key="index"
                                    v-show="true"
                                >
                                    <criterion-function-group
                                        v-model="p.filter"
                                        :noPills="true"
                                        :filterList.sync="
                                            $parent.displayedFilterList[
                                                p.phenotype.name
                                            ]
                                        "
                                    >
                                        <filter-allelecount-control
                                            :field="'allelecount'"
                                            :placeholder="`AC(\u2265)`"
                                            :pillFormatter="
                                                (filter) => filter.threshold
                                            "
                                            ><span></span>
                                        </filter-allelecount-control>

                                        <!--<filter-effect-direction-control
                                            placeholder="Effect (+/-)"
                                            field="effect"
                                            :pillFormatter="
                                                (filter) => filter.threshold
                                            "
                                            :computedField="$parent.alignedBeta"
                                            ><span></span>
                                        </filter-effect-direction-control> -->
                                    </criterion-function-group>
                                </div>

                                <criterion-pills
                                    :clearable="true"
                                    @unset="
                                        $parent.displayedFilterList[
                                            p.phenotype.name
                                        ] = $parent.displayedFilterList[
                                            p.phenotype.name
                                        ].filter(
                                            (f) =>
                                                !(
                                                    f.field === $event.field &&
                                                    f.threshold ===
                                                        $event.threshold
                                                )
                                        )
                                    "
                                    :filterList="
                                        $parent.displayedFilterList[
                                            p.phenotype.name
                                        ]
                                    "
                                ></criterion-pills>

                                <!--<button
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
                                </button>-->
                                <button
                                    type="button"
                                    class="mr-2 close remove"
                                    aria-label="Filter"
                                    v-b-tooltip.hover.html="{
                                        variant: 'light',
                                    }"
                                    :title="
                                        index === 0
                                            ? 'Click to clear phenotype list'
                                            : 'Click to remove this phenotype from list'
                                    "
                                    v-on:click="$parent.removePhenotype(index)"
                                >
                                    <span style="color: #ffffff"
                                        ><b-icon-x-circle-fill></b-icon-x-circle-fill
                                    ></span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- plot of all overlapping clumps -->

                    <!-- <manhattan-plot
                        v-show="
                            $store.state.phenotypes.length > 0 ||
                            $parent.clumpedAssociations.length > 0
                        "
                        :associations="$parent.clumpedAssociations"
                        :phenotypes="$parent.phenotypes"
                        :phenotypeMap="$parent.phenotypeMap"
                        :colorByPhenotype="true"
                        class="mt-2 mb-2"
                    ></manhattan-plot> -->

                    <!-- table of overlapping associations -->

                    <clumped-associations-table
                        v-show="
                            $store.state.phenotypes.length > 0 ||
                            $parent.clumpedAssociations.length > 0
                        "
                        :phenotypes="$parent.phenotypes"
                        :phenotypeMap="$parent.phenotypeMap"
                        :consequences="$store.state.consequences"
                        :inheritances="$store.state.inheritances"
                        :associations="$parent.clumpedAssociations"
                        :associations2="$parent.clumpedAssociations"
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
    padding: 0 15px 0 15px;
    margin-bottom: 0.5rem;
    border: 1px solid transparent;
    border-radius: 1.5rem;
    /* min-height: 50px; */
    /* min-width: -webkit-fit-content; */
    min-width: -moz-fit-content;
    min-width: fit-content;
    white-space: nowrap;
    height: 40px;
}
#variant-finder div.col .label {
    display: inline-block;
}
.selected-phenotype div.filtering-ui-content {
    display: inline-block;
}
.selected-phenotype div.filtering-ui-content input {
    /*background: transparent;*/
    background-color: #ffffff60;
    border: 1px solid #aaa;
}
.selected-phenotype div.filtering-ui-content input::placeholder {
    color: #666;
    opacity: 1; /* Firefox */
}
.selected-phenotype:not(:first-child) {
    margin-left: 2rem;
}

.selected-phenotype:not(:first-child) div.lead {
    width: 310px !important;
}
/* .selected-phenotype > div {
    display: table-cell;
} */
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
    margin-right: 15px;
    /* width: 300px; */
    white-space: nowrap;
    float: right;
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
    right: 0.1rem;
    top: 0.6rem;
    font-size: 1.15rem;
    opacity: 1 !important;
    /*float: unset;*/
}
div.lead {
    display: inline-block;
    vertical-align: top;
    margin-top: 0.2rem;
    width: 342px !important;
    overflow: hidden;
    text-overflow: ellipsis;
}
.selected-phenotype:first-child div.lead {
    /*margin-left: 0.75rem;*/
}
div.lead .lead-icon {
    /*position: absolute;
    left: 0.6rem;
    top: 0.3rem;*/
    font-size: 1.4rem;
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
.slide-fade-leave-active,
.slide-down-enter-active,
.slide-down-leave-active {
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
.slide-down-enter {
    transform: translateY(-20%);
    /* width: auto; */
}
.slide-down-leave-to {
    transform: translateY(-10%);
    /* transform: translateY(-100%); */
}
button:focus {
    outline: none !important;
}
</style>
