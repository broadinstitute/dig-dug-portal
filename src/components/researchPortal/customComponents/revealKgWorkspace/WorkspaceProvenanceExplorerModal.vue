<template>
    <div
        v-if="open"
        class="wkb-provenance-explorer-backdrop"
        role="presentation"
        @click="onBackdropClick"
    >
        <div
            class="wkb-provenance-explorer-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="wkb-provenance-explorer-title"
            @click.stop
        >
            <header class="wkb-provenance-explorer-head">
                <div class="wkb-provenance-explorer-head-row">
                    <h2 id="wkb-provenance-explorer-title">Open provenance explorer</h2>
                    <button
                        type="button"
                        class="wkb-provenance-explorer-close"
                        aria-label="Close"
                        @click="$emit('close')"
                    >
                        &times;
                    </button>
                </div>
            </header>

            <div class="wkb-provenance-explorer-body">
                <p v-if="!selectedGeneSetCount" class="wkb-provenance-explorer-note">
                    Mark one or more gene sets as selected on the canvas before opening the
                    provenance explorer.
                </p>

                <template v-else>
                    <p class="wkb-provenance-explorer-copy">
                        Taking you to our agentic workspace. It's preloaded with the source files
                        and analyses behind these gene sets, so you can reproduce them and trace
                        their provenance alongside an AI agent.
                    </p>
                    <p class="wkb-provenance-explorer-copy">
                        <strong>Open provenance explorer</strong> opens that workspace in a new
                        tab. First, use <strong>Copy gene set information</strong> below, then
                        paste it into the workspace after you are redirected—the agent needs those
                        details to know which gene sets you are working with.
                    </p>

                    <p class="wkb-provenance-explorer-helper">
                        {{ selectedGeneSetCount }} selected gene set{{
                            selectedGeneSetCount === 1 ? "" : "s"
                        }}
                        <span v-if="copyableGeneSetCount !== selectedGeneSetCount">
                            · {{ copyableGeneSetCount }} with catalog ids
                        </span>
                    </p>

                    <ul v-if="skippedGeneSets.length" class="wkb-provenance-explorer-skipped">
                        <li v-for="entry in skippedGeneSets" :key="entry.nodeId">
                            {{ entry.label || entry.nodeId }}: no catalog gene set id
                        </li>
                    </ul>

                    <button
                        type="button"
                        class="wkb-provenance-explorer-copy-btn"
                        :disabled="!canCopyGeneSetInformation"
                        title="Copy provenance URLs and assistant intentions for selected gene sets"
                        @click="onCopyGeneSetInformation"
                    >
                        Copy gene set information
                    </button>
                    <p
                        v-if="copyFeedback"
                        class="wkb-provenance-explorer-copy-feedback"
                        role="status"
                    >
                        {{ copyFeedback }}
                    </p>

                    <button
                        type="button"
                        class="wkb-provenance-explorer-open"
                        :disabled="!canOpenProvenanceExplorer"
                        :title="provenanceExplorerButtonTitle"
                        @click="onOpenProvenanceExplorer"
                    >
                        Open provenance explorer
                    </button>
                    <p v-if="!canOpenProvenanceExplorer" class="wkb-provenance-explorer-footnote">
                        Provenance explorer link is not configured yet.
                    </p>
                </template>
            </div>
        </div>
    </div>
</template>

<script>
import {
    copyTextToClipboard,
    formatSelectedGeneSetsInformationForClipboard,
    GENE_SET_PROVENANCE_EXPLORER_URL,
    geneSetInformationEntryFromNode,
    openProvenanceExplorerWindow,
} from "./revealKgGeneSetProvenance.js";

export default {
    name: "WorkspaceProvenanceExplorerModal",
    props: {
        open: {
            type: Boolean,
            default: false,
        },
        geneSetNodes: {
            type: Array,
            default: () => [],
        },
        provenanceExplorerUrl: {
            type: String,
            default: GENE_SET_PROVENANCE_EXPLORER_URL,
        },
    },
    data() {
        return {
            copyFeedback: "",
            copyFeedbackTimer: null,
        };
    },
    computed: {
        selectedGeneSetCount() {
            return (this.geneSetNodes || []).length;
        },
        geneSetEntries() {
            return (this.geneSetNodes || []).map(geneSetInformationEntryFromNode);
        },
        copyableGeneSetCount() {
            return this.geneSetEntries.filter((entry) => Number.isFinite(entry.geneSetId)).length;
        },
        skippedGeneSets() {
            return this.geneSetEntries.filter((entry) => !Number.isFinite(entry.geneSetId));
        },
        clipboardText() {
            return formatSelectedGeneSetsInformationForClipboard(this.geneSetNodes);
        },
        canCopyGeneSetInformation() {
            return Boolean(this.clipboardText);
        },
        resolvedProvenanceExplorerUrl() {
            return String(this.provenanceExplorerUrl || "").trim();
        },
        canOpenProvenanceExplorer() {
            return Boolean(this.resolvedProvenanceExplorerUrl);
        },
        provenanceExplorerButtonTitle() {
            return this.canOpenProvenanceExplorer
                ? "Open the gene set provenance explorer"
                : "Provenance explorer URL is not configured yet";
        },
    },
    beforeDestroy() {
        if (this.copyFeedbackTimer) {
            clearTimeout(this.copyFeedbackTimer);
        }
    },
    methods: {
        onBackdropClick() {
            this.$emit("close");
        },
        async onCopyGeneSetInformation() {
            if (!this.clipboardText) {
                return;
            }
            try {
                await copyTextToClipboard(this.clipboardText);
                this.setCopyFeedback("Copied to clipboard.");
            } catch (error) {
                this.setCopyFeedback("Could not copy to clipboard.");
            }
        },
        onOpenProvenanceExplorer() {
            if (!this.canOpenProvenanceExplorer) {
                return;
            }
            openProvenanceExplorerWindow(this.resolvedProvenanceExplorerUrl);
            this.$emit("open-explorer", {
                url: this.resolvedProvenanceExplorerUrl,
                geneSetCount: this.copyableGeneSetCount,
            });
        },
        setCopyFeedback(message) {
            this.copyFeedback = message;
            if (this.copyFeedbackTimer) {
                clearTimeout(this.copyFeedbackTimer);
            }
            this.copyFeedbackTimer = setTimeout(() => {
                this.copyFeedback = "";
                this.copyFeedbackTimer = null;
            }, 2500);
        },
    },
};
</script>

<style scoped>
.wkb-provenance-explorer-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1200;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: rgba(24, 26, 32, 0.45);
}

.wkb-provenance-explorer-modal {
    width: min(520px, 100%);
    border-radius: 12px;
    background: #ffffff;
    box-shadow: 0 16px 48px rgba(20, 22, 30, 0.18);
}

.wkb-provenance-explorer-head {
    padding: 20px 26px 0;
}

.wkb-provenance-explorer-head-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
}

.wkb-provenance-explorer-head-row h2 {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--cfde-ink, #33363d);
}

.wkb-provenance-explorer-close {
    border: none;
    background: transparent;
    color: var(--cfde-orange, #e07b39);
    font-size: 1.6rem;
    line-height: 1;
    cursor: pointer;
}

.wkb-provenance-explorer-body {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
    padding: 16px 26px 24px;
    text-align: left;
}

.wkb-provenance-explorer-note,
.wkb-provenance-explorer-helper,
.wkb-provenance-explorer-footnote {
    margin: 0;
    font-size: 12px;
    line-height: 1.45;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-provenance-explorer-copy {
    margin: 0;
    font-size: 12px;
    line-height: 1.5;
    color: var(--cfde-ink, #33363d);
}

.wkb-provenance-explorer-skipped {
    margin: 0;
    padding-left: 18px;
    font-size: 12px;
    line-height: 1.45;
    color: #9a3412;
}

.wkb-provenance-explorer-copy-btn {
    border: 1px solid var(--cfde-blue, #2c5c97);
    border-radius: 6px;
    background: #fff;
    color: var(--cfde-blue, #2c5c97);
    font-size: 12px;
    font-weight: 600;
    padding: 7px 14px;
    cursor: pointer;
}

.wkb-provenance-explorer-copy-btn:hover:not(:disabled) {
    background: #eef4fb;
}

.wkb-provenance-explorer-copy-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.wkb-provenance-explorer-copy-feedback {
    margin: -6px 0 0;
    font-size: 11px;
    line-height: 1.4;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-provenance-explorer-open {
    border: 1px solid var(--cfde-orange, #e07b39);
    border-radius: 6px;
    background: var(--cfde-orange, #e07b39);
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    padding: 9px 20px;
    cursor: pointer;
}

.wkb-provenance-explorer-open:hover:not(:disabled) {
    background: var(--cfde-orange-dark, #c2662b);
}

.wkb-provenance-explorer-open:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
</style>
