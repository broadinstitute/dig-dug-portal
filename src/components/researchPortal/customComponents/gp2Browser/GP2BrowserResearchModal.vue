<template>
    <div
        v-if="open"
        class="gp2-research-modal"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        @click.self="$emit('close')"
    >
        <div class="gp2-research-panel">
            <header class="gp2-research-head">
                <h2 :id="titleId">{{ title }}</h2>
                <button
                    type="button"
                    class="gp2-research-close"
                    :aria-label="`Close ${title}`"
                    @click="$emit('close')"
                >
                    &times;
                </button>
            </header>
            <div class="gp2-research-body"></div>
        </div>
    </div>
</template>

<script>
const RESEARCH_PANEL_TITLES = {
    genePrioritization: "Gene prioritization",
    associatedPhenotypes: "Associated phenotypes",
    literatureEvidence: "Literature evidence",
};

export default {
    name: "GP2BrowserResearchModal",
    props: {
        panelId: {
            type: String,
            default: null,
        },
    },
    computed: {
        open() {
            return Boolean(this.panelId && RESEARCH_PANEL_TITLES[this.panelId]);
        },
        title() {
            return (this.panelId && RESEARCH_PANEL_TITLES[this.panelId]) || "";
        },
        titleId() {
            return `gp2-research-title-${this.panelId || "panel"}`;
        },
    },
    mounted() {
        document.addEventListener("keydown", this.onKeyDown);
    },
    beforeDestroy() {
        document.removeEventListener("keydown", this.onKeyDown);
    },
    methods: {
        onKeyDown(event) {
            if (!this.open) {
                return;
            }
            if (event.key === "Escape") {
                this.$emit("close");
            }
        },
    },
};
</script>

<style scoped>
.gp2-research-modal {
    position: fixed;
    inset: 0;
    z-index: 1200;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2.5vh 2.5vw;
    background: rgba(20, 22, 30, 0.28);
}

.gp2-research-panel {
    width: 95%;
    height: 95%;
    max-width: none;
    max-height: none;
    display: flex;
    flex-direction: column;
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 16px 48px rgba(20, 22, 30, 0.22);
    overflow: hidden;
}

.gp2-research-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-shrink: 0;
    padding: 12px 16px;
    border-bottom: 1px solid var(--cfde-border, #e6e1d6);
}

.gp2-research-head h2 {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    color: var(--cfde-ink, #33363d);
}

.gp2-research-close {
    border: none;
    background: transparent;
    font-size: 22px;
    line-height: 1;
    color: var(--cfde-muted, #6b6b6b);
    cursor: pointer;
    padding: 0 4px;
}

.gp2-research-body {
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding: 14px 16px 18px;
}
</style>
