<template>
        <div class="list-group-item">
            <template>
                <!-- <h3>Data Table Name</h3> -->
                <h3>PheWAS Plot</h3>
            </template>
            <template>
                <!-- TODO: check against these, make dynamic -->
                <b>Input Types </b>
                <div class="bioindex-concept-pellet none">
                    Variant
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
                <div class="bioindex-concept-pellet phenotype">
                    Phenotype
                </div>
                <div class="bioindex-concept-pellet gene">
                    Gene/Region
                </div>
            </template>
            <br>
            <div v-if="filler">
                <template>
                    <div v-if="!!$store.state.bioPortal.phenotypeMap">
                        <locuszoom
                            ref="locuszoom"
                            :chr="$store.state.chr"
                            :start="$store.state.start"
                            :end="$store.state.end"
                            :refSeq="false">
                            <lz-phewas-panel
                                :varId="filler.varId"
                                :phenotypeMap="$store.state.bioPortal.phenotypeMap"
                            ></lz-phewas-panel>
                        </locuszoom>
                    </div>
                </template>
            </div>
            <div v-else-if="!filler">
                <!-- TODO -->
                <template>
                    <em>Drag in Inputs, or fill in Inputs with valid elements from context or collection</em>
                    <div>
                        <label for="card-input-phenotype">
                            Phenotype
                        </label>&nbsp;
                        <input id="card-input-phenotype"/>&nbsp;
                        <label for="card-input-gene">
                            Gene
                        </label>&nbsp;
                        <input id="card-input-gene"/>
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

export default Vue.component('locuszoom-phewas-plot-card', {
    components: {
        draggable
    },
    data() {
        return {
            nulllist: [],  // necessary evil
            filler: null
        }
    },
    methods: {
        log: function(evt) {
          window.console.log('log', evt);
        },
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
