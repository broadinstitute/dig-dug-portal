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
                        <h3 style="display:inline;">Combine Associations</h3>&nbsp;
                    </div>
                </draggable>
            </template>

            <div v-if="submitted">
                <template v-if="phenotypes.length > 0">
                    <associations-table-wrapper
                        :locus="filler.locus"
                        :overlappingPhenotypes="phenotypes"
                        :phenotypeMap="$store.state.bioPortal.phenotypeMap"
                        @broadcast="$emit('broadcast', { key: dragPayload, data: $event })"
                    ></associations-table-wrapper>
                </template>
            </div>

            <div v-else-if="!submitted">
                <!-- TODO -->
                <template>
                    <multiselect
                        v-model="cardList"
                        :multiple="true"
                        track-by="name"
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
                        @change="fillCard">
                        <div
                            slot="header"
                            class="btn-group list-group-item"
                            role="group"
                            aria-label="Basic example">
                            Drag in cards
                        </div>
                    </draggable>
                    <button @click="mergeCards">Merge Cards</button>
                </template>
            </div>

        </div>
</template>

<script>
import Vue from "vue"
import draggable from "vuedraggable";
import AssociationsTableWrapper from "../components/AssociationsTableWrapper.vue"
import idCounter from "@/utils/idCounter";
import { isArray, isString } from "lodash";

export default Vue.component('associations-merge-data-card', {
    props: ['phenotype', 'locus', 'options', 'metadata', 'defaultSubmitted'],
    components: {
        draggable,
        AssociationsTableWrapper
    },
    data() {
        return {
            phenotypes: [], // force the hand here
            cardList: [],
            filler: null,
            nulllist: [],  // necessary evil
            dragList: [{ id: idCounter.getUniqueId(), name: '' }], // another seemingly necessary evil
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
        nameFormatter(element) {
            return element.name;
        },
        fillCard(event) {
            console.log('event', event)
            if (event.added.element.name.match(/phewas-associations;/g)) {
                this.cardList = this.cardList.concat(event.added.element);
            }
        },
        mergeCards() {
            if (this.cardList.length > 0) {
                // mine the cardList for phenotypes
                const phenotypes = this.cardList.map(associationsCard => {
                    console.log(associationsCard)
                    const [ label, phenotypeValue ] = associationsCard.name.split(';')[1].split('|')[0].split(',');
                    if (label === 'phenotype') {
                        return phenotypeValue;
                    } else {
                        return null;
                    }
                }).filter(el => el !== null);
                this.filler = this.filler || {}; // necessary if we're filling for the first time
                this.phenotypes = phenotypes;
                this.filler.locus = this.cardList[0].name.split(';')[1].split('|')[1].split(',')[1];
                this.submitted = true;
            }
        },
        change($event, property) {
            this.filler = this.filler || {}; // necessary if we're filling for the first time
            this.filler = {
                ...this.filler,
                [property]: $event.target.value,
            };
            this.$forceUpdate();
        },
        fill(event) {
            const { added } = event;

            if (!!added) {
                this.filler = this.filler || {}; // necessary if we're filling for the first time

                const [source, query] = added.element.name.split(';');
                query.split('|').forEach(queryEl => {

                    const [prefix, value] = queryEl.split(',');

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

                });
                this.$forceUpdate();

                // submit if last fill left us completely successful (gets rid of an extra step)
                if (!!this.filler.phenotype && !!this.filler.locus) {
                    this.submitted = true;
                }

            }
        }
    },
    computed: {
        phenotypeArray() {
            console.log('phenotype array update')
            if (!!this.filler) {
                if (!!this.filler.phenotype) {
                    console.log('checking', this.filler.phenotype)
                    if (isString(this.filler.phenotype)) {
                        console.log('is string')
                        return [this.filler.phenotype];
                    } else if (isArray(this.filler.phenotype)) {
                        console.log('is array')
                        return this.filler.phenotype;
                    }
                }
            }
            return [];
        },
        full() {
            return !!this.filler && !!this.filler.phenotype && !!this.filler.locus;
        },
        dragName() {
            return `${'associations-merger'};${!!this.filler ? `phenotype,${this.filler.phenotype}|locus,${this.filler.locus}` : ``}`
        },
        dragPayload() {
            return {
                id: idCounter.getUniqueId(),
                name: this.dragName,
            }
        },
    },
    watch: {
        dragName(newName) {
            this.$emit('name-change', newName);
        }
    }
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
