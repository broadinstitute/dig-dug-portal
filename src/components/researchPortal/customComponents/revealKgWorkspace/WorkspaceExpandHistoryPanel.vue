<template>
    <div class="wkb-expand-history">
        <p class="wkb-expand-history-intro">
            These runs added nodes to the graph from your expansion seeds (selected nodes, a
            single node, or both endpoints of an edge).
        </p>
        <p v-if="!entries.length" class="wkb-expand-history-empty">
            No expansion runs have been recorded for this session yet.
        </p>
        <ul v-else class="wkb-expand-history-list" aria-label="Expansion history">
            <li v-for="entry in entries" :key="entry.id" class="wkb-expand-history-item">
                <div class="wkb-expand-history-head">
                    <strong class="wkb-expand-history-title">{{ entry.title }}</strong>
                    <div class="wkb-expand-history-head-actions">
                        <span class="wkb-expand-history-time">{{ entry.timestamp_label }}</span>
                        <button
                            type="button"
                            class="wkb-expand-history-remove"
                            aria-label="Remove history entry"
                            :disabled="loading"
                            @click="$emit('remove-entry', entry.id)"
                        >
                            &times;
                        </button>
                    </div>
                </div>
                <p v-if="entry.summary" class="wkb-expand-history-summary">{{ entry.summary }}</p>
                <dl v-if="entry.filters" class="wkb-expand-history-meta">
                    <div v-if="entry.seed_summary">
                        <dt>Seeds</dt>
                        <dd>{{ entry.seed_summary }}</dd>
                    </div>
                    <div>
                        <dt>Target type</dt>
                        <dd>{{ entry.filters.target_type }}</dd>
                    </div>
                    <div>
                        <dt>Match</dt>
                        <dd>{{ entry.filters.reducer }}</dd>
                    </div>
                    <div>
                        <dt>Scope</dt>
                        <dd>{{ entry.filters.connection_scope }}</dd>
                    </div>
                    <div>
                        <dt>Novelty</dt>
                        <dd>{{ entry.filters.novelty }}</dd>
                    </div>
                    <div>
                        <dt>Relevance</dt>
                        <dd>{{ entry.filters.relevance }}</dd>
                    </div>
                    <div>
                        <dt>Expression</dt>
                        <dd>{{ entry.filters.expression }}</dd>
                    </div>
                </dl>
                <ul v-if="entry.items?.length" class="wkb-expand-history-nodes">
                    <li v-for="item in entry.items" :key="`${entry.id}-${item.node_id}`">
                        <strong>{{ item.label || item.node_id }}</strong>
                        <span v-if="item.subtitle">{{ item.subtitle }}</span>
                    </li>
                </ul>
            </li>
        </ul>
    </div>
</template>

<script>
export default {
    name: "WorkspaceExpandHistoryPanel",
    props: {
        entries: {
            type: Array,
            default: () => [],
        },
        loading: {
            type: Boolean,
            default: false,
        },
    },
};
</script>

<style scoped>
.wkb-expand-history {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.wkb-expand-history-intro,
.wkb-expand-history-empty {
    margin: 0;
    font-size: 12px;
    line-height: 1.45;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-expand-history-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.wkb-expand-history-item {
    padding: 12px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 10px;
    background: #faf9f7;
}

.wkb-expand-history-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
}

.wkb-expand-history-title {
    font-size: 13px;
    color: var(--cfde-ink, #33363d);
}

.wkb-expand-history-head-actions {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
}

.wkb-expand-history-time {
    font-size: 12px;
    color: var(--cfde-muted, #6b6b6b);
    white-space: nowrap;
}

.wkb-expand-history-remove {
    border: none;
    background: transparent;
    color: var(--cfde-muted, #6b6b6b);
    font-size: 18px;
    line-height: 1;
    cursor: pointer;
    padding: 0;
}

.wkb-expand-history-remove:disabled {
    opacity: 0.55;
    cursor: not-allowed;
}

.wkb-expand-history-summary {
    margin: 8px 0 0;
    font-size: 12px;
    line-height: 1.45;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-expand-history-meta {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px 12px;
    margin: 10px 0 0;
    font-size: 12px;
}

.wkb-expand-history-meta div {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.wkb-expand-history-meta dt {
    margin: 0;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
}

.wkb-expand-history-meta dd {
    margin: 0;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-expand-history-nodes {
    margin: 10px 0 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-height: 160px;
    overflow: auto;
}

.wkb-expand-history-nodes li {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 12px;
}

.wkb-expand-history-nodes strong {
    color: var(--cfde-ink, #33363d);
}

.wkb-expand-history-nodes span {
    color: var(--cfde-muted, #6b6b6b);
}
</style>
