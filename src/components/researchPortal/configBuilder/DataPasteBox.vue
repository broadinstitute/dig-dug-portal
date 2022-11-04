<template>
	<div>
        <div>
            Place the first few rows of your data including the header row 
            in .csv format here.
            <textarea v-model="rawContent" placeholder="Enter your data">
            </textarea>
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
            columnHeaders: []
		};
	},
	modules: {
	},
	components: {},
	computed: {
	},
	watch: {
		rawContent(){
            console.log(this.rawContent);
        }
	},
	methods: {
		...uiUtils,
	},
});
</script>

<style>
</style>



