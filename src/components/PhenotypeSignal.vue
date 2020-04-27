<template>
    <div class="new-phenotypes-with-signal-wrapper">
        <a
            href="javascript:;"
            v-on:click="popOutElement('new-phenotypes-with-signal-wrapper')"
            class="pop-out-icon"
        >&nbsp;</a>

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
                            >
                                <div class="pws-progress-bar" style="width: 100%"></div>
                                <span class="marker">
                                    <span class="tool-tip">{{item.description+' ('+item.pValue+')'}}</span>
                                </span>
                            </div>
                        </template>
                        <div class="pws-phenotype-row" :class="i != 0 ? key2id(key)+' hidden':''">
                            <div
                                class="pws-progress-bar"
                                :key="item.phenotype"
                                :value="log2css(item.pValue)"
                                :style="{'width': +log2css(item.pValue)+'%'}"
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
import PhenotypeSignalItem from "@/components/PhenotypeSignalItem.vue";
import uiUtils from "@/utils/uiUtils";

Vue.use(BootstrapVueIcons);

export default Vue.component("phenotype-signal", {
    modules: {
        uiUtils
    },
    components: {
        PhenotypeSignalItem
    },
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
