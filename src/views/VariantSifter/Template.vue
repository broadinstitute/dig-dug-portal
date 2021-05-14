<template>
    <div id="variant-finder">
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
        ></page-header>
        <div class="container-fluid mdkp-body">
            <div class="card mdkp-card">
                <div class="card-body temporary-card">
                    <documentation
                        name="variantsifter.header.info"
                    ></documentation>
                </div>
            </div>
            <div class="card mdkp-card">
                <div class="card-body">
                    <h1 class="card-title">Variant Sifter</h1>

                    <documentation
                        name="tools.variantsifter.subheader"
                    ></documentation>

                    <h4 class="card-title">
                        Set region and phenotype to start
                    </h4>
                    <b-container fluid class="filtering-ui-wrapper add-search">
                        <b-row class="filtering-ui-content">
                            <div>
                                <div class="col filter-col-md">
                                    <div class="label">Search gene</div>
                                    <gene-selectpicker
                                        @onGeneChange="
                                            $parent.onGeneChange($event)
                                        "
                                    ></gene-selectpicker>
                                </div>
                                <div
                                    class="col divider"
                                    style="background: none"
                                >
                                    <span class="or-text">or</span>
                                </div>
                                <div class="col filter-col-md">
                                    <div class="label">Set Region</div>
                                    <input
                                        v-model="$parent.region"
                                        type="text"
                                        class="form-control input-default"
                                        placeholder="Chr:Start-End"
                                    />
                                </div>
                                <div class="col divider"></div>
                                <div class="col filter-col-md">
                                    <div class="label">Select Phenotype</div>
                                    <!--<phenotype-selectpicker
                                        :phenotypes="$parent.phenotypeList"
                                        :placeholder="'Select phenotype'"
                                        :clearOnSelected="true"
                                    >
                                    </phenotype-selectpicker>-->

                                    <phenotype-selectpicker
                                        :phenotypes="
                                            $store.state.bioPortal.phenotypes
                                        "
                                        :clearOnSelected="true"
                                    ></phenotype-selectpicker>
                                </div>

                                <!--<div class="col filter-col-sm">
                                    <div class="label">
                                        Get credible sets list
                                    </div>
                                    <button
                                        id="regionSearchGo"
                                        class="btn btn-light btn-sm go"
                                        type="button"
                                    >
                                        GO
                                    </button>
                                </div>-->
                            </div>
                        </b-row>
                    </b-container>
                    <b-container class="search-fields-wrapper">
                        <div class="col filter-col-sm">
                            <div class="search-field f-0">
                                <b-badge
                                    pill
                                    v-if="
                                        $parent.chr != null &&
                                        $parent.start != null &&
                                        $parent.end != null
                                    "
                                    class="btn search-bubble"
                                    v-html="
                                        $parent.chr +
                                        ':' +
                                        $parent.start +
                                        '-' +
                                        $parent.end +
                                        '&nbsp;<span class=\'remove\'>X</span>'
                                    "
                                ></b-badge>
                            </div>
                            <div class="search-field f-1">
                                <b-badge
                                    pill
                                    v-if="$store.state.phenotype != null"
                                    class="btn search-bubble"
                                    v-html="
                                        $store.state.phenotype.description +
                                        '&nbsp;<span class=\'remove\'>X</span>'
                                    "
                                ></b-badge>
                            </div>
                            <b-badge
                                v-if="
                                    $parent.chr != null &&
                                    $parent.start != null &&
                                    $parent.end != null &&
                                    $store.state.phenotype != null
                                "
                                class="badge badge-secondary badge-pill btn search-bubble clear-all-filters-bubble"
                            >
                                Clear all
                            </b-badge>
                        </div>
                    </b-container>
                </div>
            </div>
        </div>
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
<style>
@import url("/css/effectorGenes.css");

.clear-all-filters-bubble {
    background-color: #ff0000 !important;
}
</style>
