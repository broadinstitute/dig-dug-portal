<template>
    <div v-if="visible" ref="root" class="wkb-hypotheses-bubble-root">
        <div
            v-if="pickerOpen"
            class="wkb-hypotheses-bubble-picker"
            role="listbox"
            aria-label="Choose a hypotheses run"
        >
            <button
                v-for="item in numberedEntries"
                :key="item.id"
                type="button"
                class="wkb-hypotheses-bubble-picker-item"
                role="option"
                @click="onPick(item.id)"
            >
                <span class="wkb-hypotheses-bubble-picker-title">
                    Hypotheses {{ item.number }}
                </span>
                <span class="wkb-hypotheses-bubble-picker-meta">
                    {{ item.summaryLabel
                    }}<template v-if="item.timestampLabel">
                        · {{ item.timestampLabel }}</template
                    >
                </span>
            </button>
        </div>
        <button
            type="button"
            class="wkb-hypotheses-bubble-btn"
            :aria-expanded="pickerOpen"
            @click="onBubbleClick"
        >
            Hypotheses {{ hypothesesCount }}
        </button>
    </div>
</template>

<script>
import {
    sigChainRunSummaryLabel,
    sigChainRunTimestampLabel,
} from "./revealKgSigChainPrioritizeUtils.js";

export default {
    name: "WorkspaceHypothesesBubble",
    props: {
        visible: {
            type: Boolean,
            default: false,
        },
        entries: {
            type: Array,
            default: () => [],
        },
    },
    data() {
        return {
            pickerOpen: false,
        };
    },
    computed: {
        hypothesesCount() {
            return (this.entries || []).length;
        },
        numberedEntries() {
            const list = this.entries || [];
            return list.map((entry, index) => ({
                id: entry.id,
                number: index + 1,
                summaryLabel: sigChainRunSummaryLabel(entry),
                timestampLabel: sigChainRunTimestampLabel(entry),
            }));
        },
    },
    watch: {
        visible(isVisible) {
            if (!isVisible) {
                this.pickerOpen = false;
            }
        },
        hypothesesCount(count) {
            if (count <= 1) {
                this.pickerOpen = false;
            }
        },
    },
    mounted() {
        document.addEventListener("keydown", this.onKeyDown);
        document.addEventListener("pointerdown", this.onPointerDown, true);
    },
    beforeDestroy() {
        document.removeEventListener("keydown", this.onKeyDown);
        document.removeEventListener("pointerdown", this.onPointerDown, true);
    },
    methods: {
        onBubbleClick() {
            if (this.hypothesesCount <= 1) {
                const entry = this.entries[0];
                if (entry?.id) {
                    this.$emit("open-hypotheses", entry.id);
                }
                return;
            }
            this.pickerOpen = !this.pickerOpen;
        },
        onPick(runId) {
            this.pickerOpen = false;
            this.$emit("open-hypotheses", runId);
        },
        onKeyDown(event) {
            if (event.key === "Escape" && this.pickerOpen) {
                this.pickerOpen = false;
            }
        },
        onPointerDown(event) {
            if (!this.pickerOpen || !this.$refs.root) {
                return;
            }
            if (!this.$refs.root.contains(event.target)) {
                this.pickerOpen = false;
            }
        },
    },
};
</script>

<style scoped>
.wkb-hypotheses-bubble-root {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
}

.wkb-hypotheses-bubble-btn {
    padding: 8px 14px;
    border: 1px solid var(--cfde-orange, #e07b39);
    border-radius: 999px;
    background: #ffffff;
    color: var(--cfde-orange, #e07b39);
    font-size: 13px;
    font-weight: 600;
    line-height: 1.2;
    cursor: pointer;
}

.wkb-hypotheses-bubble-btn:hover,
.wkb-hypotheses-bubble-btn:focus-visible {
    background: var(--cfde-orange-soft, #fbeee3);
    outline: none;
}

.wkb-hypotheses-bubble-picker {
    width: min(280px, calc(100vw - 48px));
    padding: 6px;
    border: 1px solid var(--cfde-orange, #e07b39);
    border-radius: 10px;
    background: #ffffff;
}

.wkb-hypotheses-bubble-picker-item {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    width: 100%;
    padding: 8px 10px;
    border: none;
    border-radius: 6px;
    background: transparent;
    text-align: left;
    cursor: pointer;
    font-size: 13px;
    line-height: 1.35;
}

.wkb-hypotheses-bubble-picker-item:hover,
.wkb-hypotheses-bubble-picker-item:focus-visible {
    background: var(--cfde-orange-soft, #fbeee3);
    outline: none;
}

.wkb-hypotheses-bubble-picker-title {
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
}

.wkb-hypotheses-bubble-picker-meta {
    color: var(--cfde-muted, #6b6b6b);
    font-size: 13px;
}
</style>
