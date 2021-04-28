import Vue from "vue";
import BootstrapVue from "bootstrap-vue";
import { BootstrapVueIcons } from "bootstrap-vue";

Vue.use(BootstrapVueIcons);

import Template from "./Template.vue";
import store from "./store.js";

Vue.use(BootstrapVue);
Vue.config.productionTip = false;

import PaperPageHeader from "@/components/PaperPageHeader.vue";
import PaperPageFooter from "@/components/PaperPageFooter.vue";
import ResearchDataTable from "@/components/researchPortal/ResearchDataTable.vue";
import uiUtils from "@/utils/uiUtils";
import keyParams from "@/utils/keyParams";

new Vue({
    store,
    components: {
        PaperPageHeader,
        PaperPageFooter,
        ResearchDataTable,
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
        ...uiUtils,

        CSVToArray(strData, strDelimiter) {
            // this function is not used but keeping for future reference
            strDelimiter = (strDelimiter || ",");

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

            var arrData = [[]];

            var arrMatches = null;


            while (arrMatches = objPattern.exec(strData)) {


                var strMatchedDelimiter = arrMatches[1];

                if (
                    strMatchedDelimiter.length &&
                    strMatchedDelimiter !== strDelimiter
                ) {

                    arrData.push([]);

                }

                var strMatchedValue;


                if (arrMatches[2]) {


                    strMatchedValue = arrMatches[2].replace(
                        new RegExp("\"\"", "g"),
                        "\""
                    );

                } else {

                    strMatchedValue = arrMatches[3];

                }

                arrData[arrData.length - 1].push(strMatchedValue);
            }

            // Return the parsed data.
            return (arrData);
        },

        csv2Json(DATA) {

            let tsvArr = [];

            let rawData = DATA.split("\\r\\n");

            //console.log("rawdata", rawData);

            rawData.map(r => {
                //console.log("r", r);
                let eachRow = r.split("\\t");
                tsvArr.push(eachRow);
            })

            //let csvArr = this.CSVToArray(DATA, ",");
            console.log("tsvarr", tsvArr);


            let jsonHeader = tsvArr[0]
            tsvArr.shift();

            let jsonData = []

            tsvArr.map(i => {

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
                            fTempObj[fItem] = (this.testNumber(d[fItem]) == true) ? Number(d[fItem]) : this.cleanUpText(d[fItem]);
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

        cleanUpText(STR) {
            if (!!STR) {
                let cleanText = STR.replaceAll("\\n", "<br>").replaceAll("\\u0022", "")
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
            let contents = this.$store.state.hugeampkpncms.researchPage;

            if (contents.length === 0 || contents[0]["title"] == false) {
                return null;
            }
            return contents[0]["title"];
        },
        uid() {
            let contents = this.$store.state.hugeampkpncms.researchPage;

            if (contents.length === 0 || contents[0]["uid"] == false) {
                return null;
            }
            return contents[0]["uid"];
        },
        pageDescription() {
            let contents = this.$store.state.hugeampkpncms.researchPage;

            if (contents.length === 0 || contents[0]["body"] == false) {
                return null;
            }
            return contents[0]["body"];
        },
        researchData() {
            let contents = this.$store.state.hugeampkpncms.researchData;

            if (contents.length === 0) {
                return null;
            }

            //console.log(contents);

            return this.csv2Json(contents);
        },
        filteredData() {
            let contents = this.researchData;
            return contents;
        },
        dataTableFormat() {
            let contents = this.$store.state.hugeampkpncms.researchPage;

            if (contents.length === 0 || contents[0]["field_data_table_format"] == false) {
                return null;
            }
            return JSON.parse(contents[0]["field_data_table_format"]);
        },
    },

    watch: {
        researchPage(content) {
            this.$store.dispatch("hugeampkpncms/getResearchData", "http://hugeampkpncms.org/sites/default/files/users/user" + this.uid + "/" + content[0]["field_data_point"]);
        },
    }
}).$mount("#app");
