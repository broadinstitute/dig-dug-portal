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
import ResearchRegionPlot from "@/components/researchPortal/ResearchRegionPlot.vue";
import ResearchScorePlot from "@/components/researchPortal/ResearchScorePlot.vue";
import ResearchGenesTrack from "@/components/researchPortal/ResearchGenesTrack.vue";
import ResearchMPlot from "@/components/researchPortal/ResearchMPlot.vue";
import ResearchVolcanoPlot from "@/components/researchPortal/ResearchVolcanoPlot.vue";
import ResearchHeatmap from "@/components/researchPortal/ResearchHeatmap";
import uiUtils from "@/utils/uiUtils";
import $ from "jquery";
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
        ResearchRegionPlot,
        ResearchScorePlot,
        ResearchGenesTrack,
        ResearchMPlot,
        ResearchVolcanoPlot,
        ResearchHeatmap,
        Documentation
    },
    data() {
        return {
            devID: null,
            devPW: null,
            dataFiles: [],
            dataFilesLabels: null,
            dataTableFormat: null,

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
        addcss(css) {
            var head = document.getElementsByTagName('head')[0];
            var s = document.createElement('style');
            s.setAttribute('type', 'text/css');
            if (s.styleSheet) {   // IE
                s.styleSheet.cssText = css;
            } else {                // the world
                s.appendChild(document.createTextNode(css));
            }
            head.appendChild(s);
        },
        fetchDevPage() {
            let devID = this.devID;
            let devPW = this.devPW;


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


            let jsonHeader = csvArr[0]
            csvArr.shift();

            let jsonData = []

            csvArr.map(i => {
                if (i.length > 1) {
                    let tempObj = {};

                    for (let h = 0; h < i.length; h++) {

                        tempObj[jsonHeader[h]] = (this.testNumber(i[h]) == true) ? Number(i[h]) : this.breakLines(i[h]);
                    }
                    jsonData.push(tempObj);
                }
            });


            return jsonData;
        },

        convertData(CONVERT, DATA) {
            let convertedData = [];
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

            let joinMultiValues = function (FIELDS, jBy, fData) {

                let fieldValue = "";
                let fieldsLength = FIELDS.length;

                for (let i = 0; i < fieldsLength; i++) {
                    if (i < fieldsLength - 1) {
                        fieldValue += fData[FIELDS[i]] + jBy[i];
                    } else {
                        fieldValue += fData[FIELDS[i]];
                    }

                }
                return fieldValue;
            }

            let scoreColumns = function (FIELDS, scoreBy, fData) {

                let fieldValue = 0;
                let fieldsLength = FIELDS.length;

                FIELDS.map(fName => {
                    let scoreType = scoreBy[fName].type;
                    switch (scoreType) {
                        case "boolean":
                            let value2Score = scoreBy[fName]["value to score"][fData[fName]];
                            fieldValue += value2Score;
                            break;
                    }
                });

                return fieldValue / fieldsLength;
            }

            let formatLocus = function (CHR, START, END, fData) {
                let locus = fData[CHR] + ':';
                locus += Math.ceil((fData[START] + fData[END]) / 2);
                return locus;
            }

            if (CONVERT != "no convert") {
                DATA.map(d => {
                    let tempObj = {};
                    CONVERT.map(c => {

                        let cType = c.type;


                        switch (cType) {
                            case "join":
                                tempObj[c["field name"]] = joinValues(c["fields to join"], c["join by"], d);
                                break;

                            case "join multi":
                                tempObj[c["field name"]] = joinMultiValues(c["fields to join"], c["join by"], d);
                                break;

                            case "get locus":
                                tempObj[c["field name"]] = formatLocus(c["chromosome"], c["start"], c["end"], d);
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

                            case "score columns":
                                tempObj[c["field name"]] = scoreColumns(c["fields to score"], c["score by"], d);
                                break;
                        }
                    })

                    convertedData.push(tempObj);
                });
            } else {
                convertedData = DATA;
            }

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
        queryAPI() {

            if (this.apiParameters.query.type == "array") {
                let parametersArr = this.apiParameters.query.format;
                let parametersArrLength = parametersArr.length

                let paramTrueCount = 0;
                parametersArr.map((param, index) => {

                    if (!!keyParams[param]) {
                        paramTrueCount++;
                    }
                });

                if (paramTrueCount == parametersArrLength) {
                    this.$store.state.bioIndexContinue = [];
                    let queryParams = "";
                    parametersArr.map((param, index) => {

                        queryParams += keyParams[param].trim();
                        if (index + 1 < parametersArr.length) {
                            queryParams += ",";
                        }
                    });

                    let APIPoint = this.dataFiles[0];
                    if (this.dataType == "bioindex") {
                        APIPoint +=
                            "query/" +
                            this.apiParameters.query.index +
                            "?q=" +
                            queryParams;
                    }

                    let fetchParam = { dataPoint: APIPoint, domain: "external" };


                    this.$store.dispatch("hugeampkpncms/getResearchData", fetchParam);
                } else {
                    uiUtils.hideElement("data-loading-indicator");
                }
            }
        },
        checkDataComparison(newResearchData, previousData) {

            let dataComparison = this.$store.state.dataComparison;

            if (this.dataComparisonConfig != null && newResearchData.length > 0) {

                let comparingFields = this.dataComparisonConfig.fieldsToCompare;

                switch (dataComparison) {
                    case "newSearch":

                        let compareReadyData = {};

                        newResearchData.map(d => {
                            let keyField = d[this.dataComparisonConfig.keyField];
                            let tempObj = {};
                            for (const [key, value] of Object.entries(d)) {
                                if (comparingFields.includes(key) == true) {

                                    let fieldGroupKey = document.getElementById("search_param_" + this.dataComparisonConfig.fieldsGroupDataKey).value;

                                    tempObj[key] = {};
                                    tempObj[key][fieldGroupKey] = value;
                                } else {
                                    tempObj[key] = value;
                                }
                            }
                            compareReadyData[keyField] = tempObj;
                        })



                        return compareReadyData;

                        break;

                    case "overlapping":

                        let overlappingData = {};

                        newResearchData.map(d => {
                            let keyField = d[this.dataComparisonConfig.keyField];
                            let fieldGroupKey = document.getElementById("search_param_" + this.dataComparisonConfig.fieldsGroupDataKey).value;
                            if (!!previousData[keyField]) {
                                let tempObj = previousData[keyField];
                                comparingFields.map(cf => {
                                    tempObj[cf][fieldGroupKey] = d[cf];
                                });

                                overlappingData[keyField] = tempObj;
                            }
                        });



                        return overlappingData;

                        break;
                    case "all":

                        let allData = {}

                        newResearchData.map(d => {
                            let keyField = d[this.dataComparisonConfig.keyField];
                            let fieldGroupKey = document.getElementById("search_param_" + this.dataComparisonConfig.fieldsGroupDataKey).value;
                            if (!!previousData[keyField]) {
                                let tempObj = previousData[keyField];
                                comparingFields.map(cf => {
                                    tempObj[cf][fieldGroupKey] = d[cf];
                                });
                                allData[keyField] = tempObj;

                            } else {

                                let tempObj = {};
                                for (const [key, value] of Object.entries(d)) {
                                    if (comparingFields.includes(key) == true) {

                                        let fieldGroupKey = document.getElementById("search_param_" + this.dataComparisonConfig.fieldsGroupDataKey).value;

                                        tempObj[key] = {};
                                        tempObj[key][fieldGroupKey] = value;
                                    } else {
                                        tempObj[key] = value;
                                    }
                                }

                                allData[keyField] = tempObj;
                            }

                        });

                        return allData;

                        break;

                }
            } else {
                return newResearchData;
            }

        },
    },

    computed: {
        apiParameters() {
            let contents = this.researchPage;
            if (contents === null || contents[0]["field_api_parameters"] == false) {
                return null;
            } else {
                return JSON.parse(contents[0]["field_api_parameters"]);
            }
        },
        dataComparisonConfig() {
            let contents = this.researchPage;

            if (contents === null || contents[0]["field_data_comparison"] == false) {
                return null;
            }

            return JSON.parse(contents[0]["field_data_comparison"]);
        },
        dataPoints() {
            let contents = this.researchPage;

            if (contents === null || contents[0]["field_data_points"] == false) {
                return false;
            }
            return contents[0]["field_data_points"];
        },
        dataFilters() {
            let contents = this.researchPage;

            if (contents === null || contents[0]["field_filters"] == false) {
                return null;
            }


            return JSON.parse(contents[0]["field_filters"]);
        },
        dataType() {
            let contents = this.researchPage;

            if (contents === null || contents[0]["field_data_type"] == false || contents[0]["field_data_type"] == "csv") {
                return null;
            }
            return contents[0]["field_data_type"];
        },
        diseaseGroup() {
            return this.$store.getters["bioPortal/diseaseGroup"];
        },
        displayOnKP() {
            let contents = this.$store.state.hugeampkpncms.researchMode;

            if (contents.length === 0 || contents[0].field_display_on_kp == false) {
                return null;
            } else {
                return true;
            }

        },

        filterWidth() {
            let contents = this.researchPage;

            if (contents === null || contents[0]["field_filter_width"] == false || contents[0]["field_filter_width"] == "none") {
                return null;
            }

            return contents[0]["field_filter_width"];
        },
        frontContents() {
            let contents = this.$store.state.kp4cd.frontContents;

            if (contents.length === 0) {
                return {};
            }
            return contents[0];
        },
        isAPI() {
            let contents = this.researchPage;

            if (contents === null) {
                return null;
            } else if (contents[0]["field_is_api"] == "1") {
                return true;
            } else if (contents[0]["field_is_api"] == "0") {
                return false;
            }
        },
        isLandingPage() {
            let contents = this.researchPage;

            if (contents === null || contents[0]["field_landing_page"] == "0") {
                return null;
            }
            return true;
        },
        pageDescription() {
            let contents = this.researchPage;

            if (contents === null || contents[0]["body"] == false) {
                return null;
            }
            return contents[0]["body"];
        },
        pageID() {
            return keyParams.pageid.trim();
        },
        pageTitle() {
            let contents = this.researchPage;

            if (contents === null || contents[0]["title"] == false) {
                return null;
            }
            return contents[0]["title"];
        },
        phenotypes() {
            return this.$store.bioportal;
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
            return $("<textarea/>").html(contents[0]["field_data_visualizer_legend"]).text();
        },
        researchMethod() {
            let contents = this.$store.state.hugeampkpncms.researchMethod;

            if (contents.length === 0) {
                return null;
            }

            return contents[0].body;
        },
        researchMenu() {
            let contents = this.$store.state.hugeampkpncms.researchMenu;

            if (contents.length === 0) {
                return null;
            }
            return JSON.parse(contents[0].field_menu);
        },
        researchData() {
            let contents = this.$store.state.hugeampkpncms.researchData;

            if (contents.length === 0) {
                return null;
            } else {

                let convertedData = (this.dataType == 'json' || this.dataType == 'bioindex') ? JSON.parse(contents) : this.csv2Json(contents);

                if (this.dataType == 'bioindex') {
                    if (convertedData.continuation != null) {
                        this.$store.dispatch("bioIndexContinue", convertedData.data);


                        let APIPoint = this.dataFiles[0];
                        if (this.dataType == "bioindex") {
                            APIPoint +=
                                "cont?token=" +
                                convertedData.continuation;
                        }

                        let fetchParam = { dataPoint: APIPoint, domain: "external" };

                        this.$store.dispatch("hugeampkpncms/getResearchData", fetchParam);

                    } else if (convertedData.continuation == null && convertedData.page == 1) {
                        let returnData = convertedData.data;

                        let processedData = (this.dataTableFormat != null && !!this.dataTableFormat["data convert"]) ? this.convertData(this.dataTableFormat["data convert"], returnData) : this.convertData("no convert", returnData);


                        return processedData;
                    } else if (convertedData.continuation == null && convertedData.page != 1) {
                        //merge all data from continue


                        let continuedData = this.$store.state.bioIndexContinue;

                        let mergedData = [];

                        continuedData.map(cont => {
                            cont.map(i => {
                                mergedData.push(i);
                            })
                        });

                        let processedData = (this.dataTableFormat != null && !!this.dataTableFormat["data convert"]) ? this.convertData(this.dataTableFormat["data convert"], mergedData) : this.convertData("no convert", mergedData);

                        return processedData;

                    }
                } else {
                    let returnData = (this.dataType == 'json') ? convertedData.data : convertedData;

                    let processedData = (this.dataTableFormat != null && !!this.dataTableFormat["data convert"]) ? this.convertData(this.dataTableFormat["data convert"], returnData) : this.convertData("no convert", returnData);

                    return processedData;
                }
            }

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
        uid() {
            let contents = this.researchPage;

            if (contents === null || contents[0]["uid"] == false) {
                return null;
            }
            return contents[0]["uid"];
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
        searchingGenes() {
            let contents = this.$store.state.hugeampkpncms.genesInRegion;

            if (contents.length > 0) {
                return JSON.parse(contents);
            }
        },
        codingGenesData() {
            let contents = this.$store.state.hugeampkpncms.genesData;

            if (contents != null) {
                return JSON.parse(contents);
            }
        }
    },

    watch: {
        codingGenesData(DATA) {
            this.$store.dispatch("codingGenesData", DATA["data"]);
        },
        searchingGenes(CONTENTS) {

            //console.log("genes in region", CONTENTS);

            let genesData = CONTENTS["data"];
            let codingGenes = "";
            let genesLength = CONTENTS["data"].length;
            if (genesLength > 1) {
                genesData.map(gene => {
                    if (gene.type = "protein_coding") {
                        codingGenes += "\'" + gene.name + "\',";
                    }
                })
                //console.log("codingGenes", codingGenes);

                codingGenes = codingGenes.slice(0, -1)

                if (codingGenes.length > 1) {
                    this.$store.dispatch("hugeampkpncms/getGenesData", { "genes": codingGenes });
                } else {
                    this.$store.dispatch("codingGenesData", null);
                }
            } else {
                this.$store.dispatch("codingGenesData", null);
            }

        },
        researchMode(content) {
            let pageMode = content;

            if (pageMode == "public") {
                this.$store.dispatch("hugeampkpncms/getResearchPage", { 'pageID': keyParams.pageid });
            }
        },
        researchPage(content) {
            if (content.length != 0 && content != null) {
                if (content[0]["field_page_style"] != false) {
                    let css = content[0]["field_page_style"];
                    this.addcss(css);
                }
                //set Table format
                if (content[0]["field_data_table_format"] != false) {

                    this.dataTableFormat = JSON.parse(content[0]["field_data_table_format"]);
                }
                //Load data

                if (content[0]["field_data_points"] != false) {

                    let dataFiles = content[0]["field_data_points"].split(",");

                    this.dataFiles = dataFiles;
                    this.dataFilesLabels = JSON.parse(content[0]["field_data_points_list_labels"]);

                    let initialData = dataFiles[0];

                    let dataPoint = (initialData.includes("http://") || initialData.includes("https://")) ? initialData : "https://hugeampkpncms.org/sites/default/files/users/user" + this.uid + "/" + initialData;

                    let domain = (initialData.includes("http://") || initialData.includes("https://")) ? "external" : "hugeampkpn";

                    let fetchParam = { "dataPoint": dataPoint, "domain": domain }

                    if (this.isAPI != null && this.isAPI == false) {

                        this.$store.dispatch("hugeampkpncms/getResearchData", fetchParam);
                    } else if (this.isAPI == true) {

                        this.queryAPI();

                    }
                }

                //Load research method
                if (content[0]["field_research_method"] != false) {
                    let methodID = content[0]["field_research_method"];
                    let methodParam = { "methodID": methodID };

                    this.$store.dispatch("hugeampkpncms/getResearchMethod", methodParam);
                }

                //Load research menu
                if (content[0]["field_page_header_menu_node_id"] != false) {
                    let menuID = content[0]["field_page_header_menu_node_id"];
                    let menuParam = { "menuID": menuID };
                    this.$store.dispatch("hugeampkpncms/getResearchMenu", menuParam);
                }
            }

        },
        researchData(content) {

            // reset searching region if applicable

            if (this.plotConfig != null &&
                !!this.plotConfig.genesTrack) {
                let region;
                switch (this.plotConfig.inputType) {
                    case "static":
                        region = this.plotConfig.region;
                        break;
                    case "dynamic":
                        let regionParam = this.plotConfig.dynamicParameter;
                        let searchLength = this.$store.state.searchParameters[regionParam].search.length
                        region = this.$store.state.searchParameters[regionParam].search[searchLength - 1];

                        break;
                }


                this.$store.dispatch("searchingRegion", region);
                this.$store.dispatch("hugeampkpncms/getGenesInRegion", { "region": region });
            }

            if (content != null && content.length > 0) {
                uiUtils.hideElement("data-loading-indicator");
                let updatedData = this.checkDataComparison(content, this.$store.state.filteredData);

                if (this.dataTableFormat == null) {
                    let topRows = Object.keys(content[0]);
                    let dataTableFormat = { "top rows": topRows };
                    this.dataTableFormat = dataTableFormat;
                }

                this.$store.dispatch("unfilteredData", updatedData);
                this.$store.dispatch("filteredData", updatedData);
            }
        }
    }
}).$mount("#app");
