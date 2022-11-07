<template>
	<div>
        <div>
			<div>Add fields to display/convert</div>
			<select>
				<option v-if="!fields.length">Add your sample data to begin</option>
				<option v-for="field in fields">{{field}}</option>
			</select>
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import uiUtils from "@/utils/uiUtils";
import { BootstrapVueIcons } from "bootstrap-vue";
Vue.use(BootstrapVueIcons);

export default Vue.component("add-fields", {
	props: ['fields'],
	emits: [],
	data() {
		return {
		};
	},
	modules: {},
	components: {},
	computed: {},
	methods: {
		...uiUtils
	},
});
</script>
<style>
</style>


