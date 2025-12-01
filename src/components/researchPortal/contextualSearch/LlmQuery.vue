<template>
  <div class="llm-query-container">
    <div class="row">   
        <div v-if="this.summaryConfig['search focus']" class="llm-query-ui-container col-md-12">
            <label for="searchFocus">{{ this.summaryConfig['search focus'].label }}</label>
            <input type="text" v-if="this.summaryConfig['search focus'].type == 'input'" class="form-control search-focus-input" v-model="searchFocus" />

        <button @click="queryLLM()" class="btn btn-sm btn-primary">{{ (!!this.summaryConfig['button label'])?this.summaryConfig['button label']:"Generate summary" }}</button>
        <research-loading-spinner :isLoading="loading" colorStyle="color"></research-loading-spinner>
    </div>
    </div>
    <div class="row" v-if="summary">
        <div class="llm-query-contents-container col-md-12">
            <response-summary 
                :summaryContent="parsedSummary" 
                :summaryConfig="summaryConfig" 
                :utils="utils" 
                :sectionConfig="sectionConfig" 
                :dataset="dataset"></response-summary>
        </div>
    </div>
  </div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";
import ResearchLoadingSpinner from "../ResearchLoadingSpinner.vue";
import ResponseSummary from "@/components/researchPortal/contextualSearch/ResponseSummary.vue";


export default Vue.component("llm-summary", {
    props: ["dataset","summaryConfig","utils","sectionID","sectionConfig"],
    components: {
        ResearchLoadingSpinner,
        ResponseSummary
    },
    data() {
        return {
            summary: null,
            loading: false,
            searchFocus: "",
            testSummary: {
                            "Analysis title": "Adipose-Muscle Axis Dysfunction and Systemic Metabolic Perturbations",
                            "Introduction": {
                                "Title": "Overview of Adipose-Muscle Interactions and Systemic Effects",
                                "Summary": "The data highlights a complex interplay between adipose tissue and skeletal muscle, particularly concerning metabolic and neuromuscular disorders. Age, sex, and specific adipose depots (visceral vs. subcutaneous) appear to modulate these relationships, influencing systemic metabolic parameters and potentially impacting exercise capacity and lung function."
                            },
                            "Themes": [
                                {
                                    "Group name": "Adipose-Skeletal Muscle Metabolic Crosstalk in Neuromuscular Disease",
                                    "Reason": "Adipose tissue and skeletal muscle exhibit bidirectional communication, influencing each other's metabolic function. Dysfunction in this crosstalk can contribute to neuromuscular disease pathogenesis.",
                                    "Relevance score": 3,
                                    "Impact score": 4,
                                    "Novelty score": 3,
                                    "Relevance": "Understanding the metabolic interactions between adipose and muscle is relevant to exercise capacity, as muscle function relies on efficient energy supply and utilization.",
                                    "Impact": "Identifying specific metabolic pathways dysregulated in adipose-muscle crosstalk could reveal novel therapeutic targets for neuromuscular diseases and improve exercise tolerance.",
                                    "Novelty": "While adipose-muscle crosstalk is established, the specific metabolic pathways involved in different neuromuscular diseases and their impact on exercise capacity are still being elucidated.",
                                    "Known genes": [
                                        "PPARGC1A: Regulates mitochondrial biogenesis and oxidative metabolism in both muscle and adipose tissue.",
                                        "SLC2A4: Encodes GLUT4, a glucose transporter crucial for glucose uptake in muscle and adipose tissue.",
                                        "LEP: Encodes leptin, an adipokine that regulates energy balance and insulin sensitivity.",
                                        "ADIPOQ: Encodes adiponectin, an adipokine with anti-inflammatory and insulin-sensitizing effects.",
                                        "IL6: Pro-inflammatory cytokine involved in muscle wasting and metabolic dysfunction."
                                    ],
                                    "Testable Hypotheses": [
                                        "Does exercise training modulate the expression and secretion of adipokines (e.g., leptin, adiponectin) from subcutaneous and visceral adipose tissue in individuals with neuromuscular disease?",
                                        "Does improving insulin sensitivity in skeletal muscle through pharmacological interventions enhance exercise capacity and lung function in individuals with muscular lipidosis?",
                                        "Does targeted disruption of PPARGC1A in adipose tissue affect skeletal muscle mitochondrial function and exercise performance?"
                                    ],
                                    "Evidence & Search Strategy": [
                                        "(adipose OR fat) AND (muscle OR skeletal muscle) AND (neuromuscular disease OR myopathy) AND metabolism",
                                        "adipose muscle crosstalk neuromuscular disease",
                                        "exercise adipokine muscle metabolism",
                                        "PubMed: adipose tissue skeletal muscle interaction neuromuscular disease",
                                        "Google Scholar: adipose muscle crosstalk exercise capacity"
                                    ],
                                    "terms": [
                                        "muscle - skeletal female 40-49 up associated with skeletal muscle disease",
                                        "t69-brown-adipose male 8w down associated with skeletal muscle disease",
                                        "gtex adipose-sc age down associated with genetic skeletal muscle disease",
                                        "t69-brown-adipose male 8w down associated with muscular lipidosis",
                                        "gtex adipose-sc age down associated with genetic neuromuscular disease"
                                    ]
                                },
                                {
                                    "Group name": "Age- and Sex-Dependent Adipose Tissue Remodeling and Muscle Dysfunction",
                                    "Reason": "Adipose tissue undergoes significant remodeling with age, and these changes differ between sexes. These alterations can impact muscle function and systemic metabolism.",
                                    "Relevance score": 4,
                                    "Impact score": 4,
                                    "Novelty score": 3,
                                    "Relevance": "Age and sex are critical factors influencing exercise capacity and lung function. Understanding how adipose remodeling contributes to these differences is essential.",
                                    "Impact": "Identifying age- and sex-specific adipose tissue changes that impair muscle function could lead to targeted interventions to improve exercise performance and overall health.",
                                    "Novelty": "The influence of age and sex on adipose-muscle interactions is recognized, but the specific molecular mechanisms and their impact on exercise capacity require further investigation.",
                                    "Known genes": [
                                        "ESR1: Encodes estrogen receptor alpha, which plays a role in adipose tissue distribution and metabolism in females.",
                                        "AR: Encodes androgen receptor, which influences muscle mass and strength in males.",
                                        "SIRT1: A deacetylase involved in regulating aging and metabolic function in both muscle and adipose tissue.",
                                        "FOXO3: A transcription factor involved in regulating longevity and stress resistance.",
                                        "MYOD1: A master regulator of muscle differentiation and regeneration."
                                    ],
                                    "Testable Hypotheses": [
                                        "Does estrogen replacement therapy in postmenopausal women mitigate age-related decline in muscle mass and strength?",
                                        "Does testosterone supplementation in older men improve muscle mitochondrial function and exercise capacity?",
                                        "Does caloric restriction or intermittent fasting reverse age-related adipose tissue inflammation and improve muscle insulin sensitivity?"
                                    ],
                                    "Evidence & Search Strategy": [
                                        "(adipose OR fat) AND (muscle OR skeletal muscle) AND (aging OR age-related) AND (sex OR gender)",
                                        "age sex adipose muscle metabolism",
                                        "adipose tissue remodeling aging muscle function",
                                        "PubMed: age-related adipose tissue changes muscle function",
                                        "Google Scholar: sex differences adipose muscle metabolism"
                                    ],
                                    "terms": [
                                        "muscle - skeletal female 30-39 up associated with creatine kinase",
                                        "muscle - skeletal female 40-49 up associated with metabolic myopathy",
                                        "gtex adipose-sc age down associated with genetic skeletal muscle disease",
                                        "gtex adipose-sc age down associated with dilated cardiomyopathy",
                                        "gtex muscle 20-29 vs 40-49 up associated with rare diabetes mellitus"
                                    ]
                                },
                                {
                                    "Group name": "Visceral Adipose Tissue Expansion and Systemic Metabolic Dysregulation",
                                    "Reason": "Visceral adipose tissue is metabolically active and its expansion is strongly associated with systemic metabolic dysfunction, including insulin resistance and dyslipidemia.",
                                    "Relevance score": 4,
                                    "Impact score": 4,
                                    "Novelty score": 2,
                                    "Relevance": "Visceral adiposity can impair exercise capacity by affecting muscle metabolism and cardiovascular function.",
                                    "Impact": "Understanding the specific metabolic pathways dysregulated by visceral adipose tissue expansion could lead to targeted interventions to improve metabolic health and exercise performance.",
                                    "Novelty": "The link between visceral adiposity and metabolic dysfunction is well-established, but the specific molecular mechanisms and their impact on exercise capacity are still being investigated.",
                                    "Known genes": [
                                        "TNF: Pro-inflammatory cytokine secreted by visceral adipose tissue that contributes to insulin resistance.",
                                        "RESISTIN: An adipokine that impairs insulin sensitivity.",
                                        "APOE: Involved in lipid metabolism and transport, and its expression is altered in visceral obesity.",
                                        "HMGCR: The rate-limiting enzyme in cholesterol synthesis, which is upregulated in visceral obesity.",
                                        "CRP: An acute-phase protein that is elevated in visceral obesity and contributes to inflammation."
                                    ],
                                    "Testable Hypotheses": [
                                        "Does reducing visceral adipose tissue through diet and exercise improve muscle insulin sensitivity and exercise capacity?",
                                        "Does pharmacological inhibition of TNF signaling in visceral adipose tissue improve systemic metabolic parameters and muscle function?",
                                        "Does targeted disruption of HMGCR in visceral adipose tissue reduce systemic cholesterol levels and improve cardiovascular function?"
                                    ],
                                    "Evidence & Search Strategy": [
                                        "(visceral adipose OR omental fat) AND (metabolic dysfunction OR insulin resistance OR dyslipidemia)",
                                        "visceral adiposity systemic metabolism exercise",
                                        "visceral fat inflammation muscle function",
                                        "PubMed: visceral adipose tissue metabolic syndrome",
                                        "Google Scholar: visceral fat exercise capacity"
                                    ],
                                    "terms": [
                                        "gtex adipose-vo mondo 0002041 up associated with metabolite measurement",
                                        "gtex adipose-vo mondo 0004992 up associated with metabolite measurement",
                                        "gtex adipose-vo mondo 0002041 up associated with total bilirubin",
                                        "gtex adipose-vo mondo 0007915 up associated with monounsaturated fatty acids; 16:1, 18:1 measurement",
                                        "gtex adipose-vo mondo 0002041 up associated with fatty acid measurement"
                                    ]
                                },
                                {
                                    "Group name": "Brown Adipose Tissue Dysfunction and Impaired Energy Metabolism in Muscle",
                                    "Reason": "Brown adipose tissue (BAT) plays a crucial role in thermogenesis and energy expenditure. Dysfunction of BAT can lead to impaired energy metabolism in other tissues, including muscle.",
                                    "Relevance score": 3,
                                    "Impact score": 4,
                                    "Novelty score": 4,
                                    "Relevance": "BAT dysfunction can affect exercise capacity by limiting energy availability and impairing muscle function.",
                                    "Impact": "Identifying the mechanisms underlying BAT dysfunction and its impact on muscle metabolism could lead to novel therapeutic strategies for improving energy expenditure and exercise performance.",
                                    "Novelty": "The role of BAT in regulating muscle metabolism and exercise capacity is an emerging area of research.",
                                    "Known genes": [
                                        "UCP1: A mitochondrial protein unique to BAT that mediates thermogenesis.",
                                        "PPARGC1A: Regulates BAT differentiation and function.",
                                        "DIO2: Converts T4 to T3, the active form of thyroid hormone, which stimulates BAT activity.",
                                        "NRF1: A transcription factor that regulates mitochondrial biogenesis in BAT.",
                                        "PRDM16: A master regulator of BAT development."
                                    ],
                                    "Testable Hypotheses": [
                                        "Does cold exposure or pharmacological activation of BAT improve muscle mitochondrial function and exercise capacity?",
                                        "Does transplantation of BAT into individuals with impaired energy metabolism improve systemic metabolic parameters and muscle function?",
                                        "Does targeted disruption of UCP1 in BAT impair muscle glucose uptake and exercise performance?"
                                    ],
                                    "Evidence & Search Strategy": [
                                        "(brown adipose OR BAT) AND (energy metabolism OR thermogenesis) AND (muscle OR skeletal muscle)",
                                        "brown adipose tissue muscle metabolism exercise",
                                        "BAT dysfunction energy expenditure muscle function",
                                        "PubMed: brown adipose tissue skeletal muscle interaction",
                                        "Google Scholar: BAT exercise capacity"
                                    ],
                                    "terms": [
                                        "t69-brown-adipose male 8w down associated with skeletal muscle disease",
                                        "t69-brown-adipose male 8w down associated with disorder of energy metabolism",
                                        "t69-brown-adipose male 8w down associated with genetic skeletal muscle disease",
                                        "t69-brown-adipose male 8w down associated with neuromuscular disease",
                                        "t69-brown-adipose male 8w down associated with muscular lipidosis"
                                    ]
                                },
                                {
                                    "Group name": "Genetic Predisposition to Neuromuscular and Cardiac Dysfunction",
                                    "Reason": "Genetic factors play a significant role in the development of neuromuscular and cardiac diseases, which can impact exercise capacity and lung function.",
                                    "Relevance score": 4,
                                    "Impact score": 4,
                                    "Novelty score": 2,
                                    "Relevance": "Understanding the genetic basis of these diseases is crucial for identifying individuals at risk and developing targeted interventions.",
                                    "Impact": "Identifying specific genetic variants that predispose to neuromuscular and cardiac dysfunction could lead to personalized approaches to improve exercise performance and overall health.",
                                    "Novelty": "The genetic basis of many neuromuscular and cardiac diseases is well-established, but the specific genes and variants involved in exercise capacity are still being investigated.",
                                    "Known genes": [
                                        "DMD: Encodes dystrophin, a protein essential for muscle fiber integrity. Mutations in DMD cause Duchenne muscular dystrophy.",
                                        "LMNA: Encodes lamin A/C, a nuclear envelope protein. Mutations in LMNA cause dilated cardiomyopathy and muscular dystrophy.",
                                        "MYH7: Encodes beta-myosin heavy chain, a major component of cardiac muscle. Mutations in MYH7 cause hypertrophic cardiomyopathy.",
                                        "ACTA1: Encodes alpha-actin, a major component of skeletal muscle. Mutations in ACTA1 cause congenital myopathies.",
                                        "RYR1: Encodes ryanodine receptor 1, a calcium release channel in skeletal muscle. Mutations in RYR1 cause malignant hyperthermia and central core disease."
                                    ],
                                    "Testable Hypotheses": [
                                        "Does genetic screening for DMD mutations in newborns allow for earlier diagnosis and intervention to improve muscle function and exercise capacity?",
                                        "Does gene therapy targeting LMNA mutations in individuals with dilated cardiomyopathy improve cardiac function and exercise tolerance?",
                                        "Does pharmacological modulation of RYR1 activity in individuals with malignant hyperthermia prevent exercise-induced muscle damage?"
                                    ],
                                    "Evidence & Search Strategy": [
                                        "(genetic OR inherited) AND (neuromuscular disease OR cardiomyopathy) AND (exercise OR physical activity)",
                                        "genetic basis neuromuscular disease exercise",
                                        "inherited cardiomyopathy exercise capacity",
                                        "PubMed: genetic mutations neuromuscular disease",
                                        "Google Scholar: genetic cardiomyopathy exercise performance"
                                    ],
                                    "terms": [
                                        "gtex adipose-sc age down associated with genetic skeletal muscle disease",
                                        "muscle - skeletal female 40-49 up associated with genetic skeletal muscle disease",
                                        "t69-brown-adipose male 8w down associated with genetic skeletal muscle disease",
                                        "gtex adipose-sc age down associated with qualitative or quantitative defects of alpha-actin",
                                        "gtex adipose-sc age down associated with distal arthrogryposis"
                                    ]
                                },
                                {
                                    "Group name": "Lipid Metabolism and Muscle Function",
                                    "Reason": "Lipid metabolism plays a crucial role in muscle function, providing energy for contraction and influencing muscle fiber composition.",
                                    "Relevance score": 4,
                                    "Impact score": 4,
                                    "Novelty score": 3,
                                    "Relevance": "Understanding the relationship between lipid metabolism and muscle function is essential for optimizing exercise performance and preventing muscle-related diseases.",
                                    "Impact": "Identifying specific lipid metabolites that influence muscle function could lead to novel dietary or pharmacological interventions to improve exercise capacity and muscle health.",
                                    "Novelty": "The importance of lipid metabolism for muscle function is well-established, but the specific lipid species and pathways involved in different types of exercise and muscle diseases are still being investigated.",
                                    "Known genes": [
                                        "CPT1A: A mitochondrial enzyme that transports fatty acids into the mitochondria for oxidation.",
                                        "ACADVL: A mitochondrial enzyme involved in the beta-oxidation of long-chain fatty acids.",
                                        "FABP3: A fatty acid-binding protein that facilitates fatty acid transport within muscle cells.",
                                        "LPL: An enzyme that hydrolyzes triglycerides in lipoproteins, providing fatty acids for muscle uptake.",
                                        "PPARs: A family of transcription factors that regulate lipid metabolism and muscle fiber type."
                                    ],
                                    "Testable Hypotheses": [
                                        "Does increasing dietary fat intake improve muscle endurance and exercise capacity in individuals with impaired fatty acid oxidation?",
                                        "Does pharmacological activation of PPARs in muscle improve lipid metabolism and exercise performance?",
                                        "Does targeted disruption of CPT1A in muscle impair fatty acid oxidation and exercise capacity?"
                                    ],
                                    "Evidence & Search Strategy": [
                                        "(lipid metabolism OR fatty acid oxidation) AND (muscle OR skeletal muscle) AND (exercise OR physical activity)",
                                        "lipid metabolism muscle function exercise",
                                        "fatty acid oxidation muscle endurance",
                                        "PubMed: lipid metabolism skeletal muscle",
                                        "Google Scholar: fatty acid oxidation exercise capacity"
                                    ],
                                    "terms": [
                                        "muscle - skeletal female 40-49 up associated with metabolic myopathy",
                                        "t69-brown-adipose male 8w down associated with muscular lipidosis",
                                        "gtex adipose-vo mondo 0007915 up associated with monounsaturated fatty acids; 16:1, 18:1 measurement",
                                        "gtex adipose-vo mondo 0002041 up associated with fatty acid measurement",
                                        "gtex adipose-vo mhpllabs up associated with lipid measurement"
                                    ]
                                },
                                {
                                    "Group name": "Inflammation and Muscle Dysfunction",
                                    "Reason": "Chronic inflammation can impair muscle function by promoting muscle wasting, reducing muscle strength, and impairing muscle regeneration.",
                                    "Relevance score": 3,
                                    "Impact score": 4,
                                    "Novelty score": 3,
                                    "Relevance": "Inflammation can affect exercise capacity by limiting muscle function and increasing fatigue.",
                                    "Impact": "Identifying the specific inflammatory pathways that impair muscle function could lead to novel anti-inflammatory therapies to improve exercise performance and muscle health.",
                                    "Novelty": "The role of inflammation in muscle dysfunction is well-established, but the specific inflammatory mediators and pathways involved in different types of muscle diseases and exercise are still being investigated.",
                                    "Known genes": [
                                        "TNF: A pro-inflammatory cytokine that promotes muscle wasting.",
                                        "IL6: A pro-inflammatory cytokine that can both promote and inhibit muscle growth, depending on the context.",
                                        "NFKB: A transcription factor that regulates the expression of many inflammatory genes.",
                                        "STAT3: A transcription factor that is activated by inflammatory cytokines and regulates muscle protein synthesis.",
                                        "FOXO3: A transcription factor that regulates muscle protein degradation."
                                    ],
                                    "Testable Hypotheses": [
                                        "Does pharmacological inhibition of TNF signaling improve muscle strength and exercise capacity in individuals with chronic inflammation?",
                                        "Does exercise training reduce systemic inflammation and improve muscle function?",
                                        "Does targeted disruption of NFKB signaling in muscle prevent inflammation-induced muscle wasting?"
                                    ],
                                    "Evidence & Search Strategy": [
                                        "(inflammation OR inflammatory cytokines) AND (muscle OR skeletal muscle) AND (exercise OR physical activity)",
                                        "inflammation muscle dysfunction exercise",
                                        "inflammatory cytokines muscle wasting",
                                        "PubMed: inflammation skeletal muscle",
                                        "Google Scholar: inflammatory cytokines exercise capacity"
                                    ],
                                    "terms": [
                                        "adipose - visceral (omentum) male 20-29 up associated with eosinophil percentage of leukocytes",
                                        "adipose - visceral (omentum) male 20-29 up associated with eosinophil percentage of granulocytes",
                                        "gtex adipose-sc mhblddnd up associated with dilated cardiomyopathy  strict definition",
                                        "gtex adipose-sc mhblddnd up associated with dilated cardiomyopathy",
                                        "gtex adipose-sc mhblddnd up associated with arthrogryposis syndrome"
                                    ]
                                }
                            ]
                        }
        }
    },
    created() {},
    mounted() {
        console.log("mounted", this.sectionConfig);
        //revealing the most fundamentally new mechanistic insights
        if(!!this.utils.keyParams['focus']) {
            this.searchFocus = this.utils.keyParams['focus'];
        }
    },
    computed: {
        parsedSummary() {
            if (!this.summary) return null;
            
            try {
                // Extract JSON from the summary string
                const cleanedSummary = this.utils.dataConvert.extractJson(this.summary);
                // Parse the JSON string to an object
                return cleanedSummary;
            } catch (error) {
                console.error("Failed to parse summary JSON:", error);
                return null;
            }
        }
    },
    watch: {
        dataset(to, from) {
            if(!!this.utils.keyParams['focus']) {
                this.searchFocus = this.utils.keyParams['focus'];
            } else {
                this.searchFocus = "";
            }
        },
        summary(CONTENT) {
            console.log("summary updated",CONTENT);
        },
        searchFocus(to, from) {
            if(to != from) {
                this.summary = "";
            }
        }
    },
    methods: {

        async queryLLM() {
            this.summary = "Call made to LLM.";
            this.loading = true;
            
            try {
                // Use the utility function
                const result = await this.utils.llmUtils.queryLLM({
                    summaryConfig: this.summaryConfig,
                    dataset: this.dataset,
                    searchFocus: this.searchFocus,
                    utils: this.utils
                });

                if (result.success) {
                    this.summary = result.data;
                } else {
                    this.summary = `Error: Failed to get response from LLM. ${result.error}`;
                }
                
            } catch (error) {
                console.error('Error in queryLLM:', error);
                this.summary = `Error: Failed to get response from LLM. ${error.message}`;
            } finally {
                // Always ensure loading is set to false, even if there's an error
                this.loading = false;
            }
        },
    }
})

$(function () { });
</script>

<style scoped>
.llm-query-container {
    margin-top: 20px;
    background-color: #f5f5f5;
    padding: 15px;
    border-radius: 5px;
}

.llm-query-ui-container {
    text-align: center;
}

.llm-query-contents-container {
    vertical-align: bottom;
    padding: 15px;
}

.search-focus-input {
    width: 25% !important;
    display: inline-block;
    margin: 0 15px 0 7px;
}
</style>