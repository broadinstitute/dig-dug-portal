<template>
    <div class="phenotypes-with-signal-wrapper new-phenotypes-with-signal-wrapper">
        <a
            href="javascript:;"
            v-on:click="popOutElement('new-phenotypes-with-signal-wrapper')"
            class="pop-out-icon"
        >&nbsp;</a>
        <b-container fluid="sm">
            <b-form-row>
                <div class="phenotype-group-header"></div>
                <div class="phenotype_group_wrapper">
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
            </b-form-row>
        </b-container>
        <b-container fluid="sm" v-for="key in Object.keys(topAssociationsGrouped)" :key="key">
            <b-form-row>
                <div class="phenotype-group-header" v-b-toggle="key2id(key)">
                    {{ key }}
                    <b-icon-arrows-expand></b-icon-arrows-expand>
                </div>

                <div class="pt-1 phenotype_group_wrapper">
                    <b-progress class="phenotype_group" :class="key" height="1.5rem">
                        <template v-for="(item, i) in topAssociationsGrouped[key]">
                            <template v-if="i == 0">
                                <b-progress-bar
                                    :key="item.phenotype"
                                    :value="log2css(item.pValue)"
                                    :title="item.description"
                                    show
                                    v-b-tooltip
                                >
                                    <span
                                        class="bar-desc"
                                        :style="{'margin-left': 'calc('+log2css(item.pValue)+'% + 10px)'}"
                                        @click="$store.commit('setPhenotypeByName', item.phenotype)"
                                        v-b-tooltip.right
                                        title="Click to set phenotype"
                                    >{{item.description}} ({{item.pValue}})</span>
                                </b-progress-bar>
                            </template>
                            <template v-else>
                                <phenotype-signal-item
                                    v-if="item.pValue <= 5e-3"
                                    :key="item.phenotype"
                                    :title="item.description"
                                    :width="log2css(item.pValue)"
                                ></phenotype-signal-item>
                            </template>
                        </template>
                    </b-progress>
                    <b-collapse :id="key2id(key)" accordion="my-accordion">
                        <template v-for="(item, i) in topAssociationsGrouped[key]">
                            <template v-if="i != 0 && item.pValue <= 5e-3">
                                <b-progress
                                    height="1.5rem"
                                    class="phenotype_group"
                                    :class="item.group"
                                    :key="item.phenotype"
                                >
                                    <b-progress-bar :value="log2css(item.pValue)">
                                        <span
                                            class="bar-desc"
                                            :style="{'margin-left': 'calc('+log2css(item.pValue)+'% + 10px)'}"
                                            @click="$store.commit('setPhenotypeByName', item.phenotype)"
                                            v-b-tooltip.right
                                            title="Click to set phenotype"
                                        >{{item.description}} ({{item.pValue}})</span>
                                    </b-progress-bar>
                                </b-progress>
                            </template>
                        </template>
                    </b-collapse>
                </div>
            </b-form-row>
        </b-container>
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
            const minp = 0;
            const maxp = 100;
            const minv = -Math.log10(10);
            const maxv = -Math.log10(this.topAssociationsHighest);
            const scale = (maxv - minv) / (maxp - minp);

            let calculated = -(Math.log(value) - minv) / scale + minp;
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
        }
    }
});
</script>

<style>
@import url("/css/phenotypeGroups.css");
</style>
