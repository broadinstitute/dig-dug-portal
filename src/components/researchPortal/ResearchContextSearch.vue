<template>
    <div>
    <div class="multi-options-search-ui col-md-12">
        <div class="search-ui-wrapper">
            <div class="type">
                <select id="parameter_type" v-model="parameterFocused"
                :class="(searchParameterType == 'meaning search')? 'meaning-search':''">
                    <option value="">{{ 'Select a Search Type' }}</option>
                    <option v-for="item in searchParameters" 
                            :key="item.parameter"
                            :value="item.parameter">{{ item.label }}</option>
                </select>

                <select v-if="searchParameterType == 'meaning search'"
                id="search_param_similarityThreshold" class="form-control ss-meaning-sim-score meaning-search sim-score" title="Similarity score" >
					<option value="0.01">0.01</option>
					<option value="0.1">0.1</option>
					<option value="0.2">0.2</option>
					<option value="0.3">0.3</option>
					<option value="0.4">0.4</option>
					<option value="0.5" selected>0.5</option>
					<option value="0.6">0.6</option>
					<option value="0.7">0.7</option>
					<option value="0.8">0.8</option>
					<option value="0.9">0.9</option>
					<option value="1">1</option>
				</select>
            </div>
            <div class="input" v-if="searchParameterType == 'list' || searchParameterType == 'input' || !searchParameterType">
                <input class="form-control multi-options-search-input" 
                    name="multi-options-search-input"
                    v-model="parent.paramSearch[paramIndex]"
                    @focus="resetInput(paramIndex)"
                    @keyup="(parameterFocused != '')?getValue($event):''" 
                    :id="'search_param_' + parameterFocused"
                    autoComplete="off" />
            </div>
            <div class="input textarea" v-if="searchParameterType == 'string to array' || searchParameterType == 'meaning search'">
                <textarea
                    rows="4" cols="50"
                    class="form-control multi-options-search-input" 
                    name="multi-options-search-input"
                    v-model="parent.paramSearch[paramIndex]"
                    @focus="resetInput(paramIndex)"
                    @keyup="(parameterFocused != '')?getValue($event):''" 
                    :id="'search_param_' + parameterFocused"
                    autoComplete="off">
                </textarea>
            </div>
        </div>
    </div>
    <div id="research_narrative_options" class="research-narrative-options hidden" :class="(searchParameterType == 'string to array' || searchParameterType == 'meaning search')? 'text-area':''">
        <template v-for="option in contextOptions">
            <div :key="option['context id']" class="row">
                <div class="col-md-10">
                    <div><strong v-html="option.label"></strong></div>
                    <div v-html="option.description"></div>
                </div>
                <div class="col-md-2">
                    <button class="btn btn-sm btn-primary context-search-btn" @click="cleanUpKeyParams(parameterFocused,option.sections,option['context id']); parent.updateSearch(parameterFocused,option.sections)">Search</button>
                </div>
            </div>
        </template>
        <div class="reset-button-container">
            <button class="btn btn-sm btn-success context-search-btn" @click="parent.resetSearch()">Reset search</button>
        </div>
    </div>
    <div :id="'listOptions' + parameterFocused" 
            class="custom-select custom-select-search long-list"
            :size="listOptions.length >= 5 ? 5 : 'auto'"
            :style="listOptions.length == 0 ? 'display:none !important;' : ''"
            style="right: 0;">
        <template v-for="option in listOptions">
            <a :key="option.value"
                href="javascript:;" 
                v-html="option.label"
                @click="parent.setListValue(option.value, parameterFocused, paramIndex, null); listOptions = [];"
                class="custom-select-a-option"></a>
        </template>
    </div>
</div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";

export default {
    name: "ResearchContextSearch",
    props: ["sectionsConfig", "paramIndex", "parent", "utils"],
    data() {
        return {
            parameterFocused: '',
            listOptions: [],
        };
    },
    mounted() {
        this.hideSections();
        $(function () { });
    },
    methods: {
        cleanUpKeyParams(PARAMETER, SECTIONS, CNTXT_ID) {

            const sections = this.sectionsConfig.sections;

            //1. get all parameters list;
            let allParameters = [];
            sections.map(S => {
                const sParameters = S['data point'].parameters;
                allParameters = [...new Set(allParameters.concat(sParameters))]
            })
            //2. remove querying parameters from the all parameters list
            SECTIONS.map(S => {
                const parameters = sections.filter(section => section['section id'] == S)[0]['data point'].parameters;
                parameters.map(P => {
                    allParameters = allParameters.filter(param => param !== P);
                })
            })

            //3. set parameters in paramObj = false;

            let paramsObj = {'contextid':CNTXT_ID};   // set contextid parameter
            
            allParameters.map( P => {
                paramsObj[P] = false;
            })

            if(this.searchParameterType == 'meaning search') {
                paramsObj["similarityThreshold"] = document.getElementById('search_param_similarityThreshold').value
            }
            
            this.utils.keyParams.set(paramsObj);
            
        },
        getCurrentContext(contextId) {
            console.log("sectionsConfig",this.sectionsConfig['search parameters']);
            let contextSections = [];
            this.sectionsConfig['search parameters'].parameters.map(param => {
                if(!!this.utils.keyParams[param.parameter]) {
                    contextSections = param.context.filter(C => C['context id'] == contextId)[0].sections;
                }
            })

            return contextSections
        },
        hideSections() {
            let currentSections = document.querySelectorAll('.multi-section-card');
            let contextId = (!!this.utils.keyParams['contextid'])? this.utils.keyParams['contextid'] : null;
            let currentContext = (!!contextId)? this.getCurrentContext(contextId):null;
            console.log('currentContext',currentContext)

            currentSections.forEach(section => {
                let sectionId = section.getAttribute('id').replace('section_wrapper_', '');
                let currentConfig = this.sectionsConfig.sections.filter(section => section['section id'] == sectionId)[0];
                let currentParameters = currentConfig['data point'].parameters;
                let ifParams = true;
                currentParameters.forEach(parameter => {
                    if(!this.utils.keyParams[parameter]) {
                        ifParams = false;
                    }

                    if(!!contextId && !!currentContext && currentContext.includes(sectionId) == false) {
                        ifParams = false;
                    }
                })

                if(!ifParams) {
                    section.classList.add('hidden');
                }
            });
        },
        resetInput(PARAM_INDEX) {
            this.utils.uiUtils.showElement("research_narrative_options");
            //this.parent.paramSearch[PARAM_INDEX] = "";
        },
        getValue(EVENT) {
            const paramType = this.parameterFocused;
            let paramValue = (paramType == 'all') ? 'all' : this.searchParameters.filter(i => i.parameter == paramType)[0].values;
            paramValue = (!paramValue) ? 'manual input' : paramValue;

            switch(paramValue) {
                case 'manual input':
                    break;
                case "kp genes":
                    this.parent.getGenes(EVENT);
                    let kpGenes = [];
                    this.parent.kpGenes.map(g => {
                        kpGenes.push({label: g, value: g});
                    });
                    this.getListOptions(EVENT, paramType, kpGenes);
                    break;
                case "kp phenotypes":
                    this.getListOptions(EVENT, paramType, this.kpPhenotypes);
                    break;
                default:
                    this.getListOptions(EVENT, paramType, paramValue);
                    break;
            }
        },
        getListOptions(EVENT, PARAM, LIST) {
            let options = [];
            if (EVENT.target.value.length >= 2) {
                LIST.map(option => {
                    if (!!option.label.toLowerCase().includes(EVENT.target.value.toLowerCase())) {
                        options.push(option);
                    }
                });
                let shorterFirst = options.sort((a, b) => a.label.length - b.label.length);
                this.listOptions = shorterFirst;
            } else {
                this.listOptions = [];
            }
        }
    },
    computed: {
        searchParameters() {
            return this.sectionsConfig["search parameters"]["parameters"];
        },
        searchParameterType() {
            if(this.parameterFocused != '') {
                let type = this.sectionsConfig["search parameters"]["parameters"]
                    .filter(P => P.parameter == this.parameterFocused)[0]['type'];
                return type;
            }
            return null;
        },
        contextOptions() {
            if(this.parameterFocused != '') {
                let context = this.sectionsConfig["search parameters"]["parameters"]
                    .filter(P => P.parameter == this.parameterFocused)[0]['context'];
                return context;
            }
            return null;
        },
        kpPhenotypes() {
            let phenotypes = [];
            this.parent.kpPhenotypes.map(p => {
                phenotypes.push({label: p.description, value: p.name});
            });
            return phenotypes;
        }
    }
};
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
    width: 400px;
    height: 150px;
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
    left: calc(25% + 40px);
}
</style>