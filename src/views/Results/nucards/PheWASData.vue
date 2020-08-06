<template>
        <div class="list-group-item">
            <template>
                <!-- <h3>Data Table Name</h3> -->
                <h3>Variant Associations</h3>
            </template>
            <template>
                <b>Input Types </b>
                <div class="bioindex-concept-pellet none">
                    Variant
                </div>
            </template>
            <template>
                <b>Output Type </b>
                <div class="bioindex-concept-pellet phenotype">
                    Phenotype
                </div>
                <div class="bioindex-concept-pellet gene">
                    Gene/Region
                </div>
            </template>
            <button :disabled="!!!filler" @click="filler = null">Clear</button>
            <br>

            <div v-if="filler">
                <template>
                    <h4 class="card-title">
                        {{filler.varId}}
                        <!-- <span v-if="$parent.dbSNP">
                            <span style="color: gray">/</span>
                            {{$parent.dbSNP}}
                        </span>
                        associations
                        <tooltip-documentation
                            name="variant.assoc.tooltip"
                            :content-fill="$parent.documentationMap"
                            :isHover="true"
                            :noIcon="false"
                        ></tooltip-documentation> -->
                    </h4>
                    <phewas-table-wrapper
                        :varId="filler.varId"
                        :phenotypeMap="$store.state.bioPortal.phenotypeMap"
                    ></phewas-table-wrapper>
                </template>
            </div>

            <div v-else-if="!filler">
                <!-- TODO -->
                <template>
                    <em>Drag in Inputs, or fill in Inputs with valid elements from context or collection</em>
                    <div>
                        <label for="card-input-variant">
                            Variant
                        </label>&nbsp;
                        <input id="card-input-variant"/>&nbsp;
                    </div>
                    <draggable
                        class="dragArea list-group"
                        :group="{
                            name:'cards',
                            put: ['data', 'viz']  // NOTE: these are constants shared on the main page!
                        }"
                        :list="nulllist"
                        @change="fill">
                        <div
                            slot="header"
                            class="btn-group list-group-item"
                            role="group"
                            aria-label="Basic example">
                            Drag Here
                        </div>
                    </draggable>
                </template>
            </div>

        </div>
</template>
<script>
import Vue from "vue"
import draggable from "vuedraggable";

export default Vue.component('phewas-associations-card', {
    props: ['varId'],
    components: {
        draggable
    },
    data() {
        return {
            filler: null,
            nulllist: []  // necessary evil
        }
    },
    created() {
        if (!!this.varId) {
            // filler should be null before this point
            this.filler = {
                varId: this.varId,
            }
        }
    },
    methods: {
        fill(event) {
            console.log('fill', event, arguments)
            const { added } = event;
            const i = added.element.name.split(';');
            const [_, prefix, value] = i;
            if (!!added && prefix === 'varId') {
                this.filler = {
                    [prefix]: value,
                };
            }
            // typecheck
                // apply if pass
                // bounce if fail
        }
    }
})
</script>
<style>

.bioindex-concept-pellet {
    cursor: pointer;
    display: inline-block;
    margin: 0px 10px 10px 0;
    padding: 2px 20px;
    -webkit-border-radius: 3px;
    -moz-border-radius: 3px;
    border-radius: 3px;
    font-size: 13px;
}

.bioindex-concept-pellet.phenotype {
    background-color: #a0d7ff;
    border: solid 1px #30b7f6;
}

.bioindex-concept-pellet.gene {
    background-color: #b7eab7;
    border: solid 1px #72ce49;
}

.bioindex-concept-pellet.antisense {
    background-color: #b7eab7;
    border: solid 1px #72ce49;
}


.bioindex-concept-pellet.none {
    background-color: #eee;
    border: solid 1px #ccc;
}

</style>
