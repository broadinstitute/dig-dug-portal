<template>
    <div>
        <div id="sitequalitymetrics" style="width: 100%; height: 500px">
            <h4 class="card-title">
                Site Quality Metrics
            </h4>
            <b-tabs content-class="mt-3">
                <b-tab title="Metrics distribution" active>
                    <div id="metricsdistribution" style="width: 100%; height: 100%"></div>
                    <div style="width: 20%;">
                        Metric:
                        <b-form-select v-model="selected" 
                                @change="build_chart(selected)"
                                :options="options">
                        </b-form-select>
                        Value: {{selectedValue}}
                    </div>
                </b-tab>
                <b-tab title="All metrics values">
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
import { difference } from "lodash";

export default Vue.component("sitequalitymetrics-tab", {
    props: ["vardata"],
    data() {
        return {
            selected: "SiteQuality",
            selectedValue: null,
            options:[
                { value: "SiteQuality", text: "SiteQuality"},
                { value: "AS_FS", text: "AS_FS" },
                { value: "InbreedingCoeff", text: "InbreedingCoeff"},
                { value: "AS_MQ", text: "AS_MQ"},
                { value: "AS_MQRankSum", text: "AS_MQRankSum"},
                { value: "AS_QD", text: "AS_QD"},
                { value: "AS_ReadPosRankSum", text: "AS_ReadPosRankSum"},
                { value: "AS_SOR", text: "AS_SOR"},
                { value: "AS_VQSLOD", text: "AS_VQSLOD"},
            ],
            chart_data: {"SiteQuality": {"x": ["x", "1e1.37", "1e1.54", "1e1.71", "1e1.88", "1e2.05", "1e2.22", "1e2.37", "1e2.56", "1e2.73", "1e2.90", "1e3.07", "1e3.24", "1e3.41", "1e3.58", "1e3.75", "1e3.92", "1e4.09", "1e4.26", "1e4.43", "1e4.6", "1e4.77", "1e4.94", 
                                                "1e5.11", "1e5.28", "1e5.45", "1e5.62", "1e5.79", "1e5.96", "1e6.13", "1e6.30", "1e6.47", "1e6.64", "1e6.81", "1e7.00", "1e7.15", "1e7.32", "1e7.49", "1e7.66", "1e7.83", "1e8.00"], 
                                "data": ["SiteQuality", 0, 391750, 2917463, 739671, 2121246, 1106893, 912991, 552031, 419923, 320145, 248504, 203322, 172976, 150589, 133054, 118607, 104938, 91391, 79379, 68353, 58507, 50952, 45434, 43020, 42869, 43726, 45605, 48413, 48385, 48651, 45318, 36825, 23595, 11414, 3573, 581, 174, 33, 10, 2]}, 
                "AS_FS": {"x": ["x", "1e0.1", "1e0.2", "1e0.30", "1e0.4", "1e0.5", "1e0.6", "1e0.7", "1e0.8", "1e0.9", "1e1.0", "1e1.1", "1e1.2", "1e1.3", "1e1.4", "1e1.5", "1e1.6", "1e1.7", "1e1.8", "1e1.9", "1e2.0", 
                                "1e2.1", "1e2.2", "1e2.3", "1e2.4", "1e2.5", "1e2.6", "1e2.7", "1e2.8", "1e2.9", "1e3.0"], 
                        "data": ["AS_FS", 4765959, 325646, 461414, 511748, 578352, 689875, 650731, 609495, 563748, 527151, 440936, 355071, 276169, 206093, 151618, 109711, 76230, 51674, 33295, 21365, 14121, 9204, 7099, 5484, 4145, 2415, 1117, 331, 93, 23]},
                "InbreedingCoeff": {"x": ["x", -0.95, -0.9, -0.85, -0.8, -0.75, -0.7, -0.65, -0.6, -0.55, -0.5, -0.45, -0.40, -0.35, -0.30, -0.25, -0.20, -0.15, -0.10, -0.05, 0.0, 0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.45, 0.5, 0.55, 0.60, 0.65, 0.70, 0.75, 0.8, 0.85, 0.90, 0.95, 1.0], 
                                    "data": ["InbreedingCoeff", 356, 268, 300, 369, 360, 316, 336, 341, 393, 472, 577, 588, 662, 864, 1838, 4725, 8915, 14158, 23025, 41854, 300327, 651280, 1031339, 1324795, 1396535, 1289522, 1417385, 1035293, 860734, 744486, 576212, 451438, 258978, 3839, 854, 530, 461, 247, 118, 19]}, 
                "AS_MQ": {"x": ["x", 5.0, 10.0, 15.0, 20.0, 25.0, 30.0, 35.0, 40.0, 45.0, 50.0, 55.0, 60.0, 65.0, 70.0, 75.0, 80.0, 85.0, 90.0, 95.0, 100.0, 105.0, 110.0, 115.0, 120.0, 125.0, 130.0, 135.0, 140.0, 145.0, 150.0, 155.0, 160.0, 165.0, 170.0, 175.0, 180.0, 185.0, 190.0, 195.0, 200.0, 205.0, 210.0, 215.0, 220.0, 225.0, 230.0, 235.0, 240.0, 245.0, 250.0], 
                        "data": ["AS_MQ", 25952, 51488, 89067, 41610, 36102, 30506, 23925, 21957, 20872, 19682, 18886, 18973, 17690, 17326, 15968, 15332, 15302, 15488, 15117, 15311, 15742, 15677, 16150, 16515, 16422, 16890, 17421, 17810, 18076, 18245, 18837, 19055, 19906, 20638, 21522, 23869, 24275, 26235, 29375, 30548, 32361, 36670, 40634, 46260, 54286, 65799, 82386, 113856, 194684, 1196546]}, 
                "AS_MQRankSum": {"x": ["x", -19.0, -18.0, -17.0, -16.0, -15.0, -14.0, -13.0, -12.0, -11.0, -10.0, -9.0, -8.0, -7.0, -6.0, -5.0, -4.0, -3.0, -2.0, -1.0, 0.0, 1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 11.0, 12.0, 13.0, 14.0, 15.0, 16.0, 17.0, 18.0, 19.0, 20.0], 
                                "data": ["AS_MQRankSum", 1, 0, 3, 9, 17, 66, 108, 164, 324, 608, 1194, 2049, 3851, 6200, 10327, 15841, 24820, 41656, 82513, 201008, 1407605, 1068305, 1028490, 1310359, 1360639, 1279010, 1076018, 853091, 627084, 393843, 209394, 102005, 48081, 22597, 11408, 6195, 3626, 1981, 193, 2]}, 
                "AS_QD": {"x": ["x", 1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 11.0, 12.0, 13.0, 14.0, 15.0, 16.0, 17.0, 18.0, 19.0, 20.0, 21.0, 22.0, 23.0, 24.0, 25.0, 26.0, 27.0, 28.0, 29.0, 30.0, 31.0, 32.0, 33.0, 34.0, 35.0, 36.0, 37.0, 38.0, 39.0, 40.0, 41.0, 42.0], 
                        "data": ["AS_QD", 4537852, 2992324, 1391338, 766225, 461224, 291262, 183077, 121370, 92325, 55361, 55349, 38674, 27216, 21764, 18336, 19955, 17127, 16039, 14885, 11757, 10463, 9382, 8924, 9608, 10704, 15540, 17456, 26092, 31897, 33192, 36032, 33378, 25439, 22491, 15064, 6407, 2900, 1455, 256, 63, 49, 0]}, 
                "AS_ReadPosRankSum": {"x": ["x", -11.0, -10.0, -9.0, -8.0, -7.0, -6.0, -5.0, -4.0, -3.0, -2.0, -1.0, 0.0, 1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 11.0, 12.0, 13.0, 14.0, 15.0, 16.0, 17.0, 18.0], 
                                    "data": ["AS_ReadPosRankSum", 4, 7, 6, 20, 72, 146, 431, 958, 2700, 12534, 77063, 368333, 2710215, 2104367, 1826439, 1566142, 1254533, 751596, 333371, 125198, 43399, 15193, 5486, 1704, 577, 156, 31, 3, 1, 0]}, 
                "AS_SOR": {"x": ["x", 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0, 9.5, 10.0, 10.5, 11.0, 11.5, 12.0, 12.5, 13.0, 13.5, 14.0, 14.5, 15.0, 15.5, 16.0, 16.5, 17.0, 17.5, 18.0, 18.5, 19.0, 19.5, 20.0], 
                        "data": ["AS_SOR", 3408970, 4506631, 1817060, 872882, 375835, 183484, 94535, 53825, 30259, 20698, 14665, 12325, 10177, 8671, 7091, 6166, 5258, 4476, 3819, 3056, 2537, 1941, 1587, 1183, 955, 635, 512, 342, 271, 157, 95, 74, 62, 38, 17, 11, 10, 1, 1, 1]}, 
                "AS_VQSLOD": {"x": ["x", -106.0, -104.0, -102.0, -100.0, -98.0, -96.0, -94.0, -92.0, -90.0, -88.0, -86.0, -84.0, -82.0, -80.0, -78.0, -76.0, -74.0, -72.0, -70.0, -68.0, -66.0, -64.0, -62.0, -60.0, -58.0, -56.0, -54.0, -52.0, -50.0, -48.0, -46.0, -44.0, -42.0, -40.0, -38.0, -36.0, -34.0, -32.0, -30.0, -28.0, -26.0, -24.0, -22.0, -20.0, -18.0, -16.0, -14.0, -12.0, -10.0, -8.0, -6.0, -4.0, -2.0, 0.0, 2.0, 4.0, 6.0, 8.0, 10.0, 12.0], 
                            "data": ["AS_VQSLOD", 10696, 255, 255, 261, 304, 275, 283, 334, 315, 304, 414, 356, 469, 446, 478, 496, 534, 505, 537, 513, 690, 626, 704, 720, 753, 819, 904, 912, 1057, 1096, 1251, 1221, 1385, 1527, 1701, 1873, 2076, 2213, 2549, 2788, 3235, 3887, 4593, 5794, 7335, 10081, 21403, 59001, 67415, 45149, 57557, 127154, 593797, 1320760, 2021802, 2486405, 3138942, 1297995, 133110, 3]}
            },
            fields: [
                {
                    key: "metric",
                    label: "Metric",
                },
                {
                    key: "value",
                    label: "Value",
                },
            ],
            metrics_info: [],
        }
    },
    components: {
        //QualityMatricsPlot,
    },
    mounted() {
        this.build_chart('SiteQuality');
        this.build_table();
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
        build_table() {
            //console.log("Site Quality Table");
            //console.log(this.vardata);
            let i = 0;
            let vardisplay = []
            for (const idx in this.vardata) {
                if(idx != "varId"){
                    vardisplay[i] = {"metric": idx, "value": this.vardata[idx]};
                    i = i + 1;
                }
            }
            this.metrics_info = vardisplay;
        },
        build_chart(cname) {
            //let component = this;

            //console.log(this.vardata);

            this.selectedValue = this.vardata[cname];
            let data = this.chart_data[cname]['data'];
            let xaxis = this.chart_data[cname]['x']

            let vdata = this.vardata[cname];
            //console.log(vdata);
            let highlightindex = -1;
            
            if (vdata != "NaN"){
                for (let i = 1; i < xaxis.length; i++){
                    //console.log("check data:"+i+"|"+vdata +"|"+xaxis[i]+"|"+data[i]);
                    if (cname == "SiteQuality" || cname=="AS_FS"){
                        let v = Number(xaxis[i].substring(2));
                        v = Math.pow(10, v);
                        //console.log(v+"|"+xaxis[i]);
                        if (vdata <= v){
                            highlightindex = i - 1;
                            break;
                        }
                    } else {
                        if (vdata <= xaxis[i]){
                            highlightindex = i - 1;
                            //console.log("check data:"+i+"|"+vdata +"|"+xaxis[i]+"|"+data[i]);
                            break;
                        }
                    }
                    
                }
            }
            

            // attach to the dom
            // bindto: "#qualitymatrics",
            this.chart = c3.generate({
                bindto: "#metricsdistribution",
                data: {
                    x: 'x',
                    columns: [
                        xaxis,
                        data,
                    ],
                    type: 'bar',
                    color: function (color, d) {
                        // d will be 'id' when called for legends
                        //console.log(d.id+"|"+highlightindex+"|"+d.index);
                        return d.id && highlightindex >= 0 && d.index === highlightindex ? "#ff0000" : color;
                    },
                    labels: {
                        format: function(v, id, i, j) {
                            //console.log(v+"|"+id+"|"+i+"|"+j);
                            if (i === highlightindex){
                                return vdata;
                            }
                        }
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
