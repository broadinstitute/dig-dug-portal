<template>
    <div>
        <multiselect
            v-model="cardList"
            :options="options">
        </multiselect>
        or<br>
        <draggable
            class="dragArea list-group"
            :group="{
                    name:'cards',
                    put: ['data', 'viz', 'dash']  // NOTE: these are constants shared on the main page!
                }"
            :list="nulllist"
            @change="fill">
            <div
                slot="header"
                class="btn-group list-group-item"
                role="group"
                aria-label="Basic example">
                Drag in cards for {{operation}}
            </div>
        </draggable>
        <button>Do the {{operation}}</button>
    </div>
</template>
<script>
import Vue from "vue";
import _ from "lodash";
import draggable from "vuedraggable";

const ops = {
    'intersection': _.intersection,
    'union': _.union,
    'symmetric-difference': _.xor,
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
        fill(event) {
            console.log('adding to set operation list')
            this.cardList = this.cardList.concat(event.added.element);
        }
    }
})
</script>
