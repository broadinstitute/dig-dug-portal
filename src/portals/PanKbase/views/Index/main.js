import Vue from "vue";
import Template from "./Template.vue";

import "../../assets/layout.css";
import "../../assets/pkb-styles.css";

import { pankbaseMixin } from "../../mixins/pankbaseMixin.js";

new Vue({
    components: {},

    mixins: [pankbaseMixin],

    data: {
        newsFeed: null,
        content:{
            hero:{
                blurb: "A centralized resource of the human pancreas for diabetes research."
            },
            resources:{
                title: "Resources",
                subtitle: "Learn what is unique to PanKbase",
                rows: [
                    [
                        {
                            title: "PanKgraph",
                            body: "",
                            linkLabel: "Learn More",
                            linkUrl: "https://dev.pankgraph.org/",
                            bgImage: "https://hugeampkpncms.org/sites/default/files/images/pankbase/pkb-landing-pankgraph.jpg",
                            type: "large",
                            comingSoon: false,
                        },
                        {
                            title: "Integrated Maps of the pancreas",
                            body: "",
                            linkLabel: "Learn More",
                            linkUrl: "/",
                            bgImage: "https://hugeampkpncms.org/sites/default/files/images/pankbase/pkb-landing-umap.jpg",
                            type: "large",
                            comingSoon: false,
                        }
                    ],
                    [
                        {
                            title: "Donor Metadata",
                            body: "",
                            linkLabel: "Learn More",
                            linkUrl: "/",
                            bgImage: "https://hugeampkpncms.org/sites/default/files/images/pankbase/pkb-landing-donors.png",
                            type: "medium",
                            comingSoon: false,
                        },
                        {
                            title: "Genetic Associations",
                            body: "",
                            linkLabel: "Learn More",
                            linkUrl: "/",
                            bgImage: "https://hugeampkpncms.org/sites/default/files/images/pankbase/pkb-landing-manhattan.png",
                            type: "medium",
                            comingSoon: true,
                        },
                        {
                            title: "Image Browser",
                            body: "",
                            linkLabel: "Learn More",
                            linkUrl: "/",
                            bgImage: "https://hugeampkpncms.org/sites/default/files/images/pankbase/pkb-landing-histology.png",
                            type: "medium",
                            comingSoon: true,
                        }
                    ]
                ]
            },
            tools:{
                title: "Tools and Workflows",
                subtitle: "Analyses you can do on PanKbase",
                rows: [
                    {
                        title: "Cell Browser",
                        body: "",
                        linkLabel: "Learn More",
                        linkUrl: "/",
                        bgImage: "https://hugeampkpncms.org/sites/default/files/images/pankbase/pkb-landing-scexpression.png",
                        type: "medium",
                        comingSoon: false,
                    },
                    {
                        title: "Find Relationships",
                        body: "",
                        linkLabel: "Learn More",
                        linkUrl: "/",
                        bgImage: "https://hugeampkpncms.org/sites/default/files/images/pankbase/pkb-landing-relationships.png",
                        type: "medium",
                        comingSoon: false,
                    },
                    {
                        title: "Differential Expression",
                        body: "",
                        linkLabel: "Learn More",
                        linkUrl: "/",
                        bgImage: "https://hugeampkpncms.org/sites/default/files/images/pankbase/pkb-landing-volcano.png",
                        type: "medium",
                        comingSoon: true,
                    },
                    {
                        title: "eQTLs",
                        body: "",
                        linkLabel: "Learn More",
                        linkUrl: "/",
                        bgImage: "https://hugeampkpncms.org/sites/default/files/images/pankbase/pkb-landing-eqtl.png",
                        type: "medium",
                        comingSoon: true,
                    }
                ]
            },
            examples: {
                title: "Browse Examples",
                subtitle: "Explore what is in PanKbase",
                rows: [
                    {
                        title: "Pancreatic islet all donor single cell map",
                        linkLabel: "Explore",
                        linkUrl: "/",
                    },
                    {
                        title: "Pancreatic islet diabetics single cell map",
                        linkLabel: "Explore",
                        linkUrl: "/",
                    },
                    {
                        title: "Top 20 DEG pancreas X diabetes",
                        linkLabel: "Explore",
                        linkUrl: "/",
                    },
                    {
                        title: "Identify pancreatic eQTLs for a gene",
                        linkLabel: "Explore",
                        linkUrl: "/",
                    }
                ]
            },
            external:{
                title: "External Resources",
                subtitle: "Research knowledge and tools from specialized sources",
                rows: [
                    {
                        title: "HPAP",
                        body: "Understanding type 1 and type 2 diabetes through deep molecular phenotyping",
                        linkLabel: "Learn More",
                        linkUrl: "/",
                        bgImage: "https://hugeampkpncms.org/sites/default/files/images/pankbase/pkb-landing-hpap.png",
                        type: "medium",
                        comingSoon: false,
                    },
                    {
                        title: "IIDP",
                        body: "Distributing samples and data derived from human islets and associated tissues",
                        linkLabel: "Learn More",
                        linkUrl: "/",
                        bgImage: "https://hugeampkpncms.org/sites/default/files/images/pankbase/pkb-landing-iidp.png",
                        type: "medium",
                        comingSoon: false,
                    },
                    {
                        title: "nPOD",
                        body: "Identifying mechanisms for prevention or reversal of type 1 diabetes",
                        linkLabel: "Learn More",
                        linkUrl: "/",
                        bgImage: "https://hugeampkpncms.org/sites/default/files/images/pankbase/pkb-landing-npod.png",
                        type: "medium",
                        comingSoon: false,
                    },
                    {
                        title: "Pancreatlas",
                        body: "Facilitating pancreatic disease research through accessible imaging datasets",
                        linkLabel: "Learn More",
                        linkUrl: "/",
                        bgImage: "https://hugeampkpncms.org/sites/default/files/images/pankbase/pkb-landing-pancreatlas.png",
                        type: "medium",
                        comingSoon: false,
                    },
                    {
                        title: "ADI",
                        body: "Isolating, biobanking, and distributing human islets and associated tissues",
                        linkLabel: "Learn More",
                        linkUrl: "/",
                        bgImage: "https://hugeampkpncms.org/sites/default/files/images/pankbase/pkb-landing-adi.png",
                        type: "medium",
                        comingSoon: false,
                    }
                ]
            },
            partners: {
                title: "Our Partners",
                logos: [
                    "https://hugeampkpncms.org/sites/default/files/images/pankbase/logo_hirn.png",
                    "https://hugeampkpncms.org/sites/default/files/images/pankbase/logo_pancreatlas.png",
                    "https://hugeampkpncms.org/sites/default/files/images/pankbase/logo_cmdga.png",
                    "https://hugeampkpncms.org/sites/default/files/images/pankbase/logo_cmdkp.png"
                ]
            },
            supporters: {
                title: "Supported By",
                logos: [
                    "https://hugeampkpncms.org/sites/default/files/images/pankbase/logo_nih-niddk.png",
                    "https://hugeampkpncms.org/sites/default/files/images/pankbase/logo_nih-odss.png"
                ]
            },

            collaborate: "PanKbase is a growing resource that is actively under development. If you have new data, analysis tools, features, or visualizations that you'd like us to incorporate, please contact us at <a href='mailto:help@pankbase.org'>help@pankbase.org</a>",
        
            news:{
                feedUrl: "https://hugeampkpncms.org/rest/news_list?project=pankbase",
                newsUrl: "/news.html",
                newsItemUrl: "/news.html?id="
            }
        }
    },

    computed: {},

    watch: {},

    async created() {
        this.getNews();
    },

    methods: {
        async getNews(){
            const newsFeedUrl = this.content.news.feedUrl;
            const newsFeed = await fetch(newsFeedUrl).then(resp => { return resp.json();});
            //trim feed to 5 items
            if(newsFeed.length > 5) newsFeed.length = 5;
            newsFeed.forEach(item=>{
                //extract only the img element frforom thumbnail, wysiwyg html can be polluted sometimes
                item.field_thumbnail_image = new DOMParser().parseFromString(item.field_thumbnail_image, 'text/html').querySelector('img')?.outerHTML || '';
            })
            this.newsFeed = newsFeed;
        }
    },

    render(createElement) {
        return createElement(Template);
    },
}).$mount("#app");
