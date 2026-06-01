<template>
    <div class="wkb-inspector" :class="{ 'is-open': open }">
        <button
            type="button"
            class="wkb-inspector-tab"
            :aria-expanded="open ? 'true' : 'false'"
            @click="$emit('toggle')"
        >
            <span class="wkb-inspector-tab-label">Inspector</span>
        </button>
        <aside class="wkb-inspector-panel" role="complementary" aria-label="Inspector">
            <header class="wkb-inspector-head">
                <h3 class="wkb-inspector-title">Inspector</h3>
                <button
                    type="button"
                    class="wkb-inspector-close"
                    aria-label="Close inspector"
                    @click="$emit('toggle')"
                >
                    &times;
                </button>
            </header>
            <div class="wkb-inspector-body">
                <div class="wkb-inspector-section-label">Evidence</div>
                <p class="wkb-inspector-empty">
                    Select a node or edge in the graph to see the associations
                    behind it.
                </p>
            </div>
        </aside>
    </div>
</template>

<script>
export default {
    name: "WorkspaceInspector",
    props: {
        open: {
            type: Boolean,
            default: false,
        },
    },
};
</script>

<style scoped>
.wkb-inspector {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: stretch;
    pointer-events: none;
    z-index: 6;
}

/* Always-visible handle that sits just to the left of the panel edge. */
.wkb-inspector-tab {
    pointer-events: auto;
    position: absolute;
    top: 18px;
    right: 100%;
    height: 116px;
    width: 30px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-right: none;
    border-radius: 8px 0 0 8px;
    background: #ffffff;
    color: var(--cfde-orange, #e07b39);
    cursor: pointer;
    box-shadow: -3px 0 10px rgba(20, 22, 30, 0.06);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
}

.wkb-inspector-tab:hover {
    background: var(--cfde-orange-soft, #fbeee3);
}

.wkb-inspector-tab-label {
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 0.04em;
}

.wkb-inspector-panel {
    pointer-events: auto;
    width: 0;
    overflow: hidden;
    height: 100%;
    background: #ffffff;
    border-left: 1px solid var(--cfde-border, #e6e1d6);
    box-shadow: -8px 0 24px rgba(20, 22, 30, 0.08);
    transition: width 0.2s ease;
}

.wkb-inspector.is-open .wkb-inspector-panel {
    width: 340px;
}

.wkb-inspector-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    border-bottom: 1px solid var(--cfde-border, #e6e1d6);
    min-width: 340px;
}

.wkb-inspector-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--cfde-blue, #2c5c97);
}

.wkb-inspector-close {
    border: none;
    background: transparent;
    font-size: 1.4rem;
    line-height: 1;
    color: #8a8a8a;
    cursor: pointer;
    padding: 0 4px;
}

.wkb-inspector-close:hover {
    color: #2a2a2a;
}

.wkb-inspector-body {
    padding: 16px;
    min-width: 340px;
}

.wkb-inspector-section-label {
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--cfde-orange, #e07b39);
    margin-bottom: 8px;
}

.wkb-inspector-empty {
    font-size: 0.88rem;
    line-height: 1.5;
    color: #6b6b6b;
    margin: 0;
}
</style>
