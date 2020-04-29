<template>
    <div>
        <!--<a
            href="javascript:;"
            v-on:click="popOutElement('new-phenotypes-with-signal-wrapper')"
            class="pop-out-icon"
        >&nbsp;</a>-->

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
            v-for="phenotypeList in topAssociationsGrouped"
            class="pws-phenotype-group-container pws-phenotype-group"
            v-if="isVisible(phenotypeList[0].pValue)"
            :class="phenotypeList[0].phenotype.group"
        >
            <div class="pws-phenotype-group-row">
                <div
                    class="pws-phenotype-group-header"
                    @click="showHideByClass('pws-phenotype-row '+phenotypeList[0].hideShowId)"
                >
                    {{phenotypeList[0].phenotype.group}}
                    <b-icon-arrows-expand></b-icon-arrows-expand>
                </div>
                <div class="pws-phenotype-group-wrapper">
                    <template v-for="(item, i) in phenotypeList">
                        <template v-if="i != 0">
                            <div
                                class="pws-phenotype-summary-row"
                                :style="{'width': +log2css(item.pValue)+'%'}"
                                @click="showHideByClass('pws-phenotype-row '+item.hideShowId)"
                            >
                                <div class="pws-progress-bar" style="width: 100%"></div>
                                <span class="marker">
                                    <span
                                        class="tool-tip"
                                    >{{item.phenotype.description+' ('+item.pValue+')'}}</span>
                                </span>
                            </div>
                        </template>
                        <div
                            class="pws-phenotype-row"
                            :class="i != 0 ? item.hideShowId + ' hidden':''"
                        >
                            <div
                                class="pws-progress-bar"
                                :value="log2css(item.pValue)"
                                :style="{'width': +log2css(item.pValue)+'%'}"
                                @click="(i === 0) ? showHideByClass('pws-phenotype-row '+item.hideShowId) : i"
                            >
                                <span
                                    class="bar-desc"
                                    :style="{'margin-left': 'calc('+log2css(item.pValue)+'% + 10px)'}"
                                >
                                    {{item.phenotype.description}} ({{item.pValue}})
                                    <div class="options-4-actions">
                                        <div
                                            @click="$store.commit('setPhenotypeByName', item.phenotype.name)"
                                        >Click to set phenotype</div>
                                        <div
                                            @click="openPage('phenotype.html',{'phenotype':item.phenotype.name})"
                                        >Go to phenotype page</div>
                                    </div>
                                </span>
                            </div>
                        </div>
                    </template>
                </div>
            </div>
        </div>

        <div v-if="!showAll">
            <a class="btn" @click="toggleShowAll">Show all...</a>
        </div>
        <div v-else>
            <a class="btn" @click="toggleShowAll">Show less...</a>
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
        phenotypes: Array,
        threshold: Number
    },

    data() {
        return {
            isActive: false,
            showAll: false
        };
    },

    computed: {
        topAssociationsHighest: function() {
            return this.phenotypes[0]["pValue"];
        },
        topAssociationsGrouped: function() {
            let phenotypeMap = this.$store.state.bioPortal.phenotypeMap;
            let grouped = [];
            let groupMap = {};

            this.phenotypes.forEach(assoc => {
                let phenotype = phenotypeMap[assoc.phenotype];
                let index = groupMap[phenotype.group];

                if (index === undefined) {
                    index = grouped.length;
                    grouped.push([]);
                    groupMap[phenotype.group] = index;
                }

                grouped[index].push({
                    ...assoc,
                    phenotype,
                    hideShowId: phenotype.group
                        .replace(/\s+/g, "_")
                        .toLowerCase()
                });
            });

            for (let i = 0; i < grouped.length; i++) {
                grouped[i] = grouped[i].sort((a, b) => a.pValue - b.pValue);
            }

            return grouped.sort((a, b) => a[0].pValue - b[0].pValue);
        }
    },
    methods: {
        ...uiUtils,

        toggleShowAll() {
            this.showAll = !this.showAll;
        },
        isVisible(p) {
            return this.showAll || p < (this.threshold || 5e-8);
        },
        log2css(value) {
            const maxWidth = Math.log10(this.topAssociationsHighest);
            const barWidth = Math.log10(value);

            let calculated = (barWidth / maxWidth) * 100;

            return calculated > 100 ? 100 : calculated;
        },
        getEvalue(number) {
            return -Math.floor(Math.log10(number));
        }
    }
});
</script>

<style>
@import url("/css/phenotypeGroups.css");
</style>
