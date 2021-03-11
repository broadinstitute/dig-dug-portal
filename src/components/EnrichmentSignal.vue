<template>
    <div>
        <div class="pws-merged-view">
            <h6>Tissue Annotations with p-value &le; 0.05</h6>
            <template>
                <div class="pws-group-legend-wrapper">
                    <div v-for="annotationGroup in annotationGroups" class="pws-group-legend">
                        <div class="pws-group-legend-box annotation-group" :class="annotationGroup">&nbsp;</div>
                        {{annotationGroup}}
                    </div>
                </div>
                <div class="pws-top-phenotypes-wrapper">
                    <div class="pws-top-phenotypes-bars-wrapper">
                        <div
                            v-for="(row, i) in sortedEnrichments"
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
                                    <div class="name-wrapper">{{!!row.tissue ? row.tissue : row.tissueId }}</div>
                                    <div class="options-4-actions">
                                       <slot name="tooltip" :row="row"></slot>
                                    </div>
                                </div>

                                <div
                                    class="bubble annotation-group pws-top-each-phenotype-bar"
                                    :class="annotationGroup(row.annotation)"
                                    :style="{'height': +log2css(row.pValue)+'%' }"
                                >&nbsp;</div>
                                <div class="pws-top-each-phenotype-pvalue">{{pValueFormatter(row.pValue)}}</div>
                            </div>
                        </div>
                    </div>
                </div>
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
            </div> -->

            <div class="pws-bar-view new-phenotypes-with-signal-wrapper">
                <a
                    href="javascript:;"
                    v-on:click="popOutElement('pws-bar-view')"
                    class="pop-out-icon"
                >&nbsp;</a>

                <div class="p-bellow-section-header">
                    <sup>*</sup> Colored bars summarize bottom-line meta-analyzed associations for phenotypes in a group. Hover over bar or expand the group to see associations for individual phenotypes.
                </div>

                <div class="pws-phenotype-group-container">
                    <div class="pws-phenotype-group-row">
                        <div class="pws-phenotype-group-header">Annotation group</div>
                        <div class="pws-phenotype-group-wrapper">
                            <div class="legend-scale">
                                <span class="legend-left">0</span>
                                <span class="legend-center">-log10(p)</span>
                                <span
                                    class="legend-right"
                                    v-if="sortedEnrichments[0]"
                                >{{getEvalue(sortedEnrichments[0]["pValue"])}}</span>
                            </div>
                            <div class="legend"></div>
                        </div>
                    </div>
                </div>
                <div
                    v-for="key in annotationGroups"
                    class="pws-phenotype-group-container pws-phenotype-group"
                    :class="key"
                    :key="key"
                >
                    <div class="pws-phenotype-group-row">
                        <div
                            class="pws-phenotype-group-header"
                            v-on:click="showHideByClass('pws-phenotype-row '+key2id(key))"
                        >
                            {{key}}
                            <b-icon-arrows-expand></b-icon-arrows-expand>
                        </div>
                        <div class="pws-phenotype-group-wrapper">
                            <template v-for="(item, i) in groupedEnrichments[key]">
                                <template v-if="i != 0">
                                    <div
                                        v-if="item.pValue <= 5e-3"
                                        class="pws-phenotype-summary-row"
                                        :style="{'width': +log2css(item.pValue)+'%'}"
                                        @click="showHideByClass('pws-phenotype-row '+key2id(key))"
                                    >
                                        <div class="pws-progress-bar" style="width: 100%"></div>

                                        <span class="tool-tip">{{item.tissue+' ('+item.pValue+')'}}</span>
                                    </div>
                                </template>
                                <div
                                    class="pws-phenotype-row"
                                    :class="i != 0 ? key2id(key)+' hidden':''"
                                >
                                    <div
                                        class="pws-progress-bar annotation-group"
                                        :class="annotationGroup(item.annotation)"
                                        :key="item.tissue"
                                        :value="log2css(item.pValue)"
                                        :style="{'width': +log2css(item.pValue)+'%'}"
                                        @click="(i === 0) ? showHideByClass('pws-phenotype-row '+key2id(key)) : i"
                                    >
                                        <span
                                            class="bar-desc"
                                            :style="{'margin-left': 'calc('+log2css(item.pValue)+'% + 10px)'}"
                                        >
                                            {{item.tissue}} ({{pValueFormatter(item.pValue)}})
                                            <div class="options-4-actions">
                                                <slot name="tooltip" :row="item"></slot>
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
    </div>
</template>
<script>
import Vue from "vue";
import { BootstrapVueIcons } from "bootstrap-vue";
import { sortBy, findKey, groupBy } from "lodash"
import uiUtils from "@/utils/uiUtils";
import Formatters from "@/utils/formatters";
Vue.use(BootstrapVueIcons);

const regularAnnotations = {
    "AccessibleChromatin":  ["AccessibleChromatin"], 

    "Enhancer": ["Enhancer",  
    "EnhancerActive1", 
    "EnhancerActive2", 
    "EnhancerWeak", 
    "EnhancerGenic1", 
    "EnhancerGeni"],

    "GenePrediction": ["GenePrediction"],
    "Promoter": ["LPromoterBivalent", 
        "PromoterFlanking", 
    "PromoterActive", 
    "PromoterWeak", 
    "PromoterFlankingDownstream", 
    "PromoterFlankingUpstream", 
    "PromoterBivalentFlanking"],

    "RepressedPolycomb": ["RepressedPolycombWeak", "RepressedPolycomb"],

    "Transcription": ["Transcription", 
    "TranscriptionWeak", 
    "TranscriptionFlanking"]
}

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
        sortedEnrichments() {
            return sortBy(this.enrichments
                .filter(el => el.pValue <= 0.05)
                .filter(el => !!el.tissue)
                .filter(el => Object.values(regularAnnotations).flatMap(id=>id).includes(el.annotation)), 
            'pValue')
        },
        lowestPvalue: function() {
            return this.sortedEnrichments[0]["pValue"]
        },
        annotations() {
            return Array.from(new Set(this.sortedEnrichments.map(el => el.annotation)))
        },
        annotationGroups() {
            return Array.from(new Set(this.annotations.map(annotation => this.annotationGroup(annotation))))
        },
        groupedEnrichments() {
            return groupBy(this.sortedEnrichments.map(enrichment => ({
                ...enrichment,
                annotationGroup: this.annotationGroup(enrichment.annotation)
            })), 'annotationGroup')
        }
        // topAssociationsGrouped: function() {
        //     let data = this.phenotypes;
        //     let phenotypeMap = this.$store.state.bioPortal.phenotypeMap;

        //     data.forEach(element => {
        //         let phenotype = phenotypeMap[element.phenotype];

        //         element["group"] = phenotype.group;
        //         element["description"] = phenotype.description;
        //     });

        //     return groupBy(data, "group");
        // },
        // topAssociations: function() {
        //     let data = this.phenotypes;
        //     let phenotypeMap = this.$store.state.bioPortal.phenotypeMap;

        //     data.forEach(element => {
        //         let phenotype = phenotypeMap[element.phenotype];

        //         element["group"] = phenotype.group.toUpperCase();
        //         element["description"] = phenotype.description;
        //     });

        //     return data;
        // },
        // topAssociations2nd: function() {
        //     let data = this.phenotypes;
        //     let phenotypeMap = this.$store.state.bioPortal.phenotypeMap;
        //     let filteredData = [];

        //     data.forEach(element => {
        //         let phenotype = phenotypeMap[element.phenotype];

        //         element["group"] = phenotype.group.toUpperCase();
        //         element["description"] = phenotype.description;

        //         if (element.pValue > 5e-8) filteredData.push(element);
        //     });

        //     return filteredData;
        // },
        // topAssociatedGroups: function() {
        //     let data = this.phenotypes;
        //     let phenotypeMap = this.$store.state.bioPortal.phenotypeMap;
        //     let topGroups = [];

        //     data.forEach(element => {
        //         let phenotype = phenotypeMap[element.phenotype];

        //         if (element["pValue"] <= 2.5e-6) {
        //             topGroups.push(phenotype.group.toUpperCase());
        //         }
        //     });

        //     topGroups = topGroups.filter(function(value, index, self) {
        //         return self.indexOf(value) === index;
        //     });

        //     return topGroups;
        // }
    },
    methods: {
        pValueFormatter: Formatters.pValueFormatter,
        annotationGroup(annotation) {
            return findKey(regularAnnotations, o => o.includes(annotation))
        },
        log2css(value) {
            const maxWidth = Math.log10(this.lowestPvalue);
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
.annotation-group.AccessibleChromatin {
    background-color: #048845;
}
.annotation-group.GenePrediction {
    background-color: #5555ff;
}
.annotation-group.Enhancer {
    background-color: #ee3124;
}
.annotation-group.Transcription {
    background-color: #0000ff;
}
.annotation-group.Promoter {
    background-color: #fcc500;
}
.annotation-group.RepressedPolycomb {
    background-color: #ff55ff;
}
.annotation-group {
    background-color: #888888;
}



</style>
