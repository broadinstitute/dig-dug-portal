<template>
	<div>
        <div>
			<div>
            Place the first few rows of your data including the header row 
            in .csv format here.
			</div>
            <textarea v-model="rawContent" placeholder="Enter your data"
				rows="5" cols="60" v-on:focusout="processContent">
            </textarea>
			<div id="warning" :hidden="hideFormatWarning">
				Data must be in .csv format.
			</div>
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import uiUtils from "@/utils/uiUtils";
import { BootstrapVueIcons } from "bootstrap-vue";
Vue.use(BootstrapVueIcons);

export default Vue.component("data-pastebox", {
	props: [],
	emits: ['dataready'],
	data() {
		return {
            rawContent: "",
			hideFormatWarning: true
		};
	},
	modules: {},
	components: {},
	computed: {},
	methods: {
		...uiUtils,
		processContent(){
			this.hideFormatWarning = true;
			let lines = this.rawContent.split("\n");
			if (lines.length <= 1){
				this.hideFormatWarning = false;
				return;
			}
			let allData = [];
			for (let line of lines){
				allData.push(line.split(","));
			}
			if (allData[0].length <= 1 || allData[0].includes("")){
				this.hideFormatWarning = false;
				return;
			}
			this.$emit('dataready', allData);
		},
	},
});
</script>
<style>
#warning {
	color: red;
	font-size: smaller;
}
</style>


