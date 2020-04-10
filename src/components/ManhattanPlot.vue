<template>
    <div id="chart"></div>
</template>

<script>
import Vue from "vue";
import c3 from "c3";

export default Vue.component("manhattan-plot", {
    props: ["loadedAssociations", "unloadedAssociations", "colors"],

    data() {
        return {
            chart: null
        };
    },

    mounted() {
        this.chart = c3.generate({
            bindto: "#chart",
            size: {
                height: 400
            },
            data: {
                xs: {},
                columns: [],
                type: "scatter"
            },
            legend: {
                show: false
            },
            zoom: {
                enabled: false,
                rescale: false
            },
            colors: this.colors || {},
            point: {
                r: 4
            },
            axis: {
                x: {
                    label: "Chromosome",
                    tick: {
                        format(pos) {
                            for (let chrom in chromosomeStart) {
                                if (chromosomeStart[chrom] == pos) {
                                    return chrom;
                                }
                            }
                        },
                        values: chromosomes.map(c => chromosomeStart[c])
                    }
                },
                y: {
                    label: "-log10(p)"
                }
            }
        });
    },

    watch: {
        loadedAssociations(data) {
            let columns = [];
            let xs = {};

            // data is in the format { [phenotype]: [associations] }
            for (let k in data) {
                let v = data[k];

                if (v.length == 0) {
                    continue;
                }

                xs[k] = `${k}_x`;

                // calculate the x-position
                columns.push([
                    `${k}_x`,
                    ...v.map(assoc => {
                        let chr = chromosomeStart[assoc.chromosome];
                        let pos = assoc.position;

                        return chr + pos;
                    })
                ]);

                // extract the p-values
                columns.push([k, ...v.map(assoc => -Math.log10(assoc.pValue))]);
            }

            // update the chart
            this.chart.load({ xs, columns, colors: this.colors || {} });
        },

        unloadedAssociations(phenotypes) {
            this.chart.unload(phenotypes);
        }
    }
});

let chromosomeLength = {
    //chromosome name, length
    "1": 247249719,
    "2": 242951149,
    "3": 199501827,
    "4": 191273063,
    "5": 180857866,
    "6": 170899992,
    "7": 158821424,
    "8": 146274826,
    "9": 140273252,
    "10": 135374737,
    "11": 134452384,
    "12": 132349534,
    "13": 114142980,
    "14": 106368585,
    "15": 100338915,
    "16": 88827254,
    "17": 78774742,
    "18": 76117153,
    "19": 63811651,
    "20": 62435964,
    "21": 46944323,
    "22": 49691432,
    X: 154913754,
    Y: 57772954
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
    "Y"
];

let chromosomeStart = {};
let start = 0;
for (let i in chromosomes) {
    let chrom = chromosomes[i];
    chromosomeStart[chrom] = start;
    start += chromosomeLength[chrom];
}
</script>
