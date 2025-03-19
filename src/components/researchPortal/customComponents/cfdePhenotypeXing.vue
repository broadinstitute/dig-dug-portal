<template>
	<div>
        {{suppMax}} : {{suppMean}} : {{suppMin}}
        <table class="cfde-xing-table">
                <thead>
                    <tr>
                        <th>{{ renderConfig["render by"] }}</th><th>{{renderConfig["threshold field"]}} : {{renderConfig["suppliment field"]}}</th>
                    </tr>
                    
                </thead>
                <tbody>
		<tr v-for=" item in renderData">
                
            <td>
               {{ item[renderConfig["render by"]] }}

            </td>
            <td class="value-td">
               {{utils.Formatters.pValueFormatter(item[renderConfig["threshold field"]])}} : {{utils.Formatters.pValueFormatter(item[renderConfig["suppliment field"]])}}
               <span class="mean-pos" :style="'left:' + getMeanXpos(dataMean)" ></span>
               <span class="value-dot" :style="'left:' + getXpos(item[renderConfig['threshold field']]) + 'width:'+ getDotScale(item[renderConfig['suppliment field']]) + ';height:'+getDotScale(item[renderConfig['suppliment field']])+';'">
                &nbsp;
               </span>

            </td>

        </tr>
        </tbody>
            </table>
	</div>
</template>

<script>
import Vue from "vue";
import { cloneDeep } from "lodash";
import { BootstrapVueIcons } from "bootstrap-vue";

Vue.use(BootstrapVueIcons);

export default Vue.component("research-cfde-xing", {
	props: [
		"canvasId",
		"data",
		"renderConfig",
		"colors",
		"plotMargin",
		"utils"
	],
	data() {
		return {
			dataMax: null,
            dataMin: null,
            dataMean: null,
            suppMax: null,
            suppMean: null,
            suppMin: null,
		};
	},
	modules: {
	},
	components: {
	},
	created: function () {
	},
	mounted: function () {
		//window.addEventListener("resize", this.onResize);
	},
	beforeDestroy() {
		//window.removeEventListener("resize", this.onResize);
	},
	computed: {
		renderData() {
            let data;

            switch(this.renderConfig["threshold type"]) {
                case "highest n":

                    data = this.utils.sortUtils.sortArrOfObjects(this.data, this.renderConfig["threshold field"], "number", 'desc');

                    this.dataMax = data[0][this.renderConfig["threshold field"]];
                    this.dataMin = data[data.length - 1][this.renderConfig["threshold field"]];
                    this.dataMean = data[Math.round(data.length / 2)][this.renderConfig["threshold field"]];

                    let suppData = [...new Set(this.data)];
                    suppData = this.utils.sortUtils.sortArrOfObjects(suppData, this.renderConfig["suppliment field"], "number", 'desc');

                    this.suppMax = suppData[0][this.renderConfig["suppliment field"]];
                    this.suppMin = suppData[suppData.length - 1][this.renderConfig["suppliment field"]];
                    this.suppMean = suppData[Math.round(suppData.length / 2)][this.renderConfig["suppliment field"]];


                    data = data.filter((i,iIndex) => iIndex < this.renderConfig["threshold"])
                    break;
            }
            
            return data;
        }
	},
	watch: {
		
	},
	methods: {
        getXpos(VALUE) {

            let xPos = 100 * (Math.log10(VALUE) - Math.log10(this.dataMin))/(Math.log10(this.dataMax) - Math.log10(this.dataMin));
            return "calc(" + xPos+"% - 10px);";
        },

        getMeanXpos(VALUE) {
            let xPos = 100 * (Math.log10(VALUE) - Math.log10(this.dataMin))/(Math.log10(this.dataMax) - Math.log10(this.dataMin));
            return "calc(" + xPos+"%);";
        },

        getDotScale(VALUE) {
            let size = Math.round(20 * (VALUE - this.suppMin)/(this.suppMax - this.suppMin));
            return size + "px;";
        }
    },
});
</script>

<style>
.cfde-xing-table th, .cfde-xing-table td {
    padding: 5px 10px;
}
.value-td {
    position: relative;
    width: 400px;
    border-left: solid 1px #999999;
    border-right: solid 1px #999999;
    
}

.value-dot{
    position:absolute;
    background-color: #ff0000;
    border-radius: 20px;
}

.mean-pos {
    position:absolute;
    background-color: #ffaa00;
    width: 1px;
    height: 40px;
    top: -5px;
}
</style>



