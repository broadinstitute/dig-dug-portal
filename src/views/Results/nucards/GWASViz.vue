<template>
        <div class="list-group-item">
            <template>
                <!-- <h3>Data Table Name</h3> -->
                <h3>GWAS Plot</h3>
            </template>
            <template>
                <!-- TODO: check against these, make dynamic -->
                <b>Input Types </b>
                <div class="bioindex-concept-pellet phenotype">
                    Phenotype
                </div>
                <div class="bioindex-concept-pellet gene">
                    Gene/Region
                </div>
                <!-- <div class="bioindex-concept-pellet phenotype">
                    Phenotype
                </div>
                <div class="bioindex-concept-pellet gene">
                    Gene/Region
                </div> -->
            </template>
            <template>
                <!-- TODO: check against these, make dynamic -->
                <b>Output Types </b>
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
                    <locuszoom-gwas-wrapper
                        :phenotype="filler.phenotype"
                        :locus="filler.locus"
                    ></locuszoom-gwas-wrapper>
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
                        :group="{ name:'cards',
                                  put: ['data', 'viz']  // NOTE: these are constants shared on the main page!
                                }"
                        :list="nulllist"
                        @add="log"
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
import GWASLocusZoomWrapper from "../components/GWASLocusZoomWrapper"

export default Vue.component('locuszoom-gwas-plot-card', {
    props: ['metadata'],
    components: {
        draggable,
        GWASLocusZoomWrapper,
    },
    data() {
        return {
            nulllist: [],  // necessary evil
            filler: null
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
        log: function(evt) {
          window.console.log('log', evt);
        },
        fill(event) {
            const { added } = event;
            const i = added.element.name.split(';');
            const [_, prefix, value] = i;

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
            return !!this.filler && !!this.filler.locus && !!this.filler.phenotype;
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
