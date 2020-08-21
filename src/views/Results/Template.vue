<template>
    <div>
        <results-global-tooltip>
            <template></template>
            <template></template>
            <template></template>
        </results-global-tooltip>
        <!-- <h2>Bucket Prototype</h2> -->

        <!-- Visualization/Tool Cards [VTC] Take Arbitrary BioIndex Data and give arbitrary objects (BioIndex or otherwise) -->
        <!-- They can be "fulfilled" by a Data Card [DC] in two possible ways:
                * Representation. If a DC and a VTC share an input type and an output type (such as when they would use the same BioIndex call), the VTC takes the *input* of the DC as the input of the VTC
                    * e.g. a PheWAS plot (VTC) represent a PheWAS table (DC)
                * Composition. If the output type of a DC acts as the input type of a VTC, the VTC takes the *data* of the DC and uses it???
                    * (TODO: e.g. a PheWAS table [or a PheWAS plot] can compose with a GWAS plot?)
            A Visualization/Tool Card starts out unfulfilled. If you try to fulfill a VTC with a Data Card which doesn't share an input nor compose, it is left unfulfilled.
            (It is maybe possible for a VTC to be fulfilled without Data Cards?)
         -->
        <!-- <h6><em>Visualization/Tool Bucket</em></h6>
        <locuszoom-phewas-plot-card></locuszoom-phewas-plot-card>

        <br> -->

        <!-- Data Cards have 1:1 correspondence with BioIndex -->
        <!-- <h6><em>Data Bucket</em></h6>
        <phewas-associations-card></phewas-associations-card>

        <br> -->

        <h2>Dragging Prototype</h2>

        <div class="row">
            <div class="col-3">
                <h5>Data Buckets</h5>
                <draggable
                    class="dragArea list-group"
                    :list="list1"
                    :clone="clone"
                    :group="{ name: 'data', pull: 'clone', put: false }">
                    <!-- TODO: Element dispatch code goes here -->
                    <!-- TODO: This is bad because the template needs to know what cards it gets.
                                Arguably this could be refactored into a method that adds element to a service component (like we're doing with LZ) -->
                    <!-- TODO: Serializing the data into strings is a stupid hack that is working around draggable, need to rethink this -->
                    <div class="list-group-item" v-for="(element, idx) in list1" :key="element.id">
                        <select
                            v-if="element.name.split(';')[0] === 'set'"
                            @change="modifyAt($event, 'set', idx)">
                            <option v-for="op in ['intersection', 'union', 'symmetric-difference']" :key="op">
                                {{ op }}
                            </option>
                        </select>
                        <div v-if="element.name.split(';')[0] === 'bioindex-query'">
                            <select :name="`${'bioindex-query'}-type`" @input="modifyAt($event, 'bioindex-query', idx)">
                                <option v-for="type in ['associations', 'phewas-associations', 'gwas-associations', 'top-associations']" :key="type">
                                    {{ type }}
                                </option>
                            </select><br>
                            <!-- the arrow function representation is fake and just for illustration that the BioIndex should return the complete schema :) -->
                            {{schema.data.filter(el => el.index === element.name.split(';')[1])[0].schema}} → variant

                        </div>
                        <div v-if="element.name.split(';')[0] === 'bioindex-input'">
                            <bioindex-data-picker
                                :name="element.name"
                                :options="['variant','phenotype','locus']"
                                @modify="modifyAt($event, 'bioindex-input', idx)"
                            />
                        </div>
                    </div>

                </draggable>
            </div>

            <div class="col-6">
                <h5>Workspace</h5>
                <draggable
                    class="dragArea list-group"
                    :list="list3"
                    drag-class="ghost"
                    :group="{
                        name: 'dash',
                        put: ['data', 'viz'] // TODO: viz only? with data too?
                    }"
                    @change="log">
                    <div class="list-group-item" v-for="(element, idx) in list3" :key="element.id+idx">
                        <div v-if="element.name.split(';')[0] === 'set'">
                            <set-operation
                                :operation="element.name.split(';')[1]"
                                :options="list3"
                            ></set-operation>
                        </div>

                        <!-- TODO: Element dispatch code goes here -->
                        <!-- TODO: This is bad because the template needs to know what cards it gets.
                                   Arguably this could be refactored into a method that adds element to a service component (like we're doing with LZ) -->
                        <!-- TODO: Serializing the data into strings is a stupid hack that is working around draggable, need to rethink this -->
                        <locuszoom-phewas-plot-card
                            v-if="element.name.split(';')[0] === 'locuszoom-phewas-plot'"
                            :metadata="element"
                            @duplicate-self="copy"
                            @duplicate-type="copy"
                            @remove="removeAt(idx, $event)"
                        ></locuszoom-phewas-plot-card>

                        <locuszoom-gwas-plot-card
                            v-if="element.name.split(';')[0] === 'locuszoom-gwas-plot'"
                            :metadata="element"
                            @duplicate-self="copy"
                            @duplicate-type="copy"
                            @remove="removeAt(idx, $event)"
                        ></locuszoom-gwas-plot-card>

                        <!-- e.g. associations;phenotype,T2D|locus,slc30a8 -->
                        <div v-if="element.name.split(';')[0] === 'associations'">
                            <associations-card

                                v-if="element.name.split(';')[1].split('|')[0].split('!')[0] === 'phenotype' && element.name.split(';')[1].split('|')[1].split('!')[0] === 'locus' && !!element.name.split(';')[1].split('|')[0].split('!')[1] && !!element.name.split(';')[1].split('|')[1].split('!')[1]"
                                :phenotypes="element.name.split(';')[1].split('|')[0].split('!')[1]"
                                :locus="element.name.split(';')[1].split('|')[1].split('!')[1]"
                                :defaultSubmitted="false"
                                :metadata="element"
                                @duplicate-self="copy"
                                @remove="removeAt(idx, $event)"
                                @broadcast="$store.dispatch('saveResultsIntoContext', $event)"
                                @name-change="modifyNameAt($event, idx)"
                            ></associations-card>
                            <associations-card
                                v-else
                                :metadata="element"
                                :defaultSubmitted="false"
                                @duplicate-self="copy"
                                @remove="removeAt(idx, $event)"
                                @broadcast="$store.dispatch('saveResultsIntoContext', $event)"
                                @name-change="modifyNameAt($event, idx)"
                            ></associations-card>
                        </div>

                        <div v-if="element.name.split(';')[0] === 'associations-merger'">
                            <associations-merge-data-card
                                :options="list3.filter(item => item.name.match(/associations;/g))"
                                @duplicate-self="copy"
                                @remove="removeAt(idx, $event)"
                                @broadcast="$store.dispatch('saveResultsIntoContext', $event)"
                                @name-change="modifyNameAt($event, idx)"
                            ></associations-merge-data-card>
                        </div>


                        <div v-if="element.name.split(';')[0] === 'phewas-associations'">
                            <phewas-associations-card

                                v-if="element.name.split(';')[1].split('|')[0].split('!')[0] === 'varId' && !!element.name.split(';')[1].split('|')[0].split('!')[1]"
                                :varId="element.name.split(';')[1].split('|')[0].split('!')[1]"

                                :metadata="element"
                                @duplicate-self="copy"
                                @remove="removeAt(idx, $event)"
                            ></phewas-associations-card>
                            <phewas-associations-card
                                v-else
                                :metadata="element"
                                @duplicate-self="copy"
                                @remove="removeAt(idx, $event)"
                            ></phewas-associations-card>
                        </div>

                        <div v-if="element.name.split(';')[0] === 'gwas-associations'">
                            <phenotype-associations-card

                                v-if="element.name.split(';')[1].split('|')[0].split('!')[0] === 'phenotype' && !!element.name.split(';')[1].split('|')[0].split('!')[1]"
                                :phenotype="element.name.split(';')[1].split('|')[0].split('!')[1]"

                                :metadata="element"
                                @duplicate-self="copy"
                                @remove="removeAt(idx, $event)"
                            ></phenotype-associations-card>
                            <phenotype-associations-card
                                v-else
                                :metadata="element"
                                @duplicate-self="copy"
                                @remove="removeAt(idx, $event)"
                            ></phenotype-associations-card>
                        </div>


                        <div v-if="element.name.split(';')[0] === 'bioindex-query'">
                            <associations-card
                                v-if="element.name.split(';')[1] === 'associations'"
                                :metadata="element"
                                :defaultSubmitted="false"
                                @duplicate-self="copy"
                                @remove="removeAt(idx, $event)"
                                @broadcast="$store.dispatch('saveResultsIntoContext', $event)"
                                @name-change="modifyNameAt($event, idx)"
                            ></associations-card>

                            <phenotype-associations-card
                                v-if="element.name.split(';')[1] === 'gwas-associations'"
                                :metadata="element"
                                @duplicate-self="copy"
                                @remove="removeAt(idx, $event)"
                            ></phenotype-associations-card>

                            <phewas-associations-card
                                v-if="element.name.split(';')[1] === 'phewas-associations'"
                                :metadata="element"
                                @duplicate-self="copy"
                                @remove="removeAt(idx, $event)"
                            ></phewas-associations-card>

                        </div>

                        <div v-if="element.name.split(';')[0] === 'bioindex-input'">
                            <div class="list-group-item">
                                Bioindex Input<br>
                                {{element.name.split(';')[1].split('!')[0]}} {{element.name.split(';')[1].split('!')[1]}}<br>
                                TODO: show list of actions here
                            </div>
                        </div>

                        <div v-if="element.name.split(';')[0] === 'fill-tester'">
                            <fill-tester
                                @duplicate-self="copy"
                                @remove="removeAt(idx, $event)"
                            />
                        </div>

                    </div>

                    <div v-if="list3.length === 0"
                        slot="header"
                        class="btn-group list-group-item"
                        role="group"
                        aria-label="Basic example">
                        Drag Here
                    </div>
                </draggable>
            </div>

            <div class="col-3">
                <h5>Viz Buckets</h5>
                <draggable
                    class="dragArea list-group"
                    :list="list2"
                    :group="{ name: 'viz', pull: 'clone', put: false }">
                    <draggable class="list-group-item" v-for="element in list2" :key="element.id">
                    {{ element.name }}
                    </draggable>
                </draggable>
            </div>

        </div>

    </div>

</template>

<script>
import draggable from "vuedraggable";
import { query } from "../../utils/bioIndexUtils";
import { BIOINDEX_SCHEMA } from "./utils/resultsUtils"

import PheWASData from "./nucards/PheWASData";

import ResultsGlobalTooltip from "./navs/ResultsGlobalTooltip"

import PhenotypeAssociationsData from "./nucards/PhenotypeAssociationsData";
import AssociationsMergeData from "./nucards/AssociationsMergeData";
import AssociationsData from "./nucards/AssociationsData";
import FillTester from "./nucards/FillTester";
import SetOp from "./nucards/SetOp";

import PheWASViz from "./nucards/PheWASViz";
import GWASViz from "./nucards/GWASViz";

import BioIndexInputDataPicker from "./nucards/BioIndexInputDataPicker";
import store from "./store"
import idCounter from "@/utils/idCounter"
let idGlobal = 9;
export default {
  name: "custom-clone",
  display: "Custom Clone",
  order: 3,
  components: {
    draggable,
    ResultsGlobalTooltip
  },
  store,
  data() {
    return {
        schema: BIOINDEX_SCHEMA,
        list1: [
            // TODO: set intersections
            /*
             * Card Navigation Buttons
             *
             */
            // { name: `set;${['intersection', 'union', 'symmetric-difference'][0]}`, id: 1 },
            { name: `bioindex-query;${['associations', 'phewas-associations', 'gwas-associations', 'top-associations'][0]}`, id: 2 },
            // { name: "bioindex-input", id: 3 },
            // { name: `associations-merger`, id: 9 },
            // { name: 'phewas-associations;varId!2:27730940:T:C', id: 6 },
            // { name: 'gwas-associations;phenotype!T2D', id: 7 },
            // { name: 'associations;phenotype!T2D|locus!slc30a8', id: idCounter.getUniqueId() },
            // { name: 'associations;phenotype!HEIGHT|locus!slc30a8', id: idCounter.getUniqueId() }
        ],
        list2: [
            // { name: "fill-tester", id: 4 },
            { name: "locuszoom-phewas-plot", id: idCounter.getUniqueId() },
            { name: "locuszoom-gwas-plot", id: idCounter.getUniqueId() },
        ],
        list3: [],
        nullList: [],
        dataCardData: null,
        visualizationCard: {},
        bioIndexType: ['associations', 'phewas-associations', 'gwas-associations', 'top-associations'][0],
        bioIndexValue: null,
    };
  },
  computed: {
      phenotypes() {
          return Object.values(this.$store.state.bioPortal.phenotypeMap);
      }
  },
  methods: {
    modifyAt($event, element, idx) {
        this.list1[idx].name = `${element};${$event.target.value}`;
    },
    modifyNameAt(name, idx) {
        // console.log('modified name will be', name, 'for', idx, 'on', this.list3[idx]);
        this.list3[idx].name = name;
    },
    removeAt(idx, { targetElement }) {
        console.log('remove at from', idx, targetElement)
        // prioritize targetElement (even though it's an optional argument)
        if (!!targetElement) {
            console.log('removing with target element')
            this.list3 = this.list3.filter(element => element.id !== targetElement.id);
        } else {
            this.list3 = this.list3.filter((_, inc) => inc !== idx);
        }
    },
    // TODO: distinguish behavior for `copy` and `clone`
    copy(that) {
        this.list3.push({ name: that.name, id: idCounter.getUniqueId() });
    },
    clone(that) {
        const newId = idCounter.getUniqueId();
        return {
            id: newId,
            name: that.name
        };
    },
    log: function(evt) {
      window.console.log('logging', evt);
    },
    tap: function(evt) {
      window.console.log('tapping',evt);
    },
    cloneDog({ id, name }) {
        const newId = idGlobal++;
        if (!this.nullList[newId]) {
            this.nullList[newId] = [];
        };
        return {
            id: newId,
            name: name
        };
    }
  }
};
</script>
<style scoped>
.ghost {
  opacity: 0.4;
  background-color: lawngreen;
}

.list-group-item {
    margin-bottom: 5px;
}

</style>
