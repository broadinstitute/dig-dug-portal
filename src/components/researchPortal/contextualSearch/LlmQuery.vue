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
    <div class="row">
        <div class="llm-query-contents-container col-md-12">
            <response-summary 
                :summaryContent="utils.dataConvert.extractJson(summary)" 
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
            searchFocus: ""
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
    computed: {},
    watch: {
        dataset(to, from) {
            if(!!this.utils.keyParams['focus']) {
                this.searchFocus = this.utils.keyParams['focus'];
            } else {
                this.searchFocus = "";
            }
        },
        summary(CONTENT) {
            console.log("summary updated");
        }
    },
    methods: {

        async queryLLM() {
            this.summary = "Call made to LLM.";
            this.loading = true;

            try {
                let dataCollected = ""
                this.summaryConfig['columns'].map( C => {
                    this.dataset.map((D,dIndex) => {
                        if(!!this.summaryConfig['rows limit'] && this.summaryConfig['rows limit'] !== 0 ) {
                            if(dIndex <= this.summaryConfig['rows limit']) {dataCollected += D[C]+", "};
                        } else {
                            dataCollected += D[C]+", "
                        };
                    })
                })

                // 1. Define your JSON object model
                const jsonModel =  this.summaryConfig['response json']

                // 2. Convert the object to a formatted string (with 2-space indentation)
                const modelString = JSON.stringify(jsonModel, null, 2);

                let prompt = this.summaryConfig['prompt']+'\n';
                prompt += `Your entire response must be a single, raw JSON object and nothing else. Do not include '''json markdown tags, explanations, or any text whatsoever before the opening { or after the closing '}. Use this exact JSON structure:  ${modelString}\n\n`;

                prompt += "Data to analyze: "+dataCollected;
                prompt += "Focus: " + this.searchFocus;
                //prompt += "Focus: "+(!!this.utils.keyParams['focus'])?this.utils.keyParams['focus']:"";

                // Remember to replace "YOUR_API_KEY" with your actual Google AI API key.
                const API_KEY = this.summaryConfig['api key'];
                const MODEL_NAME = this.summaryConfig['model'];

                async function callGeminiAPI(promptText,CONFIG) {
                    let url = CONFIG['url'];
                    url = url.replace('$api_key', API_KEY);
                    url = url.replace('$model', MODEL_NAME);

                    const requestBody = {
                        contents: [{
                            parts: [{
                                text: promptText
                            }]
                        }],
                    };

                    try {
                        const response = await fetch(url, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(requestBody),
                        });

                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }

                        const data = await response.json();
                        
                        // Check if we have a valid response with candidates
                        if (data.candidates && 
                            data.candidates.length > 0 && 
                            data.candidates[0].content && 
                            data.candidates[0].content.parts && 
                            data.candidates[0].content.parts.length > 0) {
                            
                            const generatedText = data.candidates[0].content.parts[0].text;
                            return generatedText;
                        } else if (data.candidates && 
                                   data.candidates.length > 0 && 
                                   data.candidates[0].content && 
                                   data.candidates[0].content.role === "model") {
                            
                            // The model responded but didn't generate content (possibly filtered)
                            console.warn("Model responded but no content generated. Response:", data);
                            return "The model responded but didn't generate any content. This might be due to content filtering.";
                        } else {
                            console.error("Unexpected API response structure:", data);
                            return "Error: Unexpected response structure from LLM";
                        }

                    } catch (error) {
                        console.error("Error calling LLM:", error);
                        return "Error: Failed to get response from LLM";
                    }
                }

                // Call the API and wait for the response
                this.summary = await callGeminiAPI(prompt, this.summaryConfig);
                
            } catch (error) {
                console.error("Error in queryLLM:", error);
                this.summary = "Error: Failed to process LLM request";
            } finally {
                // Always ensure loading is set to false, even if there's an error
                this.loading = false;
            }
        }
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
    border-top: 1px solid #cccccc;
}

.search-focus-input {
    width: 25% !important;
    display: inline-block;
    margin: 0 15px 0 7px;
}
</style>