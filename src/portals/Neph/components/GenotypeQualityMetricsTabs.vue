<template>
    <div>
        <div id="gqualitymetrics" style="width: 100%; height: 500px">
            <h4 class="card-title">
                Genotype Quality Metrics
            </h4>
            <b-tabs content-class="mt-3">
                <b-tab title="Genotype Quality" active>
                    <div id="genotypequalitymetrics" style="width: 100%; height: 100%"></div>
                </b-tab>
                <b-tab title="Depth">
                    <div id="depthmatrics" style="width: 100%; height: 100%"></div>
                </b-tab>
                <b-tab title="Allele balance for heterozygotes">
                    <div id="allelebalancematrics" style="width: 100%; height: 100%"></div>
                </b-tab>
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
//import QualityMatricsPlot from "@/portals/Neph/components/QualityMatricsPlot.vue";
import { difference } from "lodash";


export default Vue.component("genotypequalitymetrics-tab", {
    props: ["chartdata"],
    components: {
        //QualityMatricsPlot,
    },
    mounted() {
        this.build_chart({}, []);
    },

    methods: {
        build_chart(xs, columns) {
            let component = this;
            
            
            let data1 = this.chartdata.geno_qual_bins;
            let data2 = this.chartdata.alt_geno_qual_bins;
            
            data1 = ["All Indivuals"].concat(data1);
            data2 = ["Variant Carriers"].concat(data2);

            let xaxis = ['x', '0-5', '5-10', '10-15', '15-20', '20-25', '25-30', '30-35', '35-40', '40-45', '45-50', 
                            '50-55', '55-60','60-65', '65-70','70-75', '75-80','80-85', '85-90','90-95', '95-100'];

            // attach to the dom
            // bindto: "#qualitymatrics",
            this.chart1 = c3.generate({
                bindto: "#genotypequalitymetrics",
                data: {
                    x: 'x',
                    columns: [
                        xaxis,
                        data1,
                        data2
                    ],
                    type: 'bar',
                    axes: {
                        'Variant Carriers':'y',
                        'All Indivuals': 'y2'
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
                            text: 'Variant Carriers',
                            position: 'outer-middle'
                        }
                    },
                    y2: {
                        show: true,
                        label: {
                            text: 'All Indivuals',
                            position: 'outer-middle'
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

            let data3 = this.chartdata.depth_bins;
            let data4 = this.chartdata.alt_depth_bins;
            
            data3 = ["All Indivuals"].concat(data3);
            data4 = ["Variant Carriers"].concat(data4);

            let xaxis2 = ['x', '0-5', '5-10', '10-15', '15-20', '20-25', '25-30', '30-35', '35-40', '40-45', '45-50', 
                            '50-55', '55-60','60-65', '65-70','70-75', '75-80','80-85', '85-90','90-95', '95-100'];

            

            this.chart2 = c3.generate({
                bindto: "#depthmatrics",
                data: {
                    x: 'x',
                    columns: [
                        xaxis2,
                        data3,
                        data4
                    ],
                    type: 'bar',
                    axes: {
                        'Variant Carriers':'y',
                        'All Indivuals': 'y2'
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
                            text: 'Variant Carriers',
                            position: 'outer-middle'
                        }
                    },
                    y2: {
                        show: true,
                        label: {
                            text: 'All Indivuals',
                            position: 'outer-middle'
                        }
                    },
                    x: {
                        type: 'category',
                        tick: {
                            rotate: 75,
                            multiline: false
                        },
                        
                    }
                }
            });

            let data5 = this.chartdata.het_ab_bins;
            data5 = ["Allele Balance"].concat(data5);

            let xaxis3 = ['x', '0-0.05', '0.05-0.10', '0.10-0.15', '0.15-0.20', '0.20-0.25', '0.25-0.30', '0.30-0.35', '0.35-0.40', '0.40-0.45', '0.45-0.50', 
                            '0.50-0.55', '0.55-0.60','0.60-0.65', '0.65-0.70','0.70-0.75', '0.75-0.80','0.80-0.85', '0.85-0.90','0.90-0.95', '0.95-1'];

            this.chart3 = c3.generate({
                bindto: "#allelebalancematrics",
                data: {
                    x: 'x',
                    columns: [
                        xaxis3,
                        data5,
                    ],
                    type: 'bar',
                },
                bar: {
                    width: {
                        ratio: 0.5 // this makes bar width 50% of length between ticks
                    }
                    // or
                    //width: 100 // this makes bar width 100px
                },
                axis: {
                    x: {
                        type: 'category',
                        tick: {
                            rotate: 75,
                            multiline: false
                        },
                        
                    }
                }
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
