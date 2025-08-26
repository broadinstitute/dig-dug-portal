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
            <div v-html="processSummary(summary)"></div>
        </div>
    </div>
  </div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";
import ResearchLoadingSpinner from "../ResearchLoadingSpinner.vue";
import ResearchDataTable from "@/components/researchPortal/ResearchDataTable.vue";

export default Vue.component("llm-summary", {
    props: ["dataset","summaryConfig","utils","sectionID","sectionConfig"],
    components: {
        ResearchLoadingSpinner,
        ResearchDataTable
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
        //revealing the most fundamentally new mechanistic insights
        if(!!this.utils.keyParams['focus']) {
            this.searchFocus = this.utils.keyParams['focus'];
        }
    },
    computed: {},
    watch: {
        'utils.keyParams.focus': {
            handler(newFocus) {
                if (newFocus !== undefined) {
                    this.searchFocus = newFocus;
                }
            },
            immediate: true
        }
    },
    methods: {
        processSummary(summary) {
            //console.log("summary", typeof summary);
            
            if (!summary || typeof summary !== 'string') {
                return summary;
            }
            
            // 1. Remove markdown code blocks (```json and ```)
            let cleanedSummary = this.utils.dataConvert.extractJson(summary);
            
            try {
                // 2. Parse the JSON and convert to readable HTML
                const jsonData = JSON.parse(cleanedSummary);
                return this.jsonToHtml(jsonData);
            } catch (error) {
                console.error("Failed to parse JSON:", error);
                // If JSON parsing fails, return the cleaned text as is
                return cleanedSummary;
            }
        },
        jsonToHtml(jsonData) {
            console.log("Processing JSON data:", jsonData);

            let jsonKeys = Object.keys(jsonData);
            let html = '<div class="analysis-summary">';

            jsonKeys.map(key => {

                if(key != this.summaryConfig['data in response']) {

                    let itemType = (typeof jsonData[key] == "object")? (!!Array.isArray(jsonData[key]))? "array" : "object":typeof jsonData[key];
                    
                    switch(itemType) {
                    case "object":

                        let itemKeys = Object.keys(jsonData[key]);

                        itemKeys.map(itemKey => {
                            if(key == this.summaryConfig['data in response']) {
                                html += `<div class="${itemKey.toLowerCase()}"><strong>${itemKey}:</strong> ${this.renderFilteredDatasetTable(jsonData[key][itemKey])}</div>`;
                            } else {
                                html += `<div class="${itemKey.toLowerCase()}"><strong>${itemKey}:</strong> ${jsonData[key][itemKey]}</div>`;
                            }
                        })

                        break;
                    case "array":

                        let rowType = (typeof jsonData[key][0] == "object")? (!!Array.isArray(jsonData[key][0]))? "array" : "object":typeof jsonData[key][0];

                        if(rowType == "object") {

                            let itemKeys = Object.keys(jsonData[key][0]);

                            jsonData[key].map(item => {
                                itemKeys.map(itemKey => {
                                    if(itemKey == this.summaryConfig['data in response']) {
                                        html += `<div class="${itemKey.toLowerCase()}"><strong>${itemKey}:</strong> ${this.renderFilteredDatasetTable(item[itemKey])}</div>`;
                                    } else {
                                        html += `<div class="${itemKey.toLowerCase()}"><strong>${itemKey}:</strong> ${item[itemKey]}</div>`;
                                    }
                                })
                            })

                        } else if(rowType == "array") {
                            let hIndex = 1;
                            jsonData[key].map(item => {
                                html += `<div class="${key.toLowerCase()}"><strong>${key + " " + hIndex}:</strong> ${item}</div>`;
                            })
                        } else {
                            html += `<div class="${key.toLowerCase()}"><strong>${key}:</strong> ${item.toString()}</div>`;
                        }

                        break;
                    default:
                        html += `<div class="${key.toLowerCase()}"><strong>${key}:</strong> ${jsonData[key]}</div>`;
                        break;
                    }
                    
                } else {
                    html += `<div class="${key.toLowerCase()}"><strong>${key}:</strong> ${this.renderFilteredDatasetTable(jsonData[key])}</div>`;
                }
                
            });

            html += '</div>';
            return html;
        },
        
        renderFilteredDatasetTable(keyItems) {
            if (!this.dataset || !Array.isArray(this.dataset) || this.dataset.length === 0) {
                return '<p class="no-data">No dataset available for filtering.</p>';
            }
            
            // Get the columns from summaryConfig
            const columns = this.summaryConfig['columns'];
            const columnsToRender = this.summaryConfig['columns to render'];
            /*if (columns.length === 0) {
                return '<p class="no-data">No columns configured for display.</p>';
            }*/
            
            // Filter dataset rows that contain any of the key items
            const filteredRows = this.dataset.filter(row => {
                return keyItems.some(keyItem => {
                    return columns.some(col => {
                        const cellValue = String(row[col] || '').toLowerCase();
                        const searchValue = String(keyItem).toLowerCase();
                        return cellValue.includes(searchValue) || searchValue.includes(cellValue);
                    });
                });
            });
            
            if (filteredRows.length === 0) {
                return '<p class="no-data">No matching data found for the key items.</p>';
            }
            
            // Create table HTML
            let tableHtml = '<div class="filtered-data-table">';
            tableHtml += '<h6>Key items in data:</h6>';
            tableHtml += '<div class="table-container">';
            tableHtml += '<table class="table table-striped data-table">';
            
            // Table header
            tableHtml += '<thead><tr>';
            columnsToRender.forEach(col => {
                tableHtml += `<th>${col}</th>`;
            });
            tableHtml += '</tr></thead>';
            
            // Table body
            tableHtml += '<tbody>';
            filteredRows.forEach((row, rowIndex) => {
                tableHtml += '<tr>';
                columnsToRender.forEach(col => {
                    const cellValue = row[col] || '';
                    tableHtml += `<td>${cellValue}</td>`;
                });
                tableHtml += '</tr>';
            });
            tableHtml += '</tbody>';
            tableHtml += '</table>';
            tableHtml += '</div>';
            tableHtml += `<p class="table-info">Showing ${filteredRows.length} of ${this.dataset.length} total rows</p>`;
            tableHtml += '</div>';
            
            return tableHtml;
        },

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