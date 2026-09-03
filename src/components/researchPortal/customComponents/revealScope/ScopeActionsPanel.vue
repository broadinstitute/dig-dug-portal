<template>
    <div class="scp-actions-popup" role="dialog" aria-labelledby="scp-actions-title">
        <div class="scp-actions-head">
            <span id="scp-actions-title" class="scp-actions-title">Actions</span>
            <button type="button" class="scp-actions-close" aria-label="Close" @click="$emit('close')">
                &times;
            </button>
        </div>

        <div class="scp-actions-tabs" role="tablist" aria-label="Actions sections">
            <button
                type="button"
                role="tab"
                class="scp-actions-tab"
                :class="{ 'is-active': activeTab === 'next' }"
                :aria-selected="activeTab === 'next' ? 'true' : 'false'"
                @click="activeTab = 'next'"
            >
                Next steps
            </button>
            <button
                type="button"
                role="tab"
                class="scp-actions-tab"
                :class="{ 'is-active': activeTab === 'catalog' }"
                :aria-selected="activeTab === 'catalog' ? 'true' : 'false'"
                @click="activeTab = 'catalog'"
            >
                Actions
            </button>
        </div>

        <div class="scp-actions-list">
            <button
                v-for="action in visibleActions"
                :key="action.id"
                type="button"
                class="scp-actions-item"
                @click="$emit('run', action.id)"
            >
                <span class="scp-actions-item-label">{{ action.label }}</span>
                <span class="scp-actions-item-desc">{{ action.description }}</span>
            </button>
        </div>
    </div>
</template>

<script>
export default {
    name: "ScopeActionsPanel",
    props: {
        nextSteps: {
            type: Array,
            default: () => [],
        },
        catalogActions: {
            type: Array,
            default: () => [],
        },
    },
    data() {
        return {
            activeTab: "next",
        };
    },
    computed: {
        visibleActions() {
            return this.activeTab === "next" ? this.nextSteps : this.catalogActions;
        },
    },
};
</script>

<style scoped>
.scp-actions-popup {
    position: absolute;
    right: 16px;
    bottom: 16px;
    z-index: 20;
    width: 320px;
    max-height: min(70%, 520px);
    display: flex;
    flex-direction: column;
    padding: 16px 18px 18px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 16px 48px rgba(20, 22, 30, 0.18);
}

.scp-actions-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
}

.scp-actions-title {
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--cfde-ink, #33363d);
}

.scp-actions-close {
    border: none;
    background: transparent;
    font-size: 1.4rem;
    line-height: 1;
    color: var(--cfde-orange, #e07b39);
    cursor: pointer;
    padding: 2px 6px;
}

.scp-actions-tabs {
    display: flex;
    gap: 4px;
    padding: 3px;
    border-radius: 8px;
    background: #f6f5f2;
    margin-bottom: 14px;
}

.scp-actions-tab {
    flex: 1;
    border: none;
    background: transparent;
    color: var(--cfde-muted, #6b6b6b);
    font-size: 13px;
    font-weight: 600;
    padding: 7px 10px;
    border-radius: 6px;
    cursor: pointer;
}

.scp-actions-tab.is-active {
    background: #ffffff;
    color: var(--cfde-ink, #33363d);
    box-shadow: 0 1px 3px rgba(20, 22, 30, 0.08);
}

.scp-actions-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    overflow-y: auto;
}

.scp-actions-item {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    text-align: left;
    width: 100%;
    padding: 12px 14px;
    border: none;
    border-radius: 8px;
    background: var(--cfde-orange, #e07b39);
    color: #fff;
    cursor: pointer;
}

.scp-actions-item:hover {
    background: var(--cfde-orange-dark, #c2662b);
}

.scp-actions-item-label {
    font-size: 16px;
    font-weight: 700;
}

.scp-actions-item-desc {
    font-size: 13px;
    font-weight: 400;
    color: #fff;
    opacity: 0.92;
}
</style>
