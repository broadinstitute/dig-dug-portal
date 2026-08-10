<template>
    <div class="reveal-route-direction-card">
        <div class="d-flex justify-content-between align-items-start mb-1" style="gap: 8px;">
            <div class="mb-0">
                <strong>{{ route.category }}</strong>
            </div>
            <button
                v-if="showSelect && !selected"
                type="button"
                class="btn btn-sm btn-outline-primary flex-shrink-0"
                :disabled="!selectable"
                @click="$emit('select', route.route_id)"
            >
                Select
            </button>
            <button
                v-else-if="showSelect && selected"
                type="button"
                class="btn btn-sm btn-primary flex-shrink-0"
                disabled
            >
                Selected
            </button>
        </div>
        <div v-if="directionSummary" class="small mb-1">{{ directionSummary }}</div>
        <div
            v-if="embeddingText"
            class="small text-muted mb-2"
        >
            <strong>Embedding text:</strong> {{ embeddingText }}
        </div>
        <div
            v-if="showTermsEditor && editRow"
            class="route-terms-edit-panel"
        >
            <b-table
                :items="routeRowEditFields"
                :fields="[
                    { key: 'type', label: 'Type', thStyle: { width: '34%' } },
                    { key: 'term', label: 'Term' }
                ]"
                small
                striped
                responsive="sm"
                head-variant="light"
                class="mb-0"
            >
                <template #cell(type)="row">
                    <span>{{ row.item.type }}</span>
                </template>
                <template #cell(term)="row">
                    <input
                        type="text"
                        class="form-control form-control-sm"
                        :value="editRow[row.item.key]"
                        placeholder="Comma-separated terms"
                        :disabled="!termsEditable"
                        @input="$emit('update-route-edit-field', {
                            route,
                            fieldKey: row.item.key,
                            value: $event.target.value,
                        })"
                    />
                </template>
            </b-table>
        </div>
    </div>
</template>

<script>
import { ROUTE_ROW_EDIT_FIELDS } from "./revealMqRouteEdit.js";

export default {
    name: "WorkflowRouteDirectionCard",
    props: {
        route: { type: Object, required: true },
        selected: { type: Boolean, default: false },
        showSelect: { type: Boolean, default: false },
        selectable: { type: Boolean, default: true },
        showTermsEditor: { type: Boolean, default: false },
        editRow: { type: Object, default: null },
        termsEditable: { type: Boolean, default: false },
    },
    computed: {
        routeRowEditFields() {
            return ROUTE_ROW_EDIT_FIELDS;
        },
        directionSummary() {
            const rationale = this.route && this.route.rationale != null ? String(this.route.rationale).trim() : "";
            if (rationale) return rationale;
            return this.route && this.route.biological_query_variation
                ? String(this.route.biological_query_variation).trim()
                : "";
        },
        embeddingText() {
            return this.route && this.route.sanitized_query
                ? String(this.route.sanitized_query).trim()
                : "";
        },
    },
};
</script>

<style src="./mqSharedStyles.css"></style>
