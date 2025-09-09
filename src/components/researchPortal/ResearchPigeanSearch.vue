<template>
    <div>
        <div class="multi-options-search-ui col-md-12">
            <div class="assist-me" v-if="!!assistMeConfig">
                <input type="checkbox" id="assist_me" name="assistMe" value="assistMe" v-model="assistMe" style="vertical-align: -10px;"> <label for="assistMe" class="assist-me-label">Assist me!</label>
            </div>
            <div class="search-ui-wrapper" v-if="!assistMe">
                <div class="input parameter-search">
                    <input
                        class="form-control multi-options-search-input" 
                        name="multi-options-search-input"
                        v-model="userInputParameter"
                        :id="'search_param_context'"
                        autoComplete="off"
                        style="display: inline-block; height: 36px; margin-right: 15px; vertical-align: middle;" />
                        <span class="btn btn-primary" @click="callSearch()" :disabled="isLoading" style="margin-right: 8px;">
                        Search</span>
                        <span class="btn btn-warning" @click="resetSearch()" style="display: inline-block; height: 34px;">Reset search</span>
                </div>
            </div>
            <div class="search-ui-wrapper" v-else>
                <div class="input parameter-search">
                    <input
                        class="form-control multi-options-search-input" 
                        name="multi-options-search-input"
                        v-model="userInputParameter"
                        :id="'search_param_context'"
                        autoComplete="off"
                        style="display: inline-block; height: 36px; margin-right: 15px; vertical-align: middle;" />
                        <span class="btn btn-primary" @click="buildSearch()" :disabled="isLoading" style="margin-right: 8px;">
                        Build search</span>
                </div>
            </div>
        </div>
        <div class="search-parameters-and-options" v-if="!assistMe">
            <div v-if="searchOptions.kpGenes.length > 0" class="kp-genes-options">
                <div>Genes</div>
                <div class="parameter-options">
                    <div class="first-option option" @click="buildSearch({label:searchOptions.kpGenes[0],value:searchOptions.kpGenes[0],parameter:'gene'})">
                        {{ searchOptions.kpGenes[0] }}
                    </div>
                    <div class="more-options" v-if="searchOptions.kpGenes.length > 1">
                        <div class="option" v-for="(gene, geneIndex) in searchOptions.kpGenes"
                            v-if="geneIndex > 0" @click="buildSearch({label:gene,value:gene,parameter:'gene'})">
                            {{ gene }}
                        </div>
                    </div>
                </div>
            </div>
            <div v-if="searchOptions.kpPhenotypes.length > 0" class="kp-phenotypes-options">
                <div>Phenotypes</div>
                <div class="parameter-options">
                    <div class="first-option option" @click="buildSearch({label:searchOptions.kpPhenotypes[0].description,value:searchOptions.kpPhenotypes[0].name,parameter:'phenotype'})">
                        {{ searchOptions.kpPhenotypes[0].description }}{{ ' (' + searchOptions.kpPhenotypes[0].group + ')' }}
                    </div>
                    <div class="more-options" v-if="searchOptions.kpPhenotypes.length > 1">
                        <div class="option" v-for="(phenotype, phenotypeIndex) in searchOptions.kpPhenotypes"
                            v-if="phenotypeIndex > 0" @click="buildSearch({label:phenotype.description,value:phenotype.name,parameter:'phenotype'})">
                            {{ phenotype.description }}
                        </div>
                    </div>
                </div>
            </div>
            <div class="other-options">
                <template v-for="parameter in searchCategories">                           
                    <div>{{ parameter.label }}</div>
                    <div class="parameter-options">
                        <div class="first-option option" @click="buildSearch({label:searchOptions.otherOptions[parameter.parameter][0].label,value:searchOptions.otherOptions[parameter.parameter][0].value,parameter:parameter.parameter})">
                            {{ searchOptions.otherOptions[parameter.parameter][0].label }}
                        </div>
                        <div class="more-options" v-if="searchOptions.otherOptions[parameter.parameter].length > 1">
                            <div class="option" v-for="(option, optionIndex) in searchOptions.otherOptions[parameter.parameter]"
                                v-if="optionIndex > 0" @click="buildSearch({label:option.label,value:option.value,parameter:parameter.parameter})">
                                {{ option.label }}
                            </div>
                        </div>
                    </div>
                </template>
            </div>
        </div>
        <div v-if="searchParamValues.length > 0" class="search-plan-wrapper">
            <h5>Search plan: <span v-if="!!assistMe && !isEditing" class=" btn btn-sm edit-search-plan" @click="editSearchPlan()"> Edit plan</span> <span v-if="!!assistMe && !!isEditing" class=" btn btn-sm edit-search-plan" @click="saveSearchPlan()"> Save plan</span></h5>
            <div v-if="isEditing">
                <input type="text" id="search_value" class="form-control search-edit-input" :value="searchParamValues[0].label" />
            </div>
            <div>
                <div v-for="(section, sIndex) in sectionsConfig.sections" v-if="section['data point'].parameters.includes(searchParamValues[0].parameter)">
                    {{ sIndex + 1 +'. ' }}Search will query data for [ <span class="search-key">{{ section.header }}</span> ] section with [ <span class="search-key">{{ searchParamValues[0].label }}</span> ].
                </div>
            </div>
            <div v-if="!!focusValue" style="margin-top: 15px;">
                <h5>AI assited research focus: </h5>
                <div v-if="isEditing">
                <input type="text"  id="focus_value" class="form-control search-edit-input" :value="focusValue.label" />
            </div>
                <div>Extended search will focus on [<span class="search-key">{{ focusValue.label }}</span>].</div>
            </div>
            <div v-if="!!assistMe && !isEditing && searchParamValues.length > 0" style="margin-top: 15px; text-align: center;">
                <span class="btn btn-primary" @click="callSearch(focusValue)" :disabled="isLoading" style="margin-right: 8px;">
                        Search</span>
                <span class="btn btn-warning" @click="resetSearch()" style="display: inline-block; height: 34px;">Reset search</span>
            </div>
        </div>
    </div>
</template>

<script>

import Vue from "vue";
//import { llmUtils } from "@/utils/llmUtils.js";

export default Vue.component("research-pigean-search", {
    props: ["sectionsConfig", "paramIndex", "parent", "utils"],
    components: {
        ResearchLoadingSpinner: () => import("./ResearchLoadingSpinner.vue")
    },
    data() {
        return {
            userInputParameter: "",
            userInputFocus: "",
            assistMe: false,
            assistMeContents: null,
            workflowInputs: [
            ],
            searchCategories: [],
            searchOptions: {kpGenes:[],kpPhenotypes:[],otherOptions:{}},
            filterOptions: [],
            searchParamValues: [],
            focusValue: null,
            isLoading: false,
            isEditing: false
        };
    },
    mounted() {
        //console.log("sectionsConfig",this.sectionsConfig['search parameters']);
    },
    computed: {
        assistMeConfig() {
            let pigeanSearchConfig = this.sectionsConfig['search parameters']
            if(!!pigeanSearchConfig['assist me']) {
                return pigeanSearchConfig['assist me'];
            } else {
                return null;
            }
        }
    },
    watch: {
        userInputParameter (INPUT) {
            if(!this.assistMe) {

                /* build search options */

                this.parent.paramSearch[this.paramIndex] = INPUT; // this line is important to connect to the parent component.
                this.searchCategories = [];
                this.searchOptions = {kpGenes:[],kpPhenotypes:[],otherOptions:{}};

                /* Check if 'kp genes' or 'kp phenotypes' are in the search parameters. */

                if (INPUT.length > 2) {
                    // kp genes
                    
                    const geneParameter = this.sectionsConfig['search parameters'].parameters.filter(p => p.values == 'kp genes');
                    let geneInput = INPUT.split(",");
                    if (geneParameter.length > 0) {

                        if(geneInput[geneInput.length-1].trim().length > 2) {
                            this.getGenes(geneInput[geneInput.length-1].trim());
                        }
                        
                    } else {
                        this.searchOptions.kpGenes = [];
                    }
                    

                    // kp phenotypes ex.{ "name": "VaricoseVeins", "description": "Varicose veins", "group": "CARDIOVASCULAR", "dichotomous": 1 }
                    const phenotypeParameter = this.sectionsConfig['search parameters'].parameters.filter(p => p.values == 'kp phenotypes');
                    if (phenotypeParameter.length > 0) {

                        let phenotypesUnfiltered = [...new Set(this.sectionsConfig.phenotypes)];

                        let searchKeys = INPUT.toLowerCase().split(',')
                        let filteredSearchKeys = [];

                        // first check if each of the search keays are for phenotype searchs then add to filteredSearchKeys
                        let phenotypes2SearchKeys = [...new Set(this.sectionsConfig.phenotypes)];
                        searchKeys.map(key => {
                            if(key.length > 2) {
                                if(phenotypes2SearchKeys.filter(p => p.description.toLowerCase().includes(key.trim())).length > 0) {
                                    filteredSearchKeys.push(key.trim());
                                } else {
                                    filteredSearchKeys.push('no match');
                                }
                            }
                        })

                        if(filteredSearchKeys.length > 0 && filteredSearchKeys[filteredSearchKeys.length-1] != 'no match') {
                            filteredSearchKeys.map(key => {
                                if(key.length > 2 && key != 'no match') {
                                    phenotypesUnfiltered = phenotypesUnfiltered.filter(p => p.description.toLowerCase().includes(key.trim()))
                                }
                            })
                            this.searchOptions.kpPhenotypes = phenotypesUnfiltered.sort((a, b) => a.description.length - b.description.length);
                        }
                    }

                    // if there are other options
                    const otherParameters = this.sectionsConfig['search parameters'].parameters.filter(p => p.values != 'kp genes' && p.values != 'kp phenotypes');

                    if( otherParameters.length > 0) {
                        otherParameters.map( parameter => {

                            let searchKeys = INPUT.toLowerCase().split(',')
                            let parameterOptions = [];

                            switch (parameter.values) {
                                case 'shared resource':

                                    const listMapObj = this.sectionsConfig.sharedResource[parameter['values source']];
                                    
                                    for (const [oKey, oValue] of Object.entries(listMapObj)) {
                                        parameterOptions.push({value:oKey, label:oValue, parameter: parameter.parameter});
                                    }

                                    break;
                                case 'keywords':
                                    /* do nothing for the moment until I decide what to do */
                                    break;
                                default:

                                    parameterOptions = [...new Set(parameter.values)]
                                    parameterOptions.map( O => {
                                        O['parameter'] = parameter.parameter;
                                    })

                                    break;
                            }

                            let phenotypes2SearchKeys = [...new Set(parameterOptions)];
                            let filteredSearchKeys = [];

                            searchKeys.map(key => {
                                if(key.length > 2) {
                                    if(phenotypes2SearchKeys.filter(p => p.label.toLowerCase().includes(key.trim())).length > 0) {
                                        filteredSearchKeys.push(key.trim());
                                    } else {
                                        filteredSearchKeys.push('no match');
                                    }
                                }
                            })

                            if(filteredSearchKeys.length > 0 && filteredSearchKeys[filteredSearchKeys.length-1] != 'no match') {
                                filteredSearchKeys.map(key => {
                                    if(key.length > 2 && key != 'no match') {
                                        parameterOptions = parameterOptions.filter(p => p.label.toLowerCase().includes(key.trim()))
                                    }
                                })
                            } else {
                                parameterOptions = [];
                            }

                            if (parameterOptions.length > 0) {
                                this.searchCategories.push({parameter: parameter.parameter, label: parameter.label})
                                this.searchOptions.otherOptions[parameter.parameter] = parameterOptions.sort((a, b) => a.label.length - b.label.length);
                            }

                            
                        })
                    }
                } else {
                    this.searchOptions.kpGenes = [];
                    this.searchOptions.kpPhenotypes = []
                    this.searchOptions.otherOptions = {}
                }
            }
            
        },
        assistMeContents(CONTENTS) {
            //console.log("assistMeContents", CONTENTS);
            let jsonData = this.utils.dataConvert.extractJson(CONTENTS);
            //console.log("jsonData", jsonData);
            if(!!jsonData) {

                let fieldsToMatch = {
                    parameter: {name:'cfdePhenotype',field:'search_terms'},
                    context: {name: 'focus', field: 'context'}
                }

                let param = {label:jsonData[fieldsToMatch.parameter.field],value:jsonData[fieldsToMatch.parameter.field],parameter:fieldsToMatch.parameter.name}
                
                if(!!param.value && typeof param.value == 'object' && Array.isArray(param.value)) {
                    param.value = param.value.toString();
                    param.label = param.value;
                }

                //console.log("param", param);

                this.buildSearch(param)

                this.focusValue = {label:jsonData[fieldsToMatch.context.field],value:jsonData[fieldsToMatch.context.field],parameter:fieldsToMatch.context.name};
            }
        }
	},
    methods: {
        editSearchPlan() {
            this.isEditing = true;
            console.log("editSearchPlan", this.searchParamValues[0], this.focusValue);
        },
        saveSearchPlan() {
            this.searchParamValues[0].label = document.getElementById("search_value").value;
            this.searchParamValues[0].value = document.getElementById("search_value").value;
            this.focusValue.label = document.getElementById("focus_value").value;
            this.focusValue.value = document.getElementById("focus_value").value;
            this.isEditing = false;
        },
        callSearch(withFocus) {
            this.isLoading = true;

            console.log("search called", this.searchParamValues);
            
            this.parent.setListValue(
                this.searchParamValues[0].value, 
                this.searchParamValues[0].parameter, 
                this.paramIndex, true)

            this.userInputParameter = "";
            //this.userInputFocus = "";
            this.searchParamValues = [];
            
            if(!!withFocus) {
                this.parent.setListValue(
                withFocus.value, 
                withFocus.parameter, 
                this.paramIndex+1, true)
            }
            
            // Reset loading state after a short delay to allow parent to process
            setTimeout(() => {
                this.isLoading = false;
            }, 1000);
        },

        resetSearch() {
            this.userInputParameter = "";
            //this.userInputFocus = "";
            this.searchParamValues = [];
            //this.focusValues = [];
            this.parent.resetSearch();
        },
        async getGenes(SEARCH) {
            let searchPoint = this.utils.uiUtils.biDomain() + "/api/bio/match/gene?q=" + SEARCH;

            let geneJson = await fetch(searchPoint).then((resp) => resp.json());

            if (geneJson.error == null && geneJson.detail == null) {
                this.searchOptions.kpGenes = geneJson.data;
            } else {
                this.searchOptions.kpGenes = [];
            }
		},
        getSearchOptions(PARAMETER) {

            switch(PARAMETER.values) {
                case "kp genes":
                    if(this.searchOptions.kpGenes.length > 0) {
                        return PARAMETER.context;
                    } else {
                        return null
                    }
                    
                    break;
                case "kp phenotypes":
                    if(this.searchOptions.kpPhenotypes.length > 0) {
                        return PARAMETER.context;
                    } else {
                        return null
                    }
                    break;
                default:

                    break;
            }
        },
        buildSearch(SEARCH) {
            if(!!SEARCH) {
                this.searchParamValues = [SEARCH];
                this.userInputParameter = "";//SEARCH.label;
            } else {
                this.buildSearchLLM();
            }
        },
        async buildSearchLLM() {
            this.assistMeContents = "Call made to LLM.";
            this.loading = true;

            try {
                // Prepare the prompt
                let prompt = this.assistMeConfig['prompt'] + '\n';
                prompt += `User input: ${this.userInputParameter}\n\n`;

                // Prepare the system prompt with JSON model
                const jsonModel = this.assistMeConfig['response json'];
                const modelString = JSON.stringify(jsonModel, null, 2);
                const systemPrompt = `Your entire response must be a single, raw JSON object and nothing else. Do not include '''json markdown tags, explanations, or any text whatsoever before the opening { or after the closing '}. Use this exact JSON structure:  ${modelString}\n\n`;

                console.log("prompt", prompt);

                // Use the utility function
                const result = await this.utils.llmUtils.queryLLMSimple(
                    prompt,
                    systemPrompt,
                    this.assistMeConfig['model'],
                    'https://llm.hugeamp.org/gemini'
                );

                if (result.success) {
                    this.assistMeContents = result.data;
                } else {
                    this.assistMeContents = `Error: Failed to process LLM request. ${result.error}`;
                }
                
            } catch (error) {
                console.error("Error in buildSearchLLM:", error);
                this.assistMeContents = "Error: Failed to process LLM request";
            } finally {
                // Always ensure loading is set to false, even if there's an error
                this.loading = false;
            }
        }
    }
})
</script>
<style scoped>
/* ones used */

.edit-search-plan {
    color: #3333FF;
    text-decoration: underline;
}

.search-edit-input {
    width: 80% !important;
    margin-left: 10%;
}

.search-parameters-and-options {
    white-space: nowrap;
}

.kp-genes-options, .kp-phenotypes-options, .other-options, .data-focus-options {
    display: inline-block;
    vertical-align: top;
    max-width: 300px;
    margin: 0 15px;
}

.more-options {
    display: none;
}

.kp-genes-options:hover .more-options, .kp-phenotypes-options:hover .more-options, .parameter-options:hover .more-options {
    display: block;
}

.parameter-options {
    max-width: 300px;
    max-height: 300px;
    overflow-y: scroll;
    overflow-x: hidden;
}

.option {
    width: 300px;
    max-width: 300px;
    background: #fff;
    border: solid 1px #dddddd;
    border-top: solid 1px #ffffff;
    border-bottom: solid 1px #bbbbbb;
    padding: 3px 17px 3px 7px;
    text-align: left;
    white-space: pre-wrap;
    text-indent: -3px;
}

.option:hover {
    cursor: pointer;   
    background-color: #bbdfff;
}

.search-plan-wrapper {
    text-align: left;
    margin-top: 25px;
    padding-top: 10px;
    line-height: 1.75em;
    border-top: solid 1px #cccccc;
}

.search-key {
    background-color: #f9a857;
}

/* ones used */
.context-search-btn {
    margin: 20px 0;
}

.reset-button-container {
    text-align: right;
    padding-right: 20px;
}

.multi-options-search-ui > div.search-ui-wrapper > div {
    display: inline-flex;
}

.multi-options-search-ui > div.search-ui-wrapper > div {
    display: inline-block;
    vertical-align: top;
}

.multi-options-search-ui div textarea {
    border: solid 1px #ced4da;
}

.multi-options-search-ui > div.search-ui-wrapper > div.type > select {
    border-radius: 5px;
    width: auto;
    background-color: #ffffff;
    padding: 0 0 0 5px;
    margin-right: 15px;
    border: solid 1px #ced4da;
    display: inline-block;
}

select.meaning-search {
    background-color: #FF7F00 !important;
    color: #ffffff !important;
    transition: all 1s ease-out;
}

.multi-options-search-ui > div.search-ui-wrapper > div.input > input {
    border-radius: 5px;
    width: 400px;
    background-color: #ffffff;
    padding: 0 15px 0;
    border: solid 1px #ced4da;
}

.multi-options-search-ui > div.search-ui-wrapper > div.input.textarea > textarea {
    width: 500px;
    height: 80px;
    background-color: #ffffff;
    padding: 15px;
    border-radius: 5px;
    border: solid 1px #ced4da;
}

.research-narrative-options {
    position: absolute;
    width: 840px !important;
    background-color: #fff;
    border: solid 1px #ced4da;
    border-radius: 3px;
    padding: 10px 15px;
    text-align: left;
    margin: auto -20%;
    margin-top: 5px;
    z-index: 100;
}
</style>
<style>
.multi-page-search-wrapper {
    height: auto !important;
}

.filtering-ui-wrapper.search-criteria.multi-page-search.fixed-header {
    position: relative !important;
}
</style>
