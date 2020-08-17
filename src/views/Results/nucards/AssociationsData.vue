<template>
        <div class="list-group-item">

            <template>
                <!-- <h3>Data Table Name</h3> -->
                <draggable
                    class="dragArea list-group"
                    :group="{
                        name: 'dash',
                        pull: 'clone',
                    }"
                    :list="[dragPayload]">
                    <!-- <div slot="header">
                        <h3>Associations</h3>
                    </div> -->
                    <div class="list-group-item" v-for="(element) in [dragPayload]" :key="element.id">
                        {{element.name}}
                    </div>
                </draggable>

            </template>

            <template>
                <b>Input Types </b>
                <div class="bioindex-concept-pellet phenotype">
                    Phenotype
                </div>
                <div class="bioindex-concept-pellet locus">
                    Gene/Region
                </div>
            </template>
            <template>
                <b>Output Type </b>
                <div class="bioindex-concept-pellet none">
                    Variant
                </div>
            </template>

            <button :disabled="!!!filler" @click="filler = null">Clear</button>&nbsp;
            <!-- TODO: refactor to dropdown menu with duplicate card OR duplicate content -->
            <button @click="$emit('duplicate-self', { metadata, filler })">Duplicate</button>&nbsp;
            <button @click="$emit('remove', { metadata, filler })">Remove</button>
            <br>

            <div v-if="full">
                <template>
                    <h4 class="card-title">
                        {{filler}}
                    </h4>
                    <associations-table-wrapper
                        :locus="filler.locus"
                        :phenotype="filler.phenotype"
                        :phenotypeMap="$store.state.bioPortal.phenotypeMap"
                    ></associations-table-wrapper>
                </template>
            </div>

            <div v-else-if="!full">
                <!-- TODO -->
                <template>
                    <em>Drag in Inputs, or fill in Inputs with valid elements from context or collection</em>
                    <div>

                        <label for="card-input-phenotype">
                            Phenotype
                        </label>&nbsp;
                        <input id="card-input-phenotype"
                            :value="!!filler && !!filler.phenotype ? filler.phenotype : ''"
                            @input="change($event, 'phenotype')"/><br>

                        <label for="card-input-locus">
                            Gene/Region
                        </label>&nbsp;
                        <input id="card-input-locus"
                            :value="!!filler && !!filler.locus ? filler.locus : ''"
                            @input="change($event, 'locus')"/><br>

                    </div>
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
import AssociationsTableWrapper from "../components/AssociationsTableWrapper.vue"
import idCounter from "@/utils/idCounter";

export default Vue.component('associations-card', {
    props: ['phenotype', 'locus', 'metadata'],
    components: {
        draggable,
        AssociationsTableWrapper
    },
    data() {
        return {
            filler: null,
            nulllist: [],  // necessary evil
        }
    },
    created() {
        this.filler = this.filler || {};
        if (!!this.phenotype) {
            // filler should be null before this point
            this.filler = {
                phenotype: this.phenotype,
                locus: this.locus,
            }
        }
    },
    methods: {
        change($event, property) {
            this.filler = this.filler || {};
            this.filler = {
                ...this.filler,
                [property]: $event.target.value,
            };
            this.$forceUpdate();
        },
        fill(event) {
            const { added } = event;
            const i = added.element.name.split(';');
            const [_, prefix, value] = i;

            // TODO: pattern matching core
            // typecheck
                // apply if pass
                // bounce if fail
            if (!!added) {
                this.filler = this.filler || {};
                if(prefix === 'phenotype') {
                    this.filler = {
                        ...this.filler,
                        phenotype: value,
                    };
                }
                if(prefix === 'gene' || prefix === 'region' || prefix === 'locus') {
                    this.filler = {
                        ...this.filler,
                        locus: value,
                    };
                }
                this.$forceUpdate();
            }

        }
    },
    computed: {
        full() {
            return !!this.filler && !!this.filler.phenotype && !!this.filler.locus;
        },
        dragName() {
            return `${'associations'};phenotype;${this.filler.phenotype}`
        },
        dragPayload() {
            return {
                id: idCounter.getUniqueId(),
                name: this.dragName,
                someGuddamData: 'data',
            }
        }
    },
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

.bioindex-concept-pellet.locus {
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
