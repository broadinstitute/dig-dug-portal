<template>
    <div>
        <div class="multi-options-search-ui col-md-12">
            <div class="search-ui-wrapper">
                <div class="assist-me"><input type="checkbox" id="assist_me" name="assistMe" value="assistMe" v-model="assistMe" checked> <label for="assistMe">Assist me!</label></div>
                <div class="input textarea">
                    <textarea
                        rows="4" cols="50"
                        class="form-control multi-options-search-input" 
                        name="multi-options-search-input"
                        v-model="userInput"
                        :id="'search_param_context'"
                        autoComplete="off">
                    </textarea>                    
                </div>
                <div v-if="!!assistMe">
                    <div v-if="searchOptions.kpGenes.length > 0" class="kp-genes-options">
                        <div>KP Genes</div>
                        <select>
                            <template v-for="gene in searchOptions.kpGenes">
                                <option :value="gene">{{ gene }}</option>
                            </template>
                        </select>
                    </div>
                    <div v-if="searchOptions.kpPhenotypes.length > 0" class="kp-phenotypes-options">
                        <div>KP Phenotypes</div>
                        <select>
                            <template v-for="phenotype in searchOptions.kpPhenotypes">
                                <option :value="phenotype.name">{{ phenotype.description }}{{ ' (' + phenotype.group + ')' }}</option>
                            </template>
                        </select>
                    </div>
                    <div class="other-options">
                        <template v-for="parameter in searchCategories">                           
                            <div>{{ parameter.label }}</div>
                            <select>
                            <template v-for="option in searchOptions.otherOptions[parameter.parameter]">
                                <option :value="option.value">{{ option.label }}</option>
                            </template>
                            </select>
                        </template>
                    </div>
                </div>
            </div>
        </div>
        <div class="search-options-wrapper">
            <template v-for="parameter in sectionsConfig['search parameters'].parameters">
                <div v-if="!!getSearchOptions(parameter)">
                    {{ getSearchOptions(parameter) }}
                </div>
            </template>
        </div>
    </div>
</template>

<script>
/*
{{ parent.paramSearch[paramIndex] }}
 {{ sectionsConfig['search parameters'].parameters }}
Development note:
1. Search options get processed at once so any options in any search categories appear at once like Single Search.
2. Find best matching options and display default workflow options
3. Workflow option requirements:
    a. Rawdata load
    b. Filter suggestions for the loaded data
    c. additional information from LLM
        i. prompt
        ii. LLM query
        iii. LLM response formatter
    d. following step options

* parent.paramSearch[paramIndex] is to save initial user search input to page level. 
* sectionsConfig contains: 'search parameters', 'sections', 'phenotypes.' Phenotypes is the kp phenotypes.
*/

export default {
	components: { },
    name: "research-context-search",
    props: ["sectionsConfig", "paramIndex", "parent", "utils"],
    data() {
        return {
            userInput: "",
            assistMe: true,
            workflowInputs: [
            ],
            searchCategories: [],
            searchOptions: {kpGenes:[],kpPhenotypes:[],otherOptions:{}}
        };
    },
    mounted() {
        console.log("sectionsConfig",this.sectionsConfig);
    },
    computed: {
    },
    watch: {
        userInput (INPUT) {
            if(!!this.assistMe) {

            
                this.parent.paramSearch[this.paramIndex] = INPUT;
                this.searchCategories = [];
                this.searchOptions = {kpGenes:[],kpPhenotypes:[],otherOptions:{}};

                /* Check if 'kp genes' or 'kp phenotypes' are in the search parameters. */

                if (INPUT.length > 2) {
                    // kp genes
                    
                    const geneParameter = this.sectionsConfig['search parameters'].parameters.filter(p => p.values == 'kp genes');
                    let geneInput = INPUT.split(",");
                    if (geneParameter.length > 0) {
                        

                        if(geneInput[geneInput.length-1].trim().length > 2) {
                            //console.log("geneInput[geneInput.length-1]",geneInput[geneInput.length-1].trim())
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
                            console.log('other search filteredSearchKeys',filteredSearchKeys);

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
        "searchOptions.kpGenes"(LIST) {
            //console.log(LIST);
        }
	},
    methods: {
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
        }
    }
}
</script>
<style scoped>
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

.multi-options-search-ui div select, 
.multi-options-search-ui div input,
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
