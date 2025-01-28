<template>
    <div>
        <div id="allgenoqualitymetrics" style="width: 100%; height: 600px">
            <h4 class="card-title">
                Genotype Quality Metrics
            </h4>
            <b-tabs content-class="mt-3">
                <b-tab title="Heterozygous Variants" active>
                    <div id="hetgenotypequalitymetrics" style="width: 100%; height: 100%"></div>
                </b-tab>
                <b-tab title="Homozygous Variants">
                    <div id="homgenotypequalitymetrics" style="width: 100%; height: 100%"></div>
                </b-tab>
                <!-- <b-tab title="All metrics values">
                    <div id="metricsvalues" style="width: 100%; height: 100%">
                        <div v-show="tableData.length">
                            <b-table
                                hover
                                small
                                sort-icon-left
                                responsive="sm"
                                :items="tableData"
                                :fields="fields"
                                id="metricsdata"
                            >
                            </b-table>
                        </div>
                    </div>
                </b-tab> -->
                
            </b-tabs>
        </div>
    </div>
</template>

<style>
.c3-circle {
    opacity: 0.65 !important;
    fill: currentColor;
}
</style>

<script>
import Vue from "vue";
import c3 from "c3";
import Colors from "@/utils/colors";
import Formatters from "@/utils/formatters";
import { difference } from "lodash";

export default Vue.component("allgenoqualitymetrics-tab", {
    props: ["chartdata"],
    data() {
        return {
            chart_data: {"AllGenoQuality": {"x": ["x", '<0', '0-5', '5-10', '10-15', '15-20', '20-25', '25-30', '30-35', '35-40', '40-45', '45-50', 
                            '50-55', '55-60','60-65', '65-70','70-75', '75-80','80-85', '85-90','90-95', '95-100','>100'], 
                        "het_data": ["All heterozygous variants", 0, 5437369, 8712392, 9794743, 9172025, 12009653, 16687710, 26327557, 24557244, 58510575, 
                                265688294, 646730466, 259452, 317619, 297462, 327873, 610505, 470886, 164650, 0, 11, 0],
                        "hom_data": ["All homozygous variants", 0, 90273229, 47083416, 21887507, 34284132, 31821204, 18459506, 30711146, 31295830, 
                                26245974, 73377467, 46977481, 13979639, 23106834, 22822233, 13439668, 21912334, 23997933, 16157517, 16591929, 310682205, 0]
                        }
                
            },
        }
    },
    components: {
        //QualityMatricsPlot,
    },
    mounted() {
        this.build_chart();
    },
    computed: {
        rows() {
            return this.tableData.length;
        },
        tableData() {
            //alert(this.gnomAD_info.length);
            if (this.metrics_info && this.metrics_info.length) {
                return this.metrics_info;
            } else {
                return [];
            }
        },
    },
    methods: {
        build_chart() {
            //let component = this;

            //console.log(this.vardata);

            let data1 = this.chart_data["AllGenoQuality"]['het_data'];
            
            let data2 = this.chart_data["AllGenoQuality"]['hom_data'];
            
            let xaxis = this.chart_data["AllGenoQuality"]['x']

            let vdata1 = this.chartdata.het_alt_geno_qual_bins;
            let vdata2 = this.chartdata.hom_alt_geno_qual_bins;
            //console.log(vdata);
            vdata1 = ["Heterozygous carriers of this variant"].concat(vdata1);
            vdata2 = ["Homozygous carriers of this variant"].concat(vdata2);
            
            
            // attach to the dom
            // bindto: "#qualitymatrics",
            this.chart1 = c3.generate({
                bindto: "#hetgenotypequalitymetrics",
                data: {
                    x: 'x',
                    columns: [
                        xaxis,
                        data1,
                        vdata1
                    ],
                    type: 'bar',
                    axes: {
                        'Het for all Variant':'y',
                        'Heterozygous carriers of this variant': 'y2'
                    },
                    
                },
                bar: {
                    width: {
                        ratio: 0.5 // this makes bar width 50% of length between ticks
                    }
                    // or
                    //width: 100 // this makes bar width 100px
                },
                axis: {
                    y: {
                        label: {
                            text: 'All variants',
                            position: 'outer-middle'
                        },
                        tick: {
                            format: function (x) { // x comes in as a time string.
                                return x.toExponential()
                            }
                        }
                    },
                    y2: {
                        show: true,
                        min: 0,
                        padding: {bottom: 0},
                        label: {
                            text: 'Variant carriers',
                            position: 'outer-middle'
                        },
                        tick: {
                            format: function(x) { return (x % 1 === 0 && x >=0) ? x : ''; }
                        }
                    },
                    x: {
                        type: 'category',
                        tick: {
                            rotate: 75,
                            multiline: false
                        },
                        
                    }
                },
                
            });

            this.chart2 = c3.generate({
                bindto: "#homgenotypequalitymetrics",
                data: {
                    x: 'x',
                    columns: [
                        xaxis,
                        data2,
                        vdata2
                    ],
                    type: 'bar',
                    axes: {
                        'All homozygous variants':'y',
                        'Homozygous carriers of this variant': 'y2'
                    },
                    
                },
                bar: {
                    width: {
                        ratio: 0.5 // this makes bar width 50% of length between ticks
                    }
                    // or
                    //width: 100 // this makes bar width 100px
                },
                axis: {
                    y: {
                        label: {
                            text: 'All variants',
                            position: 'outer-middle'
                        },
                        tick: {
                            format: function (x) { // x comes in as a time string.
                                return x.toExponential()
                            }
                        }
                        
                    },
                    y2: {
                        show: true,
                        min: 0,
                        padding: {bottom: 0},
                        label: {
                            text: 'Variant carriers',
                            position: 'outer-middle'
                        },
                        tick: {
                            format: function(x) { return x % 1 === 0 ? x : ''; }
                        }
                    },
                    x: {
                        type: 'category',
                        tick: {
                            rotate: 75,
                            multiline: false
                        },
                        
                    }
                },
                
            });
            
        },
    },

    
});


</script>

<style>
div.qualitymatrics-tooltip table {
    background-color: white;
    font-size: small;
    border: 1px solid darkgray;
    font-family: sans-serif;
    opacity: 1;
}

div.qualitymatrics-tooltip thead {
    background-color: lightgray;
    text-align: center;
}

div.qualitymatrics-tooltip tr {
    border-bottom: 1px solid darkgray;
}

div.qualitymatrics-tooltip .tooltip-id {
    border-right: 1px solid darkgray;
    padding-right: 5px;
}

div.qualitymatrics-tooltip .p-value {
    padding-left: 5px;
}
</style>
