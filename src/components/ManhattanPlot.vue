<template>
    <div>
        <div :id="`manhattan_${uniqueId}`" style="width: 100%; height: 300px"></div>
    </div>
</template>

<script>
import Vue from "vue";
import c3 from "c3";
import Colors from "@/utils/colors";
import Formatters from "@/utils/formatters";
import { difference } from "lodash";

export default Vue.component("ManhattanPlot", {
    props: ["associations", "colorByPhenotype", "phenotypes", "phenotypeMap"],

    data() {
        return {
            chart: null,
            uniqueId: Math.floor(Math.random() * 10e9)
        };
    },

    computed: {
        columns() {
            // This is getting computed many, many times. Can we reduce the number of calls?
            console.log(JSON.stringify(this.phenotypes));
            if (this.phenotypes.length === 1){
                return this.columnsByGene();
            }
            let n = (this.associations || []).length;

            // if no phenotypes, then just 2 columns for generic pValue
            if (!this.phenotypes) {
                let x = new Array(n + 1);
                let y = new Array(n + 1);

                x[0] = "pValue_x";
                y[0] = "pValue";

                this.associations.forEach((r, i) => {
                    x[i + 1] = chromosomeStart[r.chromosome] + r.position;
                    y[i + 1] = -Math.log10(r.pValue);
                });

                return [x, y];
            }

            let columns = [];

            // each phenotype gets two columns of data (x and y)
            this.phenotypes.forEach((p, i) => {
                let x = [`${p}_x`];
                let y = [p];

                this.associations.forEach((r) => {
                    if (r.phenotype == p) {
                        x.push(chromosomeStart[r.chromosome] + r.position);
                        y.push(-Math.log10(r.pValue));
                    } else {
                        console.log("Non-matching phenotype!!!");
                    }
                });

                columns.push(x);
                columns.push(y);
            });

            return columns;
        },
        columnKeys() {
            let xs = {};
            let phenotypeMap = this.phenotypeMap;

            // if there's a list of phenotypes, each phenotype gets a color
            if (!this.phenotypes) {
                return { pValue: "pValue_x" };
            }

            this.phenotypes.forEach((p) => {
                xs[p] = `${p}_x`;
            });

            return xs;
        },
        geneKeys(){
            let xs = {};
            this.associations.forEach(r => {
                xs[r.gene] = `${r.gene}_x`;
            });
            return xs;
        }
    },

    watch: {
        columns(data) {
            let columns = data;
            let xs = this.phenotypes.length !== 1 ? this.columnKeys : this.geneKeys;

            this.build_chart(xs, columns);
        },
    },

    mounted() {
        this.build_chart({}, []);
    },

    methods: {
        columnsByGene(){
            let columns = [];
            this.associations.forEach(r => {
                let x = [`${r.gene}_x`, chromosomeStart[r.chromosome] + r.position];
                let y = [r.gene, -Math.log10(r.pValue)];
                columns.push(x);
                columns.push(y);
            });
            return columns;
        },
        build_chart(xs, columns) {
            let component = this;
            let names = {};

            for (let p in xs) {
                names[p] = this.phenotypeMap[p]?.description;
            }

            // attach to the dom
            this.chart = c3.generate({
                bindto: `#manhattan_${this.uniqueId}`,
                size: {
                    height: 300,
                },
                interaction: {
                    enabled: true,
                },
                data: {
                    xs,
                    columns,
                    names,
                    type: "scatter",
                    order: null,
                    color: function (color, d) {
                        //console.log(JSON.stringify(d));
                        if (
                            !component.phenotypes ||
                            !component.colorByPhenotype
                        ) {
                            return positionColors.find((c) => d.x < c[0])[1];
                        }

                        // phenotype index will determine the color
                        let i = component.phenotypes.indexOf(d.id);

                        // if not found, default to black
                        return i >= 0 ? Colors[i] : "#000";
                    },
                },
                legend: {
                    show: false,
                },
                zoom: {
                    enabled: false,
                    rescale: false,
                },
                point: {
                    r: 4,
                    focus: {
                        expand: {
                            enabled: true,
                            r: 7,
                        },
                    },
                },
                tooltip: {
                    show: true,
                    grouped: true,
                    contents: function (d, titleFormat, valueFormat, color) {
                        let contents = '<div class="manhattan-tooltip">';

                        // do any of the entries have a gene name?
                        let dGene = d.find((d) => !!d.gene);
                        let title = dGene ? dGene.gene : "P-value";

                        // make a table
                        contents += `<table cellspacing="4">
                        <thead><tr>
                            <th colspan="2" class="p-value">${title}</th>
                        </tr></thead>`;

                        d.forEach((d) => {
                            contents += `<tr>
                                <td class="tooltip-id">
                                    <span style="color:${color(
                                        d
                                    )}">&#x25fc;</span>
                                    <span>${d.name}</span>
                                </td>
                                <td class="p-value">
                                    <span>${Formatters.pValueFormatter(
                                        Math.pow(10.0, -d.value)
                                    )}</span>
                                </td>
                            </tr>`;
                        });

                        return contents + "</table></div>";
                    },
                },
                axis: {
                    x: {
                        label: "Chromosome",
                        min: 0,
                        max: chromosomeStart.Y + chromosomeLength.Y,
                        tick: {
                            values: chromosomes.map(
                                (c) =>
                                    chromosomeStart[c] +
                                    Math.floor(chromosomeLength[c] / 2)
                            ),
                            format: (pos) => chromosomePos[pos],
                            fit: false,
                        },
                    },
                    y: {
                        label: "-log10(p)",
                    },
                },
            });
        },
    },
});

let chromosomeLength = {
    //chromosome name, length
    1: 247249719,
    2: 242951149,
    3: 199501827,
    4: 191273063,
    5: 180857866,
    6: 170899992,
    7: 158821424,
    8: 146274826,
    9: 140273252,
    10: 135374737,
    11: 134452384,
    12: 132349534,
    13: 114142980,
    14: 106368585,
    15: 100338915,
    16: 88827254,
    17: 78774742,
    18: 76117153,
    19: 63811651,
    20: 62435964,
    21: 46944323,
    22: 49691432,
    X: 154913754,
    Y: 57772954,
};

let chromosomes = [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "11",
    "12",
    "13",
    "14",
    "15",
    "16",
    "17",
    "18",
    "19",
    "20",
    "21",
    "22",
    "X",
    "Y",
];

let chromosomeStart = {};
let chromosomePos = {};

let chromosomeColors = [
    "#08306b",
    "#41ab5d",
    "#000000",
    "#f16913",
    "#3f007d",
    "#cb181d",
];

let positionColors = [];

let start = 0;
for (let i in chromosomes) {
    let chrom = chromosomes[i];
    let len = chromosomeLength[chrom];
    chromosomeStart[chrom] = start;

    // assign the start and middle of the chromosome
    chromosomePos[start] = chrom;
    chromosomePos[start + Math.floor(len / 2)] = chrom;

    // advance to next chromosome start
    start += len;

    // round-robin the colors for each chromosome
    positionColors.push([start, chromosomeColors[i % chromosomeColors.length]]);
}
</script>

<style>
.c3-circle {
    opacity: 0.65 !important;
    fill: currentColor;
}
</script > <style > div.manhattan-tooltip table {
    background-color: white;
    font-size: small;
    border: 1px solid darkgray;
    font-family: sans-serif;
    opacity: 1;
}

div.manhattan-tooltip thead {
    background-color: lightgray;
    text-align: center;
}

div.manhattan-tooltip tr {
    border-bottom: 1px solid darkgray;
}

div.manhattan-tooltip .tooltip-id {
    border-right: 1px solid darkgray;
    padding-right: 5px;
}

div.manhattan-tooltip .p-value {
    padding-left: 5px;
}
</style>
