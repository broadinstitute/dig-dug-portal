<template>
    <div class="multi-options-search-ui">
        <div class="type">
            <select id="parameter_type" v-model="parameterFocused">
                <option value="">{{ 'Set parameter' }}</option>
                <option v-for="item in searchParameters"
                    :value="item.parameter" >{{ item.label }}
                </option>
            </select>
        </div>
        <div class="input">
            <input class="form-control" @keyup="(parameterFocused != '')?getValue($event):''" />
            <div>
                <template v-for="option in listOptions">
                    <a href="javascript:;" v-html="option.label"
                        @click="parent.setListValue(
                        option.value,
                        parameterFocused,
                        paramIndex,
                        true
                    )
                        " class="custom-select-a-option"></a>
                </template>
            </div>
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";


export default Vue.component("research-multi-search", {
	props: ["sectionsConfig","paramIndex","parent","utils"],
	components: {
	},
	data() {
		return {
            parameterFocused: '',
            listOptions:[],
            searchParameters: [
                {
                "type":"input",
                "parameter":"gene",
                "label":"Gene",
                "values":"kp genes"
                },
                {
                "type":"input",
                "parameter":"phenotype",
                "label":"Phenotype",
                "values":"kp phenotypes"
                }
            ]
		};
	},
	modules: {
	},
	mounted: function () {

	},
    methods: {
		getValue(EVENT) {
            const paramType = this.parameterFocused;
            let paramValue = (paramType == 'all')? 'all' : this.searchParameters.filter(i => i.parameter == paramType)[0].values;

            switch(paramValue) {
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
            }
        },
        getListOptions(EVENT,PARAM,LIST) {
            let options = [];
			if (EVENT.target.value.length >= 2) {
				//let optionChrLength = 0;
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
    .multi-options-search-ui > div {
        display:inline-flex;
    }

    .multi-options-search-ui > div > select, .multi-options-search-ui > div > input{
        /*border: none; */
    }

    .multi-options-search-ui > div.type > select {
        border-radius: 5px 0 0 5px;
        border: solid 1px #aaaaaa;
        width: auto;
        background-color: #ffffff;
        padding: 0 0 0 5px;
    }

    .multi-options-search-ui > div.input > input {
        border-radius: 0 5px 5px 0;
        border: solid 1px #aaaaaa;
        width: auto;
        background-color: #ffffff;
        padding: 0 15px 0;
        border-left: none;
    }
</style>