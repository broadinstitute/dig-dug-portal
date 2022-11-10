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
						<td colspan="2">Join by</td>
					</tr>
				</thead>
				<tbody>
					<tr v-for="(field, i) in inputFields">
						<td>{{fieldDisplayName(field)}}</td>
						<td><input v-if="i != inputFields.length -1"/></td>
						<td>
							<delete-button 
								@deleteThis="$emit('deleteField', field)">
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

export default Vue.component("join-field", {
	props: ['type', 'inputFields', 'newName'],
	emits: ['configReady'],
	data() {
		return {
            config: {},
			joins: []
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
				"fields to join": this.inputFields
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
		}
	}
});
</script>
<style>
@import url("/css/configBuilder.css");
</style>


