<template>
    <div>
        <b-col>
            <input type="checkbox" @change="toggleAll(itemsInput, $event.target.checked)"> toggle all
            <div v-for="field in fields" :key="field+'input'">
                <input type="checkbox" v-model="itemsInput[field]"> {{field}}
            </div>
        </b-col>
        <b-col>
            <b-tabs>
                <b-tab v-for="taggedEntry in taggedEntries" :key="taggedEntry[0]" :title="taggedEntry[0]">
                    <div v-if="itemsInput[taggedEntry[0]]">
                        <div v-if="!Array.isArray(taggedEntry[1])">
                            {{knowledgeItem[taggedEntry[0]]}}
                        </div>
                        <div v-else>
                            <div v-for="subTag in taggedEntry[1]" :key="subTag[0]">
                                <!-- {{subTag[0]}} {{subTag[1]}} {{knowledgeItem[taggedEntry[0]][subTag[0]]}} -->
                                <b-table :items="knowledgeItem[taggedEntry[0]][subTag[0]]"
                                ></b-table>
                            </div>
                        </div>
                    </div>
                </b-tab>
            </b-tabs>
        </b-col>
    </div>
</template>
<script>
import Vue from "vue";

function tagEntry(entry) {
    let right = typeof entry[1];
    let tmp = null;
    switch(right) {
        case "object":
            if (Array.isArray(entry[1])) {
                tmp = 'array';
            } else {
                tmp = tagEntries(entry[1]);
            }
            break;
        default: tmp = right; break;
    }
    return [entry[0], tmp];
}
function tagEntries(object) {
    return Object.entries(object).map(tagEntry)
}

export default Vue.component('field-nav', {
    props: ["knowledgeItem", "withFields", "withoutFields"],
    computed: {
        itemsInput() {
            return this.fields.reduce((acc, item) => { acc[item] = false; return acc; }, {})
        },
        fields() {
            return Object.entries(this.filterObject).flatMap(entry => entry[0]);
        },
        filterObject() {
            return Object.fromEntries(Object.entries(this.knowledgeItem)
                        .filter(entry => this.withFields.includes(entry[0])))
        },
        taggedEntries() {
            return tagEntries(this.filterObject);
        }
    },
    methods: {
        toggleAll(input, checked) {
            for (let key in input) {
                if (typeof input[key] === "boolean") {
                    input[key] = checked
                }
            }
        }
    }
})
</script>
