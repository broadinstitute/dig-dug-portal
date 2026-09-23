<template>
    <div class="rd-shell">
        <header class="rd-header">
            <div class="rd-brand">
                <span class="rd-mark">REVEAL</span>
                <span class="rd-title">DESIGN</span>
            </div>
            <DesignMenuBar @action="onMenuAction" />
        </header>

        <div class="rd-stage">
            <div v-if="hasGeneratedProtocol" class="rd-module-tabs" role="tablist" aria-label="Module content">
                <button
                    type="button"
                    role="tab"
                    class="rd-module-tab"
                    :class="{ 'is-active': activeConfigTab === 'config' }"
                    :aria-selected="activeConfigTab === 'config' ? 'true' : 'false'"
                    @click="activeConfigTab = 'config'"
                >
                    Experiment Configuration
                </button>
                <button
                    type="button"
                    role="tab"
                    class="rd-module-tab"
                    :class="{ 'is-active': activeConfigTab === 'protocol' }"
                    :aria-selected="activeConfigTab === 'protocol' ? 'true' : 'false'"
                    @click="activeConfigTab = 'protocol'"
                >
                    Experiment protocol
                </button>
            </div>

            <div v-show="!hasGeneratedProtocol || activeConfigTab === 'config'" class="hypothesis-container section-wrapper">
                <div v-if="!hasGeneratedProtocol" class="section-header">
                    <h4>Experiment Configuration</h4>
                </div>

                <div class="hypothesis-content" style="margin-bottom: 20px;">
                    <h5>Hypothesis</h5>
                    <div class="textarea-container">
                        <textarea
                            v-model="hypothesisText"
                            placeholder="Enter your hypothesis..."
                            class="hypothesis-textarea"
                            rows="3"
                        ></textarea>
                    </div>
                </div>

                <div class="hypothesis-content" style="margin-bottom: 20px;">
                    <h5>Genes</h5>
                    <div class="textarea-container">
                        <input
                            v-model="genesText"
                            type="text"
                            placeholder="e.g., TP53, BRCA1, MYC"
                            class="hypothesis-textarea genes-text-input"
                        />
                    </div>
                </div>

                <div class="hypothesis-content" style="margin-bottom: 20px;">
                    <h5>Experiment Constraints (Optional)</h5>
                    <div class="notes-section">
                        <textarea
                            v-model="experimentConstraints"
                            placeholder="Add any specific requirements, preferences, or additional considerations for your experiment..."
                            class="notes-textarea"
                            rows="4"
                        ></textarea>
                    </div>

                    <div class="configuration-header" @click="toggleConfigurationSection">
                        <h5>
                            <span class="configuration-toggle">{{ showConfigurationSection ? "−" : "+" }}</span>
                            Advanced Experiment parameters
                        </h5>
                    </div>
                    <div v-if="showConfigurationSection" class="configuration-content">
                        <div class="user-guidance">
                            <p>
                                <strong>💡 Tip:</strong> You can leave any input fields empty if you want the AI to
                                determine the best options for your experiments. The AI will automatically select
                                optimal assay types, cell types, and other parameters based on your hypothesis and
                                data.
                            </p>
                        </div>

                        <div class="experimental-parameters">
                            <h5>Experimental Parameters</h5>
                            <div class="parameters-grid">
                                <div class="filter-section">
                                    <h5>Assay Types</h5>
                                    <div
                                        class="dropdown-container"
                                        @mouseenter="showDropdowns.assayTypes = true"
                                        @mouseleave="showDropdowns.assayTypes = false"
                                    >
                                        <button class="dropdown-toggle">
                                            {{
                                                selectedAssayTypes.length > 0
                                                    ? `${selectedAssayTypes.length} selected`
                                                    : "Choose assay types..."
                                            }}
                                        </button>
                                        <div v-if="showDropdowns.assayTypes" class="dropdown-content">
                                            <div
                                                v-for="(assays, category) in assay_types.categories"
                                                :key="category"
                                                class="category-section"
                                            >
                                                <div class="category-header">{{ category }}</div>
                                                <div
                                                    v-for="assay in assays"
                                                    :key="assay.id"
                                                    class="checkbox-item"
                                                >
                                                    <input
                                                        :id="'assay-' + assay.id"
                                                        type="checkbox"
                                                        :value="category + ':' + assay.label"
                                                        v-model="selectedAssayTypes"
                                                    />
                                                    <label :for="'assay-' + assay.id">{{ assay.label }}</label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div v-if="selectedAssayTypes.length > 0" class="selected-items">
                                        <div
                                            v-for="assayType in selectedAssayTypes"
                                            :key="assayType"
                                            class="selected-item"
                                        >
                                            <span>{{ assayType.split(":")[1] }}</span>
                                            <button @click="removeAssayType(assayType)" class="remove-btn">×</button>
                                        </div>
                                    </div>
                                </div>

                                <div class="filter-section">
                                    <h5>Cell Types</h5>
                                    <div
                                        class="dropdown-container"
                                        @mouseenter="showDropdowns.cellTypes = true"
                                        @mouseleave="showDropdowns.cellTypes = false"
                                    >
                                        <button class="dropdown-toggle">
                                            {{
                                                selectedCellTypes.length > 0
                                                    ? `${selectedCellTypes.length} selected`
                                                    : "Choose cell types..."
                                            }}
                                        </button>
                                        <div v-if="showDropdowns.cellTypes" class="dropdown-content">
                                            <div
                                                v-for="group in cell_types.groups"
                                                :key="group.group"
                                                class="group-section"
                                            >
                                                <div class="group-header">{{ group.group }}</div>

                                                <template v-if="group.options">
                                                    <div
                                                        v-for="option in group.options"
                                                        :key="option.id"
                                                        class="checkbox-item"
                                                    >
                                                        <input
                                                            :id="'cell-' + option.id"
                                                            type="checkbox"
                                                            :value="group.group + ':' + option.label"
                                                            v-model="selectedCellTypes"
                                                        />
                                                        <label :for="'cell-' + option.id">{{ option.label }}</label>
                                                    </div>
                                                </template>

                                                <template v-if="group.subgroups">
                                                    <div
                                                        v-for="subgroup in group.subgroups"
                                                        :key="subgroup.label"
                                                        class="subgroup-section"
                                                    >
                                                        <div class="subgroup-header">{{ subgroup.label }}</div>
                                                        <div
                                                            v-for="option in subgroup.options"
                                                            :key="option.id"
                                                            class="checkbox-item"
                                                        >
                                                            <input
                                                                :id="'cell-' + option.id"
                                                                type="checkbox"
                                                                :value="group.group + ':' + subgroup.label + ':' + option.label"
                                                                v-model="selectedCellTypes"
                                                            />
                                                            <label :for="'cell-' + option.id">{{
                                                                option.label
                                                            }}</label>
                                                        </div>
                                                    </div>
                                                </template>
                                            </div>
                                        </div>
                                    </div>
                                    <div v-if="selectedCellTypes.length > 0" class="selected-items">
                                        <div
                                            v-for="cellType in selectedCellTypes"
                                            :key="cellType"
                                            class="selected-item"
                                        >
                                            <span>{{ cellType.split(":").pop() }}</span>
                                            <button @click="removeCellType(cellType)" class="remove-btn">×</button>
                                        </div>
                                    </div>
                                </div>

                                <div class="filter-section">
                                    <h5>Assay Readouts</h5>
                                    <div
                                        class="dropdown-container"
                                        @mouseenter="showDropdowns.readouts = true"
                                        @mouseleave="showDropdowns.readouts = false"
                                    >
                                        <button class="dropdown-toggle">
                                            {{
                                                selectedReadouts.length > 0
                                                    ? `${selectedReadouts.length} selected`
                                                    : "Choose readouts..."
                                            }}
                                        </button>
                                        <div v-if="showDropdowns.readouts" class="dropdown-content">
                                            <div
                                                v-for="readout in assay_readouts.options"
                                                :key="readout.label"
                                                class="checkbox-item"
                                            >
                                                <input
                                                    :id="'readout-' + readout.label"
                                                    type="checkbox"
                                                    :value="readout.label"
                                                    v-model="selectedReadouts"
                                                />
                                                <label :for="'readout-' + readout.label">{{ readout.label }}</label>
                                            </div>
                                        </div>
                                    </div>
                                    <div v-if="selectedReadouts.length > 0" class="selected-items">
                                        <div v-for="readout in selectedReadouts" :key="readout" class="selected-item">
                                            <span>{{ readout }}</span>
                                            <button @click="removeReadout(readout)" class="remove-btn">×</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="experimental-constraints">
                            <h5>Experimental Constraints</h5>
                            <div class="constraints-grid">
                                <div class="constraint-section">
                                    <label for="throughput-select">Throughput</label>
                                    <select
                                        id="throughput-select"
                                        v-model="selectedThroughput"
                                        class="constraint-select"
                                    >
                                        <option value="">Choose throughput...</option>
                                        <option value="low">Low (1-5 conditions)</option>
                                        <option value="medium">Medium (6-30)</option>
                                        <option value="high">High (30+)</option>
                                    </select>
                                </div>

                                <div class="constraint-section">
                                    <label for="species-select">Target Species</label>
                                    <select id="species-select" v-model="selectedSpecies" class="constraint-select">
                                        <option value="">Choose species...</option>
                                        <option value="human">Human</option>
                                        <option value="rodents">Rodents</option>
                                        <option value="human-rodents">Human + Rodents</option>
                                    </select>
                                </div>

                                <div class="constraint-section">
                                    <label for="timebudget-select">Project Timeline</label>
                                    <select
                                        id="timebudget-select"
                                        v-model="selectedTimeBudget"
                                        class="constraint-select"
                                    >
                                        <option value="">Choose timeline...</option>
                                        <option value="2-3weeks">2-3 weeks</option>
                                        <option value="1-2months">1-2 months</option>
                                        <option value="quarter">Quarter-long</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="action-buttons">
                    <button @click="reviewAndGenerate" class="btn btn-primary">Review &amp; Generate Experiment Plan</button>
                </div>
            </div>

            <div
                v-if="hasGeneratedProtocol"
                v-show="activeConfigTab === 'protocol'"
                id="planner-search-draft"
                class="section-wrapper"
                :class="{ collapsed: !reviewAccordionOpen }"
            >
                <div
                    class="section-header rd-review-header"
                    role="button"
                    tabindex="0"
                    :aria-expanded="reviewAccordionOpen ? 'true' : 'false'"
                    aria-controls="rd-review-content"
                    @click="toggleReviewAccordion"
                    @keydown.enter.prevent="toggleReviewAccordion"
                    @keydown.space.prevent="toggleReviewAccordion"
                >
                    <h4>Review Your Selections &amp; Generate Experiment Plan</h4>
                    <span class="collapse-icon" aria-hidden="true">{{ reviewAccordionOpen ? "▼" : "▶" }}</span>
                </div>
                <div id="rd-review-content" class="section-content" v-show="reviewAccordionOpen">
                    <div class="search-summary">
                        <div class="summary-card">
                            <div class="config-summary">
                                <h6>Configuration Summary</h6>
                                <div class="config-grid">
                                    <div v-if="hypothesisText.trim()" class="config-item">
                                        <strong>Hypothesis:</strong> {{ hypothesisText }}
                                    </div>
                                    <div v-if="genesText.trim()" class="config-item">
                                        <strong>Genes:</strong> {{ genesText }}
                                    </div>
                                    <div v-if="experimentConstraints.trim()" class="config-item">
                                        <strong>Experiment Constraints:</strong>
                                        <pre class="rd-review-pre">{{ experimentConstraints }}</pre>
                                    </div>
                                    <div v-if="selectedAssayTypes.length" class="config-item">
                                        <strong>Assay Types:</strong>
                                        {{ selectedAssayTypes.map((at) => at.split(":")[1] || "").join(", ") }}
                                    </div>
                                    <div v-if="selectedCellTypes.length" class="config-item">
                                        <strong>Cell Types:</strong>
                                        {{ selectedCellTypes.map((ct) => ct.split(":").pop() || "").join(", ") }}
                                    </div>
                                    <div v-if="selectedReadouts.length" class="config-item">
                                        <strong>Readouts:</strong> {{ selectedReadouts.join(", ") }}
                                    </div>
                                    <div
                                        v-if="selectedThroughput || selectedSpecies || selectedTimeBudget"
                                        class="config-item"
                                    >
                                        <strong>Constraints:</strong>
                                        {{ advancedConstraintSummary }}
                                    </div>
                                </div>
                            </div>

                            <div class="experiment-actions">
                                <button
                                    type="button"
                                    class="btn btn-primary"
                                    :disabled="!canGenerateExperiment || isGenerating"
                                    @click="generateExperiment"
                                >
                                    {{
                                        isGenerating
                                            ? `Generating Experiment (${elapsedTime})`
                                            : "Generate Experiment"
                                    }}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <DesignExperimentResults
                v-if="hasGeneratedProtocol && activeConfigTab === 'protocol'"
                :experiments="experimentResults"
                :is-generating="isGenerating"
                :elapsed-time="elapsedTime"
                :error-message="generationError"
                @download="downloadExperiment"
            />
        </div>

        <input
            ref="importFileInput"
            type="file"
            accept="application/json"
            class="rd-import-input"
            @change="onImportFileChange"
        />
    </div>
</template>

<script>
import Vue from "vue";
import DesignMenuBar from "@/components/researchPortal/customComponents/cfdeScope2Design/DesignMenuBar.vue";
import DesignExperimentResults from "@/components/researchPortal/customComponents/cfdeScope2Design/DesignExperimentResults.vue";
import {
    ASSAY_TYPES,
    CELL_TYPES,
    ASSAY_READOUTS,
} from "@/components/researchPortal/customComponents/cfdeScope2Design/designExperimentParams.js";
import {
    generateExperimentPlan,
    formatExperimentForDownload,
} from "@/components/researchPortal/customComponents/cfdeScope2Design/designExperimentGenerate.js";
import {
    buildSessionExport,
    defaultSessionFilename,
    saveSessionFile,
    parseSessionImport,
} from "@/components/researchPortal/customComponents/cfdeScope2Design/designSessionFile.js";

export default Vue.component("cfde-scope2-design", {
    components: {
        DesignMenuBar,
        DesignExperimentResults,
    },
    props: {
        phenotypesInUse: {
            type: [Array, Object],
            default: () => [],
        },
        utilsBox: {
            type: Object,
            default: () => ({}),
        },
        sectionConfigs: {
            type: [Array, Object],
            default: () => ({}),
        },
    },
    data() {
        return {
            hypothesisText: "",
            genesText: "",
            experimentConstraints: "",
            activeConfigTab: "config",
            hasGeneratedProtocol: false,
            reviewAccordionOpen: true,
            isGenerating: false,
            generationStartTime: null,
            generationTimer: null,
            elapsedTime: "0:00",
            experimentResults: [],
            generationError: "",
            showConfigurationSection: false,
            showDropdowns: {
                assayTypes: false,
                cellTypes: false,
                readouts: false,
            },
            selectedAssayTypes: [],
            selectedCellTypes: [],
            selectedReadouts: [],
            selectedThroughput: "",
            selectedSpecies: "",
            selectedTimeBudget: "",
            assay_types: ASSAY_TYPES,
            cell_types: CELL_TYPES,
            assay_readouts: ASSAY_READOUTS,
        };
    },
    watch: {
        utilsBox: {
            immediate: true,
            handler(newVal) {
                if (newVal && newVal.keyParams) {
                    this.initializeFromKeyParams();
                }
            },
        },
    },
    computed: {
        throughputLabel() {
            const labels = {
                low: "Low (1-5 conditions)",
                medium: "Medium (6-30)",
                high: "High (30+)",
            };
            return labels[this.selectedThroughput] || this.selectedThroughput;
        },
        speciesLabel() {
            const labels = {
                human: "Human",
                rodents: "Rodents",
                "human-rodents": "Human + Rodents",
            };
            return labels[this.selectedSpecies] || this.selectedSpecies;
        },
        timeBudgetLabel() {
            const labels = {
                "2-3weeks": "2-3 weeks",
                "1-2months": "1-2 months",
                quarter: "Quarter-long",
            };
            return labels[this.selectedTimeBudget] || this.selectedTimeBudget;
        },
        advancedConstraintSummary() {
            return [this.throughputLabel, this.speciesLabel, this.timeBudgetLabel].filter(Boolean).join(" • ");
        },
        canGenerateExperiment() {
            return Boolean(this.hypothesisText.trim() || this.genesText.trim());
        },
        experimentConfigPayload() {
            return {
                hypothesisText: this.hypothesisText,
                genesText: this.genesText,
                experimentConstraints: this.experimentConstraints,
                selectedAssayTypes: this.selectedAssayTypes,
                selectedCellTypes: this.selectedCellTypes,
                selectedReadouts: this.selectedReadouts,
                selectedThroughput: this.selectedThroughput,
                selectedSpecies: this.selectedSpecies,
                selectedTimeBudget: this.selectedTimeBudget,
            };
        },
    },
    beforeDestroy() {
        this.clearGenerationTimer();
    },
    methods: {
        initializeFromKeyParams() {
            const keyParams = this.utilsBox && this.utilsBox.keyParams;
            if (!keyParams) return;
            if (typeof keyParams.hypothesis === "string" && keyParams.hypothesis) {
                this.hypothesisText = keyParams.hypothesis;
            }
            if (typeof keyParams.genes === "string" && keyParams.genes) {
                this.genesText = keyParams.genes;
            }
            if (typeof keyParams.constraints === "string" && keyParams.constraints) {
                this.experimentConstraints = keyParams.constraints;
            }
        },
        onMenuAction(payload) {
            if (payload.menu === "session" && payload.action === "resetSession") {
                this.resetSession();
                return;
            }
            if (payload.menu === "session" && payload.action === "exportSession") {
                this.exportSession();
                return;
            }
            if (payload.menu === "session" && payload.action === "importSession") {
                this.triggerImport();
                return;
            }
            // eslint-disable-next-line no-console
            console.log("cfde-scope2-design menu action", payload);
        },
        resetSession() {
            this.clearGenerationTimer();
            this.hypothesisText = "";
            this.genesText = "";
            this.experimentConstraints = "";
            this.activeConfigTab = "config";
            this.hasGeneratedProtocol = false;
            this.reviewAccordionOpen = true;
            this.isGenerating = false;
            this.experimentResults = [];
            this.generationError = "";
            this.showConfigurationSection = false;
            this.showDropdowns = {
                assayTypes: false,
                cellTypes: false,
                readouts: false,
            };
            this.selectedAssayTypes = [];
            this.selectedCellTypes = [];
            this.selectedReadouts = [];
            this.selectedThroughput = "";
            this.selectedSpecies = "";
            this.selectedTimeBudget = "";
        },
        exportSession() {
            const sessionData = buildSessionExport({
                hypothesisText: this.hypothesisText,
                genesText: this.genesText,
                experimentConstraints: this.experimentConstraints,
                selectedAssayTypes: this.selectedAssayTypes,
                selectedCellTypes: this.selectedCellTypes,
                selectedReadouts: this.selectedReadouts,
                selectedThroughput: this.selectedThroughput,
                selectedSpecies: this.selectedSpecies,
                selectedTimeBudget: this.selectedTimeBudget,
                showConfigurationSection: this.showConfigurationSection,
                hasGeneratedProtocol: this.hasGeneratedProtocol,
                activeConfigTab: this.activeConfigTab,
                reviewAccordionOpen: this.reviewAccordionOpen,
                experimentResults: this.experimentResults,
            });
            saveSessionFile(sessionData, defaultSessionFilename());
        },
        triggerImport() {
            if (this.$refs.importFileInput) {
                this.$refs.importFileInput.click();
            }
        },
        onImportFileChange(event) {
            const file = event.target.files && event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    const session = parseSessionImport(reader.result);
                    this.clearGenerationTimer();
                    this.isGenerating = false;
                    this.generationError = "";
                    this.hypothesisText = session.hypothesisText;
                    this.genesText = session.genesText;
                    this.experimentConstraints = session.experimentConstraints;
                    this.selectedAssayTypes = session.selectedAssayTypes;
                    this.selectedCellTypes = session.selectedCellTypes;
                    this.selectedReadouts = session.selectedReadouts;
                    this.selectedThroughput = session.selectedThroughput;
                    this.selectedSpecies = session.selectedSpecies;
                    this.selectedTimeBudget = session.selectedTimeBudget;
                    this.showConfigurationSection = session.showConfigurationSection;
                    this.hasGeneratedProtocol = session.hasGeneratedProtocol;
                    this.activeConfigTab = session.activeConfigTab;
                    this.reviewAccordionOpen = session.reviewAccordionOpen;
                    this.experimentResults = session.experimentResults;
                } catch (error) {
                    // eslint-disable-next-line no-console
                    console.warn("[cfde-scope2-design] failed to import session", error);
                    window.alert("Could not import that session file. Check that it is a DESIGN session JSON.");
                } finally {
                    event.target.value = "";
                }
            };
            reader.readAsText(file);
        },
        toggleConfigurationSection() {
            this.showConfigurationSection = !this.showConfigurationSection;
        },
        removeAssayType(assayType) {
            this.selectedAssayTypes = this.selectedAssayTypes.filter((a) => a !== assayType);
        },
        removeCellType(cellType) {
            this.selectedCellTypes = this.selectedCellTypes.filter((c) => c !== cellType);
        },
        removeReadout(readout) {
            this.selectedReadouts = this.selectedReadouts.filter((r) => r !== readout);
        },
        reviewAndGenerate() {
            if (!this.hypothesisText.trim() && !this.genesText.trim()) {
                window.alert("Please provide a hypothesis and/or genes to generate experiment plans.");
                return;
            }
            this.hasGeneratedProtocol = true;
            this.reviewAccordionOpen = true;
            this.activeConfigTab = "protocol";
            this.$nextTick(() => {
                const draftSection = document.getElementById("planner-search-draft");
                if (draftSection) {
                    draftSection.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                        inline: "nearest",
                    });
                }
            });
        },
        toggleReviewAccordion() {
            this.reviewAccordionOpen = !this.reviewAccordionOpen;
        },
        clearGenerationTimer() {
            if (this.generationTimer) {
                clearInterval(this.generationTimer);
                this.generationTimer = null;
            }
            this.generationStartTime = null;
            this.elapsedTime = "0:00";
        },
        startGenerationTimer() {
            this.clearGenerationTimer();
            this.generationStartTime = Date.now();
            this.elapsedTime = "0:00";
            this.generationTimer = setInterval(() => {
                if (!this.isGenerating || !this.generationStartTime) return;
                const elapsed = Math.floor((Date.now() - this.generationStartTime) / 1000);
                const minutes = Math.floor(elapsed / 60);
                const seconds = elapsed % 60;
                this.elapsedTime = `${minutes}:${seconds.toString().padStart(2, "0")}`;
            }, 1000);
        },
        async generateExperiment() {
            if (!this.canGenerateExperiment || this.isGenerating) return;
            this.reviewAccordionOpen = false;
            this.generationError = "";
            this.experimentResults = [];
            this.isGenerating = true;
            this.startGenerationTimer();
            try {
                const results = await generateExperimentPlan(this.experimentConfigPayload);
                this.experimentResults = results;
                this.$nextTick(() => {
                    const resultsSection = document.getElementById("planner-search-results");
                    if (resultsSection) {
                        resultsSection.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                            inline: "nearest",
                        });
                    }
                });
            } catch (error) {
                console.error("[cfde-scope2-design] experiment generation failed", error);
                this.generationError =
                    (error && error.message) || "Error generating experiment. Please try again.";
                this.reviewAccordionOpen = true;
            } finally {
                this.isGenerating = false;
                this.clearGenerationTimer();
            }
        },
        downloadExperiment() {
            try {
                const content = formatExperimentForDownload(
                    this.experimentConfigPayload,
                    this.experimentResults
                );
                const blob = new Blob([content], { type: "text/plain" });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                const timestamp = new Date().toISOString().split("T")[0];
                link.download = `experiment-plan-${timestamp}.txt`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            } catch (error) {
                console.error("[cfde-scope2-design] download failed", error);
                window.alert("Error downloading experiment plan. Please try again.");
            }
        },
    },
});
</script>

<style>
.rd-shell {
    --cfde-orange: #e07b39;
    --cfde-orange-dark: #c2662b;
    --cfde-orange-soft: #fbeee3;
    --cfde-blue: #2c5c97;
    --cfde-border: #e6e1d6;
    --cfde-bg: #f6f5f2;
    --cfde-ink: #33363d;
    --cfde-muted: #6b6b6b;

    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    font-family: "Inter", "Segoe UI", system-ui, -apple-system, sans-serif;
    color: var(--cfde-ink);
}

.rd-header {
    display: flex;
    align-items: center;
    gap: 24px;
    padding: 0 18px 12px 18px;
    border-bottom: 1px solid var(--cfde-border);
    background: #ffffff;
}

.rd-brand {
    display: flex;
    align-items: baseline;
    gap: 7px;
}

.rd-mark {
    font-weight: 800;
    letter-spacing: 0.04em;
    color: var(--cfde-orange);
    font-size: 1.05rem;
}

.rd-title {
    font-weight: 600;
    color: var(--cfde-blue);
    font-size: 1.05rem;
}

.rd-stage {
    position: relative;
    flex: 1;
    overflow: auto;
    background: var(--cfde-bg);
}
</style>

<style scoped>
/*
 * Field markup/classes below are a deliberate direct copy from cfdeDesign.vue's own
 * Hypothesis/Genes/Experiment Constraints fields, per explicit user request — kept as their
 * original (non "rd-" prefixed) class names for fidelity to that source, not renamed to match
 * this product's own naming convention (see DESIGN.md). Scoped here (cfdeDesign.vue's own copy
 * is scoped too) so these fairly generic names can't leak into the rest of the app.
 */
.hypothesis-container,
.section-wrapper {
    padding: 20px;
    margin-bottom: 20px;
}

.section-header h4 {
    color: #ff6600;
    font-size: 18px;
    font-weight: 700;
    margin: 0 0 15px 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.textarea-container {
    width: 100%;
}

.hypothesis-textarea {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
    font-family: inherit;
    resize: vertical;
    min-height: 60px;
    background-color: white;
}

.hypothesis-textarea:focus {
    outline: none;
    border-color: #86b7fe;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.genes-text-input {
    resize: none;
    min-height: 0;
}

.notes-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.notes-textarea {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
    font-family: inherit;
    resize: vertical;
    min-height: 80px;
    background-color: white;
}

.notes-textarea:focus {
    outline: none;
    border-color: #86b7fe;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.notes-textarea:hover {
    border-color: #86b7fe;
}

.configuration-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    user-select: none;
    padding-left: 20px;
    margin-top: 12px;
}

.configuration-header h5 {
    font-size: 14px;
    font-weight: 600;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    color: #777777;
}

.configuration-toggle {
    color: #f60;
    font-size: 18px;
    font-weight: bold;
    width: 0px;
    height: 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.configuration-content {
    padding: 15px 15px;
    background-color: #eeeeee;
    border-radius: 6px;
}

.user-guidance {
    margin: 0 0 20px 0;
    padding: 12px 16px;
    background-color: #f8f9fa;
    border-left: 3px solid #ff6600;
}

.user-guidance p {
    margin: 0;
    font-size: 13px;
    line-height: 1.4;
    color: #495057;
}

.user-guidance strong {
    color: #495057;
    font-weight: 600;
}

.experimental-parameters h5,
.experimental-constraints h5 {
    margin-top: 0;
    margin-bottom: 20px;
}

.parameters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
}

.experimental-constraints {
    margin-top: 20px;
}

.constraints-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
}

.constraint-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.constraint-section label {
    font-weight: 500;
    color: #333333;
    font-size: 14px;
}

.constraint-select {
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
    background-color: white;
    cursor: pointer;
}

.constraint-select:focus {
    outline: none;
    border-color: #86b7fe;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.constraint-select:hover {
    border-color: #86b7fe;
}

.filter-section {
    background: #ffffff;
    padding: 7px;
}

.filter-section h5 {
    margin-top: 0;
    margin-bottom: 10px;
    color: #495057;
    font-size: 14px;
    font-weight: 600;
}

.dropdown-container {
    position: relative;
    display: inline-block;
    width: 100%;
}

.dropdown-toggle {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background: white;
    text-align: left;
    cursor: pointer;
    font-size: 14px;
}

.dropdown-toggle:hover {
    border-color: #86b7fe;
}

.dropdown-content {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #ced4da;
    border-top: none;
    border-radius: 0 0 4px 4px;
    max-height: 200px;
    overflow-y: auto;
    z-index: 1000;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.checkbox-item {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    border-bottom: 1px solid #f8f9fa;
}

.checkbox-item:last-child {
    border-bottom: none;
}

.checkbox-item:hover {
    background-color: #f8f9fa;
}

.checkbox-item input[type="checkbox"] {
    margin-right: 8px;
}

.checkbox-item label {
    margin: 0;
    font-size: 13px;
    cursor: pointer;
    flex: 1;
}

.category-section {
    border-bottom: 1px solid #e9ecef;
}

.category-section:last-child {
    border-bottom: none;
}

.category-header {
    background-color: #f8f9fa;
    padding: 8px 12px;
    font-weight: 600;
    font-size: 12px;
    color: #495057;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid #dee2e6;
}

.group-section {
    border-bottom: 1px solid #e9ecef;
}

.group-section:last-child {
    border-bottom: none;
}

.group-header {
    background-color: #e9ecef;
    padding: 6px 12px;
    font-weight: 500;
    font-size: 11px;
    color: #6c757d;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    border-bottom: 1px solid #dee2e6;
}

.subgroup-section {
    border-bottom: 1px solid #f8f9fa;
    margin-left: 8px;
}

.subgroup-section:last-child {
    border-bottom: none;
}

.subgroup-header {
    background-color: #f8f9fa;
    padding: 4px 12px;
    font-weight: 500;
    font-size: 10px;
    color: #868e96;
    text-transform: uppercase;
    letter-spacing: 0.2px;
    border-bottom: 1px solid #e9ecef;
    margin-left: -8px;
}

.selected-items {
    margin-top: 10px;
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
}

.selected-item {
    display: flex;
    align-items: center;
    background: #e3f2fd;
    border: 1px solid #bbdefb;
    border-radius: 16px;
    padding: 4px 8px;
    font-size: 12px;
}

.selected-item span {
    margin-right: 5px;
}

.remove-btn {
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    font-size: 16px;
    line-height: 1;
    padding: 0;
    margin-left: 5px;
}

.remove-btn:hover {
    color: #333;
}

.action-buttons {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin-top: 20px;
}

.btn {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    margin-top: 10px;
}

.btn-primary {
    background-color: #55aaee;
    color: white;
}

.btn-primary:hover {
    background-color: #0056b3;
}

.rd-module-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin: 15px 0 0;
}

.rd-module-tab {
    margin: 0;
    margin-bottom: -1px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 6px 6px 0 0;
    background: var(--cfde-bg, #f6f5f2);
    padding: 8px 16px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    color: var(--cfde-ink, #33363d);
}

.rd-module-tab.is-active {
    background: #ffffff;
    border-bottom-color: #ffffff;
    color: var(--cfde-orange, #e07b39);
}

#planner-search-draft {
    margin-top: 0;
    margin-bottom: 20px;
    padding: 20px;
    background: #ffffff;
}

.rd-review-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    user-select: none;
    padding: 10px 0;
    margin-bottom: 15px;
    cursor: pointer;
}

.rd-review-header h4 {
    margin: 0;
}

.collapse-icon {
    font-size: 13px;
    color: var(--cfde-muted, #6b6b6b);
    transition: transform 0.2s ease;
}

.collapsed .rd-review-header {
    margin-bottom: 0;
}

.section-content {
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
}

.search-summary {
    margin-top: 0;
}

.summary-card {
    background: #e3f2fd;
    padding: 15px;
    border-radius: 8px;
}

.config-summary {
    margin-bottom: 20px;
}

.config-summary h6 {
    color: #333333;
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 15px 0;
    padding-bottom: 8px;
}

.config-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 12px;
}

.config-item {
    background: white;
    padding: 12px;
    border-left: 3px solid #55aaee;
    font-size: 13px;
    line-height: 1.4;
}

.config-item strong {
    color: #333333;
    font-weight: 600;
}

.rd-review-pre {
    display: block;
    margin: 6px 0 0;
    padding: 0;
    border: 0;
    background: transparent;
    font-family: inherit;
    font-size: 13px;
    line-height: 1.4;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
}

.experiment-actions {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin-top: 15px;
    flex-wrap: wrap;
}

.btn:disabled,
.btn-primary:disabled {
    opacity: 0.65;
    cursor: not-allowed;
}

.rd-import-input {
    display: none;
}
</style>
