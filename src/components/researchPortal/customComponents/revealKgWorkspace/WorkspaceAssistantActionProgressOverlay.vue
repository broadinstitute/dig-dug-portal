<template>
    <div
        v-if="open"
        class="wkb-assistant-progress-overlay"
        role="alertdialog"
        aria-modal="true"
        aria-live="assertive"
        aria-busy="true"
        :aria-label="message || 'Running assistant action'"
    >
        <div class="wkb-assistant-progress-card">
            <span class="wkb-assistant-progress-spinner" aria-hidden="true" />
            <p class="wkb-assistant-progress-message">{{ message || "Running…" }}</p>
            <p class="wkb-assistant-progress-note">
                Graph changes are paused while this action runs.
            </p>
        </div>
    </div>
</template>

<script>
export default {
    name: "WorkspaceAssistantActionProgressOverlay",
    props: {
        open: {
            type: Boolean,
            default: false,
        },
        message: {
            type: String,
            default: "",
        },
    },
};
</script>

<style scoped>
.wkb-assistant-progress-overlay {
    position: absolute;
    inset: 0;
    z-index: 12;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: rgba(246, 245, 242, 0.72);
    backdrop-filter: blur(2px);
    pointer-events: all;
}

.wkb-assistant-progress-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    width: min(420px, calc(100% - 32px));
    padding: 22px 28px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 14px;
    background: #ffffff;
    box-shadow: 0 12px 40px rgba(20, 22, 30, 0.18);
    text-align: center;
}

.wkb-assistant-progress-spinner {
    width: 28px;
    height: 28px;
    border: 3px solid rgba(44, 92, 151, 0.2);
    border-top-color: var(--cfde-blue, #2c5c97);
    border-radius: 50%;
    animation: wkb-assistant-progress-spin 0.75s linear infinite;
}

@keyframes wkb-assistant-progress-spin {
    to {
        transform: rotate(360deg);
    }
}

.wkb-assistant-progress-message {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    line-height: 1.45;
    color: var(--cfde-ink, #33363d);
}

.wkb-assistant-progress-note {
    margin: 0;
    font-size: 13px;
    line-height: 1.45;
    color: var(--cfde-muted, #6b6b6b);
}
</style>
