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
                    <b-container fluid class="filtering-ui-wrapper">
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
                                @click="$parent.clearAll('all')"
                            >
                                Clear all
                            </b-badge>
                        </div>
                    </b-container>
                    <b-container
                        fluid
                        class="filtering-ui-wrapper add-search"
                        v-if="
                            !!$parent.credibleSets &&
                            $parent.credibleSets.length > 1 &&
                            $parent.locus != null &&
                            $store.state.phenotype != null
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
                            <div class="col filter-col-md">
                                <div class="label" style="margin-bottom: 5px">
                                    Add annotation
                                </div>
                                <annotation-selectpicker
                                    :annotations="
                                        $parent.globalEnrichmentAnnotations
                                    "
                                    :clearOnSelected="true"
                                    @annotation="$parent.addAnnotation($event)"
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
                    {{ $parent.annotation }}
                    <b-container fluid class="cs-plot-wrapper">
                        <b-row
                            fluid
                            style="flex-wrap: nowrap !important"
                            v-if="$parent.credibleSetsData.length > 0"
                        >
                            <div class="cs-plot-field-names">
                                <div class="cs-plot-field-name-pp">
                                    <div>
                                        <span class="cs-plot-field-name-title"
                                            >Posterior Probability</span
                                        >
                                    </div>
                                </div>
                                <div class="cs-plot-field-name-variants">
                                    <div>
                                        <span class="cs-plot-field-name-title"
                                            >Variants</span
                                        >
                                    </div>
                                    <div
                                        v-for="(
                                            cs, index
                                        ) in $parent.credibleSetsData"
                                        :key="cs.id"
                                        :class="
                                            'cs-plot-field-name text color-' +
                                            (index + 1)
                                        "
                                        v-html="
                                            cs.id +
                                            '&nbsp;<span class=\'remove\'>X</span>'
                                        "
                                    ></div>
                                </div>
                            </div>
                            <div class="cs-plot-field-value">
                                <div class="cs-plot-field-value-pp">
                                    <div
                                        v-for="(
                                            value, key, index
                                        ) in $parent.credibleSetsDataSorted"
                                        class="cs-pp-items-wrapper"
                                        :key="index"
                                    >
                                        <div
                                            v-for="(
                                                varValue, varIndex
                                            ) in value"
                                            class="cs-pp-item"
                                            :key="varIndex"
                                        >
                                            <span
                                                :class="
                                                    'text color-' +
                                                    varValue.colorIndex +
                                                    '-bg-100'
                                                "
                                                :style="
                                                    'height:' +
                                                    100 *
                                                        varValue.posteriorProbability +
                                                    '% !important;'
                                                "
                                            ></span>
                                        </div>
                                    </div>
                                </div>
                                <div class="cs-plot-field-value-variants">
                                    <div
                                        v-for="(
                                            value, key, index
                                        ) in $parent.credibleSetsDataSorted"
                                        :class="
                                            value.length > 1
                                                ? 'cs-variant-items-wrapper multi'
                                                : 'cs-variant-items-wrapper'
                                        "
                                        :key="index"
                                    >
                                        <div
                                            v-for="(
                                                varValue, varIndex
                                            ) in value"
                                            :class="
                                                'cs-variant-item text border-color-' +
                                                varValue.colorIndex +
                                                ' color-' +
                                                varValue.colorIndex +
                                                '-bg'
                                            "
                                            :key="varIndex"
                                        >
                                            <span
                                                v-html="varValue.varId"
                                            ></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
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
@import url("/css/colors.css");

.clear-all-filters-bubble {
    background-color: #ff0000 !important;
}

.cs-plot-wrapper {
}
.cs-plot-field-names {
    font-size: 14px;
    width: 150px !important;
    vertical-align: middle;
    display: inline-table;
}

.cs-plot-field-name-pp {
    height: 30px;
    position: relative;
    padding: 0 0 5px 0;
    border-bottom: solid 1px #dddddd;
}

.cs-plot-field-name-variants {
    height: 150px;
    position: relative;
    padding: 0 0 5px 0;
}

.cs-plot-field-name-title {
    font-size: 13px;
    color: #bbbbbb;
}

.cs-plot-field-value {
    width: calc(100% - 150px);
    overflow-x: auto;
}

.cs-plot-field-value-pp {
    height: 30px;
    position: relative;
    flex-wrap: nowrap !important;
    padding: 0 0 5px 0;
    display: flex;
    border-bottom: solid 1px #dddddd;
}

.cs-plot-field-value-variants {
    height: 150px;
    position: relative;
    flex-wrap: nowrap !important;
    padding: 0 0 5px 0;
    display: flex;
}

.cs-pp-items-wrapper {
    display: flex;
    margin-right: 4px;
    border-top: solid 2px #ffffff;
    padding-top: 3px;
}

.cs-pp-items-wrapper.multi {
    border-top: solid 2px #ff0000;
}

.cs-pp-item {
    border-radius: 20px;
    padding: 0;
    border-width: 2px;
    position: relative;
    width: 25px;
    margin-right: 2px;
    height: 100%;
}

.cs-pp-item span {
    display: block;
    border-width: 1.5px;
    width: 25px;
    bottom: 0;
    position: absolute;
    left: 0;
}

.cs-variant-items-wrapper {
    display: flex;
    margin-right: 4px;
    border-top: solid 2px #ffffff;
    padding-top: 3px;
}

.cs-variant-items-wrapper.multi {
    border-top: solid 2px #ff0000;
}

.cs-variant-item {
    border-radius: 20px;
    padding: 0;
    border-width: 2px;
    position: relative;
    width: 25px;
    margin-right: 2px;
    height: 100%;
}

.cs-variant-item span {
    display: block;
    -webkit-transform: rotate(-90deg);
    transform: rotate(-90deg);
    font-size: 13px;
    border-width: 1.5px;
    width: 125px;
    height: 25px;
    bottom: -85%;
    position: relative;
    -webkit-transform-origin: 13px;
    transform-origin: 13px 13px;
    text-align: center;
}
</style>
