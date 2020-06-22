<template>
    <div>
        <div>
            <span
                style="color: #00b9f2;font-family: 'Oswald'; font-size: 65px"
            >{{ processedDatasetsInfo.totalDatasetsNum }} datasets,</span>
            <span
                style="color: #80C242;font-family: 'Oswald'; font-size: 65px"
            >&nbsp;{{ processedDatasetsInfo.totalPhenotypesNum }} traits</span>
        </div>
        <div id="datasets-chart"></div>
        <div style="text-align: center;">
            <h4>
                <a href="/datasets.html">Browse data here ></a>
            </h4>
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import * as d3 from "d3";
import $ from "jquery";

export default Vue.component("datasets-section", {
    props: ["diseaseGroup", "diseaseGroups", "datasetsInfo"],
    data() {
        return {
            datasets_chart: null,
            phenotypes_chart: null,
            data: [500, 1000]
        };
    },
    methods: {
        renderCharts: function(DATASETS) {
            //console.log(DATASETS);

            var randerPie = function(PIEDATA, SVGID, COLORSET, WIDTH, HEIGHT) {
                //console.log(PIEDATA);

                var width = WIDTH,
                    height = HEIGHT,
                    radius = Math.min(width, height) / 2;

                var color = d3.scaleOrdinal().range(COLORSET);

                var arc = d3
                    .arc()
                    .outerRadius(radius - 10)
                    .innerRadius(0);

                var labelArc = d3
                    .arc()
                    .outerRadius(radius - 50)
                    .innerRadius(radius - 50);

                var pie = d3
                    .pie()
                    .sort(null)
                    .value(function(d) {
                        return d.value;
                    });

                var key = function(d) {
                    return d.data.label;
                };

                var svg = d3
                    .select("#" + SVGID)
                    .append("g")
                    .attr(
                        "transform",
                        "translate(" + width / 2 + "," + height / 2 + ")"
                    );

                svg.append("g").attr("class", "slices");
                svg.append("g").attr("class", "labels");

                var g = svg
                    .select(".slices")
                    .selectAll(".arc")
                    .data(pie(PIEDATA))
                    .enter()
                    .append("g")
                    .attr("class", "arc");

                g.append("path")
                    .attr("d", arc)
                    .attr("stroke", "#fffff")
                    .style("fill", function(d) {
                        return color(d.value);
                    });

                var g = svg
                    .select(".labels")
                    .selectAll(".arc")
                    .data(pie(PIEDATA))
                    .enter();

                g.append("text")
                    .attr("transform", function(d) {
                        return "translate(" + labelArc.centroid(d) + ")";
                    })
                    .attr("dy", ".2em")
                    .attr("text-anchor", "middle")
                    .attr("class", "slice-value")
                    .text(function(d) {
                        return d.value;
                    });

                g.append("text")
                    .attr("transform", function(d) {
                        return "translate(" + labelArc.centroid(d) + ")";
                    })
                    .attr("dy", "1.6em")
                    .attr("text-anchor", "middle")
                    .attr("class", "slice-label")
                    .text(function(d) {
                        return d.data.label;
                    });
            };

            $("#datasets-chart").append(
                "<svg id='datasets-svg' style='width:300px; height:250px;'></svg>"
            );
            $("#datasets-chart").append(
                "<svg id='phenotypes-svg' style='width:300px; height:250px;'></svg>"
            );
            /*$("#datasets-chart").append(
                "<svg id='data-types-svg' style='width:600px; height:250px;'></svg>"
            );*/

            let datasetsData = [
                { label: "Type 2 Diabetes", value: DATASETS.t2dDatasetsNum },
                {
                    label: "Cardiovascular Disease",
                    value: DATASETS.cvdDatasetsNum
                },
                {
                    label: "Cerebrovascular Disease",
                    value: DATASETS.cdDatasetsNum
                },
                { label: "Sleep Disorder", value: DATASETS.sleepDatasetsNum }
            ];
            let datasetsColors = ["#00b9f2", "#6dcff6", "#9ddcf9", "#c7eafb"];

            let phenotypesData = [
                { label: "Type 2 Diabetes", value: DATASETS.t2dPhenotypesNum },
                {
                    label: "Cardiovascular Disease",
                    value: DATASETS.cvdPhenotypesNum
                },
                {
                    label: "Cerebrovascular Disease",
                    value: DATASETS.cdPhenotypesNum
                },
                { label: "Sleep Disorder", value: DATASETS.sleepPhenotypesNum }
            ];
            let phenotypesColors = ["#80c342", "#a3cf62", "#c6de89", "#e6f0cb"];

            let dataTypesData = [
                { label: "GWAS", value: DATASETS["GWASNum"] },
                {
                    label: "Exome chip",
                    value: DATASETS["Exome chipNum"]
                },
                {
                    label: "Exome sequence analysis",
                    value: DATASETS["Exome sequence analysisNum"]
                },
                {
                    label: "Whole genome sequencing",
                    value: DATASETS["Whole genome sequencingNum"]
                }
            ];

            randerPie(datasetsData, "datasets-svg", datasetsColors, 300, 250);
            randerPie(
                phenotypesData,
                "phenotypes-svg",
                phenotypesColors,
                300,
                250
            );
        }
    },
    mounted: function() {},
    computed: {
        processedDatasetsInfo() {
            var onlyUnique = function(value, index, self) {
                return self.indexOf(value) === index;
            };

            let datasets = this.datasetsInfo;
            let datasetsMap = {};
            /*let t2dDatasets = 0,
                strokeDatasets = 0,
                miDatasets = 0,
                sleepDatasets = 0,
                totalDatasets = 0;*/

            let portals = ["t2d", "cd", "cvd", "sleep"];
            let dataTypes = [
                "GWAS",
                "Exome chip",
                "Exome sequence analysis",
                "Whole genome sequencing"
            ];

            datasetsMap["totalDatasetsNum"] = 0;
            datasetsMap["totalPhenotypes"] = [];

            portals.forEach(function(d) {
                datasetsMap[d + "DatasetsNum"] = 0;
                datasetsMap[d + "Phenotypes"] = [];
            });

            dataTypes.forEach(function(d) {
                datasetsMap[d + "Num"] = 0;
            });

            $.each(datasets, function(i, v) {
                let tempPheotypes = v.field_phenotypes.split("\r\n");

                portals.forEach(function(d) {
                    if (
                        v.field_portals.indexOf(d) >= 0 ||
                        v.field_portals.indexOf("all") >= 0
                    ) {
                        datasetsMap[d + "DatasetsNum"]++;
                        tempPheotypes.forEach(function(phenotype) {
                            datasetsMap[d + "Phenotypes"].push(phenotype);
                            datasetsMap["totalPhenotypes"].push(phenotype);
                        });
                    }
                });

                if (
                    v.field_portals.indexOf("t2d") >= 0 ||
                    v.field_portals.indexOf("cd") >= 0 ||
                    v.field_portals.indexOf("cvd") >= 0 ||
                    v.field_portals.indexOf("sleep") >= 0 ||
                    v.field_portals.indexOf("all") >= 0
                ) {
                    datasetsMap["totalDatasetsNum"]++;
                }

                dataTypes.forEach(function(d) {
                    if (v.field_data_type.indexOf(d) >= 0) {
                        datasetsMap[d + "Num"]++;
                    }
                });
            });

            datasetsMap["totalPhenotypes"] = datasetsMap[
                "totalPhenotypes"
            ].filter(onlyUnique);

            datasetsMap["totalPhenotypesNum"] =
                datasetsMap["totalPhenotypes"].length;

            $.each(portals, function(e, d) {
                datasetsMap[d + "Phenotypes"] = datasetsMap[
                    d + "Phenotypes"
                ].filter(onlyUnique);

                datasetsMap[d + "PhenotypesNum"] =
                    datasetsMap[d + "Phenotypes"].length;
            });

            return datasetsMap;
        }
    },
    watch: {
        processedDatasetsInfo(datasetsInfo) {
            if (this.diseaseGroup.default) {
                this.renderCharts(datasetsInfo);
            }
        }
    }
});
</script>
