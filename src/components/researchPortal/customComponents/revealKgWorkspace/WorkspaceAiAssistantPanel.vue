<template>
    <aside
        v-if="open"
        class="wkb-assistant-popup"
        role="dialog"
        aria-modal="false"
        aria-labelledby="wkb-assistant-title"
        @click.stop
        @mousedown.stop
    >
        <header class="wkb-assistant-head">
            <div class="wkb-assistant-head-row">
                <h2 id="wkb-assistant-title">Canvas assistant</h2>
                <button
                    type="button"
                    class="wkb-assistant-close"
                    aria-label="Close"
                    @click="$emit('close')"
                >
                    &times;
                </button>
            </div>
            <p class="wkb-assistant-intro">
                Describe graph changes in plain language. The assistant will turn your
                request into a short step-by-step plan using canvas actions—such as
                visibility filters, selected nodes, expansion, and adding nodes—then run
                those steps for you.
            </p>
        </header>

        <div class="wkb-assistant-body">
            <div v-if="!messages.length" class="wkb-assistant-welcome">
                <p class="wkb-assistant-welcome-lead">You can ask things like:</p>
                <ul class="wkb-assistant-examples">
                    <li>
                        Select genes on the graph that are associated with insulin
                        resistance.
                    </li>
                    <li>
                        Hide mechanisms that do not match my intent, then expand from
                        selected nodes.
                    </li>
                    <li>
                        Mark the top matching traits as selected nodes after filtering.
                    </li>
                </ul>
                <p class="wkb-assistant-welcome-note" role="note">
                    Planning and execution are coming next. For now, type a request below
                    to try the interface.
                </p>
            </div>

            <div v-else class="wkb-assistant-thread" role="log" aria-live="polite">
                <div
                    v-for="message in messages"
                    :key="message.id"
                    :class="[
                        'wkb-assistant-message',
                        message.role === 'user'
                            ? 'wkb-assistant-message--user'
                            : 'wkb-assistant-message--assistant',
                    ]"
                >
                    <span class="wkb-assistant-message-label">
                        {{ message.role === "user" ? "You" : "Assistant" }}
                    </span>
                    <p>{{ message.text }}</p>
                </div>
            </div>
        </div>

        <footer class="wkb-assistant-footer">
            <label class="wkb-assistant-input-label" for="wkb-assistant-input">
                Your request
            </label>
            <textarea
                id="wkb-assistant-input"
                v-model="draft"
                class="wkb-assistant-input"
                rows="3"
                placeholder="e.g. Select genes associated with insulin resistance"
                @keydown.enter.exact.prevent="onSend"
            />
            <button
                type="button"
                class="wkb-assistant-send"
                :disabled="!draft.trim()"
                @click="onSend"
            >
                Execute
            </button>
        </footer>
    </aside>
</template>

<script>
let messageCounter = 0;

export default {
    name: "WorkspaceAiAssistantPanel",
    props: {
        open: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            draft: "",
            messages: [],
        };
    },
    watch: {
        open(isOpen) {
            if (!isOpen) {
                return;
            }
            this.$nextTick(() => {
                document.getElementById("wkb-assistant-input")?.focus();
            });
        },
    },
    methods: {
        onSend() {
            const text = String(this.draft || "").trim();
            if (!text) {
                return;
            }
            messageCounter += 1;
            this.messages = [
                ...this.messages,
                { id: `user-${messageCounter}`, role: "user", text },
                {
                    id: `assistant-${messageCounter}`,
                    role: "assistant",
                    text:
                        "Canvas assistant planning is not wired yet. Soon this request will be parsed into canvas actions—filters, selected nodes, expansion, and more—and you will review the plan before it runs.",
                },
            ];
            this.draft = "";
            this.$emit("message", text);
        },
    },
};
</script>

<style scoped>
.wkb-assistant-popup {
    position: absolute;
    top: 12px;
    right: 12px;
    bottom: 12px;
    z-index: 25;
    display: flex;
    flex-direction: column;
    width: min(380px, calc(100% - 24px));
    max-width: 420px;
    overflow: hidden;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 12px;
    background: #ffffff;
    box-shadow: 0 8px 32px rgba(20, 22, 30, 0.16);
    pointer-events: auto;
}

.wkb-assistant-head {
    flex-shrink: 0;
    padding: 16px 18px 12px;
}

.wkb-assistant-head-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
}

.wkb-assistant-head-row h2 {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--cfde-ink, #33363d);
    line-height: 1.35;
}

.wkb-assistant-close {
    border: none;
    background: transparent;
    color: var(--cfde-orange, #e07b39);
    font-size: 24px;
    line-height: 1;
    cursor: pointer;
    padding: 0;
}

.wkb-assistant-intro {
    margin: 8px 0 0;
    font-size: 13px;
    line-height: 1.5;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-assistant-body {
    flex: 1;
    overflow-y: auto;
    padding: 0 18px 12px;
}

.wkb-assistant-welcome-lead {
    margin: 0 0 8px;
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
}

.wkb-assistant-examples {
    margin: 0 0 12px;
    padding-left: 1.2rem;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.wkb-assistant-examples li {
    font-size: 13px;
    line-height: 1.45;
    color: var(--cfde-ink, #33363d);
}

.wkb-assistant-welcome-note {
    margin: 0;
    font-size: 13px;
    line-height: 1.45;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-assistant-thread {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.wkb-assistant-message {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.wkb-assistant-message-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-blue, #2c5c97);
}

.wkb-assistant-message--user .wkb-assistant-message-label {
    color: var(--cfde-ink, #33363d);
}

.wkb-assistant-message p {
    margin: 0;
    font-size: 13px;
    line-height: 1.5;
    color: var(--cfde-ink, #33363d);
}

.wkb-assistant-footer {
    flex-shrink: 0;
    padding: 12px 18px 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.wkb-assistant-input-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
}

.wkb-assistant-input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 8px;
    font-size: 13px;
    line-height: 1.45;
    resize: vertical;
    min-height: 72px;
}

.wkb-assistant-send {
    align-self: flex-end;
    border: none;
    background: var(--cfde-orange, #e07b39);
    color: #ffffff;
    font-size: 13px;
    font-weight: 700;
    padding: 8px 18px;
    border-radius: 8px;
    cursor: pointer;
}

.wkb-assistant-send:hover:not(:disabled) {
    background: var(--cfde-orange-dark, #c2662b);
}

.wkb-assistant-send:disabled {
    opacity: 0.45;
    cursor: not-allowed;
}
</style>
