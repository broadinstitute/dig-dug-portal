<template>
    <section class="wkb-sig-chain-run">
        <header class="wkb-sig-chain-run-head">
            <h3 class="wkb-sig-chain-run-title">{{ runHeadline }}</h3>
            <span v-if="startedLabel" class="wkb-sig-chain-run-meta">{{ startedLabel }}</span>
        </header>

        <div v-if="showRunContext" class="wkb-sig-chain-run-context">
            <div class="wkb-sig-chain-selected-set">
                <div class="wkb-sig-chain-selected-set-head">
                    <strong>Selected nodes used</strong>
                    <span class="wkb-sig-chain-run-meta">
                        {{ selectedNodes.length }} node{{ selectedNodes.length === 1 ? "" : "s" }}
                    </span>
                </div>
                <div v-if="selectedNodes.length" class="wkb-sig-chain-chip-list">
                    <span
                        v-for="node in selectedNodes"
                        :key="node.id"
                        class="wkb-sig-chain-chip"
                    >
                        {{ node.label || node.id }}
                    </span>
                </div>
                <p v-else class="wkb-inspector-note">
                    No selected-node snapshot was recorded for this run.
                </p>
            </div>

            <details v-if="showPromptAccordion" class="wkb-sig-chain-prompt">
                <summary>
                    {{ run.status === "loading" ? "See prompt" : "See LLM prompt and response" }}
                </summary>
                <div v-if="run.status === 'loading'" class="wkb-sig-chain-prompt-block">
                    <strong>Prompt</strong>
                    <pre class="wkb-sig-chain-prompt-pre">{{ run.promptPreview || "" }}</pre>
                </div>
                <template v-else>
                    <p class="wkb-inspector-note">
                        <strong>LLM status:</strong>
                        {{
                            llmDebug.attempted
                                ? "LLM prioritization was attempted."
                                : llmDebug.reason || "LLM prioritization was not run."
                        }}
                    </p>
                    <p v-if="llmDebug.model" class="wkb-inspector-note">
                        <strong>Model:</strong> {{ llmDebug.model }}
                    </p>
                    <div class="wkb-sig-chain-prompt-block">
                        <strong>Prompt</strong>
                        <pre class="wkb-sig-chain-prompt-pre">{{
                            llmDebug.prompt && Object.keys(llmDebug.prompt).length
                                ? JSON.stringify(llmDebug.prompt, null, 2)
                                : "(no LLM prompt was sent for this run)"
                        }}</pre>
                    </div>
                    <div class="wkb-sig-chain-prompt-block">
                        <strong>Response</strong>
                        <pre class="wkb-sig-chain-prompt-pre">{{
                            llmDebug.response_text || "(no response text returned)"
                        }}</pre>
                    </div>
                </template>
            </details>
        </div>

        <div v-if="run.status === 'error'" class="wkb-sig-chain-error" role="alert">
            {{ run.error || "Could not rank connections." }}
        </div>

        <div v-else-if="run.status === 'success' && !chains.length" class="wkb-sig-chain-empty">
            <h4>No connections ranked yet</h4>
            <p class="wkb-inspector-note">
                {{
                    payload.zero_state_reason ||
                    "No gene → mechanism → trait connection could be formed from the current graph."
                }}
            </p>
        </div>

        <div v-else-if="run.status === 'success' && chains.length" class="wkb-sig-chain-pathway-list">
            <WorkspaceSigChainPathwayCard
                v-for="(chain, index) in chains"
                :key="`${run.id}:${chain.chain_id || chain.title || 'pathway'}:${index}`"
                :chain="chain"
                :graph-nodes="run.graphNodes || []"
                :graph-edges="run.graphEdges || []"
                :anchor-items="anchorItems"
                :selected-node-objects="selectedNodes"
                :selected-node-ids="selectedNodeIds"
                :session-context="sessionContext"
                :api-client="apiClient"
                :llm-available="llmAvailable"
                :saved-pathway-state="pathwayStateForChain(chain)"
                @pathway-state-update="onPathwayStateUpdate"
            />
        </div>
    </section>
</template>

<script>
import WorkspaceSigChainPathwayCard from "./WorkspaceSigChainPathwayCard.vue";
import {
    formatPathwayRunHeadline,
    sigChainPathwayKey,
} from "./revealKgSigChainPrioritizeUtils.js";

export default {
    name: "WorkspaceSigChainRunCard",
    components: {
        WorkspaceSigChainPathwayCard,
    },
    props: {
        run: {
            type: Object,
            required: true,
        },
        anchorItems: {
            type: Array,
            default: () => [],
        },
        selectedNodeIds: {
            type: Array,
            default: () => [],
        },
        sessionContext: {
            type: String,
            default: "",
        },
        apiClient: {
            type: Object,
            default: null,
        },
        llmAvailable: {
            type: Boolean,
            default: false,
        },
        showRunContext: {
            type: Boolean,
            default: true,
        },
    },
    computed: {
        payload() {
            return this.run?.payload || {};
        },
        chains() {
            return this.payload.chains || [];
        },
        selectedNodes() {
            return this.run?.selectedNodes || [];
        },
        llmDebug() {
            return this.payload.llm_debug || {};
        },
        startedLabel() {
            return this.run?.startedAt
                ? new Date(this.run.startedAt).toLocaleString()
                : "";
        },
        runHeadline() {
            return formatPathwayRunHeadline(this.chains.length, this.run?.status);
        },
        showPromptAccordion() {
            return this.run?.status !== "draft";
        },
    },
    methods: {
        pathwayStateForChain(chain) {
            const key = sigChainPathwayKey(chain);
            return this.run?.pathwayCache?.[key] || null;
        },
        onPathwayStateUpdate(payload) {
            this.$emit("pathway-state-update", payload);
        },
    },
};
</script>

<style scoped>
.wkb-sig-chain-run {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.wkb-sig-chain-run-head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
}

.wkb-sig-chain-run-title {
    margin: 0;
    font-size: 14px;
    font-weight: 700;
    color: var(--cfde-blue, #2c5c97);
}

.wkb-sig-chain-run-meta {
    font-size: 12px;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-sig-chain-selected-set {
    padding: 10px 12px;
    border-radius: 8px;
    background: var(--cfde-bg, #f6f5f2);
}

.wkb-sig-chain-selected-set-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 8px;
}

.wkb-sig-chain-chip-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.wkb-sig-chain-chip {
    padding: 2px 8px;
    border-radius: 999px;
    background: #fff;
    border: 1px solid var(--cfde-border, #e6e1d6);
    font-size: 12px;
    color: var(--cfde-ink, #33363d);
}

.wkb-sig-chain-prompt {
    font-size: 12px;
}

.wkb-sig-chain-prompt-pre {
    margin: 8px 0 0;
    padding: 10px;
    border-radius: 6px;
    background: #fff;
    border: 1px solid var(--cfde-border, #e6e1d6);
    font-size: 11px;
    line-height: 1.45;
    white-space: pre-wrap;
    overflow: auto;
    max-height: 220px;
}

.wkb-sig-chain-pathway-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.wkb-sig-chain-error {
    margin: 0;
    padding: 10px 12px;
    border-radius: 8px;
    background: #fff0f0;
    color: #8b2e2e;
    font-size: 13px;
}

.wkb-sig-chain-empty h4 {
    margin: 0 0 6px;
    font-size: 13px;
    font-weight: 700;
}

.wkb-inspector-note {
    margin: 0;
    font-size: 12px;
    line-height: 1.45;
    color: var(--cfde-muted, #6b6b6b);
}
</style>
