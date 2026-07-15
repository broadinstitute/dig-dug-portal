<template>
    <div class="vks-ge-enriched-table-section">
        <div class="vks-ge-enriched-table-toolbar">
            <div>
                <p class="vks-ge-enriched-table-title">Enriched regions</p>
                <p v-if="subtitle" class="vks-ge-enriched-table-subtitle">{{ subtitle }}</p>
            </div>
            <label v-if="rows.length" class="vks-ge-enriched-table-per-page">
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
        <div v-if="!rows.length" class="vks-ge-enriched-table-empty">
            No enriched regions for this locus.
        </div>
        <template v-else>
            <div class="vks-ge-enriched-table-wrap">
                <table class="vks-ge-enriched-table">
                    <thead>
                        <tr>
                            <th class="vks-ge-enriched-sticky-col">Region</th>
                            <th>Annotation</th>
                            <th>Tissue</th>
                            <th>Biosample</th>
                            <th>State</th>
                            <th>Dataset</th>
                            <th>Method</th>
                            <th>Source</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="row in pagedRows" :key="row.key">
                            <th scope="row" class="vks-ge-enriched-sticky-col">
                                {{ row.region }}
                            </th>
                            <td>
                                <span
                                    class="vks-ge-enriched-annotation"
                                    :style="{
                                        backgroundColor: row.annotationColor,
                                        borderColor: row.annotationColor,
                                    }"
                                >
                                    {{ row.annotation }}
                                </span>
                            </td>
                            <td>{{ row.tissue }}</td>
                            <td>{{ row.biosample }}</td>
                            <td>{{ row.state }}</td>
                            <td>{{ row.dataset }}</td>
                            <td>{{ row.method }}</td>
                            <td>{{ row.source }}</td>
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
export default {
    name: "VariantSifterEnrichedRegionsTable",
    props: {
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
};
</script>

<style scoped>
.vks-ge-enriched-table-section {
    margin-top: 0;
}

.vks-ge-enriched-table-toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px 16px;
    margin-bottom: 10px;
}

.vks-ge-enriched-table-title {
    margin: 0 0 4px;
    font-size: 0.9rem;
    font-weight: 700;
    color: #33363d;
}

.vks-ge-enriched-table-subtitle {
    margin: 0;
    font-size: 13px;
    color: #666666;
}

.vks-ge-enriched-table-per-page {
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

.vks-ge-enriched-table-empty {
    font-size: 0.85rem;
    color: #666666;
}

.vks-ge-enriched-table-wrap {
    overflow: auto;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 8px;
}

.vks-ge-enriched-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
    background: #ffffff;
}

.vks-ge-enriched-table th,
.vks-ge-enriched-table td {
    padding: 6px 8px;
    border-bottom: 1px solid #ece8df;
    border-right: 1px solid #f2efe8;
    text-align: left;
    white-space: nowrap;
    vertical-align: middle;
}

.vks-ge-enriched-table thead th {
    position: sticky;
    top: 0;
    z-index: 2;
    background: #f3f1ec;
    color: #33363d;
    font-weight: 600;
}

.vks-ge-enriched-sticky-col {
    position: sticky;
    left: 0;
    z-index: 1;
    background: #ffffff;
    min-width: 150px;
    font-weight: 600;
}

.vks-ge-enriched-table thead .vks-ge-enriched-sticky-col {
    z-index: 3;
    background: #f3f1ec;
}

.vks-ge-enriched-annotation {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 999px;
    border: 1px solid transparent;
    color: #1f2430;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.35;
}

.vks-ge-pagination {
    margin-top: 12px;
}
</style>
