<template>
        <div class="list-group-item">
            <template>
                <div class="bioindex-concept-pellet none">
                    Variant
                </div>
                <h5 style="display:inline;margin-right:10px;">→</h5>
                <div class="bioindex-concept-pellet phenotype">
                    Phenotype
                </div>

                <div style="display:block;float:right;">
                    <button :disabled="!!!filler" @click="filler = null; submitted = false;">Clear</button>&nbsp;
                    <!-- TODO: refactor to dropdown menu with duplicate card OR duplicate content -->
                    <button @click="$emit('duplicate-self', { metadata, filler })">Duplicate</button>&nbsp;
                    <button @click="$emit('remove', { metadata, filler })">Remove</button>
                </div>
            </template>

            <template>
                <draggable
                    class="dragArea list-group"
                    :list="dragList"
                    :group="{ name: 'data', pull: 'clone', put: false }"
                    :clone="el => dragPayload">
                    <div class="list-group-item"
                        style="margin-bottom:10px;"
                        v-for="(element) in dragList" :key="element.id">
                        <h3 style="display:inline;">PheWAS Plot</h3>&nbsp;
                        <h4 v-if="filler" style="display:inline;">{{filler}}</h4>
                    </div>
                </draggable>
            </template>

            <div v-if="submitted">
                <template v-if="filler">
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

                            <label for="card-input-varId">
                                Variant
                            </label>&nbsp;
                            <input id="card-input-varId"
                                :value="!!filler && !!filler.varId ? filler.varId : ''"
                                @input="change($event, 'varId')"/><br>

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
import idCounter from "@/utils/idCounter";

export default Vue.component('locuszoom-phewas-plot-card', {
    props: ['metadata'],
    components: {
        draggable
    },
    data() {
        return {
            nulllist: [],  // necessary evil
            dragList: [{ id: idCounter.getUniqueId(), name: '' }], // another seemingly necessary evil
            filler: null,
            submitted: false,
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

            if (!!added) {
                this.filler = this.filler || {};

                const [source, query] = added.element.name.split(';');
                query.split('|').forEach(queryEl => {

                    const [prefix, value] = queryEl.split(',');

                    if(prefix === 'varId' || prefix === 'variant' ) {
                        this.filler = {
                            ...this.filler,
                            varId: value,
                        };
                    }

                });
                this.$forceUpdate();

                // submit if last fill left us completely successful (gets rid of an extra step)
                if (!!this.filler.varId) {
                    this.submitted = true;
                }

            }
        }
    },
    computed: {
        full() {
            return !!this.filler && !!this.filler.varId;
        },
        dragName() {
            return !!this.filler ? `${'locuszoom-phewas-plot'};varId,${this.filler.varId}` : ``;
        },
        dragPayload() {
            return {
                id: idCounter.getUniqueId(),
                name: this.dragName,
            }
        },
    },
})
</script>
<style scoped>

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

