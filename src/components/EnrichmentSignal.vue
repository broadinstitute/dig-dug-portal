<template>
    <div>
        <div class="pws-merged-view">
            <h6>Traits with p-value &le; 5e-8</h6>
            <template>
                <div class="pws-group-legend-wrapper">
                    <div v-for="row in enrichments" class="pws-group-legend">
                        <div class="pws-group-legend-box phenotype-group" :class=" row">&nbsp;</div>
                        {{row}}
                    </div>
                </div>
                <div class="pws-top-phenotypes-wrapper">
                    <div class="pws-top-phenotypes-bars-wrapper">
                        <div
                            v-for="(row, i) in enrichments"
                            v-if="row.pValue <= 5e-8"
                            class="pws-top-each-phenotype-wrapper"
                        >
                            <div v-if="i == 0" class="pws-top-phenotypes-yaxis-wrapper" style>
                                <div
                                    style="position: absolute;top: -5px;font-size: 10px;right: 10px;"
                                >{{getEvalue(row.pValue)}}</div>
                                <div
                                    style="position: absolute;top: 40%;font-size: 10px;right: 10px;white-space: nowrap;"
                                >-log10(p)</div>
                                <div
                                    style="position: absolute;bottom: -5px;font-size: 10px;right: 10px;"
                                >0</div>
                            </div>
                            <div class="pws-top-each-phenotype">
                                <div
                                    class="btn btn-sm btn-link pws-top-each-phenotype-name"
                                    :style="{'top': (80 - log2css(row.pValue))+'%' }"
                                >
                                    <div class="name-wrapper">{{row.tissue}}</div>
                                    <div class="options-4-actions">
                                        <div
                                            @click="$store.commit('setPhenotypeByName', row.tissue)"
                                        >Click to set phenotype</div>
                                        <div
                                            v-on:click="openPage('phenotype.html',{'phenotype':row.tissue})"
                                        >Go to phenotype page</div>
                                    </div>
                                </div>

                                <div
                                    class="bubble phenotype-group pws-top-each-phenotype-bar"
                                    :class=" row.group"
                                    :style="{'height': +log2css(row.pValue)+'%'}"
                                >&nbsp;</div>
                                <div class="pws-top-each-phenotype-pvalue">{{row.pValue}}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
            <template v-else>
                <b-alert show variant="warning">
                    <b-icon icon="exclamation-triangle"></b-icon>There is no trait in this region with p-Value &le; 5e-8
                </b-alert>
            </template>

            <!-- <h6>Traits with p-value &gt; 5e-8</h6>
            <div class="phenotypes-with-signal-wrapper" style="height: auto !important;">
                <div
                    v-for="(row, i) in topAssociations2nd"
                    v-if="row.pValue > 5e-8 && i <= 30"
                    class="bubble phenotype-with-signal"
                    :class=" row.pValue <= 5e-3 ? 'moderate':'none'"
                >
                    {{row.description}}
                    <div class="options-4-actions">
                        <div
                            @click="$store.commit('setPhenotypeByName', row.phenotype)"
                        >Click to set phenotype</div>
                        <div
                            v-on:click="openPage('phenotype.html',{'phenotype':row.phenotype})"
                        >Go to phenotype page</div>
                    </div>
                </div>
                <small>
                    <a
                        href="javascript:;"
                        v-on:click="showHideElement('no-signal-wrapper',)"
                    >>> View more traits</a>
                </small>
            </div>-->

            <!-- <div
                class="phenotypes-with-signal-wrapper no-signal-wrapper hidden"
                style="height: auto !important;"
            >
                <div
                    v-for="(row, i) in topAssociations"
                    v-if="row.pValue > 5e-8 && i > 30"
                    class="bubble phenotype-with-signal"
                    :class=" row.pValue <= 5e-3 ? 'moderate':'none'"
                >
                    {{row.description}}
                    <div class="options-4-actions">
                        <div
                            @click="$store.commit('setPhenotypeByName', row.phenotype)"
                        >Click to set phenotype</div>
                        <div
                            v-on:click="openPage('phenotype.html',{'phenotype':row.phenotype})"
                        >Go to phenotype page</div>
                    </div>
                </div>
            </div>-->
        </div>
    </div>
</template>
<script>
import Vue from "vue";
import groupBy from "lodash/groupBy";
import { BootstrapVueIcons } from "bootstrap-vue";
import uiUtils from "@/utils/uiUtils";

Vue.use(BootstrapVueIcons);

export default Vue.component("enrichment-signal", {
    modules: {
        uiUtils
    },
    components: {},
    props: {
        phenotypes: Array,
        enrichments: Array
    },

    data() {
        return {
            isActive: false
        };
    },

    computed: {
        topAssociationsHighest: function() {
            return this.phenotypes[0]["pValue"];
        },
        topAssociationsGrouped: function() {
            let data = this.phenotypes;
            let phenotypeMap = this.$store.state.bioPortal.phenotypeMap;

            data.forEach(element => {
                let phenotype = phenotypeMap[element.phenotype];

                element["group"] = phenotype.group;
                element["description"] = phenotype.description;
            });

            return groupBy(data, "group");
        },
        topAssociations: function() {
            let data = this.phenotypes;
            let phenotypeMap = this.$store.state.bioPortal.phenotypeMap;

            data.forEach(element => {
                let phenotype = phenotypeMap[element.phenotype];

                element["group"] = phenotype.group.toUpperCase();
                element["description"] = phenotype.description;
            });

            return data;
        },
        topAssociations2nd: function() {
            let data = this.phenotypes;
            let phenotypeMap = this.$store.state.bioPortal.phenotypeMap;
            let filteredData = [];

            data.forEach(element => {
                let phenotype = phenotypeMap[element.phenotype];

                element["group"] = phenotype.group.toUpperCase();
                element["description"] = phenotype.description;

                if (element.pValue > 5e-8) filteredData.push(element);
            });

            return filteredData;
        },
        topAssociatedGroups: function() {
            let data = this.phenotypes;
            let phenotypeMap = this.$store.state.bioPortal.phenotypeMap;
            let topGroups = [];

            data.forEach(element => {
                let phenotype = phenotypeMap[element.phenotype];

                if (element["pValue"] <= 2.5e-6) {
                    topGroups.push(phenotype.group.toUpperCase());
                }
            });

            topGroups = topGroups.filter(function(value, index, self) {
                return self.indexOf(value) === index;
            });

            return topGroups;
        }
    },
    methods: {
        log2css(value) {
            const maxWidth = Math.log10(this.topAssociationsHighest);
            const barWidth = Math.log10(value);

            let calculated = (barWidth / maxWidth) * 100;

            return calculated > 100 ? 100 : calculated;
        },
        key2id(key) {
            return key
                .toLowerCase()
                .split(" ")
                .join("_");
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
        }
    }
});
</script>

<style>
@import url("/css/phenotypeGroups.css");
</style>
