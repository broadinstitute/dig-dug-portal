<template>
    <div v-if="visible" ref="root" class="wkb-datasets-bubble-root">
        <div
            v-if="pickerOpen"
            class="wkb-datasets-bubble-picker"
            role="listbox"
            aria-label="Choose a datasets run"
        >
            <button
                v-for="item in numberedEntries"
                :key="item.id"
                type="button"
                class="wkb-datasets-bubble-picker-item"
                role="option"
                @click="onPick(item.id)"
            >
                <span class="wkb-datasets-bubble-picker-title">
                    Datasets {{ item.number }}
                </span>
                <span class="wkb-datasets-bubble-picker-meta">
                    {{ item.summaryLabel
                    }}<template v-if="item.timestampLabel">
                        · {{ item.timestampLabel }}</template
                    >
                </span>
            </button>
        </div>
        <button
            type="button"
            class="wkb-datasets-bubble-btn"
            :aria-expanded="pickerOpen"
            @click="onBubbleClick"
        >
            Datasets {{ datasetsCount }}
        </button>
    </div>
</template>

<script>
import {
    cfdeDatasetRunSummaryLabel,
    cfdeDatasetRunTimestampLabel,
} from "./revealKgCfdeDatasetUtils.js";

export default {
    name: "WorkspaceDatasetsBubble",
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
        datasetsCount() {
            return (this.entries || []).length;
        },
        numberedEntries() {
            const list = this.entries || [];
            return list.map((entry, index) => ({
                id: entry.id,
                number: index + 1,
                summaryLabel: cfdeDatasetRunSummaryLabel(entry),
                timestampLabel: cfdeDatasetRunTimestampLabel(entry),
            }));
        },
    },
    watch: {
        visible(isVisible) {
            if (!isVisible) {
                this.pickerOpen = false;
            }
        },
        datasetsCount(count) {
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
            if (this.datasetsCount <= 1) {
                const entry = this.entries[0];
                if (entry?.id) {
                    this.$emit("open-datasets", entry.id);
                }
                return;
            }
            this.pickerOpen = !this.pickerOpen;
        },
        onPick(runId) {
            this.pickerOpen = false;
            this.$emit("open-datasets", runId);
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
.wkb-datasets-bubble-root {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
}

.wkb-datasets-bubble-btn {
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

.wkb-datasets-bubble-btn:hover,
.wkb-datasets-bubble-btn:focus-visible {
    background: var(--cfde-orange-soft, #fbeee3);
    outline: none;
}

.wkb-datasets-bubble-picker {
    width: min(280px, calc(100vw - 48px));
    padding: 6px;
    border: 1px solid var(--cfde-orange, #e07b39);
    border-radius: 10px;
    background: #ffffff;
}

.wkb-datasets-bubble-picker-item {
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

.wkb-datasets-bubble-picker-item:hover,
.wkb-datasets-bubble-picker-item:focus-visible {
    background: var(--cfde-orange-soft, #fbeee3);
    outline: none;
}

.wkb-datasets-bubble-picker-title {
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
}

.wkb-datasets-bubble-picker-meta {
    color: var(--cfde-muted, #6b6b6b);
    font-size: 13px;
}
</style>
