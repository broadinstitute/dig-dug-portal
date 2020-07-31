<template>
    <div class="results-link-wrapper" >
        <!-- abstract these links into their own component (as a content) -->
        <div v-for="bioIndexSchema in basicIndexes" :key="bioIndexSchema.index">
            <a @click="dispatchToIndex(bioIndexSchema.index, inputValue)">
                {{ bioIndexSchema.index }} {{ inputValue }}
            </a>
        </div>
        <div v-if="showCompoundIndexes">

            <div v-for="(bioIndexSchema, i) in compoundIndexes" :key="bioIndexSchema.index">
                <a @click="dispatchToIndex(bioIndexSchema.index, makeCompoundInputValue(bioIndexSchema, i), true)">
                    {{ bioIndexSchema.index }}
                </a>
                <!-- Dynamic v-model symbols within v-for: https://stackoverflow.com/a/49902508/1991892 -->
                <!-- Replace v-model with v-bind:value and v-on:input since we wouldn't be able to assign an initial value
                        for the input if the reference was also defined here https://stackoverflow.com/a/55023171/1991892 -->
                <!-- Initialize a default value with v-on:click.once -->
                <input v-for="bioIndexQueryKey in bioIndexSchema.query.keys"
                    :key="bioIndexQueryKey"
                    :placeholder="bioIndexSchema.query.keys"
                    v-model="inputs[[bioIndexSchema.index,bioIndexQueryKey,i].join('-')]"
                    :disabled="queryKey === bioIndexQueryKey"/>
                <!-- TODO: refactor the gnarly code in :value to use a custom directive that can set a default, to initialize the field -->
                <input  v-if="bioIndexSchema.query.locus"
                        :value="inputs[[bioIndexSchema.index,'locus',i].join('-')] ? inputs[[bioIndexSchema.index,'locus',i].join('-')]
                            : (() => { inputs[[bioIndexSchema.index,'locus',i].join('-')] = inputValue; return inputs[[bioIndexSchema.index,'locus',i].join('-')]})()"
                        @input="inputs[[bioIndexSchema.index,'locus',i].join('-')] = $event.target.value"
                        disabled/>
            </div>
            
        </div>
    </div>
</template>
<script>
import Vue from 'vue'
import { basicIndexesForKey, compoundIndexesForKey, } from "../utils/resultsUtils"
import { query } from "@/utils/bioIndexUtils"
export default Vue.component("results-nav", {
    props: ["queryKey", "inputValue", "showCompoundIndexes"],
    data() {
        return {
            inputs: {}
        }
    },
    computed: {
        // compatibleIndexes: function() {
        //     return compatibleIndexesForKey(this.queryKey)
        // },
        basicIndexes: function() {
            return basicIndexesForKey(this.queryKey)
        },
        compoundIndexes: function() {
            return compoundIndexesForKey(this.queryKey)
        }
    },
    methods: {
        tap() {
            console.log('ResultsNav tap', arguments)
        },
        async dispatchToIndex(index, queryString, isCompound=false) {
            this.$emit("pushQuery", { index, queryString });
        },
        makeCompoundInputValue(bioIndexSchema, i) {
            // get all the data that was assigned to bioIndexSchema-i-<*>, where * is the queryKeys satisfied in the schema
            let queryStringVals = []
            bioIndexSchema.query.keys.forEach(bioIndexQueryKey => {
                const key = [bioIndexSchema.index,bioIndexQueryKey,i].join('-');
                queryStringVals.push(this.inputs[key]);
            });
            if (bioIndexSchema.query.locus) {
                const key = [bioIndexSchema.index,'locus',i].join('-');
                queryStringVals.push(this.inputs[key]);
            }
            const queryString = queryStringVals.join();
            return queryString;
        }
    }
})
</script>
<style scoped>

.results-link-wrapper {
    margin-top: 5px;
    font-size: 14px;
}

.results-link {
    display: block;
    position: relative;
    background-repeat: no-repeat;
}

.results-link:hover {
    background-color: #ddd;
}

.results-link > .options-4-actions {
    display: none;
    position: absolute;
    background-color: #000000;
    color:#fff;
    font-size: 14px;
    top: -100%;
    /* left: 100%; */
    font-weight: 400;
    padding: 10px;
    border-radius: 5px;
    z-index: 20 !important;
    line-height: 1.5em;
}

.results-link:hover > .options-4-actions {
    display: block;
}

.results-link > .options-4-actions a {
    color:#fff !important;
    white-space: nowrap;
}

.results-link > .options-4-actions a:hover {
    color:#aaaaff !important;
}

.results-link:hover > .options-4-actions {
    display: block;
}

.results-link:hover > .options-4-actions > div:hover  {
    color: #aaaaff;
}
</style>
