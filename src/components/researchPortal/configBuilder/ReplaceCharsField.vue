<template>
	<div>
        <span class="fieldlabel">Field ({{inputFields.length}} of 1)</span>
        <div class="fieldlist">
			<table>
				<thead class="fieldlabel">
					<tr>
						<td>Field 
							<!--span v-if="type == 'join'">
								 ({{inputFields.length}} of 2)
							</span-->
						</td>
						<td>From</td>
						<td colspan="2">To</td>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>{{fieldDisplayName(inputFields[0])}}</td>
						<td><input v-model="from"/></td>
						<td><input v-model="to"/></td>
						<td>
							<delete-button 
								@deleteThis="$emit('deleteField', 
									inputFields[0])">
							</delete-button>
						</td>
					</tr>
					<tr v-if="inputFields.length == 0">
						<td> </td>
						<td> </td>
						<td> </td>
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

export default Vue.component("replace-chars-field", {
	props: ['type', 'inputFields', 'newName'],
	emits: ['configReady'],
	data() {
		return {
			from: "",
			to: ""
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
			// Remember, an empty string is valid input
			// When/where to make it yell at people over commas?
			this.$emit('configReady', {
				"type": this.type,
				"field name": this.newName,
				"raw field": this.inputFields[0],
				"replace": [
					{
						"from": this.from,
						"to": this.to
					}
				]
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
		from(){
			this.emitConfig();
		},
		to(){
			this.emitConfig();
		}
	}
});
</script>
<style>
@import url("/css/configBuilder.css");
</style>


