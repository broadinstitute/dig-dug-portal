<template>
    <div class="next-steps-container">
        <div v-for="(nextStep, nextStepIndex) in config" :key="nextStepIndex">
            <button class="btn btn-sm btn-outline-primary" @click="runNextStep(nextStep, nextStepIndex)">{{ nextStep['label'] }}</button>
            <research-loading-spinner :isLoading="loading" colorStyle="color"></research-loading-spinner>
        </div>
        <div class="workflow-message" v-if="workFlowMessage && typeof workFlowMessage == 'string'">
            <div class="alert alert-info" style="margin-top: 10px; display: inline-block;">{{ workFlowMessage }}</div>
        </div>
        <div class="workflow-message" v-if="workFlowMessage && typeof workFlowMessage == 'object'">
            <research-data-table
                :pageID="1"
                :dataset="workFlowMessage.data"
                :tableFormat="tableFormat"
                :initPerPageNumber="5"
                tableLegend=""
                :searchParameters="null" :pkgData="null" :pkgDataSelected="null"
                :phenotypeMap="null" :sectionId="1" :multiSectionPage="true" :starItems="null"
                :utils="utils" :region="null" :regionZoom="null"
                :regionViewArea="null" 
                :colors="null" :plotMargin="null">
            </research-data-table>
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import ResearchLoadingSpinner from "../ResearchLoadingSpinner.vue";
import ResearchDataTable from "@/components/researchPortal/ResearchDataTable.vue";

export default Vue.component("next-steps", {
    props: ["config", "utils", "data"],
    components: {
        ResearchLoadingSpinner
    },
    data() {
        return {
            loading: false,
            nextStepsData: {},
            totalSteps: 0,
            optionIndex: null,
            currentStep: null,
            workFlowMessage: null,
            tableFormat: null
        }
    },
    computed: {
    },
    watch: {
        currentStep(to, from) {

            let option = 'option'+this.optionIndex;
            let stepType = this.nextStepsData[option]['steps'][this.currentStep]['type'];

            switch(stepType) {
                case 'download data':
                    this.downloadData(this.config[this.optionIndex]['download config'], this.currentStep);
                    break;
                case 'merge data':
                    this.mergeData(this.config[this.optionIndex]['merge config'], this.currentStep);
                    break;
                case 'query llm':
                    this.queryLLM(this.config[this.optionIndex]['llm config'], this.currentStep);
                    break;
            }
        }
    },
    methods: {
        runNextStep(nextStep, nextStepIndex) {
            this.loading = true;
            
            this.totalSteps = nextStep['type'].length;
            this.optionIndex = nextStepIndex;

            const option = 'option'+nextStepIndex;
            this.nextStepsData[option] = {
                'label': nextStep['label']
            };

            this.nextStepsData[option]['steps'] = [];
            
            nextStep['type'].map(type => {
                this.nextStepsData[option]['steps'].push({
                    'type': type,
                    'complete': null,
                    'error': null,
                    'data': []
                })
            })

            this.currentStep = 0;

        },
        downloadData(CONFIG,STEP) {
            this.workFlowMessage = "Downloading data...";

            const dataUrl = CONFIG['datapoint'];
            const parameterField = CONFIG['parameter field'];
            const dataStorage = this.nextStepsData['option'+this.optionIndex]['steps'][STEP];

            this.data.map(async (item, itemIndex) => {
                let fetchUrl = dataUrl + item[parameterField];

                let contentJson = await fetch(fetchUrl).then((resp) => resp.json());

                if (contentJson.error == null && !!Array.isArray(contentJson.data) && contentJson.data.length > 0) {
                    let filteredData = contentJson.data;
                    if(CONFIG["data filter"]) {
                        filteredData = this.utils.filterUtils.applyFilters(CONFIG["data filter"], filteredData);
                    }
                    dataStorage.data.push(filteredData);

                    if(dataStorage.data.length == this.data.length) {
                        this.currentStep = (this.currentStep == this.totalSteps)? null : ++this.currentStep;
                        dataStorage.complete = true;
                    }
                } else {
                    // fetch failed 
                    dataStorage.error = true;
                    this.workFlowMessage = "Data fetch failed";
                    this.loading = false;
                }
            })
        },
        findArrayIntersection(arrays) {
                // Handle edge cases where no arrays or only one array is provided.
                if (arrays.length === 0) {
                    return [];
                }
                if (arrays.length === 1) {
                    // Convert to a Set and back to an array to handle duplicates.
                    return [...new Set(arrays[0])];
                }

                // Start with a Set of the elements from the first array.
                // Using a Set provides efficient O(1) lookups.
                let intersectionSet = new Set(arrays[0]);

                // Iterate over the rest of the arrays to find the common elements.
                for (let i = 1; i < arrays.length; i++) {
                    const currentArraySet = new Set(arrays[i]);

                    // Create a new Set to hold the updated intersection.
                    const nextIntersectionSet = new Set();
                    
                    // Iterate over the current intersection and add elements that also exist
                    // in the current array's Set.
                    for (const element of intersectionSet) {
                    if (currentArraySet.has(element)) {
                        nextIntersectionSet.add(element);
                    }
                    }
                    
                    // Update the intersection set for the next iteration.
                    intersectionSet = nextIntersectionSet;
                }

                // Convert the final Set back to an array and return it.
                return [...intersectionSet];
        },
        mergeData(CONFIG,STEP) {    
            this.workFlowMessage = "Merging data...";
            const DATA = this.nextStepsData['option'+this.optionIndex]['steps'][STEP-1]['data'];

            let stepData;

            CONFIG.map(config => {
                switch(config.type) {
                    case 'find overlap':
                        let arrays = []
                        DATA.map(data => {
                            arrays.push(data.map(item => item[config.field]))
                        })
                        stepData = this.findArrayIntersection(arrays);
                        break;
                }
            })

            if(stepData.length == 0) {
                this.loading = false;
                this.workFlowMessage = "No overlap found";
                return;
            } else {
                this.nextStepsData['option'+this.optionIndex]['steps'][STEP]['data'] = stepData;
                this.currentStep ++;
            }
        },
        async queryLLM(CONFIG,STEP) {
            
            const stepData = this.nextStepsData['option'+this.optionIndex]['steps'][STEP-1]['data'];

            if(stepData.length >= 50) {
                this.workFlowMessage = `${stepData.length} items found. Analyzing data with AI for the top 50 items...`;
                stepData = stepData.slice(0, 50);
            } else {
                this.workFlowMessage = `${stepData.length} items found. Analyzing data with AI...`;
            }
            
            const PROMPT = CONFIG['prompt'] + stepData.join(", ");
            const SYSTEM_PROMPT = "Your entire response must be a single, raw JSON object and nothing else. Do not include '''json markdown tags, explanations, or any text whatsoever before the opening { or after the closing '}. Use this exact JSON structure:"+JSON.stringify(CONFIG['response json']);//CONFIG['system prompt'];
            const MODEL = CONFIG['model'];//CONFIG['model'];

            const result = await this.utils.llmUtils.queryLLMSimple(
                PROMPT,
                SYSTEM_PROMPT,
                MODEL,
                'https://llm.hugeamp.org/gemini'
            );

            if (result.success) {
                this.workFlowMessage = this.utils.dataConvert.extractJson(result.data);
                this.tableFormat = {"top rows": Object.keys(this.workFlowMessage.data[0])};
                 this.loading = false;
            } else {
                this.workFlowMessage = `Error: Failed to process LLM request. ${result.error}`;
                this.loading = false;
            }
        }
    }
}); 
</script>
<style scoped>
</style>