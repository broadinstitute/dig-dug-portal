<template>
    <div class="multi-options-search-ui col-md-12">
        <div class="search-ui-wrapper">
            <div class="type">
                <select id="parameter_type" v-model="parameterFocused"
                    @change="resetInput(paramIndex)">
                    <option value="">{{ 'Set parameter' }}</option>
                    <option v-for="item in searchParameters"
                        :value="item.parameter" >{{ item.label }}
                    </option>
                </select>
            </div>
            <div class="input">
                <input class="form-control multi-options-search-input" 
                    name="multi-options-search-input"
                    v-model="parent.paramSearch[paramIndex]"
                    @keyup="(parameterFocused != '')?getValue($event):''" 
                    :id="'search_param_' + parameterFocused"
                    autoComplete="off" />
            </div>
        </div>
        <div>
            <div class="research-narrative-options hidden">
                <div><span @click="parent.resetSearch()">Reset</span></div>
                <template v-for="option in contextOptions">
                    <div class="row">
                        <div class="col-md-10">
                            {{ option["context id"] }}
                            <div><strong v-html="option.label"></strong></div>
                            <div v-html="option.description"></div>
                        </div>
                        <div class="col-md-2">
                            <button class="btn btn-sm btn-primary context-search-btn" @click="parent.updateSearch(parameterFocused,option.sections)">Search</button>
                        </div>
                    </div>
                </template>
            </div>
            <div :id="'listOptions' + parameterFocused" class="custom-select custom-select-search long-list"
                        :size="listOptions.length >= 5 ? 5 : 'auto'"
                        :style="listOptions.length == 0
                            ? 'display:none !important;'
                            : ''
                            "
                            style="float:right">
                <template v-for="option in listOptions">
                    <a href="javascript:;" v-html="option.label"
                        @click="parent.setListValue(
                        option.value,
                        parameterFocused,
                        paramIndex,
                        true
                    ); listOptions = [];
                        " class="custom-select-a-option"></a>
                </template>
            </div>
        </div>
        
        
    </div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";


export default Vue.component("research-context-search", {
	props: ["sectionsConfig","paramIndex","parent","utils"],
	components: {
	},
	data() {
		return {
            parameterFocused: '',
            listOptions:[],
		};
	},
	modules: {
	},
	mounted: function () {

	},
    methods: {
        resetInput(PARAM_INDEX) {
            
            this.utils.uiUtils.showElement("research-narrative-options");
            
            this.parent.paramSearch[PARAM_INDEX] = ""

            //document.getElementsByClassName("multi-options-search-input")[0].value = "";
            // input box needs to be emptied on change.
        },
		getValue(EVENT) {
            const paramType = this.parameterFocused;
            let paramValue = (paramType == 'all')? 'all' : this.searchParameters.filter(i => i.parameter == paramType)[0].values;

            paramValue = (!paramValue)? 'manual input' : paramValue;

            switch(paramValue) {
                case 'manual input':

                    break;
                case "kp genes":
                    this.parent.getGenes(EVENT);

                    let kpGenes = [];
                    this.parent.kpGenes.map(g => {
                        kpGenes.push({label:g,value:g});
                    })
                    this.getListOptions(EVENT,paramType,kpGenes);
                    break;
                case "kp phenotypes":

                    this.getListOptions(EVENT,paramType,this.kpPhenotypes);
                    break;
                default:
                    this.getListOptions(EVENT,paramType,paramValue);
                    break;
            }
        },
        getListOptions(EVENT,PARAM,LIST) {
            let options = [];
			if (EVENT.target.value.length >= 2) {

				LIST.map(option => {
					if (!!option.label.toLowerCase().includes(EVENT.target.value.toLowerCase())) {
						options.push(option);
					}
				})

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
        contextOptions() {

            if(this.parameterFocused != '') {
                let context = this.sectionsConfig["search parameters"]["parameters"].filter( P => P.parameter == this.parameterFocused)[0]['context'];
                return context;
            } else {
                return null;
            }
            
        },
		kpPhenotypes() {
            let phenotypes = []
            this.parent.kpPhenotypes.map(p => {
                phenotypes.push({label: p.description, value: p.name})
            })
            return phenotypes;
        }
	},
	watch: {
       
	},
	
});

$(function () { });
</script>
<style scoped>
    .context-search-btn {
        margin: 20px 25%;
    }

    .multi-options-search-ui > div.search-ui-wrapper > div {
        display:inline-flex;
    }

    .multi-options-search-ui > div > select, .multi-options-search-ui > div > input{
        /*border: none; */
    }

    .multi-options-search-ui > div.search-ui-wrapper > div.type > select {
        border-radius: 3px 0 0 3px;
        border: solid 1px #ced4da;
        width: auto;
        background-color: #ffffff;
        padding: 0 0 0 5px;
    }

    .multi-options-search-ui > div.search-ui-wrapper > div.input > input {
        border-radius: 0 3px 3px 0;
        border: solid 1px #ced4da;
        width: auto;
        background-color: #ffffff;
        padding: 0 15px 0;
        border-left: none;
    }

    .research-narrative-options {
        position: absolute;
        width: 840px !important;
        background-color: #fff;
        border: solid 1px #ced4da;
        border-radius: 3px;
        padding: 10px 15px;
        text-align: left;
        margin: auto -25%;
        top: 40px;
        z-index: 100;
    }
</style>