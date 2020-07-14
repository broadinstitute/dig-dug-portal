<template>
    <div class="results-link-wrapper" >
        <a class="results-link">
            <slot>
                {{ inputValue }}
            </slot>
            <div class="options-4-actions">
                <div v-for="bioIndexSchema in basicIndexes" :key="bioIndexSchema.index">
                    <a @click="dispatchToIndex(bioIndexSchema.index, inputValue)">
                        {{ bioIndexSchema.index }} {{ inputValue }}
                    </a>
                </div>
                <div v-if="showCompoundIndexes">
                    <div v-for="bioIndexSchema in compoundIndexes" :key="bioIndexSchema.index">
                        <a @click="dispatchToIndex(bioIndexSchema.index, inputValue, true)">
                            {{ bioIndexSchema.index }}
                            <input v-for="bioIndexQueryKey in bioIndexSchema.query.keys"
                                :key="bioIndexQueryKey"
                                :value="queryKey === bioIndexQueryKey ? inputValue : ''"
                                :placeholder="bioIndexSchema.query.keys"
                                :disabled="queryKey === bioIndexQueryKey"/>
                            <input  v-if="bioIndexSchema.query.locus"
                                    :value="queryKey === 'regions' || queryKey === 'genes' ? inputValue : ''"
                                    disabled/>
                        </a>
                    </div>
                </div>

            </div>
        </a>
    </div>
</template>
<script>
import Vue from 'vue'
import { basicIndexesForKey, compoundIndexesForKey, } from "../utils/resultsUtils"
import { query } from "@/utils/bioIndexUtils"
export default Vue.component("results-nav", {
    props: ["queryKey", "inputValue", "showCompoundIndexes"],
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
        async dispatchToIndex(index, queryString, isCompound=false) {
            console.log("querying bioindex", index, queryString);
            if (!isCompound) {
                // const response = await query(index, queryString, { limit: null });
                this.$emit("pushQuery", { index, queryString });
            } else {
                console.log("TODO: Handle compound indecies here");
            }
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
    top: -14px;
    left: 20%;
    font-weight: 400;
    padding: 10px;
    border-radius: 5px;
    z-index: 20;
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
