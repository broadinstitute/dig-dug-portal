<template>
    <div>
        <div class="pws-merged-view">
            <template v-if="topAssociationsHighest <= 5e-8">
                <div v-if="legends" class="pws-group-legend-wrapper">
                    <div
                        v-for="(row, i) in topAssociatedGroups"
                        class="pws-group-legend"
                        :key="i"
                    >
                        <div
                            class="pws-group-legend-box phenotype-group"
                            :class="row"
                        >
                            &nbsp;
                        </div>
                        {{ row }}
                    </div>
                </div>
                <div
                    class="pws-top-phenotypes-wrapper"
                    :class="
                        limit && limit < topAssociationsFiltered.length
                            ? 'showing-top'
                            : 'showing-all'
                    "
                >
                    <div class="pws-top-phenotypes-bars-wrapper">
                        <div
                            v-for="(row, i) in topAssociationsLimit"
                            :key="row.phenotype"
                            class="pws-top-each-phenotype-wrapper"
                        >
                            <div
                                v-if="i == 0"
                                class="pws-top-phenotypes-yaxis-wrapper"
                                style
                            >
                                <div
                                    style="
                                        position: absolute;
                                        top: -5px;
                                        font-size: 10px;
                                        right: 10px;
                                    "
                                >
                                    {{ getEvalue(row.pValue) }}
                                </div>
                                <div
                                    style="
                                        position: absolute;
                                        top: 40%;
                                        font-size: 10px;
                                        right: 10px;
                                        white-space: nowrap;
                                    "
                                >
                                    -log10(p)
                                </div>
                                <div
                                    style="
                                        position: absolute;
                                        bottom: -5px;
                                        font-size: 10px;
                                        right: 10px;
                                    "
                                >
                                    0
                                </div>
                            </div>
                            <div class="pws-top-each-phenotype">
                                <div
                                    class="
                                        btn btn-sm btn-link
                                        pws-top-each-phenotype-name
                                    "
                                    :style="{
                                        top: 80 - pValueCss(row.pValue) + '%',
                                    }"
                                >
                                    <div class="name-wrapper">
                                        {{ row.description }}
                                    </div>
                                    <div class="options-4-actions">
                                        <div
                                            @click="addPhenotype(row.phenotype)"
                                        >
                                            Add this phenotype below
                                        </div>

                                        <div
                                            v-on:click="
                                                openPage('phenotype.html', {
                                                    phenotype: row.phenotype,
                                                })
                                            "
                                        >
                                            Go to phenotype page
                                        </div>
                                    </div>
                                </div>

                                <div
                                    class="
                                        bubble
                                        phenotype-group
                                        pws-top-each-phenotype-bar
                                    "
                                    :class="row.group"
                                    :style="{
                                        height: +pValueCss(row.pValue) + '%',
                                    }"
                                >
                                    &nbsp;
                                </div>
                                <div class="pws-top-each-phenotype-pvalue">
                                    {{ pValueFormatter(row.pValue) }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div style="position: relative">
                    <b-button
                        v-if="topAssociationsFiltered.length > 10"
                        size="sm"
                        variant="outline-secondary"
                        class="btn-mini show-hide-clumped-associations"
                        :class="
                            limit && limit < topAssociationsFiltered.length
                                ? 'show-all'
                                : 'show-top'
                        "
                        @click="
                            limit =
                                limit && limit < topAssociationsFiltered.length
                                    ? null
                                    : 10
                        "
                    >
                        <span
                            v-if="
                                limit && limit < topAssociationsFiltered.length
                            "
                        >
                            Show All
                            {{ topAssociationsFiltered.length }}
                            Phenotypes
                        </span>
                        <span
                            v-if="!limit && topAssociationsFiltered.length > 10"
                            >Show Only Top Phenotypes</span
                        >
                    </b-button>
                </div>
            </template>
            <template v-else>
                <b-alert show variant="warning">
                    <b-icon icon="exclamation-triangle"></b-icon>There is no
                    trait in this region with p-Value &le; 5e-8
                </b-alert>
            </template>
        </div>

        <div class="pws-bar-view new-phenotypes-with-signal-wrapper hidden">
            <a
                href="javascript:;"
                v-on:click="popOutElement('pws-bar-view')"
                class="pop-out-icon"
                >&nbsp;</a
            >
            <div class="p-bellow-section-header">
                <sup>*</sup> Colored bars summarize bottom-line meta-analyzed
                associations for phenotypes in a group. Hover over bar or expand
                the group to see associations for individual phenotypes.
            </div>

            <div class="pws-phenotype-group-container">
                <div class="pws-phenotype-group-row">
                    <div class="pws-phenotype-group-header">
                        Phenotype group
                    </div>
                    <div class="pws-phenotype-group-wrapper">
                        <div class="legend-scale">
                            <span class="legend-left">0</span>
                            <span class="legend-center">-log10(p)</span>
                            <span class="legend-right" v-if="phenotypes[0]">
                                {{ getEvalue(phenotypes[0]["pValue"]) }}
                            </span>
                        </div>
                        <div class="legend"></div>
                    </div>
                </div>
            </div>
            <div
                v-for="key in Object.keys(topAssociationsGrouped)"
                class="pws-phenotype-group-container pws-phenotype-group"
                :class="key"
                :key="key"
            >
                <div class="pws-phenotype-group-row">
                    <div
                        class="pws-phenotype-group-header"
                        v-on:click="
                            showHideByClass('pws-phenotype-row ' + key2id(key))
                        "
                    >
                        {{ key }}
                        <b-icon-arrows-expand></b-icon-arrows-expand>
                    </div>
                    <div class="pws-phenotype-group-wrapper">
                        <template
                            v-for="(item, i) in topAssociationsGrouped[key]"
                        >
                            <template v-if="i != 0">
                                <div
                                    v-if="item.pValue <= 5e-3"
                                    class="pws-phenotype-summary-row"
                                    :style="{
                                        width: +pValueCss(item.pValue) + '%',
                                    }"
                                    @click="
                                        showHideByClass(
                                            'pws-phenotype-row ' + key2id(key)
                                        )
                                    "
                                    :key="item.phenotype"
                                >
                                    <div
                                        class="pws-progress-bar"
                                        style="width: 100%"
                                    ></div>

                                    <span class="tool-tip">
                                        {{
                                            item.description +
                                            " (" +
                                            pValueFormatter(item.pValue) +
                                            ")"
                                        }}
                                    </span>
                                </div>
                            </template>
                            <div
                                class="pws-phenotype-row"
                                :class="i != 0 ? key2id(key) + ' hidden' : ''"
                                :key="i"
                            >
                                <div
                                    class="pws-progress-bar"
                                    :key="item.phenotype"
                                    :value="pValueCss(item.pValue)"
                                    :style="{
                                        width: +pValueCss(item.pValue) + '%',
                                    }"
                                    @click="
                                        i === 0
                                            ? showHideByClass(
                                                  'pws-phenotype-row ' +
                                                      key2id(key)
                                              )
                                            : i
                                    "
                                >
                                    <span
                                        class="bar-desc"
                                        :style="{
                                            'margin-left':
                                                'calc(' +
                                                pValueCss(item.pValue) +
                                                '% + 10px)',
                                        }"
                                    >
                                        {{ item.description }} ({{
                                            pValueFormatter(item.pValue)
                                        }})
                                        <div class="options-4-actions">
                                            <div
                                                @click="
                                                    addPhenotype(item.phenotype)
                                                "
                                            >
                                                Add this phenotype below
                                            </div>

                                            <div
                                                v-on:click="
                                                    openPage('phenotype.html', {
                                                        phenotype:
                                                            item.phenotype,
                                                    })
                                                "
                                            >
                                                Go to phenotype page
                                            </div>
                                        </div>
                                    </span>
                                </div>
                            </div>
                        </template>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import groupBy from "lodash/groupBy";
import { BootstrapVueIcons } from "bootstrap-vue";
import uiUtils from "@/utils/uiUtils";
import Formatters from "@/utils/formatters";

Vue.use(BootstrapVueIcons);

export default Vue.component("phenotype-signal-mixed", {
    modules: {
        uiUtils,
    },
    components: {},
    props: {
        phenotypes: Array,
        legends: Boolean,
    },

    data() {
        return {
            isActive: false,
            limit: 10,
        };
    },

    computed: {
        topAssociationsHighest: function () {
            return this.phenotypes[0]["pValue"];
        },
        topAssociationsGrouped: function () {
            let data = this.phenotypes;
            let phenotypeMap = this.$store.state.bioPortal.phenotypeMap;

            data.forEach((element) => {
                let phenotype = phenotypeMap[element.phenotype];

                element["group"] = phenotype.group;
                element["description"] = phenotype.description;
            });

            return groupBy(data, "group");
        },
        topAssociations: function () {
            let data = this.phenotypes;
            let phenotypeMap = this.$store.state.bioPortal.phenotypeMap;

            data.forEach((element) => {
                let phenotype = phenotypeMap[element.phenotype];

                element["group"] = phenotype.group.toUpperCase();
                element["description"] = phenotype.description;
            });

            return data;
        },
        topAssociationsFiltered() {
            let data = this.phenotypes;
            let phenotypeMap = this.$store.state.bioPortal.phenotypeMap;
            let filteredData = [];

            data.forEach((element) => {
                let phenotype = phenotypeMap[element.phenotype];

                element["group"] = phenotype.group.toUpperCase();
                element["description"] = phenotype.description;

                if (element.pValue <= 5e-8) filteredData.push(element);
            });
            return filteredData;
        },
        topAssociationsLimit() {
            return this.limit
                ? this.topAssociationsFiltered.slice(0, this.limit)
                : this.topAssociationsFiltered;
        },
        topAssociatedGroups: function () {
            let data = this.phenotypes;
            let phenotypeMap = this.$store.state.bioPortal.phenotypeMap;
            let topGroups = [];

            data.forEach((element) => {
                let phenotype = phenotypeMap[element.phenotype];

                if (element["pValue"] <= 2.5e-6) {
                    topGroups.push(phenotype.group.toUpperCase());
                }
            });

            topGroups = topGroups.filter(function (value, index, self) {
                return self.indexOf(value) === index;
            });

            return topGroups;
        },
    },
    methods: {
        log2css(value) {
            const maxWidth = Math.log10(this.topAssociationsHighest);
            const barWidth = Math.log10(value);

            let calculated = (barWidth / maxWidth) * 100;

            return calculated > 100 ? 100 : calculated;
        },
        key2id(key) {
            return key.toLowerCase().split(" ").join("_");
        },
        getEvalue(number) {
            return -Math.floor(Math.log10(number));
        },
        showHideElement(ELEMENT, FOCUSINPUT) {
            uiUtils.showHideElement(ELEMENT, FOCUSINPUT);
        },
        popOutElement(ELEMENT) {
            uiUtils.popOutElement(ELEMENT);
        },
        openPage(PAGE, PARAMETER) {
            uiUtils.openPage(PAGE, PARAMETER);
        },
        showHideByClass(CLASS) {
            uiUtils.showHideByClass(CLASS);
        },
        pValueCss(value) {
            return Formatters.pValueCss(value, this.topAssociationsHighest);
        },
        pValueFormatter(pValue) {
            return Formatters.pValueFormatter(pValue);
        },
        addPhenotype(phenotype) {
            this.$parent.$parent.pushCriterionPhenotype(phenotype);
            window.location.href = "#associations-table";
        },
        setPhenotype(phenotype) {
            this.$parent.$parent.setCriterionPhenotypes([phenotype]);
            window.location.href = "#associations-table";
        },
    },
});
</script>

<style>
@import url("/css/phenotypeGroups.css");
</style>
