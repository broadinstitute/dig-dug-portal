import Vue from "vue";
import BootstrapVue from "bootstrap-vue";
import { BootstrapVueIcons } from "bootstrap-vue";

Vue.use(BootstrapVueIcons);

import Template from "./Template.vue";
import store from "./store.js";

Vue.use(BootstrapVue);
Vue.config.productionTip = false;

import ResearchPageHeader from "@/components/researchPortal/ResearchPageHeader.vue";
import ResearchPageFooter from "@/components/researchPortal/ResearchPageFooter.vue";
import ResearchPageFilters from "@/components/researchPortal/ResearchPageFilters.vue";
import ResearchDataTable from "@/components/researchPortal/ResearchDataTable.vue";
import MPlotBitmap from "@/components/MPlotBitmap";
import EffectorGenesMPlot from "@/components/eglt/EffectorGenesMPlot";
import keyParams from "@/utils/keyParams";

new Vue({
    store,
    components: {
        ResearchPageHeader,
        ResearchPageFooter,
        ResearchPageFilters,
        ResearchDataTable,
        MPlotBitmap,
        EffectorGenesMPlot,
    },

    created() {
        this.$store.dispatch("hugeampkpncms/getResearchPage", { 'pageID': keyParams.pageid, 'reviewerID': keyParams.id, 'reviewerCode': keyParams.pw });
    },

    render(createElement, context) {
        return createElement(Template);
    },

    mounted() {

    },
    beforeDestroy() {

    },

    methods: {
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

                let tempObj = {};

                for (let h = 0; h < i.length; h++) {

                    tempObj[jsonHeader[h]] = i[h];
                }
                jsonData.push(tempObj);
            })



            let renderingData = []

            jsonData.map(d => {
                let tempObj = {};
                this.dataTableFormat["top rows"].map(t => {
                    tempObj[t] = (this.testNumber(d[t]) == true) ? Number(d[t]) : d[t];
                })

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


            let renderingDataMerged = (this.dataTableFormat["rows merge by"] != undefined) ? this.mergeDataBy(renderingData, this.dataTableFormat) : renderingData;

            return renderingDataMerged;
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
        }
    },

    computed: {
        pageID() {
            return keyParams.pageid.trim();
        },
        researchPage() {
            let contents = this.$store.state.hugeampkpncms.researchPage;

            if (contents.length === 0) {
                return null;
            }
            return contents;
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
        /*
        filteredData() {
            let contents = this.researchData;
            return contents;
        },
        */
        dataTableFormat() {
            let contents = this.researchPage;

            if (contents === null || contents[0]["field_data_table_format"] == false) {
                return null;
            }
            return JSON.parse(contents[0]["field_data_table_format"]);
        },
        tableperPageNumber() {
            let contents = this.researchPage;

            if (contents === null || contents[0]["field_number_of_rows"] == false) {
                return null;
            }
            return JSON.parse(contents[0]["field_number_of_rows"]);
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
        researchMenu() {
            return "menu";
        }
    },

    watch: {
        researchPage(content) {
            let dataPoint = (content[0]["field_data_point"].includes("http://") || content[0]["field_data_point"].includes("https://")) ? content[0]["field_data_point"] : "http://hugeampkpncms.org/sites/default/files/users/user" + this.uid + "/" + content[0]["field_data_point"];

            let domain = (content[0]["field_data_point"].includes("http://") || content[0]["field_data_point"].includes("https://")) ? "external" : "hugeampkpn";

            let fetchParam = { "dataPoint": dataPoint, "domain": domain }

            this.$store.dispatch("hugeampkpncms/getResearchData", fetchParam);
        },
        researchData(content) {
            this.$store.dispatch("filteredData", content);
        }
    }
}).$mount("#app");
