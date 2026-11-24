<template>
    <div>
        <div class="phenotype-xing-legend">
            <strong>{{ renderConfig["x axis field"] }}: </strong>
            Max: {{ utils.Formatters.pValueFormatter(plotContent.dataMax) }},
            <span style="color: #ffaa00"
                >Mean:
                {{
                    utils.Formatters.pValueFormatter(plotContent.dataMean)
                }}</span
            >, Min:
            {{ utils.Formatters.pValueFormatter(plotContent.dataMin) }} |
            <strong
                >{{ renderConfig["suppliment field"] }}
                <span
                    class="value-dot"
                    style="
                        background-color: #000000;
                        width: 10px;
                        height: 10px;
                        top: 5px;
                        position: relative;
                        display: inline-block;
                    "
                    >&nbsp;</span
                >
                :
            </strong>
            Max:
            {{ utils.Formatters.pValueFormatter(plotContent.suppMax) }}, Mean:
            {{ utils.Formatters.pValueFormatter(plotContent.suppMean) }}, Min:
            {{ utils.Formatters.pValueFormatter(plotContent.suppMin) }}
        </div>
        <table class="cfde-xing-table">
            <thead>
                <tr>
                    <th>{{ renderConfig["render by"] }}</th>
                    <th>{{ renderConfig["x axis field"] }}</th>
                    <th>{{ renderConfig["suppliment field"] }}</th>
                    <th>Background</th>
                    <th>
                        Log10({{ renderConfig["x axis field"] }}) :
                        {{ renderConfig["suppliment field"] }}
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr
                    v-for="(item, iIndex) in renderData"
                    :class="iIndex % 2 == 0 ? 'shady-tr' : ''"
                >
                    <td class="phenotype-td">
                        <template v-if="!!renderConfig['link to']">
                            <a
                                :href="
                                    renderConfig['link to'] +
                                    item[renderConfig['link field']]
                                "
                                >{{ item[renderConfig["render by"]] }}</a
                            >
                        </template>
                        <template v-else>{{
                            " " }}{{ item[renderConfig["render by"]] }}
                        </template>
                    </td>
                    <td>
                        {{
                            utils.Formatters.pValueFormatter(
                                item[renderConfig["x axis field"]]
                            )
                        }}
                    </td>
                    <td>
                        {{
                            utils.Formatters.pValueFormatter(
                                item[renderConfig["suppliment field"]]
                            )
                        }}
                    </td>
                    <td>{{ item["Background"] }}</td>
                    <td class="value-td">
                        <span
                            class="mean-pos"
                            :style="'left:' + getMeanXpos(plotContent.dataMean)"
                        ></span>
                        <span
                            class="value-dot"
                            :style="
                                'background-color:' +
                                getBGColor(item[renderConfig['color by']]) +
                                ';left:' +
                                getXpos(
                                    item[renderConfig['x axis field']],
                                    item[renderConfig['suppliment field']]
                                ) +
                                'width:' +
                                getDotScale(
                                    item[renderConfig['suppliment field']]
                                ) +
                                'px;height:' +
                                getDotScale(
                                    item[renderConfig['suppliment field']]
                                ) +
                                'px;'
                            "
                        >
                            &nbsp;
                        </span>
                    </td>
                </tr>
                <tr>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td>
                        <span style="float: left; margin-left: -10px">{{
                            utils.Formatters.pValueFormatter(
                                plotContent.dataMin
                            )
                        }}</span>
                        <span style="float: right; margin-right: -10px">{{
                            utils.Formatters.pValueFormatter(
                                plotContent.dataMax
                            )
                        }}</span>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script>
import { cloneDeep } from "@/utils/lodashUtils";

export default {
    name: "research-cfde-xing",
    props: [
        "canvasId",
        "data",
        "renderConfig",
        "colors",
        "plotMargin",
        "utils",
    ],
    modules: {},
    components: {},
    created: function () {},
    mounted: function () {
        //window.addEventListener("resize", this.onResize);
    },
    beforeUnmount() {
        //window.removeEventListener("resize", this.onResize);
    },
    computed: {
        plotContent() {
            let data = [...new Set(this.data)];
            let content = {
                rows: undefined,
                dataMax: null,
                dataMin: null,
                dataMean: null,
                suppMax: null,
                suppMean: null,
                suppMin: null,
            };

            switch (this.renderConfig["threshold type"]) {
                case "highest n":
                    data = this.utils.sortUtils.sortArrOfObjects(
                        data,
                        this.renderConfig["x axis field"],
                        "number",
                        "desc"
                    );

                    content.dataMax =
                        data[0][this.renderConfig["x axis field"]];
                    content.dataMin =
                        data[data.length - 1][
                            this.renderConfig["x axis field"]
                        ];
                    content.dataMean =
                        data[Math.round(data.length / 2)][
                            this.renderConfig["x axis field"]
                        ];

                    let suppData = [...new Set(this.data)];
                    suppData = this.utils.sortUtils.sortArrOfObjects(
                        suppData,
                        this.renderConfig["suppliment field"],
                        "number",
                        "desc"
                    );

                    content.suppMax =
                        suppData[0][this.renderConfig["suppliment field"]];
                    content.suppMin =
                        suppData[suppData.length - 1][
                            this.renderConfig["suppliment field"]
                        ];
                    content.suppMean =
                        suppData[Math.round(suppData.length / 2)][
                            this.renderConfig["suppliment field"]
                        ];

                    let sortData = this.utils.sortUtils.sortArrOfObjects(
                        data,
                        this.renderConfig["threshold field"],
                        "number",
                        "desc"
                    );

                    content.rows = sortData.filter(
                        (i, iIndex) => iIndex < this.renderConfig["threshold"]
                    );
                    break;
            }

            return content;
        },
        renderData() {
            return this.plotContent.rows;
        },
    },
    watch: {},
    methods: {
        getBGColor(GROUP) {
            return this.renderConfig["dot colors"][GROUP];
        },
        getXpos(VALUE, SUPP) {
            let xPos =
                (100 *
                    (Math.log10(VALUE) -
                        Math.log10(this.plotContent.dataMin))) /
                (Math.log10(this.plotContent.dataMax) -
                    Math.log10(this.plotContent.dataMin));
            let width = this.getDotScale(SUPP);
            return (
                "calc(" +
                xPos +
                "% - " +
                width / 2 +
                "px);margin-top:-" +
                width / 2 +
                "px;"
            );
        },

        getMeanXpos(VALUE) {
            let xPos =
                (100 *
                    (Math.log10(VALUE) -
                        Math.log10(this.plotContent.dataMin))) /
                (Math.log10(this.plotContent.dataMax) -
                    Math.log10(this.plotContent.dataMin));
            return "calc(" + xPos + "%);";
        },

        getDotScale(VALUE) {
            let size = Math.round(
                (20 * (VALUE - this.plotContent.suppMin)) /
                    (this.plotContent.suppMax - this.plotContent.suppMin)
            );
            return size;
        },
    },
};
</script>

<style scoped>
.phenotype-xing-legend {
    margin-bottom: 15px;
}
.cfde-xing-table {
    margin: auto;
}

.cfde-xing-table th,
.cfde-xing-table td {
    padding: 5px 10px;
}

.shady-tr {
    background-color: #e6e6e6;
}

.phenotype-td {
    font-size: 1.25em;
}

.value-td {
    position: relative;
    width: 250px;
    border-left: solid 1px #999999;
    border-right: solid 1px #999999;
}

.value-dot {
    position: absolute;
    border-radius: 20px;
}

.mean-pos {
    position: absolute;
    background-color: #ffaa00;
    width: 1px;
    height: 40px;
    top: -5px;
}
</style>
