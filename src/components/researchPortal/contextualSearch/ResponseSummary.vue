<template>
    <div class="analysis-summary" v-if="!!summaryContent">
        <template v-for="(value, key) in summaryContent">
            <div class="summary-item string" :class="key.toLowerCase()" v-if="getItemType(value) == 'string'">
                <span class="key">{{ key }}</span>
                <span class="value">{{ value }}</span>
            </div>

            <div class="summary-item object" :class="key.toLowerCase()" v-if="getItemType(value) == 'object'">
                <div :class="itemKey.toLowerCase()" v-for="(itemValue, itemKey) in value">
                    <span class="key">{{ itemKey }}</span>
                    <span class="value">{{ itemValue }}</span>
                </div>
            </div>

            <div class="summary-item array" :class="key.toLowerCase()" v-if="getItemType(value) == 'array' && key != summaryConfig['data in response']">
                <template v-for="(item, itemIndex) in value">
                    <div v-for="(itemValue, itemKey) in item" v-if="getItemType(item) == 'object'" class="object-item" :class="itemKey.toLowerCase()">
                        <div class="string" :class="itemKey.toLowerCase()" v-if="getItemType(itemValue) == 'string'">
                            <span class="key">{{ itemKey }}</span>
                            <span class="value">{{ itemValue }}</span>
                        </div>
                        <div class="array" :class="itemKey.toLowerCase()" v-if="getItemType(itemValue) == 'array' && itemKey != summaryConfig['data in response']">
                            <span class="key">{{ itemKey }}</span>
                            <span class="value" v-for="(arrItem, arrItemIndex) in itemValue">{{ arrItem }}</span>
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
            <div class="summary-item array" :class="key.toLowerCase()" v-if="getItemType(value) == 'array' && key == summaryConfig['data in response']">
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
span.key {
    font-weight: bold;
    margin-right: 10px;
}
</style>