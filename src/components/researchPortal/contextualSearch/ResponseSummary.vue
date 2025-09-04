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
            summary: null
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