<template>
	<div>
		<div class="fieldlist">
			<table>
				<thead class="fieldlabel">
					<tr>
						<td>Field
						</td>
						<td colspan="2">Separate by</td>
					</tr>
				</thead>
				<tbody>
					<tr v-for="(field, i) in inputFields">
						<td>{{fieldDisplayName(field)}}</td>
						<td><input v-model="separators[i]"/></td>
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

export default Vue.component("array-to-string-field", {
	props: ['type', 'inputFields', 'newName'],
	emits: ['configReady'],
	data() {
		return {
            separators: [""]
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
				"raw field": this.inputFields[0],
				"separate by": this.separators[0]
			}
		)
		},
		fieldDisplayName(field){
			if (field.length > 20){
				return `${field.slice(0,20)}...`;
			}
			return field;
		}
	},
	watch:{
		inputFields(){
			this.emitConfig();
		},
		newName(){
			this.emitConfig();
		},
		separators(){
			this.emitConfig();
		}
	}
});
</script>
<style>
@import url("/css/configBuilder.css");
</style>


