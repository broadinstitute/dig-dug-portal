<template>
    <div
        v-if="open"
        class="wkb-welcome-backdrop"
        role="presentation"
        @click="onBackdropClick"
    >
        <div
            class="wkb-welcome-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="wkb-welcome-title"
            @click.stop
        >
            <header class="wkb-welcome-head">
                <h2 id="wkb-welcome-title">Welcome to REVEAL KG Workspace</h2>
                <p>
                    Start a new graph from genes, traits, and mechanisms, or continue
                    from a graph you saved in this browser.
                </p>
            </header>

            <div class="wkb-welcome-options">
                <div class="wkb-welcome-option wkb-welcome-option-primary">
                    <span class="wkb-welcome-option-title">Create a new graph</span>
                    <span class="wkb-welcome-option-desc">
                        Search and select starting genes, traits, and mechanisms, or
                        use AI-assisted suggestions.
                    </span>
                    <button
                        type="button"
                        class="wkb-welcome-action wkb-welcome-action-primary"
                        @click="$emit('create')"
                    >
                        Create
                    </button>
                </div>

                <div
                    class="wkb-welcome-option"
                    :class="{ 'is-disabled': !hasSavedGraphs }"
                >
                    <span class="wkb-welcome-option-title">Load graph from Library</span>
                    <span class="wkb-welcome-option-desc">
                        {{
                            hasSavedGraphs
                                ? "Open your saved graphs and load one onto the canvas."
                                : "No saved graphs in this browser yet."
                        }}
                    </span>
                    <button
                        type="button"
                        class="wkb-welcome-action"
                        :disabled="!hasSavedGraphs"
                        @click="$emit('load-library')"
                    >
                        Open Library
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "WorkspaceWelcomeModal",
    props: {
        open: {
            type: Boolean,
            default: false,
        },
        hasSavedGraphs: {
            type: Boolean,
            default: false,
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
            if (event.target === event.currentTarget) {
                return;
            }
        },
        onKeyDown(event) {
            if (this.open && event.key === "Escape") {
                event.preventDefault();
            }
        },
    },
};
</script>

<style scoped>
.wkb-welcome-backdrop {
    position: fixed;
    inset: 0;
    z-index: 2200;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px 16px;
    background: rgba(30, 32, 38, 0.45);
}

.wkb-welcome-modal {
    width: min(520px, 100%);
    padding: 24px 26px 26px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 16px 48px rgba(20, 22, 30, 0.18);
}

.wkb-welcome-head h2 {
    margin: 0 0 8px;
    font-size: 1.35rem;
    font-weight: 700;
    color: var(--cfde-ink, #33363d);
}

.wkb-welcome-head p {
    margin: 0 0 20px;
    font-size: 13px;
    line-height: 1.55;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-welcome-options {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.wkb-welcome-option {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    text-align: left;
    width: 100%;
    padding: 14px 16px;
    border-radius: 10px;
    background: var(--cfde-bg, #f6f5f2);
}

.wkb-welcome-option-primary {
    background: var(--cfde-orange-soft, #fbeee3);
}

.wkb-welcome-option.is-disabled {
    opacity: 0.55;
}

.wkb-welcome-action {
    margin-top: 4px;
    border: 1px solid var(--cfde-blue, #2c5c97);
    background: #fff;
    color: var(--cfde-blue, #2c5c97);
    font-size: 13px;
    font-weight: 600;
    padding: 7px 16px;
    border-radius: 6px;
    cursor: pointer;
}

.wkb-welcome-action-primary {
    border-color: var(--cfde-orange, #e07b39);
    background: var(--cfde-orange, #e07b39);
    color: #fff;
}

.wkb-welcome-action-primary:hover {
    background: var(--cfde-orange-dark, #c2662b);
}

.wkb-welcome-action:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.wkb-welcome-option-title {
    font-size: 13px;
    font-weight: 700;
    color: var(--cfde-blue, #2c5c97);
}

.wkb-welcome-option-desc {
    font-size: 13px;
    line-height: 1.5;
    color: var(--cfde-ink, #33363d);
}
</style>
