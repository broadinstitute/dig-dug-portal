import Vue from "vue";
import BootstrapVue from "bootstrap-vue";
import { BootstrapVueIcons } from "bootstrap-vue";

Vue.use(BootstrapVueIcons);

import Template from "./Template.vue";
import store from "./store.js";

Vue.use(BootstrapVue);
Vue.config.productionTip = false;

import Documentation from "@/components/Documentation.vue";
import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import ResearchPageHeader from "@/components/researchPortal/ResearchPageHeader.vue";
import ResearchPageFooter from "@/components/researchPortal/ResearchPageFooter.vue";
import ResearchPageFilters from "@/components/researchPortal/ResearchPageFilters.vue";
import ResearchDataTable from "@/components/researchPortal/ResearchDataTable.vue";
import ResearchMPlotBitmap from "@/components/researchPortal/ResearchMPlotBitmap.vue";
import ResearchMPlot from "@/components/researchPortal/ResearchMPlot.vue";
import ResearchVolcanoPlot from "@/components/researchPortal/ResearchVolcanoPlot.vue";
import ResearchHeatmap from "@/components/researchPortal/ResearchHeatmap";
import uiUtils from "@/utils/uiUtils";
import keyParams from "@/utils/keyParams";
import Alert, {
    postAlert,
    postAlertNotice,
    postAlertError,
    closeAlert
} from "@/components/Alert";

new Vue({
    store,
    components: {
        PageHeader,
        PageFooter,
        ResearchPageHeader,
        ResearchPageFooter,
        ResearchPageFilters,
        ResearchDataTable,
        ResearchMPlotBitmap,
        ResearchMPlot,
        ResearchVolcanoPlot,
        ResearchHeatmap,
    },
    data() {
        return {
            devID: null,
            devPW: null
        }
    },

    created() {
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
        this.$store.dispatch("hugeampkpncms/getResearchMode", { 'pageID': keyParams.pageid });
    },

    render(createElement, context) {
        return createElement(Template);
    },

    mounted() {

    },
    beforeDestroy() {

    },

    methods: {
        ...uiUtils,
        postAlert,
        postAlertNotice,
        postAlertError,
        closeAlert,
        fetchDevPage() {
            let devID = this.devID;
            let devPW = this.devPW;

            //console.log(devID, devPW);
            this.$store.dispatch("hugeampkpncms/getResearchDevPage", { 'pageID': keyParams.pageid, 'devID': devID, 'devPW': devPW });
        },
        CSVToArray(strData, strDelimiter) {
            // Check to see if the delimiter is defined. If not,
            // then default to comma.
            strDelimiter = (strDelimiter || ",");

            // Create a regular expression to parse the CSV values.
            var objPattern = new RegExp(
                (
                    // Delimiters.
                    "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

                    // Quoted fields.
                    "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

                    // Standard fields.
                    "([^\"\\" + strDelimiter + "\\r\\n]*))"
                ),
                "gi"
            );

            // Create an array to hold our data. Give the array
            // a default empty first row.
            var arrData = [[]];

            // Create an array to hold our individual pattern
            // matching groups.
            var arrMatches = null;


            // Keep looping over the regular expression matches
            // until we can no longer find a match.
            while (arrMatches = objPattern.exec(strData)) {

                // Get the delimiter that was found.
                var strMatchedDelimiter = arrMatches[1];

                // Check to see if the given delimiter has a length
                // (is not the start of string) and if it matches
                // field delimiter. If id does not, then we know
                // that this delimiter is a row delimiter.
                if (
                    strMatchedDelimiter.length &&
                    strMatchedDelimiter !== strDelimiter
                ) {

                    // Since we have reached a new row of data,
                    // add an empty row to our data array.
                    arrData.push([]);

                }

                var strMatchedValue;

                // Now that we have our delimiter out of the way,
                // let's check to see which kind of value we
                // captured (quoted or unquoted).
                if (arrMatches[2]) {

                    // We found a quoted value. When we capture
                    // this value, unescape any double quotes.
                    strMatchedValue = arrMatches[2].replace(
                        new RegExp("\"\"", "g"),
                        "\""
                    );

                } else {
                    // We found a non-quoted value.
                    strMatchedValue = arrMatches[3];

                }


                // Now that we have our value string, let's add
                // it to the data array.
                arrData[arrData.length - 1].push(strMatchedValue);
            }

            // Return the parsed data.
            return (arrData);
        },

        csv2Json(DATA) {



            let rawData2 = JSON.parse(DATA);

            let csvArr = this.CSVToArray(rawData2, ",");

            //console.log(csvArr);
            let jsonHeader = csvArr[0]
            csvArr.shift();

            let jsonData = []

            csvArr.map(i => {
                if (i.length > 1) {
                    let tempObj = {};

                    for (let h = 0; h < i.length; h++) {

                        tempObj[jsonHeader[h]] = i[h];
                    }
                    jsonData.push(tempObj);
                }


            })

            let renderingData = []


            jsonData.map(d => {

                let tempObj = {};
                if (this.dataTableFormat == false) {
                    let topRows = Object.keys(d);
                    topRows.map(t => {
                        tempObj[t] = (this.testNumber(d[t]) == true) ? Number(d[t]) : d[t];
                    })

                } else {
                    this.dataTableFormat["top rows"].map(t => {
                        tempObj[t] = (this.testNumber(d[t]) == true) ? Number(d[t]) : d[t];
                    })
                }


                //console.log("d[t]", tempObj);

                if (this.dataTableFormat["features"] != undefined) {
                    tempObj["features"] = {};
                    this.dataTableFormat["features"].map(f => {
                        tempObj["features"][f] = [];

                        let fTempObj = {};
                        this.dataTableFormat[f].map(fItem => {
                            fTempObj[fItem] = (this.testNumber(d[fItem]) == true) ? Number(d[fItem]) : this.breakLines(d[fItem]);
                        })

                        tempObj["features"][f].push(fTempObj);
                    })
                }
                renderingData.push(tempObj);

            })

            console.log(this.dataTableFormat["data convert"]);

            let processedData = (!!this.dataTableFormat["data convert"]) ? this.convertData(this.dataTableFormat["data convert"], renderingData) : renderingData;

            let renderingDataMerged = (this.dataTableFormat["rows merge by"] != undefined) ? this.mergeDataBy(processedData, this.dataTableFormat) : processedData;

            //console.log(renderingDataMerged);

            return renderingDataMerged;
        },

        convertData(CONVERT, DATA) {
            let convertedData = [];

            DATA.map(d => {
                let tempObj = {};
                CONVERT.map(c => {
                    //console.log(c.type);
                    let cType = c.type;
                    let joinValues = function (FIELDS, jBy, fData) {

                        let fieldValue = "";
                        let fieldsLength = FIELDS.length;

                        for (let i = 0; i < fieldsLength; i++) {
                            if (i < fieldsLength - 1) {
                                fieldValue += fData[FIELDS[i]] + jBy;
                            } else {
                                fieldValue += fData[FIELDS[i]];
                            }

                        }
                        return fieldValue;
                    }

                    switch (cType) {
                        case "join":
                            tempObj[c["field name"]] = joinValues(c["fields to join"], c["join by"], d);
                            break;

                        case "calculate":

                            let calType = c["calculation type"];

                            switch (calType) {
                                case "-log10":
                                    tempObj[c["field name"]] = -Math.log10(d[c["raw field"]]);
                                    break;
                            }
                            break;

                        case "raw":
                            tempObj[c["field name"]] = d[c["raw field"]];
                            break;
                    }
                })

                convertedData.push(tempObj);
            });

            return convertedData;
        },

        testNumber(STR) {
            let reg = /^-?[\d.]+(?:e-?\d+)?$/;
            return reg.test(STR);
        },

        breakLines(STR) {
            if (!!STR) {
                let cleanText = STR.replaceAll("\n", "<br>");
                return cleanText;
            }
        },

        mergeDataBy(DATA, DATAFORMATTING) {

            let beforeMerged = {}
            let dFormatMergeBy = DATAFORMATTING["rows merge by"];
            let dFormatFeatures = DATAFORMATTING["features"];

            DATA.map(d => {
                if (beforeMerged[d[dFormatMergeBy]] == undefined) {
                    beforeMerged[d[dFormatMergeBy]] = d;
                } else {
                    dFormatFeatures.map(f => {
                        let newFeature = beforeMerged[d[dFormatMergeBy]]["features"][f].concat(d["features"][f]);
                        beforeMerged[d[dFormatMergeBy]]["features"][f] = newFeature;
                    })
                }
            })

            let mergedArray = [];

            for (const property in beforeMerged) {
                mergedArray.push(beforeMerged[property])
            }
            return mergedArray;
        },
        filterData(EVENT, FIELD, TYPE) {
            //revisit this method later
            /*
                        this.$nextTick(() => {
                            console.log(this.$refs);
                            console.log(this.$refs.dataFilters);
                        });

                        this.$refs["dataFilters"][.methods].filterData(
                            EVENT, FIELD, TYPE
                        );*/
        }
    },

    computed: {
        pageID() {
            return keyParams.pageid.trim();
        },
        researchMode() {
            let contents = this.$store.state.hugeampkpncms.researchMode;

            if (contents.length === 0) {
                return null;
            }
            return contents[0].field_page_mode;
        },
        researchPage() {
            let contents = this.$store.state.hugeampkpncms.researchPage;

            if (contents.length === 0) {
                return null;
            }
            return contents;
        },
        isLandingPage() {
            let contents = this.researchPage;

            if (contents === null || contents[0]["field_landing_page"] == "0") {
                return null;
            }
            return true;
        },
        pageTitle() {
            let contents = this.researchPage;

            if (contents === null || contents[0]["title"] == false) {
                return null;
            }
            return contents[0]["title"];
        },
        uid() {
            let contents = this.researchPage;

            if (contents === null || contents[0]["uid"] == false) {
                return null;
            }
            return contents[0]["uid"];
        },
        pageDescription() {
            let contents = this.researchPage;

            if (contents === null || contents[0]["body"] == false) {
                return null;
            }
            return contents[0]["body"];
        },
        dataFilters() {
            let contents = this.researchPage;

            if (contents === null || contents[0]["field_filters"] == false) {
                return null;
            }
            return JSON.parse(contents[0]["field_filters"]);
        },
        researchData() {
            let contents = this.$store.state.hugeampkpncms.researchData;

            if (contents.length === 0) {
                return null;
            }

            //console.log(contents);
            let convertedData = this.csv2Json(contents);

            //console.log(convertedData);

            return convertedData;
        },
        dataTableFormat() {
            let contents = this.researchPage;

            if (contents === null) {
                return null;
            } else {
                if (contents[0]["field_data_table_format"] == false) {
                    return false;
                } else {
                    return JSON.parse(contents[0]["field_data_table_format"]);
                }
            }

        },
        rawDataTableFormat() {
            let data = this.researchData;

            if (data != null) {
                let topRows = Object.keys(data[0]);
                let dataTableFormat = { "top rows": topRows };
                return dataTableFormat;
            }
        },
        tablePerPageNumber() {
            let contents = this.researchPage;

            if (contents === null || contents[0]["field_number_of_rows"] == false) {
                return null;
            }
            return contents[0]["field_number_of_rows"];
        },
        tableLegend() {
            let contents = this.researchPage;

            if (contents === null || contents[0]["field_data_table_legend"] == false) {
                return null;
            }
            return contents[0]["field_data_table_legend"];
        },
        plotType() {
            let contents = this.researchPage;

            if (contents === null || contents[0]["field_data_visualizer"] == false) {
                return null;
            }
            return contents[0]["field_data_visualizer"];
        },
        plotConfig() {
            let contents = this.researchPage;

            if (contents === null || contents[0]["field_visualizer_configuration"] == false) {
                return null;
            }
            return JSON.parse(contents[0]["field_visualizer_configuration"]);
        },
        plotClass() {
            let contents = this.researchPage;

            if (contents === null || contents[0]["field_data_visualizer"] == false) {
                return null;
            }

            let plotType = contents[0]["field_data_visualizer"];

            switch (plotType) {
                case "m_plot":
                    return "egl-m-plot-wrapper";
                    break;
                case "mbm_plot":
                    return "mbm-plot-wrapper";
                    break;
                case "volcano_plot":
                    return "volcano-plot-wrapper";
                    break;
                case "h_map":
                    return "heat-map-wrapper";
                    break;
                default:
                    return "";
            }

        },
        plotLegend() {
            let contents = this.researchPage;

            if (contents === null || contents[0]["field_data_visualizer_legend"] == false) {
                return null;
            }
            return contents[0]["field_data_visualizer_legend"];
        },
        researchMethod() {
            let contents = this.$store.state.hugeampkpncms.researchMethod;

            if (contents.length === 0) {
                return null;
            }
            //console.log("method", contents);
            return contents[0].body;
        },
        researchMenu() {
            let contents = this.$store.state.hugeampkpncms.researchMenu;

            if (contents.length === 0) {
                return null;
            }
            return JSON.parse(contents[0].field_menu);
        },
        diseaseGroup() {
            return this.$store.getters["bioPortal/diseaseGroup"];
        },
        phenotypes() {
            return this.$store.bioportal;
        },

        frontContents() {
            let contents = this.$store.state.kp4cd.frontContents;

            if (contents.length === 0) {
                return {};
            }
            return contents[0];
        },
    },

    watch: {
        researchMode(content) {
            let pageMode = content;

            if (pageMode == "public") {
                this.$store.dispatch("hugeampkpncms/getResearchPage", { 'pageID': keyParams.pageid });
            }
        },
        researchPage(content) {
            //Load data
            if (content.length != 0 && content[0]["field_data_point"] != false) {
                let dataPoint = (content[0]["field_data_point"].includes("http://") || content[0]["field_data_point"].includes("https://")) ? content[0]["field_data_point"] : "http://hugeampkpncms.org/sites/default/files/users/user" + this.uid + "/" + content[0]["field_data_point"];

                let domain = (content[0]["field_data_point"].includes("http://") || content[0]["field_data_point"].includes("https://")) ? "external" : "hugeampkpn";

                let fetchParam = { "dataPoint": dataPoint, "domain": domain }

                this.$store.dispatch("hugeampkpncms/getResearchData", fetchParam);
            }


            //Load research method
            if (content.length != 0 && content[0]["field_research_method"] != false) {
                let methodID = content[0]["field_research_method"];
                let methodParam = { "methodID": methodID };

                this.$store.dispatch("hugeampkpncms/getResearchMethod", methodParam);
            }

            //Load research menu
            if (content.length != 0 && content[0]["field_page_header_menu_node_id"] != false) {
                let menuID = content[0]["field_page_header_menu_node_id"];
                let menuParam = { "menuID": menuID };
                this.$store.dispatch("hugeampkpncms/getResearchMenu", menuParam);
            }
        },
        researchData(content) {
            this.$store.dispatch("filteredData", content);
        }
    }
}).$mount("#app");
