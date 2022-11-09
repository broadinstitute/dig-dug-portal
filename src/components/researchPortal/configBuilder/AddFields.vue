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
						<option v-if="!availableFields.length">
							Add your sample data to begin
						</option>
						<option v-for="field in availableFields">{{field}}</option>
					</select>
				</label>
			</div>
			<div class="col-md-1">
				<button class="add" :disabled="!availableFields.length" 
					@click="addFieldToMulti">&rarr;
				</button>
			</div>
			<raw-field v-if="typeInUse == 'raw' || 
				typeInUse == 'replace characters'"
				:type="typeInUse" :inputFields="fieldsAdded"
				@configReady="updateSingleFieldConfig">
			</raw-field>
			<div v-else class="col-md-2"><strong>Fields</strong></div>
			<label>New field name
				<input type="text" v-model="newFieldName"
				v-on:focusout="updateSingleFieldConfig(singleFieldConfig)"/>
			</label>
			<label> Edit 
				<textarea v-model="singleFieldConfigString"
					rows="4" cols="30">
				</textarea>
			</label>
        </div>
		<div class="warning" :hidden="hideTypeWarning">
			Select a display type to continue
		</div>
    </div>
</template>

<script>
import Vue from "vue";
import uiUtils from "@/utils/uiUtils";
import { BootstrapVueIcons } from "bootstrap-vue";
Vue.use(BootstrapVueIcons);
import RawField from "@/components/researchPortal/configBuilder/RawField.vue";

export default Vue.component("add-fields", {
	props: ['availableFields'],
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
			singleFieldConfig: {},
			singleFieldConfigString: JSON.stringify({}),
			typeInUse: "",
			hideTypeWarning: true,
			disablePlaceholder: false,
			maxFields: 0,
			newFieldName: ""
		};
	},
	modules: {},
	components: {
		RawField
	},
	computed: {
		fieldsAddedCurrently(){
			return this.fieldsAdded;
		}
	},
	methods: {
		...uiUtils,
		addFieldToMulti(){
			if(!this.typeInUse){
				this.hideTypeWarning = false;
				return;
			}
			for (let field of this.selectedFields){
				if (this.fieldsAdded.length >= this.maxFields 
					&& this.maxFields != -1){
					console.log("This type can't accept that many fields");
				} else if (!this.fieldsAdded.includes(field)) {
					this.fieldsAdded.push(field);
				}
			}
		},
		updateSingleFieldConfig(configObject){
			let newConfig = configObject;
			newConfig["field name"] = this.newFieldName;
			this.singleFieldConfig = newConfig;
		},
	},
	watch: {
		typeInUse(newType){
			this.disablePlaceholder = true;
			this.hideTypeWarning = true;
			this.selectedFields = [];
			this.fieldsAdded = [];
			this.maxFields = this.fieldTypes[newType].maxItems;
		},
		singleFieldConfig(newConfig){
			this.singleFieldConfigString = JSON.stringify(newConfig);
		}
	}
});
</script>
<style>
@import url("/css/configBuilder.css");
</style>


