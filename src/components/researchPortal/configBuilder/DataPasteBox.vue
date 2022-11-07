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
	props: [
	],
	data() {
		return {
            rawContent: "",
            sampleData: [],
            columnHeaders: [],
			hideFormatWarning: true
		};
	},
	modules: {
	},
	components: {},
	computed: {
	},
	methods: {
		...uiUtils,
		processContent(){
			this.hideFormatWarning = true;
			let lines = this.rawContent.split("\n");
			if (lines.length <= 1){
				this.hideFormatWarning = false;
				return;
			}
			let headers = lines[0].split(",");
			console.log(headers);
			if (headers.length <= 1 || headers.includes("")){
				this.hideFormatWarning = false;
				return;
			}
			this.columnHeaders = headers;
			let allData = [];
			for (let line of lines){
				allData.push(line.split(","));
			}
			this.sampleData = allData;
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


