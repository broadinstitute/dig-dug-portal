<template>
    <div>
        {{operation}}
        <multiselect
            v-model="cardList"
            :multiple="true"
            :options="options">
        </multiselect>
        or<br>
        <draggable
            class="dragArea list-group"
            :group="{
                    name:'cards',
                    put: ['dash-header', 'data']  // NOTE: these are constants shared on the main page!
                }"
            :list="nulllist"
            @change="fill">
            <div
                slot="header"
                class="btn-group list-group-item"
                role="group"
                aria-label="Basic example">
                Drag in cards
            </div>
        </draggable>
        <button @click="doOp">Do the {{operation}}</button>
    </div>
</template>
<script>
import Vue from "vue";
import _ from "lodash";
import draggable from "vuedraggable";
import store from "../store"

const operations = {
    'intersection': _.intersectionWith,
    'union': _.unionWith,
    'symmetric-difference': _.xorWith,
}

export default Vue.component('set-operation', {
    props: ["operation", "options"],
    components: {
        draggable,
    },
    data() {
        return {
            cardList: [],
            nulllist: [],
        }
    },
    methods: {
        doOp() {
            // get data from store that matches the set options in this.cardList
            const results = this.cardList.map(selectedCard => {
                const cardResults = store.state.resultsContext[selectedCard.name];
                return cardResults;
            })
            // const operationResult = operations[this.operation](results, _.isMatch);
            // console.log(operations[this.operation](...[[1, 2], [2, 3, 4]], _.isEqual))
            // TODO: how to generalize this code to use any given ID?
            const operationResult = operations[this.operation](...results, 'varId');
            console.log(operationResult)
            return operationResult;
        },
        fill(event) {
            console.log('adding to set operation list')
            this.cardList = this.cardList.concat(event.added.element);
        }
    }
})
</script>
