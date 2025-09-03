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
                <span class="value">{{ value }}</span>
            </div>

            <div class="summary-item object" :class="key.toLowerCase()" v-if="getItemType(value) == 'object'" :key="`object-${key}`">
                <div :class="itemKey.toLowerCase()" v-for="(itemValue, itemKey) in value" :key="itemKey">
                    <span class="key">{{ itemKey }}</span>
                    <span class="value">{{ itemValue }}</span>
                </div>
            </div>

            <div class="summary-item array" :class="key.toLowerCase()" v-if="getItemType(value) == 'array' && key != summaryConfig['data in response']" :key="`array-${key}`">
                <template v-for="(item, itemIndex) in value">
                    <div v-for="(itemValue, itemKey) in item" v-if="getItemType(item) == 'object'" class="object-item" :class="itemKey.toLowerCase()" :key="`${itemIndex}-${itemKey}`">
                        <div class="string" :class="itemKey.toLowerCase()" v-if="getItemType(itemValue) == 'string'">
                            <span class="key">{{ itemKey }}</span>
                            <span class="value">{{ itemValue }}</span>
                        </div>
                        <div class="array" :class="itemKey.toLowerCase()" v-if="getItemType(itemValue) == 'array' && itemKey != summaryConfig['data in response']">
                            <span class="key">{{ itemKey }}</span>
                            <span class="value" v-for="(arrItem, arrItemIndex) in itemValue" :key="arrItemIndex">{{ arrItem }}</span>
                        </div>
                        <div class="array" :class="itemKey.toLowerCase()" v-if="getItemType(itemValue) == 'array' && itemKey == summaryConfig['data in response'] ">
                            <research-data-table
                                :pageID="1"
                                :dataset="getFilteredData(itemValue)"
                                :tableFormat="sectionConfig['table format']"
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
                    :tableFormat="sectionConfig['table format']"
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
                    summary: this.summaryContent,
                    configuration: {
                        dataInResponse: this.summaryConfig['data in response'],
                        model: this.summaryConfig['model'] || 'unknown'
                    },
                    dataset: this.dataset/*{
                        totalRows: this.dataset ? this.dataset.length : 0,
                        columns: this.summaryConfig['columns'] || [],
                        columnsToRender: this.summaryConfig['columns to render'] || []
                    },*/    
                    
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