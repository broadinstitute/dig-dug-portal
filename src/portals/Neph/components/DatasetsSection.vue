<template>
    <div>
        <div>
            <span style="color: #00b9f2; font-family: 'Oswald'; font-size: 65px"
                >{{ $store.state.bioPortal.datasets.length }} datasets,</span
            >
            <span style="color: #80c242; font-family: 'Oswald'; font-size: 65px"
                >&nbsp;{{
                    $store.state.bioPortal.phenotypes.length
                }}
                traits</span
            >
        </div>

        <div id="datasets-chart"></div>
        <div style="text-align: center">
            <h4>
                <a href="/research.html?pageid=bch_datasets_n127">Browse data here ></a>
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
            data: [500, 1000],
        };
    },
    methods: {
        renderCharts: function (DATASETS) {
            var renderTable = function (TABLEDATA, TABLETYPE) {
                let tableContent =
                    '<div class="front-' + TABLETYPE + '-graph">';

                tableContent +=
                    '<h4 style = "text-transform:capitalize;">' +
                    TABLETYPE +
                    "</h4>";

                let renderingData = TABLEDATA.sort((a, b) =>
                    a.value < b.value ? 1 : -1
                );

                let valueHigh = renderingData[0].value;

                renderingData.map((t) => {
                    let valuePercent = (t.value / valueHigh) * 100;
                    let percentBG =
                        '<div style="width:' +
                        valuePercent +
                        '%" class="percent-bg">&nbsp;</div>';

                    let infoLabel =
                        '<div class="info-label">' +
                        t.label +
                        " KP: <strong>" +
                        t.value +
                        "</strong></div>";

                    tableContent +=
                        "<div class='each-item'>" +
                        percentBG +
                        infoLabel +
                        "</div>";
                });

                tableContent += "</div>";

                document.getElementById(
                    "datasets-chart"
                ).innerHTML += tableContent;
            };
            var renderPie = function (PIEDATA, SVGID, COLORSET, WIDTH, HEIGHT) {
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
                    .value(function (d) {
                        return d.value;
                    });

                var key = function (d) {
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
                    .style("fill", function (d) {
                        return color(d.value);
                    });

                var g = svg
                    .select(".labels")
                    .selectAll(".arc")
                    .data(pie(PIEDATA))
                    .enter();

                g.append("text")
                    .attr("transform", function (d) {
                        return "translate(" + labelArc.centroid(d) + ")";
                    })
                    .attr("dy", ".2em")
                    .attr("text-anchor", "middle")
                    .attr("class", "slice-value")
                    .text(function (d) {
                        return d.value;
                    });

                g.append("text")
                    .attr("transform", function (d) {
                        return "translate(" + labelArc.centroid(d) + ")";
                    })
                    .attr("dy", "1.6em")
                    .attr("text-anchor", "middle")
                    .attr("class", "slice-label")
                    .text(function (d) {
                        return d.data.label;
                    });
            };
            /*
            $("#datasets-chart").append(
                "<svg id='datasets-svg' style='width:300px; height:250px;'></svg>"
            );
            $("#datasets-chart").append(
                "<svg id='phenotypes-svg' style='width:300px; height:250px;'></svg>"
            );
*/
            let portals = [];

            this.diseaseGroups.map((x) => {
                if (x.memberCMD && x.default != true) portals.push(x);
            });

            let datasetsData = [];
            let phenotypesData = [];

            portals.map((p) => {
                let tempDatasetObj = {
                    label: p.description,
                    value: DATASETS[p.name + "DatasetsNum"],
                };
                datasetsData.push(tempDatasetObj);

                let tempPhenotypesObj = {
                    label: p.description,
                    value: DATASETS[p.name + "PhenotypesNum"],
                };
                phenotypesData.push(tempPhenotypesObj);
            });

            let datasetsColors = [
                "#00b9f2ff",
                "#00b9f2dd",
                "#00b9f2bb",
                "#00b9f299",
                "#00b9f277",
                "#00b9f255",
                "#00b9f233",
                "#00b9f211",
            ];

            let phenotypesColors = [
                "#80c342ff",
                "#80c342dd",
                "#80c342bb",
                "#80c34299",
                "#80c34277",
                "#80c34255",
                "#80c34233",
                "#80c34211",
            ];

            renderTable(datasetsData, "datasets");
            renderTable(phenotypesData, "phenotypes");

            //renderPie(datasetsData, "datasets-svg", datasetsColors, 300, 250);
            /*renderPie(
                phenotypesData,
                "phenotypes-svg",
                phenotypesColors,
                300,
                250
            );*/
        },
    },
    mounted: function () {},
    computed: {
        processedDatasetsInfo() {
            var onlyUnique = function (value, index, self) {
                return self.indexOf(value) === index;
            };

            let datasets = this.datasetsInfo;
            let datasetsMap = {};

            let portals = [];

            this.diseaseGroups.map((x) => {
                if (x.memberCMD && x.default != true) portals.push(x.name);
            });

            datasetsMap["totalDatasetsNum"] = 0;
            datasetsMap["totalPhenotypes"] = [];

            portals.forEach(function (d) {
                datasetsMap[d + "DatasetsNum"] = 0;
                datasetsMap[d + "Phenotypes"] = [];
            });

            $.each(datasets, function (i, v) {
                let tempPheotypes = v.field_phenotypes.split("\r\n");

                let memberDataset = false;

                portals.forEach(function (d) {
                    if (
                        v.field_portals.indexOf(d) >= 0 ||
                        v.field_portals.indexOf("all") >= 0
                    ) {
                        memberDataset = true;
                        datasetsMap[d + "DatasetsNum"]++;
                        tempPheotypes.forEach(function (phenotype) {
                            datasetsMap[d + "Phenotypes"].push(phenotype);
                            datasetsMap["totalPhenotypes"].push(phenotype);
                        });
                    }
                });

                if (memberDataset == true) {
                    datasetsMap["totalDatasetsNum"]++;
                }
            });

            datasetsMap["totalPhenotypes"] = datasetsMap[
                "totalPhenotypes"
            ].filter(onlyUnique);

            datasetsMap["totalPhenotypesNum"] =
                datasetsMap["totalPhenotypes"].length;

            $.each(portals, function (e, d) {
                datasetsMap[d + "Phenotypes"] = datasetsMap[
                    d + "Phenotypes"
                ].filter(onlyUnique);

                datasetsMap[d + "PhenotypesNum"] =
                    datasetsMap[d + "Phenotypes"].length;
            });

            return datasetsMap;
        },
    },
    watch: {
        processedDatasetsInfo(datasetsInfo) {
            if (this.diseaseGroup.default) {
                this.renderCharts(datasetsInfo);
            }
        },
    },
});
</script>
