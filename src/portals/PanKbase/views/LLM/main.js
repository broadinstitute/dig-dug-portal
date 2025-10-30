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
            ]
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
    },
    methods: {
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
    },
    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
