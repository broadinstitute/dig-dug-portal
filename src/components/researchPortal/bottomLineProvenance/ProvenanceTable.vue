<template>
    <div class="provenance-table-wrap">
        <div class="provenance-table-heading">
            <div class="provenance-summary">
                {{ rows.length }} stages, {{ inputEdgeCount }} inputs, {{ outputEdgeCount }} outputs
            </div>
            <div class="table-controls">
                <div class="provenance-hint">Hover over inputs or outputs to trace their lineage.</div>
                <button class="collapse-all-button" type="button" @click="toggleAllRows">
                    {{ allRowsExpanded ? "Collapse all" : "Expand all" }}
                </button>
            </div>
        </div>

        <div v-if="rows.length" class="provenance-table-scroll">
            <table class="provenance-table">
                <colgroup>
                    <col class="sequence-column" />
                    <col class="stage-column" />
                    <col class="resource-column" />
                    <col class="resource-column" />
                </colgroup>
                <thead>
                    <tr>
                        <th scope="col" title="Stages in the same group have no recorded dependency on one another.">Sequence</th>
                        <th scope="col">Stage</th>
                        <th scope="col">Inputs</th>
                        <th scope="col">Outputs</th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="row in rows"
                        :key="row.id"
                        :class="{ 'sequence-start': isSequenceStart(row), expanded: isRowExpanded(row.id) }"
                        @click="toggleRow(row.id)"
                    >
                        <td class="sequence-cell">
                            <span class="sequence-pill">{{ row.sequence }}</span>
                        </td>
                        <td class="stage-cell">
                            <template v-if="isRowExpanded(row.id)">
                                <div class="type-pill stage-type" :class="stageColorClass(row.activityType)">
                                    {{ stageLabel(row.activityType) }}
                                </div>
                                <div>{{ row.name }}</div>
                                <div v-if="row.repoUrl" class="stage-source-box" @click.stop>
                                    <div class="copyable-url">
                                        <input
                                            :value="row.repoUrl"
                                            :aria-label="`Source URL for ${row.name}`"
                                            readonly
                                            @click.stop
                                            @focus="$event.target.select()"
                                        />
                                        <button
                                            class="copy-icon-button"
                                            type="button"
                                            :aria-label="`Copy source URL for ${row.name}`"
                                            title="Copy source URL"
                                            @click.stop="copyStageSource(row)"
                                        >
                                            <b-icon-check v-if="copiedStageId === row.id"></b-icon-check>
                                            <b-icon-clipboard v-else></b-icon-clipboard>
                                        </button>
                                    </div>
                                    <a class="visit-link" :href="row.repoUrl" target="_blank" rel="noopener noreferrer" @click.stop>Visit</a>
                                </div>
                            </template>
                            <div v-else class="compact-stage-cell" v-b-tooltip.hover :title="row.name">
                                <span class="type-pill stage-type" :class="stageColorClass(row.activityType)">
                                    {{ stageLabel(row.activityType) }}
                                </span>
                                <span class="compact-resource-name">{{ row.name }}</span>
                            </div>
                        </td>
                        <td :class="{ 'resource-cell': row.inputs.length }">
                            <ul v-if="row.inputs.length && isRowExpanded(row.id)" class="resource-list">
                                <li
                                    v-for="resource in row.inputs"
                                    :key="resource.id"
                                    :class="{ 'resource-highlight': highlightedResourceId === resource.id }"
                                    @mouseenter="highlightedResourceId = resource.id"
                                    @mouseleave="highlightedResourceId = ''"
                                >
                                    <div>
                                        <span class="type-pill resource-type" :class="resourceColorClass(resource.type)">
                                            {{ resource.type }}
                                        </span>
                                    </div>
                                    <div class="resource-name">{{ resource.name }}</div>
                                    <div v-if="resource.location" class="resource-link-box" @click.stop>
                                        <div class="copyable-url">
                                            <input
                                                :value="resource.location"
                                                :aria-label="`Location for ${resource.name}`"
                                                readonly
                                                @click.stop
                                                @focus="$event.target.select()"
                                            />
                                            <button
                                                class="copy-icon-button"
                                                type="button"
                                                :aria-label="`Copy location for ${resource.name}`"
                                                title="Copy location"
                                                @click.stop="copyResourceLocation(resource)"
                                            >
                                                <b-icon-check v-if="copiedResourceId === resource.id"></b-icon-check>
                                                <b-icon-clipboard v-else></b-icon-clipboard>
                                            </button>
                                        </div>
                                        <a
                                            v-if="isHttpUrl(resource.location)"
                                            class="visit-link"
                                            :href="resource.location"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            @click.stop
                                        >
                                            Open
                                        </a>
                                    </div>
                                </li>
                            </ul>
                            <ul v-else-if="row.inputs.length" class="compact-resource-list">
                                <li
                                    v-for="resource in row.inputs"
                                    :key="resource.id"
                                    :class="{ 'resource-highlight': highlightedResourceId === resource.id }"
                                    v-b-tooltip.hover
                                    :title="resource.name"
                                    @mouseenter="highlightedResourceId = resource.id"
                                    @mouseleave="highlightedResourceId = ''"
                                >
                                    <span class="type-pill resource-type" :class="resourceColorClass(resource.type)">
                                        {{ resource.type }}
                                    </span>
                                    <span class="compact-resource-name">{{ resource.name }}</span>
                                </li>
                            </ul>
                            <span v-else class="empty-value">No recorded inputs</span>
                        </td>
                        <td :class="{ 'resource-cell': row.outputs.length }">
                            <ul v-if="row.outputs.length && isRowExpanded(row.id)" class="resource-list">
                                <li
                                    v-for="resource in row.outputs"
                                    :key="resource.id"
                                    :class="{ 'resource-highlight': highlightedResourceId === resource.id }"
                                    @mouseenter="highlightedResourceId = resource.id"
                                    @mouseleave="highlightedResourceId = ''"
                                >
                                    <div>
                                        <span class="type-pill resource-type" :class="resourceColorClass(resource.type)">
                                            {{ resource.type }}
                                        </span>
                                    </div>
                                    <div class="resource-name">{{ resource.name }}</div>
                                    <div v-if="resource.location" class="resource-link-box" @click.stop>
                                        <div class="copyable-url">
                                            <input
                                                :value="resource.location"
                                                :aria-label="`Location for ${resource.name}`"
                                                readonly
                                                @click.stop
                                                @focus="$event.target.select()"
                                            />
                                            <button
                                                class="copy-icon-button"
                                                type="button"
                                                :aria-label="`Copy location for ${resource.name}`"
                                                title="Copy location"
                                                @click.stop="copyResourceLocation(resource)"
                                            >
                                                <b-icon-check v-if="copiedResourceId === resource.id"></b-icon-check>
                                                <b-icon-clipboard v-else></b-icon-clipboard>
                                            </button>
                                        </div>
                                        <a
                                            v-if="isHttpUrl(resource.location)"
                                            class="visit-link"
                                            :href="resource.location"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            @click.stop
                                        >
                                            Open
                                        </a>
                                    </div>
                                </li>
                            </ul>
                            <ul v-else-if="row.outputs.length" class="compact-resource-list">
                                <li
                                    v-for="resource in row.outputs"
                                    :key="resource.id"
                                    :class="{ 'resource-highlight': highlightedResourceId === resource.id }"
                                    v-b-tooltip.hover
                                    :title="resource.name"
                                    @mouseenter="highlightedResourceId = resource.id"
                                    @mouseleave="highlightedResourceId = ''"
                                >
                                    <span class="type-pill resource-type" :class="resourceColorClass(resource.type)">
                                        {{ resource.type }}
                                    </span>
                                    <span class="compact-resource-name">{{ resource.name }}</span>
                                </li>
                            </ul>
                            <span v-else class="empty-value">No recorded outputs</span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div v-else class="empty-value">No activities are available in this provenance record.</div>
    </div>
</template>

<script>
import { BIconCheck, BIconClipboard } from "bootstrap-vue";

const RESOURCE_GROUPS = {
    c2m2_files: "C2M2 file",
    datasets: "Dataset",
    drs_objects: "DRS object",
};

export default {
    name: "ProvenanceTable",
    components: {
        BIconCheck,
        BIconClipboard,
    },
    props: {
        provenance: {
            type: Object,
            required: true,
        },
    },
    data() {
        return {
            copiedResourceId: "",
            copiedStageId: "",
            highlightedResourceId: "",
            expandedRowIds: [],
        };
    },
    computed: {
        resourceById() {
            const resources = new Map();

            Object.keys(RESOURCE_GROUPS).forEach((group) => {
                (this.provenance[group] || []).forEach((resource) => {
                    resources.set(resource.id, {
                        id: resource.id,
                        name: resource.name || resource.filename || resource.id,
                        type: RESOURCE_GROUPS[group],
                        location: resource.self_uri || resource.local_id || resource.location || resource.url || "",
                    });
                });
            });

            (this.provenance.has_drs_object_edges || []).forEach((edge) => {
                const dataset = resources.get(edge.subject);
                const drsObject = resources.get(edge.object);

                if (dataset && drsObject && drsObject.location) {
                    dataset.location = drsObject.location;
                }
            });

            return resources;
        },
        rows() {
            const activities = this.provenance.activities || [];
            const inputsByActivity = this.edgesBySubject(this.provenance.used_edges || []);
            const outputsByActivity = this.edgesByObject(this.provenance.was_generated_by_edges || []);
            const producerByResource = new Map();

            (this.provenance.was_generated_by_edges || []).forEach((edge) => {
                producerByResource.set(edge.subject, edge.object);
            });

            const activityById = new Map(activities.map((activity) => [activity.id, activity]));
            const dependencies = new Map(activities.map((activity) => [activity.id, new Set()]));

            (this.provenance.used_edges || []).forEach((edge) => {
                const producer = producerByResource.get(edge.object);
                if (producer && producer !== edge.subject && activityById.has(edge.subject)) {
                    dependencies.get(edge.subject).add(producer);
                }
            });

            return this.topologicalActivities(activities, dependencies).map(({ activity, sequence }) => {
                return {
                    id: activity.id,
                    sequence,
                    activityType: activity.activity_type || "Activity",
                    name: activity.name || activity.description || activity.id,
                    repoUrl: activity.repo_url,
                    inputs: this.resourcesForIds(inputsByActivity.get(activity.id)),
                    outputs: this.resourcesForIds(outputsByActivity.get(activity.id)),
                };
            });
        },
        inputEdgeCount() {
            return (this.provenance.used_edges || []).length;
        },
        outputEdgeCount() {
            return (this.provenance.was_generated_by_edges || []).length;
        },
        stageColorByType() {
            return this.colorMap(this.rows.map((row) => row.activityType), "stage-color", 12);
        },
        resourceColorByType() {
            return this.colorMap(Array.from(this.resourceById.values()).map((resource) => resource.type), "resource-color", 6);
        },
        allRowsExpanded() {
            return this.rows.length > 0 && this.rows.every((row) => this.expandedRowIds.includes(row.id));
        },
    },
    watch: {
        provenance() {
            this.expandedRowIds = [];
        },
    },
    methods: {
        isRowExpanded(id) {
            return this.expandedRowIds.includes(id);
        },
        toggleRow(id) {
            if (this.isRowExpanded(id)) {
                this.expandedRowIds = this.expandedRowIds.filter((rowId) => rowId !== id);
            } else {
                this.expandedRowIds = [...this.expandedRowIds, id];
            }
        },
        toggleAllRows() {
            this.expandedRowIds = this.allRowsExpanded ? [] : this.rows.map((row) => row.id);
        },
        edgesBySubject(edges) {
            const result = new Map();

            edges.forEach((edge) => {
                if (!result.has(edge.subject)) {
                    result.set(edge.subject, []);
                }
                result.get(edge.subject).push(edge.object);
            });

            return result;
        },
        edgesByObject(edges) {
            const result = new Map();

            edges.forEach((edge) => {
                if (!result.has(edge.object)) {
                    result.set(edge.object, []);
                }
                result.get(edge.object).push(edge.subject);
            });

            return result;
        },
        resourcesForIds(ids) {
            return (ids || []).map((id) => {
                return this.resourceById.get(id) || { id, name: id, type: "Resource" };
            });
        },
        topologicalActivities(activities, dependencies) {
            const remaining = new Map(activities.map((activity) => [activity.id, activity]));
            const ordered = [];
            let sequence = 1;

            while (remaining.size) {
                const ready = Array.from(remaining.values()).filter((activity) => {
                    return Array.from(dependencies.get(activity.id)).every((id) => !remaining.has(id));
                }).sort((first, second) => first.name.localeCompare(second.name));

                if (!ready.length) {
                    ordered.push(...Array.from(remaining.values()).sort((first, second) => first.name.localeCompare(second.name)).map((activity) => {
                        return { activity, sequence };
                    }));
                    break;
                }

                ready.forEach((activity) => {
                    ordered.push({ activity, sequence });
                    remaining.delete(activity.id);
                });
                sequence += 1;
            }

            return ordered;
        },
        stageLabel(value) {
            return value.replace(/Stage$/, "").replace(/([a-z])([A-Z])/g, "$1 $2");
        },
        isSequenceStart(row) {
            const index = this.rows.findIndex((item) => item.id === row.id);
            return index > 0 && this.rows[index - 1].sequence !== row.sequence;
        },
        colorMap(labels, prefix, colorCount) {
            const colors = {};
            Array.from(new Set(labels)).sort().forEach((label, index) => {
                colors[label] = `${prefix}-${index % colorCount}`;
            });

            return colors;
        },
        stageColorClass(value) {
            return this.stageColorByType[value] || "stage-color-0";
        },
        resourceColorClass(value) {
            return this.resourceColorByType[value] || "resource-color-0";
        },
        isHttpUrl(value) {
            return /^https?:\/\//i.test(value);
        },
        copyResourceLocation(resource) {
            if (!navigator.clipboard || !navigator.clipboard.writeText) {
                return;
            }

            navigator.clipboard.writeText(resource.location).then(() => {
                this.copiedResourceId = resource.id;
            }).catch(() => {
                this.copiedResourceId = "";
            });
        },
        copyStageSource(row) {
            if (!navigator.clipboard || !navigator.clipboard.writeText) {
                return;
            }

            navigator.clipboard.writeText(row.repoUrl).then(() => {
                this.copiedStageId = row.id;
            }).catch(() => {
                this.copiedStageId = "";
            });
        },
    },
};
</script>

<style scoped>
.provenance-table-heading {
    display: flex;
    gap: 16px;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 10px;
}

.provenance-summary,
.provenance-hint {
    color: #555;
    font-size: 13px;
}

.table-controls {
    display: flex;
    gap: 14px;
    align-items: center;
}

.collapse-all-button {
    padding: 4px 8px;
    border: 1px solid #8ba7c8;
    border-radius: 3px;
    background: #f3f7fb;
    color: #20517f;
    font-size: 12px;
    font-weight: 700;
    white-space: nowrap;
}

.collapse-all-button:hover,
.collapse-all-button:focus {
    border-color: #426f9f;
    background: #e4eef8;
}

.provenance-table-scroll {
    overflow: auto;
}

.provenance-table {
    width: 100%;
    min-width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    font-size: 13px;
}

.provenance-table th,
.provenance-table td {
    padding: 12px;
    border-bottom: 1px solid #e5e5e5;
    text-align: left;
    vertical-align: middle;
}

.provenance-table th {
    position: sticky;
    top: 0;
    z-index: 1;
    background: #606a75;
    color: #fff;
    font-size: 12px;
    text-transform: uppercase;
}

.provenance-table tr:last-child td {
    border-bottom: 0;
}

.provenance-table tbody tr {
    cursor: pointer;
}

.provenance-table tbody tr:hover > td {
    background: #fbfcfd;
}

.provenance-table tr.sequence-start td {
    border-top: 2px solid #c2c9cf;
}

.sequence-cell {
    width: 74px;
    text-align: center !important;
}

.provenance-table td.sequence-cell {
    padding: 0;
}

.sequence-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: 999px;
    background: #eef1f4;
    color: #39424c;
    font-weight: 700;
}

.stage-cell {
    min-width: 310px;
    font-weight: 600;
}

.provenance-table .sequence-column {
    width: 88px;
}

.provenance-table .stage-column {
    width: 30%;
}

.provenance-table .stage-cell {
    min-width: 0;
}

.provenance-table tbody tr:not(.expanded) .stage-cell {
    padding: 0;
}

.stage-source-box,
.resource-link-box {
    display: flex;
    width: 100%;
    gap: 6px;
    align-items: center;
    margin-top: 10px;
    font-weight: 400;
}

.stage-source-box input,
.resource-link-box input {
    min-width: 0;
    flex: 1 1 auto;
    width: 100%;
    padding: 5px 32px 5px 7px;
    border: 1px solid #cbd2d9;
    border-radius: 3px;
    background: #fafafa;
    font-family: Menlo, Consolas, monospace;
    font-size: 11px;
}

.copyable-url {
    position: relative;
    min-width: 0;
    flex: 1 1 auto;
}

.copy-icon-button {
    position: absolute;
    top: 50%;
    right: 4px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    border: 0;
    border-radius: 3px;
    background: transparent;
    color: #20517f;
    transform: translateY(-50%);
    cursor: pointer;
}

.copy-icon-button:hover,
.copy-icon-button:focus {
    background: #e4f1ff;
    color: #123f66;
}

.visit-link {
    flex: 0 0 auto;
    color: #20517f;
    font-weight: 400;
}

.type-pill {
    display: inline-flex;
    align-items: center;
    margin-bottom: 4px;
    padding: 1px 5px;
    border: 1px solid currentColor;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
}

.stage-color-0 { background: #f5e9f7; color: #7e3f8e; }
.stage-color-1 { background: #fce8ec; color: #a03f59; }
.stage-color-2 { background: #fff0e1; color: #995b14; }
.stage-color-3 { background: #faf3d9; color: #806914; }
.stage-color-4 { background: #e8f3e4; color: #46752b; }
.stage-color-5 { background: #e6f4ed; color: #1d7452; }
.stage-color-6 { background: #e3f4f5; color: #16757b; }
.stage-color-7 { background: #e6ebfa; color: #3f57a0; }
.stage-color-8 { background: #f0e9fc; color: #694d9c; }
.stage-color-9 { background: #f5ece6; color: #87573a; }
.stage-color-10 { background: #f3e9ef; color: #934770; }
.stage-color-11 { background: #eaf0e6; color: #5c7442; }

.resource-color-0 { background: #e4f1ff; color: #135b9c; }
.resource-color-1 { background: #e4f7f1; color: #0d7060; }
.resource-color-2 { background: #fff4d6; color: #8d6300; }
.resource-color-3 { background: #eef0f3; color: #4c5967; }
.resource-color-4 { background: #f9e9e9; color: #994848; }
.resource-color-5 { background: #e8f3e4; color: #49772d; }

.resource-list {
    margin: 0;
    padding: 0;
    list-style: none;
}

.compact-resource-list {
    margin: 0;
    padding: 0;
    list-style: none;
}

.compact-resource-list li {
    display: flex;
    gap: 7px;
    align-items: center;
    min-width: 0;
    padding: 7px 12px;
}

.compact-stage-cell {
    display: flex;
    gap: 7px;
    align-items: center;
    min-width: 0;
    padding: 7px 12px;
}

.compact-resource-list li + li {
    border-top: 1px solid #e5e5e5;
}

.compact-resource-list .type-pill {
    flex: 0 0 auto;
    margin-bottom: 0;
}

.compact-stage-cell .type-pill {
    flex: 0 0 auto;
    margin-bottom: 0;
}

.compact-resource-name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.resource-list li + li {
    padding-top: 12px;
    border-top: 1px solid #e5e5e5;
}

.resource-list li {
    padding: 12px;
}

.resource-name {
    margin-bottom: 6px;
}

.provenance-table td.resource-cell {
    padding: 0;
}

.resource-list li.resource-highlight {
    background: #e4f1ff;
}

.compact-resource-list li.resource-highlight {
    background: #e4f1ff;
}

.empty-value {
    color: #666;
    font-style: italic;
}

@media (max-width: 767px) {
    .provenance-table-heading,
    .table-controls {
        align-items: flex-start;
        flex-direction: column;
    }

    .table-controls {
        gap: 8px;
    }
}
</style>
