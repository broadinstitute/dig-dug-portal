<template>
    <div>
        <table class="meta-graph" :style="{ width: `${chartWidth}px` }">
            <th colspan="4" class="text-center">Meta-analysis types</th>
            <colgroup>
                <col class="header-col" />
                <col
                    class="bottom-line-col"
                    :style="{ width: barWidth(this.bottomLineOnly) }"
                />
                <col
                    class="bottom-line-min-p-col"
                    :style="{ width: barWidth(this.bottomLineMinP) }"
                />
                <col
                    class="all-metas-col"
                    :style="{ width: barWidth(this.allMetas) }"
                />
            </colgroup>
            <tr class="bottom-line">
                <th scope="row">bottom-line</th>
                <td colspan="3" class="filled">
                    {{ bottomLineOnly + bottomLineMinP + allMetas }}
                </td>
            </tr>
            <tr class="min-p">
                <th scope="row">min_p</th>
                <td></td>
                <td colspan="2" class="filled">
                    {{ bottomLineMinP + allMetas }}
                </td>
            </tr>
            <tr class="largest">
                <th scope="row">largest</th>
                <td></td>
                <td></td>
                <td class="filled">
                    {{ allMetas }}
                </td>
            </tr>
            <tr class="empty-bar">
                <th scope="row"></th>
                <td class="summary1"></td>
                <td class="summary2"></td>
                <td class="summary3"></td>
            </tr>
        </table>
        <table :style="{ width: `${chartWidth}px` }">
            <tr class="summary">
                <th
                    scope="row"
                    :style="{ width: `${chartWidth - width}px` }"
                ></th>
                <td :style="{ width: barWidth(bottomLineOnly, true) }">
                    <span
                        v-b-tooltip.hover
                        title="bottom-line only"
                        class="summary1"
                    >
                        {{ bottomLineOnly }}
                    </span>
                </td>
                <td :style="{ width: barWidth(bottomLineMinP, true) }">
                    <span
                        v-b-tooltip.hover
                        title="bottom-line + min_p"
                        class="summary2"
                    >
                        {{ bottomLineMinP }}
                    </span>
                </td>
                <td :style="{ width: barWidth(allMetas, true) }">
                    <span
                        v-b-tooltip.hover
                        title="bottom-line + min_p + largest"
                        class="summary3"
                    >
                        {{ allMetas }}
                    </span>
                </td>
            </tr>
        </table>
    </div>
</template>

<script>
import Vue from "vue";

import { BootstrapVue, IconsPlugin } from "bootstrap-vue";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

export default Vue.component("meta-analysis-bar-graph", {
    props: ["graphData", "filter"],
    data() {
        return {
            width: 400,
            chartWidth: 600,
            bottomLineOnly: 0,
            bottomLineMinP: 0,
            allMetas: 0,
        };
    },
    computed: {
        tableData() {
            let dataRows = this.graphData;
            if (this.filter) {
                dataRows = this.graphData.filter(this.filter);
            }
            this.collateData(dataRows);
            return dataRows;
        },
    },
    methods: {
        collateData(data) {
            let summary = {
                "bottom-line": 0,
                "bottom-line;min_p": 0,
                "bottom-line;min_p;largest": 0,
            };
            for (let i = 0; i < data.length; i++) {
                let metaTypes = data[i]["inMetaTypes"];
                if (summary[metaTypes] === undefined) {
                    console.error(`Type entry ${metaTypes} unrecognized.`);
                }
                summary[metaTypes] += 1;
            }
            console.log(JSON.stringify(summary));
            this.bottomLineOnly = summary["bottom-line"];
            this.bottomLineMinP = summary["bottom-line;min_p"];
            this.allMetas = summary["bottom-line;min_p;largest"];
            return summary;
        },
        barWidth(barSize, minWidth = false) {
            let total =
                this.bottomLineOnly + this.bottomLineMinP + this.allMetas;
            let relativeWidth = (barSize / total) * this.width;
            if (relativeWidth < 40 && minWidth) {
                relativeWidth = 40;
            }
            return `${relativeWidth}px`;
        },
    },
    watch: {
        tableData(newData) {
            this.collateData(newData);
        },
    },
});
</script>
<style scoped>
.meta-graph th {
    text-align: right;
    padding-right: 5px;
}
.meta-graph td {
    text-align: center;
    border-left: 1px solid black;
    border-right: 1px solid black;
}
.meta-graph .bottom-line td.filled {
    background-color: #6dcff6;
}
.meta-graph .min-p td.filled {
    background-color: #f49ac1;
}
.meta-graph .largest td.filled {
    background-color: #fff200;
}
.empty-bar {
    height: 10px;
}
.summary td {
    text-align: center;
}
.summary1 {
    background-color: #6dcff6;
}
.summary2 {
    background-color: #8781bd;
}
.summary3 {
    background-color: #b6aaa7;
}
.summary td span {
    border-radius: 10px;
    padding-left: 5px;
    padding-right: 5px;
    cursor: help;
}
</style>
