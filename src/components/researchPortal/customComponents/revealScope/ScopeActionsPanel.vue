<template>
    <div
        class="scp-actions-popup"
        :class="{ 'is-collapsed': collapsed }"
        :style="popupStyle"
        role="dialog"
        aria-labelledby="scp-actions-title"
    >
        <div class="scp-actions-head">
            <span id="scp-actions-title" class="scp-actions-title">Actions</span>
            <div class="scp-actions-head-btns">
                <button
                    type="button"
                    class="scp-actions-icon-btn"
                    :aria-label="collapsed ? 'Expand Actions panel' : 'Collapse Actions panel'"
                    :aria-expanded="collapsed ? 'false' : 'true'"
                    :title="collapsed ? 'Expand' : 'Collapse'"
                    @click="collapsed = !collapsed"
                >
                    <span class="scp-actions-collapse-glyph" aria-hidden="true">{{
                        collapsed ? "▸" : "▾"
                    }}</span>
                </button>
                <button
                    type="button"
                    class="scp-actions-icon-btn scp-actions-close"
                    aria-label="Close"
                    title="Close"
                    @click="$emit('close')"
                >
                    &times;
                </button>
            </div>
        </div>

        <template v-if="!collapsed">
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
        </template>
    </div>
</template>

<script>
const BUMP_PX = 16;

function measureFooterOverlapPx() {
    if (typeof document === "undefined") return 0;
    const footer =
        document.querySelector('[class*="kp-footer"]') ||
        document.querySelector("footer");
    if (!footer || !(footer instanceof HTMLElement)) return 0;
    const rect = footer.getBoundingClientRect();
    // Only reserve space the footer currently covers at the bottom of the viewport.
    return Math.max(0, Math.round(window.innerHeight - rect.top));
}

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
        initialTab: {
            type: String,
            default: "next",
            validator(value) {
                return value === "next" || value === "catalog";
            },
        },
    },
    data() {
        return {
            activeTab: this.initialTab,
            collapsed: false,
            // windowHeight - (bump * 2) - footerHeight
            panelMaxHeightPx: null,
        };
    },
    watch: {
        initialTab(value) {
            this.activeTab = value;
        },
    },
    computed: {
        visibleActions() {
            return this.activeTab === "next" ? this.nextSteps : this.catalogActions;
        },
        popupStyle() {
            if (this.collapsed || !this.panelMaxHeightPx) {
                return {};
            }
            return { maxHeight: `${this.panelMaxHeightPx}px` };
        },
    },
    mounted() {
        this.updatePanelMaxHeight();
        window.addEventListener("resize", this.updatePanelMaxHeight);
        window.addEventListener("scroll", this.updatePanelMaxHeight, { passive: true });
    },
    beforeDestroy() {
        window.removeEventListener("resize", this.updatePanelMaxHeight);
        window.removeEventListener("scroll", this.updatePanelMaxHeight);
    },
    methods: {
        updatePanelMaxHeight() {
            const footerHeight = measureFooterOverlapPx();
            // Available height: viewport minus top+bottom bump, minus overlapping page footer.
            // (windowHeight - (bump * 2) - footerHeight)
            this.panelMaxHeightPx = Math.max(
                160,
                window.innerHeight - BUMP_PX * 2 - footerHeight
            );
        },
    },
};
</script>

<style scoped>
.scp-actions-popup {
    --scp-actions-bump: 16px;
    position: fixed;
    top: var(--scp-actions-bump);
    right: var(--scp-actions-bump);
    z-index: 2100;
    width: 320px;
    height: auto;
    display: flex;
    flex-direction: column;
    padding: 16px 18px 18px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 16px 48px rgba(20, 22, 30, 0.18);
    box-sizing: border-box;
}

.scp-actions-popup.is-collapsed {
    padding-bottom: 16px;
}

.scp-actions-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 0;
    flex: 0 0 auto;
}

.scp-actions-popup:not(.is-collapsed) .scp-actions-head {
    margin-bottom: 12px;
}

.scp-actions-title {
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--cfde-ink, #33363d);
}

.scp-actions-head-btns {
    display: flex;
    align-items: center;
    gap: 2px;
    flex: 0 0 auto;
}

.scp-actions-icon-btn {
    border: none;
    background: transparent;
    font-size: 1.15rem;
    line-height: 1;
    color: var(--cfde-orange, #e07b39);
    cursor: pointer;
    padding: 2px 6px;
}

.scp-actions-close {
    font-size: 1.4rem;
}

.scp-actions-collapse-glyph {
    display: inline-block;
    font-size: 2rem;
    margin-top: -0.25rem;
    font-weight: 700;
}

.scp-actions-tabs {
    display: flex;
    gap: 4px;
    padding: 3px;
    border-radius: 8px;
    background: #f6f5f2;
    margin-bottom: 14px;
    flex: 0 0 auto;
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
    flex: 1 1 auto;
    min-height: 0;
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
