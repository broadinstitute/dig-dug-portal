<template>
        <div class="list-group-item">
            <template>
                <!-- <h3>Data Table Name</h3> -->
                <h3>Filling Tester</h3>
            </template>

            <template>
                <b>Input Types </b>
                <div class="bioindex-concept-pellet none">
                    Variant
                </div>
                <div class="bioindex-concept-pellet phenotype">
                    Phenotype
                </div>
                <div class="bioindex-concept-pellet gene">
                    Gene/Region
                </div>
            </template>

            <template>
                <b>Output Type </b>
                <div class="bioindex-concept-pellet none">
                    Variant
                </div>
                <div class="bioindex-concept-pellet phenotype">
                    Phenotype
                </div>
                <div class="bioindex-concept-pellet gene">
                    Gene/Region
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
                        Filled with {{filler}}
                      </h4>
                </template>
            </div>

            <div v-else-if="!full">
                <!-- TODO -->
                <template>
                    <em>Drag in Inputs, or fill in Inputs with valid elements from context or collection</em>
                    <div>
                        <!-- TODO: abstract the -<label> and .<label> -->
                        <!-- TODO: abstract the :value conditional to method ao computed property-->
                        <label for="card-input-variant">
                            Variant
                        </label>&nbsp;
                        <input id="card-input-variant"
                            :value="!!filler && !!filler.varId ? filler.varId : ''"
                            @input="change($event.target.value, 'varId')"/><br>

                        <label for="card-input-phenotype">
                            Phenotype
                        </label>&nbsp;
                        <input id="card-input-phenotype"
                            :value="!!filler && !!filler.phenotype ? filler.phenotype : ''"
                            @input="change($event.target.value, 'phenotype')"/><br>

                        <label for="card-input-locus">
                            Gene/Region
                        </label>&nbsp;
                        <input id="card-input-locus"
                            :value="!!filler && !!filler.locus ? filler.locus : ''"
                            @input="change($event.target.value, 'locus')"/><br>

                    </div>

                    <draggable
                        class="dragArea list-group"
                        :group="{
                            name:'cards',
                            put: ['data', 'viz']  // NOTE: these are constants shared on the main page!
                        }"
                        :list="nulllist"
                        @add="add"
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
import PhenotypeAssociationsTableWrapper from "../components/PhenotypeAssociationsTableWrapper";
import _ from "lodash";

export default Vue.component('fill-tester', {
    props: ['locus', 'phenotype', 'varId', 'metadata'],
    components: {
        draggable,
        PhenotypeAssociationsTableWrapper
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
                phenotype: this.phenotype,
                locus: this.locus,
            }
        }
    },
    methods: {
        change(value, property) {
            this.filler = this.filler || {};
            this.filler = {
                ...this.filler,
                [property]: value,
            };
            this.$forceUpdate();
        },
        fill(event) {

            const { added } = event;
            const i = added.element.name.split(';');
            const [_, prefix, value] = i;

            // TODO: typecheck/propcheck method
                // apply if pass
                // bounce if fail
            if (!!added) {
                this.filler = this.filler || {};
                if(prefix === 'varId' || prefix === 'variant') {
                    this.filler = {
                        ...this.filler,
                        varId: value,
                    };
                }
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
            return !!this.filler && !!this.filler.locus && !!this.filler.varId && !!this.filler.phenotype;
        }
    },
    watch: {
        full(nf) {
            console.log('new full', nf, this.filler)
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
