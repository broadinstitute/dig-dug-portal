<template>
    <div>
        <div class="pws-merged-view">
            <h6>Traits with p-value &lt;= 2.5e-6</h6>
            <div style="width: 90%; text-align: right;     margin-bottom: -30px;">
                <div
                    v-for="row in topAssociatedGroups"
                    style="display:inline-block; font-size: 12px;padding-right: 10px"
                >
                    <div
                        class="bubble phenotype-group"
                        :class=" row"
                        :style="{'height': '10px','width':'10px','display':'inline-block'}"
                    >&nbsp;</div>
                    {{row}}
                </div>
            </div>
            <div style="height: 100px; position:relative; text-align: center; margin: 30px 0; ">
                <div
                    v-for="(row, i) in topAssociations"
                    v-if="row.pValue <= 2.5e-6"
                    style="display:inline-block; height: 100%; text-align: center; width: 120px;"
                >
                    <div
                        v-if="i == 0"
                        style="width: 5px;height: 80%;position: absolute;border-bottom: 1px solid rgb(204, 204, 204);border-top: 1px solid rgb(204, 204, 204);margin-left: -5px;"
                    >
                        <div
                            style="position: absolute;top: -5px;font-size: 10px;right: 10px;"
                        >{{getEvalue(row.pValue)}}</div>
                        <div
                            style="position: absolute;top: 40%;font-size: 10px;right: 10px;white-space: nowrap;"
                        >-log10(p)</div>
                        <div style="position: absolute;bottom: -5px;font-size: 10px;right: 10px;">0</div>
                    </div>
                    <div
                        style="width:100%; height:80%; position: relative; border-bottom:solid 1px #ccc;"
                        :style=" i == 0 ? 'border-left:solid 1px #ccc;':'' "
                    >
                        <div
                            class="btn btn-sm btn-leight"
                            style="font-size: 13px; position: absolute; width: 100%; left:0; text-align: center;"
                            :style="{'top': (65 - log2css(row.pValue))+'%'}"
                        >{{row.pValue}}</div>
                        <div
                            class="bubble phenotype-group"
                            :class=" row.group"
                            :style="{'height': +log2css(row.pValue)+'%','width':'20px', 'padding':'0','position':'absolute','bottom':'0','margin':'0','left':'calc(50% - 10px)'}"
                        >&nbsp;</div>
                    </div>
                    <div
                        class="btn btn-sm btn-link associated-phenotype-high"
                        style="font-size: 13px; height: 20%; position: relative; line-height: 14px;width: 100%"
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
                </div>
            </div>

            <h6>Traits with p-value &lt;= 5e-3 and &gt;= 2.5e-6</h6>
            <div class="phenotypes-with-signal-wrapper" style="height: 150px; margin-bottom: 10px">
                <div
                    v-for="row in topAssociations"
                    v-if="row.pValue > 2.5e-6 && row.pValue <= 5e-3"
                    class="bubble phenotype-with-signal moderate"
                >{{row.description}}</div>
            </div>
            <small>
                <a
                    href="javascript:;"
                    v-on:click="showHideElement('no-signal-wrapper',)"
                >View traits with p-value &gt; 5e-3</a>
            </small>
            <div
                class="phenotypes-with-signal-wrapper no-signal-wrapper hidden"
                style="height: 150px;"
            >
                <div
                    v-for="row in topAssociations"
                    v-if="row.pValue > 5e-3"
                    class="bubble phenotype-with-signal none"
                >{{row.description}}</div>
            </div>
        </div>

        <div class="pws-bar-view new-phenotypes-with-signal-wrapper hidden">
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
                    <div class="pws-phenotype-group-header">Phenotype group</div>
                    <div class="pws-phenotype-group-wrapper">
                        <div class="legend-scale">
                            <span class="legend-left">0</span>
                            <span class="legend-center">-log10(p)</span>
                            <span
                                class="legend-right"
                                v-if="phenotypes[0]"
                            >{{getEvalue(phenotypes[0]["pValue"])}}</span>
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
                        v-on:click="showHideByClass('pws-phenotype-row '+key2id(key))"
                    >
                        {{key}}
                        <b-icon-arrows-expand></b-icon-arrows-expand>
                    </div>
                    <div class="pws-phenotype-group-wrapper">
                        <template v-for="(item, i) in topAssociationsGrouped[key]">
                            <template v-if="i != 0">
                                <div
                                    v-if="item.pValue <= 5e-3"
                                    class="pws-phenotype-summary-row"
                                    :style="{'width': +log2css(item.pValue)+'%'}"
                                    @click="showHideByClass('pws-phenotype-row '+key2id(key))"
                                >
                                    <div class="pws-progress-bar" style="width: 100%"></div>

                                    <span class="tool-tip">{{item.description+' ('+item.pValue+')'}}</span>
                                </div>
                            </template>
                            <div
                                class="pws-phenotype-row"
                                :class="i != 0 ? key2id(key)+' hidden':''"
                            >
                                <div
                                    class="pws-progress-bar"
                                    :key="item.phenotype"
                                    :value="log2css(item.pValue)"
                                    :style="{'width': +log2css(item.pValue)+'%'}"
                                    @click="(i === 0) ? showHideByClass('pws-phenotype-row '+key2id(key)) : i"
                                >
                                    <span
                                        class="bar-desc"
                                        :style="{'margin-left': 'calc('+log2css(item.pValue)+'% + 10px)'}"
                                    >
                                        {{item.description}} ({{item.pValue}})
                                        <div class="options-4-actions">
                                            <div
                                                @click="$store.commit('setPhenotypeByName', item.phenotype)"
                                            >Click to set phenotype</div>
                                            <div
                                                v-on:click="openPage('phenotype.html',{'phenotype':item.phenotype})"
                                            >Go to phenotype page</div>
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

Vue.use(BootstrapVueIcons);

export default Vue.component("phenotype-signal-mixed", {
    modules: {
        uiUtils
    },
    components: {},
    props: {
        phenotypes: Array
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
