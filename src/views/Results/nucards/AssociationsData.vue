<template>
        <div>
            <template>
                <div class="bioindex-concept-pellet phenotype">
                    Phenotype
                </div>
                <div class="bioindex-concept-pellet locus">
                    Locus
                </div>
                <h5 style="display:inline;margin-right:10px;">→</h5>
                <div class="bioindex-concept-pellet none">
                    Variant
                </div>
                <div style="display:block;float:right;">
                    <!-- <button :disabled="!!!filler" @click="filler = null; submitted = false;">Clear</button>&nbsp; -->
                    <!-- TODO: refactor to dropdown menu with duplicate card OR duplicate content -->
                    <button @click="$emit('duplicate-self', { name: dragName })">Duplicate</button>&nbsp;
                    <button @click="$emit('remove', { metadata, filler })">Remove</button>
                </div>
            </template>

            <template>
                <draggable
                    class="dragArea list-group"
                    :list="dragList"
                    :group="{ name: 'data',
                              pull: function(to, from) {
                                  // TODO: logic that
                                  return 'clone'
                              },
                              put: false }"
                    :clone="el => dragPayload">
                    <div class="list-group-item"
                        style="margin-bottom:10px;background-color:#efefef;"
                        v-for="(element) in dragList" :key="element.id">
                        <div>
                            <h3 v-if="submitted && filler" style="display:inline;">Associations</h3>&nbsp;
                            <h3 v-else style="display:inline;">Associations</h3>&nbsp;
                            <div style="display:block;float:right;">
                                Drag and Drop
                            </div>
                        </div>
                        <span v-if="submitted && filler" style="display:inline;">
                            {{filler | lineOfKeys}}
                        </span>
                    </div>
                </draggable>
            </template>

            <div v-if="submitted">
                <template>
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
                            <template v-if="filler">
                                <associations-table-wrapper
                                    :locus="filler.locus"
                                    :overlappingPhenotypes="overlappingPhenotypes"
                                    :phenotypeMap="$store.state.bioPortal.phenotypeMap"
                                    @broadcast="$emit('broadcast', { key: dragPayload, data: $event })"
                                ></associations-table-wrapper>
                            </template>
                        </div>

                    </draggable>
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
                                Locus
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
import { query } from "../../../utils/bioIndexUtils";
import lodash from "lodash";
export default Vue.component('associations-card', {
    props: ['phenotypes', 'locus', 'metadata', 'defaultSubmitted'],
    components: {
        draggable,
        AssociationsTableWrapper
    },
    data() {
        return {
            cardList: [],
            filler: null,
            nulllist: [],  // necessary evil
            dragList: [{ id: this.metadata.id, name: '' }], // another seemingly necessary evil
            submitted: false,  // flag that lets us defer/semaphore when the table ought be rendered (versus always rendering it on any possible combination of strings filling the table, even when user is not finished typing)
        }
    },
    created() {
        if (!!this.phenotypes && !!this.locus) {
            // filler should be null before this point
            this.filler = {};
            this.filler = {
                phenotype: this.phenotypes,
                locus: this.locus,
            }
            this.submitted = typeof this.defaultSubmitted !== 'undefined' ? this.defaultSubmitted : true;
        }
    },
    filters: {
        lineOfKeys(object) {
            let list = [];
            Object.entries(object).forEach(item => {
                const [key, value] = item;
                list.push(`${key}: ${value}`)
            })
            return list.join(', ');
        },
    },
    methods: {
        fillCard(event) {
            // only fill with cards that are actually association cards
            if (event.added.element.name.match(/^associations;/g)) {
                // TODO: bad and ugly. this whole part of the system of keeping track of combined cards needs to be rewritten
                this.cardList = this.cardList.concat(event.added.element);
                this.filler.phenotype = lodash.uniqBy([].concat(this.filler.phenotype).concat(this.cardList.map(card => card.name.split(';')[1].split('|')[0].split('!')[1])));

                // remove the associations table (ONLY MAKES SENSE WHEN THEY'RE BEING MERGED, *NOT* WHEN THEY'RE BEING REPRESENTED BY A VIZ)
                this.$emit('remove', {
                    targetElement: event.added.element
                });
            }

        },
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

                    const [prefix, value] = queryEl.split('!');

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
        full() {
            return !!this.filler && !!this.filler.phenotype && !!this.filler.locus;
        },
        dragName() {
            return `${'associations'};${!!this.filler ? `phenotype!${this.filler.phenotype}|locus!${this.filler.locus}` : ``}`
        },
        overlappingPhenotypes() {
            const phenotypeOrPhenotypes = this.dragName.split(';')[1].split('|')[0].split('!')[1];
            const maybePhenotypes = phenotypeOrPhenotypes.split(',');
            // if split is there it tokenizes into a list. if split is not there, it wraps the string in a list.
            // since we just want a list regardless of the size, return the split
            return maybePhenotypes;
        },
        dragPayload() {
            return {
                // revising all IDs to indexes might help eliminate the need to pass metdata
                id: this.metadata.id,
                name: this.dragName,
            }
        },
    },
    watch: {
        dragName(newName) {
            this.$emit('name-change', newName);
        },
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
