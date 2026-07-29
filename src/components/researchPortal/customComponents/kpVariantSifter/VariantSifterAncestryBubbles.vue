<template>
    <div class="vks-ancestry-bubbles">
        <div
            v-if="loading || error || !bubbles.length"
            class="vks-ancestry-bubbles-head"
        >
            <span v-if="loading" class="vks-ancestry-bubbles-status">Checking availability…</span>
            <span v-else-if="error" class="vks-ancestry-bubbles-status is-error">{{ error }}</span>
            <span
                v-else
                class="vks-ancestry-bubbles-status"
            >
                No ancestry-specific association data for this locus.
            </span>
        </div>
        <div v-if="bubbles.length" class="vks-ancestry-bubbles-list" role="group" aria-label="Available ancestries">
            <button
                v-for="bubble in bubbles"
                :key="bubble.code"
                type="button"
                class="vks-ancestry-bubble"
                :class="{
                    'is-active': isActive(bubble.code),
                    'is-primary': isPrimary(bubble.code),
                    'is-loading': isSeriesLoading(bubble.code),
                }"
                :aria-pressed="isActive(bubble.code) ? 'true' : 'false'"
                :disabled="isPrimary(bubble.code) || isSeriesLoading(bubble.code)"
                :title="bubbleTitle(bubble)"
                @click="$emit('toggle-ancestry', bubble.code)"
            >
                <span class="vks-ancestry-bubble-label">{{ bubble.label }}</span>
                <span class="vks-ancestry-bubble-code">{{ bubble.code }}</span>
                <span v-if="bubble.count != null" class="vks-ancestry-bubble-count">
                    {{ formatCount(bubble.count) }}
                </span>
            </button>
        </div>
    </div>
</template>

<script>
import { ancestryLabel } from "./variantSifterSearchUtils.js";

export default {
    name: "VariantSifterAncestryBubbles",
    props: {
        bubbles: {
            type: Array,
            default: () => [],
        },
        primaryAncestry: {
            type: String,
            default: "Mixed",
        },
        selectedAncestries: {
            type: Array,
            default: () => [],
        },
        seriesLoading: {
            type: Object,
            default: () => ({}),
        },
        loading: {
            type: Boolean,
            default: false,
        },
        error: {
            type: String,
            default: null,
        },
    },
    methods: {
        isPrimary(code) {
            return code === this.primaryAncestry;
        },
        isActive(code) {
            if (this.isPrimary(code)) {
                return true;
            }
            return (this.selectedAncestries || []).includes(code);
        },
        isSeriesLoading(code) {
            return Boolean(this.seriesLoading?.[code]);
        },
        formatCount(count) {
            return Number(count).toLocaleString();
        },
        bubbleTitle(bubble) {
            const label = bubble.label || ancestryLabel(bubble.code);
            if (this.isPrimary(bubble.code)) {
                return `${label} (primary search ancestry)`;
            }
            if (this.isSeriesLoading(bubble.code)) {
                return `Loading ${label}…`;
            }
            if (this.isActive(bubble.code)) {
                return `Remove ${label} associations`;
            }
            return `Add ${label} associations`;
        },
    },
};
</script>

<style scoped>
.vks-ancestry-bubbles {
    margin: 0;
    padding: 0;
}

.vks-ancestry-bubbles-head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 8px 12px;
    margin-bottom: 8px;
}

.vks-ancestry-bubbles-status {
    font-size: 12px;
    color: var(--cfde-muted, #6b6b6b);
}

.vks-ancestry-bubbles-status.is-error {
    color: #a94442;
}

.vks-ancestry-bubbles-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.vks-ancestry-bubble {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    max-width: 100%;
    padding: 5px 10px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 999px;
    background: #ffffff;
    color: #334155;
    font-size: 12px;
    line-height: 1.3;
    cursor: pointer;
    transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;
}

.vks-ancestry-bubble:hover:not(:disabled) {
    border-color: var(--cfde-blue, #2c5c97);
    color: var(--cfde-blue, #2c5c97);
}

.vks-ancestry-bubble.is-active {
    background: var(--cfde-blue, #2c5c97);
    border-color: var(--cfde-blue, #2c5c97);
    color: #ffffff;
}

.vks-ancestry-bubble.is-active:hover:not(:disabled) {
    color: #ffffff;
}

.vks-ancestry-bubble.is-primary {
    cursor: default;
    opacity: 1;
}

.vks-ancestry-bubble.is-loading {
    opacity: 0.7;
    cursor: wait;
}

.vks-ancestry-bubble-code {
    font-weight: 700;
    letter-spacing: 0.02em;
}

.vks-ancestry-bubble-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 160px;
}

.vks-ancestry-bubble-count {
    opacity: 0.8;
    font-variant-numeric: tabular-nums;
}

.vks-ancestry-bubble.is-active .vks-ancestry-bubble-count {
    opacity: 0.9;
}
</style>
