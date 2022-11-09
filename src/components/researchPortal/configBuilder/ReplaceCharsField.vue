<template>
	<div class="col-md-2">
        <span class="fieldlabel">Field</span>
        <div class="fieldlist">
			<span>{{inputFields[0]}}</span>
		</div>
    </div>
</template>

<script>
import Vue from "vue";
import uiUtils from "@/utils/uiUtils";
import { BootstrapVueIcons } from "bootstrap-vue";
Vue.use(BootstrapVueIcons);

export default Vue.component("replace-chars-field", {
	props: ['type', 'inputFields', 'newName'],
	emits: ['configReady'],
	data() {
		return {
            config: {}
		};
	},
	mounted() {
		this.emitConfig();
	},
	modules: {},
	components: {},
	computed: {},
	methods: {
		...uiUtils,
		emitConfig(){
			this.$emit('configReady', {
				"type": "replace characters",
				"field name": this.newName,
				"raw field": this.inputFields[0]
			}
		)
		}
	},
	watch:{
		inputFields(){
			this.emitConfig();
		},
		newName(){
			this.emitConfig();
		}
	}
});
</script>
<style>
@import url("/css/configBuilder.css");
</style>


