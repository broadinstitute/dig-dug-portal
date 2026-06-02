<template>
    <div class="wkb-canvas">
        <div v-if="loadedGraph" class="wkb-canvas-loaded">
            <div class="wkb-canvas-placeholder-mark">KG</div>
            <p class="wkb-canvas-placeholder-title">{{ loadedGraph.label }}</p>
            <p class="wkb-canvas-placeholder-sub">
                {{ loadedGraph.summary }}
                <span v-if="loadedGraph.savedAt">
                    · Saved {{ loadedGraph.savedAt }}
                </span>
            </p>
            <p class="wkb-canvas-loaded-note">
                Graph visualization will render here. The session is loaded from your Library.
            </p>
        </div>
        <div v-else class="wkb-canvas-placeholder">
            <div class="wkb-canvas-placeholder-mark">KG</div>
            <p class="wkb-canvas-placeholder-title">Knowledge graph canvas</p>
            <p class="wkb-canvas-placeholder-sub">
                Your graph will appear here. Start by adding nodes from the
                <strong>Change</strong> menu, or open <strong>Library</strong> to load a saved graph.
            </p>
        </div>
    </div>
</template>

<script>
export default {
    name: "WorkspaceCanvas",
    props: {
        loadedGraph: {
            type: Object,
            default: null,
        },
    },
};
</script>

<style scoped>
.wkb-canvas {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background:
        radial-gradient(circle at 1px 1px, rgba(20, 22, 30, 0.06) 1px, transparent 0);
    background-size: 22px 22px;
    background-color: var(--cfde-bg, #f6f5f2);
    overflow: hidden;
}

.wkb-canvas-placeholder-mark {
    width: 56px;
    height: 56px;
    margin: 0 auto 14px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 1.1rem;
    color: #fff;
    background: var(--cfde-orange, #e07b39);
    letter-spacing: 0.02em;
}

.wkb-canvas-placeholder-title {
    font-size: 1.05rem;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
    margin: 0 0 6px;
}

.wkb-canvas-placeholder-sub {
    font-size: 0.9rem;
    line-height: 1.5;
    margin: 0;
}

.wkb-canvas-loaded,
.wkb-canvas-placeholder {
    text-align: center;
    max-width: 420px;
    padding: 24px;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-canvas-loaded-note {
    margin: 14px 0 0;
    font-size: 0.82rem;
    line-height: 1.45;
    color: var(--cfde-blue, #2c5c97);
}
</style>
