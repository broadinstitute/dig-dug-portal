import Vue from "vue";
import Template from "./Template.vue";

import "../../css/f-layout.css";
import "../../css/sysbio.css";

import { sysbioMixin } from "../../mixins/sysbioMixin.js";

import ResearchBarInCellPlot from "@/components/researchPortal/ResearchBarInCellPlot.vue";

import dataConvert from "@/utils/dataConvert";

new Vue({
    components: {
        ResearchBarInCellPlot
    },
    mixins: [sysbioMixin],
    data: {
        newsFeed: null,
        content: {
            news: {
                feedUrl:
                    "https://hugeampkpncms.org/rest/news_list?project=sysbio",
                newsUrl: "/about.html?page=news",
                newsItemUrl: "/about.html?page=news&id=",
            },
            amps: {
                title: "Tools and Workflows",
                subtitle: "Analyses you can do on PanKbase",
                rows: [
                    {
                        title: "AMP® AD Alzheimer's Disease",
                        body: "Leveraging precision medicine to validate existing targets and discover novel targets and biomarkers.",
                        linkLabel: "Learn More",
                        linkUrl: "",
                        bgImage: "https://hugeampkpncms.org/sites/default/files/images/sysbio_amp_programs/AMP_AD.png",
                        type: "medium"
                    },
                    {
                        title: "AMP® ALS Amyotrophic Lateral Sclerosis",
                        body: "Identifying biomarkers, therapeutic targets, and clinical outcome assessments for ALS.",
                        linkLabel: "Learn More",
                        linkUrl: "",
                        bgImage: "https://hugeampkpncms.org/sites/default/files/images/sysbio_amp_programs/AMP_ALS.png",
                        type: "medium"
                    },
                    {
                        title: "AMP® AIM Autoimmune and Immune-Mediated Diseases",
                        body: "Understanding the cellular and molecular interactions that lead to AIM.",
                        linkLabel: "Learn More",
                        linkUrl: "/",
                        bgImage: "https://hugeampkpncms.org/sites/default/files/images/sysbio_amp_programs/AMP_AIM.jpg",
                        type: "medium"
                    },
                    {
                        title: "AMP® CMD Common Metabolic Diseases",
                        body: "Identifying targets for six common metabolic diseases: liver diseases, kidney diseases, obesity, cardiovascular diseases, type 2 diabetes/prediabetes, and type 1 diabetes.",
                        linkLabel: "Learn More",
                        linkUrl: "/",
                        bgImage: "https://hugeampkpncms.org/sites/default/files/images/sysbio_amp_programs/AMP_CMD.png",
                        type: "medium"
                    },

                    {
                        title: "AMP® PD Parkinson’s Disease",
                        body: "Identifying biomarkers and therapies for Parkinson’s Disease.",
                        linkLabel: "Learn More",
                        linkUrl: "/",
                        bgImage: "https://hugeampkpncms.org/sites/default/files/images/sysbio_amp_programs/AMP_PD.png",
                        type: "medium"
                    },
                    {
                        title: "AMP® RA/SLE Rheumatoid Arthritis and Systemic Lupus Erythematosus",
                        body: "Performing single cell-level analyses of tissue and blood samples from people with rheumatoid arthritis and systemic lupus erythematosus to pinpoint genes, proteins, pathways, and signaling networks. ",
                        linkLabel: "Learn More",
                        linkUrl: "/",
                        bgImage: "https://hugeampkpncms.org/sites/default/files/images/sysbio_amp_programs/AMP_RA-SLE.png",
                        type: "medium"
                    },
                    {
                        title: "AMP® SCZ Schizophrenia",
                        body: "Developing effective early-stage treatments for individuals at risk for schizophrenia, understanding disease pathways, and identifying targets for treatment.",
                        linkLabel: "Learn More",
                        linkUrl: "/",
                        bgImage: "https://hugeampkpncms.org/sites/default/files/images/sysbio_amp_programs/AMP_SCZ.png",
                        type: "medium"
                    },
                    {
                        title: "AMP® HF Heart Failure",
                        body: "Investigating heart failure with preserved ejection fraction (HFpEF) through deep phenotyping and data analysis.",
                        linkLabel: "Learn More",
                        linkUrl: "/",
                        bgImage: "https://hugeampkpncms.org/sites/default/files/images/sysbio_amp_programs/AMP_HF.png",
                        type: "medium"
                    },
                ],
            },
            partners: {
                title: "Our Partners",
                list: [
                    {
                        url: "",
                        logo: "https://hugeampkpncms.org/sites/default/files/images/sysbio_consortium/verily.png"
                    }, {
                        url: "",
                        logo: "https://hugeampkpncms.org/sites/default/files/images/sysbio_consortium/technome.png"
                    }, {
                        url: "",
                        logo: "https://hugeampkpncms.org/sites/default/files/images/sysbio_consortium/datatecnica.png"
                    }, {
                        url: "",
                        logo: "https://hugeampkpncms.org/sites/default/files/images/sysbio_consortium/sage.png"
                    }, {
                        url: "",
                        logo: "https://hugeampkpncms.org/sites/default/files/images/sysbio_consortium/Broad.png"
                    }, {
                        url: "",
                        logo: "https://hugeampkpncms.org/sites/default/files/images/sysbio_consortium/northwestern.png"
                    }, {
                        url: "",
                        logo: "https://hugeampkpncms.org/sites/default/files/images/sysbio_consortium/vanderbilt.png"
                    },
                ],
            },
        },
        dataComposition: {
            data: null,
            plotMargin: {
                leftMargin: 150,
                rightMargin: 40,
                topMargin: 20,
                bottomMargin: 100,
                bump: 11,
            },
            plotConfig: {
                "label": "",
                "x axis field": "Tissue Type",
                "y axis field": "Program",
                "bars in cell": [
                    {
                        "field": "Number of Control",
                        "color": "#ff00c6",
                        "value type": "number"
                    },
                    {
                        "field": "Number of Treatment",
                        "color": "#02b9ff",
                        "value type": "number"
                    },
                    {
                        "field": "Assay Type",
                        "color": "#666666",
                        "value type": "string"
                    }
                ],
                "bar width": 100,
                "bar height": 20,
                "plot margin": {
                    "left": 250,
                    "right": 50,
                    "top": 80,
                    "bottom": 5,
                    "bump": 10
                }
            },
            id: "sysBioDataComposition"
        }
    },
    async created() {
        this.getNews();
        this.getDataComposition();
    },
    methods: {
        ...dataConvert,
        async getNews() {
            const newsFeedUrl = this.content.news.feedUrl;
            const newsFeed = await fetch(newsFeedUrl).then((resp) => {
                return resp.json();
            });
            //trim feed to 5 items
            if (newsFeed.length > 5) newsFeed.length = 5;
            newsFeed.forEach((item) => {
                //extract only the img element frforom thumbnail, wysiwyg html can be polluted sometimes
                item.field_thumbnail_image =
                    new DOMParser()
                        .parseFromString(
                            item.field_thumbnail_image,
                            "text/html"
                        )
                        .querySelector("img")?.outerHTML || "";
            });
            this.newsFeed = newsFeed;
        },
        async getDataComposition() {
            const dataUrl = "https://hugeampkpncms.org/rest/directcsv?id=sysbio_program_x_tissue";
            let contentJson = await fetch(dataUrl).then((resp) => resp.json());

            if (contentJson.error == null) {
                let data = contentJson[0]['field_data_points'];
                this.dataComposition.data = dataConvert.csv2Json(data)
            }
        },
    },
    render: (h) => h(Template),
}).$mount("#app");
