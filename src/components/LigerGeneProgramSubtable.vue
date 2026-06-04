<template>
    <div class="liger-gene-program-subtable-wrap row">
        <div class="col-12">
            <b-table
                class="liger-gene-program-subtable"
                hover
                :items="programs"
                :fields="fields"
                :per-page="perPage"
                :current-page="currentPage"
                sort-by="correlation"
                :sort-desc="true"
            >
                <template #cell(program_id)="data">
                    {{ data.value }}
                </template>
                <template #cell(correlation)="data">
                    <div
                        class="liger-correlation-cell"
                        :style="
                            correlationCellStyle(data.item.correlation)
                        "
                    >
                        {{ formatCorrelation(data.item.correlation) }}
                    </div>
                </template>
            </b-table>
        </div>
        <b-pagination
            v-if="programs.length > perPage"
            v-model="currentPage"
            class="pagination-sm justify-content-center"
            :total-rows="programs.length"
            :per-page="perPage"
        >
        </b-pagination>
    </div>
</template>

<script>
import Vue from "vue";
import Formatters from "@/utils/formatters";

export default Vue.component("liger-gene-program-subtable", {
    props: {
        programs: {
            type: Array,
            default: () => [],
        },
        correlationMaxAbsolute: {
            type: Number,
            default: 1,
        },
    },
    data() {
        return {
            perPage: 10,
            currentPage: 1,
            fields: [
                {
                    key: "program_id",
                    label: "Gene program",
                    sortable: true,
                },
                {
                    key: "correlation",
                    label: "Program-state correlation",
                    sortable: true,
                    tdClass: "liger-correlation-td",
                },
                {
                    key: "gsea_p",
                    label: "GSEA P-value",
                    sortable: true,
                    formatter: Formatters.pValueFormatter,
                },
                {
                    key: "gsea_q",
                    label: "GSEA q-value",
                    sortable: true,
                    formatter: Formatters.pValueFormatter,
                },
            ],
        };
    },
    methods: {
        formatCorrelation(value) {
            return Formatters.floatFormatter(value);
        },
        correlationCellStyle(value) {
            const numeric = Number(value);
            if (!Number.isFinite(numeric)) {
                return {
                    backgroundColor: "#f8fafc",
                };
            }

            return {
                backgroundColor: this.relationshipCellColor(
                    numeric,
                    this.correlationMaxAbsolute
                ),
                color: "#1f2937",
            };
        },
        clamp(value, minValue, maxValue) {
            return Math.min(maxValue, Math.max(minValue, value));
        },
        mixColor(start, end, amount) {
            const red = Math.round(start[0] + (end[0] - start[0]) * amount);
            const green = Math.round(start[1] + (end[1] - start[1]) * amount);
            const blue = Math.round(start[2] + (end[2] - start[2]) * amount);
            return `rgb(${red}, ${green}, ${blue})`;
        },
        relationshipCellColor(value, maxAbsolute) {
            const normalized = this.clamp(value / (maxAbsolute || 1), -1, 1);

            if (normalized >= 0) {
                return this.mixColor(
                    [255, 255, 255],
                    [47, 91, 234],
                    Math.pow(normalized, 0.65)
                );
            }

            return this.mixColor(
                [255, 255, 255],
                [194, 65, 12],
                Math.pow(Math.abs(normalized), 0.65)
            );
        },
    },
});
</script>

<style scoped>
.liger-gene-program-subtable-wrap.row {
    font-size: 13px;
    margin-left: 15px;
    margin-right: 0;
    background-color: #efefef;
}

.liger-gene-program-subtable-wrap .col-12 {
    padding: 0 0 0 5px !important;
}

.liger-gene-program-subtable-wrap ::v-deep table.liger-gene-program-subtable {
    font-size: 13px;
}

.liger-gene-program-subtable-wrap ::v-deep table.liger-gene-program-subtable th,
.liger-gene-program-subtable-wrap ::v-deep table.liger-gene-program-subtable td {
    font-size: 13px;
}

.liger-gene-program-subtable-wrap ::v-deep td.liger-correlation-td {
    padding: 0;
}

.liger-correlation-cell {
    display: block;
    min-height: 32px;
    padding: 6px;
    line-height: 1.2;
    font-size: 13px;
}
</style>
