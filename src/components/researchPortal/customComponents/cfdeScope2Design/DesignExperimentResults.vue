<template>
    <div
        v-if="experiments.length || isGenerating || errorMessage"
        id="planner-search-results"
        class="section-wrapper"
    >
        <div class="protocol-header">
            <h4>Generated Experiment Protocol</h4>
            <div class="protocol-actions">
                <button
                    v-if="!isGenerating && experiments.length"
                    type="button"
                    class="btn btn-sm btn-primary download-btn"
                    @click="$emit('download')"
                >
                    Download Experiment Plan
                </button>
                <button
                    v-if="!isGenerating && experiments.length"
                    type="button"
                    class="btn btn-sm btn-success citation-btn"
                    @click="showCitationPopup = true"
                >
                    Citation Information
                </button>
                <button
                    v-if="!isGenerating && experiments.length"
                    type="button"
                    class="btn btn-sm btn-alert"
                    @click="showDisclaimer = !showDisclaimer"
                >
                    Important Disclaimer
                </button>
            </div>
        </div>

        <div v-if="isGenerating" class="loading-message">
            <p>Creating your experiment protocol{{ elapsedTime ? ` (${elapsedTime})` : "" }}...</p>
        </div>

        <div v-if="errorMessage && !isGenerating" class="rd-protocol-error" role="alert">
            {{ errorMessage }}
        </div>

        <div v-if="experiments.length" class="experiment-results">
            <div v-if="showDisclaimer" class="experiment-disclaimer">
                <div class="disclaimer-header">
                    <h5>⚠️ Important Disclaimer</h5>
                </div>
                <div class="disclaimer-content">
                    <p>
                        <strong
                            >This tool is designed to help generate testable experiment plans for hypothesis
                            validation, not to provide definitive scientific guidance.</strong
                        >
                    </p>
                    <p>Please note that:</p>
                    <ul>
                        <li>
                            These experiment plans are AI-generated suggestions and should be reviewed by qualified
                            researchers
                        </li>
                        <li>
                            Plans may not align with current journal standards, field-specific requirements, or
                            institutional protocols
                        </li>
                        <li>
                            Always consult with domain experts and follow established laboratory safety and ethical
                            guidelines
                        </li>
                        <li>
                            Verify all technical details, protocols, and safety considerations before
                            implementation
                        </li>
                        <li>Consider your specific experimental context, resources, and constraints</li>
                    </ul>
                    <p>
                        <em
                            >Use these suggestions as a starting point for discussion and planning, not as final
                            experimental protocols.</em
                        >
                    </p>
                </div>
            </div>

            <div class="experiment-plan">
                <div v-for="(experiment, index) in experiments" :key="index" class="experiment-card">
                    <div v-if="experiment.biological_assertion" class="experiment-section">
                        <h6 class="section-title">Biological Assertion</h6>
                        <div class="assertion-content">
                            <div class="hypothesis">
                                <strong>Hypothesis:</strong> {{ experiment.biological_assertion.hypothesis }}
                            </div>
                            <div class="mechanism">
                                <strong>Mechanism:</strong> {{ experiment.biological_assertion.mechanism }}
                            </div>
                            <div class="phenotype">
                                <strong>Phenotype:</strong> {{ experiment.biological_assertion.phenotype }}
                            </div>
                            <div class="gene">
                                <strong>Gene:</strong> {{ experiment.biological_assertion.gene }}
                            </div>
                        </div>
                    </div>

                    <div v-if="experiment.suggested_experiment" class="experiment-section">
                        <h6 class="section-title">Suggested Experiment</h6>
                        <div class="experiment-description">
                            <template v-if="Array.isArray(experiment.suggested_experiment.experiment)">
                                <ul class="setup-list">
                                    <li
                                        v-for="(item, idx) in experiment.suggested_experiment.experiment"
                                        :key="'se-' + idx"
                                    >
                                        {{ item }}
                                    </li>
                                </ul>
                            </template>
                            <template v-else>
                                {{ experiment.suggested_experiment.experiment }}
                            </template>
                        </div>
                    </div>

                    <div v-if="experiment.Why_validate" class="experiment-section">
                        <h6 class="section-title">Why Validate</h6>
                        <div class="validation-reasons">
                            <div class="reason-item">
                                <strong>Feasibility:</strong>
                                <template v-if="Array.isArray(experiment.Why_validate.feasibility)">
                                    <ul class="setup-list">
                                        <li
                                            v-for="(x, i) in experiment.Why_validate.feasibility"
                                            :key="'wvf-' + i"
                                        >
                                            {{ x }}
                                        </li>
                                    </ul>
                                </template>
                                <template v-else>{{ experiment.Why_validate.feasibility }}</template>
                            </div>
                            <div class="reason-item">
                                <strong>Impact:</strong>
                                <template v-if="Array.isArray(experiment.Why_validate.Impact)">
                                    <ul class="setup-list">
                                        <li
                                            v-for="(x, i) in experiment.Why_validate.Impact"
                                            :key="'wvi-' + i"
                                        >
                                            {{ x }}
                                        </li>
                                    </ul>
                                </template>
                                <template v-else>{{ experiment.Why_validate.Impact }}</template>
                            </div>
                            <div class="reason-item">
                                <strong>Novelty:</strong>
                                <template v-if="Array.isArray(experiment.Why_validate.Novelty)">
                                    <ul class="setup-list">
                                        <li
                                            v-for="(x, i) in experiment.Why_validate.Novelty"
                                            :key="'wvn-' + i"
                                        >
                                            {{ x }}
                                        </li>
                                    </ul>
                                </template>
                                <template v-else>{{ experiment.Why_validate.Novelty }}</template>
                            </div>
                        </div>
                    </div>

                    <div v-if="experiment.protocol_sketch" class="experiment-section">
                        <h6 class="section-title">Protocol Sketch</h6>
                        <div class="protocol-details">
                            <div class="protocol-item">
                                <strong>Design:</strong> {{ experiment.protocol_sketch.design }}
                            </div>
                            <div class="protocol-item">
                                <strong>Perturbation:</strong> {{ experiment.protocol_sketch.perturbation }}
                            </div>
                            <div class="protocol-item">
                                <strong>Readouts:</strong>
                                <template v-if="Array.isArray(experiment.protocol_sketch.readouts)">
                                    <ul class="setup-list">
                                        <li
                                            v-for="(r, rIdx) in experiment.protocol_sketch.readouts"
                                            :key="'ro-' + rIdx"
                                        >
                                            {{ r }}
                                        </li>
                                    </ul>
                                </template>
                                <template v-else>{{ experiment.protocol_sketch.readouts }}</template>
                            </div>
                            <div class="protocol-item">
                                <strong>Controls:</strong>
                                <template v-if="Array.isArray(experiment.protocol_sketch.controls)">
                                    <ul class="setup-list">
                                        <li
                                            v-for="(c, cIdx) in experiment.protocol_sketch.controls"
                                            :key="'ct-' + cIdx"
                                        >
                                            {{ c }}
                                        </li>
                                    </ul>
                                </template>
                                <template v-else>{{ experiment.protocol_sketch.controls }}</template>
                            </div>
                            <div class="protocol-item">
                                <strong>Analysis:</strong>
                                <template v-if="Array.isArray(experiment.protocol_sketch.analysis)">
                                    <ul class="setup-list">
                                        <li
                                            v-for="(a, aIdx) in experiment.protocol_sketch.analysis"
                                            :key="'an-' + aIdx"
                                        >
                                            {{ a }}
                                        </li>
                                    </ul>
                                </template>
                                <template v-else>{{ experiment.protocol_sketch.analysis }}</template>
                            </div>
                        </div>
                    </div>

                    <div v-if="experiment.feasibility_details" class="experiment-section">
                        <h6 class="section-title">Feasibility Details</h6>
                        <div class="feasibility-content">
                            <div
                                v-if="experiment.feasibility_details.required_capabilities"
                                class="feasibility-item"
                            >
                                <strong>Required Capabilities:</strong>
                                <ul class="setup-list">
                                    <li
                                        v-for="capability in experiment.feasibility_details.required_capabilities"
                                        :key="capability"
                                    >
                                        {{ capability }}
                                    </li>
                                </ul>
                            </div>
                            <div class="feasibility-item">
                                <strong>Expected Timeline:</strong>
                                {{ experiment.feasibility_details.expected_timeline }}
                                <div class="timeline-disclaimer">
                                    <small
                                        ><em
                                            >Please note these timelines are general estimates, not absolute
                                            predictions, and that timelines assume the user already has the
                                            animals/cells/experimental reagents in-hand and the appropriate animal
                                            and/or institutional protocols in place to conduct these experiments. All
                                            researchers should be responsible for conducting their experiments in
                                            accordance with ethical guidelines as required by their
                                            institution.</em
                                        ></small
                                    >
                                </div>
                            </div>
                            <div class="feasibility-item">
                                <strong>Estimated Conditions:</strong>
                                {{ experiment.feasibility_details.Estimated_conditions }}
                                <div class="conditions-disclaimer">
                                    <small
                                        ><em
                                            >Please note: These are general estimates. Researchers should perform a
                                            power calculation for each assay to determine the appropriate number of
                                            mice required for the experiment based on expected effect size,
                                            variability, and desired statistical power.</em
                                        ></small
                                    >
                                </div>
                            </div>
                            <div
                                v-if="experiment.feasibility_details.required_materials"
                                class="feasibility-item"
                            >
                                <strong>Required Materials:</strong>
                                <ul class="materials-list">
                                    <li
                                        v-for="material in experiment.feasibility_details.required_materials"
                                        :key="material"
                                    >
                                        {{ material }}
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div v-if="experiment.design_critique" class="experiment-section">
                        <h6 class="section-title">Design Critique</h6>
                        <div class="critique-content">
                            <div
                                v-if="experiment.design_critique.strengths"
                                class="critique-section"
                            >
                                <strong>Strengths:</strong>
                                <ul class="critique-list strengths">
                                    <li
                                        v-for="strength in experiment.design_critique.strengths"
                                        :key="strength"
                                    >
                                        {{ strength }}
                                    </li>
                                </ul>
                            </div>
                            <div
                                v-if="experiment.design_critique.limitations"
                                class="critique-section"
                            >
                                <strong>Limitations:</strong>
                                <ul class="critique-list limitations">
                                    <li
                                        v-for="limitation in experiment.design_critique.limitations"
                                        :key="limitation"
                                    >
                                        {{ limitation }}
                                    </li>
                                </ul>
                            </div>
                            <div
                                v-if="experiment.design_critique.justification_for_deviation"
                                class="critique-section"
                            >
                                <strong>Justification for Deviation:</strong>
                                <div class="justification-text">
                                    {{ experiment.design_critique.justification_for_deviation }}
                                </div>
                            </div>
                            <div
                                v-if="experiment.design_critique.alternative_approaches"
                                class="critique-section"
                            >
                                <strong>Alternative Approaches:</strong>
                                <div class="alternatives">
                                    <div
                                        v-for="(alt, altIndex) in experiment.design_critique.alternative_approaches"
                                        :key="'alt-' + index + '-' + altIndex"
                                        class="alternative-item"
                                    >
                                        <span class="alt-type">{{ alt.type }}:</span> {{ alt.suggestion }}
                                    </div>
                                </div>
                            </div>
                            <div
                                v-if="experiment.design_critique.strategic_recommendation"
                                class="critique-section"
                            >
                                <strong>Strategic Recommendation:</strong>
                                <div class="strategic-rec">
                                    {{ experiment.design_critique.strategic_recommendation }}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div v-if="experiment.provenance" class="experiment-section">
                        <h6 class="section-title">Provenance</h6>
                        <div class="provenance-text">
                            <template v-if="Array.isArray(experiment.provenance)">
                                <ul class="setup-list">
                                    <li
                                        v-for="(p, pIdx) in experiment.provenance"
                                        :key="'pv-' + pIdx"
                                    >
                                        {{ p }}
                                    </li>
                                </ul>
                            </template>
                            <template v-else>{{ experiment.provenance }}</template>
                        </div>
                    </div>
                </div>

                <div v-if="experiments.length > 1" class="protocol-footer">
                    <button type="button" class="btn btn-sm btn-primary download-btn" @click="$emit('download')">
                        Download All Experiments
                    </button>
                </div>
            </div>
        </div>

        <div v-if="showCitationPopup" class="citation-popup-overlay" @click="showCitationPopup = false">
            <div class="citation-popup" @click.stop>
                <div class="citation-popup-header">
                    <h4>Citation Information</h4>
                    <button type="button" class="citation-close-btn" @click="showCitationPopup = false">
                        &times;
                    </button>
                </div>
                <div class="citation-popup-content">
                    <p>
                        <strong
                            >If you use this tool in a scientific publication, presentation, or other output, please
                            cite the CFDE Knowledge Center in the following format:</strong
                        >
                    </p>
                    <div class="citation-format">
                        <p>
                            The Common Fund Data Ecosystem Knowledge Center (<a
                                href="https://www.cfdeknowledge.org"
                                target="_blank"
                                rel="noopener"
                                >https://www.cfdeknowledge.org</a
                            >), supported by NIH Office of the Director, Fund OT2OD036440. Year Month Date of
                            access; URL of page cited. Specific identifiers/ accession numbers for datasets used.
                        </p>
                    </div>
                    <p><strong>Additional Citation Requirements:</strong></p>
                    <ul>
                        <li>
                            Users citing data and/or resources collected through other CFDE- or non-CFDE-generated
                            studies should also cite all underlying studies comprising those datasets.
                        </li>
                        <li>
                            All published datasets must be cited according to the associated publication, using DOIs
                            and PMIDs when available.
                        </li>
                        <li>Data reused from third-party repositories must adhere to their citation policies.</li>
                    </ul>
                    <p><strong>Citation Policies:</strong></p>
                    <p>
                        Citation policies for each page or analysis on the Knowledge Center are available here:
                        <a
                            :href="citationPoliciesUrl"
                            target="_blank"
                            rel="noopener"
                            >https://cfdeknowledge.org/r/cfdekc_policies_citation</a
                        >
                    </p>
                </div>
                <div class="citation-popup-footer">
                    <button type="button" class="btn btn-primary" @click="showCitationPopup = false">Close</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { setSimpleLink } from "@/utils/cfdeUtils";

export default {
    name: "DesignExperimentResults",
    props: {
        experiments: {
            type: Array,
            default: () => [],
        },
        isGenerating: {
            type: Boolean,
            default: false,
        },
        elapsedTime: {
            type: String,
            default: "",
        },
        errorMessage: {
            type: String,
            default: "",
        },
    },
    data() {
        return {
            showDisclaimer: false,
            showCitationPopup: false,
        };
    },
    computed: {
        citationPoliciesUrl() {
            return setSimpleLink("/r/cfdekc_policies_citation");
        },
    },
};
</script>

<style scoped>
#planner-search-results {
    margin-top: 20px;
    margin-bottom: 20px;
    padding: 20px;
    background: #ffffff;
}

.protocol-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 15px;
    gap: 12px;
    flex-wrap: wrap;
}

.protocol-header h4 {
    margin: 0;
    color: #ff6600;
    font-size: 21px;
    font-weight: 600;
}

.protocol-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.download-btn,
.citation-btn,
.btn-alert {
    padding: 8px 16px;
    font-size: 13px;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    color: white;
}

.btn-success {
    background-color: #28a745;
    color: white;
}

.btn-success:hover {
    background-color: #218838;
}

.btn-alert {
    background-color: #dc3545;
}

.btn-alert:hover {
    background-color: #c82333;
}

.protocol-footer {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
    padding-top: 15px;
    border-top: 1px solid #e9ecef;
}

.loading-message {
    text-align: center;
    padding: 20px;
    color: #6c757d;
    font-style: italic;
    font-size: 13px;
}

.rd-protocol-error {
    margin: 0 0 16px;
    padding: 12px 16px;
    background: #f8d7da;
    border-left: 4px solid #dc3545;
    color: #721c24;
    font-size: 13px;
}

.experiment-disclaimer {
    background: #fff3cd;
    border-left: 4px solid #ff6600;
    margin-bottom: 25px;
    padding: 20px;
}

.disclaimer-header {
    margin-bottom: 15px;
}

.disclaimer-header h5 {
    margin: 0;
    color: #856404;
    font-size: 16px;
    font-weight: 600;
}

.disclaimer-content {
    color: #856404;
    font-size: 13px;
    line-height: 1.5;
}

.disclaimer-content p {
    margin: 0 0 12px 0;
}

.disclaimer-content ul {
    margin: 10px 0;
    padding-left: 20px;
}

.disclaimer-content li {
    margin-bottom: 6px;
}

.timeline-disclaimer,
.conditions-disclaimer {
    margin-top: 8px;
    color: #6c757d;
}

.experiment-plan {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.experiment-card {
    background: #ffffff;
    border-radius: 8px;
    padding: 20px;
    border: 1px solid #aaaaaa;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.experiment-section {
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 1px solid #f8f9fa;
}

.experiment-section:last-child {
    border-bottom: none;
    margin-bottom: 0;
}

.section-title {
    color: #495057;
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 10px 0;
    padding-bottom: 5px;
    border-bottom: 2px solid #cccccc;
}

.assertion-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.hypothesis,
.mechanism,
.phenotype,
.gene,
.reason-item,
.protocol-item,
.feasibility-item,
.critique-section {
    line-height: 1.5;
    color: #495057;
    font-size: 13px;
}

.experiment-description {
    line-height: 1.6;
    color: #495057;
    font-style: italic;
    background: #f8f9fa;
    padding: 12px;
    border-left: 4px solid #ff6600;
    font-size: 13px;
}

.validation-reasons,
.protocol-details,
.feasibility-content,
.critique-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.setup-list,
.materials-list,
.critique-list {
    margin: 8px 0 0 0;
    padding-left: 20px;
}

.setup-list li,
.materials-list li {
    margin: 4px 0;
    color: #6c757d;
}

.critique-list li {
    margin: 6px 0;
    line-height: 1.4;
}

.critique-list.strengths li {
    color: #28a745;
}

.critique-list.limitations li {
    color: #dc3545;
}

.alternatives {
    margin-top: 8px;
}

.alternative-item {
    margin: 8px 0;
    padding: 8px 12px;
    background: #f8f9fa;
    border-left: 3px solid #ffc107;
    font-size: 13px;
}

.alt-type {
    font-weight: 600;
    color: #495057;
}

.strategic-rec {
    margin-top: 8px;
    padding: 12px;
    background: #e3f2fd;
    border-left: 4px solid #2196f3;
    font-style: italic;
    line-height: 1.5;
    font-size: 13px;
}

.provenance-text {
    line-height: 1.5;
    color: #6c757d;
    font-size: 13px;
    font-style: italic;
}

.justification-text {
    margin-top: 8px;
    padding: 12px;
    background: #fff3cd;
    border-left: 4px solid #ffc107;
    line-height: 1.5;
    color: #495057;
    font-style: italic;
    font-size: 13px;
}

.citation-popup-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 16px;
}

.citation-popup {
    width: min(640px, 100%);
    max-height: 90vh;
    overflow: auto;
    background: #ffffff;
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.citation-popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #e9ecef;
}

.citation-popup-header h4 {
    margin: 0;
    font-size: 16px;
}

.citation-close-btn {
    border: 0;
    background: transparent;
    font-size: 24px;
    line-height: 1;
    cursor: pointer;
    color: #6c757d;
}

.citation-popup-content {
    padding: 16px 20px;
    font-size: 13px;
    line-height: 1.5;
}

.citation-popup-content p {
    margin: 0 0 12px;
}

.citation-popup-content ul {
    margin: 0 0 12px;
    padding-left: 20px;
}

.citation-popup-content li {
    margin-bottom: 6px;
}

.citation-format {
    margin: 12px 0;
    padding: 12px;
    background: #f8f9fa;
    border-left: 3px solid #55aaee;
}

.citation-popup-footer {
    display: flex;
    justify-content: flex-end;
    padding: 12px 20px 16px;
}
</style>
