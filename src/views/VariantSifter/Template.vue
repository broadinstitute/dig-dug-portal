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
                            <div class="col filter-col-md">
                                <div class="label">Search gene</div>
                                <gene-selectpicker
                                    @onGeneChange="$parent.onGeneChange($event)"
                                ></gene-selectpicker>
                            </div>
                            <div class="col divider" style="background: none">
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
                                <phenotype-selectpicker
                                    :phenotypes="
                                        $store.state.bioPortal.phenotypes
                                    "
                                    :clearOnSelected="true"
                                ></phenotype-selectpicker>
                            </div>

                            <div class="col filter-col-sm">
                                <div class="label">Get options</div>
                                <button
                                    id="regionSearchGo"
                                    class="btn btn-light btn-sm go"
                                    type="button"
                                    @click="$parent.getOptions()"
                                >
                                    GO
                                </button>
                            </div>
                        </b-row>
                    </b-container>
                    <b-container class="search-fields-wrapper">
                        <div class="col filter-col-sm">
                            <div class="search-field f-0">
                                <b-badge
                                    pill
                                    v-if="$parent.locus != null"
                                    class="btn search-bubble"
                                    v-html="
                                        $parent.locus.chr +
                                        ':' +
                                        $parent.locus.start +
                                        '-' +
                                        $parent.locus.end +
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
                                    $parent.locus != null &&
                                    $store.state.phenotype != null
                                "
                                class="badge badge-secondary badge-pill btn search-bubble clear-all-filters-bubble"
                                @click="$parent.clearAllSearch()"
                            >
                                Clear all
                            </b-badge>
                        </div>
                    </b-container>
                    <b-container
                        fluid
                        class="filtering-ui-wrapper"
                        v-if="
                            !!$parent.credibleSets &&
                            $parent.credibleSets.length > 1
                        "
                    >
                        <b-row class="filtering-ui-content">
                            <div class="col filter-col-md">
                                <div class="label">Add credible set</div>
                                <credible-sets-selectpicker
                                    :credibleSets="$parent.credibleSets"
                                    :clearOnSelected="true"
                                    @credibleset="
                                        $parent.addCredibleSets($event)
                                    "
                                />
                            </div>
                        </b-row>
                    </b-container>
                    <!--
                    <criterion-function-group>
                        <div class="col filter-col-md">
                            <div class="label" style="margin-bottom: 5px">
                                Add tissue
                            </div>
                            <tissue-selectpicker
                                :tissues="$parent.globalEnrichmentTissues"
                                :clearOnSelected="true"
                                @tissue="
                                    $parent.addTissueIntervalsPanel($event)
                                "
                            />
                        </div>
                        <div class="col filter-col-md">
                            <div class="label" style="margin-bottom: 5px">
                                Add annotation
                            </div>
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
                            <div class="label" style="margin-bottom: 5px">
                                Add credible set
                            </div>
                            <credible-sets-selectpicker
                                :credibleSets="$parent.credibleSets"
                                :clearOnSelected="true"
                                @credibleset="
                                    $parent.addCredibleVariantsPanel($event)
                                "
                            />
                        </div>

                        <div class="col divider">&nbsp;</div>

                        <span style="display: inline-block">
                            <div class="label">
                                Filter annotations by global enrichment
                            </div>
                            <filter-pvalue-control :field="'pValue'">
                                <span class="label">P-Value (&le;)</span>
                            </filter-pvalue-control>
                            <filter-greater-control :field="'fold'">
                                <span class="label">Fold (&ge;)</span>
                            </filter-greater-control>
                        </span>
                    </criterion-function-group>
                    <criterion-function-group>
                        <div class="col filter-col-md">
                            <div class="label" style="margin-bottom: 5px">
                                Add tissue
                            </div>
                            <tissue-selectpicker
                                :tissues="$parent.globalEnrichmentTissues"
                                :clearOnSelected="true"
                                @tissue="
                                    $parent.addTissueIntervalsPanel($event)
                                "
                            />
                        </div>
                        <div class="col filter-col-md">
                            <div class="label" style="margin-bottom: 5px">
                                Add annotation
                            </div>
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
                            <div class="label" style="margin-bottom: 5px">
                                Add credible set
                            </div>
                            <credible-sets-selectpicker
                                :credibleSets="$parent.credibleSets"
                                :clearOnSelected="true"
                                @credibleset="
                                    $parent.addCredibleVariantsPanel($event)
                                "
                            />
                        </div>

                        <div class="col divider">&nbsp;</div>

                        <span style="display: inline-block">
                            <div class="label">
                                Filter annotations by global enrichment
                            </div>
                            <filter-pvalue-control :field="'pValue'">
                                <span class="label">P-Value (&le;)</span>
                            </filter-pvalue-control>
                            <filter-greater-control :field="'fold'">
                                <span class="label">Fold (&ge;)</span>
                            </filter-greater-control>
                        </span>
                    </criterion-function-group>
                    {{ $parent.credibleSets }}
                    -->

                    <b-container>
                        <b-row
                            v-for="(
                                value, index
                            ) in $parent.credibleSetsDataSorted"
                        >
                            <div
                                v-html="value.position + ':' + value.colorIndex"
                            ></div>
                        </b-row>
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
