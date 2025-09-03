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
                if(this.searchFocus != this.utils.keyParams['focus']) {
                    this.utils.keyParams.set({focus: this.searchFocus});
                }

                let url = 'https://llm-dev.hugeamp.org/gemini';
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
                //prompt += 

                prompt += "Data to analyze: "+dataCollected;
                prompt += "Research context: " + this.searchFocus;

                let systemPrompt = `Your entire response must be a single, raw JSON object and nothing else. Do not include '''json markdown tags, explanations, or any text whatsoever before the opening { or after the closing '}. Use this exact JSON structure:  ${modelString}\n\n`;

                var payload = {
                    model: this.summaryConfig['model'],
                    systemPrompt: systemPrompt,
                    userPrompt: prompt,
                };

                var options = {
                    method: 'POST',
                    headers: {
                    'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                };

                const response = await fetch(url, options);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
                }

                const res = await response.json();
                console.log('*KCLLM response*', res);
                
                // Check if response has expected structure
                if (!res.data || !res.data[0] || !res.data[0].gemini_response) {
                    throw new Error('Invalid response structure from LLM service');
                }
                
                const data = res.data[0].gemini_response;
                this.summary = data;
                
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