<template>
    <div class="analysis-summary-container" v-if="!!summaryContent">
        <div class="analysis-summary-header">
            <button class="btn btn-sm btn-outline-primary save-report-btn" @click="saveReport" title="Save report as JSON file">
                <i class="fas fa-download"></i> Save Report
            </button>
        </div>
        <div class="analysis-summary" ref="summaryContent">
            <template v-for="(value, key) in summaryContent">
            <div class="summary-item string" :class="key.toLowerCase()" v-if="getItemType(value) == 'string'" :key="`string-${key}`">
                <span class="key">{{ key }}</span>
                <span class="value" v-html="formatValue(key, value)"></span>
            </div>

            <div class="summary-item object" :class="key.toLowerCase()" v-if="getItemType(value) == 'object'" :key="`object-${key}`">
                <div :class="itemKey.toLowerCase()" v-for="(itemValue, itemKey) in value" :key="itemKey">
                    <span class="key">{{ itemKey }}</span>
                    <span class="value" v-html="formatValue(itemKey, itemValue)"></span>
                </div>
            </div>

            <div class="summary-item array" :class="key.toLowerCase()" v-if="getItemType(value) == 'array' && key != summaryConfig['data in response']" :key="`array-${key}`">
                <template v-for="(item, itemIndex) in value">
                    <div v-for="(itemValue, itemKey) in item" v-if="getItemType(item) == 'object'" class="object-item" :class="itemKey.toLowerCase()" :key="`${itemIndex}-${itemKey}`">
                        <div class="string" :class="itemKey.toLowerCase()" v-if="getItemType(itemValue) == 'string'">
                            <span class="key">{{ itemKey }}</span>
                            <span class="value" v-html="formatValue(itemKey, itemValue)"></span>
                        </div>
                        <div class="array" :class="itemKey.toLowerCase()" v-if="getItemType(itemValue) == 'array' && itemKey != summaryConfig['data in response']">
                            <span class="key">{{ itemKey }}</span>
                            <span class="value" v-for="(arrItem, arrItemIndex) in itemValue" :key="arrItemIndex" v-html="formatValue(itemKey, arrItem)"></span>
                        </div>
                        <div class="array" :class="itemKey.toLowerCase()" v-if="getItemType(itemValue) == 'array' && itemKey == summaryConfig['data in response'] ">
                            <research-data-table
                                :pageID="1"
                                :dataset="getFilteredData(itemValue)"
                                :tableFormat="tableFormat"
                                :initPerPageNumber="5"
                                tableLegend=""
                                :searchParameters="null" :pkgData="null" :pkgDataSelected="null"
                                :phenotypeMap="null" :sectionId="1" :multiSectionPage="true" :starItems="null"
                                :utils="utils" :region="null" :regionZoom="null"
                                :regionViewArea="null" 
                                :colors="null" :plotMargin="null">
                            </research-data-table>
                             <div>{{ 'next step' }}
                                <button class="btn btn-sm btn-outline-primary" @click="queryNextStep(itemValue)">Next Step</button>
                            </div>
                        </div>
                       

                        
                    </div>
                </template>
            </div>
            <div class="summary-item array" :class="key.toLowerCase()" v-if="getItemType(value) == 'array' && key == summaryConfig['data in response']" :key="`data-${key}`">
                <research-data-table
                    :pageID="1"
                    :dataset="getFilteredData(value)"
                    :tableFormat="tableFormat"
                    :initPerPageNumber="10"
                    tableLegend=""
                    :searchParameters="null" :pkgData="null" :pkgDataSelected="null"
                    :phenotypeMap="null" :sectionId="1" :multiSectionPage="true" :starItems="null"
                    :utils="utils" :region="null" :regionZoom="null"
                    :regionViewArea="null" 
                    :colors="null" :plotMargin="null">
                </research-data-table>
            </div>
        </template>
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import ResearchDataTable from "@/components/researchPortal/ResearchDataTable.vue";

export default Vue.component("response-summary", {
    props: ["summaryContent","summaryConfig","utils","sectionConfig","dataset"],
    components: {
        ResearchDataTable
    },
    data() {
        return {
            summary: null,
            inSummaryDataLength: null,
            nextStepData: []
        }
    },
    mounted() {
        
    },
    watch: {
        summaryContent(to, from) {
            console.log("summaryContent", to);
        },
        summary(to, from) {
            console.log("summary", to);
        },
        nextStepData(to, from) {

            function findArrayIntersection(arrays) {
                // Handle edge cases where no arrays or only one array is provided.
                if (arrays.length === 0) {
                    return [];
                }
                if (arrays.length === 1) {
                    // Convert to a Set and back to an array to handle duplicates.
                    return [...new Set(arrays[0])];
                }

                // Start with a Set of the elements from the first array.
                // Using a Set provides efficient O(1) lookups.
                let intersectionSet = new Set(arrays[0]);

                // Iterate over the rest of the arrays to find the common elements.
                for (let i = 1; i < arrays.length; i++) {
                    const currentArraySet = new Set(arrays[i]);

                    // Create a new Set to hold the updated intersection.
                    const nextIntersectionSet = new Set();
                    
                    // Iterate over the current intersection and add elements that also exist
                    // in the current array's Set.
                    for (const element of intersectionSet) {
                    if (currentArraySet.has(element)) {
                        nextIntersectionSet.add(element);
                    }
                    }
                    
                    // Update the intersection set for the next iteration.
                    intersectionSet = nextIntersectionSet;
                }

                // Convert the final Set back to an array and return it.
                return [...intersectionSet];
            }

            let collectedItems = [];

            if(to.length == this.inSummaryDataLength) {
                
                this.nextStepData.map((data, dataIndex) => {
                    let filteredData = data.filter(item => item['combined'] > 2);

                    collectedItems[dataIndex] = filteredData.map(item => item['gene']);
                    
                })

                
            }

            console.log("collectedItems", collectedItems);

            let intersection = findArrayIntersection(collectedItems);
                console.log("intersection", intersection.join(", "));

            /*try {
                let url = "https://llm-dev.hugeamp.org/gemini";
                const payload = {
                    model: "gemini-2.0-flash",
                    systemPrompt: "Format response in json. [{gene: gene symbol, function: function of the gene}]",
                    userPrompt: "Find the function of the following genes: " + intersection.join(", "),
                };

                const options = {
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

                if (!res.data || !res.data[0] || !res.data[0].gemini_response) {
                    throw new Error('Invalid response structure from LLM service');
                }

                return {
                    success: true,
                    data: res.data[0].gemini_response,
                    rawResponse: res
                };

            } catch (error) {
                console.error('Error in queryLLMSimple:', error);
                return {
                    success: false,
                    error: error.message,
                    data: null
                };
            }*/
        }

    },
    computed: {
        summaryData() {
            return this.summary;
        },
        tableFormat() {
            // Create a deep copy of the table format
            let tableFormatCopy = JSON.parse(JSON.stringify(this.sectionConfig['table format']));
            
            // Replace "top rows" with columns to render from summary config
            if (tableFormatCopy && tableFormatCopy['top rows']) {
                tableFormatCopy['top rows'] = this.summaryConfig['columns to render'];
            }
            console.log("tableFormatCopy", tableFormatCopy);
            
            return tableFormatCopy;
        }
    },
    methods: {
        saveReport() {
            try {
                if (!this.summaryContent) {
                    console.error('No summary content available');
                    alert('No summary content to save.');
                    return;
                }

                // Create a comprehensive report object
                const reportData = {
                    metadata: {
                        generatedOn: new Date().toISOString(),
                        generatedAt: new Date().toLocaleString(),
                        version: "1.0",
                        source: "Analysis Summary Report"
                    },
                    report: this.prepareReportContent(),
                    configuration: {
                        model: this.summaryConfig['model'] || 'unknown'
                    },                     
                };

                // Convert to JSON with proper formatting
                const jsonContent = JSON.stringify(reportData, null, 2);

                // Create and download the file
                const blob = new Blob([jsonContent], { type: 'application/json' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `analysis-summary-${new Date().toISOString().split('T')[0]}.json`;
                
                // Trigger download
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                // Clean up
                window.URL.revokeObjectURL(url);
                
            } catch (error) {
                console.error('Error downloading summary:', error);
                alert('Error downloading summary. Please try again.');
            }
        },

        prepareReportContent() {

            let reportContent = {};

            if (!this.summaryContent || typeof this.summaryContent !== 'object') {
                return reportContent;
            }

            let reportKeys = Object.keys(this.summaryContent);

            reportKeys.forEach(key => {
                let itemValue = this.summaryContent[key];
                let itemType = this.getItemType(itemValue);

                switch (itemType) {
                    case 'string':
                        // Direct string values
                        reportContent[key] = itemValue;
                        break;

                    case 'object':
                        // Object values - keep as is
                        reportContent[key] = itemValue;
                        break;

                    case 'array':
                        if (key === this.summaryConfig['data in response']) {
                            // Replace with filtered data for the main data field
                            reportContent[key] = this.getFilteredData(itemValue);
                        } else {
                            // Process array items that might contain nested data fields
                            let processedArray = itemValue.map(item => {
                                if (this.getItemType(item) === 'object') {
                                    let processedItem = {};
                                    Object.keys(item).forEach(itemKey => {
                                        if (itemKey === this.summaryConfig['data in response']) {
                                            // Replace nested data fields with filtered data
                                            processedItem[itemKey] = this.getFilteredData(item[itemKey]);
                                        } else {
                                            processedItem[itemKey] = item[itemKey];
                                        }
                                    });
                                    return processedItem;
                                } else {
                                    return item;
                                }
                            });
                            reportContent[key] = processedArray;
                        }
                        break;

                    default:
                        reportContent[key] = itemValue;
                        break;
                }
            });

            return reportContent;
        },  
        formatValue(KEY, VALUE) {
            if(!!this.summaryConfig['response format'] && !!this.summaryConfig['response format'][KEY]) {
                let formattedValue = this.utils.Formatters.formatLLMResponse(VALUE, this.summaryConfig['response format'][KEY]);
                return formattedValue;
            } else {
                return VALUE;
            }
        },
        getItemType(item) {
            if(typeof item == "object" && !Array.isArray(item)) {
                return "object";
            } else if(typeof item == "object" && Array.isArray(item)) {
                return "array";
            } else if(typeof item == "string" || typeof item == "number") {
                return "string";
            } else {
                return "unknown";
            }
        },
        getFilteredData(keyItems) {
            // Get the columns from summaryConfig
            const columns = this.summaryConfig['columns'];
            const columnsToRender = this.summaryConfig['columns to render'];

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

            let returnArray =[];

            filteredRows.map(row => {
                let tempObj = {}
                const rowKeys = Object.keys(row);
                rowKeys.map(key => {
                    if(columnsToRender.includes(key)) {
                        tempObj[key] = row[key];
                    }
                })
                returnArray.push(tempObj);
            })

            return returnArray;
        },
        async queryNextStep(ITEMS) {
            

            let filteredData = this.getFilteredData(ITEMS);
            this.inSummaryDataLength = filteredData.length;

            console.log("DATA", filteredData);

            this.nextStepData = [];
            /*
            config datamodel:
            {
                "url": "https://cfde-dev.hugeampkpnbi.org/api/bio/query/pigean-joined-gene-set?q=",
                "parameters column": "Genes in gene set",
                "data merge": {"type": "overlap","field":"gene"},
                "data collect": ["gene"]
                "data filter": [{
                    "type": "search greater than",
                    "field": "combined",
                    "value": 2
                }],
                "next prompt": "user prompt"
            }
            */
			let dataUrl = "https://cfde-dev.hugeampkpnbi.org/api/bio/query/pigean-joined-gene-set?q=";

            filteredData.map(async item => {
                let fetchUrl = dataUrl + item['Genes in gene set'];

                let contentJson = await fetch(fetchUrl).then((resp) => resp.json());

                if (contentJson.error == null && !!Array.isArray(contentJson.data) && contentJson.data.length > 0) {
                    console.log("contentJson", contentJson.data);
                    this.nextStepData.push(contentJson.data);
                } else {
                    // fetch failed 
                    console.log("fetch failed");
                }
            })

			/*if (TYPE == "replace") {
				PARAMS.map((param, pIndex) => {
					if (!!QUERY.split(",")[pIndex]) {
						dataUrl = dataUrl.replace("$" + param, QUERY.split(",")[pIndex]);
					} else {
						dataUrl = dataUrl.replace("$" + param + ",", '');
						dataUrl = dataUrl.replace(",$" + param, '');
						dataUrl = dataUrl.replace("$" + param, '');
					}
				})


			} else if(TYPE == "replace or") {

				PARAMS.map((param, pIndex) => {
					if (!!QUERY.split(",")[pIndex]) {
						dataUrl = dataUrl.replace("$" + param, QUERY.split(",")[pIndex]);
					} else {
						dataUrl = dataUrl.replace("$" + param + ",", '');
						dataUrl = dataUrl.replace(",$" + param, '');
						dataUrl = dataUrl.replace("$" + param, '');
					}
				})

			} else {
				dataUrl = dataUrl + "query/" + this.dataPoint.index + "?q=" + QUERY;
			}

			

			let contentJson = await fetch(dataUrl).then((resp) => resp.json());

			if (contentJson.error == null && !!Array.isArray(contentJson.data) && contentJson.data.length > 0) {
				this.processLoadedBI(contentJson, QUERY);
			} else {
				// fetch failed 
				if (!!this.dataPoint["cumulate data"]) {
					this.sectionData = this.sectionData
				} else {
					this.sectionData = null;
				}
				this.loadingDataFlag = "down";
				this.noLoadedData = "No data is returned. Please check query parameters.";
			}*/
		},

    }
}); 
</script>
<style scoped>
.analysis-summary-container {
    position: relative;
}

.analysis-summary-header {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid #e9ecef;
}

.save-report-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    padding: 5px 10px;
}

.save-report-btn i {
    font-size: 11px;
}

.analysis-summary {
    margin-top: 10px;
}

span.key {
    font-weight: bold;
    margin-right: 10px;
}

.summary-item {
    margin-bottom: 15px;
    padding: 10px;
    border-left: 3px solid #007bff;
    background-color: #f8f9fa;
}

.summary-item.string {
    border-left-color: #28a745;
}

.summary-item.object {
    border-left-color: #ffc107;
}

.summary-item.array {
    border-left-color: #dc3545;
}

.object-item {
    margin: 5px 0;
    padding: 5px;
    border-radius: 3px;
}
</style>