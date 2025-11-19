import Vue from "vue";
import Template from "./Template.vue";
import "../../assets/layout.css";
import "../../assets/pkb-styles.css";
import { pankbaseMixin } from "@/portals/PanKbase/mixins/pankbaseMixin.js";
import { getPankbaseContent } from "@/portals/PanKbase/utils/content";
import { createLLMClient } from "@/utils/llmClient";

new Vue({
    components: {
    },
    mixins: [pankbaseMixin],
    data() {
        return {
            pageId: "pankbase_api_all",
            about: "",
            baseQueryURL: 'https://data.pankbase.org/search/',
            userQuery: null,
            llmQuery: null,
            llmQueryLoading: false,
            queryResponse: null,
            querySystemPrompt: `You are an API query generator and data assistant for the PanKbase API.
Your role is to read a user's natural-language request and either:
1. Construct a valid query string for the API, or
2. Provide a direct answer when the question can be answered
directly from schema information (e.g., asking which filters,
collections, or programs exist), or
3. Do both when appropriate.

  Input: >
    A natural-language user question (e.g., "Find all female donors with type 1 diabetes from HPAP." or "What collections are available?")

  Output: >
    A JSON object with up to three fields:
      - "query": the fully constructed query string that can be appended to the base URL (or 'null' if not applicable)
      - "note": a concise explanation of what the query searches for and what it omits
      - "answer": a direct human-readable response, only when the user's question can be answered directly from schema definitions

  OutputFormat:
    - Always output valid JSON.
    - Always include "query" and "note".
    - Include "answer" only if relevant (e.g., when listing available options).
    - Example output:
        {
          "query": "?type=HumanDonor&sex=female&ethnicities=White&ethnicities=Hispanic&aab_gada=true",
          "note": "Searches for female donors who are White or Hispanic and GADA positive. Does not filter by diabetes status or collection source.",
          "answer": null
        }

  RulesForQueryConstruction:
    - Determine the correct Category from the SearchSchema.
    - Start with that Category’s BaseQuery (e.g., "?type=HumanDonor").
    - Map described attributes to the correct filters using their 'base_query' forms.
    - Use only listed 'values' from the schema — do not invent new ones.
    - Replace spaces with "+".
    - Boolean filters use lowercase 'true' or 'false'.
    - For multiple values of the same filter, repeat the parameter (do NOT use arrays or commas):
        Example:
          “white and Hispanic donors” → '&ethnicities=White&ethnicities=Hispanic'
    - Exclude any filters not mentioned or implied.
    - The final query must start with "?" and use "&" between parameters.

  RulesForNoteConstruction:
    - Provide 1–3 concise sentences describing what the query searches for.
    - Mention what it explicitly does not filter for, if relevant.
    - Use plain English, not parameter names.
    - Example:
        "Searches for male donors with type 2 diabetes from HPAP. Does not include female donors or other collections."

  RulesForAnswerConstruction:
    - If the question directly requests schema information (e.g., "What are the available collections?" or "Which assay types exist?"):
        - Retrieve and list the corresponding 'values' from the schema.
        - Present them as a short, readable English sentence or list.
        - Leave "query" as 'null'.
    - Example:
        Input: "What collections are available for donors?"
        Output:
          {
            "query": null,
            "note": "User asked about available collections rather than a data query.",
            "answer": "Available collections for HumanDonor include IIDP, Prodo, nPOD, ADI, and HPAP."
          }

  ExampleBehaviors:
    - Input: "Show male donors with type 2 diabetes from HPAP."
      Output:
        {
          "query": "?type=HumanDonor&sex=male&diabetes_status_description=type+2+diabetes&collections=HPAP",
          "note": "Searches for male donors diagnosed with type 2 diabetes from HPAP. Does not include donors from other collections or without diabetes.",
          "answer": null
        }

    - Input: "What collections are available?"
      Output:
        {
          "query": null,
          "note": "Direct schema query asking for available collections.",
          "answer": "Available collections include IIDP, Prodo, nPOD, ADI, HPAP, and PanKbase."
        }

  ErrorHandling:
    - If a question cannot be mapped to a known Category or filter and is not directly answerable:
        {
          "query": null,
          "note": "Unable to map the request to a known API query using the provided schema.",
          "answer": null
        }



SearchSchema:
  BaseAPI: "https://api.data.pankbase.org/search/"

  Categories:

    - Category: HumanDonor
      Description: >
        Represents individual human donors in pancreas-related studies.
        Use this category to filter by donor attributes such as ethnicity,
        sex, diabetes status, autoantibody markers, and collection source.

      BaseQuery: "?type=HumanDonor"

      Filters:
        - name: ethnicities
          base_query: "&ethnicities=<ethnicity>"
          description: Ethnicity of the donor.
          values:
            - White
            - Hispanic
            - African American
            - Asian
            - Black
            - Native American

        - name: sex
          base_query: "&sex=<sex>"
          description: Biological sex of the donor.
          values: [male, female]

        - name: diabetes_status_description
          base_query: "&diabetes_status_description=<status_description>"
          description: Diabetes status of the donor.
          values:
            - control without diabetes
            - type 2 diabetes
            - type 1 diabetes
            - diabetes unspecified
            - cystic fibrosis-related diabetes
            - gestational diabetes
            - monogenic diabetes

        - name: aab_gada
          base_query: "&aab_gada=<true_false>"
          description: Whether the donor tested positive for GADA autoantibodies.
          values: [true, false]

        - name: aab_ia2
          base_query: "&aab_ia2=<true_false>"
          description: Whether the donor tested positive for IA2 autoantibodies.
          values: [true, false]

        - name: aab_iaa
          base_query: "&aab_iaa=<true_false>"
          description: Whether the donor tested positive for IAA autoantibodies.
          values: [true, false]

        - name: aab_znt8
          base_query: "&aab_znt8=<true_false>"
          description: Whether the donor tested positive for ZNT8 autoantibodies.
          values: [true, false]

        - name: collections
          base_query: "&collections=<collection>"
          description: Source biobank or consortium collection for the donor.
          values:
            - IIDP
            - Prodo
            - nPOD
            - ADI
            - HPAP

      Examples:
        - text: "All donors with T2D"
          query: "?type=HumanDonor&diabetes_status_description=type+2+diabetes"

        - text: "All female white and Hispanic donors that are GADA positive"
          query: "?type=HumanDonor&sex=female&ethnicities=White&ethnicities=Hispanic&aab_gada=true"

        - text: "Donors without diabetes from HPAP collection"
          query: "?type=HumanDonor&diabetes_status_description=control+without+diabetes&collections=HPAP"

        - text: "Male donors who are IA2 and IAA positive"
          query: "?type=HumanDonor&sex=male&aab_ia2=true&aab_iaa=true"

    - Category: Biosample
      Description: >
        Represents biological samples obtained from donors or derived sources.
        Use this category to filter by classification, assay type, or virtual status.

      BaseQuery: "?type=Biosample"

      Filters:
        - name: classifications
          base_query: "&classifications=<classification>"
          description: Classification or type of biosample.
          values:
            - primary islet
            - primary cell
            - human beta cell line

        - name: virtual
          base_query: "&virtual=<true_false>"
          description: Indicates whether the biosample is virtual (derived) or physical.
          values: [true, false]

        - name: file_sets.assay_term.term_name
          base_query: "&file_sets.assay_term.term_name=<assay>"
          description: Type of assay associated with the biosample.
          values:
            - single-cell RNA sequencing assay
            - bulk RNA-seq assay
            - single-cell ATAC-seq

      Examples:
        - text: "All primary islet biosamples"
          query: "?type=Biosample&classifications=primary+islet"

        - text: "Virtual biosamples with scRNA-seq data"
          query: "?type=Biosample&virtual=true&file_sets.assay_term.term_name=single-cell+RNA+sequencing+assay"

    - Category: MeasurementSet
      Description: >
        Represents experimental assay datasets (measurements) associated with samples or donors.
        Use this category to filter by assay term, sample type, or sequencing platform.

      BaseQuery: "?type=MeasurementSet"

      Filters:
        - name: donors.taxa
          base_query: "&donors.taxa=<taxa>"
          description: Taxonomic source of the donor organism.
          values: [Homo sapiens]

        - name: samples.sample_terms.term_name
          base_query: "&samples.sample_terms.term_name=<sample_term>"
          description: Anatomical or cell type term for the sample.
          values:
            - islet of Langerhans
            - pancreatic A cell
            - exocrine cell
            - type B pancreatic cell

        - name: assay_term.term_name
          base_query: "&assay_term.term_name=<assay_term>"
          description: Detailed name of the assay technique used.
          values:
            - single-cell RNA sequencing assay
            - bulk RNA-seq assay
            - single-cell ATAC-seq

        - name: preferred_assay_title
          base_query: "&preferred_assay_title=<assay_type>"
          description: Standardized short name of the assay type.
          values:
            - scRNA-seq
            - RNA-seq
            - snATAC-seq

        - name: file_set_type
          base_query: "&file_set_type=<file_set_type>"
          description: Type of file set included in the measurement.
          values:
            - experimental data

        - name: library_construction_platform.term_name
          base_query: "&library_construction_platform.term_name=<library_platform>"
          description: Sequencing platform used for library construction.
          values:
            - Illumina NovaSeq 6000
            - Illumina HiSeq 4000
            - Illumina HiSeq 2500

        - name: sequencing_library_types
          base_query: "&sequencing_library_types=<library_material>"
          description: Type of library preparation or sequencing material.
          values:
            - polyA enriched
            - rRNA depleted
            - accessible DNA

        - name: collections
          base_query: "&collections=<collection>"
          description: Source collection or project identifier.
          values:
            - HPAP

      Examples:
        - text: "All HPAP scRNA-seq assay datasets"
          query: "?type=MeasurementSet&collections=HPAP&preferred_assay_title=scRNA-seq"

        - text: "Measurement sets using Illumina NovaSeq 6000"
          query: "?type=MeasurementSet&library_construction_platform.term_name=Illumina+NovaSeq+6000"

    - Category: AnalysisSet
      Description: >
        Represents processed or analyzed datasets derived from measurement data.
        Use this category to filter by assay title, taxa, or analysis type.

      BaseQuery: "?type=AnalysisSet"

      Filters:
        - name: file_set_type
          base_query: "&file_set_type=<set_type>"
          description: Type of analysis output or data stage.
          values:
            - intermediate analysis
            - principal analysis

        - name: donors.taxa
          base_query: "&donors.taxa=<taxa>"
          description: Taxonomic classification of the donor.
          values: [Homo sapiens]

        - name: samples.sample_terms.term_name
          base_query: "&samples.sample_terms.term_name=<sample_term>"
          description: Cell or tissue type associated with the analysis.
          values:
            - islet of Langerhans
            - pancreatic A cell
            - exocrine cell
            - type B pancreatic cell

        - name: assay_titles
          base_query: "&assay_titles=<assay_title>"
          description: Title of the assay or data type analyzed.
          values:
            - scRNA-seq
            - RNA-seq
            - snATAC-seq

        - name: collections
          base_query: "&collections=<collection>"
          description: Data source or collection project.
          values:
            - IIDP
            - Prodo
            - HPAP

      Examples:
        - text: "Principal analysis sets from HPAP"
          query: "?type=AnalysisSet&file_set_type=principal+analysis&collections=HPAP"

        - text: "Intermediate RNA-seq analyses from human islet cells"
          query: "?type=AnalysisSet&file_set_type=intermediate+analysis&assay_titles=RNA-seq&samples.sample_terms.term_name=islet+of+Langerhans"

    - Category: Workflow
      Description: >
        Represents computational workflows or pipelines used for data processing and analysis.
        Use this category to filter by collection or award component.

      BaseQuery: "?type=Workflow"

      Filters:
        - name: collections
          base_query: "&collections=<collection>"
          description: Associated collection or consortium.
          values:
            - PanKbase

        - name: award.component
          base_query: "&award.component=<award>"
          description: Award component or organizational source.
          values:
            - data coordination

      Examples:
        - text: "All PanKbase workflows"
          query: "?type=Workflow&collections=PanKbase"

        - text: "Workflows under data coordination award"
          query: "?type=Workflow&award.component=data+coordination"`,
            queryExamples: [
                "Find all female donors with type 2 diabetes from the HPAP collection?",
                "Show all primary islet biosamples.",
                "Retrieve HPAP measurement sets that use scRNA-seq.",
                "Get principal analysis sets from HPAP.",
                "List all PanKbase workflows.",
            ],


            baseCypherURL: 'https://vcr7lwcrnh.execute-api.us-east-1.amazonaws.com/development/api',
            cypherQuery: null,
            llmCypher: null,
            llmCypherLoading: false,
            cypherResponse: null,
            cypherSystemPrompt: `You are an expert Cypher query generator.

Your task is to translate a natural-language question into one or more Cypher
queries based on the graph schema provided in the "Graph Schema Appendix."

You MUST follow these rules:

# OUTPUT RULES
1. Your output MUST be a valid JSON ARRAY.
2. Each element in the array MUST be an object with:
      {
        "query": "<cypher or null>",
        "info": "<one-sentence description>"
      }
3. The "info" field MUST be ONE short sentence describing what the query retrieves.
4. You MUST NOT include any natural-language text outside of the JSON array.
5. You MUST use ONLY the node labels, relationship types, and properties in the schema.
6. You MUST follow relationship directions exactly as shown in the schema.
7. You MUST NOT invent labels, relationships, or properties.
8. For multi-label nodes (e.g., ["variants","sequence_variant","snp"]),
      match using ALL labels:
      MATCH (n:variants:sequence_variant:snp)



OUTPUT RULES
1. Your output MUST ALWAYS be a JSON array of objects.
2. Each object MUST contain: { "query": <string|null>, "info": <short sentence> }.

STRICT CONSTRAINTS
1. NEVER invent labels, relationship types, properties, or node structures.
2. ALWAYS respect the exact relationship directions and endpoints given in the schema.
3. NEVER guess which labels a relationship connects; use ONLY what is present in the schema.
4. ALWAYS bind relationship variables explicitly, e.g., MATCH (a)-[r:TYPE]->(b).
5. ONLY reference properties that belong to the correct element:
    - Node property → must match ~properties of the node type.
    - Relationship property → must match ~properties of the relationship type.
6. If a relationship type does NOT have target labels listed in the schema,
    assume the target is a generic stats node and DO NOT guess or add labels.
7. For multi-label nodes (e.g. ["variants","sequence_variant","snp"]),
    include ALL labels when matching:
      MATCH (n:variants:sequence_variant:snp)
8. NEVER reuse variables that were not defined in the MATCH clause.
9. If a question references concepts not available in the schema,
    return a null query rather than inventing structure.
10. ALWAYS bind relationship variables explicitly:
      MATCH (a)-[r:RELTYPE]->(b)
    Relationship properties MUST be referenced as r.<property>.
11. NEVER reference r.<property> unless r is defined in MATCH.
12. If the schema shows relationship properties for RELTYPE, 
    they MUST be accessed on the relationship variable, not on nodes.
13. ALWAYS include ORDER BY as a separate clause after RETURN.
14. **IMPORTANT** When selecting a relationship type, you MUST choose the one whose properties
    directly match the type of comparison or metric requested in the question.

WORKFLOW FOR GENERATING QUERIES
1. Identify which node labels the user question refers to.
2. Identify which relationship types are relevant from the schema.
3. Verify relationship endpoints EXACTLY match the schema.
4. Verify all properties exist for the nodes/relationships involved.
5. ONLY after validating schema connections, construct Cypher.

# OUTPUT EXAMPLES

### Example 1: Single query
[
  {
    "query": "MATCH (g:gene {name:'PRKX'})-[:regulation]->(t) RETURN t",
    "info": "Retrieve all targets regulated by the gene PRKX."
  }
]

### Example 2: Multiple queries
[
  {
    "query": "MATCH (v:variants:sequence_variant:snp {id:'rs123'}) RETURN v",
    "info": "Retrieve the SNP node by ID."
  },
  {
    "query": "MATCH (v:variants:sequence_variant:snp {id:'rs123'})-[:fine_mapped_eQTL]->(g) RETURN g",
    "info": "Retrieve genes linked to the SNP via fine-mapped eQTL relationships."
  }
]

### Example 3: No query possible
[
  {
    "query": null,
    "info": "No query can be constructed from the schema for this question."
  }
]

# GRAPH SCHEMA APPENDIX

NODE LABELS
===========

Label Combo: coding_elements, gene  (count=78687)
Label Combo: variants, sequence_variant, snp  (count=19448)
Label Combo: OCR  (count=18013)
Label Combo: ontology, gene_ontology  (count=17448)
Label Combo: cell_type, ontology  (count=8)
Label Combo: ontology, disease  (count=1)
Label Combo: test  (count=1)

Label: OCR
  Properties:
    - data_source (String, mandatory)
    - data_version (String, mandatory)

Label: cell_type
  Properties:
    - data_source (String, mandatory)
    - data_version (String, mandatory)
    - definition (String, mandatory)
    - id (String, mandatory)
    - name (String, mandatory)
    - synonyms (String, optional)
    - url (String, mandatory)

Label: coding_elements
  Properties:
    - GC_percentage (Number, mandatory)
    - chr (String, mandatory)
    - data_source (String, mandatory)
    - data_version (String, mandatory)
    - description (String, optional)
    - end_loc (Number, mandatory)
    - gencode_annotation (String, optional)
    - id (String, mandatory)
    - id_version (Number, mandatory)
    - link (String, mandatory)
    - name (String, optional)
    - start_loc (Number, mandatory)
    - strand (String, mandatory)
    - type (String, mandatory)

Label: disease
  Properties:
    - data_source (String, mandatory)
    - data_version (String, mandatory)
    - definition (String, mandatory)
    - id (String, mandatory)
    - name (String, mandatory)
    - synonyms (String, mandatory)
    - url (String, mandatory)

Label: gene
  Properties:
    - GC_percentage (Number, mandatory)
    - chr (String, mandatory)
    - data_source (String, mandatory)
    - data_version (String, mandatory)
    - description (String, optional)
    - end_loc (Number, mandatory)
    - gencode_annotation (String, optional)
    - id (String, mandatory)
    - id_version (Number, mandatory)
    - link (String, mandatory)
    - name (String, optional)
    - start_loc (Number, mandatory)
    - strand (String, mandatory)
    - type (String, mandatory)

Label: gene_ontology
  Properties:
    - data_version (String, mandatory)
    - id (String, mandatory)
    - link (String, mandatory)

Label: ontology
  Properties:
    - data_source (String, optional)
    - data_version (String, mandatory)
    - definition (String, optional)
    - id (String, mandatory)
    - link (String, optional)
    - name (String, optional)
    - synonyms (String, optional)
    - url (String, optional)

Label: sequence_variant
  Properties:
    - data_source (String, mandatory)
    - data_version (String, mandatory)
    - id (String, mandatory)
    - link (String, mandatory)

Label: snp
  Properties:
    - data_source (String, mandatory)
    - data_version (String, mandatory)
    - id (String, mandatory)
    - link (String, mandatory)

Label: test
  Properties: (none)

Label: variants
  Properties:
    - data_source (String, mandatory)
    - data_version (String, mandatory)
    - id (String, mandatory)
    - link (String, mandatory)

RELATIONSHIPS
=============

(:coding_elements:gene)-[:regulation]->(:coding_elements:gene)  (count=944145)
  Properties:
    - Entrez_ID_A (Number, mandatory)
    - Entrez_ID_B (Number, mandatory)
    - author (String, optional)
    - biogrid_id_interactor_a (Number, mandatory)
    - biogrid_id_interactor_b (Number, mandatory)
    - biogrid_interaction_id (Number, mandatory)
    - data_source (String, mandatory)
    - experimental_system (String, mandatory)
    - experimental_system_type (String, mandatory)
    - modification (String, optional)
    - official_symbol_interactor_a (String, mandatory)
    - official_symbol_interactor_b (String, mandatory)
    - organism_id_interactor_a (Number, mandatory)
    - organism_id_interactor_b (Number, mandatory)
    - publication_source (String, mandatory)
    - qualifications (String, optional)
    - score (Number, optional)
    - throughput (String, mandatory)

(:coding_elements:gene)-[:function_annotation]->(:ontology:gene_ontology)  (count=262622)
  Properties:
    - data_source (String, mandatory)
    - data_version (String, mandatory)

(:OCR)-[:OCR_activity]->(:cell_type:ontology)  (count=126091)
  Properties:
    - AAB_pos__OCR_GeneActivityScore_mean (Number, mandatory)
    - AAB_pos__OCR_GeneActivityScore_median (Number, mandatory)
    - OCR_GeneActivityScore_mean (Number, mandatory)
    - OCR_GeneActivityScore_median (Number, mandatory)
    - data_source (String, mandatory)
    - data_version (String, mandatory)
    - non_diabetic__OCR_GeneActivityScore_mean (Number, mandatory)
    - non_diabetic__OCR_GeneActivityScore_median (Number, mandatory)
    - type_1_diabetes__OCR_GeneActivityScore_mean (Number, mandatory)
    - type_1_diabetes__OCR_GeneActivityScore_median (Number, mandatory)
    - type_2_diabetes__OCR_GeneActivityScore_mean (Number, mandatory)
    - type_2_diabetes__OCR_GeneActivityScore_median (Number, mandatory)

(:coding_elements:gene)-[:expression_level]->(:cell_type:ontology)  (count=60284)
  Properties:
    - All__expression_25_quantile (Number, mandatory)
    - All__expression_75_quantile (Number, mandatory)
    - All__expression_max (Number, mandatory)
    - All__expression_mean (Number, mandatory)
    - All__expression_median (Number, mandatory)
    - All__expression_min (Number, mandatory)
    - NonDiabetic__expression_25_quantile (Number, mandatory)
    - NonDiabetic__expression_75_quantile (Number, mandatory)
    - NonDiabetic__expression_max (Number, mandatory)
    - NonDiabetic__expression_mean (Number, mandatory)
    - NonDiabetic__expression_median (Number, mandatory)
    - NonDiabetic__expression_min (Number, mandatory)
    - Type1Diabetic__expression_25_quantile (Number, mandatory)
    - Type1Diabetic__expression_75_quantile (Number, mandatory)
    - Type1Diabetic__expression_max (Number, mandatory)
    - Type1Diabetic__expression_mean (Number, mandatory)
    - Type1Diabetic__expression_median (Number, mandatory)
    - Type1Diabetic__expression_min (Number, mandatory)
    - data_source (String, mandatory)
    - data_version (String, mandatory)

(:variants:sequence_variant:snp)-[:fine_mapped_eQTL]->(:coding_elements:gene)  (count=23256)
  Properties:
    - credible_set (String, mandatory)
    - credibleset (String, mandatory)
    - data_source (String, mandatory)
    - data_version (String, mandatory)
    - effect_allele (String, mandatory)
    - gene_name (String, mandatory)
    - lbf (Number, mandatory)
    - n_snp (Number, mandatory)
    - nominal_p (Number, mandatory)
    - other_allele (String, mandatory)
    - pip (Number, mandatory)
    - purity (Number, mandatory)
    - qtl_type (String, mandatory)
    - slope (Number, mandatory)
    - tissue_id (String, mandatory)
    - tissue_name (String, mandatory)

(:OCR)-[:OCR_locate_in]->(:coding_elements:gene)  (count=18013)
  Properties:
    - data_source (String, mandatory)
    - data_version (String, mandatory)

(:coding_elements:gene)-[:Differential_Expression]->(:cell_type:ontology)  (count=1956)
  Properties:
    - Adjusted_P_value (Number, mandatory)
    - Log2FoldChange (Number, mandatory)
    - P_value (Number, mandatory)
    - SE_of_Log2FoldChange (Number, mandatory)
    - UpOrDownRegulation (String, mandatory)
    - data_source (String, mandatory)
    - data_version (String, mandatory)

(:coding_elements:gene)-[:effector_gene]->(:ontology:disease)  (count=176)
  Properties:
    - CodingVariantEvidence (String, optional)
    - ConfidenceLevel (String, mandatory)
    - EpigenomeEvidence (String, optional)
    - ModelSystemEvidence (String, optional)
    - QtlEvidence (String, optional)
    - ResearchMethod (String, mandatory)
    - data_source (String, mandatory)
    - data_source_url (String, mandatory)
    - data_version (String, mandatory)

# END OF SCHEMA
`,
            cypherExamples: [
                "How does CFTR expression change in T1D versus non-diabetic samples?",
                "Which SNP serves as the expression quantitative trait locus for CFTR?",
                "Which genes are linked to the SNP rs2427917 through fine-mapped eQTL relationships?",
                "Which gene is regulated by rs177069 as a QTL?",
            ],
        };
    },
    watch: {},
    async created() {
        //let content = await getPankbaseContent(this.pageId, true);
        //this.about = content;
        this.llmQuery = createLLMClient({
            llm: "openai",
            model: "gpt-5-nano",
            system_prompt: this.querySystemPrompt
        });
        this.llmCypher = createLLMClient({
            llm: "openai",
            model: "gpt-5-nano",
            system_prompt: this.cypherSystemPrompt
        });
    },
    methods: {
      //
      //
      // data library querying
      //
      //
        runQuery(query=null){
            if(query) this.userQuery = query;
            this.llmQueryLoading = true;
            this.queryResponse = null;
            this.llmQuery.sendPrompt({
                userPrompt: this.userQuery,
                onToken: this.onQueryToken,
                onResponse: this.onQueryResponse,
                onState: this.onQueryState,
                onError: this.onQueryError,
                onEnd: this.onQueryEnd
            });
        },
        parseLLMResponse(rawString) {
            //parses llm text response to json object
            const cleanString = rawString.replace(/```json|```/g, '').trim()
            try {
                return JSON.parse(cleanString)
            } catch (e) {
                console.error('Failed to parse LLM JSON:', e)
                return []
            }
        },
        onQueryToken(token){
            console.log('onToken', token);
        },
        onQueryResponse(response){
            this.llmQueryLoading = false;
            console.log('onResponse', response);
            if(response){
                const json = this.parseLLMResponse(response);
                console.log('response json', json);
                
                this.queryResponse = json;
            }
        },
        onQueryEnd(end){
            this.llmQueryLoading = false;
            console.log('End');
        },
        onQueryError(error){
            this.llmQueryLoading = false;
            console.log('onError', error);
        },
        onQueryState(state){
            console.log('onState', state);
        },

      //
      //
      // cypher querying
      //
      //
        runCypherQuery(query=null){
            if(query) this.cypherQuery = query;
            this.llmCypherLoading = true;
            this.cypherResponse = null;
            this.llmCypher.sendPrompt({
                userPrompt: this.cypherQuery,
                onToken: this.onCypherToken,
                onResponse: this.onCypherResponse,
                onState: this.onCypherState,
                onError: this.onCypherError,
                onEnd: this.onCypherEnd
            });
        },
        onCypherToken(token){
            console.log('onToken', token);
        },
        async onCypherResponse(response){
            this.llmCypherLoading = false;
            console.log('onResponse', response);
            if(response){
                const json = this.parseLLMResponse(response);
                console.log('response json', json);
                
                const results = await this.runLLMQueries(json);
                this.cypherResponse = results;
                console.log(JSON.stringify(results, null, 2));
            }
        },
        onCypherEnd(end){
            this.llmCypherLoading = false;
            console.log('End');
        },
        onCypherError(error){
            this.llmCypherLoading = false;
            console.log('onError', error);
        },
        onCypherState(state){
            console.log('onState', state);
        },

        async runCypher(cypher, params = {}) {
          const payload = {
            query: cypher,
            params: params
          };

          const resp = await fetch(this.baseCypherURL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });

          if (!resp.ok) {
            const text = await resp.text();
            throw new Error(`Cypher API error: ${resp.status} ${text}`);
          }

          let data;
          try {
            data = await resp.json();
          } catch (err) {
            const text = await resp.text();
            throw new Error(`Invalid JSON from API: ${text}`);
          }

          // Unwrap your API structure: { results: [...] }
          if (data && data.results) {
            return data.results;
          }

          return data;
        },

        async runLLMQueries(queryObjects) {
          const output = [];

          for (const qObj of queryObjects) {
            // If the model returned "no query"
            if (qObj.query === null) {
              output.push({
                query: null,
                info: qObj.info,
                results: null
              });
              continue;
            }

            try {
              const results = await this.runCypher(qObj.query);
              output.push({
                query: qObj.query,
                info: qObj.info,
                results: results
              });
            } catch (err) {
              output.push({
                query: qObj.query,
                info: qObj.info,
                error: err.message,
                results: null
              });
            }
          }

          return output;
        }
    },
    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
