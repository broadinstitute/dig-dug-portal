<template>
    <div class="forest-plot-card-wrapper">
        <div class="forest-plot-html-legend-wrapper">
            <div class="forest-plot-html-legend-content">
                <ul>
                    <li>Hover over each row for more information.</li>
                </ul>
                <ul>
                    <li>{{ sortBy + ":" }}</li>
                    <li>
                        <span class="beta-box p-significant">&nbsp;</span>
                        <span class="label"
                            >{{ sortBy }}&nbsp;&lt;&equals;&nbsp;{{
                                formatPvalue(significant)
                            }}</span
                        >
                    </li>
                    <li>
                        <span class="beta-box p-moderate">&nbsp;</span>
                        <span class="label"
                            >{{ formatPvalue(significant) }}&nbsp;&lt;&nbsp;{{
                                sortBy
                            }}&nbsp;&lt;&equals;&nbsp;{{
                                formatPvalue(moderate)
                            }}</span
                        >
                    </li>
                    <li>
                        <span class="beta-box p-weak">&nbsp;</span>
                        <span class="label"
                            >{{ formatPvalue(moderate) }}&nbsp;&lt;&nbsp;{{
                                sortBy
                            }}&nbsp;&lt;&equals;&nbsp;{{
                                formatPvalue(weak)
                            }}</span
                        >
                    </li>
                    <li>
                        <span class="beta-box">&nbsp;</span>
                        <span class="label"
                            >{{ sortBy }}&nbsp;&gt;&nbsp;{{
                                formatPvalue(weak)
                            }}</span
                        >
                    </li>
                </ul>
                <ul>
                    <li>
                        <span style="color: #f00">*</span> 95% confidence
                        interval low &nbsp;&lt;&nbsp; -1 or 95% confidence
                        interval high &nbsp;&gt;&nbsp; 1. Hover phenotype name
                        for data.
                    </li>
                </ul>

                <!--<ul v-if="!!labelMap">
                    <li>{{'Group:'}}</li>
                    <template>
                        <li v-for="group in plotData.label_group">
                            <span :class="'legend-phenotype-group-dot '+group">&nbsp;</span>
                            <span class="label">{{group}}</span>
                        </li>
                    </template>
                </ul>-->
            </div>
        </div>
        <div class="forest-plot-html-wrapper row">
            <!--<div class="forest-plot-ui-options">
                <div class="show-groups-wrapper">
                    <input
                        type="checkbox"
                        v-model="groupsShown"
                        id="show_groups"
                        @change="showGroups()"
                    />
                    <label for="show_groups">Show groups</label>
                </div>
                <div class="sort-groups-wrapper">
                    <input
                        type="checkbox"
                        v-model="groupsSort"
                        id="sort_groups"
                        @change="sortByGroup()"
                    />
                    <label for="sort_groups">Sort by group</label>
                </div>
            </div>-->

            <div class="start-min">{{ plotData.low_min }}</div>
            <div class="beta-0" :style="'left:' + plotData.beta_0 + '%;'">
                <label>0</label>
            </div>
            <div class="end-max">{{ plotData.high_max }}</div>

            <div
                v-for="(value, index) in plotData.data"
                class="forest-plot-html-row"
                :class="
                    index < (currentPage - 1) * perPage ||
                    index >= currentPage * perPage
                        ? 'hidden'
                        : ''
                "
            >
                <!--<div
                    v-if="!!labelMap[value[labelBy]]"
                    :class="'hidden phenotype-group-dot '+labelMap[value[labelBy]].group"
                >
                    <span class="phenotype-group-name">{{labelMap[value[labelBy]].group}}</span>
                </div>-->
                <div
                    v-if="!!labelMap[value[labelBy]]"
                    :style="
                        'width:' + value.width + '%; left:' + value.left + '%;'
                    "
                    :class="
                        'forest-plot-html-item ' +
                        (value.width > 90 ? 'too-wide-item' : '')
                    "
                >
                    <span
                        :class="
                            'phenotype-name ' +
                            (value.left == 0 && value.width == 100
                                ? 'off-chart'
                                : value.left > value.right
                                ? 'left'
                                : 'right')
                        "
                    >
                        {{ labelMap[value[labelBy]].description }}
                        <!--<span
                            class="order-value"
                        >{{' ('+formatPvalue(value[sortBy])+')'}}</span>-->
                    </span>
                    <div
                        :class="
                            'forest-plot-more-info ' +
                            (value.left == 0 && value.width == 100
                                ? 'off-chart'
                                : value.left > value.right
                                ? 'right'
                                : 'left')
                        "
                        v-if="!!labelMap[value[labelBy]]"
                    >
                        <ul>
                            <li>{{ labelMap[value[labelBy]].description }}</li>
                            <li v-if="!!labelMap[value[labelBy]].group">
                                {{ "Group: "
                                }}{{ labelMap[value[labelBy]].group }}
                            </li>
                            <li>
                                {{ sortBy + ": "
                                }}{{ formatPvalue(value[sortBy]) }}
                            </li>
                            <li>
                                {{ "Beta: " }}{{ value[bulletBy].toFixed(3) }}
                            </li>
                            <li>
                                {{ "95% confidence interval low: "
                                }}{{ value.low.toFixed(3) }}
                            </li>
                            <li>
                                {{ "95% confidence interval high: "
                                }}{{ value.high.toFixed(3) }}
                            </li>
                        </ul>
                    </div>
                </div>
                <div
                    v-if="!!labelMap[value[labelBy]]"
                    class="beta-box"
                    :class="
                        value[sortBy] < significant
                            ? 'p-significant'
                            : value[sortBy] <= moderate
                            ? 'p-moderate'
                            : value[sortBy] <= weak
                            ? 'p-weak'
                            : ''
                    "
                    :style="'left:calc(' + value.beta_position + '% - 6px);'"
                >
                    &nbsp;
                </div>
            </div>
        </div>
        <b-pagination
            class="pagination-sm justify-content-center"
            v-model="currentPage"
            :total-rows="rows"
            :per-page="perPage"
        ></b-pagination>
    </div>
</template>

<script>
import Vue from "vue";
import { cloneDeep } from "lodash";
import { BootstrapVueIcons } from "bootstrap-vue";
import sortUtils from "@/utils/sortUtils";
import uiUtils from "@/utils/uiUtils";
import formatters from "@/utils/formatters";

Vue.use(BootstrapVueIcons);

export default Vue.component("forest-plot-html", {
    props: [
        "forestPlotData",
        "start",
        "end",
        "sortBy",
        "bulletBy",
        "labelBy",
        "labelMap",
        "significant",
        "moderate",
        "weak",
        "stdErr",
        "countDichotomous",
        "filter",
    ],
    data() {
        return {
            perPage: 25,
            currentPage: 1,
            groupsShown: null,
            groupsSort: null,
        };
    },
    modules: {
        uiUtils,
        sortUtils,
        formatters,
    },
    mounted: function () {},
    computed: {
        legendContent() {
            if (!!this.forestPlotData) {
            }
        },
        plotData() {
            let content = {};
            content["data"] = [];

            if (!!this.forestPlotData) {
                let forestPlotData = cloneDeep(this.forestPlotData);
                forestPlotData.map((d) => {
                    if (!!this.labelMap[d[this.labelBy]]) {
                        content["data"].push(d);
                    }
                });

                let tempCiStart = 0,
                    tempCiEnd = 0;

                let labelGroup = [];

                content["data"].map((d) => {
                    console.log(
                        this.labelMap[d[this.labelBy]].description,
                        d[this.stdErr]
                    );
                    let dichotomous =
                        this.countDichotomous == 1
                            ? this.labelMap[d[this.labelBy]].dichotomous
                            : 0;

                    let high = dichotomous
                        ? Math.exp(d[this.bulletBy] + d[this.stdErr] * 1.96)
                        : d[this.bulletBy] + d[this.stdErr] * 1.96;

                    tempCiEnd = high > tempCiEnd ? high : tempCiEnd;
                    let low = dichotomous
                        ? Math.exp(d[this.bulletBy] - d[this.stdErr] * 1.96)
                        : d[this.bulletBy] - d[this.stdErr] * 1.96;

                    tempCiStart = low < tempCiStart ? low : tempCiStart;

                    let measure = dichotomous
                        ? Math.exp(d[this.bulletBy])
                        : d[this.bulletBy];

                    d["high"] = high;
                    d["low"] = low;
                    d["measure"] = measure;
                    d["group"] = this.labelMap[d[this.labelBy]].group;
                    labelGroup.push(this.labelMap[d[this.labelBy]].group);
                });

                content["low_min"] =
                    tempCiStart.toFixed(3) < -1 ? -1 : tempCiStart.toFixed(3);
                content["high_max"] =
                    tempCiEnd.toFixed(3) > 1 ? 1 : tempCiEnd.toFixed(3);
                content["max_min_difference"] =
                    content["high_max"] - content["low_min"];
                content["label_group"] = labelGroup.filter(
                    (v, i, arr) => arr.indexOf(v) == i
                );

                content["label_group"].sort();

                content["beta_0"] =
                    ((content["max_min_difference"] - content["high_max"]) /
                        content["max_min_difference"]) *
                    100;

                let self = this;

                content["data"].map((item) => {
                    let updated = item;
                    let itemWidth =
                        ((item.high - item.low) / content.max_min_difference) *
                        100;
                    itemWidth = itemWidth > 100 ? 100 : itemWidth;
                    let itemLeft =
                        ((item.low - content.low_min) /
                            content.max_min_difference) *
                        100;
                    itemLeft = itemLeft < 0 ? 0 : itemLeft;
                    let itemRight =
                        ((content.high_max - item.high) /
                            content.max_min_difference) *
                        100;

                    let itemBeta =
                        ((item.measure - content.low_min) /
                            content.max_min_difference) *
                        100;

                    updated["width"] = itemWidth;
                    updated["left"] = itemLeft;
                    updated["right"] = itemRight;
                    updated["beta_position"] = itemBeta;
                    updated["phenotype"] = item.phenotype;
                    return updated;
                });
            }

            if (!!this.filter) {
                content.data = content.data.filter(this.filter);
            }
            return content;
        },
        rows() {
            return this.plotData.data.length;
        },
    },
    watch: {},
    methods: {
        showLegends(ELEMENT) {
            uiUtils.showHideElement(ELEMENT);
        },
        showGroups() {
            let checked = document.getElementById("show_groups").checked;
            let groupDots = document.querySelectorAll(".phenotype-group-dot");

            groupDots.forEach(function (groupDot) {
                checked == true
                    ? groupDot.classList.remove("hidden")
                    : groupDot.classList.add("hidden");
            });
        },
        sortByGroup() {
            let checked = document.getElementById("sort_groups").checked;
            let sortColumn = checked == true ? "group" : this.sortBy;
            let isNumeric = checked == true ? false : true;
            let isAsc = checked == true ? true : false;

            sortUtils.sortEGLTableData(
                this.plotData.data,
                sortColumn,
                isNumeric,
                isAsc
            );
        },
        formatPvalue(VALUE) {
            return formatters.pValueFormatter(VALUE);
        },
    },
});
</script>

<style>
@import url("/css/forestPlotHtml.css");
</style>
