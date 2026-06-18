<template>
    <div class="wkb-expand-intent">
        <p class="wkb-expand-intent-intro">
            Describe your research goal in plain language. We will plan catalog searches for
            <strong>gene sets</strong>, <strong>mechanisms</strong>, and <strong>traits</strong>,
            then add the best matches to the graph.
        </p>
        <p class="wkb-expand-intent-note">
            Genes are not added from free text — use Expand or the inspector on added nodes to
            place gene nodes (up to {{ expandMaxNeighbors }} per expand step).
        </p>
        <p class="wkb-expand-intent-workflow">
            Need many genes, gene sets, or traits at once for a research question?
            <a
                class="wkb-expand-intent-workflow-link"
                :href="workflowUrl"
                target="_blank"
                rel="noopener noreferrer"
            >Open {{ workflowTitle }}</a>
            for bulk discovery.
        </p>

        <label class="wkb-expand-intent-field">
            <span class="wkb-expand-intent-label">Research intention</span>
            <textarea
                v-model="intention"
                class="wkb-expand-intent-textarea"
                rows="3"
                :disabled="busy || !llmAvailable"
                placeholder="Example: Find a glycosylation mechanism that could alter lipoprotein handling and coagulation"
            />
        </label>

        <p v-if="!llmAvailable" class="wkb-expand-intent-status">
            Intention-based add requires an LLM backend.
        </p>
        <p v-else-if="statusMessage" class="wkb-expand-intent-status" role="status">
            {{ statusMessage }}
        </p>

        <button
            type="button"
            class="wkb-expand-intent-submit"
            :disabled="busy || !llmAvailable || !intention.trim()"
            @click="runIntentAdd"
        >
            {{ busy ? "Finding nodes…" : "Find & add nodes" }}
        </button>

        <p v-if="lastExplanation" class="wkb-expand-intent-explanation">
            {{ lastExplanation }}
        </p>
    </div>
</template>

<script>
import {
    CANVAS_EXPAND_MAX_NEIGHBORS,
    REVEAL_WORKFLOW_TITLE,
    REVEAL_WORKFLOW_URL,
} from "./revealKgBulkWorkflowGuidance.js";

export default {
    name: "WorkspaceExpandIntentAdd",
    props: {
        llmAvailable: {
            type: Boolean,
            default: false,
        },
        busy: {
            type: Boolean,
            default: false,
        },
        statusMessage: {
            type: String,
            default: "",
        },
        lastExplanation: {
            type: String,
            default: "",
        },
    },
    data() {
        return {
            intention: "",
        };
    },
    computed: {
        expandMaxNeighbors() {
            return CANVAS_EXPAND_MAX_NEIGHBORS;
        },
        workflowUrl() {
            return REVEAL_WORKFLOW_URL;
        },
        workflowTitle() {
            return REVEAL_WORKFLOW_TITLE;
        },
    },
    methods: {
        runIntentAdd() {
            const text = this.intention.trim();
            if (!text) {
                return;
            }
            this.$emit("run", { intention: text });
        },
        clearIntention() {
            this.intention = "";
        },
    },
};
</script>

<style scoped>
.wkb-expand-intent {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-bottom: 14px;
    margin-bottom: 14px;
    border-bottom: 1px solid var(--cfde-border, #e6e1d6);
}

.wkb-expand-intent-intro,
.wkb-expand-intent-note,
.wkb-expand-intent-workflow {
    margin: 0;
    font-size: 12px;
    line-height: 1.45;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-expand-intent-workflow-link {
    color: var(--cfde-blue, #2c5c97);
    font-weight: 600;
    text-decoration: none;
}

.wkb-expand-intent-workflow-link:hover {
    text-decoration: underline;
}

.wkb-expand-intent-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.wkb-expand-intent-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
}

.wkb-expand-intent-textarea {
    width: 100%;
    padding: 8px 10px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 8px;
    font-size: 13px;
    font-family: inherit;
    line-height: 1.45;
    resize: vertical;
    min-height: 72px;
}

.wkb-expand-intent-textarea:disabled {
    opacity: 0.65;
}

.wkb-expand-intent-status {
    margin: 0;
    font-size: 12px;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-expand-intent-submit {
    align-self: flex-start;
    padding: 7px 14px;
    border: 1px solid var(--cfde-blue, #2c5c97);
    border-radius: 8px;
    background: var(--cfde-blue, #2c5c97);
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
}

.wkb-expand-intent-submit:disabled {
    opacity: 0.55;
    cursor: not-allowed;
}

.wkb-expand-intent-explanation {
    margin: 0;
    font-size: 12px;
    line-height: 1.45;
    color: var(--cfde-ink, #33363d);
}
</style>
