<template>
  <div>
    <div v-if="this.summaryConfig['search focus']">
        <div class="search-focus-wrapper">
            <input type="text" v-if="this.summaryConfig['search focus'].type == 'input'" v-model="searchFocus" placeholder="Search focus"/>
        </div>
    </div>
    <div @click="queryLLM()" class="btn btn-primary">{{ (!!this.summaryConfig['button label'])?this.summaryConfig['button label']:"Generate summary" }}</div>
    <research-loading-spinner :isLoading="loading" colorStyle="color"></research-loading-spinner>
    <div v-html="processSummary(summary)"></div>
  </div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";
import ResearchLoadingSpinner from "../ResearchLoadingSpinner.vue";

export default Vue.component("llm-summary", {
    props: ["dataset","summaryConfig","utils"],
    data() {
        return {
            summary: null,
            loading: false,
            searchFocus: ""
        }
    },
    created() {},
    mounted() {
        
        
        
    },
    computed: {},
    methods: {
        processSummary(summary) {
            //console.log("summary", typeof summary);
            
            if (!summary || typeof summary !== 'string') {
                return summary;
            }
            
            // 1. Remove markdown code blocks (```json and ```)
            let cleanedSummary = summary.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
            
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
                                html += `<div class="${itemKey}"><strong>${itemKey}:</strong> ${this.renderFilteredDatasetTable(jsonData[key][itemKey])}</div>`;
                            } else {
                                html += `<div class="${itemKey}"><strong>${itemKey}:</strong> ${jsonData[key][itemKey]}</div>`;
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
                                        html += `<div class="${itemKey}"><strong>${itemKey}:</strong> ${this.renderFilteredDatasetTable(item[itemKey])}</div>`;
                                    } else {
                                        html += `<div class="${itemKey}"><strong>${itemKey}:</strong> ${item[itemKey]}</div>`;
                                    }
                                })
                            })

                        } else if(rowType == "array") {
                            let hIndex = 1;
                            jsonData[key].map(item => {
                                html += `<div class="${key}"><strong>${key + " " + hIndex}:</strong> ${item}</div>`;
                            })
                        } else {
                            html += `<div class="${key}"><strong>${key}:</strong> ${item.toString()}</div>`;
                        }

                        break;
                    default:
                        html += `<div class="${key}"><strong>${key}:</strong> ${jsonData[key]}</div>`;
                        break;
                    }
                    
                } else {
                    html += `<div class="${key}"><strong>${key}:</strong> ${this.renderFilteredDatasetTable(jsonData[key])}</div>`;
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
                    // Highlight cells that contain key items
                    let highlightedValue = cellValue;
                    keyItems.forEach(keyItem => {
                        const regex = new RegExp(`(${keyItem})`, 'gi');
                        highlightedValue = highlightedValue.replace(regex, '<mark class="highlight">$1</mark>');
                    });
                    tableHtml += `<td>${highlightedValue}</td>`;
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
.analysis-summary {
    font-family: Arial, sans-serif;
    line-height: 1.6;
    color: #333;
}

.analysis-title {
    color: #2c3e50;
    border-bottom: 2px solid #3498db;
    padding-bottom: 10px;
    margin-bottom: 20px;
}

.introduction-section {
    background-color: #f8f9fa;
    padding: 15px;
    border-radius: 5px;
    margin-bottom: 20px;
}

.introduction-section h3 {
    color: #34495e;
    margin-top: 0;
}

.introduction-summary {
    font-size: 16px;
    color: #555;
}

.themes-section {
    margin-top: 20px;
}

.theme-item {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 20px;
    background-color: white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.theme-title {
    color: #2980b9;
    margin-top: 0;
    border-bottom: 1px solid #ecf0f1;
    padding-bottom: 10px;
}

.theme-analysis {
    margin: 15px 0;
}

.analysis-item {
    margin: 10px 0;
    padding: 8px;
    background-color: #f8f9fa;
    border-radius: 4px;
}

.analysis-item strong {
    color: #2c3e50;
    display: inline-block;
    min-width: 80px;
}

.supporting-evidence {
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px solid #ecf0f1;
}

.supporting-evidence h5 {
    color: #7f8c8d;
    margin-bottom: 10px;
}

.evidence-item {
    margin: 8px 0;
    padding: 5px 0;
}

.impact-score {
    margin: 15px 0;
    padding: 10px;
    background-color: #fdf2e8;
    border-radius: 6px;
    border-left: 4px solid #e67e22;
}

.novelty-score {
    margin: 15px 0;
    padding: 10px;
    background-color: #e8f4fd;
    border-radius: 6px;
    border-left: 4px solid #3498db;
}

.score-value {
    font-weight: bold;
    color: #2980b9;
    font-size: 18px;
}

.key-items {
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px solid #ecf0f1;
}

.key-items h5 {
    color: #7f8c8d;
    margin-bottom: 10px;
}

.key-items-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.key-item {
    background-color: #f8f9fa;
    margin: 5px 0;
    padding: 8px 12px;
    border-radius: 4px;
    border-left: 3px solid #27ae60;
    position: relative;
}

.key-item:before {
    content: "•";
    color: #27ae60;
    font-weight: bold;
    margin-right: 8px;
}

.filtered-data-table {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #ecf0f1;
}

.filtered-data-table h6 {
    color: #7f8c8d;
    margin-bottom: 15px;
    font-size: 16px;
}

.table-container {
    overflow-x: auto;
    border: 1px solid #ddd;
    border-radius: 6px;
    margin-bottom: 10px;
}

.data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
}

.data-table th {
    background-color: #f8f9fa;
    padding: 12px 8px;
    text-align: left;
    font-weight: 600;
    color: #2c3e50;
    border-bottom: 2px solid #dee2e6;
    white-space: nowrap;
}

.data-table td {
    padding: 8px;
    border-bottom: 1px solid #dee2e6;
    vertical-align: top;
}

.data-table tbody tr:hover {
    background-color: #f8f9fa;
}

.highlight {
    background-color: #fff3cd;
    padding: 2px 4px;
    border-radius: 3px;
    font-weight: 600;
}

.table-info {
    font-size: 12px;
    color: #6c757d;
    font-style: italic;
    margin: 0;
}

.no-data {
    color: #6c757d;
    font-style: italic;
    text-align: center;
    padding: 20px;
    background-color: #f8f9fa;
    border-radius: 6px;
}

.btn {
    display: inline-block;
    padding: 10px 20px;
    background-color: #007bff;
    color: white;
    text-decoration: none;
    border-radius: 5px;
    cursor: pointer;
    margin-bottom: 20px;
    border: none;
    font-size: 14px;
}

.btn:hover {
    background-color: #0056b3;
}

.btn-primary {
    background-color: #007bff;
}
</style>