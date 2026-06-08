<template>
    <div class="wkb-sig-chain-matrix">
        <h4 v-if="title" class="wkb-sig-chain-matrix-title">{{ title }}</h4>
        <p v-if="!hasData" class="wkb-inspector-note">
            No rows were available for this matrix.
        </p>
        <div v-else class="wkb-sig-chain-matrix-wrap">
            <table class="wkb-sig-chain-matrix-table">
                <thead>
                    <tr>
                        <th class="wkb-sig-chain-matrix-corner" />
                        <th
                            v-for="column in matrix.columns"
                            :key="column.id"
                            class="wkb-sig-chain-matrix-col-head"
                        >
                            {{ column.label }}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="row in matrix.rows" :key="row.id">
                        <th class="wkb-sig-chain-matrix-row-head">{{ row.label }}</th>
                        <td
                            v-for="column in matrix.columns"
                            :key="column.id"
                            class="wkb-sig-chain-matrix-cell-wrap"
                        >
                            <button
                                v-if="cellLookup.get(`${row.id}::${column.id}`)"
                                type="button"
                                class="wkb-sig-chain-matrix-cell"
                                :class="{
                                    'is-active':
                                        activeCellKey === `${row.id}::${column.id}`,
                                }"
                                :title="
                                    cellLookup.get(`${row.id}::${column.id}`).hover_text ||
                                    ''
                                "
                                @click="
                                    $emit(
                                        'cell-click',
                                        cellLookup.get(`${row.id}::${column.id}`),
                                        `${row.id}::${column.id}`
                                    )
                                "
                            >
                                {{
                                    formatScore(
                                        title,
                                        cellLookup.get(`${row.id}::${column.id}`).score
                                    )
                                }}
                            </button>
                            <span v-else class="wkb-sig-chain-matrix-empty">—</span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script>
import { formatInspectorValue } from "./revealKgInspectorUtils.js";
import { formatProbabilityFromLogBf } from "./revealKgSigChainUtils.js";
import { buildMatrixCellLookup } from "./revealKgSigChainUtils.js";

export default {
    name: "WorkspaceSigChainMatrix",
    props: {
        title: {
            type: String,
            default: "",
        },
        matrix: {
            type: Object,
            default: null,
        },
        activeCellKey: {
            type: String,
            default: "",
        },
    },
    computed: {
        cellLookup() {
            return buildMatrixCellLookup(this.matrix);
        },
        hasData() {
            return Boolean(this.matrix?.rows?.length && this.matrix?.columns?.length);
        },
    },
    methods: {
        formatScore(title, score) {
            const normalizedTitle = String(title || "").toLowerCase();
            if (normalizedTitle.includes("gene") && normalizedTitle.includes("trait")) {
                return formatProbabilityFromLogBf(score);
            }
            return formatInspectorValue(score, 2);
        },
    },
};
</script>

<style scoped>
.wkb-sig-chain-matrix-title {
    margin: 0 0 8px;
    font-size: 13px;
    font-weight: 700;
    color: var(--cfde-ink, #33363d);
}

.wkb-sig-chain-matrix-wrap {
    overflow-x: auto;
}

.wkb-sig-chain-matrix-table {
    border-collapse: collapse;
    font-size: 12px;
    min-width: 100%;
}

.wkb-sig-chain-matrix-table th,
.wkb-sig-chain-matrix-table td {
    border: 1px solid var(--cfde-border, #e6e1d6);
    padding: 0.28rem 0.45rem;
    text-align: left;
    vertical-align: top;
}

.wkb-sig-chain-matrix-row-head,
.wkb-sig-chain-matrix-col-head {
    background: var(--cfde-bg, #f6f5f2);
    font-weight: 600;
    white-space: nowrap;
}

.wkb-sig-chain-matrix-cell {
    appearance: none;
    border: 1px solid transparent;
    border-radius: 4px;
    background: #fff;
    color: var(--cfde-blue, #2c5c97);
    font-size: 12px;
    font-weight: 600;
    padding: 0.1rem 0.35rem;
    cursor: pointer;
}

.wkb-sig-chain-matrix-cell:hover {
    background: #eef4fb;
    border-color: rgba(44, 92, 151, 0.25);
}

.wkb-sig-chain-matrix-cell.is-active {
    background: rgba(72, 139, 247, 0.14);
    border-color: rgba(72, 139, 247, 0.45);
}

.wkb-sig-chain-matrix-empty {
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-inspector-note {
    margin: 0;
    font-size: 12px;
    line-height: 1.45;
    color: var(--cfde-muted, #6b6b6b);
}
</style>
