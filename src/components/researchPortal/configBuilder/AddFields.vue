<template>
	<div class="component-wrapper">
		<div>Add fields to display/convert</div>
        <div class="gray-box row">
			<div class="flexdiv flex-med">
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
			<div class="flexdiv flex-med">
				<label>Select field(s)
					<select class="flat-box" multiple v-model="selectedFields">
						<option v-if="!availableFields.length">
							Add your sample data to begin
						</option>
						<option v-for="field in availableFields">{{field}}</option>
					</select>
				</label>
			</div>
			<div class="flexdiv flex-small">
				<button class="add" :disabled="!availableFields.length" 
					@click="addField">&rarr;
				</button>
			</div>
			<div class="field-component flexdiv flex-large">
				<join-field v-if="typeInUse == 'join' || 
				typeInUse == 'join multi'"
				:type="typeInUse" :inputFields="fieldsAdded"
				:newName="newFieldName"
				@configReady="updateSingleFieldConfig"
				@deleteField="deleteField">
			</join-field>
			<calculate-field v-else-if="typeInUse == 'calculate'"
				:type="typeInUse" :inputFields="fieldsAdded"
				:newName="newFieldName"
				@configReady="updateSingleFieldConfig"
				@deleteField="deleteField">
			</calculate-field>
			<raw-field v-else-if="typeInUse == 'raw'"
				:type="typeInUse" :inputFields="fieldsAdded"
				:newName="newFieldName"
				@configReady="updateSingleFieldConfig"
				@deleteField="deleteField">
			</raw-field>
			<array-to-string-field v-else-if="typeInUse == 'array to string'"
				:type="typeInUse" :inputFields="fieldsAdded"
				:newName="newFieldName"
				@configReady="updateSingleFieldConfig"
				@deleteField="deleteField">
			</array-to-string-field>
			<replace-chars-field v-else-if="typeInUse == 'replace characters'"
				:type="typeInUse" :inputFields="fieldsAdded"
				:newName="newFieldName"
				@configReady="updateSingleFieldConfig"
				@deleteField="deleteField">
			</replace-chars-field>
			<score-columns-field v-else-if="typeInUse == 'score columns'"
				:type="typeInUse" :inputFields="fieldsAdded"
				:newName="newFieldName"
				@configReady="updateSingleFieldConfig"
				@deleteField="deleteField">
			</score-columns-field>
			<div v-else><strong>Fields</strong>
				<div class="fieldlist">
				</div>
			</div>
			</div>
			<div class="flexdiv flex-med">
				<label>New field name
				<input type="text" v-model="newFieldName"/>
				</label>
			</div>
			<div class="flexdiv flex-med">
				<label> Edit 
				<textarea v-model="singleFieldConfigString"
					rows="4" cols="30">
				</textarea>
			</label>
			</div>
			<div class="flexdiv flex-small triplebutton">
				<b-button style="background-color: blue;" @click="addDataConvertField">Add</b-button>
				<b-button style="background-color: orange;">Cancel</b-button>
				<b-button style="background-color: red;">Delete</b-button>
			</div>
        </div>
		<div class="warning fields-warning" hidden>
			Select a display type to continue
		</div>
		<div class="field-bubbles">
			<span class="field-bubble" v-for="item in dataConvert">
				{{item["field name"]}}
			</span>
		</div>
		<!--div><strong>Output:</strong>{{showOutputObject}}</div-->
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
			disablePlaceholder: false,
			maxFields: 0,
			newFieldName: "",
			dataConvert: [],
			currentlyEditedField: null
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
		showOutputObject(){
			return JSON.stringify(this.dataConvert);
		}
	},
	methods: {
		...uiUtils,
		addField(){
			if(!this.typeInUse){
				this.showWarning("Select a display type to continue.");
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
		deleteField(fieldToDelete){
			console.log(`Deleting ${fieldToDelete}`);
			this.fieldsAdded = this.fieldsAdded.filter(
				(field) => field != fieldToDelete
			);
		},
		updateSingleFieldConfig(configObject){
			this.singleFieldConfig = configObject;
		},
		addDataConvertField (){
			if (this.singleFieldConfigIsValid()){
				this.dataConvert.push(this.singleFieldConfig);
				this.singleFieldConfig = {};
			}
		},
		showWarning(warning){
			let fieldsWarningArea = 
				document.getElementsByClassName("fields-warning")[0];
			fieldsWarningArea.innerText = warning;
			fieldsWarningArea.hidden = false;
		},
		hideWarning(){
			let fieldsWarningArea = 
				document.getElementsByClassName("fields-warning")[0];
			fieldsWarningArea.hidden = true;
		},
		singleFieldConfigIsValid(){
			this.hideWarning();
			if (this.singleFieldConfig["field name"] == ""){
				this.showWarning("New field name is required.");
				return false;
			}
			for (let field of this.dataConvert){
				if (this.singleFieldConfig["field name"] 
					== field["field name"]){
					this.showWarning("New field names cannot be duplicates.");
					return false;
				}
			}
			return true;
		}
	},
	watch: {
		typeInUse(newType){
			this.disablePlaceholder = true;
			this.hideWarning();
			this.selectedFields = [];
			this.fieldsAdded = [];
			this.maxFields = this.fieldTypes[newType].maxItems;
		},
		singleFieldConfig(newConfig){
			//TODO make it go both ways
			this.singleFieldConfigString = JSON.stringify(newConfig);
		},
		newFieldName(newName){
			if (!!newName){
				this.hideWarning();
			}
		}
	}
});
</script>
<style>
@import url("/css/configBuilder.css");
</style>


