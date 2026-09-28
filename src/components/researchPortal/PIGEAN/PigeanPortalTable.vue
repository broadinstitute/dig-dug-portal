<template>
    <div class="pigean-results-table">
        <b-table
            :items="rows"
            :fields="fields"
            :per-page="25"
            :current-page="page"
            :sort-by="sortBy"
            :sort-desc="true"
            small
            hover
            responsive
            show-empty
            :sticky-header="height"
            :tbody-tr-class="rowClass"
            @row-clicked="(row) => $emit('select', row)"
            empty-text="No rows match this selection."
        >
            <template #cell(id)="cell"
                ><slot name="identifier" :row="cell.item"
                    ><button
                        class="pigean-entity-link"
                        :title="cell.value"
                        @click.stop="$emit('select', cell.item)"
                    >
                        {{ cell.value }}</button
                    ><span
                        v-if="highlightSet.has(cell.item.id)"
                        class="pigean-member-tag"
                        >In selected set</span
                    ></slot
                ></template
            >
            <template #cell(ontology)="cell"
                ><slot name="ontology" :row="cell.item"
            /></template>
        </b-table>
        <div class="pigean-table-pagination">
            <span>{{ rows.length.toLocaleString() }} rows</span
            ><b-pagination
                v-model="page"
                :total-rows="rows.length"
                :per-page="25"
                size="sm"
                :aria-label="`${label} pages`"
            />
        </div>
    </div>
</template>
<script>
export default {
    props: {
        rows: { type: Array, default: () => [] },
        fields: Array,
        sortBy: String,
        selected: String,
        highlighted: { type: Array, default: () => [] },
        height: { type: String, default: "420px" },
        label: { type: String, default: "Results" },
    },
    data: () => ({ page: 1 }),
    computed: {
        highlightSet() {
            return new Set(this.highlighted);
        },
    },
    watch: {
        rows() {
            this.page = 1;
        },
    },
    methods: {
        rowClass(item) {
            return item && item.id === this.selected
                ? "pigean-selected-row"
                : item && this.highlightSet.has(item.id)
                ? "pigean-highlighted-row"
                : "";
        },
    },
};
</script>
<style>
.pigean-results-table .table {
    font-size: 13px;
    color: #304d60;
    margin-bottom: 0;
}
.pigean-results-table th {
    font-size: 12px;
    white-space: nowrap;
    background: #f1f6f9;
    color: #3d5b6e;
}
.pigean-results-table td {
    vertical-align: middle;
    font-variant-numeric: tabular-nums;
    min-width: 70px;
    max-width: 250px;
    overflow-wrap: anywhere;
}
.pigean-results-table .pigean-entity-link {
    border: 0;
    background: transparent;
    padding: 5px 2px;
    color: #116c9b;
    text-align: left;
    font-weight: 600;
    max-width: 250px;
    overflow-wrap: anywhere;
}
.pigean-results-table .pigean-entity-link:hover {
    text-decoration: underline;
}
.pigean-results-table .table-responsive {
    border: 1px solid #e0e8ed;
    border-radius: 4px;
}
.pigean-results-table .pigean-selected-row {
    background: #f9e4ce;
    box-shadow: inset 3px 0 #b85c16;
}
.pigean-results-table .pigean-highlighted-row {
    background: #f2eaf8;
    box-shadow: inset 3px 0 #81388b;
}
.pigean-member-tag {
    display: block;
    color: #75358a;
    font-size: 10px;
    font-weight: 500;
}
.pigean-results-table tbody tr {
    cursor: pointer;
}
.pigean-table-pagination {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    font-size: 12px;
    color: #5c7382;
    padding-top: 12px;
}
.pigean-table-pagination .pagination {
    margin: 0;
}
</style>
