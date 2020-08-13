<template>
    <div>
        <h2>Bucket Prototype</h2>

        <!-- Visualization/Tool Cards [VTC] Take Arbitrary BioIndex Data and give arbitrary objects (BioIndex or otherwise) -->
        <!-- They can be "fulfilled" by a Data Card [DC] in two possible ways:
                * Representation. If a DC and a VTC share an input type and an output type (such as when they would use the same BioIndex call), the VTC takes the *input* of the DC as the input of the VTC
                    * e.g. a PheWAS plot (VTC) represent a PheWAS table (DC)
                * Composition. If the output type of a DC acts as the input type of a VTC, the VTC takes the *data* of the DC and uses it???
                    * (TODO: e.g. a PheWAS table [or a PheWAS plot] can compose with a GWAS plot?)
            A Visualization/Tool Card starts out unfulfilled. If you try to fulfill a VTC with a Data Card which doesn't share an input nor compose, it is left unfulfilled.
            (It is maybe possible for a VTC to be fulfilled without Data Cards?)
         -->
        <h6><em>Visualization/Tool Bucket</em></h6>
        <locuszoom-phewas-plot-card></locuszoom-phewas-plot-card>

        <br>

        <!-- Data Cards have 1:1 correspondence with BioIndex -->
        <h6><em>Data Bucket</em></h6>
        <phewas-associations-card></phewas-associations-card>

        <br>

        <h2>Dragging Prototype</h2>

        <div class="row">
            <div class="col-3">
                <h5>Draggable Data Buckets</h5>
                <draggable
                    class="dragArea list-group"
                    :list="list1"
                    :group="{ name: 'data', pull: 'clone', put: false }"
                    :clone="cloneDog"
                    @change="log"
                >
                    <!-- TODO: Element dispatch code goes here -->
                    <!-- TODO: This is bad because the template needs to know what cards it gets.
                                Arguably this could be refactored into a method that adds element to a service component (like we're doing with LZ) -->
                    <!-- TODO: Serializing the data into strings is a stupid hack that is working around draggable, need to rethink this -->
                    <div class="list-group-item" v-for="(element, idx) in list1" :key="element.id">
                        {{element.name}}
                        <div v-if="element.name.split(';')[0] === 'set'">
                            <select @change="modifyAt($event, element, idx)">
                                <option v-for="op in ['intersection', 'union', 'symmetric-difference']" :key="op">
                                    {{ op }}
                                </option>
                            </select>
                        </div>
                        <div v-if="element.name.split(';')[0] === 'bioindex-query'" >
                            <div class="list-group-item">
                                <select :name="`${'bioindex-query'}-type`" v-model="bioIndexType">
                                    <option v-for="type in ['phewas-associations', 'gwas-associations', 'top-associations', 'associations']" :key="type">
                                        {{ type }}
                                    </option>
                                </select>
                                <input :name="`${'bioindex-query'}-value`"
                                        v-model="bioIndexValue"
                                       :placeholder="schema.data.filter(el => el.index === bioIndexType)[0].schema"/>
                            </div>
                        </div>
                        <div v-if="element.name.split(';')[0] === 'bioindex-input'">
                            <div class="list-group-item">
                                <bioindex-data-picker
                                    :name="element.name.split(';')[0]"
                                    :options="['variant','phenotype','locus']"
                                    @modify="modifyAt($event, element, idx)"
                                />
                            </div>
                        </div>
                        <!-- <div v-if="element.name.split(';')[0] === 'bioindex-input'">
                            <select name="bioindex-input-type" @input="modifyAt($event, element, idx)">
                                <option v-for="type in ['phenotype', 'variant', 'locus']" :key="type">
                                    {{ type }}
                                </option>
                            </select>
                            <input name="bioindex-input-value" @input="modifyAt($event, element, idx)"/>
                        </div> -->
                    </div>

                </draggable>
            </div>

            <div class="col-6">
                <h5>Draggable Workspace</h5>
                <draggable
                    class="dragArea list-group"
                    :list="list3"
                    :group="{
                        name: 'dash',
                        put: ['data', 'viz'] // TODO: viz only? with data too?
                    }"
                    @change="log">

                    <div class="list-group-item" v-for="(element, idx) in list3" :key="element.id">

                        <!-- TODO: Element dispatch code goes here -->
                        <!-- TODO: This is bad because the template needs to know what cards it gets.
                                   Arguably this could be refactored into a method that adds element to a service component (like we're doing with LZ) -->
                        <!-- TODO: Serializing the data into strings is a stupid hack that is working around draggable, need to rethink this -->
                        <div v-if="element.name.split(';')[0] === 'locuszoom-phewas-plot'">
                            <locuszoom-phewas-plot-card
                                :metadata="element"
                                @duplicate-self="clone"
                                @duplicate-type="copy"
                                @remove="removeAt(idx)"
                            ></locuszoom-phewas-plot-card>
                        </div>

                        <div v-if="element.name.split(';')[0] === 'locuszoom-gwas-plot'">
                            <locuszoom-gwas-plot-card
                                :metadata="element"
                                @duplicate-self="clone"
                                @duplicate-type="copy"
                                @remove="removeAt(idx)"
                            ></locuszoom-gwas-plot-card>
                        </div>

                        <div v-if="element.name.split(';')[0] === 'phewas-associations'">
                            <phewas-associations-card
                                v-if="element.name.split(';')[1] === 'varId' && !!element.name.split(';')[2]"
                                :varId="element.name.split(';')[2]"
                                :metadata="element"
                                @duplicate-self="clone"
                                @duplicate-type="copy"
                                @remove="removeAt(idx)"
                            ></phewas-associations-card>
                            <phewas-associations-card
                                v-else
                                :metadata="element"
                                @duplicate-self="clone"
                                @duplicate-type="copy"
                                @remove="removeAt(idx)"
                            ></phewas-associations-card>
                        </div>

                        <div v-if="element.name.split(';')[0] === 'gwas-associations'">
                            <phenotype-associations-card
                                v-if="element.name.split(';')[1] === 'phenotype' && !!element.name.split(';')[2]"
                                :phenotype="element.name.split(';')[2]"
                                :metadata="element"
                                @duplicate-self="clone"
                                @duplicate-type="copy"
                                @remove="removeAt(idx)"
                            ></phenotype-associations-card>
                            <phenotype-associations-card
                                v-else
                                :metadata="element"
                                @duplicate-self="clone"
                                @duplicate-type="copy"
                                @remove="removeAt(idx)"
                            ></phenotype-associations-card>
                        </div>

                        <div v-if="element.name.split(';')[0] === 'fill-tester'">
                            <fill-tester
                                @duplicate-self="clone"
                                @duplicate-type="copy"
                                @remove="removeAt(idx)"
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
                <h5>Draggable Viz Buckets</h5>
                <draggable
                    class="dragArea list-group"
                    :list="list2"
                    :group="{ name: 'viz', pull: 'clone', put: false }"
                    :clone="cloneDog"
                    @change="log">
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

import PhenotypeAssociationsData from "./nucards/PhenotypeAssociationsData";
import FillTester from "./nucards/FillTester";

import PheWASViz from "./nucards/PheWASViz";
import GWASViz from "./nucards/GWASViz";

import BioIndexInputDataPicker from "./nucards/BioIndexInputDataPicker";

let idGlobal = 8;
export default {
  name: "custom-clone",
  display: "Custom Clone",
  order: 3,
  components: {
    draggable
  },
  data() {
    return {
        schema: BIOINDEX_SCHEMA,
        list1: [
            { name: "set", id: 1 },
            { name: "bioindex-query", id: 2 },
            { name: "bioindex-input", id: 3 },
            { name: 'phewas-associations;varId;2:27730940:T:C', id: 6 },
            { name: 'gwas-associations;phenotype;T2D', id: 7 }
        ],
        list2: [
            { name: "visualization 1", id: 1 },
            { name: "visualization 2", id: 2 },
            { name: "visualization 3", id: 3 },
            { name: "fill-tester", id: 4 },
            { name: "locuszoom-phewas-plot", id: 5 },
            { name: "locuszoom-gwas-plot", id: 6 },
        ],
        list3: [],
        nullList: [],
        dataCardData: null,
        visualizationCard: {},
        bioIndexType: ['phewas-associations', 'gwas-associations', 'top-associations'][0],
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
        console.log('modifyAt', $event, element, idx, );
        this.list1[idx].name = $event;
    },
    removeAt(idx) {
      this.list3 = this.list3.splice(0, idx).concat(this.list3.splice(idx + 1, this.list3.length))
    },
    copy(that) {
        // refactor to stack
        this.list3 = this.list3.concat({ ...that.metadata, id: idGlobal++ });
    },
    clone(that) {
    // refactor to stack
      this.list3 = this.list3.concat({ ...that.metadata, id: idGlobal++ });
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
</style>
