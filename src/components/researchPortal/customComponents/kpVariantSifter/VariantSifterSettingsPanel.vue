<template>
    <div
        v-if="open"
        class="vks-settings-backdrop"
        role="presentation"
        @click="onBackdropClick"
    >
        <div
            class="vks-settings-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="vks-settings-title"
            @click.stop
        >
            <header class="vks-settings-head">
                <h2 id="vks-settings-title">Settings</h2>
                <button
                    type="button"
                    class="vks-settings-close"
                    aria-label="Close settings"
                    @click="$emit('close')"
                >
                    &times;
                </button>
            </header>

            <div class="vks-ui-tabs" role="tablist" aria-label="Settings panels">
                <button
                    v-for="tab in tabs"
                    :id="`vks-settings-tab-${tab.id}`"
                    :key="tab.id"
                    type="button"
                    role="tab"
                    class="vks-ui-tab"
                    :class="{ 'is-active': activeTab === tab.id }"
                    :aria-selected="activeTab === tab.id ? 'true' : 'false'"
                    :aria-controls="`vks-settings-panel-${tab.id}`"
                    @click="activeTab = tab.id"
                >
                    {{ tab.label }}
                </button>
            </div>

            <div class="vks-settings-body">
                <div
                    v-show="activeTab === 'settings'"
                    id="vks-settings-panel-settings"
                    class="vks-settings-panel"
                    role="tabpanel"
                    aria-labelledby="vks-settings-tab-settings"
                >
                    <section class="vks-settings-section">
                        <h3 class="vks-ui-section-title">Show / Hide sections</h3>
                        <p class="vks-ui-hint">
                            Uncheck a section to hide it on the workspace and from the
                            section drawer tabs. Associations and nested tracks stay in
                            sync with these checkboxes.
                        </p>
                        <ul class="vks-settings-section-list">
                            <li
                                v-for="section in sections"
                                :key="section.id"
                                class="vks-settings-section-item"
                            >
                                <label>
                                    <input
                                        type="checkbox"
                                        :checked="isVisible(section.id)"
                                        @change="onToggleSection(section.id, $event)"
                                    />
                                    <span class="vks-settings-section-label">
                                        {{ section.label }}
                                    </span>
                                </label>
                                <span
                                    v-if="section.description"
                                    class="vks-settings-section-desc"
                                >
                                    {{ section.description }}
                                </span>
                            </li>
                        </ul>
                    </section>
                </div>

                <div
                    v-show="activeTab === 'apis'"
                    id="vks-settings-panel-apis"
                    class="vks-settings-panel"
                    role="tabpanel"
                    aria-labelledby="vks-settings-tab-apis"
                >
                    <p class="vks-ui-hint">
                        Endpoints used to load Variant Sifter data.
                        <template v-if="bioIndexHost">
                            BioIndex host:
                            <code class="vks-settings-host">{{ bioIndexHost }}</code>
                        </template>
                    </p>
                    <ul class="vks-settings-api-list">
                        <li
                            v-for="api in apis"
                            :key="api.id"
                            class="vks-settings-api-item"
                        >
                            <div class="vks-settings-api-head">
                                <span class="vks-settings-api-name">{{ api.name }}</span>
                                <span class="vks-settings-api-service">{{ api.service }}</span>
                            </div>
                            <p class="vks-settings-api-path">{{ api.url || api.path }}</p>
                            <p class="vks-settings-api-query">
                                <span class="vks-settings-api-k">Query</span>
                                {{ api.query }}
                            </p>
                            <p class="vks-settings-api-purpose">{{ api.purpose }}</p>
                        </li>
                    </ul>
                </div>

                <div
                    v-show="activeTab === 'information'"
                    id="vks-settings-panel-information"
                    class="vks-settings-panel"
                    role="tabpanel"
                    aria-labelledby="vks-settings-tab-information"
                >
                    <dl class="vks-settings-info-list">
                        <div
                            v-for="row in informationRows"
                            :key="row.label"
                            class="vks-settings-info-row"
                        >
                            <dt>{{ row.label }}</dt>
                            <dd>
                                <span class="vks-settings-info-value">{{ row.value }}</span>
                                <span
                                    v-if="row.detail"
                                    class="vks-settings-info-detail"
                                >
                                    {{ row.detail }}
                                </span>
                            </dd>
                        </div>
                    </dl>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import {
    buildToolApis,
    buildToolInformation,
    VKS_SETTINGS_TABS,
} from "./variantSifterToolSettings.js";
import { VARIANT_SIFTER_SECTIONS } from "./variantSifterSections.js";

export default {
    name: "VariantSifterSettingsPanel",
    props: {
        open: {
            type: Boolean,
            default: false,
        },
        sections: {
            type: Array,
            default: () => VARIANT_SIFTER_SECTIONS,
        },
        visibleSectionIds: {
            type: Array,
            default: () => [],
        },
        searchSession: {
            type: Object,
            default: null,
        },
        bioIndexHost: {
            type: String,
            default: "",
        },
    },
    data() {
        return {
            tabs: VKS_SETTINGS_TABS,
            activeTab: "settings",
        };
    },
    computed: {
        apis() {
            return buildToolApis(this.bioIndexHost);
        },
        informationRows() {
            return buildToolInformation({ searchSession: this.searchSession });
        },
    },
    watch: {
        open(isOpen) {
            if (isOpen) {
                this.activeTab = "settings";
            }
        },
    },
    mounted() {
        document.addEventListener("keydown", this.onKeyDown);
    },
    beforeDestroy() {
        document.removeEventListener("keydown", this.onKeyDown);
    },
    methods: {
        isVisible(sectionId) {
            return this.visibleSectionIds.includes(sectionId);
        },
        onToggleSection(sectionId, event) {
            const checked = Boolean(event?.target?.checked);
            const next = new Set(this.visibleSectionIds);
            if (checked) {
                next.add(sectionId);
            } else {
                next.delete(sectionId);
            }
            // Keep at least one section visible so the workspace is never empty.
            if (!next.size) {
                event.target.checked = true;
                return;
            }
            this.$emit("update:visibleSectionIds", [...next]);
        },
        onBackdropClick() {
            this.$emit("close");
        },
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
.vks-settings-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1300;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: rgba(24, 26, 32, 0.45);
}

.vks-settings-modal {
    width: min(640px, 100%);
    max-height: min(84vh, 760px);
    display: flex;
    flex-direction: column;
    border-radius: 12px;
    background: #ffffff;
    box-shadow: 0 16px 48px rgba(20, 22, 30, 0.18);
    overflow: hidden;
}

.vks-settings-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 18px 22px 0;
}

.vks-settings-head h2 {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--cfde-ink, #33363d);
}

.vks-settings-close {
    appearance: none;
    border: none;
    background: transparent;
    width: 32px;
    height: 32px;
    border-radius: 6px;
    font-size: 1.5rem;
    line-height: 1;
    color: #69727c;
    cursor: pointer;
}

.vks-settings-close:hover {
    background: #f3f1ec;
    color: #1b2430;
}

.vks-settings-modal > .vks-ui-tabs {
    margin: 12px 22px 0;
}

.vks-settings-body {
    flex: 1;
    overflow: auto;
    padding: 16px 22px 22px;
}

.vks-settings-host {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 0.78rem;
    color: #3a4450;
    word-break: break-all;
}

.vks-settings-section-list,
.vks-settings-api-list {
    margin: 0;
    padding: 0;
    list-style: none;
}

.vks-settings-section-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 10px 0;
    border-bottom: 1px solid #eef1f4;
}

.vks-settings-section-item:last-child {
    border-bottom: none;
}

.vks-settings-section-item label {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
    font-weight: 600;
    color: #1b2430;
    cursor: pointer;
}

.vks-settings-section-desc {
    margin-left: 1.5rem;
    font-size: 0.78rem;
    color: #69727c;
    line-height: 1.4;
}

.vks-settings-api-item {
    padding: 12px 0;
    border-bottom: 1px solid #eef1f4;
}

.vks-settings-api-item:last-child {
    border-bottom: none;
}

.vks-settings-api-head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 4px;
}

.vks-settings-api-name {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 0.85rem;
    font-weight: 700;
    color: #1b2430;
}

.vks-settings-api-service {
    font-size: 0.75rem;
    color: #69727c;
}

.vks-settings-api-path {
    margin: 0 0 4px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 0.75rem;
    color: #3a4450;
    word-break: break-all;
}

.vks-settings-api-query,
.vks-settings-api-purpose {
    margin: 0 0 2px;
    font-size: 0.8rem;
    color: #4a5560;
    line-height: 1.4;
}

.vks-settings-api-k {
    display: inline-block;
    min-width: 3.2rem;
    font-weight: 600;
    color: #69727c;
}

.vks-settings-info-list {
    margin: 0;
}

.vks-settings-info-row {
    display: grid;
    grid-template-columns: 9rem 1fr;
    gap: 10px 14px;
    padding: 10px 0;
    border-bottom: 1px solid #eef1f4;
}

.vks-settings-info-row:last-child {
    border-bottom: none;
}

.vks-settings-info-row dt {
    margin: 0;
    font-size: 0.8rem;
    font-weight: 700;
    color: #69727c;
}

.vks-settings-info-row dd {
    margin: 0;
}

.vks-settings-info-value {
    display: block;
    font-size: 0.9rem;
    font-weight: 600;
    color: #1b2430;
}

.vks-settings-info-detail {
    display: block;
    margin-top: 4px;
    font-size: 0.78rem;
    line-height: 1.4;
    color: #69727c;
}

@media (max-width: 560px) {
    .vks-settings-info-row {
        grid-template-columns: 1fr;
        gap: 4px;
    }
}
</style>
