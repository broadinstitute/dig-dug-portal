<template>
    <div
        v-if="reminder"
        class="wkb-graph-reminder"
        role="status"
        :aria-label="reminder.message"
    >
        <button
            type="button"
            class="wkb-graph-reminder-close"
            aria-label="Close"
            @click="$emit('dismiss')"
        >
            &times;
        </button>
        <p class="wkb-graph-reminder-message">{{ reminder.message }}</p>
        <div v-if="actionButtons.length" class="wkb-graph-reminder-actions">
            <button
                v-for="action in actionButtons"
                :key="action.id"
                type="button"
                class="wkb-graph-reminder-btn"
                :class="{ 'is-primary': action.primary }"
                @click="$emit('action', action.id)"
            >
                {{ action.label }}
            </button>
        </div>
    </div>
</template>

<script>
import { REMINDER_ACTION } from "./revealKgReminders.js";

export default {
    name: "WorkspaceGraphReminder",
    props: {
        reminder: {
            type: Object,
            default: null,
        },
    },
    computed: {
        actionButtons() {
            return (this.reminder?.actions || []).filter(
                (entry) => entry.id !== REMINDER_ACTION.DISMISS
            );
        },
    },
};
</script>

<style scoped>
.wkb-graph-reminder {
    position: absolute;
    top: 10px;
    left: 16px;
    z-index: 5;
    max-width: min(440px, calc(100% - 32px));
    padding: 12px 34px 12px 14px;
    border: 1px solid #ead9c8;
    border-radius: 10px;
    background: rgba(255, 253, 249, 0.96);
    box-shadow: 0 8px 24px rgba(20, 22, 30, 0.1);
    pointer-events: auto;
}

.wkb-graph-reminder-close {
    position: absolute;
    top: 8px;
    right: 10px;
    margin: 0;
    padding: 0;
    border: none;
    background: transparent;
    font-size: 1.35rem;
    line-height: 1;
    color: var(--cfde-orange, #e07b39);
    cursor: pointer;
}

.wkb-graph-reminder-close:hover {
    color: var(--cfde-orange-dark, #c2662b);
}

.wkb-graph-reminder-message {
    margin: 0 0 10px;
    font-size: 13px;
    line-height: 1.45;
    color: var(--cfde-ink, #33363d);
}

.wkb-graph-reminder-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.wkb-graph-reminder-btn {
    margin: 0;
    padding: 6px 12px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 999px;
    background: #ffffff;
    color: var(--cfde-blue, #2c5c97);
    font-size: 12px;
    font-weight: 600;
    line-height: 1.2;
    cursor: pointer;
}

.wkb-graph-reminder-btn:hover {
    background: #f3f7fb;
}

.wkb-graph-reminder-btn.is-primary {
    border-color: var(--cfde-orange, #e07b39);
    background: var(--cfde-orange, #e07b39);
    color: #ffffff;
}

.wkb-graph-reminder-btn.is-primary:hover {
    background: var(--cfde-orange-dark, #c2662b);
    border-color: var(--cfde-orange-dark, #c2662b);
}
</style>
