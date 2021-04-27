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
import uiUtils from "@/utils/uiUtils";
import keyParams from "@/utils/keyParams";

new Vue({
    store,
    components: {
        PaperPageHeader,
        PaperPageFooter,
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

        csv2Json(DATA) {

            let csvArr = [];

            let rawData = DATA.split("\\r\\n");

            rawData.map(r => {
                let eachRow = r.split(",");
                csvArr.push(eachRow);
            })


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
                            fTempObj[fItem] = (this.testNumber(d[fItem]) == true) ? Number(d[fItem]) : d[fItem];

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
        researchPage() {
            let contents = this.$store.state.hugeampkpncms.researchPage;

            if (contents.length === 0) {
                return null;
            }
            return contents;
        },
        researchData() {
            let contents = this.$store.state.hugeampkpncms.researchData;

            if (contents.length === 0) {
                return null;
            }

            return this.csv2Json(contents);
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
            this.$store.dispatch("hugeampkpncms/getResearchData", "http://hugeampkpncms.org" + content[0]["field_data_file"]);
        },
    }
}).$mount("#app");
