<template>
	<div>
        <div class="fieldlist">
			<table>
				<thead class="fieldlabel">
					<tr>
						<td colspan="2">Field</td>
					</tr>
				</thead>
				<tbody>
					<tr v-for="field of inputFields">
					<td>{{field}}</td>
					<td>
						<delete-button 
							@deleteThis="$emit('deleteField', field)">
						</delete-button>
					</td>
				</tr>
				</tbody>
			</table>
		</div>
    </div>
</template>

<script>
import Vue from "vue";
import uiUtils from "@/utils/uiUtils";
import { BootstrapVueIcons } from "bootstrap-vue";
Vue.use(BootstrapVueIcons);

export default Vue.component("raw-field", {
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
				"type": this.type,
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


