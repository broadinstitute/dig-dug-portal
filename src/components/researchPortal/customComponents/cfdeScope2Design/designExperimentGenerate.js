/**
 * Experiment-protocol generation — recycled from `cfdeDesign.vue`
 * (`experiment_system_prompt`, `experimentUserPrompt`, `extractExperimentJson`,
 * `generateExperiment` single-call path, `formatExperimentForDownload`).
 *
 * LLM provider is locked to Bedrock (see ARCHITECTURE.md); legacy DESIGN defaults
 * to gemini via sectionConfigs — do not follow that here.
 */
import { createLLMClient } from "@/utils/llmClient";

/** Same JSON schema / instructions as cfdeDesign.vue's experiment_system_prompt. */
export const EXPERIMENT_SYSTEM_PROMPT = `Your task is to generate validation experiment proposals based on biological hypotheses and selected genes.

                **EXPERIMENT GENERATION STRATEGY:**

                1. Generate one experiment protocol for each selected gene in combination with the hypothesis
                2. Each experiment should focus on testing how the specific gene relates to the biological mechanisms described in the hypothesis
                3. Design experiments to validate the role of each gene in the hypothesized biological process
                4. Generate one experiment per selected gene
                5. **IMPORTANT: You MUST generate multiple experiments if there are multiple selected genes**

                **EXPERIMENT DESIGN PRINCIPLES:**
                - Carefully consider user-provided preferences for experiment configuration (species, cell type, assays, throughput)
                - Design the most scientifically robust and feasible validation experiment
                - If you determine an alternative approach is significantly better, use the justification_for_deviation field to explain why
                - Select the most suitable candidate genes for initial validation (rate-limiting enzymes, structural components, key regulators)
                - Outline a tiered validation strategy in strategic_recommendation

                **OUTPUT FORMAT:**
                - Generate one experiment per selected gene (if genes provided)
                - Each experiment must be fully populated and coherent
                - Avoid speculative biological claims; base reasoning on established gene function and pathways
                - **CRITICAL: If you see multiple selected genes in the input, you MUST generate multiple experiments in the resultModel array**
                - The resultModel array should contain one object per experiment

                {
                    "resultModel": [
                        {
                        "biological_assertion": {
                            "hypothesis": "<user provided hypothesis>",
                            "mechanism": "<biological process or pathway connecting phenotype to gene sets>",
                            "phenotype": "<disease or observable trait from the association group>",
                            "gene": "<gene>"
                        },
                        "suggested_experiment": {
                            "experiment": "<concise validation experiment for this phenotype+source group>"
                        },
                        "Why_validate": {
                            "feasibility": "<why technically feasible>",
                            "Impact": "<how results clarify mechanism>",
                            "Novelty": "<what's new>"
                        },
                        "protocol_sketch": {
                            "design": "<study layout>",
                            "perturbation": "<manipulation>",
                            "readouts": "<key assays>",
                            "controls": "<control conditions>",
                            "analysis": "<data analysis plan>"
                        },
                        "feasibility_details": {
                            "required_capabilities": ["<assay/skill 1>", "<assay/skill 2>", "<instrumentation 1>"],
                            "expected_timeline": "<e.g., 1-2 weeks>",
                            "Estimated_conditions": "<e.g., 6–12>",
                            "required_materials": ["<reagent1>", "<reagent2>"]
                        },
                        "design_critique": {
                            "strengths": [
                            "<advantage of the proposed experimental design>"
                            ],
                            "limitations": [
                            "<potential drawback or confounding factor of the design>"
                            ],
                            "justification_for_deviation": "<Explain why the proposed design differs from user preferences, if applicable. If it matches, state that the user's preference is suitable.>",
                            "alternative_approaches": [
                            {
                                "type": "<e.g., Assay Modification, Model Improvement>",
                                "suggestion": "<description of the alternative approach>"
                            }
                            ],
                            "strategic_recommendation": "<concise verdict on the experiment's role and suggested next steps>"
                        },
                        "provenance": "<data source or model reasoning>"
                        }
                    ]
                }

                **OUTPUT REQUIREMENTS:**
                - Output JSON only. No text outside JSON. No trailing commas. No comments.
                - Return a well-formed JSON object with a "resultModel" array containing experiment objects.
                `;

/**
 * @param {string} genesText
 * @returns {string[]}
 */
export function parseGenesText(genesText) {
    return String(genesText || "")
        .split(/[,;]+/)
        .map((gene) => gene.trim())
        .filter(Boolean);
}

/**
 * Builds the user prompt from the config form — same shape as cfdeDesign's
 * experimentUserPrompt(), mapped onto DESIGN's field names.
 *
 * @param {{
 *   hypothesisText?: string,
 *   genesText?: string,
 *   experimentConstraints?: string,
 *   selectedAssayTypes?: string[],
 *   selectedCellTypes?: string[],
 *   selectedReadouts?: string[],
 *   selectedThroughput?: string,
 *   selectedSpecies?: string,
 *   selectedTimeBudget?: string,
 * }} config
 * @returns {string}
 */
export function buildExperimentUserPrompt(config = {}) {
    const hypothesis = String(config.hypothesisText || "").trim();
    const genes = parseGenesText(config.genesText);
    const constraints = String(config.experimentConstraints || "").trim();
    const assayTypes = config.selectedAssayTypes || [];
    const cellTypes = config.selectedCellTypes || [];
    const readouts = config.selectedReadouts || [];

    let userPrompt = "**Current Search Context:**\n";
    if (hypothesis) {
        userPrompt += `**Hypothesis:** ${hypothesis}\n`;
    }
    if (genes.length) {
        userPrompt += `**Selected Genes:** ${genes.join(", ")}\n`;
    }
    if (assayTypes.length) {
        userPrompt += `**Selected Assay Types:** ${assayTypes.map((at) => at.split(":")[1] || "").join(", ")}\n`;
    }
    if (cellTypes.length) {
        userPrompt += `**Selected Cell Types:** ${cellTypes.map((ct) => ct.split(":").pop() || "").join(", ")}\n`;
    }
    if (readouts.length) {
        userPrompt += `**Selected Readouts:** ${readouts.join(", ")}\n`;
    }
    if (config.selectedThroughput) {
        userPrompt += `**Throughput:** ${config.selectedThroughput}\n`;
    }
    if (config.selectedSpecies) {
        userPrompt += `**Species Constraints:** ${config.selectedSpecies}\n`;
    }
    if (config.selectedTimeBudget) {
        userPrompt += `**Time Budget:** ${config.selectedTimeBudget}\n`;
    }
    if (constraints) {
        userPrompt += `**Additional Notes:** ${constraints}\n`;
    }
    return userPrompt;
}

/**
 * Same recovery path as cfdeDesign.vue's extractExperimentJson.
 * @param {string} responseText
 * @returns {{ resultModel: Array }|null}
 */
export function extractExperimentJson(responseText) {
    try {
        if (!responseText || typeof responseText !== "string") return null;
        let text = responseText.trim();
        if (text.startsWith("```")) {
            text = text.replace(/^```[a-zA-Z]*\n?/, "").replace(/```\s*$/, "").trim();
        }
        try {
            const obj = JSON.parse(text);
            if (obj && obj.resultModel && Array.isArray(obj.resultModel)) return obj;
        } catch (e) {
            // fall through to regex extraction
        }
        const match = text.match(/\{[\s\S]*?"resultModel"\s*:\s*\[[\s\S]*?\}[\s\S]*?\}/);
        if (match && match[0]) {
            const obj = JSON.parse(match[0]);
            if (obj && obj.resultModel && Array.isArray(obj.resultModel)) return obj;
        }
        return null;
    } catch (e) {
        console.warn("[cfde-scope2-design] Failed to extract experiment JSON:", e);
        return null;
    }
}

/**
 * Single-call protocol generation (cfdeDesign's ≤1-gene / combined path).
 * DESIGN does not implement per-gene sequential or per-group strategies.
 *
 * @param {object} config - same shape as buildExperimentUserPrompt()
 * @returns {Promise<Array>}
 */
export function generateExperimentPlan(config) {
    const userPrompt = buildExperimentUserPrompt(config).trim();
    const client = createLLMClient({
        llm: "bedrock",
        system_prompt: EXPERIMENT_SYSTEM_PROMPT,
    });

    return new Promise((resolve, reject) => {
        client.sendPrompt({
            userPrompt: userPrompt || "Generate validation experiments based on the selected parameters",
            onResponse: (response) => {
                const obj = extractExperimentJson(response);
                if (obj && Array.isArray(obj.resultModel) && obj.resultModel.length) {
                    resolve(obj.resultModel);
                    return;
                }
                reject(new Error("Could not parse experiment protocol from the model response."));
            },
            onError: (error) => {
                reject(error || new Error("Experiment protocol generation failed"));
            },
        });
    });
}

function asText(value) {
    if (Array.isArray(value)) return value.join("; ");
    return value == null ? "" : String(value);
}

/**
 * Plain-text download body — same structure as cfdeDesign.vue's formatExperimentForDownload.
 *
 * @param {object} config
 * @param {Array} experiments
 * @returns {string}
 */
export function formatExperimentForDownload(config = {}, experiments = []) {
    let content = "";
    content += "EXPERIMENT PLAN\n";
    content += "================\n";
    content += `Generated on: ${new Date().toLocaleString()}\n\n`;

    const hypothesis = String(config.hypothesisText || "").trim();
    if (hypothesis) {
        content += `HYPOTHESIS:\n${hypothesis}\n\n`;
    }

    const genes = parseGenesText(config.genesText);
    if (genes.length) {
        content += `GENES:\n${genes.join(", ")}\n\n`;
    }

    content += "EXPERIMENT CONFIGURATION:\n";
    content += "-------------------------\n";
    const assayTypes = config.selectedAssayTypes || [];
    const cellTypes = config.selectedCellTypes || [];
    const readouts = config.selectedReadouts || [];
    if (assayTypes.length) {
        content += `Assay Types: ${assayTypes.map((at) => at.split(":")[1] || "").join(", ")}\n`;
    }
    if (cellTypes.length) {
        content += `Cell Types: ${cellTypes.map((ct) => ct.split(":").pop() || "").join(", ")}\n`;
    }
    if (readouts.length) {
        content += `Readouts: ${readouts.join(", ")}\n`;
    }
    if (config.selectedThroughput) {
        content += `Throughput: ${config.selectedThroughput}\n`;
    }
    if (config.selectedSpecies) {
        content += `Species: ${config.selectedSpecies}\n`;
    }
    if (config.selectedTimeBudget) {
        content += `Timeline: ${config.selectedTimeBudget}\n`;
    }
    const constraints = String(config.experimentConstraints || "").trim();
    if (constraints) {
        content += `Additional Notes: ${constraints}\n`;
    }
    content += "\n";

    if (Array.isArray(experiments) && experiments.length) {
        experiments.forEach((experiment, index) => {
            content += `EXPERIMENT ${index + 1}\n`;
            content += "==================\n\n";

            if (experiment.biological_assertion) {
                content += "BIOLOGICAL ASSERTION:\n";
                content += `Hypothesis: ${experiment.biological_assertion.hypothesis}\n`;
                content += `Mechanism: ${experiment.biological_assertion.mechanism}\n`;
                content += `Phenotype: ${experiment.biological_assertion.phenotype}\n`;
                content += `Gene: ${experiment.biological_assertion.gene}\n\n`;
            }

            if (experiment.suggested_experiment) {
                content += "SUGGESTED EXPERIMENT:\n";
                content += `${asText(experiment.suggested_experiment.experiment)}\n\n`;
            }

            if (experiment.Why_validate) {
                content += "WHY VALIDATE:\n";
                content += `Feasibility: ${asText(experiment.Why_validate.feasibility)}\n`;
                content += `Impact: ${asText(experiment.Why_validate.Impact)}\n`;
                content += `Novelty: ${asText(experiment.Why_validate.Novelty)}\n\n`;
            }

            if (experiment.protocol_sketch) {
                content += "PROTOCOL SKETCH:\n";
                content += `Design: ${asText(experiment.protocol_sketch.design)}\n`;
                content += `Perturbation: ${asText(experiment.protocol_sketch.perturbation)}\n`;
                content += `Readouts: ${asText(experiment.protocol_sketch.readouts)}\n`;
                content += `Controls: ${asText(experiment.protocol_sketch.controls)}\n`;
                content += `Analysis: ${asText(experiment.protocol_sketch.analysis)}\n\n`;
            }

            if (experiment.feasibility_details) {
                content += "FEASIBILITY DETAILS:\n";
                if (experiment.feasibility_details.required_capabilities) {
                    content += "Required Capabilities:\n";
                    (experiment.feasibility_details.required_capabilities || []).forEach((cap) => {
                        content += `- ${cap}\n`;
                    });
                }
                content += `Expected Timeline: ${experiment.feasibility_details.expected_timeline}\n`;
                content += `Estimated Conditions: ${experiment.feasibility_details.Estimated_conditions}\n`;
                if (experiment.feasibility_details.required_materials) {
                    content += "Required Materials:\n";
                    (experiment.feasibility_details.required_materials || []).forEach((mat) => {
                        content += `- ${mat}\n`;
                    });
                }
                content += "\n";
            }

            if (experiment.design_critique) {
                content += "DESIGN CRITIQUE:\n";
                if (experiment.design_critique.strengths) {
                    content += "Strengths:\n";
                    (experiment.design_critique.strengths || []).forEach((strength) => {
                        content += `- ${strength}\n`;
                    });
                }
                if (experiment.design_critique.limitations) {
                    content += "Limitations:\n";
                    (experiment.design_critique.limitations || []).forEach((limitation) => {
                        content += `- ${limitation}\n`;
                    });
                }
                if (experiment.design_critique.justification_for_deviation) {
                    content += `Justification for Deviation: ${experiment.design_critique.justification_for_deviation}\n`;
                }
                if (experiment.design_critique.alternative_approaches) {
                    content += "Alternative Approaches:\n";
                    (experiment.design_critique.alternative_approaches || []).forEach((alt) => {
                        content += `- ${alt.type}: ${alt.suggestion}\n`;
                    });
                }
                content += `Strategic Recommendation: ${experiment.design_critique.strategic_recommendation}\n\n`;
            }

            if (experiment.provenance) {
                content += "PROVENANCE:\n";
                content += `${asText(experiment.provenance)}\n\n`;
            }

            content += "---\n\n";
        });
    }

    content += "\n\n";
    content += "IMPORTANT DISCLAIMERS\n";
    content += "====================\n\n";
    content += "⚠️ IMPORTANT DISCLAIMER\n";
    content +=
        "This tool is designed to help generate testable experiment plans for hypothesis validation, not to provide definitive scientific guidance.\n\n";
    content += "Please note that:\n";
    content += "• These experiment plans are AI-generated suggestions and should be reviewed by qualified researchers\n";
    content +=
        "• Plans may not align with current journal standards, field-specific requirements, or institutional protocols\n";
    content += "• Always consult with domain experts and follow established laboratory safety and ethical guidelines\n";
    content += "• Verify all technical details, protocols, and safety considerations before implementation\n";
    content += "• Consider your specific experimental context, resources, and constraints\n\n";
    content +=
        "Use these suggestions as a starting point for discussion and planning, not as final experimental protocols.\n\n";
    content += "TIMELINE DISCLAIMER\n";
    content +=
        "Please note these timelines are general estimates, not absolute predictions, and that timelines assume the user already has the animals/cells/experimental reagents in-hand and the appropriate animal and/or institutional protocols in place to conduct these experiments. All researchers should be responsible for conducting their experiments in accordance with ethical guidelines as required by their institution.\n\n";
    content += "CONDITIONS DISCLAIMER\n";
    content +=
        "Please note: These are general estimates. Researchers should perform a power calculation for each assay to determine the appropriate number of mice required for the experiment based on expected effect size, variability, and desired statistical power.\n\n";
    content += "CITATION INFORMATION\n";
    content +=
        "If you use this tool in a scientific publication, presentation, or other output, please cite the CFDE Knowledge Center in the following format:\n\n";
    content +=
        "The Common Fund Data Ecosystem Knowledge Center (https://www.cfdeknowledge.org), supported by NIH Office of the Director, Fund OT2OD036440. Year Month Date of access; URL of page cited. Specific identifiers/ accession numbers for datasets used.\n\n";
    content += "Additional Citation Requirements:\n";
    content +=
        "• Users citing data and/or resources collected through other CFDE- or non-CFDE-generated studies should also cite all underlying studies comprising those datasets\n";
    content +=
        "• All published datasets must be cited according to the associated publication, using DOIs and PMIDs when available\n";
    content += "• Data reused from third-party repositories must adhere to their citation policies\n\n";
    content +=
        "Citation policies for each page or analysis on the Knowledge Center are available here: https://cfdeknowledge.org/r/cfdekc_policies_citation\n";

    return content;
}
