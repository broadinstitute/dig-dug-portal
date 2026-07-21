<template>
    <div
        v-if="progress.active"
        class="vks-region-loading-overlay"
        role="status"
        aria-live="polite"
        aria-label="Loading region data"
    >
        <div class="vks-region-loading-bubble">
            <button
                type="button"
                class="vks-region-loading-close"
                aria-label="Close loading panel"
                @click="$emit('dismiss')"
            >
                <b-icon icon="x" aria-hidden="true" />
            </button>
            <ul class="vks-region-loading-steps">
                <li
                    v-for="step in progress.steps"
                    :key="step.id"
                    class="vks-region-loading-step"
                    :class="`is-${step.status}`"
                >
                    <b-icon
                        icon="check-circle-fill"
                        class="vks-region-loading-step-icon"
                        :class="iconClass(step.status)"
                        aria-hidden="true"
                    />
                    <span class="vks-region-loading-step-label">{{ step.label }}</span>
                    <span
                        v-if="step.status === 'loading'"
                        class="vks-region-loading-dots"
                        aria-hidden="true"
                    >
                        <span>.</span><span>.</span><span>.</span>
                    </span>
                </li>
            </ul>
        </div>
    </div>
</template>

<script>
import { VKS_REGION_LOAD_STATUS } from "./variantSifterRegionLoadProgress.js";

export default {
    name: "VariantSifterRegionLoadBubble",
    props: {
        progress: {
            type: Object,
            required: true,
        },
    },
    methods: {
        iconClass(status) {
            if (status === VKS_REGION_LOAD_STATUS.DONE) {
                return "is-done";
            }
            if (status === VKS_REGION_LOAD_STATUS.FAILED) {
                return "is-failed";
            }
            return "is-muted";
        },
    },
};
</script>

<style scoped>
.vks-region-loading-overlay {
    position: fixed;
    inset: 0;
    z-index: 1100;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
}

.vks-region-loading-bubble {
    position: relative;
    min-width: 260px;
    max-width: min(92vw, 360px);
    padding: 16px 36px 16px 20px;
    border-radius: 16px;
    background: #ffffff;
    border: 1px solid var(--cfde-border, #e6e1d6);
    box-shadow: 0 10px 28px rgba(20, 22, 30, 0.16);
    pointer-events: auto;
}

.vks-region-loading-close {
    position: absolute;
    top: 8px;
    right: 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: var(--cfde-muted, #6b6b6b);
    cursor: pointer;
}

.vks-region-loading-close:hover {
    background: rgba(20, 22, 30, 0.06);
    color: var(--cfde-ink, #33363d);
}

.vks-region-loading-steps {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.vks-region-loading-step {
    display: grid;
    grid-template-columns: 22px 1fr auto;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    line-height: 1.35;
    color: var(--cfde-muted, #6b6b6b);
}

.vks-region-loading-step.is-loading {
    color: var(--cfde-ink, #33363d);
    font-weight: 600;
}

.vks-region-loading-step.is-done {
    color: var(--cfde-ink, #33363d);
}

.vks-region-loading-step.is-failed {
    color: #b42318;
    font-weight: 600;
}

.vks-region-loading-step.is-pending {
    opacity: 0.45;
}

.vks-region-loading-step-icon {
    font-size: 1rem;
}

.vks-region-loading-step-icon.is-muted {
    color: #9aa0a8;
}

.vks-region-loading-step-icon.is-done {
    color: #2e7d32;
}

.vks-region-loading-step-icon.is-failed {
    color: #b42318;
}

.vks-region-loading-dots {
    display: inline-block;
    min-width: 1.5ch;
    text-align: left;
    font-weight: 700;
    color: var(--cfde-orange, #e07b39);
}

.vks-region-loading-dots span {
    opacity: 0;
    animation: vks-region-dot-appear 1.5s infinite;
}

.vks-region-loading-dots span:nth-child(1) {
    animation-delay: 0s;
}

.vks-region-loading-dots span:nth-child(2) {
    animation-delay: 0.35s;
}

.vks-region-loading-dots span:nth-child(3) {
    animation-delay: 0.7s;
}

@keyframes vks-region-dot-appear {
    0%,
    20% {
        opacity: 0;
    }
    25%,
    100% {
        opacity: 1;
    }
}
</style>
