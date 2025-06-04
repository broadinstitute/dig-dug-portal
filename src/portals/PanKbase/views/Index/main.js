import Vue from "vue";
import Template from "./Template.vue";

import "../../assets/layout.css";
import "../../assets/pkb-styles.css";

import { pankbaseMixin } from "../../mixins/pankbaseMixin.js";
import { getPankbaseContent } from "@/portals/PanKbase/utils/content";

new Vue({
    components: {},

    mixins: [pankbaseMixin],

    data: {
        newsFeed: null,
        content: {
            hero: {
                blurb: "A centralized knowledge base of the human pancreas for diabetes research.",
            },
            resources: {
                title: "Resources",
                subtitle: "Learn what is unique to PanKbase",
                rows: [
                    [
                        {
                            title: "PanKgraph",
                            body: "Identifying quantitative trait loci (QTLs) for genes in pancreatic and islet tissues",
                            linkLabel: "Learn More",
                            linkUrl: "https://pankgraph.org/",
                            bgImage:
                                "https://hugeampkpncms.org/sites/default/files/images/pankbase/pkb-landing-pankgraph-ctfr.png",
                            type: "large",
                            comingSoon: false,
                        },
                        {
                            title: "Integrated Maps of Pancreatic Islets",
                            body: "Single cell maps of gene expression and chromatin accessibility with data from >100 human donors from <a href='/hpap-program.html'>HPAP</a>, <a href='/iidp-program.html'>IIDP</a>, and <a target='_blank' href='https://prodolabs.com/'>Prodo</a>",
                            linkLabel: "Learn More",
                            linkUrl: "/single-cell.html",
                            bgImage:
                                "https://hugeampkpncms.org/sites/default/files/images/pankbase/pkb-landing-umap2.png",
                            type: "large",
                            comingSoon: false,
                        },
                    ],
                    [
                        {
                            title: "Donor Summary",
                            body: "Summarized metadata of ~3500 donors from <a href='/hpap-program.html'>HPAP</a>, <a href='/iidp-program.html'>IIDP</a>, <a target='_blank' href='https://prodolabs.com/'>Prodo</a>, <a href='/adi-program.html'>ADI IsletCore</a>, <a href='/npod-program.html'>nPOD</a>, and <a href='/pancreatlas-program.html'>Pancreatlas</a>",
                            linkLabel: "Learn More",
                            linkUrl: "/donor-metadata.html",
                            bgImage:
                                "https://hugeampkpncms.org/sites/default/files/images/pankbase/pkb-landing-donors2.png",
                            type: "medium",
                            comingSoon: false,
                        },
                        {
                            title: "Genetic Associations",
                            body: "",
                            linkLabel: "Learn More",
                            linkUrl: "/",
                            bgImage:
                                "https://hugeampkpncms.org/sites/default/files/images/pankbase/pkb-landing-manhattan.png",
                            type: "medium",
                            comingSoon: true,
                        },
                        {
                            title: "Image Browser",
                            body: "",
                            linkLabel: "Learn More",
                            linkUrl: "/",
                            bgImage:
                                "https://hugeampkpncms.org/sites/default/files/images/pankbase/pkb-landing-histology.png",
                            type: "medium",
                            comingSoon: true,
                        },
                    ],
                ],
            },
            tools: {
                title: "Tools and Workflows",
                subtitle: "Analyses you can do on PanKbase",
                rows: [
                    {
                        title: "Cell Browser",
                        body: "",
                        linkLabel: "Learn More",
                        linkUrl: "/single-cell.html",
                        bgImage:
                            "https://hugeampkpncms.org/sites/default/files/images/pankbase/pkb-landing-umap2.png",
                        type: "medium",
                        comingSoon: false,
                    },
                    {
                        title: "Find Relationships",
                        body: "",
                        linkLabel: "Learn More",
                        linkUrl: "https://pankgraph.org/",
                        bgImage:
                            "https://hugeampkpncms.org/sites/default/files/images/pankbase/pkb-landing-relationships.png",
                        type: "medium",
                        comingSoon: false,
                    },
                    {
                        title: "Differential Expression",
                        body: "",
                        linkLabel: "Learn More",
                        linkUrl: "/diff-exp.html",
                        bgImage:
                            "https://hugeampkpncms.org/sites/default/files/images/pankbase/pkb-landing-volcano.png",
                        type: "medium",
                        comingSoon: false,
                    },
                    {
                        title: "eQTLs",
                        body: "",
                        linkLabel: "Learn More",
                        linkUrl: "/",
                        bgImage:
                            "https://hugeampkpncms.org/sites/default/files/images/pankbase/pkb-landing-eqtl.png",
                        type: "medium",
                        comingSoon: true,
                    },
                ],
            },
            examples: {
                title: "Browse Examples",
                subtitle: "Explore what is in PanKbase",
                rows: [
                    {
                        title: "Pancreatic islet all donor single cell map",
                        linkLabel: "Explore",
                        linkUrl:
                            "/single-cell.html?PKBdatasetId=islet_of_Langerhans_scRNA",
                    },
                    {
                        title: "Identify quantitative trait loci for a gene",
                        linkLabel: "Explore",
                        linkUrl:
                            "https://pankgraph.org/result?snpId=rs2402203&leadSnp=rs2402203&geneId=ENSG00000001626&relationship=fine_mapped_eQTL&tissueKey=&dataSource=splicing%3B+GTEx&geneSymbol=CFTR",
                    },
                    {
                        title: "Catalog of multi-program pancreatic donors",
                        linkLabel: "Explore",
                        linkUrl: "https://data.pankbase.org",
                    },
                    {
                        title: "Interactive maps of harmonized multi-program metadata",
                        linkLabel: "Explore",
                        linkUrl: "https://pankbase.org/donor-metadata.html",
                    },
                ],
            },
            external: {
                title: "External Resources",
                subtitle:
                    "Research knowledge and tools from specialized sources",
                byor_node: "pankbase_programs",
                rows: [],
            },
            partners: {
                title: "Our Partners",
                list: [
                    {
                        url:"https://pancreatlas.org/",
                        logo:"https://hugeampkpncms.org/sites/default/files/images/pankbase/logo_pancreatlas.png"
                    },{
                        url:"https://cmdga.org/",
                        logo:"https://hugeampkpncms.org/sites/default/files/images/pankbase/logo_cmdga.png"
                    },{
                        url:"https://hugeamp.org/",
                        logo:"https://hugeampkpncms.org/sites/default/files/images/pankbase/logo_cmdkp.png"
                    },{
                        url:"https://dknet.org/",
                        logo:"https://hugeampkpncms.org/sites/default/files/images/pankbase/logo_dknet.png"
                    },
                ],
            },

            collaborate:
                "PanKbase is a growing resource that is actively under development. If you have new data, analysis tools, features, or visualizations that you'd like us to incorporate, please contact us at <a href='mailto:help@pankbase.org'>help@pankbase.org</a>",

            news: {
                feedUrl:
                    "https://hugeampkpncms.org/rest/news_list?project=pankbase",
                newsUrl: "/news.html",
                newsItemUrl: "/news.html?id=",
            },
        },
    },

    computed: {},

    watch: {},

    async created() {
        this.getNews();
        let extResources = await getPankbaseContent(
            this.content.external.byor_node
        );
        extResources.forEach(
            (item) => (item.comingSoon = item.comingSoon === "TRUE")
        );
        this.content.external.rows = extResources;
    },

    methods: {
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
    },

    render(createElement) {
        return createElement(Template);
    },
}).$mount("#app");
