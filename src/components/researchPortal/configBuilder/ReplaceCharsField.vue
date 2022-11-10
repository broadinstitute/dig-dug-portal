<template>
	<div>
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
					<tr v-for="(field, i) in inputFields">
						<td>{{fieldDisplayName(field)}}</td>
						<td><input v-model="from[i]"/>
						</td>
						<td><input v-model="to[i]"/>
						</td>
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

export default Vue.component("replace-chars-field", {
	props: ['type', 'inputFields', 'newName'],
	emits: ['configReady'],
	data() {
		return {
			from: [""],
			to: [""],
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
						"from": this.from[0],
						"to": this.to[0]
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


