<template>
    <div v-if="selectedNodes.length" class="mq-viz-selected-chips">
        <span
            v-for="node in visibleNodes"
            :key="node.key"
            class="mq-viz-selected-chip"
            :class="chipClass(node)"
        >
            <span class="mq-viz-selected-chip-label" :title="node.label">{{ node.label }}</span>
            <button
                type="button"
                class="mq-viz-selected-chip-remove"
                :aria-label="`Remove ${node.label}`"
                @click="$emit('remove', node.key)"
            >
                ×
            </button>
        </span>
        <button
            v-if="hiddenCount > 0"
            type="button"
            class="mq-viz-selected-more-btn"
            :aria-expanded="expanded ? 'true' : 'false'"
            @click="expanded = !expanded"
        >
            <template v-if="expanded">Show fewer</template>
            <template v-else>{{ hiddenCount }} more…</template>
        </button>
    </div>
</template>

<script>
const DEFAULT_MAX_VISIBLE = 12;

export default {
    name: "WorkflowVizSelectedNodeChips",
    props: {
        selectedNodes: { type: Array, default: () => [] },
        maxVisible: { type: Number, default: DEFAULT_MAX_VISIBLE },
    },
    data() {
        return {
            expanded: false,
        };
    },
    computed: {
        visibleNodes() {
            const nodes = this.selectedNodes || [];
            if (this.expanded || nodes.length <= this.maxVisible) return nodes;
            return nodes.slice(0, this.maxVisible);
        },
        hiddenCount() {
            const total = (this.selectedNodes || []).length;
            if (this.expanded || total <= this.maxVisible) return 0;
            return total - this.maxVisible;
        },
    },
    methods: {
        chipClass(node) {
            if (node && node.kind === "crossing") {
                return "mq-viz-selected-chip--crossing";
            }
            return "mq-viz-selected-chip--single";
        },
    },
    watch: {
        selectedNodes(next, prev) {
            const nextLen = (next || []).length;
            const prevLen = (prev || []).length;
            if (nextLen <= this.maxVisible) {
                this.expanded = false;
            } else if (nextLen < prevLen && nextLen <= this.maxVisible) {
                this.expanded = false;
            }
        },
    },
};
</script>

<style scoped>
.mq-viz-selected-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
    padding: 0.35rem 0 0.5rem;
    border-bottom: 1px solid #eee8df;
    margin-bottom: 0.35rem;
}

.mq-viz-selected-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    max-width: 100%;
    padding: 2px 4px 2px 8px;
    border-radius: 999px;
    background: #fff;
    font-size: 12px;
    color: #33363d;
}

.mq-viz-selected-chip--single {
    border: 1px solid #ffcc99;
}

.mq-viz-selected-chip--crossing {
    border: 1px solid #4a90e2;
}

.mq-viz-selected-chip-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 280px;
}

.mq-viz-selected-chip-remove {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: #666;
    font-size: 14px;
    line-height: 1;
    cursor: pointer;
}

.mq-viz-selected-chip-remove:hover {
    background: #fff0e0;
    color: #c45a00;
}

.mq-viz-selected-more-btn {
    padding: 2px 8px;
    border: none;
    border-radius: 999px;
    background: transparent;
    color: #e07b39;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
}

.mq-viz-selected-more-btn:hover {
    text-decoration: underline;
}
</style>
