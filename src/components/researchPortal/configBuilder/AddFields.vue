<template>
	<div class="component-wrapper">
		<div>Add fields to display/convert</div>
        <div class="gray-box row">
			<div class="col-md-2">
				<label>Type
					<select v-model="typeInUse">
						<option selected value="" 
							:disabled="disablePlaceholder">
							Select a display type
						</option>
						<option v-for="fieldType in Object.keys(fieldTypes)"
							:value="fieldType">
							{{fieldTypes[fieldType].displayName}}
						</option>
					</select>
				</label>
			</div>
			<div class="col-md-2">
				<label>Select field(s)
					<select class="flat-box" multiple v-model="selectedFields">
						<option v-if="!fields.length">
							Add your sample data to begin
						</option>
						<option v-for="field in fields">{{field}}</option>
					</select>
				</label>
			</div>
			<div class="col-md-1">
				<button class="add" :disabled="!fields.length" @click="addFieldToMulti">&rarr;</button>
			</div>
			<div class="col-md-2">
				Field
				<ul>
					<li v-for="field in fieldsAddedCurrently">{{field}}</li>
				</ul>
			</div>
        </div>
		<div class="warning" :hidden="hideTypeWarning">
			Select a field type to continue
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
	// Add a hidden thing for replace chars and maybe also one for join by
	emits: [],
	data() {
		return {
			fieldTypes: {
				"array to string": {
					displayName: "Array to string",
					maxItems: 1

				},
				"calculate": {
					displayName: "Calculate",
					maxItems: -1
				},
				"join": {
					displayName: "Join",
					maxItems: 2
				},
				"join multi": {
					displayName: "Join multi",
					maxItems: -1
				},
				"raw": {
					displayName: "Raw",
					maxItems: 1 
				},
				"replace characters": {
					displayName: "Replace characters",
					maxItems: 1
				},
				"score columns": {
					displayName: "Score columns",
					maxItems: -1
				}
			},
			selectedFields: [],
			fieldsAdded: [],
			componentConfig: {},
			typeInUse: "",
			hideTypeWarning: true,
			disablePlaceholder: false
		};
	},
	modules: {},
	components: {},
	computed: {
		fieldsAddedCurrently(){
			return this.fieldsAdded;
		}
	},
	methods: {
		...uiUtils,
		addFieldToMulti(){
			let maximum = 0;
			if (this.fieldTypes[this.typeInUse]){
				maximum = this.fieldTypes[this.typeInUse].maxItems;
			} else {
				this.hideTypeWarning = false;
			}
			for (let field of this.selectedFields){
				if (this.fieldsAdded.length >= maximum && maximum != -1){
					console.log("This type can't accept that many fields");
				} else if (!this.fieldsAdded.includes(field)) {
					this.fieldsAdded.push(field);
				}
			}
		}
	},
	watch: {
		typeInUse(newType){
			this.disablePlaceholder = true;
			this.hideTypeWarning = true;
			this.selectedFields = [];
			this.fieldsAdded = [];
		}
	}
});
</script>
<style>

</style>


