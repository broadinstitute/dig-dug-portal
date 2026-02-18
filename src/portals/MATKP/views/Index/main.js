import Vue from "vue";
import Template from "./Template.vue";

import "../../assets/matkp-styles.css";

import { matkpMixin } from "../../mixins/matkpMixin.js";

import matkpHero from "@/portals/MATKP/components/matkp-hero.vue";
import matkpAnatomogram from "@/portals/MATKP/components/matkp-anatomogram.vue";
import { getNewsFeed } from "@/portals/MATKP/utils/content.js";

//import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils";
const BIO_INDEX_HOST = "https://bioindex-dev.hugeamp.org";

new Vue({
    components: {
        matkpHero,
        matkpAnatomogram,
    },
    mixins: [matkpMixin],

    data() {
        return {
            config: null,
            content:{
                collaborate: "MATKP is a growing resource that strives to create an inclusive community for adipose biology. As we develop MATKP, we welcome collaborations in areas including data collection and curation, method development, tool creation, and data visualization. We value input from data providers, experts, and multidisciplinary users to ensure the utility and relevance of our resource. To collaborate, please contact us at <a href='mailto:help@matkp.org'>help@matkp.org</a>.",

                news: {
                    feedId: "matkp",
                    newsUrl: "/info.html?page=news",
                    newsItemUrl: "/info.html?page=news&id=",
                },
            },
            newsFeed: null,

            datasetsAPI: "https://matkp.hugeampkpnbi.org/api/raw/file/single_cell_all_metadata/dataset_metadata.json.gz",
            datasets: null,
            data: null,
            primaryColorScale: null,
            secondaryColorScale: null

        };
    },

    watch: {},

    computed: {
        secondaryLegend() {
            if (!this.secondaryColorScale) return [];

            const labels = new Set();

            this.data.primary.forEach(p => {
                p.breakdown.forEach(b => {
                    labels.add(b.label);
                });
            });

            return Array.from(labels).map(label => ({
                label,
                color: this.secondaryColorScale(label)
            }));
        }
    },

    mounted() {
    },

    async created() {
        await this.getConfig();
        await this.getNews();
        await this.getDatasets();
    },

    methods: {
        async getConfig() {
            const dataPoint =
                "https://hugeampkpncms.org/rest/data?pageid=matkp_config";
            const result = await fetch(dataPoint).then((resp) => resp.json());
            const json = JSON.parse(result[0]["field_data_points"]);
            this.config = json;
            console.log("config", json);
        },
        async getNews() {
            this.newsFeed = await getNewsFeed(this.content.news.feedId);
        },

        async getDatasets() {
            const response = await fetch(this.datasetsAPI);
            const dataText = await response.text();
            const lines = dataText
                .split("\n")
                .filter((line) => line.trim() !== "");
            const jsonObjects = lines.map((line) => JSON.parse(line));
            this.datasets = jsonObjects;
            //this.filteredCount = this.datasets.length;
            console.log(this.datasets);

            this.data = this.groupByTwoKeys(this.datasets, 'species', 'data_type');
            console.log({sampleGrouping:this.data})
            this.makeDataViz();
        },

        groupByTwoKeys(datasets, primaryKey, secondaryKey) {
            const result = {
                total: datasets.length,
                primaryKey,
                secondaryKey,
                primary: []
            };

            const primaryMap = {};

            datasets.forEach(d => {
                const p = String(d[primaryKey]);
                const s = String(d[secondaryKey]);

                if (!primaryMap[p]) {
                    primaryMap[p] = {
                        label: p,
                        key: primaryKey,
                        count: 0,
                        breakdownMap: {}
                    };
                    result.primary.push(primaryMap[p]);
                }

                primaryMap[p].count++;

                if (!primaryMap[p].breakdownMap[s]) {
                primaryMap[p].breakdownMap[s] = {
                    label: s,
                    key: secondaryKey,
                    count: 0
                };
                }

                primaryMap[p].breakdownMap[s].count++;
            });

            result.primary.forEach(p => {
                p.breakdown = Object.values(p.breakdownMap);
                delete p.breakdownMap;
            });

            //result.primary.sort((a, b) => b.count - a.count);
            result.primary.forEach(p => {
                p.breakdown.sort((a, b) => b.count - a.count);
            });

            return result;
        },


        makeDataViz(){
            const HEIGHT = 100;
            const BAR_HEIGHT = 28;
            const GAP = 0;
            const PRIMARY_COLORS = ["#d100d1", "#b000b5", "#9c27b0", "#7b1fa2", "#6a1b9a"];
            const SECONDARY_COLORS = ["#ffe415", "#ffcf02", "#ffa903", "#ff8f00", "#ff6f00"];
            const container = d3.select("#data-viz");
            const data = this.data;
            const width = container.node().getBoundingClientRect().width;

            container.selectAll("*").remove();
            const svg = container
                .append("svg")
                .attr("width", width)
                .attr("height", HEIGHT)
                .attr("viewBox", `0 0 ${width} ${HEIGHT}`)
                .attr("preserveAspectRatio", "xMidYMid meet");

            const x = d3.scaleLinear()
                .domain([0, data.total])
                .range([0, width]);

            this.primaryColorScale = d3.scaleOrdinal()
                .range(PRIMARY_COLORS);

            this.secondaryColorScale = d3.scaleOrdinal()
                .range(SECONDARY_COLORS);

            const tooltip = d3.select("body")
                .append("div")
                .style("position", "absolute")
                .style("pointer-events", "none")
                .style("background", "#222")
                .style("color", "#fff")
                .style("padding", "6px 8px")
                .style("border-radius", "4px")
                .style("font-size", "12px")
                .style("opacity", 0);

            function addInteractions(selection, d) {
                selection
                .on("mouseenter", (event) => {
                    tooltip
                        .style("opacity", 1)
                        .html(d.tooltip);
                    selection.style("opacity", 0.5);
                })
                .on("mousemove", (event) => {
                    tooltip
                        .style("left", `${event.pageX + 8}px`)
                        .style("top", `${event.pageY + 8}px`);
                })
                .on("mouseleave", () => {
                    tooltip.style("opacity", 0);
                    selection.style("opacity", 1);
                })
                .on("click", () => {
                    console.log("clicked:", d);
                    let qs = "";
                    if (d.parent) {
                        // secondary level
                        qs = `${data.primaryKey}=${encodeURIComponent(d.parent.label.toLowerCase())}&${data.secondaryKey}=${encodeURIComponent(d.group.label.toLowerCase())}`;
                    } else {
                        // primary level
                        qs = `${data.primaryKey}=${encodeURIComponent(d.group.label.toLowerCase())}`;
                    }
                    window.location.href = `/datasets.html?${qs}`;
                });
            }

            svg.append("rect")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", width)
                .attr("height", BAR_HEIGHT)
                .attr("fill", "#ccc");

            svg.append("text")
                .attr("x", width / 2)
                .attr("y", BAR_HEIGHT / 2 + 5)
                .attr("text-anchor", "middle")
                .attr("fill", "#424242")
                .attr("font-weight", 600)
                .style("pointer-events", "none")
                .text(`${data.total}`);

            let cursor = 0;

            const primaryGroup = svg.append("g")
                .attr("transform", `translate(0, ${BAR_HEIGHT + GAP})`);

            data.primary.forEach(s => {
                const w = x(s.count);

                const rect = primaryGroup.append("rect")
                    .attr("x", cursor)
                    .attr("y", 0)
                    .attr("width", w)
                    .attr("height", BAR_HEIGHT)
                    .style("cursor", "pointer")
                    .attr("fill", this.primaryColorScale(s.label));

                addInteractions(rect, {
                    tooltip: `${data.primaryKey}: ${s.label}<br/>${s.count} datasets<br/><i>click to view</i>`,
                    group: s
                });

                primaryGroup.append("text")
                    .attr("x", cursor + w / 2)
                    .attr("y", BAR_HEIGHT / 2 + 5)
                    .attr("text-anchor", "middle")
                    .attr("fill", "#fff")
                    .attr("font-weight", 600)
                    .style("pointer-events", "none")
                    .text(`${s.label } ${s.count}`);

                cursor += w;
            });

            cursor = 0;

            const breakdownGroup = svg.append("g")
                .attr("transform", `translate(0, ${(BAR_HEIGHT + GAP) * 2})`);

            data.primary.forEach(s => {
                s.breakdown.forEach(b => {
                    const w = x(b.count);

                    const rect = breakdownGroup.append("rect")
                        .attr("x", cursor)
                        .attr("y", 0)
                        .attr("width", w)
                        .attr("height", BAR_HEIGHT)
                        .style("cursor", "pointer")
                        .attr("fill", this.secondaryColorScale(b.label));

                    addInteractions(rect, {
                        tooltip: `${data.primaryKey}: ${s.label}<br/>${data.secondaryKey}: ${b.label}<br/>${b.count} datasets<br/><i>click to view</i>`,
                        parent: s,
                        group: b
                    });

                    breakdownGroup.append("text")
                        .attr("x", cursor + w / 2)
                        .attr("y", BAR_HEIGHT / 2 + 5)
                        .attr("text-anchor", "middle")
                        .attr("font-weight", 600)
                        .attr("fill", "#424242")
                        .style("pointer-events", "none")
                        .text(b.count);

                    cursor += w;
                });
            });

            const splitX = x(data.primary[0].count);

            svg.append("line")
                .attr("x1", splitX)
                .attr("x2", splitX)
                .attr("y1", BAR_HEIGHT + GAP)
                .attr("y2", BAR_HEIGHT*3 + 10)
                .attr("stroke", "#555")
                .attr("stroke-dasharray", "4,4")
                .attr("stroke-width", "2");


        }
    },

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
