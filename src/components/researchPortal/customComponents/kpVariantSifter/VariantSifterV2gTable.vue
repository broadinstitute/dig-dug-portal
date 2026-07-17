<template>
    <div class="vks-v2g-table-section">
        <div class="vks-v2g-table-toolbar">
            <div>
                <p class="vks-v2g-table-title">Variant-to-gene links</p>
                <p v-if="subtitle" class="vks-v2g-table-subtitle">{{ subtitle }}</p>
            </div>
            <label v-if="rows.length" class="vks-v2g-table-per-page">
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
        <div v-if="!rows.length" class="vks-v2g-table-empty">
            No variant-to-gene links for the current tissue and filter selection.
        </div>
        <template v-else>
            <div class="vks-v2g-table-wrap">
                <table class="vks-v2g-table">
                    <thead>
                        <tr>
                            <th v-if="showTissueBiosample">Tissue</th>
                            <th v-if="showTissueBiosample">Biosample</th>
                            <th>Gene</th>
                            <th>Method</th>
                            <th>Regulatory element</th>
                            <th v-if="showPromoter">Promoter</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="row in pagedRows" :key="row.id">
                            <td v-if="showTissueBiosample">{{ row.tissue }}</td>
                            <td v-if="showTissueBiosample">{{ row.biosample }}</td>
                            <td>{{ row.targetGene }}</td>
                            <td>
                                <span
                                    class="vks-v2g-table-method"
                                    :style="{ borderBottomColor: methodColor(row.method) }"
                                >
                                    {{ row.method }}
                                </span>
                            </td>
                            <td>{{ formatRange(row.start, row.end) }}</td>
                            <td v-if="showPromoter">
                                {{ formatRange(row.targetGeneStart, row.targetGeneEnd) }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <b-pagination
                v-if="perPageNumber !== '0' && perPageNumber !== 0"
                v-model="currentPage"
                class="pagination-sm justify-content-center vks-v2g-pagination"
                :total-rows="rows.length"
                :per-page="Number(perPageNumber)"
            />
        </template>
    </div>
</template>

<script>
import {
    collectMethodsFromTissueData,
    solidV2gMethodColor,
    v2gMethodColor,
    VKS_V2G_METHOD_COLORS,
} from "./variantSifterV2gData.js";

export default {
    name: "VariantSifterV2gTable",
    props: {
        rows: {
            type: Array,
            default: () => [],
        },
        tissueData: {
            type: Object,
            default: () => ({}),
        },
        subtitle: {
            type: String,
            default: "",
        },
        showPromoter: {
            type: Boolean,
            default: true,
        },
        showTissueBiosample: {
            type: Boolean,
            default: true,
        },
    },
    data() {
        return {
            perPageNumber: "10",
            currentPage: 1,
        };
    },
    computed: {
        methods() {
            return collectMethodsFromTissueData(this.tissueData);
        },
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
        formatCoord(value) {
            if (value == null || value === "") {
                return "";
            }
            return Number(value).toLocaleString();
        },
        formatRange(start, end) {
            const left = this.formatCoord(start);
            const right = this.formatCoord(end);
            if (!left && !right) {
                return "—";
            }
            if (!left || !right) {
                return left || right;
            }
            return `${left}–${right}`;
        },
        methodColor(method) {
            return solidV2gMethodColor(
                v2gMethodColor(method, this.methods, VKS_V2G_METHOD_COLORS)
            );
        },
    },
};
</script>

<style scoped>
.vks-v2g-table-section {
    margin-top: 0;
}

.vks-v2g-table-toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
}

.vks-v2g-table-title {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 600;
    color: #1b2430;
}

.vks-v2g-table-subtitle {
    margin: 2px 0 0;
    font-size: 0.8rem;
    color: #69727c;
}

.vks-v2g-table-per-page {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.8rem;
    color: #4a5560;
}

.vks-v2g-table-empty {
    padding: 12px 4px;
    color: #5c6670;
    font-size: 0.875rem;
}

.vks-v2g-table-wrap {
    overflow-x: auto;
    border: 1px solid #e2e6ea;
    border-radius: 6px;
}

.vks-v2g-table {
    width: 100%;
    margin: 0;
    border-collapse: collapse;
    font-size: 0.8rem;
}

.vks-v2g-table th,
.vks-v2g-table td {
    padding: 6px 10px;
    border-bottom: 1px solid #e8ecf0;
    text-align: left;
    white-space: nowrap;
    vertical-align: top;
}

.vks-v2g-table thead th {
    background: #f6f8fa;
    font-weight: 600;
    color: #3a4450;
}

.vks-v2g-table-method {
    border-bottom: 3px solid transparent;
    padding-bottom: 1px;
}

.vks-v2g-pagination {
    margin-top: 12px;
}
</style>
