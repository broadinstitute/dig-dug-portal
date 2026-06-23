<template>
    <aside
        v-if="open"
        class="vks-assistant-panel"
        role="dialog"
        aria-modal="false"
        aria-labelledby="vks-assistant-title"
        @click.stop
        @mousedown.stop
    >
        <header class="vks-assistant-head">
            <h2 id="vks-assistant-title">Variant Sifter assistant</h2>
            <button
                type="button"
                class="vks-assistant-close"
                aria-label="Close assistant"
                @click="$emit('close')"
            >
                &times;
            </button>
        </header>
        <div class="vks-assistant-body">
            <p class="vks-assistant-note">
                AI-assisted actions for filtering and comparing variants across
                sections will be added here.
            </p>
        </div>
    </aside>
</template>

<script>
export default {
    name: "VariantSifterAiAssistantPanel",
    props: {
        open: {
            type: Boolean,
            default: false,
        },
    },
};
</script>

<style scoped>
.vks-assistant-panel {
    position: absolute;
    top: var(--vks-side-panel-top, 12px);
    right: calc(var(--vks-drawer-tab-width, 30px) + var(--vks-side-panel-inset, 12px));
    bottom: var(--vks-side-panel-inset, 12px);
    z-index: 25;
    display: flex;
    flex-direction: column;
    width: min(380px, calc(100% - 24px));
    max-width: 420px;
    overflow: hidden;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 12px;
    background: #ffffff;
    box-shadow: 0 8px 32px rgba(20, 22, 30, 0.16);
    pointer-events: auto;
}

.vks-assistant-head {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 16px 18px 12px;
    border-bottom: 1px solid var(--cfde-border, #e6e1d6);
}

.vks-assistant-head h2 {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--cfde-ink, #33363d);
    line-height: 1.35;
}

.vks-assistant-close {
    border: none;
    background: transparent;
    font-size: 24px;
    line-height: 1;
    color: var(--cfde-orange, #e07b39);
    cursor: pointer;
    padding: 0 4px;
}

.vks-assistant-body {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    padding: 12px 14px 16px;
}

.vks-assistant-note {
    margin: 0;
    font-size: 13px;
    line-height: 1.45;
    color: var(--cfde-muted, #6b6b6b);
}
</style>
