<template>
    <div v-if="open" class="scp-progress-backdrop" role="status" aria-live="polite">
        <div class="scp-progress-card">
            <div v-for="step in steps" :key="step.id" class="scp-progress-step">
                <span class="scp-progress-marker" :class="`is-${step.status}`">
                    <span v-if="step.status === 'done'">✓</span>
                    <span v-else-if="step.status === 'error'">✕</span>
                </span>
                <span class="scp-progress-label" :class="{ 'is-pending': step.status === 'pending' }">
                    {{ step.label }}
                </span>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "ScopeProgressOverlay",
    props: {
        open: {
            type: Boolean,
            default: false,
        },
        steps: {
            type: Array,
            default: () => [],
        },
    },
};
</script>

<style scoped>
.scp-progress-backdrop {
    position: fixed;
    inset: 0;
    z-index: 2400;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(30, 32, 38, 0.45);
}

.scp-progress-card {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 280px;
    padding: 20px 24px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 16px 48px rgba(20, 22, 30, 0.18);
}

.scp-progress-step {
    display: flex;
    align-items: center;
    gap: 10px;
}

.scp-progress-marker {
    flex: 0 0 18px;
    height: 18px;
    width: 18px;
    border-radius: 999px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    color: #fff;
    background: var(--cfde-border, #e6e1d6);
}

.scp-progress-marker.is-active {
    background: var(--cfde-orange, #e07b39);
    animation: scp-progress-pulse 1.1s ease-in-out infinite;
}

.scp-progress-marker.is-done {
    background: var(--cfde-blue, #2c5c97);
}

.scp-progress-marker.is-error {
    background: #b3261e;
}

.scp-progress-label {
    font-size: 13px;
    color: var(--cfde-ink, #33363d);
}

.scp-progress-label.is-pending {
    color: var(--cfde-muted, #6b6b6b);
}

@keyframes scp-progress-pulse {
    0%,
    100% {
        opacity: 1;
    }
    50% {
        opacity: 0.4;
    }
}
</style>
