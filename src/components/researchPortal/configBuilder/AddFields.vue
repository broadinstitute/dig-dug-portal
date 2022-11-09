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
					@click="addField">&rarr;
				</button>
			</div>
			<join-field v-if="typeInUse == 'join' || 
				typeInUse == 'join multi'"
				:type="typeInUse" :inputFields="fieldsAdded"
				:newName="newFieldName"
				@configReady="updateSingleFieldConfig">
			</join-field>
			<calculate-field v-else-if="typeInUse == 'calculate'"
				:type="typeInUse" :inputFields="fieldsAdded"
				:newName="newFieldName"
				@configReady="updateSingleFieldConfig">
			</calculate-field>
			<raw-field v-else-if="typeInUse == 'raw'"
				:type="typeInUse" :inputFields="fieldsAdded"
				:newName="newFieldName"
				@configReady="updateSingleFieldConfig">
			</raw-field>
			<array-to-string-field v-else-if="typeInUse == 'array to string'"
				:type="typeInUse" :inputFields="fieldsAdded"
				:newName="newFieldName"
				@configReady="updateSingleFieldConfig">
			</array-to-string-field>
			<replace-chars-field v-else-if="typeInUse == 'replace characters'"
				:type="typeInUse" :inputFields="fieldsAdded"
				:newName="newFieldName"
				@configReady="updateSingleFieldConfig">
			</replace-chars-field>
			<score-columns-field v-else-if="typeInUse == 'score columns'"
				:type="typeInUse" :inputFields="fieldsAdded"
				:newName="newFieldName"
				@configReady="updateSingleFieldConfig"
				@deleteField="deleteField">
			</score-columns-field>
			<div v-else class="col-md-2"><strong>Fields</strong>
				<div class="fieldlist">
					<ul>
						<li></li>
					</ul>
				</div>
			</div>
			<label class="col-md-2">New field name
				<input type="text" v-model="newFieldName"/>
			</label>
			<label class="col-md-2"> Edit 
				<textarea v-model="singleFieldConfigString"
					rows="4" cols="30">
				</textarea>
			</label>
			<div class="col-md-1 triplebutton">
				<b-button style="background-color: blue;">Add</b-button>
				<b-button style="background-color: orange;">Cancel</b-button>
				<b-button style="background-color: red;">Delete</b-button>
			</div>
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
import ReplaceCharsField from "@/components/researchPortal/configBuilder/ReplaceCharsField.vue";
import JoinField from "@/components/researchPortal/configBuilder/JoinField.vue";
import CalculateField from "@/components/researchPortal/configBuilder/CalculateField.vue";
import ArrayToStringField from "@/components/researchPortal/configBuilder/ArrayToStringField.vue";
import ScoreColumnsField from "@/components/researchPortal/configBuilder/ScoreColumnsField.vue";

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
					maxItems: 1
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
		RawField,
		ReplaceCharsField,
		JoinField,
		CalculateField,
		ArrayToStringField,
		ScoreColumnsField
	},
	computed: {
		fieldsAddedCurrently(){
			return this.fieldsAdded;
		}
	},
	methods: {
		...uiUtils,
		addField(){
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
		deleteField(field){
			console.log(`Deleting ${field}`);
		},
		updateSingleFieldConfig(configObject){
			this.singleFieldConfig = configObject;
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
			//TODO make it go both ways
			this.singleFieldConfigString = JSON.stringify(newConfig);
		}
	}
});
</script>
<style>
@import url("/css/configBuilder.css");
</style>


