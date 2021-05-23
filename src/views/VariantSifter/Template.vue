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
                            $parent.credibleSets.length > 0 &&
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
                            <div
                                class="col filter-col-md"
                                v-if="$parent.credibleSetsData.length > 0"
                            >
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
                    -->

                    <b-container fluid class="cs-plot-wrapper">
                        <b-row fluid :style="'flex-wrap: nowrap !important'">
                            <!-- track names-->
                            <div class="cs-plot-field-names">
                                <div class="cs-plot-field-name-annotations">
                                    <div>
                                        <span class="cs-plot-field-name-title"
                                            >Annotations</span
                                        >
                                    </div>
                                    <div
                                        v-for="(
                                            annotation, key, index
                                        ) in $parent.annotations"
                                        :key="key"
                                        :style="
                                            'color:' +
                                            $parent.annotationColors[index] +
                                            ';'
                                        "
                                        v-html="
                                            key +
                                            '&nbsp;<span class=\'remove\'>X</span>'
                                        "
                                    ></div>
                                </div>
                                <div class="cs-plot-field-name-variants">
                                    <div>
                                        <span class="cs-plot-field-name-title"
                                            >Credible sets</span
                                        >
                                    </div>
                                    <div
                                        v-for="(
                                            cs, index
                                        ) in $parent.credibleSetsData"
                                        :key="cs.id"
                                        :class="'cs-plot-field-name'"
                                        :style="
                                            'color:' +
                                            $parent.colorIndex[index] +
                                            ';'
                                        "
                                        v-html="
                                            cs.id +
                                            '&nbsp;<span class=\'remove\'>X</span>'
                                        "
                                    ></div>
                                </div>
                            </div>
                            <div class="cs-plot-field-value">
                                <div class="locus-start">
                                    {{ $parent.locus.start }}
                                </div>
                                <div class="locus-end">
                                    {{ $parent.locus.end }}
                                </div>
                                <div
                                    id="annotationsSummary"
                                    class="annotations-summary-wrapper"
                                ></div>
                                <!-- scroll panel -->
                                <div
                                    id="scrollPanel"
                                    v-if="
                                        Object.keys(
                                            $parent.credibleSetsDataSorted
                                        ).length > 0
                                    "
                                >
                                    <div
                                        v-for="(
                                            value, key, index
                                        ) in $parent.credibleSetsDataSorted"
                                        class="variant-dots-wrapper"
                                        v-if="
                                            value[0].position >=
                                                $parent.locus.start &&
                                            value[0].position <=
                                                $parent.locus.end
                                        "
                                        :style="
                                            'left:' +
                                            $parent.getLeftPosition(
                                                value[0].position
                                            ) +
                                            '%;'
                                        "
                                        :key="index"
                                    >
                                        <div
                                            @click="
                                                $parent.scrollPlotsTo(
                                                    value[0].position
                                                )
                                            "
                                            v-for="(vDot, vIndex) in value"
                                            class="variant-dot"
                                            :style="
                                                'background-color:' +
                                                $parent.colorIndex[
                                                    vDot.colorIndex
                                                ] +
                                                '50; top:' +
                                                (22 -
                                                    vDot.posteriorProbability *
                                                        22) +
                                                'px;'
                                            "
                                            :key="vIndex"
                                        >
                                            <span
                                                class="variant-dot-info"
                                                v-html="
                                                    $parent.getDotInfo(vDot)
                                                "
                                            ></span>
                                        </div>
                                    </div>
                                </div>
                                <!-- Annotations -->
                                <div
                                    class="cs-plot-field-value-annotations"
                                    id="annotationsWrapper"
                                ></div>
                                <!-- credible sets variants -->
                                <div
                                    class="cs-plot-field-value-variants cs-plot-wrapper"
                                >
                                    <canvas
                                        id="credibleVariants"
                                        height="0"
                                        width="0"
                                    ></canvas>
                                </div>
                            </div>
                        </b-row>
                        <b-row>
                            <div
                                class="col-md-12"
                                v-if="$parent.tableData.length > 0"
                                style="margin-top: 20px"
                            >
                                <research-data-table
                                    :pageID="'table data'"
                                    :dataset="$store.state.filteredData"
                                    :tableFormat="$parent.tableDataFormat"
                                    :perPageNumber="10"
                                    :tableLegend="''"
                                >
                                </research-data-table>
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

#scrollPanel {
    width: 100%;
    height: 30px;
    border: solid 1px #ddd;
    border-left: none;
    position: relative;
}

.cs-plot-annotation-tissue-names {
    position: absolute;
    top: -2px;
    border: solid 0px #ff0000;
    font-size: 13px;
    text-align: left;
    line-height: 20px;
    white-space: nowrap;
    padding-left: 15px;
}

.locus-start,
.locus-end {
    position: absolute;
    /*bottom: -20px;*/
    top: -20px;
    font-size: 12px;
}

.locus-start {
    left: 0;
}

.locus-end {
    right: 0;
}

.annotations-summary-wrapper {
    width: 100%;
    border: solid 1px #ddd;
    border-left: none;
    position: relative;
}

.variant-dots-wrapper {
    position: absolute;
    top: 0;
}

.variant-dot {
    position: absolute;
    left: -4px;
    width: 8px;
    height: 8px;
    border-radius: 5px;
    margin-bottom: 5px;
}

.variant-dot:hover {
    cursor: pointer;
}

.variant-dot span.variant-dot-info {
    position: absolute;
    display: none;
    background-color: #ffffff99;
    border: solid 1px #aaaaaa;
    border-radius: 5px;
    font-size: 14px;
    bottom: 10px;
    left: 10px;
    padding: 10px;
    white-space: nowrap;
    z-index: 10;
}

.variant-dot:hover span.variant-dot-info {
    display: block;
}

::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

::-webkit-scrollbar-track {
    -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
    border-radius: 10px;
}

::-webkit-scrollbar-thumb {
    border-radius: 10px;
    -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.5);
}

#credibleVariants {
    transform: rotate(-90deg);
    transform-origin: top left;
    position: relative;
    top: 157px;
}
.clear-all-filters-bubble {
    background-color: #ff0000 !important;
}

.cs-plot-wrapper {
    scroll-behavior: smooth;
    margin-top: 30px;
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
    height: 170px;
    position: relative;
    padding: 0 0 5px 0;
}

.cs-plot-field-name-title {
    font-size: 13px;
    color: #bbbbbb;
}

.cs-plot-field-value {
    width: calc(100% - 150px);
    border-left: solid 1px #dddddd;
}

.cs-plot-field-value-annotations {
}
.cs-plot-field-value-annotation {
    max-height: 150px;
    overflow-x: hidden;
    width: calc(100% + 8px);
    border-top: solid 1px #ddd;
    border-bottom: solid 1px #ddd;
    margin-top: 10px;
    position: relative;
    padding-top: 5px;
}

.cs-plot-field-value-variants {
    position: relative;
    height: 167px;
    padding: 0 0 5px 0;
    overflow-x: hidden;
    overflow-y: hidden;
}
</style>
