<template>
    <div class="reveal-ops-menu-bar">
        <div class="reveal-ops-menu-group">
            <b-dropdown
                text="Search mode"
                size="sm"
                variant="link"
                class="reveal-ops-menu"
                toggle-class="reveal-ops-menu-toggle"
                menu-class="reveal-ops-menu-list"
                :disabled="busy"
            >
                <b-dropdown-item
                    :link-class="modeItemClass('strict')"
                    @click="$emit('set-mode', 'strict')"
                >
                    Evidence-grounded
                </b-dropdown-item>
                <b-dropdown-item
                    :link-class="modeItemClass('relaxed')"
                    @click="$emit('set-mode', 'relaxed')"
                >
                    Exploratory
                </b-dropdown-item>
            </b-dropdown>

            <b-dropdown
                text="Import / Export"
                size="sm"
                variant="link"
                class="reveal-ops-menu"
                toggle-class="reveal-ops-menu-toggle"
                menu-class="reveal-ops-menu-list"
                :disabled="busy"
            >
                <b-dropdown-item link-class="reveal-ops-menu-item" @click="triggerImportPicker">
                    Import workflow
                </b-dropdown-item>
                <b-dropdown-item
                    link-class="reveal-ops-menu-item"
                    :disabled="!canExportWorkflow"
                    @click="$emit('export-workflow')"
                >
                    Export workflow
                </b-dropdown-item>
            </b-dropdown>

            <b-dropdown
                v-if="queryBuilderVisible"
                text="Query builder"
                size="sm"
                variant="link"
                class="reveal-ops-menu"
                toggle-class="reveal-ops-menu-toggle"
                menu-class="reveal-ops-menu-list"
                :disabled="busy"
            >
                <b-dropdown-item link-class="reveal-ops-menu-item" @click="$emit('open-query-builder')">
                    Guided query builder
                </b-dropdown-item>
                <b-dropdown-item link-class="reveal-ops-menu-item" @click="$emit('open-query-guidelines')">
                    How to build your query
                </b-dropdown-item>
            </b-dropdown>

            <b-dropdown
                text="Help"
                size="sm"
                variant="link"
                class="reveal-ops-menu"
                toggle-class="reveal-ops-menu-toggle"
                menu-class="reveal-ops-menu-list"
            >
                <b-dropdown-item link-class="reveal-ops-menu-item" disabled>
                    More help coming soon
                </b-dropdown-item>
            </b-dropdown>
        </div>
        <input
            ref="workflowImportFileInput"
            type="file"
            accept="application/json,.json"
            class="d-none"
            @change="onImportFileChange"
        />
    </div>
</template>

<script>
export default {
    name: "WorkflowOpsMenu",
    props: {
        hypothesisGenerationMode: { type: String, default: "strict" },
        canExportWorkflow: { type: Boolean, default: false },
        busy: { type: Boolean, default: false },
        queryBuilderVisible: { type: Boolean, default: true },
    },
    methods: {
        modeItemClass(mode) {
            const selected = this.hypothesisGenerationMode === mode;
            return selected
                ? "reveal-ops-menu-item reveal-ops-menu-item-selected"
                : "reveal-ops-menu-item";
        },
        triggerImportPicker() {
            const input = this.$refs.workflowImportFileInput;
            if (!input) return;
            input.value = "";
            input.click();
        },
        onImportFileChange(event) {
            const file = event?.target?.files?.[0];
            if (file) {
                this.$emit("import-workflow-file", file);
            }
            if (event?.target) {
                event.target.value = "";
            }
        },
    },
};
</script>

<style src="./mqSharedStyles.css"></style>
