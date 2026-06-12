<template>
    <div
        v-if="open"
        class="wkb-learn-companion-backdrop"
        role="presentation"
        @click="onBackdropClick"
    >
        <div
            class="wkb-learn-companion-shell"
            role="dialog"
            aria-modal="true"
            aria-labelledby="wkb-learn-companion-title"
            @click.stop
        >
            <button
                type="button"
                class="wkb-learn-companion-close"
                aria-label="Close"
                @click="$emit('close')"
            >
                &times;
            </button>
            <WorkspaceLearnCanvasPanel
                variant="companion"
                standalone
                :canvas-open-count="canvasOpenCount"
                :learn-companion-max-opens="learnCompanionMaxOpens"
            />
        </div>
    </div>
</template>

<script>
import WorkspaceLearnCanvasPanel from "./WorkspaceLearnCanvasPanel.vue";

export default {
    name: "WorkspaceLearnCompanionOverlay",
    components: {
        WorkspaceLearnCanvasPanel,
    },
    props: {
        open: {
            type: Boolean,
            default: false,
        },
        canvasOpenCount: {
            type: Number,
            default: 0,
        },
        learnCompanionMaxOpens: {
            type: Number,
            default: 5,
        },
        dismissible: {
            type: Boolean,
            default: true,
        },
    },
    mounted() {
        document.addEventListener("keydown", this.onKeyDown);
    },
    beforeDestroy() {
        document.removeEventListener("keydown", this.onKeyDown);
    },
    methods: {
        onBackdropClick(event) {
            if (event.target !== event.currentTarget || !this.dismissible) {
                return;
            }
            this.$emit("close");
        },
        onKeyDown(event) {
            if (this.open && event.key === "Escape") {
                event.preventDefault();
                this.$emit("close");
            }
        },
    },
};
</script>

<style scoped>
.wkb-learn-companion-backdrop {
    position: fixed;
    inset: 0;
    z-index: 2200;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px 16px;
    background: rgba(30, 32, 38, 0.45);
}

.wkb-learn-companion-shell {
    position: relative;
    width: min(520px, 100%);
    max-height: min(90vh, 720px);
}

.wkb-learn-companion-close {
    position: absolute;
    top: 10px;
    right: 12px;
    z-index: 2;
    border: none;
    background: transparent;
    font-size: 1.5rem;
    line-height: 1;
    color: var(--cfde-orange, #e07b39);
    cursor: pointer;
    padding: 4px 8px;
}
</style>
