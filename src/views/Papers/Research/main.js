import Vue from "vue";
//import BootstrapVue from "bootstrap-vue";
//import { BootstrapVueIcons } from "bootstrap-vue";
import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

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
import ResearchPageDescription from "@/components/researchPortal/ResearchPageDescription.vue";
import ResearchPageFilters from "@/components/researchPortal/ResearchPageFilters.vue";
import ResearchDataTable from "@/components/researchPortal/ResearchDataTable.vue";
import ResearchGEMDataTable from "@/components/researchPortal/ResearchGEMDataTable.vue";
import ResearchMPlotBitmap from "@/components/researchPortal/ResearchMPlotBitmap.vue";
import ResearchMQQPlot from "@/components/researchPortal/ResearchMQQPlot.vue";
import ResearchRegionPlot from "@/components/researchPortal/ResearchRegionPlot.vue";
import ResearchScorePlot from "@/components/researchPortal/ResearchScorePlot.vue";
import ResearchGenesTrack from "@/components/researchPortal/ResearchGenesTrack.vue";
import ResearchMPlot from "@/components/researchPortal/ResearchMPlot.vue";
import ResearchVolcanoPlot from "@/components/researchPortal/ResearchVolcanoPlot.vue";
import ResearchHeatmap from "@/components/researchPortal/ResearchHeatmap";
import ResearchAnnotationsPlot from "@/components/researchPortal/ResearchAnnotationsPlot.vue";
import ResearchPheWAS from "@/components/researchPortal/ResearchPheWAS.vue";
import kpGEMPkg from "@/components/kpDataViewer/kpGEMPkg.vue";
import ResearchSection from "@/components/researchPortal/ResearchSection.vue";
import ResearchMultiSectionsSearch from "@/components/researchPortal/ResearchMultiSectionsSearch.vue";
import uiUtils from "@/utils/uiUtils";
import dataConvert from "@/utils/dataConvert";
import sessionUtils from "@/utils/sessionUtils";
import $ from "jquery";
import keyParams from "@/utils/keyParams";
import Alert, {
    postAlert,
    postAlertNotice,
    postAlertError,
    closeAlert,
} from "@/components/Alert";

new Vue({
    store,
    components: {
        PageHeader,
        PageFooter,
        ResearchPageHeader,
        ResearchPageFooter,
        ResearchPageDescription,
        ResearchPageFilters,
        ResearchDataTable,
        ResearchAnnotationsPlot,
        ResearchGEMDataTable,
        ResearchMPlotBitmap,
        ResearchMQQPlot,
        ResearchRegionPlot,
        ResearchScorePlot,
        ResearchGenesTrack,
        ResearchMPlot,
        ResearchVolcanoPlot,
        ResearchHeatmap,
        ResearchPheWAS,
        kpGEMPkg,
        Documentation,
        ResearchSection,
        ResearchMultiSectionsSearch
    },
    data() {
        return {
            pageID: null,
            regionZoom: 0,
            regionViewArea: 0,
            devID: null,
            devPW: null,
            dataFiles: [],
            dataTableFormat: null,
            colors: {
                moderate: [
                    "#007bff25",
                    "#04884525",
                    "#8490C825",
                    "#BF61A525",
                    "#EE312425",
                    "#FCD70025",
                    "#5555FF25",
                    "#7aaa1c25",
                    "#9F78AC25",
                    "#F8808425",
                    "#F5A4C725",
                    "#CEE6C125",
                    "#cccc0025",
                    "#6FC7B625",
                    "#D5A76825",
                    "#d4d4d425",
                ],
                moderate: [
                    "#007bff50",
                    "#04884550",
                    "#8490C850",
                    "#BF61A550",
                    "#EE312450",
                    "#FCD70050",
                    "#5555FF50",
                    "#7aaa1c50",
                    "#9F78AC50",
                    "#F8808450",
                    "#F5A4C750",
                    "#CEE6C150",
                    "#cccc0050",
                    "#6FC7B650",
                    "#D5A76850",
                    "#d4d4d450",
                ],
                bold: [
                    "#007bff75",
                    "#04884575",
                    "#8490C875",
                    "#BF61A575",
                    "#EE312475",
                    "#FCD70075",
                    "#5555FF75",
                    "#7aaa1c75",
                    "#9F78AC75",
                    "#F8808475",
                    "#F5A4C775",
                    "#CEE6C175",
                    "#cccc0075",
                    "#6FC7B675",
                    "#D5A76875",
                    "#d4d4d475",
                ],
                extraBold: [
                    "#007bff",
                    "#048845",
                    "#8490C8",
                    "#BF61A5",
                    "#EE3124",
                    "#FCD700",
                    "#5555FF",
                    "#7aaa1c",
                    "#9F78AC",
                    "#F88084",
                    "#F5A4C7",
                    "#CEE6C1",
                    "#cccc00",
                    "#6FC7B6",
                    "#D5A768",
                    "#d4d4d4",
                ],
            },

        }
    },

    created() {
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
        this.$store.dispatch("bioPortal/getDiseaseSystems");
        this.$store.dispatch("hugeampkpncms/getResearchMode", { 'pageID': keyParams.pageid });


    },

    render(createElement, context) {
        return createElement(Template);
    },

    mounted() {

    },
    beforeDestroy() {

    },
    computed: {
        //sections setting start
        uiUtilsUtils() {
            return uiUtils
        },
        keyParamUtils() {
            return keyParams
        },
        dataConvertUtils() {
            return dataConvert;
        },
        sectionConfigs() {
            let contents = this.researchPage;
            if (
                contents === null
            ) {
                return null;
            } else {
                return JSON.parse(contents[0]["field_data_table_format"]);
            }
        },
        phenotypeMap() {
            return this.$store.state.bioPortal.phenotypeMap;
        },
        multiSectionsSearchParameters() {
            if (this.phenotypesInSession.length > 0) {
                let parameters = this.sectionConfigs['search parameters'];
                let newParameters = [];

                parameters.map(p => {
                    if (p.values == 'kp phenotypes') {
                        let values = [];


                        this.phenotypesInSession.map(pis => {
                            let tempObj = { "label": pis.description, "value": pis.name };
                            values.push(tempObj);
                        })
                        p.values = values;

                        newParameters.push(p);
                    } else {
                        newParameters.push(p);
                    }
                })

                return newParameters;
            } else {
                return null;
            }
        },

        /////sections setting end

        diseaseInSession() {
            if (this.$store.state.diseaseInSession == null) {
                return "";
            } else {
                return this.$store.state.diseaseInSession;
            }
        },
        phenotypesInSession() {
            if (this.$store.state.phenotypesInSession == null) {
                return this.$store.state.bioPortal.phenotypes;
            } else {
                return this.$store.state.phenotypesInSession;
            }
        },
        rawPhenotypes() {
            return this.$store.state.bioPortal.phenotypes;
        },
        kpGenes() {
            return kpGenes;
        },
        apiParameters() {
            let contents = this.researchPage;
            if (
                contents === null ||
                contents[0]["field_api_parameters"] == false
            ) {
                return null;
            } else {
                let apiConfig = JSON.parse(contents[0]["field_api_parameters"]);

                apiConfig["rawConfig"] = JSON.parse(
                    contents[0]["field_api_parameters"]
                );

                let parameters = apiConfig.parameters;

                parameters.map((pr) => {
                    if (
                        pr.parameter == "phenotype" &&
                        pr.values == "kp phenotypes"
                    ) {
                        let values = this.phenotypesInSession
                            .map((p) => p.name)
                            .sort();
                        pr.values = values;
                    }
                });

                return apiConfig;
            }
        },
        dataComparisonConfig() {
            let contents = this.researchPage;

            if (
                contents === null ||
                contents[0]["field_data_comparison"] == false
            ) {
                return null;
            }

            return JSON.parse(contents[0]["field_data_comparison"]);
        },
        dataPoints() {
            let contents = this.researchPage;

            if (
                contents === null ||
                contents[0]["field_data_points"] == false
            ) {
                return false;
            }
            return contents[0]["field_data_points"];
        },
        dataFilters() {
            let contents = this.researchPage;

            if (contents === null || contents[0]["field_filters"] == false) {
                return null;
            } else {
                return JSON.parse(contents[0]["field_filters"]);
            }

        },
        dataType() {
            let contents = this.researchPage;

            if (
                contents === null ||
                contents[0]["field_data_type"] == false ||
                contents[0]["field_data_type"] == "csv"
            ) {
                return null;
            }
            return contents[0]["field_data_type"];
        },
        diseaseGroup() {
            return this.$store.getters["bioPortal/diseaseGroup"];
        },
        displayOnKP() {
            let contents = this.$store.state.hugeampkpncms.researchMode;
            let hostname = window.location.hostname;

            if (
                contents.length === 0 ||
                contents[0].field_display_on_kp == false ||
                hostname == "hugeampkpn.org"
            ) {
                return null;
            } else {
                return true;
            }
        },
        filteredData() {
            return this.$store.state.filteredData;
        },

        filterWidth() {
            let contents = this.researchPage;

            if (
                contents === null ||
                contents[0]["field_filter_width"] == false ||
                contents[0]["field_filter_width"] == "none"
            ) {
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
        plotMargin() {
            return {
                leftMargin: 150,
                rightMargin: 40,
                topMargin: 20,
                bottomMargin: 100,
                bump: 11,
            };
        },
        pageDescription() {
            let contents = this.researchPage;

            if (contents === null || contents[0]["body"] == false) {
                return null;
            }
            return contents[0]["body"];
        },
        // pageID() {
        //     return keyParams.pageid.trim();
        // },
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

            if (
                contents === null ||
                contents[0]["field_data_visualizer"] == false
            ) {
                return null;
            }

            return contents[0]["field_data_visualizer"];
        },
        customPlotType() {
            let contents = this.researchPage;

            if (
                contents === null ||
                contents[0]["field_custom_visualizer"] == false
            ) {
                return null;
            }

            return contents[0]["field_custom_visualizer"];
        },
        plotConfig() {
            let contents = this.researchPage;

            if (
                contents === null ||
                contents[0]["field_visualizer_configuration"] == false
            ) {
                return null;
            }
            return JSON.parse(contents[0]["field_visualizer_configuration"]);
        },
        plotClass() {
            let contents = this.researchPage;

            if (
                contents === null ||
                contents[0]["field_data_visualizer"] == false
            ) {
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

            if (
                contents === null ||
                contents[0]["field_data_visualizer_legend"] == false
            ) {
                return null;
            }
            return $("<textarea/>")
                .html(contents[0]["field_data_visualizer_legend"])
                .text();
        },
        researchMethodID() {
            let contents = this.researchPage;

            if (
                contents === null ||
                contents[0]["field_research_method"] == false
            ) {
                return null;
            }

            return contents[0]["field_research_method"];
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
        headerLogo() {
            let contents = this.$store.state.hugeampkpncms.researchMenu;

            if (contents.length === 0) {
                return null;
            }

            return contents[0].field_header_logo;
        },
        portalStyle() {
            let contents = this.$store.state.hugeampkpncms.researchMenu;

            if (contents.length === 0) {
                return null;
            }

            return contents[0].field_portal_style;
        },
        researchData() {
            let contents = this.$store.state.hugeampkpncms.researchData;

            if (contents.length === 0) {
                return null;
            } else {
                let convertedData =
                    this.dataType == "json" || this.dataType == "bioindex"
                        ? JSON.parse(contents)
                        : this.csv2Json(contents);

                if (this.dataType == "bioindex") {
                    if (convertedData.continuation != null) {
                        this.$store.dispatch(
                            "bioIndexContinue",
                            convertedData.data
                        );

                        let APIPoint = this.dataFiles[0];
                        if (this.dataType == "bioindex") {
                            APIPoint +=
                                "cont?token=" + convertedData.continuation;
                        }

                        let fetchParam = {
                            dataPoint: APIPoint,
                            domain: "external",
                        };

                        this.$store.dispatch(
                            "hugeampkpncms/getResearchData",
                            fetchParam
                        );
                    } else if (
                        convertedData.continuation == null &&
                        convertedData.page != 1
                    ) {
                        // merge the last arrived data to the collection of research data
                        this.$store.dispatch(
                            "bioIndexContinue",
                            convertedData.data
                        );
                        //merge all data from continue
                        let continuedData = this.$store.state.bioIndexContinue;
                        let mergedData = [];

                        continuedData.map((cont) => {
                            mergedData = mergedData.concat(cont);
                        });

                        let processedData =
                            this.dataTableFormat != null &&
                                !!this.dataTableFormat["data convert"]
                                ? this.convertData(
                                    this.dataTableFormat["data convert"],
                                    mergedData
                                )
                                : this.convertData("no convert", mergedData);

                        return processedData;
                    } else if (
                        convertedData.continuation == null &&
                        convertedData.page == 1
                    ) {
                        let returnData = convertedData.data;

                        let processedData =
                            this.dataTableFormat != null &&
                                !!this.dataTableFormat["data convert"]
                                ? this.convertData(
                                    this.dataTableFormat["data convert"],
                                    returnData
                                )
                                : this.convertData("no convert", returnData);

                        return processedData;
                    }
                } else {
                    let returnData;
                    if (typeof convertedData == "string") {
                        returnData =
                            this.dataType == "json"
                                ? JSON.parse(convertedData).data
                                : convertedData;
                    } else {
                        returnData =
                            this.dataType == "json"
                                ? (!!convertedData.data) ? convertedData.data : convertedData
                                : convertedData;
                    }

                    //console.log("typeof convertedData", typeof convertedData);
                    //console.log("returnData", returnData);

                    let processedData =
                        this.dataTableFormat != null &&
                            !!this.dataTableFormat["data convert"]
                            ? this.convertData(
                                this.dataTableFormat["data convert"],
                                returnData
                            )
                            : this.convertData("no convert", returnData);

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

            if (
                contents === null ||
                contents[0]["field_number_of_rows"] == false
            ) {
                return null;
            }
            return contents[0]["field_number_of_rows"];
        },
        tableLegend() {
            let contents = this.researchPage;

            if (
                contents === null ||
                contents[0]["field_data_table_legend"] == false
            ) {
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
        },
        dataFilesLabels() {


            let content = null;

            if (!!this.researchPage && !!this.$store.state.bioPortal.phenotypes && this.$store.state.bioPortal.phenotypes.length > 0) {



                if (this.researchPage[0]["field_data_points_list_labels"] != false) {
                    content = JSON.parse(this.researchPage[0]["field_data_points_list_labels"]);
                } else {
                    content = {};
                    this.dataFiles.map(d => {
                        content[d] = d;
                    })
                }

                if (!content["phenotype"]) {

                    let kpPhenotypes = this.$store.state.bioPortal.phenotypes
                    content["phenotype"] = {}

                    kpPhenotypes.map(p => {
                        content["phenotype"][p.name] = p.description;
                    });

                }
            }


            return content;
        },
        researchDataEmpty() {
            let content = this.$store.state.hugeampkpncms.researchDataEmpty;

            return content;

        }
    },

    watch: {
        filteredData(DATA) {
            this.getSubHeader();
        },
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        },
        codingGenesData(DATA) {
            this.$store.dispatch("codingGenesData", DATA["data"]);
        },
        searchingGenes(CONTENTS) {
            let genesData = CONTENTS["data"];
            let codingGenes = "";
            let genesLength = CONTENTS["data"] ? CONTENTS["data"].length : 0;
            if (genesLength > 1) {
                genesData.map((gene) => {
                    if ((gene.type = "protein_coding")) {
                        codingGenes += "'" + gene.name + "',";
                    }
                });

                codingGenes = codingGenes.slice(0, -1);

                if (codingGenes.length > 1) {
                    this.$store.dispatch("hugeampkpncms/getGenesData", {
                        genes: codingGenes,
                    });
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
                this.$store.dispatch("hugeampkpncms/getResearchPage", {
                    pageID: this.pageID,
                });
            }
        },
        portalStyle(style) {
            if (style != false && style != null) {
                this.addcss(style);
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
                    this.dataTableFormat = JSON.parse(
                        content[0]["field_data_table_format"]
                    );
                }
                //Load data

                if (this.dataType == "direct_csv") {
                    this.$store.dispatch(
                        "hugeampkpncms/directInputData",
                        content[0]["field_data_points"]
                    );
                } else {
                    if (content[0]["field_data_points"] != false) {
                        let dataFiles =
                            content[0]["field_data_points"].split(",");

                        this.dataFiles = dataFiles;

                        /// in case of phenotypes == kp phenotypes

                        let apis = JSON.parse(
                            content[0]["field_api_parameters"]
                        );

                        let isKPPhenotype = false;

                        if (apis) {
                            apis.parameters.map((pr) => {
                                if (
                                    pr.parameter == "phenotype" &&
                                    pr.values == "kp phenotypes"
                                ) {
                                    isKPPhenotype = true;
                                }
                            });
                        }

                        /*this.dataFilesLabels = JSON.parse(content[0]["field_data_points_list_labels"]);

                        if (isKPPhenotype == true) {
                            let kpPhenotypes =
                                this.$store.state.bioPortal.phenotypes;
                            let tempObj = {};

                            kpPhenotypes.map((p) => {
                                tempObj[p.name] = p.description;
                            });

                            // if there is data files lables filed is empty (null)
                            this.dataFilesLabels = !this.dataFilesLabels
                                ? {}
                                : this.dataFilesLabels;

                            this.dataFilesLabels["phenotype"] = tempObj;
                        }

                        console.log("this.dataFilesLabels", this.dataFilesLabels);*/


                        let initialData = dataFiles[0];

                        let dataPoint =
                            initialData.includes("http://") ||
                                initialData.includes("https://")
                                ? initialData
                                : "https://hugeampkpncms.org/sites/default/files/users/user" +
                                this.uid +
                                "/" +
                                initialData;

                        let domain =
                            initialData.includes("http://") ||
                                initialData.includes("https://")
                                ? "external"
                                : "hugeampkpn";

                        let fetchParam = {
                            dataPoint: dataPoint,
                            domain: domain,
                        };

                        if (this.isAPI != null && this.isAPI == false) {
                            this.$store.dispatch(
                                "hugeampkpncms/getResearchData",
                                fetchParam
                            );
                        } else if (this.isAPI == true) {
                            this.queryAPI();
                        }
                    }
                }

                //Load research method
                if (content[0]["field_research_method"] != false) {
                    let methodID = content[0]["field_research_method"];
                    let methodParam = { methodID: methodID };

                    this.$store.dispatch(
                        "hugeampkpncms/getResearchMethod",
                        methodParam
                    );
                }

                //Load research menu
                if (content[0]["field_page_header_menu_node_id"] != false) {
                    let menuID = content[0]["field_page_header_menu_node_id"];
                    let menuParam = { menuID: menuID };
                    this.$store.dispatch(
                        "hugeampkpncms/getResearchMenu",
                        menuParam
                    );
                }
            }
        },

        researchData(content) {
            // reset searching region if applicable



            if (content != null && content.length > 0) {
                let region, targetPlotConfig;

                if (this.plotConfig != null) {
                    targetPlotConfig = this.plotConfig["genes track"]
                        ? this.plotConfig["genes track"]
                        : this.plotConfig;
                    //["input type"] is required only for the plots that need 'region' value
                    if (targetPlotConfig["input type"]) {
                        switch (targetPlotConfig["input type"]) {
                            case "static":
                                region = targetPlotConfig.region;

                                break;
                            case "dynamic":
                                let regionParam =
                                    targetPlotConfig["dynamic parameter"];
                                let searchLength =
                                    this.$store.state.searchParameters[
                                        regionParam
                                    ].search.length;
                                region =
                                    this.$store.state.searchParameters[
                                        regionParam
                                    ].search[searchLength - 1];

                                break;
                            case "from data":
                                let chrField =
                                    targetPlotConfig["region fields"]
                                        .chromosome;
                                let posField =
                                    targetPlotConfig["region fields"].position;
                                let chr = null;
                                let posStart = null;
                                let posEnd = null;

                                content.map((c) => {
                                    chr = c[chrField];
                                    posStart =
                                        posStart == null
                                            ? c[posField]
                                            : c[posField] < posStart
                                                ? c[posField]
                                                : posStart;
                                    posEnd =
                                        posEnd == null
                                            ? c[posField]
                                            : c[posField] > posEnd
                                                ? c[posField]
                                                : posEnd;
                                });

                                region = chr + ":" + posStart + "-" + posEnd;

                                break;
                        }

                        this.$store.dispatch("searchingRegion", region);
                        this.$store.dispatch("hugeampkpncms/getGenesInRegion", {
                            region: region,
                        });
                    }
                }
            }

            if (content != null && content.length > 0) {
                uiUtils.hideElement("data-loading-indicator");

                let allData = this.checkDataComparison(
                    content,
                    this.$store.state.filteredData
                );

                if (this.dataTableFormat == null) {
                    let topRows = Object.keys(content[0]);
                    let dataTableFormat = { "top rows": topRows };
                    this.dataTableFormat = dataTableFormat;
                }
            }
        },
    },

    created() {
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
        this.$store.dispatch("bioPortal/getDiseaseSystems");
        this.pageID = keyParams.pageid || window.location.pathname.substring(3);
        if (this.pageID) {
            this.$store.dispatch("hugeampkpncms/getResearchMode", {
                pageID: this.pageID,
            });
        }
    },

    methods: {
        ...uiUtils,
        ...sessionUtils,
        postAlert,
        postAlertNotice,
        postAlertError,
        closeAlert,
        /// multi-sections use
        saveCapturedData(TYPE, TITLE) {
            let data = this.$store.state.capturedData.filter(d => d.title == TITLE);

            switch (TYPE) {
                case 'json':
                    uiUtils.saveJson(data[0].data, TITLE)
                    break;
                case 'csv':
                    uiUtils.convertJson2Csv(data[0].data, TITLE)
                    break;
            }
        },
        ///
        getSubHeader() {
            if (
                !!this.apiParameters &&
                !!this.apiParameters["parameters in sub header"]
            ) {
                const queryString = window.location.search;
                const urlParams = new URLSearchParams(queryString);
                let subHeaderContent =
                    "<span class='rp-sub-header-label'>Search parameters</span><div>";

                this.apiParameters["parameters in sub header"].map((p) => {
                    let paramVlue = urlParams.get(p);
                    subHeaderContent +=
                        '<span class="rp-sub-header-search-param-label">' +
                        p +
                        '</span>: <span class="rp-sub-header-search-param">' +
                        paramVlue +
                        "</span>";
                });
                subHeaderContent += "</div>";

                document.getElementById("rpSubHeader").innerHTML =
                    subHeaderContent;
            }
        },
        addcss(css) {
            var head = document.getElementsByTagName("head")[0];
            var s = document.createElement("style");
            s.setAttribute("type", "text/css");
            if (s.styleSheet) {
                // IE
                s.styleSheet.cssText = css;
            } else {
                // the world
                s.appendChild(document.createTextNode(css));
            }
            head.appendChild(s);
        },
        fetchDevPage() {
            let devID = this.devID;
            let devPW = this.devPW;

            this.$store.dispatch("hugeampkpncms/getResearchDevPage", {
                pageID: this.pageID,
                devID: devID,
                devPW: devPW,
            });
        },
        CSVToArray(strData, strDelimiter) {
            // Check to see if the delimiter is defined. If not,
            // then default to comma.
            strDelimiter = strDelimiter || ",";

            // Create a regular expression to parse the CSV values.
            var objPattern = new RegExp(
                // Delimiters.
                "(\\" +
                strDelimiter +
                "|\\r?\\n|\\r|^)" +
                // Quoted fields.
                '(?:"([^"]*(?:""[^"]*)*)"|' +
                // Standard fields.
                '([^"\\' +
                strDelimiter +
                "\\r\\n]*))",
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
            while ((arrMatches = objPattern.exec(strData))) {
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
                        new RegExp('""', "g"),
                        '"'
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
            return arrData;
        },

        csv2Json(DATA) {
            let rawData2 =
                this.dataType == "direct_csv" ? DATA : JSON.parse(DATA);

            let csvArr = this.CSVToArray(rawData2, ",");

            let jsonHeader = csvArr[0];
            csvArr.shift();

            let jsonData = [];

            csvArr.map((i) => {
                if (i.length > 1) {
                    let tempObj = {};

                    for (let h = 0; h < i.length; h++) {
                        tempObj[jsonHeader[h]] =
                            this.testNumber(i[h]) == true
                                ? Number(i[h])
                                : this.breakLines(i[h]);
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
            };

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
            };

            let scoreColumns = function (FIELDS, scoreBy, fData) {
                let fieldValue = 0;
                let fieldsLength = FIELDS.length;

                FIELDS.map((fName) => {
                    let scoreType = scoreBy[fName].type;
                    switch (scoreType) {
                        case "boolean":
                            let value2Score =
                                scoreBy[fName]["value to score"][fData[fName]];
                            fieldValue += value2Score;
                            break;
                    }
                });

                return fieldValue / fieldsLength;
            };

            let formatLocus = function (CHR, START, END, fData) {
                let locus = fData[CHR] + ":";
                locus += Math.ceil((fData[START] + fData[END]) / 2);
                return locus;
            };

            let array2String = function (CONTENT, SEPARATOR) {
                let string = "";
                CONTENT.map((c) => {
                    string += c + SEPARATOR;
                });

                return string.slice(0, -1);
            };

            let applyConvert = function (DATA, CONVERT, PHENOTYPE_MAP) {

                let tempObj = {};
                CONVERT.map((c) => {
                    let cType = c.type;

                    switch (cType) {
                        case "join":
                            tempObj[c["field name"]] = joinValues(
                                c["fields to join"],
                                c["join by"],
                                DATA
                            );
                            break;

                        case "join multi":
                            tempObj[c["field name"]] = joinMultiValues(
                                c["fields to join"],
                                c["join by"],
                                DATA
                            );
                            break;

                        case "split":
                            let newFields = c["field name"];
                            let newFieldValues = [];
                            let string2Split = DATA[c["field to split"]];
                            let loopIndex = 1;
                            c["split by"].map(s => {

                                let splittedValue = string2Split.split(s)

                                if (loopIndex < c["split by"].length) {
                                    newFieldValues.push(splittedValue[0])
                                    string2Split = splittedValue[1]
                                } else if (loopIndex = c["split by"].length) {
                                    newFieldValues.push(splittedValue[0])
                                    newFieldValues.push(splittedValue[1])
                                }
                                loopIndex++;
                            })

                            loopIndex = 0;

                            newFields.map(f => {
                                tempObj[f] = newFieldValues[loopIndex];
                                loopIndex++;
                            })

                            break;

                        case "get locus":
                            tempObj[c["field name"]] = formatLocus(
                                c["chromosome"],
                                c["start"],
                                c["end"],
                                DATA
                            );
                            break;

                        case "calculate":
                            let calType = c["calculation type"];

                            switch (calType) {
                                case "-log10":
                                    tempObj[c["field name"]] = -Math.log10(
                                        DATA[c["raw field"]]
                                    );
                                    break;
                            }
                            break;

                        case "js math":
                            let calFunc = c["method"];
                            tempObj[c["field name"]] = Math[calFunc](
                                DATA[c["raw field"]]
                            );

                            break;

                        case "raw":
                            tempObj[c["field name"]] = DATA[c["raw field"]];
                            break;

                        case "score columns":
                            tempObj[c["field name"]] = scoreColumns(
                                c["fields to score"],
                                c["score by"],
                                DATA
                            );
                            break;

                        case "array to string":
                            tempObj[c["field name"]] = array2String(
                                DATA[c["raw field"]],
                                c["separate by"]
                            );
                            break;

                        case "replace characters":
                            let replaceArr = c["replace"];
                            let rawString = DATA[c["raw field"]];
                            let newString = "";
                            let sIndex = 0;

                            replaceArr.map((r) => {
                                newString = sIndex == 0 ? rawString : newString;
                                //console.log("newString", newString);
                                if (newString) {
                                    newString = newString.replaceAll(
                                        r.from,
                                        r.to
                                    );
                                }
                                sIndex++;
                            });

                            tempObj[c["field name"]] = newString;
                            break;

                        case "kp phenotype name":
                            let pID = DATA[c["raw field"]];

                            tempObj[c["field name"]] = PHENOTYPE_MAP[pID]
                                ? PHENOTYPE_MAP[pID].description
                                : pID;
                            break;
                    }
                });

                return tempObj;
            };

            if (CONVERT != "no convert") {
                //console.log(this.$store.state.bioPortal.phenotypeMap);
                let phenotypeMap = this.$store.state.bioPortal.phenotypeMap;

                DATA.map((d) => {
                    let tempObj = applyConvert(d, CONVERT, phenotypeMap);

                    // Apply data convert to feature data level
                    let dKeys = Object.keys(tempObj);

                    let newTempObj = {};

                    dKeys.map((dKey) => {
                        if (
                            typeof tempObj[dKey] == "object" &&
                            tempObj[dKey].length > 0
                        ) {
                            let tempArr = [];

                            tempObj[dKey].map((fd) => {
                                let tempFDObj = applyConvert(
                                    fd,
                                    CONVERT,
                                    phenotypeMap
                                );
                                tempArr.push(tempFDObj);
                            });

                            newTempObj[dKey] = tempArr;
                        } else {
                            newTempObj[dKey] = tempObj[dKey];
                        }
                    });

                    convertedData.push(newTempObj);
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
            if (STR) {
                let cleanText = STR.replaceAll("\n", "<br>");
                return cleanText;
            }
        },
        queryAPI() {
            if (this.apiParameters.query.type == "array") {
                let parametersArr = this.apiParameters.query.format;
                let parametersArrLength = parametersArr.length;

                let paramTrueCount = 0;
                parametersArr.map((param, index) => {
                    if (keyParams[param]) {
                        paramTrueCount++;
                    }
                });

                if (paramTrueCount == parametersArrLength) {
                    this.$store.state.bioIndexContinue = [];
                    let queryParams = "";
                    parametersArr.map((param, index) => {
                        if (keyParams[param] != "noValue") {
                            let paramValue =
                                typeof keyParams[param] === "number"
                                    ? keyParams[param]
                                    : keyParams[param].trim();

                            queryParams += paramValue;
                            if (index + 1 < parametersArr.length) {
                                queryParams += ",";
                            }
                        } else {
                            if (queryParams[queryParams.length - 1] == ",") {
                                let newQP = queryParams.slice(0, -1);

                                queryParams = newQP;
                            }
                        }
                    });

                    let APIPoint = this.dataFiles[0];
                    if (this.dataType == "bioindex" && !!this.isAPI) {
                        /// set BioIndex API point
                        APIPoint +=
                            "query/" +
                            this.apiParameters.query.index +
                            "?q=" +
                            queryParams;
                    } else if (this.dataType != "bioindex" && !!this.isAPI) {
                        APIPoint += queryParams;
                    }

                    let fetchParam = {
                        dataPoint: APIPoint,
                        domain: "external",
                    };

                    this.$store.dispatch(
                        "hugeampkpncms/getResearchData",
                        fetchParam
                    );
                } else {
                    uiUtils.hideElement("data-loading-indicator");
                }
            }
        },
        checkDataComparison(newResearchData, previousData) {
            let dataComparison = this.$store.state.dataComparison;

            if (
                this.dataComparisonConfig != null &&
                newResearchData.length > 0
            ) {
                let comparingFields =
                    this.dataComparisonConfig["fields to compare"];

                let fieldGroupKeyValue = "";
                let keyParamIndex = 1;
                let groupKeysLength =
                    this.dataComparisonConfig["fields group data key"].length;

                this.dataComparisonConfig["fields group data key"].map(
                    (keyParam) => {
                        if (groupKeysLength == 1) {
                            fieldGroupKeyValue = document.getElementById(
                                "search_param_" + keyParam
                            ).value;
                        }
                        if (groupKeysLength > 1) {
                            if (keyParamIndex < groupKeysLength) {
                                fieldGroupKeyValue +=
                                    document.getElementById(
                                        "search_param_" + keyParam
                                    ).value + " ";
                            } else {
                                fieldGroupKeyValue += document.getElementById(
                                    "search_param_" + keyParam
                                ).value;
                            }
                            keyParamIndex++;
                        }
                    }
                );

                let processedData = {};

                switch (dataComparison) {
                    case "newSearch":
                        newResearchData.map((d) => {
                            let keyField =
                                d[this.dataComparisonConfig["key field"]];
                            let tempObj = {};
                            for (const [key, value] of Object.entries(d)) {
                                if (comparingFields.includes(key) == true) {
                                    tempObj[key] = {};
                                    tempObj[key][fieldGroupKeyValue] = value;
                                } else {
                                    tempObj[key] = value;
                                }
                            }
                            processedData[keyField] = tempObj;
                        });

                        break;

                    case "overlapping":
                        //let overlappingData = {};

                        newResearchData.map((d) => {
                            let keyFieldID =
                                d[this.dataComparisonConfig["key field"]];
                            if (previousData[keyFieldID]) {
                                processedData[keyFieldID] =
                                    previousData[keyFieldID];
                                comparingFields.map((cf) => {
                                    processedData[keyFieldID][cf][
                                        fieldGroupKeyValue
                                    ] = d[cf];
                                });
                            }
                        });

                        //return overlappingData;

                        break;
                    case "all":
                        //let allData = {};

                        newResearchData.map((d) => {
                            let keyFieldID =
                                d[this.dataComparisonConfig["key field"]];
                            if (previousData[keyFieldID]) {
                                processedData[keyFieldID] =
                                    previousData[keyFieldID];
                                comparingFields.map((cf) => {
                                    processedData[keyFieldID][cf][
                                        fieldGroupKeyValue
                                    ] = d[cf];
                                });
                            } else {
                                let tempObj = {};
                                for (const [key, value] of Object.entries(d)) {
                                    if (comparingFields.includes(key) == true) {
                                        tempObj[key] = {};
                                        tempObj[key][fieldGroupKeyValue] =
                                            value;
                                    } else {
                                        tempObj[key] = value;
                                    }
                                }
                                processedData[keyFieldID] = tempObj;
                            }
                        });

                        for (const [key, value] of Object.entries(
                            previousData
                        )) {
                            if (!processedData[key]) {
                                processedData[key] = value;
                            }
                        }

                        break;
                }

                this.$store.dispatch("unfilteredData", processedData);
                this.$store.dispatch("filteredData", processedData);

                return processedData;
            } else {
                this.$store.dispatch("unfilteredData", newResearchData);
                this.$store.dispatch("filteredData", newResearchData);

                return newResearchData;
            }
        },
        showTabContent(TAB, CONTENT, TAB_WRAPPER, CONTENT_WRAPPER) {
            uiUtils.showTabContent(TAB, CONTENT, TAB_WRAPPER, CONTENT_WRAPPER);
        },
    },

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
