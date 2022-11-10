<template>
	<div>
		<div class="fieldlist">
			<table>
				<thead class="fieldlabel">
					<tr>
						<td>Field</td>
						<td colspan="2">Calculate</td>
					</tr>
				</thead>
				<tbody>
					<tr v-for="(field, i) in inputFields">
						<td>{{field}}</td>
						<td>
							<select v-model="calcType[i]">
								<option value="">Select type</option>
								<option v-for="item in calcOptions">
									{{item}}
								</option>
						</select>
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

export default Vue.component("calculate-field", {
	props: ['type', 'inputFields', 'newName'],
	emits: ['configReady'],
	data() {
		return {
            calcOptions: ["-log10"],
			calcType: [""]
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
				"calculation type": this.calcType[0]
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
		},
		calcType(){
			this.emitConfig();
		}
	}
});
</script>
<style>
@import url("/css/configBuilder.css");
</style>


