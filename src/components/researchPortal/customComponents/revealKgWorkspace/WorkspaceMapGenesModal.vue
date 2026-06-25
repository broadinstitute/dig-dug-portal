<template>
    <div
        v-if="open"
        class="wkb-map-genes-backdrop"
        role="presentation"
        @click="onBackdropClick"
    >
        <div
            class="wkb-map-genes-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="wkb-map-genes-title"
            @click.stop
        >
            <header class="wkb-map-genes-head">
                <div class="wkb-map-genes-head-row">
                    <h2 id="wkb-map-genes-title">Map genes</h2>
                    <button
                        type="button"
                        class="wkb-map-genes-close"
                        aria-label="Close"
                        :disabled="loading"
                        @click="$emit('close')"
                    >
                        &times;
                    </button>
                </div>
                <p class="wkb-map-genes-intro">
                    Genes that appear in more than two of the selected gene sets, sorted by how
                    many sets they cross. Click a gene to add it to the graph.
                </p>
            </header>

            <div class="wkb-map-genes-body">
                <p v-if="loading" class="wkb-map-genes-status" role="status">
                    Loading gene lists for {{ selectedGeneSetCount }} selected gene set{{
                        selectedGeneSetCount === 1 ? "" : "s"
                    }}…
                </p>

                <p v-else-if="error" class="wkb-map-genes-error" role="alert">
                    {{ error }}
                </p>

                <template v-else>
                    <p v-if="!selectedGeneSetCount" class="wkb-map-genes-empty">
                        Mark gene sets as selected on the canvas before mapping genes.
                    </p>

                    <template v-else>
                        <p class="wkb-map-genes-helper">
                            {{ selectedGeneSetCount }} selected gene set{{
                                selectedGeneSetCount === 1 ? "" : "s"
                            }}
                            · {{ rows.length }} shared gene{{ rows.length === 1 ? "" : "s" }}
                        </p>

                        <ul v-if="skippedGeneSets.length" class="wkb-map-genes-skipped">
                            <li
                                v-for="entry in skippedGeneSets"
                                :key="entry.id"
                            >
                                {{ entry.label }}: {{ entry.reason }}
                            </li>
                        </ul>

                        <div v-if="rows.length" class="wkb-map-genes-table-wrap">
                            <table class="wkb-map-genes-table">
                                <thead>
                                    <tr>
                                        <th scope="col" class="wkb-map-genes-col-gene">
                                            Gene (click to add)
                                        </th>
                                        <th scope="col" class="wkb-map-genes-col-count"># Sets</th>
                                        <th
                                            v-for="column in columns"
                                            :key="column.id"
                                            scope="col"
                                            class="wkb-map-genes-col-set wkb-map-genes-col-set-header"
                                        >
                                            <span class="wkb-map-genes-set-label">
                                                <span
                                                    v-for="(line, index) in geneSetLabelLines(
                                                        column.label
                                                    )"
                                                    :key="`${column.id}-${index}`"
                                                    class="wkb-map-genes-set-label-line"
                                                >
                                                    {{ line }}
                                                </span>
                                            </span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="row in rows" :key="row.row_id">
                                        <th scope="row" class="wkb-map-genes-col-gene">
                                            <button
                                                type="button"
                                                class="wkb-map-genes-gene-btn"
                                                :class="{
                                                    'is-on-graph': isGeneOnGraph(row.gene),
                                                    'is-busy': addingGene === row.gene,
                                                }"
                                                :disabled="
                                                    addingGene === row.gene || isGeneOnGraph(row.gene)
                                                "
                                                :title="geneButtonTitle(row.gene)"
                                                @click="$emit('add-gene', row.gene)"
                                            >
                                                {{ row.gene }}
                                            </button>
                                        </th>
                                        <td class="wkb-map-genes-col-count">
                                            {{ row.gene_set_count }}
                                        </td>
                                        <td
                                            v-for="column in columns"
                                            :key="column.id"
                                            class="wkb-map-genes-col-set"
                                        >
                                            <b-icon
                                                v-if="row[column.id]"
                                                icon="check-circle-fill"
                                                class="wkb-map-genes-check"
                                                aria-hidden="true"
                                            />
                                            <span v-else class="wkb-map-genes-empty-cell">—</span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <p v-else class="wkb-map-genes-empty">
                            No genes appear in more than two of the loaded gene sets. Select more
                            gene sets or choose sets with more overlap.
                        </p>
                    </template>
                </template>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "WorkspaceMapGenesModal",
    props: {
        open: {
            type: Boolean,
            default: false,
        },
        loading: {
            type: Boolean,
            default: false,
        },
        error: {
            type: String,
            default: "",
        },
        selectedGeneSetCount: {
            type: Number,
            default: 0,
        },
        columns: {
            type: Array,
            default: () => [],
        },
        rows: {
            type: Array,
            default: () => [],
        },
        skippedGeneSets: {
            type: Array,
            default: () => [],
        },
        graphGeneIds: {
            type: Array,
            default: () => [],
        },
        addingGene: {
            type: String,
            default: "",
        },
    },
    computed: {
        graphGeneIdSet() {
            return new Set(this.graphGeneIds || []);
        },
    },
    mounted() {
        document.addEventListener("keydown", this.onKeyDown);
    },
    beforeDestroy() {
        document.removeEventListener("keydown", this.onKeyDown);
    },
    methods: {
        onBackdropClick() {
            if (!this.loading) {
                this.$emit("close");
            }
        },
        onKeyDown(event) {
            if (this.open && !this.loading && event.key === "Escape") {
                this.$emit("close");
            }
        },
        isGeneOnGraph(symbol) {
            const nodeId = String(symbol || "").trim().toUpperCase();
            if (!nodeId) {
                return false;
            }
            return this.graphGeneIdSet.has(`gene:${nodeId}`);
        },
        geneButtonTitle(symbol) {
            if (this.isGeneOnGraph(symbol)) {
                return `${symbol} is already on the graph`;
            }
            return `Add ${symbol} to the graph`;
        },
        geneSetLabelLines(label) {
            const parts = String(label || "")
                .split(/\s·\s/)
                .map((part) => part.trim())
                .filter(Boolean);
            return parts.length ? parts : [String(label || "").trim()].filter(Boolean);
        },
    },
};
</script>

<style scoped>
.wkb-map-genes-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1200;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: rgba(24, 26, 32, 0.45);
}

.wkb-map-genes-modal {
    display: flex;
    flex-direction: column;
    width: min(1080px, 100%);
    max-height: min(92vh, 960px);
    overflow: hidden;
    border-radius: 12px;
    background: #ffffff;
    box-shadow: 0 16px 48px rgba(20, 22, 30, 0.18);
}

.wkb-map-genes-head {
    flex-shrink: 0;
    padding: 20px 26px 14px;
    border-bottom: 1px solid var(--cfde-border, #e6e1d6);
}

.wkb-map-genes-head-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
}

.wkb-map-genes-head-row h2 {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--cfde-ink, #33363d);
}

.wkb-map-genes-close {
    border: none;
    background: transparent;
    color: var(--cfde-orange, #e07b39);
    font-size: 1.6rem;
    line-height: 1;
    cursor: pointer;
}

.wkb-map-genes-close:disabled {
    opacity: 0.45;
    cursor: not-allowed;
}

.wkb-map-genes-intro,
.wkb-map-genes-helper,
.wkb-map-genes-status,
.wkb-map-genes-empty {
    margin: 0;
    font-size: 13px;
    line-height: 1.45;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-map-genes-error {
    margin: 0;
    font-size: 13px;
    line-height: 1.45;
    color: #9a3412;
}

.wkb-map-genes-body {
    flex: 1;
    overflow: auto;
    padding: 16px 26px 24px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.wkb-map-genes-skipped {
    margin: 0;
    padding-left: 18px;
    font-size: 12px;
    line-height: 1.45;
    color: #9a3412;
}

.wkb-map-genes-table-wrap {
    overflow: auto;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 8px;
}

.wkb-map-genes-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
}

.wkb-map-genes-table th,
.wkb-map-genes-table td {
    padding: 8px 10px;
    border-bottom: 1px solid var(--cfde-border, #e6e1d6);
    vertical-align: middle;
}

.wkb-map-genes-table thead th {
    position: sticky;
    top: 0;
    z-index: 1;
    background: #f6f5f2;
    font-weight: 700;
    color: var(--cfde-ink, #33363d);
}

.wkb-map-genes-col-gene {
    position: sticky;
    left: 0;
    z-index: 2;
    min-width: 96px;
    background: #fffef9;
    text-align: left;
    font-weight: 600;
}

.wkb-map-genes-col-count {
    min-width: 56px;
    text-align: center;
    font-weight: 700;
    color: var(--cfde-blue, #2c5c97);
    background: #fffef9;
}

.wkb-map-genes-table thead .wkb-map-genes-col-count {
    background: #f6f5f2;
}

.wkb-map-genes-gene-btn {
    margin: 0;
    padding: 4px 10px;
    border: 1px solid var(--cfde-blue, #2c5c97);
    border-radius: 999px;
    background: #fff;
    color: var(--cfde-blue, #2c5c97);
    font-size: 12px;
    font-weight: 700;
    line-height: 1.2;
    cursor: pointer;
}

.wkb-map-genes-gene-btn:hover:not(:disabled) {
    background: #eef4fb;
}

.wkb-map-genes-gene-btn:disabled {
    cursor: default;
}

.wkb-map-genes-gene-btn.is-on-graph {
    border-color: #c9c2b6;
    background: #f3f2ef;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-map-genes-gene-btn.is-busy {
    opacity: 0.65;
}

.wkb-map-genes-table thead .wkb-map-genes-col-gene {
    z-index: 3;
    background: #f6f5f2;
}

.wkb-map-genes-col-set {
    min-width: 96px;
    text-align: center;
    vertical-align: middle;
}

.wkb-map-genes-col-set-header {
    max-width: 132px;
    vertical-align: bottom;
    white-space: normal;
    line-height: 1.25;
    font-weight: 600;
}

.wkb-map-genes-set-label {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
}

.wkb-map-genes-set-label-line {
    display: block;
    overflow-wrap: anywhere;
    word-break: break-word;
}

.wkb-map-genes-check {
    color: var(--cfde-blue, #2c5c97);
    font-size: 1.15rem;
}

.wkb-map-genes-empty-cell {
    color: var(--cfde-muted, #6b6b6b);
}
</style>
