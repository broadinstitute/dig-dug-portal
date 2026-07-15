<template>
    <div class="vks-ge-table-section">
        <div class="vks-ge-table-toolbar">
            <div>
                <p class="vks-ge-table-title">Global enrichment by tissue</p>
                <p v-if="subtitle" class="vks-ge-table-subtitle">{{ subtitle }}</p>
            </div>
            <label v-if="rows.length" class="vks-ge-table-per-page">
                <span>Rows</span>
                <select v-model="perPageNumber" class="number-per-page">
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="40">40</option>
                    <option value="100">100</option>
                    <option value="0">All</option>
                </select>
            </label>
        </div>
        <div v-if="!rows.length" class="vks-ge-table-empty">
            No enrichment statistics for the current annotation and tissue filters.
        </div>
        <template v-else>
            <div class="vks-ge-table-wrap">
                <table class="vks-ge-table">
                    <thead>
                        <tr>
                            <th rowspan="2" class="vks-ge-table-sticky-col">Tissue</th>
                            <th
                                v-for="annotation in annotations"
                                :key="annotation"
                                colspan="2"
                                class="vks-ge-table-annotation-head"
                                :style="{ borderTopColor: annotationColor(annotation) }"
                            >
                                {{ annotation }}
                            </th>
                        </tr>
                        <tr>
                            <template v-for="annotation in annotations">
                                <th
                                    :key="`${annotation}-p`"
                                    class="vks-ge-table-metric-head"
                                >
                                    p
                                </th>
                                <th
                                    :key="`${annotation}-fold`"
                                    class="vks-ge-table-metric-head"
                                >
                                    Fold
                                </th>
                            </template>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="row in pagedRows" :key="row.tissue">
                            <th scope="row" class="vks-ge-table-sticky-col">
                                {{ row.tissue }}
                            </th>
                            <template v-for="annotation in annotations">
                                <td :key="`${row.tissue}-${annotation}-p`">
                                    {{ cellValue(row, annotation, "pValueLabel") }}
                                </td>
                                <td :key="`${row.tissue}-${annotation}-fold`">
                                    {{ cellValue(row, annotation, "foldLabel") }}
                                </td>
                            </template>
                        </tr>
                    </tbody>
                </table>
            </div>
            <b-pagination
                v-if="perPageNumber !== '0' && perPageNumber !== 0"
                v-model="currentPage"
                class="pagination-sm justify-content-center vks-ge-pagination"
                :total-rows="rows.length"
                :per-page="Number(perPageNumber)"
            />
        </template>
    </div>
</template>

<script>
import {
    annotationColorForKey,
    solidAnnotationColor,
    VKS_ANNOTATION_COLORS,
} from "./variantSifterGlobalEnrichmentData.js";

export default {
    name: "VariantSifterGlobalEnrichmentTable",
    props: {
        annotations: {
            type: Array,
            default: () => [],
        },
        rows: {
            type: Array,
            default: () => [],
        },
        subtitle: {
            type: String,
            default: "",
        },
    },
    data() {
        return {
            perPageNumber: "10",
            currentPage: 1,
        };
    },
    computed: {
        pagedRows() {
            const perPage = Number(this.perPageNumber);
            if (!perPage) {
                return this.rows;
            }
            const start = (this.currentPage - 1) * perPage;
            return this.rows.slice(start, start + perPage);
        },
    },
    watch: {
        rows() {
            this.currentPage = 1;
        },
        perPageNumber() {
            this.currentPage = 1;
        },
    },
    methods: {
        cellValue(row, annotation, field) {
            return row?.cells?.[annotation]?.[field] || "—";
        },
        annotationColor(annotation) {
            return solidAnnotationColor(
                annotationColorForKey(annotation, this.annotations, VKS_ANNOTATION_COLORS)
            );
        },
    },
};
</script>

<style scoped>
.vks-ge-table-section {
    margin-top: 0;
}

.vks-ge-table-toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px 16px;
    margin-bottom: 10px;
}

.vks-ge-table-title {
    margin: 0 0 4px;
    font-size: 0.9rem;
    font-weight: 700;
    color: #33363d;
}

.vks-ge-table-subtitle {
    margin: 0;
    font-size: 13px;
    color: #666666;
}

.vks-ge-table-per-page {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: 13px;
    color: #4a4a4a;
    white-space: nowrap;
}

.number-per-page {
    height: 30px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 6px;
    background: #ffffff;
    color: #33363d;
    font-size: 13px;
    padding: 0 8px;
}

.vks-ge-table-empty {
    font-size: 0.85rem;
    color: #666666;
}

.vks-ge-table-wrap {
    overflow: auto;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 8px;
}

.vks-ge-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
    background: #ffffff;
}

.vks-ge-table th,
.vks-ge-table td {
    padding: 6px 8px;
    border-bottom: 1px solid #ece8df;
    border-right: 1px solid #f2efe8;
    text-align: center;
    white-space: nowrap;
}

.vks-ge-table thead th {
    position: sticky;
    top: 0;
    z-index: 2;
    background: #f3f1ec;
    color: #33363d;
    font-weight: 600;
}

.vks-ge-table-annotation-head {
    border-top: 3px solid #cccccc;
}

.vks-ge-table-metric-head {
    top: 31px;
    font-size: 13px;
    color: #666666;
}

.vks-ge-table-sticky-col {
    position: sticky;
    left: 0;
    z-index: 1;
    text-align: left;
    background: #ffffff;
    min-width: 160px;
    max-width: 220px;
    white-space: normal;
    word-break: break-word;
}

.vks-ge-table thead .vks-ge-table-sticky-col {
    z-index: 3;
    background: #f3f1ec;
}

.vks-ge-pagination {
    margin-top: 12px;
}
</style>
