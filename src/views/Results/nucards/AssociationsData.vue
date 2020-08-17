<template>
        <div class="list-group-item">
            <template>
                <div class="bioindex-concept-pellet phenotype">
                    Phenotype
                </div>
                <div class="bioindex-concept-pellet locus">
                    Gene/Region
                </div>
                <h5 style="display:inline;margin-right:10px;">→</h5>
                <div class="bioindex-concept-pellet none">
                    Variant
                </div>
                <div style="display:block;float:right;">
                    <button :disabled="!!!filler" @click="filler = null">Clear</button>&nbsp;
                    <!-- TODO: refactor to dropdown menu with duplicate card OR duplicate content -->
                    <button @click="$emit('duplicate-self', { metadata, filler })">Duplicate</button>&nbsp;
                    <button @click="$emit('remove', { metadata, filler })">Remove</button>
                </div>
            </template>

            <template>
                <draggable
                    class="dragArea list-group"
                    :group="{
                        name: 'dash-header',
                        pull: 'clone',
                    }"
                    :list="[dragPayload]">
                    <template slot="header">
                        <div class="list-group-item" style="margin-bottom:10px;" v-for="(element) in [dragPayload]" :key="element.id">
                            <h3 style="display:inline;">Associations</h3>&nbsp;
                            <h5 style="display:inline;" v-if="full" class="card-title">
                                {{!!filler ? JSON.stringify(filler): ''}}
                            </h5>
                        </div>
                    </template>
                </draggable>
            </template>

            <div v-if="submitted">
                <template v-if="filler">
                    <associations-table-wrapper
                        :locus="filler.locus"
                        :phenotype="filler.phenotype"
                        :phenotypeMap="$store.state.bioPortal.phenotypeMap"
                    ></associations-table-wrapper>
                </template>
            </div>

            <div v-else-if="!submitted">
                <!-- TODO -->
                <template>
                    <draggable
                        class="dragArea list-group"
                        :group="{
                            name:'cards',
                            put: ['data', 'dash-header']  // NOTE: these are constants shared on the main page!
                        }"
                        :list="nulllist"
                        @change="fill">

                        <div slot="header" class="btn-group list-group-item">
                            <em>Fill these inputs, or drag cards in from the sidebar or dashboard.</em><br>

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

                            <button :disabled="!full" @click="submitted = true">Fill Card</button>

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
    props: ['phenotype', 'locus', 'metadata', 'defaultSubmitted'],
    components: {
        draggable,
        AssociationsTableWrapper
    },
    data() {
        return {
            filler: null,
            nulllist: [],  // necessary evil
            submitted: false,  // flag that lets us defer/semaphore when the table ought be rendered (versus always rendering it on any possible combination of strings filling the table, even when user is not finished typing)
        }
    },
    created() {
        if (!!this.phenotype && !!this.locus) {
            // filler should be null before this point
            this.filler = {};
            this.filler = {
                phenotype: this.phenotype,
                locus: this.locus,
            }
            this.submitted = this.defaultSubmitted || true;
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
            return !!this.filler ? `${'associations'};phenotype,${this.filler.phenotype}|locus,${this.filler.locus}` : ``;
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
